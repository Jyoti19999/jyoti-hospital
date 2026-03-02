// src/utils/geofencing.js

// Hospital coordinates from environment variables
const HOSPITAL_COORDINATES = {
  latitude: parseFloat(process.env.HOSPITAL_LATITUDE || '18.64708126832894'),
  longitude: parseFloat(process.env.HOSPITAL_LONGITUDE || '73.84803671386994')
};

// Allowed geofence radius in meters from environment variable
const ALLOWED_RADIUS = parseInt(process.env.HOSPITAL_GEOFENCE_RADIUS || '100');

console.log(`🏥 Hospital coordinates: ${HOSPITAL_COORDINATES.latitude}, ${HOSPITAL_COORDINATES.longitude}`);
console.log(`📡 Geofence radius: ${ALLOWED_RADIUS} meters`);

class GeofencingService {
  /**
   * Calculate distance between two points using Haversine formula
   * @param {number} lat1 - Latitude of first point
   * @param {number} lon1 - Longitude of first point
   * @param {number} lat2 - Latitude of second point
   * @param {number} lon2 - Longitude of second point
   * @returns {number} Distance in meters
   */
  static calculateDistance(lat1, lon1, lat2, lon2) {
    // Validate inputs
    if (!this.isValidCoordinate(lat1, lon1) || !this.isValidCoordinate(lat2, lon2)) {
      throw new Error('Invalid coordinates provided');
    }

    // Radius of Earth in meters
    const R = 6371000;
    
    // Convert degrees to radians
    const lat1Rad = (lat1 * Math.PI) / 180;
    const lat2Rad = (lat2 * Math.PI) / 180;
    const deltaLatRad = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLonRad = ((lon2 - lon1) * Math.PI) / 180;

    // Haversine formula
    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    // Distance in meters
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Check if coordinates are within hospital geofence
   * @param {number} latitude - User's latitude
   * @param {number} longitude - User's longitude
   * @returns {Object} Geofence check result
   */
  static checkGeofence(latitude, longitude) {
    try {
      // Validate user coordinates
      if (!this.isValidCoordinate(latitude, longitude)) {
        return {
          isWithinGeofence: false,
          distance: null,
          allowedRadius: ALLOWED_RADIUS,
          hospitalCoordinates: HOSPITAL_COORDINATES,
          error: 'Invalid user coordinates'
        };
      }

      // Calculate distance from hospital
      const distance = this.calculateDistance(
        latitude,
        longitude,
        HOSPITAL_COORDINATES.latitude,
        HOSPITAL_COORDINATES.longitude
      );

      const isWithinGeofence = distance <= ALLOWED_RADIUS;

      console.log(
        isWithinGeofence ? 
        `✅ User is within geofence (${distance}m from hospital)` :
        `❌ User is outside geofence (${distance}m from hospital, limit: ${ALLOWED_RADIUS}m)`
      );

      return {
        isWithinGeofence,
        distance,
        allowedRadius: ALLOWED_RADIUS,
        hospitalCoordinates: HOSPITAL_COORDINATES,
        userCoordinates: {
          latitude,
          longitude
        },
        message: isWithinGeofence ? 
          `You are within hospital premises (${distance}m from center)` :
          `You are ${distance}m away from hospital premises. You need to be within ${ALLOWED_RADIUS}m to mark attendance.`
      };
    } catch (error) {
      console.error('Error checking geofence:', error);
      return {
        isWithinGeofence: false,
        distance: null,
        allowedRadius: ALLOWED_RADIUS,
        hospitalCoordinates: HOSPITAL_COORDINATES,
        error: error.message
      };
    }
  }

  /**
   * Validate if coordinates are valid
   * @param {number} latitude - Latitude to validate
   * @param {number} longitude - Longitude to validate
   * @returns {boolean} True if valid
   */
  static isValidCoordinate(latitude, longitude) {
    // Check if coordinates are numbers
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return false;
    }

    // Check if coordinates are within valid ranges
    const isValidLat = latitude >= -90 && latitude <= 90;
    const isValidLon = longitude >= -180 && longitude <= 180;

    // Check if coordinates are not exactly 0,0 (likely default/error value)
    const isNotDefault = !(latitude === 0 && longitude === 0);

    return isValidLat && isValidLon && isNotDefault;
  }

  /**
   * Get hospital location info
   * @returns {Object} Hospital location information
   */
  static getHospitalInfo() {
    return {
      name: 'Hospital OHMS',
      coordinates: HOSPITAL_COORDINATES,
      geofenceRadius: ALLOWED_RADIUS,
      geofenceRadiusUnit: 'meters'
    };
  }

  /**
   * Check if coordinates are within a custom geofence
   * @param {number} userLat - User's latitude
   * @param {number} userLon - User's longitude
   * @param {number} centerLat - Center point latitude
   * @param {number} centerLon - Center point longitude
   * @param {number} radiusMeters - Radius in meters
   * @returns {Object} Geofence check result
   */
  static checkCustomGeofence(userLat, userLon, centerLat, centerLon, radiusMeters) {
    try {
      if (!this.isValidCoordinate(userLat, userLon) || !this.isValidCoordinate(centerLat, centerLon)) {
        throw new Error('Invalid coordinates');
      }

      if (!radiusMeters || radiusMeters <= 0) {
        throw new Error('Invalid radius');
      }

      const distance = this.calculateDistance(userLat, userLon, centerLat, centerLon);
      const isWithinGeofence = distance <= radiusMeters;

      return {
        isWithinGeofence,
        distance,
        allowedRadius: radiusMeters,
        centerCoordinates: {
          latitude: centerLat,
          longitude: centerLon
        },
        userCoordinates: {
          latitude: userLat,
          longitude: userLon
        }
      };
    } catch (error) {
      console.error('Error checking custom geofence:', error);
      throw error;
    }
  }

  /**
   * Get distance in different units
   * @param {number} distanceMeters - Distance in meters
   * @returns {Object} Distance in various units
   */
  static convertDistance(distanceMeters) {
    return {
      meters: Math.round(distanceMeters * 100) / 100,
      kilometers: Math.round((distanceMeters / 1000) * 100) / 100,
      feet: Math.round((distanceMeters * 3.28084) * 100) / 100,
      miles: Math.round((distanceMeters / 1609.344) * 100) / 100
    };
  }
}

module.exports = GeofencingService;