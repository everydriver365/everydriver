// DSM brand-styled Google Maps style array.
// Pale, low-saturation palette to match the Up Next tile.
export const dsmMapStyle: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#F0F3F8" }] },
  { elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#FFFFFF" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#E0E5EE" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#F5F7FB" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#D4DAE8" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#C8D8EC" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#DDE8D8" }] },
  { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#E4E8F0" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
];
