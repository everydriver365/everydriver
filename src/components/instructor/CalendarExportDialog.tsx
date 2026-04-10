import { useState } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { Download, FileText, Calendar, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarEvent, CalendarView } from '@/hooks/useInstructorCalendar';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CalendarExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: CalendarEvent[];
  currentDate: Date;
  view: CalendarView;
  instructorName?: string;
}

type ExportFormat = 'pdf' | 'ics';
type ExportRange = 'current' | 'week' | 'month' | 'all';

export function CalendarExportDialog({
  open,
  onOpenChange,
  events,
  currentDate,
  view,
  instructorName = 'Instructor',
}: CalendarExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [exportRange, setExportRange] = useState<ExportRange>('current');
  const [exporting, setExporting] = useState(false);

  const getDateRange = (range: ExportRange): { start: Date; end: Date; label: string } => {
    const today = new Date();
    switch (range) {
      case 'current':
        if (view === 'day') {
          return { start: currentDate, end: currentDate, label: format(currentDate, 'MMMM d, yyyy') };
        } else if (view === 'week') {
          const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
          const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
          return { start: weekStart, end: weekEnd, label: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}` };
        } else {
          const monthStart = startOfMonth(currentDate);
          const monthEnd = endOfMonth(currentDate);
          return { start: monthStart, end: monthEnd, label: format(currentDate, 'MMMM yyyy') };
        }
      case 'week':
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
        return { start: weekStart, end: weekEnd, label: 'This Week' };
      case 'month':
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);
        return { start: monthStart, end: monthEnd, label: 'This Month' };
      case 'all':
        // Get the earliest and latest event dates
        if (events.length === 0) {
          return { start: today, end: today, label: 'All Events' };
        }
        const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
        return { start: sorted[0].start, end: sorted[sorted.length - 1].end, label: 'All Events' };
    }
  };

  const filterEvents = (range: ExportRange): CalendarEvent[] => {
    const { start, end } = getDateRange(range);
    return events.filter(event => {
      const eventDate = event.start;
      return eventDate >= start && eventDate <= addDays(end, 1);
    }).sort((a, b) => a.start.getTime() - b.start.getTime());
  };

  const generatePDF = () => {
    const filteredEvents = filterEvents(exportRange);
    const { label } = getDateRange(exportRange);
    
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Schedule Export', 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`${instructorName}`, 14, 30);
    doc.text(`Period: ${label}`, 14, 36);
    doc.text(`Generated: ${format(new Date(), 'PPP p')}`, 14, 42);
    
    if (filteredEvents.length === 0) {
      doc.setFontSize(14);
      doc.setTextColor(150, 150, 150);
      doc.text('No events scheduled for this period.', 14, 60);
    } else {
      // Table data
      const tableData = filteredEvents.map(event => {
        const eventType = event.type === 'lesson' ? 'Lesson' : 
                         event.type === 'block' ? 'Block' : 'External';
        const status = event.type === 'lesson' && event.data?.payment_status === 'paid' ? 'Paid' : 
                      event.type === 'lesson' ? 'Unpaid' : '-';
        const location = event.data?.pickup_address || event.data?.pickup_location || '-';
        
        return [
          format(event.start, 'EEE, MMM d'),
          format(event.start, 'h:mm a'),
          format(event.end, 'h:mm a'),
          event.title,
          eventType,
          status,
          location.length > 30 ? location.substring(0, 30) + '...' : location,
        ];
      });

      autoTable(doc, {
        startY: 50,
        head: [['Date', 'Start', 'End', 'Title', 'Type', 'Status', 'Location']],
        body: tableData,
        theme: 'striped',
        headStyles: { 
          fillColor: [34, 197, 94],
          textColor: 255,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 20 },
          2: { cellWidth: 20 },
          3: { cellWidth: 35 },
          4: { cellWidth: 18 },
          5: { cellWidth: 18 },
          6: { cellWidth: 40 },
        },
      });

      // Summary
      const finalY = (doc as any).lastAutoTable?.finalY || 100;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Total events: ${filteredEvents.length}`, 14, finalY + 10);
      
      const lessons = filteredEvents.filter(e => e.type === 'lesson').length;
      const blocks = filteredEvents.filter(e => e.type === 'block').length;
      const external = filteredEvents.filter(e => e.type === 'external').length;
      doc.text(`Lessons: ${lessons} | Blocks: ${blocks} | External: ${external}`, 14, finalY + 16);
    }

    // Save
    const filename = `schedule-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    doc.save(filename);
    return filename;
  };

  const generateICS = () => {
    const filteredEvents = filterEvents(exportRange);
    
    // ICS file format
    const icsLines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Drive365//Calendar Export//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${instructorName}'s Schedule`,
    ];

    filteredEvents.forEach(event => {
      const uid = `${event.id}@drive365.app`;
      const dtstamp = format(new Date(), "yyyyMMdd'T'HHmmss'Z'");
      const dtstart = format(event.start, "yyyyMMdd'T'HHmmss");
      const dtend = format(event.end, "yyyyMMdd'T'HHmmss");
      
      let description = '';
      if (event.type === 'lesson') {
        description = `Type: Driving Lesson\\n`;
        if (event.data?.payment_status) {
          description += `Payment: ${event.data.payment_status}\\n`;
        }
        if (event.data?.pickup_address || event.data?.pickup_location) {
          description += `Pickup: ${event.data.pickup_address || event.data.pickup_location}`;
        }
      } else if (event.type === 'block') {
        description = `Type: ${event.data?.block_type || 'Blocked Time'}`;
        if (event.data?.notes) {
          description += `\\nNotes: ${event.data.notes}`;
        }
      }

      const location = event.data?.pickup_address || event.data?.pickup_location || '';

      icsLines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${dtstart}`,
        `DTEND:${dtend}`,
        `SUMMARY:${event.title.replace(/,/g, '\\,')}`,
        description ? `DESCRIPTION:${description}` : '',
        location ? `LOCATION:${location.replace(/,/g, '\\,')}` : '',
        'END:VEVENT'
      );
    });

    icsLines.push('END:VCALENDAR');

    // Filter out empty lines and join
    const icsContent = icsLines.filter(line => line).join('\r\n');
    
    // Create and download file
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = `schedule-${format(new Date(), 'yyyy-MM-dd')}.ics`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return filename;
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      let filename: string;
      if (exportFormat === 'pdf') {
        filename = generatePDF();
      } else {
        filename = generateICS();
      }
      toast.success(`Exported to ${filename}`);
      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export calendar');
    } finally {
      setExporting(false);
    }
  };

  const filteredCount = filterEvents(exportRange).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Calendar
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Export Format */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup
              value={exportFormat}
              onValueChange={(v) => setExportFormat(v as ExportFormat)}
              className="grid grid-cols-2 gap-3"
            >
              <div>
                <RadioGroupItem value="pdf" id="pdf" className="peer sr-only" />
                <Label
                  htmlFor="pdf"
                  className="flex flex-col items-center justify-between rounded-none border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <FileText className="h-6 w-6 mb-2" />
                  <span className="font-medium">PDF</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    Printable schedule
                  </span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="ics" id="ics" className="peer sr-only" />
                <Label
                  htmlFor="ics"
                  className="flex flex-col items-center justify-between rounded-none border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <Calendar className="h-6 w-6 mb-2" />
                  <span className="font-medium">ICS</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    Import to calendar apps
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <Label>Date Range</Label>
            <Select value={exportRange} onValueChange={(v) => setExportRange(v as ExportRange)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">
                  Current View ({getDateRange('current').label})
                </SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Loaded Events</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          <div className="p-3 bg-muted rounded-none">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{filteredCount}</span> events will be exported
            </div>
            {exportFormat === 'ics' && (
              <div className="text-xs text-muted-foreground mt-1">
                ICS files can be imported into Google Calendar, Apple Calendar, Outlook, and other calendar apps.
              </div>
            )}
            {exportFormat === 'pdf' && (
              <div className="text-xs text-muted-foreground mt-1">
                PDF includes a formatted table with all event details, perfect for printing.
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting || filteredCount === 0}>
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export {exportFormat.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
