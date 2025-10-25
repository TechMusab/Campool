import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  speed?: number;
  heading?: number;
}

export interface RideLocation {
  rideId: string;
  driverId: string;
  passengerIds: string[];
  startLocation: LocationData;
  currentLocation: LocationData;
  destination: LocationData;
  isActive: boolean;
  lastUpdated: string;
}

class LocationService {
  private readonly LOCATION_KEY = 'ride_locations';
  private readonly PERMISSIONS_KEY = 'location_permissions';
  private watchId: Location.LocationSubscription | null = null;

  // Request location permissions
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return false;
      }

      const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus.status !== 'granted') {
        return false;
      }

      await AsyncStorage.setItem(this.PERMISSIONS_KEY, 'granted');
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }

  // Check if permissions are granted
  async hasPermissions(): Promise<boolean> {
    try {
      const status = await Location.getForegroundPermissionsAsync();
      return status.status === 'granted';
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  // Get current location
  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.hasPermissions();
      if (!hasPermission) {
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 10000, // 10 seconds
        timeout: 15000 // 15 seconds
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || 0,
        timestamp: new Date().toISOString(),
        speed: location.coords.speed || undefined,
        heading: location.coords.heading || undefined
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  // Start location tracking for a ride
  async startRideTracking(rideId: string, driverId: string, passengerIds: string[]): Promise<boolean> {
    try {
      const hasPermission = await this.hasPermissions();
      if (!hasPermission) {
        return false;
      }

      const currentLocation = await this.getCurrentLocation();
      if (!currentLocation) {
        return false;
      }

      const rideLocation: RideLocation = {
        rideId,
        driverId,
        passengerIds,
        startLocation: currentLocation,
        currentLocation,
        destination: currentLocation, // Will be updated when destination is set
        isActive: true,
        lastUpdated: new Date().toISOString()
      };

      await this.saveRideLocation(rideLocation);

      // Start watching location
      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 30000, // Update every 30 seconds
          distanceInterval: 100, // Update every 100 meters
        },
        (location) => {
          this.updateRideLocation(rideId, {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || 0,
            timestamp: new Date().toISOString(),
            speed: location.coords.speed || undefined,
            heading: location.coords.heading || undefined
          });
        }
      );

      return true;
    } catch (error) {
      console.error('Error starting ride tracking:', error);
      return false;
    }
  }

  // Stop location tracking
  async stopRideTracking(rideId: string): Promise<void> {
    try {
      if (this.watchId) {
        this.watchId.remove();
        this.watchId = null;
      }

      const rideLocation = await this.getRideLocation(rideId);
      if (rideLocation) {
        rideLocation.isActive = false;
        await this.saveRideLocation(rideLocation);
      }
    } catch (error) {
      console.error('Error stopping ride tracking:', error);
    }
  }

  // Update ride location
  async updateRideLocation(rideId: string, location: LocationData): Promise<void> {
    try {
      const rideLocation = await this.getRideLocation(rideId);
      if (rideLocation) {
        rideLocation.currentLocation = location;
        rideLocation.lastUpdated = new Date().toISOString();
        await this.saveRideLocation(rideLocation);
      }
    } catch (error) {
      console.error('Error updating ride location:', error);
    }
  }

  // Set destination for ride
  async setRideDestination(rideId: string, destination: LocationData): Promise<void> {
    try {
      const rideLocation = await this.getRideLocation(rideId);
      if (rideLocation) {
        rideLocation.destination = destination;
        await this.saveRideLocation(rideLocation);
      }
    } catch (error) {
      console.error('Error setting ride destination:', error);
    }
  }

  // Get ride location
  async getRideLocation(rideId: string): Promise<RideLocation | null> {
    try {
      const locations = await this.getAllRideLocations();
      return locations.find(loc => loc.rideId === rideId) || null;
    } catch (error) {
      console.error('Error getting ride location:', error);
      return null;
    }
  }

  // Get all ride locations
  async getAllRideLocations(): Promise<RideLocation[]> {
    try {
      const locations = await AsyncStorage.getItem(this.LOCATION_KEY);
      return locations ? JSON.parse(locations) : [];
    } catch (error) {
      console.error('Error getting all ride locations:', error);
      return [];
    }
  }

  // Save ride location
  private async saveRideLocation(rideLocation: RideLocation): Promise<void> {
    try {
      const locations = await this.getAllRideLocations();
      const existingIndex = locations.findIndex(loc => loc.rideId === rideLocation.rideId);
      
      if (existingIndex >= 0) {
        locations[existingIndex] = rideLocation;
      } else {
        locations.push(rideLocation);
      }

      await AsyncStorage.setItem(this.LOCATION_KEY, JSON.stringify(locations));
    } catch (error) {
      console.error('Error saving ride location:', error);
    }
  }

  // Calculate distance between two points
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  // Get ETA to destination
  async getETA(rideId: string): Promise<{ distance: number; eta: string } | null> {
    try {
      const rideLocation = await this.getRideLocation(rideId);
      if (!rideLocation || !rideLocation.isActive) {
        return null;
      }

      const distance = this.calculateDistance(
        rideLocation.currentLocation.latitude,
        rideLocation.currentLocation.longitude,
        rideLocation.destination.latitude,
        rideLocation.destination.longitude
      );

      // Estimate ETA based on average speed (assuming 30 km/h in city traffic)
      const averageSpeed = 30; // km/h
      const etaMinutes = Math.round((distance / averageSpeed) * 60);
      const eta = `${etaMinutes} min`;

      return { distance: Math.round(distance * 100) / 100, eta };
    } catch (error) {
      console.error('Error calculating ETA:', error);
      return null;
    }
  }

  // Get nearby rides
  async getNearbyRides(userLat: number, userLon: number, radiusKm: number = 5): Promise<RideLocation[]> {
    try {
      const allLocations = await this.getAllRideLocations();
      const nearbyRides: RideLocation[] = [];

      for (const ride of allLocations) {
        if (ride.isActive) {
          const distance = this.calculateDistance(
            userLat, userLon,
            ride.currentLocation.latitude,
            ride.currentLocation.longitude
          );

          if (distance <= radiusKm) {
            nearbyRides.push(ride);
          }
        }
      }

      return nearbyRides;
    } catch (error) {
      console.error('Error getting nearby rides:', error);
      return [];
    }
  }

  // Clear old location data
  async clearOldLocations(): Promise<void> {
    try {
      const locations = await this.getAllRideLocations();
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const recentLocations = locations.filter(loc => 
        new Date(loc.lastUpdated) > oneDayAgo
      );

      await AsyncStorage.setItem(this.LOCATION_KEY, JSON.stringify(recentLocations));
    } catch (error) {
      console.error('Error clearing old locations:', error);
    }
  }
}

export const locationService = new LocationService();
