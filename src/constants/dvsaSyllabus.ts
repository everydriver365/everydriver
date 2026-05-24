// DVSA Standard Driving Syllabus - 27 Key Competencies
// Based on the official DVSA driving test marking sheet

export interface SyllabusCompetency {
  id: string;
  name: string;
  category: string;
  description?: string;
  resourceUrl?: string;
}

export const DVSA_SYLLABUS: SyllabusCompetency[] = [
  // Vehicle Controls
  { id: 'precautions', name: 'Safety Precautions', category: 'Controls', description: 'Checks before starting the engine' },
  { id: 'cockpit_drill', name: 'Cockpit Drill', category: 'Controls', description: 'DSSSM routine - Doors, Seat, Steering, Seatbelt, Mirrors' },
  { id: 'controls', name: 'Controls & Instruments', category: 'Controls', description: 'Understanding all vehicle controls' },
  { id: 'moving_off', name: 'Moving Off', category: 'Controls', description: 'Safely and under control in all situations' },
  { id: 'stopping', name: 'Making Progress / Stopping', category: 'Controls', description: 'Normal and controlled stops' },
  
  // Road Procedure
  { id: 'mirrors', name: 'Use of Mirrors', category: 'Road Procedure', description: 'MSM routine application' },
  { id: 'signals', name: 'Signals', category: 'Road Procedure', description: 'Correct and timed signalling' },
  { id: 'response_signs', name: 'Response to Signs & Signals', category: 'Road Procedure', description: 'Traffic signs, road markings, traffic lights' },
  { id: 'use_of_speed', name: 'Use of Speed', category: 'Road Procedure', description: 'Appropriate speed for conditions' },
  { id: 'following_distance', name: 'Following Distance', category: 'Road Procedure', description: '2-second rule and separation' },
  { id: 'progress', name: 'Progress & Hesitancy', category: 'Road Procedure', description: 'Appropriate progress without undue hesitation' },
  
  // Junctions
  { id: 'junctions_turning', name: 'Junctions - Turning', category: 'Junctions', description: 'Left and right turns, give-way rules' },
  { id: 'junctions_emerging', name: 'Junctions - Emerging', category: 'Junctions', description: 'Safely joining traffic flow' },
  { id: 'crossroads', name: 'Crossroads', category: 'Junctions', description: 'Priority and positioning at crossroads' },
  { id: 'roundabouts', name: 'Roundabouts', category: 'Junctions', description: 'All types including mini roundabouts' },
  
  // Judgement & Awareness
  { id: 'meeting_traffic', name: 'Meeting Traffic', category: 'Judgement', description: 'Passing parked vehicles and oncoming traffic' },
  { id: 'crossing_traffic', name: 'Crossing Traffic', category: 'Judgement', description: 'Right turns across traffic flow' },
  { id: 'overtaking', name: 'Overtaking', category: 'Judgement', description: 'Safe overtaking of slower vehicles' },
  { id: 'pedestrian_crossings', name: 'Pedestrian Crossings', category: 'Judgement', description: 'All crossing types' },
  { id: 'positioning', name: 'Positioning', category: 'Judgement', description: 'Lane discipline and road position' },
  { id: 'awareness_planning', name: 'Awareness & Planning', category: 'Judgement', description: 'Hazard perception and anticipation' },
  
  // Manoeuvres
  { id: 'reverse_park_road', name: 'Reverse Park (Road)', category: 'Manoeuvres', description: 'Parallel parking between vehicles' },
  { id: 'reverse_park_bay', name: 'Reverse Park (Bay)', category: 'Manoeuvres', description: 'Reversing into a parking bay' },
  { id: 'pull_up_right', name: 'Pull Up on Right', category: 'Manoeuvres', description: 'Pull up on right, reverse 2 car lengths' },
  
  // Independent Driving
  { id: 'independent_driving', name: 'Independent Driving', category: 'Test Ready', description: 'Following directions or sat-nav' },
  { id: 'show_me_tell_me', name: 'Show Me / Tell Me', category: 'Test Ready', description: 'Vehicle safety questions' },
  { id: 'emergency_stop', name: 'Emergency Stop', category: 'Test Ready', description: 'Stopping quickly and safely under control' },
];

// Skill levels matching DVSA competency framework
export const SKILL_LEVELS = [
  { level: 0, label: 'Not Started', color: 'bg-muted', textColor: 'text-muted-foreground' },
  { level: 1, label: 'Introduced', color: 'bg-red-100 dark:bg-red-900/30', textColor: 'text-red-600' },
  { level: 2, label: 'Under Guidance', color: 'bg-orange-100 dark:bg-orange-900/30', textColor: 'text-orange-600' },
  { level: 3, label: 'Prompted', color: 'bg-yellow-100 dark:bg-yellow-900/30', textColor: 'text-yellow-600' },
  { level: 4, label: 'Seldom Prompted', color: 'bg-blue-100 dark:bg-blue-900/30', textColor: 'text-blue-600' },
  { level: 5, label: 'Independent', color: 'bg-green-100 dark:bg-green-900/30', textColor: 'text-green-600' },
];

// Categories for grouping
export const SYLLABUS_CATEGORIES = [
  'Controls',
  'Road Procedure',
  'Junctions',
  'Judgement',
  'Manoeuvres',
  'Test Ready',
];

// Helper to get competencies by category
export function getCompetenciesByCategory(competencies: SyllabusCompetency[] = DVSA_SYLLABUS) {
  return SYLLABUS_CATEGORIES.reduce((acc, category) => {
    acc[category] = competencies.filter(c => c.category === category);
    return acc;
  }, {} as Record<string, SyllabusCompetency[]>);
}

// Helper to calculate overall progress
export function calculateSyllabusProgress(progress: { competency_id: string; level: number }[]) {
  const totalPoints = DVSA_SYLLABUS.length * 5; // Max 5 per competency
  const earnedPoints = progress.reduce((sum, p) => sum + (p.level || 0), 0);
  return Math.round((earnedPoints / totalPoints) * 100);
}
