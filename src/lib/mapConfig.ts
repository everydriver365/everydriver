// Map Configuration - Uses OpenStreetMap (free, no API key required)

export const getMapTileUrl = () => {
  return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
};

export const getMapAttribution = () => {
  return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
};
