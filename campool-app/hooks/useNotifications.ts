import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import notificationService from '@/services/notificationService';
import Constants from 'expo-constants';

export function useNotifications() {
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Only initialize notifications if not in Expo Go or if explicitly enabled
    if (Constants.appOwnership !== 'expo') {
      notificationService.initialize();
    } else {
      console.log('Notifications disabled in Expo Go - use development build for full functionality');
    }

    // Listen for notifications received while app is in foreground
    notificationListener.current = notificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
      }
    );

    // Listen for notification responses (when user taps on notification)
    responseListener.current = notificationService.addNotificationResponseListener(
      (response) => {
        const data = response.notification.request.content.data;
        
        // Handle different notification types
        switch (data?.type) {
          case 'ride_confirmed':
            router.push(`/chat/${data.rideId}`);
            break;
          case 'new_message':
            router.push(`/chat/${data.rideId}`);
            break;
          case 'ride_completed':
            router.push(`/driver/${data.driverId}`);
            break;
          case 'payment_reminder':
            router.push('/post-ride');
            break;
          case 'emergency':
            // Handle emergency case
            break;
          default:
            console.log('Unknown notification type:', data?.type);
        }
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [router]);

  return {
    sendNotification: notificationService.sendLocalNotification.bind(notificationService),
    notifyRideConfirmed: notificationService.notifyRideConfirmed.bind(notificationService),
    notifyDriverArriving: notificationService.notifyDriverArriving.bind(notificationService),
    notifyPaymentReminder: notificationService.notifyPaymentReminder.bind(notificationService),
    notifyRideReminder: notificationService.notifyRideReminder.bind(notificationService),
    notifyNewMessage: notificationService.notifyNewMessage.bind(notificationService),
    notifyRideCompleted: notificationService.notifyRideCompleted.bind(notificationService),
    notifyEmergency: notificationService.notifyEmergency.bind(notificationService),
    getPushToken: notificationService.getPushToken.bind(notificationService),
  };
}
