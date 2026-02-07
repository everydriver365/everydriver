export interface LatLng {
  lat: number;
  lng: number;
}

export interface Annotation {
  id: string;
  tool: "pen" | "line" | "arrow" | "circle" | "text";
  color: string;
  lineWidth: number;
  /** Geo-anchored points (for pen, line, arrow) */
  points?: LatLng[];
  /** Circle center + radius in meters */
  center?: LatLng;
  radiusMeters?: number;
  /** Text annotation */
  text?: string;
  position?: LatLng;
  fontSize?: number;
}
