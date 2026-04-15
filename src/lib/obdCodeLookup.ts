/**
 * Local OBD-II DTC code lookup for common fault codes.
 * Falls back to the original description if no match is found.
 */
const OBD_CODES: Record<string, string> = {
  // Powertrain - Fuel & Air Metering
  P0100: "Mass Air Flow (MAF) Circuit Malfunction",
  P0101: "Mass Air Flow (MAF) Circuit Range/Performance",
  P0102: "Mass Air Flow (MAF) Circuit Low Input",
  P0103: "Mass Air Flow (MAF) Circuit High Input",
  P0104: "Mass Air Flow (MAF) Circuit Intermittent",
  P0105: "Manifold Absolute Pressure (MAP) Circuit Malfunction",
  P0106: "MAP/Barometric Pressure Circuit Range/Performance",
  P0107: "MAP/Barometric Pressure Circuit Low Input",
  P0108: "MAP/Barometric Pressure Circuit High Input",
  P0110: "Intake Air Temperature Circuit Malfunction",
  P0111: "Intake Air Temperature Circuit Range/Performance",
  P0112: "Intake Air Temperature Circuit Low Input",
  P0113: "Intake Air Temperature Circuit High Input",
  P0115: "Engine Coolant Temperature Circuit Malfunction",
  P0116: "Engine Coolant Temperature Circuit Range/Performance",
  P0117: "Engine Coolant Temperature Circuit Low Input",
  P0118: "Engine Coolant Temperature Circuit High Input",
  P0120: "Throttle Position Sensor Circuit Malfunction",
  P0121: "Throttle Position Sensor Circuit Range/Performance",
  P0122: "Throttle Position Sensor Circuit Low Input",
  P0123: "Throttle Position Sensor Circuit High Input",
  P0125: "Insufficient Coolant Temperature for Closed Loop",
  P0128: "Coolant Thermostat Below Regulating Temperature",
  P0130: "O2 Sensor Circuit Malfunction (Bank 1, Sensor 1)",
  P0131: "O2 Sensor Circuit Low Voltage (Bank 1, Sensor 1)",
  P0132: "O2 Sensor Circuit High Voltage (Bank 1, Sensor 1)",
  P0133: "O2 Sensor Circuit Slow Response (Bank 1, Sensor 1)",
  P0134: "O2 Sensor Circuit No Activity (Bank 1, Sensor 1)",
  P0135: "O2 Sensor Heater Circuit Malfunction (Bank 1, Sensor 1)",
  P0136: "O2 Sensor Circuit Malfunction (Bank 1, Sensor 2)",
  P0137: "O2 Sensor Circuit Low Voltage (Bank 1, Sensor 2)",
  P0138: "O2 Sensor Circuit High Voltage (Bank 1, Sensor 2)",
  P0139: "O2 Sensor Circuit Slow Response (Bank 1, Sensor 2)",
  P0140: "O2 Sensor Circuit No Activity (Bank 1, Sensor 2)",
  P0141: "O2 Sensor Heater Circuit Malfunction (Bank 1, Sensor 2)",
  P0171: "System Too Lean (Bank 1)",
  P0172: "System Too Rich (Bank 1)",
  P0174: "System Too Lean (Bank 2)",
  P0175: "System Too Rich (Bank 2)",

  // Fuel & Air Metering (Injector Circuit)
  P0200: "Injector Circuit Malfunction",
  P0201: "Injector Circuit Malfunction – Cylinder 1",
  P0202: "Injector Circuit Malfunction – Cylinder 2",
  P0203: "Injector Circuit Malfunction – Cylinder 3",
  P0204: "Injector Circuit Malfunction – Cylinder 4",
  P0217: "Engine Overtemperature Condition",
  P0218: "Transmission Over Temperature Condition",
  P0219: "Engine Overspeed Condition",
  P0220: "Throttle/Pedal Position Sensor B Circuit",
  P0221: "Throttle/Pedal Position Sensor B Range/Performance",
  P0222: "Throttle/Pedal Position Sensor B Circuit Low",
  P0223: "Throttle/Pedal Position Sensor B Circuit High",

  // Ignition System
  P0300: "Random/Multiple Cylinder Misfire Detected",
  P0301: "Cylinder 1 Misfire Detected",
  P0302: "Cylinder 2 Misfire Detected",
  P0303: "Cylinder 3 Misfire Detected",
  P0304: "Cylinder 4 Misfire Detected",
  P0305: "Cylinder 5 Misfire Detected",
  P0306: "Cylinder 6 Misfire Detected",
  P0325: "Knock Sensor 1 Circuit Malfunction",
  P0335: "Crankshaft Position Sensor A Circuit Malfunction",
  P0336: "Crankshaft Position Sensor A Range/Performance",
  P0340: "Camshaft Position Sensor Circuit Malfunction",
  P0341: "Camshaft Position Sensor Range/Performance",

  // Emission Controls
  P0400: "Exhaust Gas Recirculation (EGR) Flow Malfunction",
  P0401: "EGR Flow Insufficient Detected",
  P0402: "EGR Flow Excessive Detected",
  P0410: "Secondary Air Injection System Malfunction",
  P0411: "Secondary Air Injection System Incorrect Flow",
  P0420: "Catalyst System Efficiency Below Threshold (Bank 1)",
  P0421: "Warm Up Catalyst Efficiency Below Threshold (Bank 1)",
  P0430: "Catalyst System Efficiency Below Threshold (Bank 2)",
  P0440: "Evaporative Emission System Malfunction",
  P0441: "Evaporative Emission System Incorrect Purge Flow",
  P0442: "Evaporative Emission System Leak Detected (Small)",
  P0443: "Evaporative Emission System Purge Control Valve Circuit",
  P0446: "Evaporative Emission System Vent Control Circuit",
  P0449: "Evaporative Emission System Vent Valve/Solenoid Circuit",
  P0455: "Evaporative Emission System Leak Detected (Gross/Large)",
  P0456: "Evaporative Emission System Leak Detected (Very Small)",

  // Speed/Idle Control
  P0500: "Vehicle Speed Sensor Malfunction",
  P0501: "Vehicle Speed Sensor Range/Performance",
  P0505: "Idle Control System Malfunction",
  P0506: "Idle Control System RPM Lower Than Expected",
  P0507: "Idle Control System RPM Higher Than Expected",

  // Computer & Auxiliary
  P0600: "Serial Communication Link Malfunction",
  P0601: "Internal Control Module Memory Check Sum Error",
  P0602: "Control Module Programming Error",
  P0606: "PCM Processor Fault",

  // Transmission
  P0700: "Transmission Control System Malfunction",
  P0705: "Transmission Range Sensor Circuit Malfunction",
  P0715: "Input/Turbine Speed Sensor Circuit Malfunction",
  P0720: "Output Speed Sensor Circuit Malfunction",
  P0725: "Engine Speed Input Circuit Malfunction",
  P0730: "Incorrect Gear Ratio",
  P0740: "Torque Converter Clutch Circuit Malfunction",
  P0741: "Torque Converter Clutch Circuit Stuck Off",
  P0750: "Shift Solenoid A Malfunction",
  P0755: "Shift Solenoid B Malfunction",
  P0760: "Shift Solenoid C Malfunction",

  // Extended codes (P00xx range)
  P00BD: "Mass Air Flow 'A' Circuit – Air Flow Too High",
  P00BE: "Mass Air Flow 'B' Circuit – Air Flow Too High",
  P00BC: "Mass Air Flow 'A' Circuit – Air Flow Too Low",
  P00BF: "Mass Air Flow 'B' Circuit – Air Flow Too Low",

  // Common Toyota/Hybrid codes
  P0A80: "Replace Hybrid Battery Pack",
  P0A7F: "Hybrid Battery Pack Deterioration",
  P3190: "Engine Does Not Start – Poor Fuel Quality",

  // Body & Chassis (Bxxxx, Cxxxx)
  B1000: "ECU Malfunction (Internal)",
  C1201: "Engine Control System Malfunction",
  C1241: "Low Battery Positive Voltage",
  C1249: "Open in Stop Light Switch Circuit",
};

