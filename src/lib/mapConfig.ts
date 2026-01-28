// Map Configuration - Uses OpenStreetMap with dark theme option

export const getMapTileUrl = (theme: 'light' | 'dark' = 'light') => {
  if (theme === 'dark') {
    // Dark theme using CartoDB Dark Matter
    return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  }
  return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
};

export const getMapAttribution = (theme: 'light' | 'dark' = 'light') => {
  if (theme === 'dark') {
    return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
  }
  return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
};
