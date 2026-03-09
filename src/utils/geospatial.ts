/**
 * Geospatial Utilities
 * Haversine formula and distance calculation functions
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculates the distance between two points using the Haversine formula
 * @param point1 First coordinate point
 * @param point2 Second coordinate point
 * @returns Distance in kilometers
 */
export function calculateHaversineDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  const R = 6371; // Earth's radius in kilometers

  const lat1Rad = toRadians(point1.latitude);
  const lat2Rad = toRadians(point2.latitude);
  const deltaLat = toRadians(point2.latitude - point1.latitude);
  const deltaLon = toRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Converts degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Converts a stored PostGIS point to Coordinates.
 *
 * Accepts:
 *  - GeoJSON object: { type: "Point", coordinates: [lon, lat] }
 *  - "POINT(lon lat)" string
 *  - "lon,lat" or "(lon,lat)" string
 *  - WKB hex string from PostGIS/Supabase (e.g. 0101000020E61000...)
 */
export function parsePostGISPoint(
  geojson: string | { type: string; coordinates: number[] } | null | undefined
): Coordinates | null {
  try {
    // Case 1: already a GeoJSON object
    if (geojson && typeof geojson === 'object') {
      const geo = geojson as { type: string; coordinates: number[] };
      if (geo.type === 'Point' && Array.isArray(geo.coordinates)) {
        return {
          longitude: geo.coordinates[0],
          latitude: geo.coordinates[1],
        };
      }
      return null;
    }

    // Case 2: string formats
    if (typeof geojson === 'string') {
      const trimmed = geojson.trim();

      // POINT(lon lat)
      const pointMatch = trimmed.match(
        /^POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)$/i
      );
      if (pointMatch) {
        return {
          longitude: parseFloat(pointMatch[1]),
          latitude: parseFloat(pointMatch[2]),
        };
      }

      // (lon,lat) or lon,lat
      const tupleMatch = trimmed.match(
        /^\(?\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)?$/
      );
      if (tupleMatch) {
        return {
          longitude: parseFloat(tupleMatch[1]),
          latitude: parseFloat(tupleMatch[2]),
        };
      }

      // NEW: WKB hex from PostGIS / Supabase geography(point,4326)
      // Example: 0101000020E61000008C0D82339D425340E32C36F7A11C2640
      if (/^[0-9A-Fa-f]+$/.test(trimmed)) {
        const buffer = hexToArrayBuffer(trimmed);
        const view = new DataView(buffer);

        // EWKB layout (little endian):
        // byte 0: endianness
        // bytes 1-4: type + flags
        // bytes 5-8: SRID (because of 0x20 flag)
        // bytes 9-16: longitude (float64)
        // bytes 17-24: latitude  (float64)
        const littleEndian = true;
        const lon = view.getFloat64(9, littleEndian);
        const lat = view.getFloat64(17, littleEndian);

        return {
          longitude: lon,
          latitude: lat,
        };
      }

      // Unknown string format
      return null;
    }

    return null;
  } catch (error) {
    console.error('Error parsing PostGIS point:', error);
    return null;
  }
}

/**
 * Helper: converts hex string to ArrayBuffer
 */
function hexToArrayBuffer(hex: string): ArrayBuffer {
  const length = hex.length / 2;
  const buffer = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    buffer[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return buffer.buffer;
}

/**
 * Creates a PostGIS POINT string from coordinates
 * @param coords Latitude and longitude
 */
export function createPostGISPoint(coords: Coordinates): string {
  return `POINT(${coords.longitude} ${coords.latitude})`;
}

/**
 * Gets the user's current location using the browser's Geolocation API
 */
export function getCurrentLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Validates coordinates
 */
export function isValidCoordinates(coords: Coordinates): boolean {
  return (
    typeof coords.latitude === 'number' &&
    typeof coords.longitude === 'number' &&
    coords.latitude >= -90 &&
    coords.latitude <= 90 &&
    coords.longitude >= -180 &&
    coords.longitude <= 180
  );
}

/**
 * Formats distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}
