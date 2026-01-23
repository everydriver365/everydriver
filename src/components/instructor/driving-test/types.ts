// Types for the DL25A Driving Test Report Form

export interface FaultEntry {
  total: number;
  serious: boolean;
  dangerous: boolean;
}

export interface ControlFaults {
  accelerator: FaultEntry;
  clutch: FaultEntry;
  gears: FaultEntry;
  footbrake: FaultEntry;
  parking_brake: FaultEntry;
  steering: FaultEntry;
  balance_mc: FaultEntry;
  lgv_pcv_gear: FaultEntry;
  pcv_door: FaultEntry;
}

export interface MoveOffFaults {
  safety: FaultEntry;
  control: FaultEntry;
}

export interface MirrorsFaults {
  rear_obs: FaultEntry;
  signalling: FaultEntry;
  change_direction: FaultEntry;
  change_speed: FaultEntry;
}

export interface SignalsFaults {
  necessary: FaultEntry;
  correctly: FaultEntry;
  timed: FaultEntry;
}

export interface ResponseFaults {
  traffic_signs: FaultEntry;
  road_markings: FaultEntry;
  traffic_lights: FaultEntry;
  traffic_controllers: FaultEntry;
  other_road_users: FaultEntry;
}

export interface ProgressFaults {
  appropriate_speed: FaultEntry;
  undue_hesitation: FaultEntry;
}

export interface JunctionsFaults {
  approach_speed: FaultEntry;
  observation: FaultEntry;
  turning_right: FaultEntry;
  turning_left: FaultEntry;
  cutting_corners: FaultEntry;
}

export interface JudgementFaults {
  overtaking: FaultEntry;
  meeting: FaultEntry;
  crossing: FaultEntry;
}

export interface PositioningFaults {
  normal_driving: FaultEntry;
  lane_discipline: FaultEntry;
}

export interface ManeuvreFaults {
  control: FaultEntry;
  observation: FaultEntry;
}

export interface ControlledStopFaults {
  promptness: FaultEntry;
  control: FaultEntry;
}

export interface DrivingTestFaults {
  // Section 1
  eyesight: FaultEntry;
  highway_code_safety: FaultEntry;
  
  // Section 2 - Controlled Stop
  controlled_stop: ControlledStopFaults;
  
  // Section 3-6 - Manoeuvres
  reverse_left: ManeuvreFaults;
  reverse_trailer: ManeuvreFaults;
  reverse_right: ManeuvreFaults;
  reverse_park: ManeuvreFaults & { r_c: FaultEntry };
  turn_in_road: ManeuvreFaults;
  
  // Section 7-10
  vehicle_checks: FaultEntry;
  taxi_manoeuvre: ManeuvreFaults;
  taxi_wheelchair: FaultEntry;
  uncouple_recouple: FaultEntry;
  
  // Section 11-12
  precautions: FaultEntry;
  control: ControlFaults;
  
  // Section 13
  move_off: MoveOffFaults;
  
  // Section 14
  mirrors_mc: MirrorsFaults;
  
  // Section 15
  signals: SignalsFaults;
  
  // Section 16
  clearance_obstructions: FaultEntry;
  
  // Section 17
  response: ResponseFaults;
  
  // Section 18-20
  use_of_speed: FaultEntry;
  following_distance: FaultEntry;
  progress: ProgressFaults;
  
  // Section 21
  junctions: JunctionsFaults;
  
  // Section 22
  judgement: JudgementFaults;
  
  // Section 23
  positioning: PositioningFaults;
  
  // Section 24-28
  pedestrian_crossings: FaultEntry;
  position_normal_stops: FaultEntry;
  awareness_planning: FaultEntry;
  ancillary_controls: FaultEntry;
  eco_safe_driving: FaultEntry;
  
  // Section 29-32 - Spare
  spare_1: FaultEntry;
  spare_2: FaultEntry;
  spare_3: FaultEntry;
  spare_4: FaultEntry;
  
  // Section 33 - Wheelchair
  wheelchair: { pass: boolean; fail: boolean };
}

