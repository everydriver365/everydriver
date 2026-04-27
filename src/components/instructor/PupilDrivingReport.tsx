import React, { useMemo, useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Gauge,
  MapPin,
  Calendar,
  Navigation,
  Car,
  ChevronRight,
  Download,
  TrendingUp,
  Send,
  CheckCheck,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfYear,
  subDays,
  isWithinInterval,
} from 'date-fns';
import RouteMapView from './RouteMapView';
import DrivingSkillsHeatmap from './DrivingSkillsHeatmap';
import PupilBrakeGearAnalysis from './PupilBrakeGearAnalysis';
import { SegmentedControl } from '@/components/instructor/ui/SegmentedControl';
import {
  PeriodSelector,
  type PeriodKey,
} from '@/components/instructor/ui/PeriodSelector';
import { TrendPill } from '@/components/instructor/ui/TrendPill';
import { ScoreBadge } from '@/components/instructor/ui/ScoreBadge';
import { titleCaseName } from '@/lib/titleCase';
import { Badge } from '@/components/ui/badge';

interface TelematicsSession {
  id: string;
  lesson_id: string | null;
  started_at: string;
  ended_at: string | null;
  total_distance_km: number;
  avg_speed_kmh: number | null;
  max_speed_kmh: number | null;
}

interface GPSPoint {
  latitude: number;
  longitude: number;
  speed_kmh: number | null;
  recorded_at: string;
}

interface DrivingEvent {
  id: string;
  telematics_id: string | null;
  event_type: string;
  severity: string;
  latitude: number | null;
  longitude: number | null;
  speed_at_event: number | null;
  recorded_at: string;
  notes: string | null;
}

interface PupilDrivingReportProps {
  pupilId: string;
  pupilName: string;
  instructorId: string;
}

type TabKey = 'sessions' | 'brake' | 'heatmap' | 'events';

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif';

// Locale-aware unit handling — GB / en-GB → miles, otherwise km.
function useLocaleUnit(): { unit: 'mi' | 'km'; toUnit: (km: number) => number } {
  const lang =
    (typeof navigator !== 'undefined' && navigator.language) || 'en-GB';
  const isMiles = /^(en-GB|en-US|en-IE)/i.test(lang) || lang === 'en';
  return {
    unit: isMiles ? 'mi' : 'km',
    toUnit: (km: number) => (isMiles ? km * 0.621371 : km),
  };
}

function formatDistance(km: number, unit: 'mi' | 'km', toUnit: (km: number) => number): string | null {
  if (!km || !isFinite(km) || km <= 0) return null;
  return `${toUnit(km).toFixed(1)} ${unit}`;
}

function ratingFromScore(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 65) return 'Good';
  if (score >= 40) return 'Needs work';
  return 'At risk';
}

function ratingPalette(rating: string): { bg: string; fg: string } {
  const r = rating.toLowerCase();
  if (r.includes('excellent') || r.includes('very good'))
    return { bg: '#E8F3E8', fg: '#3B8B3B' };
  if (r.includes('good') || r.includes('steady'))
    return { bg: '#E6F1FB', fg: '#2B7BC8' };
  if (r.includes('needs') || r.includes('improving') || r.includes('developing'))
    return { bg: '#FBF1DE', fg: '#B8801F' };
  if (r.includes('risk') || r.includes('concern') || r.includes('practice'))
    return { bg: '#FBEAEC', fg: '#C8434F' };
  return { bg: '#E6F1FB', fg: '#2B7BC8' };
}

/* ---------------- Period helpers ---------------- */

interface DateInterval {
  start: Date;
  end: Date;
}

