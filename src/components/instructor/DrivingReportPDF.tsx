import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface RoadSegment {
  name: string;
  speedLimit: number | null;
  avgSpeed: number;
  maxSpeed: number;
  compliance: 'under' | 'at' | 'over';
}

interface DrivingEvent {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  location: string;
  speedAtEvent: number | null;
  gForce: number | null;
  notes: string | null;
  recordedAt: string;
}

interface RoutePoint {
  lat: number;
  lon: number;
  speed: number | null;
}

interface RouteReport {
  session: {
    id: string;
    pupilName: string;
    startedAt: string;
    endedAt: string;
    startLocation: string;
    endLocation: string;
  };
  stats: {
    totalPoints: number;
    distance: number;
    avgSpeed: number | null;
    maxSpeed: number | null;
    duration: number | null;
    speedingIncidents: number;
    roadsVisited: number;
    eventCount: number;
    harshBrakingCount: number;
    harshAccelerationCount: number;
    sharpTurnCount: number;
  };
  segments: RoadSegment[];
  events: DrivingEvent[];
  route?: RoutePoint[];
}

// Convert km/h to mph
const toMph = (kmh: number) => Math.round(kmh * 0.621371);
const toMiles = (km: number) => (km * 0.621371).toFixed(1);

// Format event type
const formatEventType = (type: string) => {
  const eventNames: Record<string, string> = {
    'harsh_brake': 'Harsh Braking',
    'harsh_acceleration': 'Harsh Acceleration',
    'sharp_turn': 'Sharp Turn',
    'speeding': 'Speeding',
    'smooth_stop': 'Smooth Stop',
    'good_acceleration': 'Good Acceleration',
    'hard_impact': 'Hard Impact',
    'smooth_cornering': 'Smooth Cornering'
  };
  return eventNames[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

// Format duration
const formatDuration = (minutes: number | null) => {
  if (!minutes) return 'N/A';
  if (minutes < 60) return `${minutes} mins`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

// Generate static map URL using OpenStreetMap static map service
const generateStaticMapUrl = (route: RoutePoint[], width: number, height: number): string => {
  if (!route || route.length < 2) return '';
  
  // Sample route to reduce URL length (max ~50 points)
  const maxPoints = 50;
  const step = Math.max(1, Math.floor(route.length / maxPoints));
  const sampledRoute = route.filter((_, i) => i % step === 0 || i === route.length - 1);
  
  // Create polyline path for staticmaps.openrouteservice.org alternative
  // Using geoapify static maps API (free tier available)
  const pathCoords = sampledRoute.map(p => `${p.lon},${p.lat}`).join('|');
  
  // Calculate bounds for centering
  const lats = sampledRoute.map(p => p.lat);
  const lons = sampledRoute.map(p => p.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const centerLat = (minLat + maxLat) / 2;
  const centerLon = (minLon + maxLon) / 2;
  
  // Calculate zoom level based on bounds
  const latDiff = maxLat - minLat;
  const lonDiff = maxLon - minLon;
  const maxDiff = Math.max(latDiff, lonDiff);
  let zoom = 14;
  if (maxDiff > 0.1) zoom = 12;
  if (maxDiff > 0.2) zoom = 11;
  if (maxDiff > 0.5) zoom = 10;
  if (maxDiff > 1) zoom = 9;
  
  // Use OpenStreetMap static map with markers for start/end
  const startPoint = sampledRoute[0];
  const endPoint = sampledRoute[sampledRoute.length - 1];
  
  // Build URL for staticmap.openstreetmap.de
  const baseUrl = 'https://staticmap.openstreetmap.de/staticmap.php';
  const params = new URLSearchParams({
    center: `${centerLat},${centerLon}`,
    zoom: zoom.toString(),
    size: `${width}x${height}`,
    maptype: 'osmarenderer',
    markers: `${startPoint.lat},${startPoint.lon},lightgreen|${endPoint.lat},${endPoint.lon},lightred`
  });
  
  return `${baseUrl}?${params.toString()}`;
};

// Fetch image as base64
const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

export async function generateDrivingReportPDF(
  report: RouteReport,
  instructorName?: string
): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;
  
  // Colors
  const primaryColor: [number, number, number] = [37, 99, 235]; // Blue
  const successColor: [number, number, number] = [34, 197, 94]; // Green
  const warningColor: [number, number, number] = [245, 158, 11]; // Amber
  const dangerColor: [number, number, number] = [239, 68, 68]; // Red
  const textColor: [number, number, number] = [31, 41, 55]; // Dark gray
  const mutedColor: [number, number, number] = [107, 114, 128]; // Gray
  
  // Calculate compliance score
  const complianceScore = Math.round(
    (report.segments.filter(s => s.compliance !== 'over').length / report.segments.length) * 100
  );
  
  // Header with gradient bar
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Driving Lesson Report', 15, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, pageWidth - 15, 25, { align: 'right' });
  
  yPos = 55;
  
  // Session Info Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, yPos - 5, pageWidth - 30, 45, 3, 3, 'F');
  
  doc.setTextColor(...textColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(report.session.pupilName, 20, yPos + 5);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  doc.text(new Date(report.session.startedAt).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }), 20, yPos + 15);
  
  // Route info
  doc.setTextColor(...textColor);
  doc.text(`From: ${report.session.startLocation}`, 20, yPos + 28);
  doc.text(`To: ${report.session.endLocation}`, 20, yPos + 36);
  
  if (instructorName) {
    doc.setTextColor(...mutedColor);
    doc.text(`Instructor: ${instructorName}`, pageWidth - 20, yPos + 5, { align: 'right' });
  }
  
  yPos += 55;
  
  // Static Map Image
  if (report.route && report.route.length >= 2) {
    const mapUrl = generateStaticMapUrl(report.route, 600, 300);
    if (mapUrl) {
      const mapImage = await fetchImageAsBase64(mapUrl);
      if (mapImage) {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(15, yPos, pageWidth - 30, 70, 3, 3, 'F');
        
        try {
          doc.addImage(mapImage, 'PNG', 17, yPos + 2, pageWidth - 34, 66);
        } catch {
          // If image fails, show placeholder text
          doc.setTextColor(...mutedColor);
          doc.setFontSize(10);
          doc.text('Route map unavailable', pageWidth / 2, yPos + 35, { align: 'center' });
        }
        
        yPos += 78;
      }
    }
  }
  
  // Stats Grid
  const statsBoxWidth = (pageWidth - 40) / 4;
  const statsData = [
    { label: 'Distance', value: `${toMiles(report.stats.distance || 0)} mi`, color: primaryColor },
    { label: 'Duration', value: formatDuration(report.stats.duration), color: primaryColor },
    { label: 'Avg Speed', value: `${report.stats.avgSpeed ? toMph(report.stats.avgSpeed) : 'N/A'} mph`, color: primaryColor },
    { label: 'Compliance', value: `${complianceScore}%`, color: complianceScore >= 80 ? successColor : complianceScore >= 50 ? warningColor : dangerColor }
  ];
  
  statsData.forEach((stat, i) => {
    const x = 15 + (i * statsBoxWidth) + (i * 5);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, yPos, statsBoxWidth, 35, 2, 2, 'F');
    
    doc.setTextColor(...mutedColor);
    doc.setFontSize(8);
    doc.text(stat.label.toUpperCase(), x + statsBoxWidth / 2, yPos + 10, { align: 'center' });
    
    doc.setTextColor(...stat.color);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(stat.value, x + statsBoxWidth / 2, yPos + 26, { align: 'center' });
  });
  
  yPos += 50;
  
  // Road Segments Table
  doc.setTextColor(...textColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Road Segments', 15, yPos);
  yPos += 8;
  
  const segmentRows = report.segments.map(segment => [
    segment.name,
    segment.speedLimit ? `${toMph(segment.speedLimit)} mph` : 'Unknown',
    `${toMph(segment.avgSpeed)} mph`,
    `${toMph(segment.maxSpeed)} mph`,
    segment.compliance === 'over' ? 'Over' : segment.compliance === 'at' ? 'At Limit' : 'Under'
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['Road Name', 'Limit', 'Avg Speed', 'Max Speed', 'Status']],
    body: segmentRows,
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: textColor
    },
    columnStyles: {
      0: { cellWidth: 60 },
      4: { 
        cellWidth: 25,
        halign: 'center'
      }
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const status = data.cell.raw as string;
        if (status === 'Over') {
          data.cell.styles.textColor = dangerColor;
          data.cell.styles.fontStyle = 'bold';
        } else if (status === 'At Limit') {
          data.cell.styles.textColor = warningColor;
        } else {
          data.cell.styles.textColor = successColor;
        }
      }
    },
    margin: { left: 15, right: 15 }
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  // Check if we need a new page for events
  if (yPos > 200 && report.events.length > 0) {
    doc.addPage();
    yPos = 20;
  }
  
  // Driving Events Table
  if (report.events.length > 0) {
    doc.setTextColor(...textColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Driving Events', 15, yPos);
    yPos += 8;
    
    const eventRows = report.events.map(event => [
      formatEventType(event.type),
      event.location,
      event.speedAtEvent ? `${toMph(event.speedAtEvent)} mph` : '-',
      event.gForce ? `${event.gForce.toFixed(2)}g` : '-',
      event.severity.charAt(0).toUpperCase() + event.severity.slice(1)
    ]);
    
    autoTable(doc, {
      startY: yPos,
      head: [['Event', 'Location', 'Speed', 'G-Force', 'Severity']],
      body: eventRows,
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 8,
        textColor: textColor
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 55 },
        4: { 
          cellWidth: 20,
          halign: 'center'
        }
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 4) {
          const severity = (data.cell.raw as string).toLowerCase();
          if (severity === 'high') {
            data.cell.styles.textColor = dangerColor;
            data.cell.styles.fontStyle = 'bold';
          } else if (severity === 'medium') {
            data.cell.styles.textColor = warningColor;
          }
        }
        // Highlight positive events
        if (data.section === 'body' && data.column.index === 0) {
          const eventType = data.cell.raw as string;
          if (['Smooth Stop', 'Good Acceleration', 'Smooth Cornering'].includes(eventType)) {
            data.cell.styles.textColor = successColor;
          }
        }
      },
      margin: { left: 15, right: 15 }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }
  
  // Summary Stats
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setTextColor(...textColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Session Summary', 15, yPos);
  yPos += 10;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const summaryData = [
    ['GPS Points Recorded', report.stats.totalPoints.toString()],
    ['Roads Visited', report.stats.roadsVisited.toString()],
    ['Total Events', report.stats.eventCount.toString()],
    ['Harsh Braking', report.stats.harshBrakingCount.toString()],
    ['Harsh Acceleration', report.stats.harshAccelerationCount.toString()],
    ['Sharp Turns', report.stats.sharpTurnCount.toString()],
    ['Speeding Incidents', report.stats.speedingIncidents.toString()],
    ['Max Speed', report.stats.maxSpeed ? `${toMph(report.stats.maxSpeed)} mph` : 'N/A']
  ];
  
  summaryData.forEach(([label, value], i) => {
    const x = i % 2 === 0 ? 15 : pageWidth / 2 + 5;
    const y = yPos + Math.floor(i / 2) * 12;
    
    doc.setTextColor(...mutedColor);
    doc.text(label + ':', x, y);
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'bold');
    doc.text(value, x + 50, y);
    doc.setFont('helvetica', 'normal');
  });
  
  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setTextColor(...mutedColor);
  doc.setFontSize(8);
  doc.text('Generated by EveryDriver • www.everydriver.co.uk', pageWidth / 2, footerY, { align: 'center' });
  
  // Download PDF
  const fileName = `driving-report-${report.session.pupilName.replace(/\s+/g, '-').toLowerCase()}-${
    new Date(report.session.startedAt).toISOString().split('T')[0]
  }.pdf`;
  
  doc.save(fileName);
}
