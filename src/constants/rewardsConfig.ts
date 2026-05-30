/**
 * DSM Pro Rewards — point rules, tiers, badges, rewards, prizes.
 * Single source of truth shared by edge functions and UI.
 */

export const POINT_RULES = {
  // Course track (instructor_courses)
  COURSE_FULL_ATTENDANCE: 75,
  COURSE_PARTIAL_ATTENDANCE: 30,
  COURSE_REPORT_SAME_DAY: 20,
  COURSE_100_PERCENT_MONTH: 100,
  COURSE_CONSECUTIVE_MONTH: 10,

  // Lesson track (lesson_history). EOL completion proxied via lesson_syllabus_updates.
  LESSON_WITH_EOL: 10,
  LESSON_WITHOUT_EOL: 2,
  LESSON_PUPIL_PASS: 100,
  LESSON_SYLLABUS_UPDATED: 5,
  LESSON_CONSECUTIVE_WEEK: 5,
  PUPIL_RETAINED_3_MONTHS: 20,

  // Reviews
  REVIEW_4_5_STAR: 50,
  REVIEW_3_STAR: -10,
  REVIEW_1_2_STAR: -30,
  REVIEW_RESPONDED_PROFESSIONALLY: 5,

  // Compliance — weekly
  ADI_VALID: 5,
  DBS_VALID: 5,
  INSURANCE_VALID: 5,
  DOCUMENT_EXPIRED: -10,

  // Reliability
  NO_SHOW: -75,
  LATE_CANCELLATION: -25,
  EOL_NOT_COMPLETED: -5,
  COURSE_REPORT_LATE: -15,

  // Complaints
  COMPLAINT_RECEIVED: -100,
  COMPLAINT_UPHELD: -200,
  CHARGEBACK_RAISED: -150,
  TWO_COMPLAINTS_MONTH: -300,

  // Loyalty + one-off
  PROFILE_COMPLETE: 50,
  REFERRAL_INSTRUCTOR: 500,
  REFERRAL_PUPIL: 100,
  LOYALTY_1_YEAR: 100,
  LOYALTY_2_YEAR: 200,
  LOYALTY_3_PLUS_YEAR: 50,
  CPD_HOUR_LOGGED: 15,
  TAX_RETURN_SUBMITTED: 50,
} as const;

export type Tier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'elite' | 'suspended';

export const TIER_THRESHOLDS: Record<Exclude<Tier, 'suspended'>, { min: number; label: string; emoji: string }> = {
  bronze:   { min: 0,     label: 'Bronze',   emoji: '🥉' },
  silver:   { min: 1000,  label: 'Silver',   emoji: '🥈' },
  gold:     { min: 2500,  label: 'Gold',     emoji: '🥇' },
  platinum: { min: 5000,  label: 'Platinum', emoji: '💎' },
  elite:    { min: 10000, label: 'Elite',    emoji: '👑' },
};

export const TIER_ORDER: Tier[] = ['bronze', 'silver', 'gold', 'platinum', 'elite'];

export function tierForPoints(points: number): Exclude<Tier, 'suspended'> {
  if (points >= TIER_THRESHOLDS.elite.min) return 'elite';
  if (points >= TIER_THRESHOLDS.platinum.min) return 'platinum';
  if (points >= TIER_THRESHOLDS.gold.min) return 'gold';
  if (points >= TIER_THRESHOLDS.silver.min) return 'silver';
  return 'bronze';
}

export function nextTier(current: Tier): Exclude<Tier, 'suspended'> | null {
  const idx = TIER_ORDER.indexOf(current);
  if (idx < 0 || idx >= TIER_ORDER.length - 1) return null;
  return TIER_ORDER[idx + 1] as Exclude<Tier, 'suspended'>;
}

export const TIER_REWARDS: Record<Exclude<Tier, 'suspended'>, string[]> = {
  bronze: [],
  silver: [
    'Priority pupil/client matching',
    'Featured on DSM social media quarterly',
    'DSM marketing template pack',
    'Monthly earnings summary',
    'DSM community forum access',
  ],
  gold: [
    'Free CPD course per year (worth £200–£400)',
    'Tax-ready annual income report',
    '5% reduced DSM fee',
    'Priority listing in directory',
    'Dedicated support channel',
    'Professional bio written by DSM',
    'Featured in DSM monthly newsletter',
  ],
  platinum: [
    'Free profile website (yourname.dsm.co.uk)',
    '2× CPD courses paid per year',
    'Google Business Profile set up + optimised',
    'LinkedIn profile write-up',
    '10% reduced DSM fee',
    'Featured trainer to new pupils/clients',
    'Monthly performance report',
  ],
  elite: [
    'Full professional website build — free hosting',
    'Monthly SEO management',
    'Zero DSM platform fee for the year',
    '📻 Local radio advertising feature',
    '📺 Regional TV advertising (Sky AdSmart)',
    'Press release to local media',
    'VIP dedicated account manager',
    'Invitation to annual DSM awards dinner',
  ],
};

export const BADGE_DEFINITIONS = [
  { key: 'five_star',     label: '5-Star Rated',    emoji: '⭐', condition: '50+ reviews above 4 stars this season', permanent: false },
  { key: 'pass_machine',  label: 'Pass Machine',    emoji: '🎓', condition: '20+ test passes this season',           permanent: false },
  { key: 'on_a_roll',     label: 'On a Roll',       emoji: '🔥', condition: '12+ consecutive weeks with lessons',    permanent: false },
  { key: 'compliant',     label: 'Fully Compliant', emoji: '✅', condition: 'ADI + DBS + insurance valid 3+ months', permanent: false },
  { key: 'syllabus_pro',  label: 'Syllabus Pro',    emoji: '📚', condition: 'Syllabus updated on 90%+ of lessons',   permanent: false },
  { key: 'course_master', label: 'Course Master',   emoji: '🎯', condition: '10+ courses delivered this season',     permanent: false },
  { key: 'loyal_pro',     label: 'Loyal Pro',       emoji: '💎', condition: '3+ years on DSM platform',              permanent: false },
  { key: 'champion',      label: 'DSM Champion',    emoji: '🏆', condition: 'Year-end #1 position',                   permanent: true },
] as const;

export type BadgeKey = (typeof BADGE_DEFINITIONS)[number]['key'];

export const PUPIL_FACING_BADGES: BadgeKey[] = [
  'five_star', 'pass_machine', 'on_a_roll', 'compliant', 'loyal_pro', 'champion',
];

export const SEASON_PRIZES = {
  first: 1000,
  second: 500,
  third: 250,
  fourth_to_tenth: 50,
  top_course_instructor: 500,
  top_lesson_instructor: 500,
  most_improved: 250,
  most_consistent: 250,
} as const;

export type PointCategory =
  | 'course' | 'lesson' | 'compliance' | 'review'
  | 'complaint' | 'loyalty' | 'referral' | 'manual';