/** Severity hints based on code patterns */
const SEVERITY_HINTS: Record<string, string> = {
  P0217: "critical",  // Engine overtemp
  P0219: "warning",   // Overspeed
  P0300: "warning",   // Misfire
  P0301: "warning",
  P0302: "warning",
  P0303: "warning",
  P0304: "warning",
  P0420: "warning",   // Catalyst
  P0A80: "critical",  // Hybrid battery
};

export interface EnrichedFault {
  code: string;
  source: string;
  severity: string;
  description: string;
  enrichedDescription: string | null;
}

/**
 * Enriches a fault code with a human-readable description from the local lookup.
 * If the code is not found, returns the original description.
 */
export function enrichFaultCode(fault: {
  code: string;
  source?: string;
  severity?: string;
  description?: string;
}): EnrichedFault {
  const code = fault.code?.toUpperCase().trim();
  const lookup = code ? OBD_CODES[code] : null;
  const severityHint = code ? SEVERITY_HINTS[code] : null;

  return {
    code: fault.code,
    source: fault.source || "Unknown",
    severity: severityHint || fault.severity || "Unknown",
    description: lookup || fault.description || "Unknown fault code",
    enrichedDescription: lookup || null,
  };
}

/**
 * Checks if the original description is generic/unhelpful
 */
export function isGenericDescription(desc: string | undefined): boolean {
  if (!desc) return true;
  const lower = desc.toLowerCase();
  return (
    lower.includes("unrecognised") ||
    lower.includes("unrecognized") ||
    lower.includes("unknown") ||
    lower === "no description available"
  );
}
