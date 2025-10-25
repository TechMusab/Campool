import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StartedRide {
  rideId: string;
  startPoint: string;
  destination: string;
  date: string;
  time: string;
  cost: number;
  distance: number;
  startedAt: string;
  status: 'started' | 'completed';
  driverInfo: {
    name: string;
    whatsappNumber: string;
    rating: number;
  };
}

const STARTED_RIDES_KEY = 'hamraah_started_rides';

export const rideTrackingService = {
  // Get all started rides
  async getStartedRides(): Promise<StartedRide[]> {
    try {
      const rides = await AsyncStorage.getItem(STARTED_RIDES_KEY);
      if (rides) {
        return JSON.parse(rides);
      }
      return [];
    } catch (error) {
      console.error('Error getting started rides:', error);
      return [];
    }
  },

  // Add a started ride
  async addStartedRide(ride: StartedRide): Promise<void> {
    try {
      const existingRides = await this.getStartedRides();
      const updatedRides = [...existingRides, ride];
      await AsyncStorage.setItem(STARTED_RIDES_KEY, JSON.stringify(updatedRides));
    } catch (error) {
      console.error('Error adding started ride:', error);
    }
  },

  // Check if a ride has been started
  async isRideStarted(rideId: string): Promise<boolean> {
    try {
      const startedRides = await this.getStartedRides();
      return startedRides.some(ride => ride.rideId === rideId);
    } catch (error) {
      console.error('Error checking if ride started:', error);
      return false;
    }
  },

  // Update ride status
  async updateRideStatus(rideId: string, status: 'started' | 'completed'): Promise<void> {
    try {
      const startedRides = await this.getStartedRides();
      const updatedRides = startedRides.map(ride => 
        ride.rideId === rideId ? { ...ride, status } : ride
      );
      await AsyncStorage.setItem(STARTED_RIDES_KEY, JSON.stringify(updatedRides));
    } catch (error) {
      console.error('Error updating ride status:', error);
    }
  },

  // Complete a ride
  async completeRide(rideId: string): Promise<void> {
    try {
      await this.updateRideStatus(rideId, 'completed');
    } catch (error) {
      console.error('Error completing ride:', error);
    }
  },

  // Get recent rides (started rides for dashboard)
  async getRecentRides(): Promise<StartedRide[]> {
    try {
      const startedRides = await this.getStartedRides();
      // Return last 5 rides, sorted by startedAt
      return startedRides
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
        .slice(0, 5);
    } catch (error) {
      console.error('Error getting recent rides:', error);
      return [];
    }
  },

  // Clear all started rides (for testing)
  async clearStartedRides(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STARTED_RIDES_KEY);
    } catch (error) {
      console.error('Error clearing started rides:', error);
    }
  }
};