export interface DrivingTestResult {
  id: string;
  pupil_id: string;
  instructor_id: string;
  examiner_id: string | null;
  test_date: string;
  test_time: string | null;
  test_centre_id: string | null;
  is_mock: boolean;
  result: 'pass' | 'fail';
  application_ref: string | null;
  cat_type: string;
  adi_cert_no: string | null;
  faults: DrivingTestFaults;
  total_minor_faults: number;
  total_serious_faults: number;
  total_dangerous_faults: number;
  examiner_took_action: boolean;
  eta_code: string | null;
  survey_answers: Record<string, string> | null;
  debrief_activity_code: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Examiner {
  id: string;
  instructor_id: string;
  name: string;
  dvsa_staff_number: string | null;
  test_centre_id: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface StandardsCheckMetrics {
  id: string;
  instructor_id: string;
  calculated_at: string;
  period_start: string;
  period_end: string;
  total_tests: number;
  avg_minor_faults: number;
  avg_serious_faults: number;
  physical_action_percentage: number;
  pass_rate_percentage: number;
  triggers_met: number;
  trigger_details: {
    minor_faults_triggered: boolean;
    serious_faults_triggered: boolean;
    physical_action_triggered: boolean;
    pass_rate_triggered: boolean;
  };
}

// Default empty fault entry
export const defaultFaultEntry: FaultEntry = {
  total: 0,
  serious: false,
  dangerous: false,
};

// Create default faults object
export const createDefaultFaults = (): DrivingTestFaults => ({
  eyesight: { ...defaultFaultEntry },
  highway_code_safety: { ...defaultFaultEntry },
  controlled_stop: {
    promptness: { ...defaultFaultEntry },
    control: { ...defaultFaultEntry },
  },
  reverse_left: {
    control: { ...defaultFaultEntry },
    observation: { ...defaultFaultEntry },
  },
  reverse_trailer: {
    control: { ...defaultFaultEntry },
    observation: { ...defaultFaultEntry },
  },
  reverse_right: {
    control: { ...defaultFaultEntry },
    observation: { ...defaultFaultEntry },
  },
  reverse_park: {
    r_c: { ...defaultFaultEntry },
    control: { ...defaultFaultEntry },
    observation: { ...defaultFaultEntry },
  },
  turn_in_road: {
    control: { ...defaultFaultEntry },
    observation: { ...defaultFaultEntry },
  },
  vehicle_checks: { ...defaultFaultEntry },
  taxi_manoeuvre: {
    control: { ...defaultFaultEntry },
    observation: { ...defaultFaultEntry },
  },
  taxi_wheelchair: { ...defaultFaultEntry },
  uncouple_recouple: { ...defaultFaultEntry },
  precautions: { ...defaultFaultEntry },
  control: {
    accelerator: { ...defaultFaultEntry },
    clutch: { ...defaultFaultEntry },
    gears: { ...defaultFaultEntry },
    footbrake: { ...defaultFaultEntry },
    parking_brake: { ...defaultFaultEntry },
    steering: { ...defaultFaultEntry },
    balance_mc: { ...defaultFaultEntry },
    lgv_pcv_gear: { ...defaultFaultEntry },
    pcv_door: { ...defaultFaultEntry },
  },
  move_off: {
    safety: { ...defaultFaultEntry },
    control: { ...defaultFaultEntry },
  },
  mirrors_mc: {
    rear_obs: { ...defaultFaultEntry },
    signalling: { ...defaultFaultEntry },
    change_direction: { ...defaultFaultEntry },
    change_speed: { ...defaultFaultEntry },
  },
  signals: {
    necessary: { ...defaultFaultEntry },
    correctly: { ...defaultFaultEntry },
    timed: { ...defaultFaultEntry },
  },
  clearance_obstructions: { ...defaultFaultEntry },
  response: {
    traffic_signs: { ...defaultFaultEntry },
    road_markings: { ...defaultFaultEntry },
    traffic_lights: { ...defaultFaultEntry },
    traffic_controllers: { ...defaultFaultEntry },
    other_road_users: { ...defaultFaultEntry },
  },
  use_of_speed: { ...defaultFaultEntry },
  following_distance: { ...defaultFaultEntry },
  progress: {
    appropriate_speed: { ...defaultFaultEntry },
    undue_hesitation: { ...defaultFaultEntry },
  },
  junctions: {
    approach_speed: { ...defaultFaultEntry },
    observation: { ...defaultFaultEntry },
    turning_right: { ...defaultFaultEntry },
    turning_left: { ...defaultFaultEntry },
    cutting_corners: { ...defaultFaultEntry },
  },
  judgement: {
    overtaking: { ...defaultFaultEntry },
    meeting: { ...defaultFaultEntry },
    crossing: { ...defaultFaultEntry },
  },
  positioning: {
    normal_driving: { ...defaultFaultEntry },
    lane_discipline: { ...defaultFaultEntry },
  },
  pedestrian_crossings: { ...defaultFaultEntry },
  position_normal_stops: { ...defaultFaultEntry },
  awareness_planning: { ...defaultFaultEntry },
  ancillary_controls: { ...defaultFaultEntry },
  eco_safe_driving: { ...defaultFaultEntry },
  spare_1: { ...defaultFaultEntry },
  spare_2: { ...defaultFaultEntry },
  spare_3: { ...defaultFaultEntry },
  spare_4: { ...defaultFaultEntry },
  wheelchair: { pass: false, fail: false },
});
