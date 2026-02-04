import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Thresholds for calculated braking detection (m/s²)
const BRAKING_THRESHOLDS = {
  LOW: 3.5,
  MEDIUM: 5.0,
  HIGH: 7.0,
};

// Thresholds for acceleration detection (m/s²)
const ACCELERATION_THRESHOLDS = {
  LOW: 2.5,
  MEDIUM: 4.0,
  HIGH: 6.0,
};

// Simple in-memory cache for speed limits and road names (grid-based)
const speedLimitCache = new Map<string, { limit: number | null; roadName: string | null; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

interface GPSDevice {
  id: string;
  instructor_id: string;
  device_identifier: string;
  device_name?: string | null;
  current_pupil_id: string | null;
  current_session_id: string | null;
  last_speed_kmh: number | null;
  last_latitude: number | null;
  last_longitude: number | null;
  last_seen_at: string | null;
  last_gpsgate_track_time: string | null;
  vehicle_id: string | null;
  last_ignition_status: boolean | null;
  gpsgate_user_id: number | null;
  gpsgate_odometer_m: number | null;
  gpsgate_engine_hours_s: number | null;
  daily_start_odometer_m: number | null;
  daily_start_date: string | null;
}

interface GPSGateAccumulator {
  AccumulatorId: number;
  Name: string;
  Value: number;
  Unit: string;
}

interface InstructorGPS {
  id: string;
  gpsgate_user_id: number | null;
  gpsgate_username: string | null;
}

interface VehicleSecuritySettings {
  id: string;
  vehicle_id: string;
  instructor_id: string;
  security_enabled: boolean;
  movement_threshold_kmh: number;
  alert_cooldown_minutes: number;
  notify_on_ignition: boolean;
}

interface GPSGateUser {
  Id: number;
  Username: string;
  Name: string;
  Description: string;
}

function normalizeGpsGateUser(raw: any): GPSGateUser | null {
  const idRaw = raw?.Id ?? raw?.id;
  const usernameRaw = raw?.Username ?? raw?.username;
  const nameRaw = raw?.Name ?? raw?.name;
  const descRaw = raw?.Description ?? raw?.description;

  const id = typeof idRaw === "number" ? idRaw : Number.parseInt(String(idRaw ?? ""), 10);
  if (!Number.isFinite(id)) return null;

  return {
    Id: id,
    Username: String(usernameRaw ?? ""),
    Name: String(nameRaw ?? ""),
    Description: String(descRaw ?? ""),
  };
}

function normalizeText(v: unknown): string {
  return String(v ?? "").trim().toLowerCase();
}

function digitsOnly(v: unknown): string {
  return String(v ?? "").replace(/\D+/g, "");
}

function resolveGpsGateUserIdForDevice(
  deviceIdentifier: string,
  explicitUserId: number | null,
  users: GPSGateUser[],
  usernameToUserId: Map<string, number>
): { userId: number | null; reason: string } {
  if (explicitUserId) return { userId: explicitUserId, reason: "explicit_gpsgate_user_id" };

  const identifier = normalizeText(deviceIdentifier);
  const identifierDigits = digitsOnly(deviceIdentifier);

  // 1) Exact username match (case-insensitive)
  const byUsername = usernameToUserId.get(identifier);
  if (byUsername) return { userId: byUsername, reason: "username_exact" };

  // 2) Exact digits match against username digits (helps when usernames embed IMEI)
  if (identifierDigits.length >= 8) {
    const matches = users.filter((u) => digitsOnly(u.Username) === identifierDigits);
    if (matches.length === 1) return { userId: matches[0].Id, reason: "username_digits_exact" };
    if (matches.length > 1) return { userId: null, reason: "ambiguous_username_digits" };
  }

  // 3) Substring match in username/name/description
  const matches = users.filter((u) => {
    const uUsername = normalizeText(u.Username);
    const uName = normalizeText(u.Name);
    const uDesc = normalizeText(u.Description);

    if (identifier && (uUsername.includes(identifier) || uName.includes(identifier) || uDesc.includes(identifier))) {
      return true;
    }

    // Also try digits substring matches
    const uDigits = digitsOnly(`${u.Username} ${u.Name} ${u.Description}`);
    return identifierDigits.length >= 8 && uDigits.includes(identifierDigits);
  });

  if (matches.length === 1) return { userId: matches[0].Id, reason: "substring_match" };
  if (matches.length > 1) return { userId: null, reason: "ambiguous_substring_match" };
  return { userId: null, reason: "no_match" };
}

// GPSgate API response can have different field names - we normalize them
interface GPSGateTrackPoint {
  // Time fields (various casings from /status and /tracks endpoints)
  Time?: string;
  time?: string;
  Timestamp?: string;
  timestamp?: string;
  utc?: string;
  Utc?: string;
  serverUtc?: string;
  ServerUtc?: string;
  // Direct position fields (flat format)
  Lat?: number;
  lat?: number;
  Latitude?: number;
  latitude?: number;
  Lng?: number;
  lng?: number;
  Lon?: number;
  lon?: number;
  Longitude?: number;
  longitude?: number;
  // Nested position (GPSgate Cloud format - both casings)
  position?: { 
    latitude?: number; 
    longitude?: number; 
    altitude?: number;
    Lat?: number; 
    Lng?: number; 
    lat?: number; 
    lng?: number;
    Latitude?: number;
    Longitude?: number;
  };
  Position?: { 
    Lat?: number; 
    Lng?: number; 
    lat?: number; 
    lng?: number;
    Latitude?: number;
    latitude?: number;
    Longitude?: number;
    longitude?: number;
  };
  // Direct speed fields
  Speed?: number;
  speed?: number;
  // Nested velocity (GPSgate Cloud format - both casings)
  velocity?: {
    groundSpeed?: number;
    GroundSpeed?: number;
    heading?: number;
    Heading?: number;
  };
  Velocity?: {
    groundSpeed?: number;
    GroundSpeed?: number;
    heading?: number;
    Heading?: number;
  };
  // Heading fields
  Heading?: number;
  heading?: number;
  Course?: number;
  course?: number;
  // Altitude
  Altitude?: number;
  altitude?: number;
  // Telemetry - direct
  Ignition?: boolean;
  ignition?: boolean;
  Battery?: number;
  battery?: number;
  // Nested variables (GPSgate Cloud format - both casings)
  variables?: {
    batteryLevel?: number;
    BatteryLevel?: number;
    speed?: number;
    Speed?: number;
    accuracy?: number;
    Accuracy?: number;
    charging?: boolean;
  };
  Variables?: {
    batteryLevel?: number;
    BatteryLevel?: number;
    speed?: number;
    Speed?: number;
    accuracy?: number;
    Accuracy?: number;
    charging?: boolean;
  };
  // Allow any additional fields for debugging
  [key: string]: unknown;
}

// Helper to extract position from track point (handles multiple field formats)
function extractPosition(track: GPSGateTrackPoint): { lat: number | null; lng: number | null } {
  let lat: number | null = null;
  let lng: number | null = null;

  // 1. Try nested position object first (GPSgate Cloud format: position.latitude/longitude)
  if (track.position) {
    if (typeof track.position.latitude === 'number' && isFinite(track.position.latitude)) lat = track.position.latitude;
    else if (typeof track.position.Lat === 'number' && isFinite(track.position.Lat)) lat = track.position.Lat;
    else if (typeof track.position.lat === 'number' && isFinite(track.position.lat)) lat = track.position.lat;
    
    if (typeof track.position.longitude === 'number' && isFinite(track.position.longitude)) lng = track.position.longitude;
    else if (typeof track.position.Lng === 'number' && isFinite(track.position.Lng)) lng = track.position.Lng;
    else if (typeof track.position.lng === 'number' && isFinite(track.position.lng)) lng = track.position.lng;
    
    if (lat !== null && lng !== null) return { lat, lng };
  }
  
  // 2. Try Position (capitalized) - handle multiple inner formats
  if (track.Position) {
    if (typeof track.Position.Lat === 'number' && isFinite(track.Position.Lat)) lat = track.Position.Lat;
    else if (typeof track.Position.lat === 'number' && isFinite(track.Position.lat)) lat = track.Position.lat;
    else if (typeof track.Position.Latitude === 'number' && isFinite(track.Position.Latitude)) lat = track.Position.Latitude;
    else if (typeof track.Position.latitude === 'number' && isFinite(track.Position.latitude)) lat = track.Position.latitude;
    
    if (typeof track.Position.Lng === 'number' && isFinite(track.Position.Lng)) lng = track.Position.Lng;
    else if (typeof track.Position.lng === 'number' && isFinite(track.Position.lng)) lng = track.Position.lng;
    else if (typeof track.Position.Longitude === 'number' && isFinite(track.Position.Longitude)) lng = track.Position.Longitude;
    else if (typeof track.Position.longitude === 'number' && isFinite(track.Position.longitude)) lng = track.Position.longitude;
    
    if (lat !== null && lng !== null) return { lat, lng };
  }

  // 3. Try direct fields (various casings)
  if (typeof track.Lat === 'number' && isFinite(track.Lat)) lat = track.Lat;
  else if (typeof track.lat === 'number' && isFinite(track.lat)) lat = track.lat;
  else if (typeof track.Latitude === 'number' && isFinite(track.Latitude)) lat = track.Latitude;
  else if (typeof track.latitude === 'number' && isFinite(track.latitude)) lat = track.latitude;

  if (typeof track.Lng === 'number' && isFinite(track.Lng)) lng = track.Lng;
  else if (typeof track.lng === 'number' && isFinite(track.lng)) lng = track.lng;
  else if (typeof track.Lon === 'number' && isFinite(track.Lon)) lng = track.Lon;
  else if (typeof track.lon === 'number' && isFinite(track.lon)) lng = track.lon;
  else if (typeof track.Longitude === 'number' && isFinite(track.Longitude)) lng = track.Longitude;
  else if (typeof track.longitude === 'number' && isFinite(track.longitude)) lng = track.longitude;

  return { lat, lng };
}

// Helper to extract speed from track point
// GPSgate API returns speed in m/s, we convert to km/h
function extractSpeed(track: GPSGateTrackPoint): number {
  const MPS_TO_KMH = 3.6; // Conversion factor: m/s to km/h
  
  let speedMps = 0;
  
  // 1. Try nested velocity.groundSpeed (GPSgate Cloud format) - both casings
  if (track.velocity) {
    if (typeof track.velocity.groundSpeed === 'number' && isFinite(track.velocity.groundSpeed)) {
      speedMps = track.velocity.groundSpeed;
    } else if (typeof track.velocity.GroundSpeed === 'number' && isFinite(track.velocity.GroundSpeed)) {
      speedMps = track.velocity.GroundSpeed;
    }
  }
  // 2. Try Velocity (capitalized)
  else if (track.Velocity && typeof track.Velocity === 'object') {
    const vel = track.Velocity as { groundSpeed?: number; GroundSpeed?: number };
    if (typeof vel.groundSpeed === 'number' && isFinite(vel.groundSpeed)) {
      speedMps = vel.groundSpeed;
    } else if (typeof vel.GroundSpeed === 'number' && isFinite(vel.GroundSpeed)) {
      speedMps = vel.GroundSpeed;
    }
  }
  // 3. Try nested variables.speed - both casings
  else if (track.variables) {
    if (typeof track.variables.speed === 'number' && isFinite(track.variables.speed)) {
      speedMps = track.variables.speed;
    } else if (typeof track.variables.Speed === 'number' && isFinite(track.variables.Speed)) {
      speedMps = track.variables.Speed;
    }
  }
  // 4. Try Variables (capitalized)
  else if (track.Variables) {
    if (typeof track.Variables.speed === 'number' && isFinite(track.Variables.speed)) {
      speedMps = track.Variables.speed;
    } else if (typeof track.Variables.Speed === 'number' && isFinite(track.Variables.Speed)) {
      speedMps = track.Variables.Speed;
    }
  }
  // 5. Try direct fields
  else if (typeof track.Speed === 'number' && isFinite(track.Speed)) {
    speedMps = track.Speed;
  }
  else if (typeof track.speed === 'number' && isFinite(track.speed)) {
    speedMps = track.speed;
  }
  
  // Convert m/s to km/h
  return speedMps * MPS_TO_KMH;
}

// Helper to extract heading from track point
function extractHeading(track: GPSGateTrackPoint): number {
  // 1. Try nested velocity.heading (GPSgate Cloud format) - both casings
  if (track.velocity) {
    if (typeof track.velocity.heading === 'number' && isFinite(track.velocity.heading)) {
      return track.velocity.heading;
    }
    if (typeof track.velocity.Heading === 'number' && isFinite(track.velocity.Heading)) {
      return track.velocity.Heading;
    }
  }
  // 2. Try Velocity (capitalized)
  if (track.Velocity && typeof track.Velocity === 'object') {
    const vel = track.Velocity as { heading?: number; Heading?: number };
    if (typeof vel.heading === 'number' && isFinite(vel.heading)) {
      return vel.heading;
    }
    if (typeof vel.Heading === 'number' && isFinite(vel.Heading)) {
      return vel.Heading;
    }
  }
  // 3. Try direct fields
  if (typeof track.Heading === 'number' && isFinite(track.Heading)) return track.Heading;
  if (typeof track.heading === 'number' && isFinite(track.heading)) return track.heading;
  if (typeof track.Course === 'number' && isFinite(track.Course)) return track.Course;
  if (typeof track.course === 'number' && isFinite(track.course)) return track.course;
  return 0;
}

// Helper to extract time from track point
function extractTime(track: GPSGateTrackPoint): string | null {
  const anyTrack = track as any;
  // 1. Try utc (GPSgate Cloud format) - both casings
  if (track.utc) return track.utc;
  if (track.Utc) return track.Utc;
  if (track.serverUtc) return track.serverUtc;
  if (track.ServerUtc) return track.ServerUtc;
  // 1b. Common variants on other endpoints (e.g. Users/TripInfos)
  if (anyTrack.LastPositionUtc) return String(anyTrack.LastPositionUtc);
  if (anyTrack.lastPositionUtc) return String(anyTrack.lastPositionUtc);
  if (anyTrack.LastUtc) return String(anyTrack.LastUtc);
  if (anyTrack.lastUtc) return String(anyTrack.lastUtc);
  if (anyTrack.EndUtc) return String(anyTrack.EndUtc);
  if (anyTrack.endUtc) return String(anyTrack.endUtc);
  if (anyTrack.StartUtc) return String(anyTrack.StartUtc);
  if (anyTrack.startUtc) return String(anyTrack.startUtc);
  // 2. Try direct fields
  if (track.Time) return track.Time;
  if (track.time) return track.time;
  if (track.Timestamp) return track.Timestamp;
  if (track.timestamp) return track.timestamp;
  return null;
}

// Helper to extract altitude from track point
function extractAltitude(track: GPSGateTrackPoint): number {
  // 1. Try nested position.altitude (GPSgate Cloud format)
  if (track.position && typeof track.position.altitude === 'number' && isFinite(track.position.altitude)) {
    return track.position.altitude;
  }
  // 2. Try direct fields
  if (typeof track.Altitude === 'number' && isFinite(track.Altitude)) return track.Altitude;
  if (typeof track.altitude === 'number' && isFinite(track.altitude)) return track.altitude;
  return 0;
}

// Helper to extract battery from track point
function extractBattery(track: GPSGateTrackPoint): number | null {
  // 1. Try nested variables.batteryLevel (GPSgate Cloud format) - both casings
  if (track.variables) {
    if (typeof track.variables.batteryLevel === 'number' && isFinite(track.variables.batteryLevel)) {
      return Math.round(track.variables.batteryLevel);
    }
    if (typeof track.variables.BatteryLevel === 'number' && isFinite(track.variables.BatteryLevel)) {
      return Math.round(track.variables.BatteryLevel);
    }
  }
  // 2. Try Variables (capitalized)
  if (track.Variables) {
    if (typeof track.Variables.batteryLevel === 'number' && isFinite(track.Variables.batteryLevel)) {
      return Math.round(track.Variables.batteryLevel);
    }
    if (typeof track.Variables.BatteryLevel === 'number' && isFinite(track.Variables.BatteryLevel)) {
      return Math.round(track.Variables.BatteryLevel);
    }
  }
  // 3. Try direct fields
  if (typeof track.Battery === 'number' && isFinite(track.Battery)) return Math.round(track.Battery);
  if (typeof track.battery === 'number' && isFinite(track.battery)) return Math.round(track.battery);
  return null;
}

// Calculate distance between two points in meters (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Generate grid key for caching (approximately 50m grid)
function getGridKey(lat: number, lon: number): string {
  const latGrid = Math.round(lat * 2000) / 2000;
  const lonGrid = Math.round(lon * 3000) / 3000;
  return `${latGrid},${lonGrid}`;
}

// Fetch road name from Mapbox Geocoding API
async function getRoadName(lat: number, lon: number, mapboxToken: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${mapboxToken}&types=address,poi&limit=1`,
      { signal: AbortSignal.timeout(3000) }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const feature = data.features?.[0];
    
    if (feature) {
      return feature.text || feature.place_name?.split(',')[0] || null;
    }
    
    return null;
  } catch {
    return null;
  }
}

// Fetch speed limit from OSM Overpass API
async function getSpeedLimitFromOSM(lat: number, lon: number): Promise<number | null> {
  try {
    const radius = 30;
    const query = `
      [out:json][timeout:5];
      way(around:${radius},${lat},${lon})["highway"]["maxspeed"];
      out tags;
    `;
    
    const response = await fetch(
      `https://overpass-api.de/api/interpreter`,
      {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: AbortSignal.timeout(5000)
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const way = data.elements?.[0];
    
    if (way?.tags?.maxspeed) {
      const maxspeed = way.tags.maxspeed;
      const match = maxspeed.match(/(\d+)/);
      if (match) {
        let speed = parseInt(match[1], 10);
        if (maxspeed.toLowerCase().includes('mph')) {
          speed = Math.round(speed * 1.60934);
        }
        return speed;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

// Fetch speed limit AND road name
async function getRoadInfo(lat: number, lon: number): Promise<{ speedLimit: number | null; roadName: string | null }> {
  const gridKey = getGridKey(lat, lon);
  
  const cached = speedLimitCache.get(gridKey);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
    return { speedLimit: cached.limit, roadName: cached.roadName };
  }
  
  const MAPBOX_TOKEN = Deno.env.get("MAPBOX_TOKEN");
  
  try {
    const [roadName, speedLimit] = await Promise.all([
      MAPBOX_TOKEN ? getRoadName(lat, lon, MAPBOX_TOKEN) : Promise.resolve(null),
      getSpeedLimitFromOSM(lat, lon)
    ]);
    
    speedLimitCache.set(gridKey, { limit: speedLimit, roadName, timestamp: Date.now() });
    
    return { speedLimit, roadName };
  } catch {
    if (cached) {
      return { speedLimit: cached.limit, roadName: cached.roadName };
    }
    speedLimitCache.set(gridKey, { limit: null, roadName: null, timestamp: Date.now() });
    return { speedLimit: null, roadName: null };
  }
}

// Check if instructor has any lessons scheduled NOW (with buffer)
async function hasScheduledLessonNow(supabase: any, instructorId: string): Promise<boolean> {
  const now = new Date();
  const bufferMinutes = 15;

  const checkFrom = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  const checkTo = new Date(now.getTime() + bufferMinutes * 60 * 1000);

  const { data: lessons, error } = await supabase
    .from("scheduled_lessons")
    .select("id, start_time, duration_minutes, status")
    .eq("instructor_id", instructorId)
    .gte("start_time", checkFrom.toISOString())
    .lte("start_time", checkTo.toISOString())
    .in("status", ["scheduled", "confirmed"]);

  if (error || !lessons) return false;

  for (const lesson of lessons) {
    const lessonStart = new Date(lesson.start_time);
    const lessonEnd = new Date(lessonStart.getTime() + (lesson.duration_minutes || 60) * 60 * 1000);

    const bufferedStart = new Date(lessonStart.getTime() - bufferMinutes * 60 * 1000);
    const bufferedEnd = new Date(lessonEnd.getTime() + bufferMinutes * 60 * 1000);

    if (now >= bufferedStart && now <= bufferedEnd) {
      return true;
    }
  }

  return false;
}

// Check if security alert should be triggered
async function checkSecurityAlert(
  supabase: any,
  device: GPSDevice,
  speedKmh: number,
  latitude: number,
  longitude: number,
  ignitionStatus: boolean | null
): Promise<void> {
  if (!device.vehicle_id) return;

  const { data: settings, error: settingsError } = await supabase
    .from("vehicle_security_settings")
    .select("*")
    .eq("vehicle_id", device.vehicle_id)
    .single();

  if (settingsError || !settings || !settings.security_enabled) {
    return;
  }

  const securitySettings = settings as VehicleSecuritySettings;

  const hasLesson = await hasScheduledLessonNow(supabase, device.instructor_id);
  if (hasLesson) {
    console.log(`[Security] Lesson in progress for instructor ${device.instructor_id}, skipping alert`);
    return;
  }

  let alertType: "unexpected_movement" | "ignition_on" | null = null;

  if (speedKmh >= securitySettings.movement_threshold_kmh) {
    alertType = "unexpected_movement";
  }

  if (
    securitySettings.notify_on_ignition &&
    ignitionStatus === true &&
    device.last_ignition_status === false
  ) {
    alertType = "ignition_on";
  }

  if (!alertType) return;

  const cooldownTime = new Date(
    Date.now() - securitySettings.alert_cooldown_minutes * 60 * 1000
  );

  const { data: recentAlerts, error: alertsError } = await supabase
    .from("vehicle_security_alerts")
    .select("id, triggered_at")
    .eq("vehicle_id", device.vehicle_id)
    .gte("triggered_at", cooldownTime.toISOString())
    .order("triggered_at", { ascending: false })
    .limit(1);

  if (!alertsError && recentAlerts && recentAlerts.length > 0) {
    console.log(`[Security] Alert cooldown active for vehicle ${device.vehicle_id}`);
    return;
  }

  console.log(`[Security] Triggering ${alertType} alert for vehicle ${device.vehicle_id}`);

  const { error: insertError } = await supabase
    .from("vehicle_security_alerts")
    .insert({
      vehicle_id: device.vehicle_id,
      instructor_id: device.instructor_id,
      device_id: device.id,
      alert_type: alertType,
      latitude,
      longitude,
      speed_kmh: speedKmh,
      notification_sent: false,
    });

  if (insertError) {
    console.error(`[Security] Failed to create alert:`, insertError);
    return;
  }

  const { data: vehicle } = await supabase
    .from("instructor_vehicles")
    .select("registration")
    .eq("id", device.vehicle_id)
    .single();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const response = await fetch(`${supabaseUrl}/functions/v1/notify-instructor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        instructorId: device.instructor_id,
        type: "security_alert",
        vehicleRegistration: vehicle?.registration || "Unknown",
        alertType,
        speedKmh: Math.round(speedKmh),
        latitude,
        longitude,
      }),
    });

    if (response.ok) {
      await supabase
        .from("vehicle_security_alerts")
        .update({ notification_sent: true })
        .eq("vehicle_id", device.vehicle_id)
        .eq("triggered_at", new Date().toISOString());
    }
  } catch (notifyError) {
    console.error(`[Security] Failed to send notification:`, notifyError);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GPSGATE_URL_RAW = Deno.env.get("GPSGATE_SERVER_URL");
    const GPSGATE_APP_ID = Deno.env.get("GPSGATE_APP_ID");
    const GPSGATE_TOKEN = Deno.env.get("GPSGATE_API_TOKEN");

    if (!GPSGATE_URL_RAW || !GPSGATE_APP_ID || !GPSGATE_TOKEN) {
      return new Response(
        JSON.stringify({ error: "Missing GPSgate credentials" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize URL: remove trailing slash and ensure https:// prefix
    let GPSGATE_URL = GPSGATE_URL_RAW.trim().replace(/\/+$/, "");
    if (!GPSGATE_URL.startsWith("http://") && !GPSGATE_URL.startsWith("https://")) {
      GPSGATE_URL = `https://${GPSGATE_URL}`;
    }

    const authHeaders = {
      "Authorization": GPSGATE_TOKEN,
      "Accept": "application/json"
    };

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch users (devices) from GPSgate
    const usersRes = await fetch(
      `${GPSGATE_URL}/comGpsGate/api/v.1/applications/${GPSGATE_APP_ID}/users?FromIndex=0&PageSize=1000`,
      { headers: authHeaders }
    );
    
    if (!usersRes.ok) {
      const text = await usersRes.text();
      console.error(`[GPSgate-Poller] Failed to fetch users: ${usersRes.status}`, text);
      return new Response(
        JSON.stringify({ error: "Failed to fetch GPSgate users", details: text }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const rawUsers = await usersRes.json();
    const gpsGateUsers: GPSGateUser[] = Array.isArray(rawUsers)
      ? rawUsers.map(normalizeGpsGateUser).filter(Boolean) as GPSGateUser[]
      : [];
    console.log(`[GPSgate-Poller] Found ${gpsGateUsers.length} users on GPSgate server`);

    // Fast lookup for validating stored mappings
    const gpsGateUserIdSet = new Set<number>(gpsGateUsers.map((u) => u.Id));

    // Build username to user ID mapping (case-insensitive)
    const usernameToUserId = new Map<string, number>();
    for (const u of gpsGateUsers) {
      usernameToUserId.set(normalizeText(u.Username), u.Id);
    }

    // 2. Get registered devices from our database
    const { data: registeredDevices, error: devicesError } = await supabase
      .from("gps_devices")
      .select("*");

    if (devicesError) {
      console.error(`[GPSgate-Poller] Database error:`, devicesError);
      return new Response(
        JSON.stringify({ error: "Database error", details: devicesError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build lookup by device_identifier (IMEI or username)
    const devicesByIdentifier = new Map<string, GPSDevice>();
    for (const d of registeredDevices || []) {
      devicesByIdentifier.set(d.device_identifier, d as GPSDevice);
    }

    console.log(`[GPSgate-Poller] ${devicesByIdentifier.size} devices registered in database`);

    // 2b. Get instructors with GPSgate mappings
    // Get instructors with GPSgate mappings (either user_id OR username)
    const { data: instructorsWithGPS, error: instructorsError } = await supabase
      .from("instructors")
      .select("id, gpsgate_user_id, gpsgate_username")
      .or("gpsgate_user_id.not.is.null,gpsgate_username.not.is.null");

    if (instructorsError) {
      console.error(`[GPSgate-Poller] Instructors query error:`, instructorsError);
    }

    // Build lookup by GPSgate user ID for instructors
    const instructorsByGpsGateId = new Map<number, InstructorGPS>();
    // Also keep an instructorId -> gpsGateUserId mapping for device fallback
    const instructorIdToGpsGateUserId = new Map<string, number>();
    for (const i of instructorsWithGPS || []) {
      // If instructor has numeric ID, only trust it if it exists in GPSgate
      if (i.gpsgate_user_id && gpsGateUserIdSet.has(i.gpsgate_user_id)) {
        instructorsByGpsGateId.set(i.gpsgate_user_id, i as InstructorGPS);
        instructorIdToGpsGateUserId.set(i.id, i.gpsgate_user_id);
      } else if (i.gpsgate_username) {
        // Use the same smart matching logic as device resolution
        // This handles exact username, Name, Description substring matches and digit patterns
        const resolved = resolveGpsGateUserIdForDevice(
          i.gpsgate_username,
          null, // No explicit user ID
          gpsGateUsers,
          usernameToUserId
        );
        
        if (resolved.userId) {
          instructorsByGpsGateId.set(resolved.userId, i as InstructorGPS);
          instructorIdToGpsGateUserId.set(i.id, resolved.userId);
          // Persist discovered ID to database (fire and forget)
          supabase
            .from("instructors")
            .update({ gpsgate_user_id: resolved.userId })
            .eq("id", i.id)
            .then(({ error }) => {
              if (error) {
                console.error(`[GPSgate-Poller] Failed to persist discovered ID for instructor ${i.id}:`, error);
              }
            });
          console.log(`[GPSgate-Poller] Auto-linked instructor ${i.id} (${i.gpsgate_username}) -> GPSgate user ${resolved.userId} via ${resolved.reason}`);
        } else {
          console.log(`[GPSgate-Poller] Instructor ${i.id} (${i.gpsgate_username}) not found in GPSgate users (${resolved.reason})`);
        }
      } else if (i.gpsgate_user_id && !gpsGateUserIdSet.has(i.gpsgate_user_id)) {
        console.log(`[GPSgate-Poller] Instructor ${i.id} has invalid gpsgate_user_id=${i.gpsgate_user_id} (not present in GPSgate users list)`);
      }
    }

    console.log(`[GPSgate-Poller] ${instructorsByGpsGateId.size} instructors with GPSgate IDs (including auto-discovered)`);

    let processed = 0;
    let skipped = 0;
    let instructorsProcessed = 0;

    // 3. Process each registered device
    for (const [identifier, device] of devicesByIdentifier) {
      // Find matching GPSgate user (supports IMEI-in-description and other non-username mappings)
      const matchCandidates = [
        device.device_identifier,
        device.device_name,
      ].filter((v): v is string => typeof v === "string" && v.trim().length > 0);

      const explicitDeviceUserId = (device.gpsgate_user_id && gpsGateUserIdSet.has(device.gpsgate_user_id))
        ? device.gpsgate_user_id
        : null;

      let resolved = {
        userId: explicitDeviceUserId,
        reason: explicitDeviceUserId ? "explicit_gpsgate_user_id" : (device.gpsgate_user_id ? "invalid_explicit_gpsgate_user_id" : "no_match"),
      };
      for (const candidate of matchCandidates) {
        resolved = resolveGpsGateUserIdForDevice(
          candidate,
          explicitDeviceUserId,
          gpsGateUsers,
          usernameToUserId
        );
        if (resolved.userId) break;
      }

      const gpsGateUserId = resolved.userId;

      // Fallback: if we still can't resolve from device fields, use instructor mapping
      // (most instructors will have exactly one tracker linked).
      if (!gpsGateUserId) {
        const fallbackId = instructorIdToGpsGateUserId.get(device.instructor_id);
        if (fallbackId) {
          resolved = { userId: fallbackId, reason: "instructor_fallback" };
        }
      }

      const gpsGateUserIdFinal = resolved.userId;
      
      if (!gpsGateUserIdFinal) {
        console.log(
          `[GPSgate-Poller] Device ${identifier} not linked in GPSgate (${resolved.reason}). Candidates tried: ${matchCandidates.join(", ")}`
        );
        skipped++;
        continue;
      }

      // Persist mapping once discovered (helps future runs and UI)
      if (!device.gpsgate_user_id) {
        const { error: mapErr } = await supabase
          .from("gps_devices")
          .update({ gpsgate_user_id: gpsGateUserIdFinal })
          .eq("id", device.id);

        if (mapErr) {
          console.warn(`[GPSgate-Poller] Failed to persist gpsgate_user_id mapping for ${identifier}:`, mapErr);
        } else {
          console.log(`[GPSgate-Poller] Linked device ${identifier} -> GPSgate user ${gpsGateUserIdFinal} (${resolved.reason})`);
        }
      }

      // First, try to fetch the LATEST position from the /status endpoint (most real-time)
      // This is the correct endpoint for live position data - NOT /position which doesn't exist
      const cacheBuster = Date.now();
      let latestTrack: GPSGateTrackPoint | null = null;
      let trackTime: string | null = null;
      let dataSource = "none";
      
      // Try /status endpoint first (returns latest position and variables for a user)
      try {
        const statusRes = await fetch(
          `${GPSGATE_URL}/comGpsGate/api/v.1/applications/${GPSGATE_APP_ID}/users/${gpsGateUserIdFinal}/status?_=${cacheBuster}`,
          { 
            headers: { ...authHeaders, "Cache-Control": "no-cache, no-store" }
          }
        );
        
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          // Log only on first few polls or when debugging
          console.log(`[GPSgate-Poller] /status for user ${gpsGateUserIdFinal}: ${JSON.stringify(statusData).substring(0, 400)}`);
          
          // Check if status data has position info
          const testPos = extractPosition(statusData);
          if (testPos.lat !== null && testPos.lng !== null) {
            latestTrack = statusData;
            trackTime = extractTime(statusData);
            dataSource = "status";
            console.log(`[GPSgate-Poller] Using /status data for user ${gpsGateUserIdFinal}`);
          } else {
            console.log(`[GPSgate-Poller] /status has no valid position for user ${gpsGateUserIdFinal}, keys: ${Object.keys(statusData).join(',')}`);
          }
        } else {
          console.log(`[GPSgate-Poller] /status returned ${statusRes.status} for user ${gpsGateUserIdFinal}`);

          // Some GPSgate deployments don't expose /status. If we get a 404,
          // fall back to fetching the user object (Users > Id), which can include
          // latest known position.
          if (statusRes.status === 404) {
            try {
              const userRes = await fetch(
                `${GPSGATE_URL}/comGpsGate/api/v.1/applications/${GPSGATE_APP_ID}/users/${gpsGateUserIdFinal}?_=${cacheBuster}`,
                { headers: { ...authHeaders, "Cache-Control": "no-cache, no-store" } }
              );

              if (userRes.ok) {
                const userData = await userRes.json();
                const userPos = extractPosition(userData);
                if (userPos.lat !== null && userPos.lng !== null) {
                  latestTrack = userData;
                  trackTime = extractTime(userData);
                  dataSource = "user";
                  console.log(`[GPSgate-Poller] Using /users data for user ${gpsGateUserIdFinal}`);
                } else {
                  console.log(`[GPSgate-Poller] /users has no valid position for user ${gpsGateUserIdFinal}, keys: ${Object.keys(userData).join(',')}`);
                }
              } else {
                const text = await userRes.text().catch(() => "");
                console.log(`[GPSgate-Poller] /users returned ${userRes.status} for user ${gpsGateUserIdFinal}: ${text.substring(0, 300)}`);
              }
            } catch (userErr) {
              console.log(`[GPSgate-Poller] /users fallback failed for user ${gpsGateUserIdFinal}:`, userErr);
            }
          }
        }
      } catch (statusErr) {
        console.log(`[GPSgate-Poller] /status failed for user ${gpsGateUserIdFinal}:`, statusErr);
      }
      
      // Fallback to /tracks endpoint if /status didn't work
      if (!latestTrack) {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        // Try today first
        const tracksRes = await fetch(
          `${GPSGATE_URL}/comGpsGate/api/v.1/applications/${GPSGATE_APP_ID}/users/${gpsGateUserIdFinal}/tracks?Date=${today}&_=${cacheBuster}`,
          { 
            headers: { ...authHeaders, "Cache-Control": "no-cache, no-store" }
          }
        );

        let tracks: GPSGateTrackPoint[] = [];
        if (tracksRes.ok) {
          tracks = await tracksRes.json();
        } else {
          const text = await tracksRes.text().catch(() => "");
          console.log(`[GPSgate-Poller] /tracks (today) returned ${tracksRes.status} for user ${gpsGateUserIdFinal}: ${text.substring(0, 300)}`);
        }
        
        // If no tracks today, try yesterday (timezone boundary handling)
        if (!tracks || tracks.length === 0) {
          console.log(`[GPSgate-Poller] No tracks today for user ${gpsGateUserIdFinal}, trying yesterday`);
          const yesterdayRes = await fetch(
            `${GPSGATE_URL}/comGpsGate/api/v.1/applications/${GPSGATE_APP_ID}/users/${gpsGateUserIdFinal}/tracks?Date=${yesterday}&_=${cacheBuster}`,
            { 
              headers: { ...authHeaders, "Cache-Control": "no-cache, no-store" }
            }
          );
          if (yesterdayRes.ok) {
            tracks = await yesterdayRes.json();
          } else {
            const text = await yesterdayRes.text().catch(() => "");
            console.log(`[GPSgate-Poller] /tracks (yesterday) returned ${yesterdayRes.status} for user ${gpsGateUserIdFinal}: ${text.substring(0, 300)}`);
          }
        }
        
        if (!tracks || tracks.length === 0) {
          // Some setups don't expose /tracks. Fall back to /tripinfos and use the
          // last known position from the most recent trip.
          try {
            const fromIso = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
            const toIso = new Date().toISOString();
            const tripRes = await fetch(
              `${GPSGATE_URL}/comGpsGate/api/v.1/applications/${GPSGATE_APP_ID}/users/${gpsGateUserIdFinal}/tripinfos?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`,
              { headers: { ...authHeaders, "Cache-Control": "no-cache, no-store" } }
            );

            if (tripRes.ok) {
              const tripInfos = await tripRes.json();
              const trips = Array.isArray(tripInfos) ? tripInfos : [tripInfos];
              const lastTrip = trips.length > 0 ? trips[trips.length - 1] : null;

              const endPos = lastTrip?.EndPosition ?? lastTrip?.endPosition ?? null;
              const startPos = lastTrip?.StartPosition ?? lastTrip?.startPosition ?? null;
              const pos = endPos ?? startPos;

              const lat = pos?.Lat ?? pos?.lat ?? pos?.latitude ?? null;
              const lng = pos?.Lng ?? pos?.lng ?? pos?.longitude ?? null;
              const t = lastTrip?.EndUtc ?? lastTrip?.endUtc ?? lastTrip?.StartUtc ?? lastTrip?.startUtc ?? null;

              if (typeof lat === "number" && typeof lng === "number") {
                const synthesized = { Lat: lat, Lng: lng, Utc: t ?? new Date().toISOString() } as unknown as GPSGateTrackPoint;
                latestTrack = synthesized;
                trackTime = extractTime(synthesized);
                dataSource = "tripinfos";
                console.log(`[GPSgate-Poller] Fallback to /tripinfos for user ${gpsGateUserIdFinal}`);
              }
            } else {
              const text = await tripRes.text().catch(() => "");
              console.log(`[GPSgate-Poller] /tripinfos returned ${tripRes.status} for user ${gpsGateUserIdFinal}: ${text.substring(0, 300)}`);
            }
          } catch (tripErr) {
            console.log(`[GPSgate-Poller] /tripinfos fallback failed for user ${gpsGateUserIdFinal}:`, tripErr);
          }
        }

        if (!latestTrack) {
          console.log(`[GPSgate-Poller] No tracks for user ${gpsGateUserIdFinal}`);
          skipped++;
          continue;
        }
        
        // Get the latest track point
        if (!latestTrack) {
          latestTrack = tracks[tracks.length - 1];
          trackTime = extractTime(latestTrack);
          dataSource = "tracks";
          console.log(`[GPSgate-Poller] Fallback to /tracks for user ${gpsGateUserIdFinal}`);
        }
      }
      
      if (!latestTrack) {
        console.log(`[GPSgate-Poller] No position data for user ${gpsGateUserIdFinal}`);
        skipped++;
        continue;
      }
      // Extract position using flexible field parsing FIRST so we can check for movement
      const { lat, lng: lon } = extractPosition(latestTrack);
      const speedKmh = extractSpeed(latestTrack);
      const bearing = extractHeading(latestTrack);
      const altitude = extractAltitude(latestTrack);
      const now = new Date();

      console.log(`[GPSgate-Poller] ${dataSource}: lat=${lat}, lon=${lon}, speed=${speedKmh.toFixed(1)}km/h, trackTime=${trackTime}`);

      // Skip if no valid position found
      if (lat === null || lon === null) {
        console.log(`[GPSgate-Poller] No valid position for device ${identifier}. Keys: ${Object.keys(latestTrack).join(', ')}`);
        skipped++;
        continue;
      }

      // Calculate distance from last position for movement detection
      let distanceMeters = 0;
      if (device.last_latitude !== null && device.last_longitude !== null) {
        distanceMeters = calculateDistance(device.last_latitude, device.last_longitude, lat, lon);
      }
      
      // Movement detection: Only consider this as "new" data if:
      // 1. We have a newer track timestamp than before, OR
      // 2. Position has moved by more than 5 meters (meaningful movement)
      const MOVEMENT_THRESHOLD_METERS = 5;
      const hasNewerTimestamp = (() => {
        if (!device.last_gpsgate_track_time || !trackTime) return true; // First time or no timestamp
        const lastTrackTime = new Date(device.last_gpsgate_track_time).getTime();
        const currentTrackTime = new Date(trackTime).getTime();
        return currentTrackTime > lastTrackTime;
      })();
      
      const hasMoved = distanceMeters >= MOVEMENT_THRESHOLD_METERS;
      
      // Skip position update if no new timestamp AND no meaningful movement - but still update heartbeat
      if (!hasNewerTimestamp && !hasMoved) {
        // Position hasn't changed and timestamp is the same/older - update heartbeat only
        console.log(`[GPSgate-Poller] Device ${identifier}: no movement (${distanceMeters.toFixed(1)}m), updating heartbeat only`);
        
        // Always update heartbeat to show the device is responding even when stationary
        await supabase
          .from("gps_devices")
          .update({ last_heartbeat_at: now.toISOString() })
          .eq("id", device.id);
        
        skipped++;
        continue;
      }

      console.log(`[GPSgate-Poller] Processing: device=${identifier}, moved=${distanceMeters.toFixed(1)}m, newerTime=${hasNewerTimestamp}`);

      // Calculate time diff for acceleration detection
      const lastSeenAt = device.last_seen_at ? new Date(device.last_seen_at) : null;
      const timeDiffSeconds = lastSeenAt ? (now.getTime() - lastSeenAt.getTime()) / 1000 : null;

      // Fetch road info
      let speedLimitKmh: number | null = null;
      let roadName: string | null = null;
      try {
        const roadInfo = await getRoadInfo(lat, lon);
        speedLimitKmh = roadInfo.speedLimit;
        roadName = roadInfo.roadName;
        console.log(`[GPSgate-Poller] Road info: ${roadName}, limit=${speedLimitKmh}km/h`);
      } catch (err) {
        console.log(`[GPSgate-Poller] Road info lookup error:`, err);
      }

      // Calculate braking and acceleration
      let brakingAlert: { severity: string; deceleration: number } | null = null;
      let accelerationAlert: { severity: string; acceleration: number } | null = null;

      if (
        device.last_speed_kmh !== null &&
        timeDiffSeconds !== null &&
        timeDiffSeconds > 0 &&
        timeDiffSeconds < 30
      ) {
        const speedDiffKmh = device.last_speed_kmh - speedKmh;
        const speedDiffMs = speedDiffKmh / 3.6;
        const rateOfChange = Math.abs(speedDiffMs) / timeDiffSeconds;

        if (speedDiffKmh > 0) {
          if (rateOfChange >= BRAKING_THRESHOLDS.HIGH) {
            brakingAlert = { severity: "high", deceleration: rateOfChange };
          } else if (rateOfChange >= BRAKING_THRESHOLDS.MEDIUM) {
            brakingAlert = { severity: "medium", deceleration: rateOfChange };
          } else if (rateOfChange >= BRAKING_THRESHOLDS.LOW) {
            brakingAlert = { severity: "low", deceleration: rateOfChange };
          }
        } else if (speedDiffKmh < 0) {
          if (rateOfChange >= ACCELERATION_THRESHOLDS.HIGH) {
            accelerationAlert = { severity: "high", acceleration: rateOfChange };
          } else if (rateOfChange >= ACCELERATION_THRESHOLDS.MEDIUM) {
            accelerationAlert = { severity: "medium", acceleration: rateOfChange };
          } else if (rateOfChange >= ACCELERATION_THRESHOLDS.LOW) {
            accelerationAlert = { severity: "low", acceleration: rateOfChange };
          }
        }
      }

      // Extract vehicle health telemetry using helper functions
      const batteryPercent = extractBattery(latestTrack);
      const ignitionRaw = latestTrack.Ignition ?? latestTrack.ignition;
      const ignitionStatus = typeof ignitionRaw === 'boolean' 
        ? ignitionRaw 
        : null;

      // Fetch accumulators (odometer, engine hours) from GPSgate
      let odometerMeters: number | null = null;
      let engineHoursSeconds: number | null = null;
      
      try {
        const accumulatorsRes = await fetch(
          `${GPSGATE_URL}/comGpsGate/api/v.1/applications/${GPSGATE_APP_ID}/users/${gpsGateUserIdFinal}/accumulators`,
          { headers: authHeaders }
        );
        
        if (accumulatorsRes.ok) {
          const accumulators: GPSGateAccumulator[] = await accumulatorsRes.json();
          
          for (const acc of accumulators) {
            const name = acc.Name?.toLowerCase() || "";
            if (name.includes("odometer") || name.includes("distance")) {
              // GPSgate returns odometer in meters
              odometerMeters = acc.Value;
            } else if (name.includes("engine") && name.includes("hour")) {
              // GPSgate returns engine hours in seconds
              engineHoursSeconds = Math.round(acc.Value);
            }
          }
          
          if (odometerMeters !== null) {
            console.log(`[GPSgate-Poller] Odometer for ${identifier}: ${(odometerMeters / 1000).toFixed(1)} km`);
          }
        }
      } catch (accErr) {
        console.log(`[GPSgate-Poller] Failed to fetch accumulators for user ${gpsGateUserIdFinal}:`, accErr);
      }

      // Calculate daily tracking
      const todayDate = new Date().toISOString().split('T')[0];
      let dailyStartOdometer = device.daily_start_odometer_m;
      let dailyStartDate = device.daily_start_date;
      
      // Reset daily counter if it's a new day or not set
      if (odometerMeters !== null && dailyStartDate !== todayDate) {
        dailyStartOdometer = odometerMeters;
        dailyStartDate = todayDate;
        console.log(`[GPSgate-Poller] Reset daily odometer for ${identifier}: ${(odometerMeters / 1000).toFixed(1)} km`);
      }

      // Update device record with telemetry and heartbeat
      const { error: updateError } = await supabase
        .from("gps_devices")
        .update({
          last_speed_kmh: speedKmh,
          last_latitude: lat,
          last_longitude: lon,
          last_heading: bearing,
          // Use the actual GPS timestamp, so "online/offline" reflects device activity
          last_seen_at: trackTime || now.toISOString(),
          last_speed_limit_kmh: speedLimitKmh,
          last_road_name: roadName,
          last_gpsgate_track_time: trackTime || now.toISOString(),
          last_battery_percent: batteryPercent,
          last_ignition_status: ignitionStatus,
          gpsgate_user_id: gpsGateUserIdFinal,
          gpsgate_odometer_m: odometerMeters,
          gpsgate_engine_hours_s: engineHoursSeconds,
          daily_start_odometer_m: dailyStartOdometer,
          daily_start_date: dailyStartDate,
          // Always update heartbeat on every successful poll
          last_heartbeat_at: now.toISOString(),
        })
        .eq("id", device.id);

      if (updateError) {
        console.error(`[GPSgate-Poller] Device update error:`, updateError);
      }

      // Log battery history (sample every 5 minutes)
      if (batteryPercent !== null) {
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const { data: recentBattery } = await supabase
          .from("gps_battery_history")
          .select("id")
          .eq("device_id", device.id)
          .gte("recorded_at", fiveMinutesAgo.toISOString())
          .limit(1);

        if (!recentBattery || recentBattery.length === 0) {
          await supabase
            .from("gps_battery_history")
            .insert({
              device_id: device.id,
              instructor_id: device.instructor_id,
              battery_percent: batteryPercent,
            });
          console.log(`[GPSgate-Poller] Battery history logged: ${batteryPercent}% for device ${identifier}`);
        }
      }

      // Log ignition state changes
      if (ignitionStatus !== null && ignitionStatus !== device.last_ignition_status) {
        await supabase
          .from("gps_ignition_events")
          .insert({
            device_id: device.id,
            instructor_id: device.instructor_id,
            vehicle_id: device.vehicle_id,
            event_type: ignitionStatus ? "on" : "off",
            latitude: lat,
            longitude: lon,
            road_name: roadName,
          });
        console.log(`[GPSgate-Poller] Ignition ${ignitionStatus ? 'ON' : 'OFF'} for device ${identifier}`);
      }

      // If session is active, record data
      if (device.current_session_id) {
        const ACCURACY_THRESHOLD = 20;
        const MIN_DISTANCE_M = 5;
        const MAX_DISTANCE_M = 500;
        
        let shouldInsertPoint = true;
        const accuracy = 10; // GPSgate doesn't provide accuracy, assume good
        
        if (device.last_latitude !== null && device.last_longitude !== null) {
          if (distanceMeters < MIN_DISTANCE_M && speedKmh < 5) {
            console.log(`[GPSgate-Poller] Skipping point: stationary`);
            shouldInsertPoint = false;
          } else if (distanceMeters > MAX_DISTANCE_M) {
            console.log(`[GPSgate-Poller] Skipping point: GPS jump ${distanceMeters.toFixed(0)}m`);
            shouldInsertPoint = false;
          }
        }
        
        if (shouldInsertPoint) {
          const { error: gpsError } = await supabase
            .from("telematics_gps_points")
            .insert({
              telematics_id: device.current_session_id,
              latitude: lat,
              longitude: lon,
              speed_kmh: speedKmh,
              heading: bearing,
              altitude_m: altitude,
              accuracy_m: accuracy,
              road_name: roadName,
              speed_limit_kmh: speedLimitKmh,
              recorded_at: latestTrack.Time,
            });

          if (gpsError) {
            console.error(`[GPSgate-Poller] GPS point insert error:`, gpsError);
          }
        }

        // Update total distance atomically
        if (shouldInsertPoint && distanceMeters >= MIN_DISTANCE_M && distanceMeters <= MAX_DISTANCE_M) {
          const distanceKm = distanceMeters / 1000;
          
          await supabase.rpc("increment_total_distance", {
            p_id: device.current_session_id,
            p_distance: distanceKm
          });
        }

        // Update live position if pupil is assigned
        if (device.current_pupil_id) {
          try {
            await supabase.rpc("update_live_position", {
              p_pupil_id: device.current_pupil_id,
              p_latitude: lat,
              p_longitude: lon,
              p_speed_kmh: speedKmh,
              p_heading: bearing,
              p_accuracy: accuracy,
              p_trip_status: speedKmh > 5 ? "driving" : "stopped",
              p_session_id: device.current_session_id,
              p_speed_limit_kmh: speedLimitKmh,
            });
          } catch (rpcErr) {
            console.error(`[GPSgate-Poller] RPC error:`, rpcErr);
          }
        }

        // Create alerts if detected
        if (brakingAlert) {
          await supabase
            .from("telematics_realtime_alerts")
            .insert({
              telematics_id: device.current_session_id,
              alert_type: "harsh_braking",
              severity: brakingAlert.severity,
              speed_kmh: speedKmh,
              latitude: lat,
              longitude: lon,
              is_acknowledged: false,
            });
        }

        if (accelerationAlert) {
          await supabase
            .from("telematics_realtime_alerts")
            .insert({
              telematics_id: device.current_session_id,
              alert_type: "harsh_acceleration",
              severity: accelerationAlert.severity,
              speed_kmh: speedKmh,
              latitude: lat,
              longitude: lon,
              is_acknowledged: false,
            });
        }

        // Create speeding alert if over limit
        if (speedLimitKmh && speedKmh > speedLimitKmh + 5) {
          const overspeed = speedKmh - speedLimitKmh;
          let severity = "low";
          if (overspeed > 20) severity = "high";
          else if (overspeed > 10) severity = "medium";

          await supabase
            .from("telematics_realtime_alerts")
            .insert({
              telematics_id: device.current_session_id,
              alert_type: "speeding",
              severity,
              speed_kmh: speedKmh,
              latitude: lat,
              longitude: lon,
              is_acknowledged: false,
            });
        }
      } else {
        // No active session - check for security alerts
        if (device.vehicle_id) {
          await checkSecurityAlert(
            supabase,
            device,
            speedKmh,
            lat,
            lon,
            ignitionStatus
          );
        }
      }

      processed++;
    }

    // 4. Process instructors with GPSgate IDs (phone tracking) - use /status first for real-time
    for (const [gpsGateUserId, instructor] of instructorsByGpsGateId) {
      try {
        const cacheBuster = Date.now();
        let latestTrack: GPSGateTrackPoint | null = null;
        let instructorTrackTime: string | null = null;
        let instructorDataSource = "none";
        
        // Try /status endpoint first (real-time position)
        try {
          const statusRes = await fetch(
            `${GPSGATE_URL}/comGpsGate/api/v.1/applications/${GPSGATE_APP_ID}/users/${gpsGateUserId}/status?_=${cacheBuster}`,
            { 
              headers: { ...authHeaders, "Cache-Control": "no-cache, no-store" }
            }
          );
          
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            const testPos = extractPosition(statusData);
            if (testPos.lat !== null && testPos.lng !== null) {
              latestTrack = statusData;
              instructorTrackTime = extractTime(statusData);
              instructorDataSource = "status";
            }
          }
        } catch {
          // /status failed, will try tracks fallback
        }
        
        // Fallback to /tracks if /status didn't work
        if (!latestTrack) {
          const today = new Date().toISOString().split('T')[0];
          const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          
          let tracks: GPSGateTrackPoint[] = [];
          
          // Try today first
          const tracksRes = await fetch(
            `${GPSGATE_URL}/comGpsGate/api/v.1/applications/${GPSGATE_APP_ID}/users/${gpsGateUserId}/tracks?Date=${today}&_=${cacheBuster}`,
            { headers: { ...authHeaders, "Cache-Control": "no-cache, no-store" } }
          );

          if (tracksRes.ok) {
            tracks = await tracksRes.json();
          }
          
          // If no tracks today, try yesterday (timezone boundary)
          if (!tracks || tracks.length === 0) {
            const yesterdayRes = await fetch(
              `${GPSGATE_URL}/comGpsGate/api/v.1/applications/${GPSGATE_APP_ID}/users/${gpsGateUserId}/tracks?Date=${yesterday}&_=${cacheBuster}`,
              { headers: { ...authHeaders, "Cache-Control": "no-cache, no-store" } }
            );
            if (yesterdayRes.ok) {
              tracks = await yesterdayRes.json();
            }
          }
          
          if (tracks && tracks.length > 0) {
            latestTrack = tracks[tracks.length - 1];
            instructorTrackTime = extractTime(latestTrack);
            instructorDataSource = "tracks";
          }
        }

        const now = new Date().toISOString();
        
        // If no position data, still update connection status
        if (!latestTrack) {
          const { data: updateData } = await supabase
            .from("gps_devices")
            .update({ last_seen_at: now, gpsgate_user_id: gpsGateUserId })
            .eq("instructor_id", instructor.id)
            .select("id");
            
          if (!updateData || updateData.length === 0) {
            await supabase.from("gps_devices").insert({
              instructor_id: instructor.id,
              device_identifier: `gpsgate-${gpsGateUserId}`,
              device_name: `GPSgate Tracker`,
              gpsgate_user_id: gpsGateUserId,
              last_seen_at: now,
            });
            console.log(`[GPSgate-Poller] Created virtual device for instructor ${instructor.id} (no data yet)`);
          }
          
          console.log(`[GPSgate-Poller] Instructor ${instructor.id}: connected but no recent position`);
          instructorsProcessed++;
          continue;
        }

        const { lat, lng: lon } = extractPosition(latestTrack);
        const speedKmh = extractSpeed(latestTrack);
        const heading = extractHeading(latestTrack);

        // Skip if no valid position
        if (lat === null || lon === null) {
          console.log(`[GPSgate-Poller] Instructor ${instructor.id}: no valid position`);
          instructorsProcessed++;
          continue;
        }

        console.log(`[GPSgate-Poller] Instructor ${instructor.id} (${instructorDataSource}): ${speedKmh.toFixed(1)}km/h at ${lat},${lon}`);

        // Update the gps_devices table for this instructor
        const { data: updateData, error: updateErr } = await supabase
          .from("gps_devices")
          .update({
            last_seen_at: now,
            last_gpsgate_track_time: instructorTrackTime || now,
            last_speed_kmh: speedKmh,
            last_latitude: lat,
            last_longitude: lon,
            last_heading: heading,
            gpsgate_user_id: gpsGateUserId,
          })
          .eq("instructor_id", instructor.id)
          .select("id");

        // If no rows updated, insert a virtual device
        if (!updateData || updateData.length === 0) {
          console.log(`[GPSgate-Poller] No device for instructor ${instructor.id}, creating virtual device`);
          const { error: insertErr } = await supabase
            .from("gps_devices")
            .insert({
              instructor_id: instructor.id,
              device_identifier: `gpsgate-${gpsGateUserId}`,
              device_name: `GPSgate Tracker`,
              gpsgate_user_id: gpsGateUserId,
              last_seen_at: now,
              last_gpsgate_track_time: instructorTrackTime || now,
              last_speed_kmh: speedKmh,
              last_latitude: lat,
              last_longitude: lon,
              last_heading: heading,
            });
          if (insertErr) {
            console.error(`[GPSgate-Poller] Failed to insert virtual device for instructor ${instructor.id}:`, insertErr);
          } else {
            console.log(`[GPSgate-Poller] Created virtual device for instructor ${instructor.id}`);
          }
        }

        instructorsProcessed++;
      } catch (err) {
        console.error(`[GPSgate-Poller] Error processing instructor ${instructor.id}:`, err);
      }
    }

    console.log(`[GPSgate-Poller] Complete: ${processed} devices, ${instructorsProcessed} instructors, ${skipped} skipped`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed, 
        skipped,
        instructors_processed: instructorsProcessed,
        total_users: gpsGateUsers.length,
        registered_devices: devicesByIdentifier.size
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error(`[GPSgate-Poller] Error:`, err);
    return new Response(
      JSON.stringify({ error: "Internal error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
