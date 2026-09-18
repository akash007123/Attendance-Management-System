// Geolocation & Geofencing utilities

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate the great-circle distance between two points on the Earth's surface using the Haversine formula.
 * Returns distance in meters.
 */
export function calculateHaversineDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371e3; // Earth radius in meters
  const lat1Rad = (coord1.latitude * Math.PI) / 180;
  const lat2Rad = (coord2.latitude * Math.PI) / 180;
  const deltaLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Check if a location is within the allowed office geofence radius
 */
export function checkGeofence(
  userCoord: Coordinates,
  officeCoord: Coordinates,
  allowedRadiusMeters: number
): { isWithin: boolean; distanceMeters: number } {
  const distanceMeters = calculateHaversineDistance(userCoord, officeCoord);
  return {
    isWithin: distanceMeters <= allowedRadiusMeters,
    distanceMeters,
  };
}

/**
 * Format coordinates for display (e.g. 22.7196° N, 75.8577° E)
 */
export function formatCoordinates(lat: number, lon: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lonDir = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`;
}