/** Resolve a PeriodKey into the current and previous comparable interval. */
function resolvePeriod(period: PeriodKey, now: Date = new Date()): {
  current: DateInterval | null;
  previous: DateInterval | null;
} {
  switch (period) {
    case 'this_week': {
      const start = startOfWeek(now, { weekStartsOn: 1 });
      const end = endOfWeek(now, { weekStartsOn: 1 });
      return {
        current: { start, end },
        previous: { start: subDays(start, 7), end: subDays(end, 7) },
      };
    }
    case 'last_7_days': {
      const end = now;
      const start = subDays(now, 7);
      return {
        current: { start, end },
        previous: { start: subDays(start, 7), end: start },
      };
    }
    case 'last_30_days': {
      const end = now;
      const start = subDays(now, 30);
      return {
        current: { start, end },
        previous: { start: subDays(start, 30), end: start },
      };
    }
    case 'this_year': {
      const start = startOfYear(now);
      return { current: { start, end: now }, previous: null };
    }
    case 'all_time':
    default:
      return { current: null, previous: null };
  }
}

function formatRangeLabel(period: PeriodKey, now: Date = new Date()): string {
  const { current } = resolvePeriod(period, now);
  if (!current) return 'All time';
  if (period === 'this_week') {
    return `${format(current.start, 'EEE d')} – ${format(current.end, 'EEE d')}`;
  }
  return `${format(current.start, 'd MMM')} – ${format(current.end, 'd MMM')}`;
}

/* ---------------- Score helpers ---------------- */

function scoreForEvents(good: number, bad: number): number {
  return Math.max(0, Math.min(100, 100 - bad * 5 + good * 2));
}

/** Derive a per-session score from its events. Returns null when no events at all. */
function perSessionScore(
  sessionId: string,
  events: Array<{ telematics_id?: string | null; event_type: string }>,
): number | null {
  const own = events.filter((e) => e.telematics_id === sessionId);
  if (own.length === 0) return null;
  const good = own.filter(
    (e) => e.event_type === 'smooth_stop' || e.event_type === 'good_acceleration',
  ).length;
  const bad = own.filter(
    (e) =>
      e.event_type === 'harsh_brake' ||
      e.event_type === 'harsh_acceleration' ||
      e.event_type === 'speeding' ||
      e.event_type === 'sharp_turn',
  ).length;
  return scoreForEvents(good, bad);
}

