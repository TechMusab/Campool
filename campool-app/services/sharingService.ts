import { Alert, Share, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ShareableRide {
  id: string;
  startPoint: string;
  destination: string;
  date: string;
  time: string;
  costPerSeat: number;
  availableSeats: number;
  driverName: string;
  shareCode: string;
}

class SharingService {
  private readonly SHARED_RIDES_KEY = 'shared_rides';

  // Generate share code for ride
  generateShareCode(rideId: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${rideId}_${timestamp}_${random}`.toUpperCase();
  }

  // Create shareable ride data
  createShareableRide(ride: any, driverName: string): ShareableRide {
    return {
      id: ride._id,
      startPoint: ride.startPoint,
      destination: ride.destination,
      date: ride.date,
      time: ride.time,
      costPerSeat: ride.costPerSeat,
      availableSeats: ride.availableSeats,
      driverName,
      shareCode: this.generateShareCode(ride._id)
    };
  }

  // Share ride via native share sheet
  async shareRide(ride: ShareableRide): Promise<void> {
    try {
      const shareMessage = this.createShareMessage(ride);
      const shareUrl = this.createShareUrl(ride);

      await Share.share({
        message: shareMessage,
        url: shareUrl,
        title: 'Check out this ride on Hamraah!'
      });

      // Save shared ride for tracking
      await this.saveSharedRide(ride);
    } catch (error) {
      console.error('Error sharing ride:', error);
      Alert.alert('Error', 'Failed to share ride. Please try again.');
    }
  }

  // Create share message
  private createShareMessage(ride: ShareableRide): string {
    return `🚗 Ride Available on Hamraah!\n\n` +
           `📍 From: ${ride.startPoint}\n` +
           `🎯 To: ${ride.destination}\n` +
           `📅 Date: ${new Date(ride.date).toLocaleDateString()}\n` +
           `⏰ Time: ${ride.time}\n` +
           `💰 Cost: Rs.${ride.costPerSeat} per seat\n` +
           `👤 Driver: ${ride.driverName}\n` +
           `🪑 Seats: ${ride.availableSeats} available\n\n` +
           `Join this ride and save money! 💰\n` +
           `Download Hamraah: https://hamraah.app`;
  }

  // Create share URL
  private createShareUrl(ride: ShareableRide): string {
    return `https://hamraah.app/ride/${ride.shareCode}`;
  }

  // Save shared ride for tracking
  private async saveSharedRide(ride: ShareableRide): Promise<void> {
    try {
      const sharedRides = await this.getSharedRides();
      sharedRides.push({
        ...ride,
        sharedAt: new Date().toISOString(),
        shareCount: 1
      });
      await AsyncStorage.setItem(this.SHARED_RIDES_KEY, JSON.stringify(sharedRides));
    } catch (error) {
      console.error('Error saving shared ride:', error);
    }
  }

  // Get shared rides
  async getSharedRides(): Promise<any[]> {
    try {
      const shared = await AsyncStorage.getItem(this.SHARED_RIDES_KEY);
      return shared ? JSON.parse(shared) : [];
    } catch (error) {
      console.error('Error getting shared rides:', error);
      return [];
    }
  }

  // Handle incoming share link
  async handleShareLink(shareCode: string): Promise<ShareableRide | null> {
    try {
      const sharedRides = await this.getSharedRides();
      const sharedRide = sharedRides.find(ride => ride.shareCode === shareCode);
      return sharedRide || null;
    } catch (error) {
      console.error('Error handling share link:', error);
      return null;
    }
  }

  // Create QR code data for ride
  createQRCodeData(ride: ShareableRide): string {
    return JSON.stringify({
      type: 'hamraah_ride',
      rideId: ride.id,
      shareCode: ride.shareCode,
      timestamp: Date.now()
    });
  }

  // Share via WhatsApp specifically
  async shareViaWhatsApp(ride: ShareableRide): Promise<void> {
    try {
      const message = this.createShareMessage(ride);
      const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
      
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('WhatsApp not installed', 'Please install WhatsApp to share via WhatsApp.');
      }
    } catch (error) {
      console.error('Error sharing via WhatsApp:', error);
      Alert.alert('Error', 'Failed to share via WhatsApp.');
    }
  }

  // Share via SMS
  async shareViaSMS(ride: ShareableRide): Promise<void> {
    try {
      const message = this.createShareMessage(ride);
      const url = `sms:?body=${encodeURIComponent(message)}`;
      
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('SMS not available', 'SMS is not available on this device.');
      }
    } catch (error) {
      console.error('Error sharing via SMS:', error);
      Alert.alert('Error', 'Failed to share via SMS.');
    }
  }

  // Get share statistics
  async getShareStats(): Promise<{ totalShares: number; popularRides: any[] }> {
    try {
      const sharedRides = await this.getSharedRides();
      const totalShares = sharedRides.reduce((sum, ride) => sum + (ride.shareCount || 1), 0);
      
      const popularRides = sharedRides
        .sort((a, b) => (b.shareCount || 1) - (a.shareCount || 1))
        .slice(0, 5);

      return { totalShares, popularRides };
    } catch (error) {
      console.error('Error getting share stats:', error);
      return { totalShares: 0, popularRides: [] };
    }
  }
}

export const sharingService = new SharingService();
