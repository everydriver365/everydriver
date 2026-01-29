// Map Configuration - Uses OpenStreetMap with light theme

export const getMapTileUrl = () => {
  // Light theme using CartoDB Positron (clean, minimal style)
  return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
};

export const getMapAttribution = () => {
  return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
};
