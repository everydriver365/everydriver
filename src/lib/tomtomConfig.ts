// TomTom Map Configuration
// API key should be set as VITE_TOMTOM_API_KEY environment variable

export const TOMTOM_API_KEY = import.meta.env.VITE_TOMTOM_API_KEY || '';

export const getTomTomTileUrl = () => {
  if (!TOMTOM_API_KEY) {
    // Fallback to OpenStreetMap if TomTom API key is not configured
    console.warn('TomTom API key not configured, using OpenStreetMap fallback');
    return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  }
  return `https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=${TOMTOM_API_KEY}`;
};

export const getTomTomAttribution = () => {
  if (!TOMTOM_API_KEY) {
    return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
  }
  return '&copy; <a href="https://www.tomtom.com">TomTom</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
};

export const isTomTomConfigured = () => !!TOMTOM_API_KEY;
