import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  data?: any;
}

class NotificationService {
  private expoPushToken: string | null = null;

  async initialize(): Promise<string | null> {
    try {
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.log('Failed to get push token for push notification!');
          return null;
        }
        
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        
        this.expoPushToken = token.data;
        console.log('Expo push token:', this.expoPushToken);
        return this.expoPushToken;
      } else {
        console.log('Must use physical device for Push Notifications');
        return null;
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return null;
    }
  }

  async sendLocalNotification(notification: NotificationData): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending local notification:', error);
    }
  }

  // Ride-specific notifications
  async notifyRideConfirmed(rideDetails: any): Promise<void> {
    await this.sendLocalNotification({
      title: '🚗 Ride Confirmed!',
      body: `Your ride from ${rideDetails.startPoint} to ${rideDetails.destination} is confirmed for ${rideDetails.date}`,
      data: { type: 'ride_confirmed', rideId: rideDetails.rideId }
    });
  }

  async notifyDriverArriving(eta: string): Promise<void> {
    await this.sendLocalNotification({
      title: '🚗 Driver Arriving Soon',
      body: `Your driver will arrive in ${eta}. Please be ready at the pickup location.`,
      data: { type: 'driver_arriving', eta }
    });
  }

  async notifyPaymentReminder(amount: number): Promise<void> {
    await this.sendLocalNotification({
      title: '💰 Payment Reminder',
      body: `Please complete your payment of $${amount} for your ride.`,
      data: { type: 'payment_reminder', amount }
    });
  }

  async notifyRideReminder(rideDetails: any): Promise<void> {
    await this.sendLocalNotification({
      title: '⏰ Ride Reminder',
      body: `Don't forget: Your ride is scheduled for ${rideDetails.time} from ${rideDetails.startPoint}`,
      data: { type: 'ride_reminder', rideId: rideDetails.rideId }
    });
  }

  async notifyNewMessage(senderName: string, message: string): Promise<void> {
    await this.sendLocalNotification({
      title: `💬 New message from ${senderName}`,
      body: message.length > 50 ? `${message.substring(0, 50)}...` : message,
      data: { type: 'new_message', senderName }
    });
  }

  async notifyRideCompleted(rideDetails: any): Promise<void> {
    await this.sendLocalNotification({
      title: '✅ Ride Completed',
      body: `Thank you for using Campool! Please rate your ride experience.`,
      data: { type: 'ride_completed', rideId: rideDetails.rideId }
    });
  }

  async notifyEmergency(): Promise<void> {
    await this.sendLocalNotification({
      title: '🚨 Emergency Alert',
      body: 'Emergency contacts have been notified of your location.',
      data: { type: 'emergency' }
    });
  }

  // Get the push token for server-side notifications
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  // Listen for notification responses
  addNotificationResponseListener(listener: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  // Listen for notifications received while app is in foreground
  addNotificationReceivedListener(listener: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(listener);
  }
}

export default new NotificationService();
