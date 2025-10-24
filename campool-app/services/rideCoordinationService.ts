import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'https://campool-l1un.vercel.app';

export interface RideDetails {
  rideId: string;
  driverId: string;
  startPoint: string;
  destination: string;
  date: string;
  time: string;
  costPerSeat: number;
  availableSeats: number;
  passengers: string[];
}

export interface RideCoordination {
  rideId: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  pickupLocation?: {
    lat: number;
    lng: number;
    address: string;
  };
  dropoffLocation?: {
    lat: number;
    lng: number;
    address: string;
  };
  estimatedArrival?: string;
  actualArrival?: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  reminders: {
    rideReminder: boolean;
    paymentReminder: boolean;
    arrivalReminder: boolean;
  };
}

class RideCoordinationService {
  private rides: Map<string, RideCoordination> = new Map();

  // Initialize ride coordination
  async initializeRide(rideDetails: RideDetails): Promise<RideCoordination> {
    const coordination: RideCoordination = {
      rideId: rideDetails.rideId,
      status: 'pending',
      paymentStatus: 'pending',
      reminders: {
        rideReminder: false,
        paymentReminder: false,
        arrivalReminder: false,
      },
    };

    this.rides.set(rideDetails.rideId, coordination);
    await this.saveToStorage();
    
    // Auto-confirm if conditions are met
    await this.autoConfirmRide(rideDetails);
    
    return coordination;
  }

  // Auto-confirm ride based on conditions
  private async autoConfirmRide(rideDetails: RideDetails): Promise<void> {
    try {
      // Check if driver has good rating and is verified
      const driverResponse = await axios.get(`${API_BASE}/users/${rideDetails.driverId}`);
      const driver = driverResponse.data;
      
      if (driver.avgRating >= 4.0 && driver.status === 'verified') {
        await this.updateRideStatus(rideDetails.rideId, 'confirmed');
        
        // Send confirmation notification
        const { notifyRideConfirmed } = await import('@/services/notificationService');
        await notifyRideConfirmed(rideDetails);
        
        // Schedule reminders
        await this.scheduleRideReminders(rideDetails);
      }
    } catch (error) {
      console.error('Error auto-confirming ride:', error);
    }
  }

  // Update ride status
  async updateRideStatus(rideId: string, status: RideCoordination['status']): Promise<void> {
    const coordination = this.rides.get(rideId);
    if (coordination) {
      coordination.status = status;
      this.rides.set(rideId, coordination);
      await this.saveToStorage();
    }
  }

  // Update pickup location
  async updatePickupLocation(rideId: string, location: RideCoordination['pickupLocation']): Promise<void> {
    const coordination = this.rides.get(rideId);
    if (coordination) {
      coordination.pickupLocation = location;
      this.rides.set(rideId, coordination);
      await this.saveToStorage();
    }
  }

  // Update estimated arrival
  async updateEstimatedArrival(rideId: string, eta: string): Promise<void> {
    const coordination = this.rides.get(rideId);
    if (coordination) {
      coordination.estimatedArrival = eta;
      this.rides.set(rideId, coordination);
      await this.saveToStorage();
      
      // Send notification
      const { notifyDriverArriving } = await import('@/services/notificationService');
      await notifyDriverArriving(eta);
    }
  }

  // Schedule automated reminders
  private async scheduleRideReminders(rideDetails: RideDetails): Promise<void> {
    const rideDate = new Date(rideDetails.date);
    const now = new Date();
    
    // Schedule ride reminder (1 hour before)
    const reminderTime = new Date(rideDate.getTime() - 60 * 60 * 1000);
    if (reminderTime > now) {
      setTimeout(async () => {
        const { notifyRideReminder } = await import('@/services/notificationService');
        await notifyRideReminder(rideDetails);
        
        const coordination = this.rides.get(rideDetails.rideId);
        if (coordination) {
          coordination.reminders.rideReminder = true;
          this.rides.set(rideDetails.rideId, coordination);
          await this.saveToStorage();
        }
      }, reminderTime.getTime() - now.getTime());
    }

    // Schedule payment reminder (if not paid after 30 minutes)
    setTimeout(async () => {
      const coordination = this.rides.get(rideDetails.rideId);
      if (coordination && coordination.paymentStatus === 'pending') {
        const { notifyPaymentReminder } = await import('@/services/notificationService');
        await notifyPaymentReminder(rideDetails.costPerSeat);
        
        coordination.reminders.paymentReminder = true;
        this.rides.set(rideDetails.rideId, coordination);
        await this.saveToStorage();
      }
    }, 30 * 60 * 1000); // 30 minutes
  }

  // Complete ride
  async completeRide(rideId: string): Promise<void> {
    const coordination = this.rides.get(rideId);
    if (coordination) {
      coordination.status = 'completed';
      coordination.actualArrival = new Date().toISOString();
      this.rides.set(rideId, coordination);
      await this.saveToStorage();
      
      // Send completion notification
      const { notifyRideCompleted } = await import('@/services/notificationService');
      await notifyRideCompleted({ rideId });
    }
  }

  // Get ride coordination
  getRideCoordination(rideId: string): RideCoordination | undefined {
    return this.rides.get(rideId);
  }

  // Get all rides
  getAllRides(): RideCoordination[] {
    return Array.from(this.rides.values());
  }

  // Save to storage
  private async saveToStorage(): Promise<void> {
    const data = Object.fromEntries(this.rides);
    await AsyncStorage.setItem('ride_coordination', JSON.stringify(data));
  }

  // Load from storage
  async loadFromStorage(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('ride_coordination');
      if (data) {
        const parsed = JSON.parse(data);
        this.rides = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('Error loading ride coordination from storage:', error);
    }
  }

  // Smart matching for rides
  async findMatchingRides(userLocation: { lat: number; lng: number }, destination: string, time: string): Promise<RideDetails[]> {
    try {
      const response = await axios.get(`${API_BASE}/rides/smart-match`, {
        params: {
          userLat: userLocation.lat,
          userLng: userLocation.lng,
          destination,
          time,
        },
      });
      return response.data.rides || [];
    } catch (error) {
      console.error('Error finding matching rides:', error);
      return [];
    }
  }

  // Auto-join ride if conditions are met
  async autoJoinRide(rideId: string, userId: string): Promise<boolean> {
    try {
      const response = await axios.post(`${API_BASE}/rides/${rideId}/auto-join`, {
        userId,
      });
      
      if (response.data.success) {
        // Update local coordination
        const coordination = this.rides.get(rideId);
        if (coordination) {
          coordination.status = 'confirmed';
          this.rides.set(rideId, coordination);
          await this.saveToStorage();
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error auto-joining ride:', error);
      return false;
    }
  }
}

export default new RideCoordinationService();