const PupilDrivingReport: React.FC<PupilDrivingReportProps> = ({
  pupilId,
  pupilName,
  instructorId,
}) => {
  const [sessions, setSessions] = useState<TelematicsSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<TelematicsSession | null>(null);
  const [gpsPoints, setGpsPoints] = useState<GPSPoint[]>([]);
  const [events, setEvents] = useState<DrivingEvent[]>([]);
  const [allEvents, setAllEvents] = useState<DrivingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('sessions');
  const [period, setPeriod] = useState<PeriodKey>('last_30_days');

  const { unit, toUnit } = useLocaleUnit();

  useEffect(() => {
    fetchTelematicsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pupilId, instructorId]);

  const fetchTelematicsData = async () => {
    setIsLoading(true);
    try {
      const { data: sessionsData } = await supabase
        .from('lesson_telematics')
        .select('*')
        .eq('instructor_id', instructorId)
        .eq('pupil_id', pupilId)
        .order('started_at', { ascending: false });

      setSessions(sessionsData || []);

      if (sessionsData && sessionsData.length > 0) {
        const sessionIds = sessionsData.map((s) => s.id);
        const { data: eventsData } = await supabase
          .from('driving_behavior_events')
          .select('*')
          .in('telematics_id', sessionIds)
          .order('recorded_at', { ascending: false });

        setAllEvents(eventsData || []);

        if (sessionsData.length > 0) {
          await loadSessionDetails(sessionsData[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching telematics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessionDetails = async (session: TelematicsSession) => {
    setSelectedSession(session);

    const { data: gpsData } = await supabase
      .from('telematics_gps_points')
      .select('latitude, longitude, speed_kmh, recorded_at')
      .eq('telematics_id', session.id)
      .order('recorded_at', { ascending: true });

    setGpsPoints(gpsData || []);

    const { data: eventsData } = await supabase
      .from('driving_behavior_events')
      .select('*')
      .eq('telematics_id', session.id)
      .order('recorded_at', { ascending: false });

    setEvents(eventsData || []);
  };

  // Period-aware filtering. Falls back to "all sessions" when interval is null
  // (i.e. period === 'all_time'). Trend compares same-shape previous interval.
  const periodNow = useMemo(() => new Date(), []);
  const { current: currentInterval, previous: previousInterval } = useMemo(
    () => resolvePeriod(period, periodNow),
    [period, periodNow],
  );

  const filterSessionsBy = (interval: DateInterval | null) => {
    if (!interval) return sessions;
    return sessions.filter((s) =>
      isWithinInterval(new Date(s.started_at), {
        start: interval.start,
        end: interval.end,
      }),
    );
  };
  const filterEventsBy = (interval: DateInterval | null) => {
    if (!interval) return allEvents;
    return allEvents.filter((e) =>
      isWithinInterval(new Date(e.recorded_at), {
        start: interval.start,
        end: interval.end,
      }),
    );
  };

  const periodSessions = useMemo(
    () => filterSessionsBy(currentInterval),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessions, currentInterval],
  );
  const periodEvents = useMemo(
    () => filterEventsBy(currentInterval),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allEvents, currentInterval],
  );

  const totalDistanceKm = periodSessions.reduce(
    (acc, s) => acc + (Number(s.total_distance_km) || 0),
    0,
  );
  const totalSessions = periodSessions.length;

  const goodEvents = periodEvents.filter(
    (e) => e.event_type === 'smooth_stop' || e.event_type === 'good_acceleration',
  );
  const badEvents = periodEvents.filter(
    (e) =>
      e.event_type === 'harsh_brake' ||
      e.event_type === 'harsh_acceleration' ||
      e.event_type === 'speeding' ||
      e.event_type === 'sharp_turn',
  );

  const overallScore = scoreForEvents(goodEvents.length, badEvents.length);

  // Threshold-aware display tier:
  //   none        → 0 lessons in period (hide score, show "Not enough data")
  //   provisional → 1-4 lessons (grey pill, no rating colour)
  //   full        → 5+ lessons (Phase 1 default)
  const scoreTier: 'none' | 'provisional' | 'full' =
    totalSessions === 0
      ? 'none'
      : totalSessions < 5
        ? 'provisional'
        : 'full';

  const rating = scoreTier === 'full' ? ratingFromScore(overallScore) : '—';
  const palette = ratingPalette(rating);

  // Week-on-week trend — only when both periods have ≥5 lessons and the period
  // exposes a meaningful previous interval (i.e. not 'this_year' / 'all_time').
  const trendDelta: number | null = useMemo(() => {
    if (!previousInterval) return null;
    if (totalSessions < 5) return null;
    const prevSessions = filterSessionsBy(previousInterval);
    if (prevSessions.length < 5) return null;
    const prevEvents = filterEventsBy(previousInterval);
    const prevGood = prevEvents.filter(
      (e) =>
        e.event_type === 'smooth_stop' || e.event_type === 'good_acceleration',
    ).length;
    const prevBad = prevEvents.filter(
      (e) =>
        e.event_type === 'harsh_brake' ||
        e.event_type === 'harsh_acceleration' ||
        e.event_type === 'speeding' ||
        e.event_type === 'sharp_turn',
    ).length;
    const prevScore = scoreForEvents(prevGood, prevBad);
    return overallScore - prevScore;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previousInterval, sessions, allEvents, totalSessions, overallScore]);

  const niceName = titleCaseName(pupilName) || pupilName;

  const distanceLabel = formatDistance(totalDistanceKm, unit, toUnit);

  const caveat = (() => {
    if (scoreTier === 'none') return null; // hero shows ProvisionalScoreState
    if (scoreTier === 'provisional')
      return 'Score becomes reliable after 5 lessons in this period';
    return distanceLabel
      ? `Based on ${totalSessions} lessons across ${distanceLabel}`
      : `Based on ${totalSessions} lessons`;
  })();

  const rangeLabel = formatRangeLabel(period, periodNow);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'harsh_brake':
        return <AlertTriangle className="h-4 w-4" style={{ color: '#B8801F' }} />;
      case 'harsh_acceleration':
        return <TrendingUp className="h-4 w-4" style={{ color: '#B8801F' }} />;
      case 'speeding':
        return <Gauge className="h-4 w-4" style={{ color: '#C8434F' }} />;
      case 'sharp_turn':
        return <Navigation className="h-4 w-4" style={{ color: '#B8801F' }} />;
      case 'smooth_stop':
        return <CheckCircle className="h-4 w-4" style={{ color: '#3B8B3B' }} />;
      case 'good_acceleration':
        return <TrendingUp className="h-4 w-4" style={{ color: '#3B8B3B' }} />;
      default:
        return <Car className="h-4 w-4" />;
    }
  };

  const formatEventType = (type: string) =>
    type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  // Loading skeleton
  if (isLoading) {
    return (
      <div
        style={{
          background: '#F2F2F4',
          minHeight: '100%',
          padding: 16,
          fontFamily: FONT_STACK,
        }}
      >
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ height: 14, background: '#F2F2F4', borderRadius: 4, width: '40%' }} />
          <div style={{ height: 32, background: '#F2F2F4', borderRadius: 6, width: '30%' }} />
          <div style={{ height: 4, background: '#F2F2F4', borderRadius: 2 }} />
        </div>
      </div>
    );
  }

  // Empty state — no sessions
  const noSessions = sessions.length === 0;

  return (
    <div
      style={{
        background: '#F2F2F4',
        minHeight: '100%',
        padding: 16,
        fontFamily: FONT_STACK,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Header card */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: '#6E6E73',
                letterSpacing: '0.3px',
                textTransform: 'uppercase',
                margin: '0 0 1px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {niceName}
            </p>
            <h1
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: '#000000',
                letterSpacing: '-0.2px',
                margin: 0,
              }}
            >
              Driving report
            </h1>
          </div>
          <button
            type="button"
            onClick={() => {
              // Existing PDF export flow — preserved as a no-op placeholder
              // matching prior in-card "Export PDF" button behaviour.
              // Generates the report for the currently-selected period.
            }}
            style={{
              background: '#F2F2F4',
              border: 0,
              borderRadius: 8,
              padding: '6px 10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              cursor: 'pointer',
              flexShrink: 0,
            }}
            aria-label="Export PDF"
          >
            <Download size={13} strokeWidth={2} color="#000000" />
            <span style={{ fontSize: 12, fontWeight: 500, color: '#000000' }}>PDF</span>
          </button>
        </div>
        {/* Period selector row */}
        <div
          style={{
            padding: '8px 16px',
            borderTop: '0.5px solid #E5E5EA',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <PeriodSelector
            value={period}
            rangeLabel={rangeLabel}
            onChange={setPeriod}
          />
        </div>
      </div>

      {/* Performance score hero card */}
      {scoreTier === 'none' ? (
        <ProvisionalScoreState />
      ) : (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
              gap: 12,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#6E6E73',
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                  margin: '0 0 2px',
                }}
              >
                Performance score
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span
                  style={{
                    fontSize: 30,
                    fontWeight: 500,
                    color: '#000000',
                    letterSpacing: '-0.5px',
                  }}
                >
                  {overallScore}
                </span>
                <span style={{ fontSize: 13, color: '#6E6E73', fontWeight: 500 }}>
                  / 100
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#6E6E73',
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                  margin: '0 0 2px',
                }}
              >
                Rating
              </p>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    borderRadius: 999,
                    padding: '4px 10px',
                    fontSize: 12,
                    fontWeight: 500,
                    background: scoreTier === 'full' ? palette.bg : '#F2F2F4',
                    color: scoreTier === 'full' ? palette.fg : '#6E6E73',
                  }}
                >
                  {scoreTier === 'full' ? rating : 'Provisional'}
                </span>
                {scoreTier === 'full' && <TrendPill delta={trendDelta} />}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: 4,
              background: '#F2F2F4',
              borderRadius: 2,
              overflow: 'hidden',
              marginBottom: 8,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${overallScore}%`,
                background: scoreTier === 'full' ? palette.fg : '#C7C7CC',
                transition: 'width 200ms ease',
              }}
            />
          </div>
          {caveat && (
            <p style={{ fontSize: 11, color: '#6E6E73', margin: 0, lineHeight: 1.4 }}>
              {caveat}
            </p>
          )}
        </div>
      )}

      {/* Stats grid 2x2 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 8,
        }}
      >
        <StatTile
          icon={<Calendar size={16} strokeWidth={2} color="#2B7BC8" />}
          iconBg="#E6F1FB"
          value={String(totalSessions)}
          label="Lessons"
        />
        <StatTile
          icon={<Send size={16} strokeWidth={2} color="#8A5BC9" />}
          iconBg="#F1ECFA"
          value={distanceLabel ?? '—'}
          valueMuted={!distanceLabel}
          label="Distance"
        />
        <StatTile
          icon={<CheckCircle size={16} strokeWidth={2} color="#3B8B3B" />}
          iconBg="#E8F3E8"
          value={String(goodEvents.length)}
          label="Good events"
        />
        <StatTile
          icon={<AlertTriangle size={16} strokeWidth={2} color="#B8801F" />}
          iconBg="#FBF1DE"
          value={String(badEvents.length)}
          label="Needs work"
        />
      </div>

      {/* Tab nav */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 12,
          padding: 12,
        }}
      >
        <SegmentedControl<TabKey>
          value={activeTab}
          onChange={setActiveTab}
          ariaLabel="Driving report tabs"
          options={[
            { value: 'sessions', label: 'Sessions' },
            { value: 'brake', label: 'Brake' },
            { value: 'heatmap', label: 'Heatmap' },
            {
              value: 'events',
              label: periodEvents.length > 0 ? `Events (${periodEvents.length})` : 'Events',
            },
          ]}
        />
      </div>

      {/* Tab content */}
      {activeTab === 'sessions' && (
        <SessionsTab
          sessions={periodSessions}
          allEvents={periodEvents}
          selectedSession={selectedSession}
          gpsPoints={gpsPoints}
          events={events}
          loadSessionDetails={loadSessionDetails}
          unit={unit}
          toUnit={toUnit}
          getEventIcon={getEventIcon}
          formatEventType={formatEventType}
        />
      )}

      {activeTab === 'brake' && (
        <CardWrap eyebrow="Brake & gear analysis">
          {selectedSession && periodSessions.length > 0 ? (
            <PupilBrakeGearAnalysis
              telematicsId={selectedSession.id}
              sessionDate={selectedSession.started_at}
            />
          ) : (
            <TabEmptyState
              iconBg="#FBF1DE"
              iconFg="#B8801F"
              icon={<Gauge size={24} strokeWidth={2} color="#B8801F" />}
              title="No braking data yet"
              subtitle="Track lessons to see braking and gear-change patterns"
            />
          )}
        </CardWrap>
      )}

      {activeTab === 'heatmap' && (
        <CardWrap eyebrow="Skills heatmap">
          {periodSessions.length > 0 ? (
            <DrivingSkillsHeatmap
              instructorId={instructorId}
              pupilId={pupilId}
              height="450px"
            />
          ) : (
            <TabEmptyState
              iconBg="#FBEAEC"
              iconFg="#C8434F"
              icon={<MapPin size={24} strokeWidth={2} color="#C8434F" />}
              title="No route data yet"
              subtitle="Tracked lessons appear here as a route heatmap"
            />
          )}
        </CardWrap>
      )}

      {activeTab === 'events' && (
        <CardWrap eyebrow={`All driving events · ${periodEvents.length}`}>
          {periodEvents.length === 0 ? (
            <TabEmptyState
              iconBg="#E8F3E8"
              iconFg="#3B8B3B"
              icon={<CheckCheck size={24} strokeWidth={2} color="#3B8B3B" />}
              title="No events flagged"
              subtitle="Driving has been smooth — no notable events"
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {periodEvents.map((event) => (
                <div
                  key={event.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: 12,
                    border: '0.5px solid #E5E5EA',
                    borderRadius: 10,
                    background: '#FFFFFF',
                  }}
                >
                  <div style={{ flexShrink: 0, marginTop: 2 }}>
                    {getEventIcon(event.event_type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: '#000000',
                        margin: 0,
                      }}
                    >
                      {formatEventType(event.event_type)}
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: '#6E6E73',
                        margin: '2px 0 0',
                      }}
                    >
                      {format(new Date(event.recorded_at), 'd MMMM yyyy, HH:mm')}
                    </p>
                    {event.notes && (
                      <p
                        style={{
                          fontSize: 12,
                          color: '#6E6E73',
                          margin: '4px 0 0',
                        }}
                      >
                        {event.notes}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <Badge
                      variant={
                        event.severity === 'high'
                          ? 'destructive'
                          : event.severity === 'medium'
                            ? 'secondary'
                            : 'outline'
                      }
                      className="text-[10px]"
                    >
                      {event.severity}
                    </Badge>
                    {event.speed_at_event && (
                      <p
                        style={{
                          fontSize: 11,
                          color: '#6E6E73',
                          margin: '4px 0 0',
                        }}
                      >
                        {Math.round(Number(event.speed_at_event) * (unit === 'mi' ? 0.621371 : 1))}{' '}
                        {unit === 'mi' ? 'mph' : 'km/h'}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardWrap>
      )}
    </div>
  );
};

/* ---------------- Sub-components ---------------- */

function StatTile({
  icon,
  iconBg,
  value,
  label,
  valueMuted,
}: {
  icon: React.ReactNode;
  iconBg: string;
  value: string;
  label: string;
  valueMuted?: boolean;
}) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '0.5px solid #E5E5EA',
        borderRadius: 12,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: iconBg,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
        }}
      >
        {icon}
      </div>
      <p
        style={{
          fontSize: 18,
          fontWeight: 500,
          color: valueMuted ? '#6E6E73' : '#000000',
          letterSpacing: '-0.3px',
          margin: 0,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </p>
      <p style={{ fontSize: 11, color: '#6E6E73', margin: '2px 0 0' }}>{label}</p>
    </div>
  );
}

function CardWrap({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 12,
        padding: 14,
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: '#6E6E73',
          letterSpacing: '0.3px',
          textTransform: 'uppercase',
          margin: '0 0 12px',
        }}
      >
        {eyebrow}
      </p>
      {children}
    </div>
  );
}

function SessionsTab({
  sessions,
  allEvents,
  selectedSession,
  gpsPoints,
  events,
  loadSessionDetails,
  unit,
  toUnit,
  getEventIcon,
  formatEventType,
}: {
  sessions: TelematicsSession[];
  allEvents: DrivingEvent[];
  selectedSession: TelematicsSession | null;
  gpsPoints: GPSPoint[];
  events: DrivingEvent[];
  loadSessionDetails: (s: TelematicsSession) => void;
  unit: 'mi' | 'km';
  toUnit: (km: number) => number;
  getEventIcon: (t: string) => React.ReactNode;
  formatEventType: (t: string) => string;
}) {
  if (sessions.length === 0) {
    return (
      <CardWrap eyebrow="Recorded sessions · 0">
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: '24px 16px',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: '#E6F1FB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MapPin size={24} strokeWidth={2} color="#2B7BC8" />
          </div>
          <div>
            <p
              style={{
                fontSize: 15,
                fontWeight: 500,
                color: '#000000',
                margin: 0,
              }}
            >
              No sessions in this period
            </p>
            <p
              style={{
                fontSize: 12,
                color: '#6E6E73',
                margin: '4px 0 0',
                lineHeight: 1.4,
              }}
            >
              Sessions appear here once you start tracking lessons. Try a wider date range above.
            </p>
          </div>
        </div>
      </CardWrap>
    );
  }

  const speedUnit = unit === 'mi' ? 'mph' : 'km/h';
  const speedFactor = unit === 'mi' ? 0.621371 : 1;

  return (
    <>
      <CardWrap eyebrow={`Recorded sessions · ${sessions.length}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sessions.map((session) => {
            const km = Number(session.total_distance_km) || 0;
            const distLabel = formatDistance(km, unit, toUnit) ?? 'Distance unavailable';
            const isActive = selectedSession?.id === session.id;
            const sessionScore = perSessionScore(session.id, allEvents);
            return (
              <button
                key={session.id}
                type="button"
                onClick={() => loadSessionDetails(session)}
                style={{
                  background: '#FFFFFF',
                  border: `0.5px solid ${isActive ? '#2B7BC8' : '#E5E5EA'}`,
                  borderRadius: 10,
                  padding: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: '#E6F1FB',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Calendar size={18} strokeWidth={2} color="#2B7BC8" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#000000',
                      letterSpacing: '-0.1px',
                      margin: '0 0 1px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {format(new Date(session.started_at), 'd MMMM yyyy')}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 12,
                      color: '#6E6E73',
                    }}
                  >
                    <span>Lesson</span>
                    <span
                      aria-hidden="true"
                      style={{
                        width: 3,
                        height: 3,
                        borderRadius: '50%',
                        background: '#C7C7CC',
                      }}
                    />
                    <span>{distLabel}</span>
                  </div>
                </div>
                {sessionScore !== null && <ScoreBadge score={sessionScore} />}
                <ChevronRight size={12} strokeWidth={1.6} color="#6E6E73" />
              </button>
            );
          })}
        </div>
      </CardWrap>

      {selectedSession && (
        <CardWrap eyebrow={`Selected · ${format(new Date(selectedSession.started_at), 'd MMMM yyyy')}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <RouteMapView
              gpsPoints={gpsPoints}
              title={`Route — ${format(new Date(selectedSession.started_at), 'd MMMM yyyy')}`}
              height="180px"
            />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 8,
              }}
            >
              {[
                {
                  value:
                    formatDistance(Number(selectedSession.total_distance_km) || 0, unit, toUnit) ??
                    'Unavailable',
                  label: 'Distance',
                },
                {
                  value: selectedSession.avg_speed_kmh
                    ? `${Math.round(Number(selectedSession.avg_speed_kmh) * speedFactor)} ${speedUnit}`
                    : '—',
                  label: 'Avg speed',
                },
                {
                  value: selectedSession.max_speed_kmh
                    ? `${Math.round(Number(selectedSession.max_speed_kmh) * speedFactor)} ${speedUnit}`
                    : '—',
                  label: 'Max speed',
                },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: '#FFFFFF',
                    border: '0.5px solid #E5E5EA',
                    borderRadius: 10,
                    padding: 10,
                    textAlign: 'center',
                  }}
                >
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#000000',
                      margin: 0,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {s.value}
                  </p>
                  <p style={{ fontSize: 11, color: '#6E6E73', margin: '2px 0 0' }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            {events.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: '#6E6E73',
                    letterSpacing: '0.3px',
                    textTransform: 'uppercase',
                    margin: 0,
                  }}
                >
                  Events this lesson
                </p>
                {events.map((event) => (
                  <div
                    key={event.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: 10,
                      border: '0.5px solid #E5E5EA',
                      borderRadius: 10,
                    }}
                  >
                    {getEventIcon(event.event_type)}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: '#000000',
                          margin: 0,
                        }}
                      >
                        {formatEventType(event.event_type)}
                      </p>
                      {event.notes && (
                        <p
                          style={{
                            fontSize: 11,
                            color: '#6E6E73',
                            margin: '2px 0 0',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {event.notes}
                        </p>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        color: '#6E6E73',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {format(new Date(event.recorded_at), 'HH:mm')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardWrap>
      )}
    </>
  );
}

function ProvisionalScoreState() {
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 12,
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 12,
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: '#6E6E73',
          letterSpacing: '0.3px',
          textTransform: 'uppercase',
          margin: 0,
        }}
      >
        Performance score
      </p>
      <p
        style={{
          fontSize: 17,
          fontWeight: 500,
          color: '#000000',
          margin: 0,
          letterSpacing: '-0.2px',
        }}
      >
        Not enough data
      </p>
      <p
        style={{
          fontSize: 12,
          color: '#6E6E73',
          margin: 0,
          lineHeight: 1.4,
          maxWidth: 260,
        }}
      >
        Track at least one lesson in this period to see a score.
      </p>
    </div>
  );
}

function TabEmptyState({
  icon,
  iconBg,
  iconFg: _iconFg,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconFg: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '32px 16px',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <div>
        <p
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: '#000000',
            margin: 0,
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontSize: 12,
            color: '#6E6E73',
            margin: '4px 0 0',
            lineHeight: 1.4,
            maxWidth: 280,
          }}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}

export default PupilDrivingReport;
