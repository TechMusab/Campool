import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Ride = {
  _id: string;
  startPoint: string;
  destination: string;
  date: string;
  time: string;
  availableSeats: number;
  costPerSeat: number;
  totalCost?: number;
  perPassengerCost?: number;
  driverId?: { name?: string; avgRating?: number; whatsappNumber?: string } | string;
};

export default function RideCard({ ride, onJoin, currentUserId, showJoinButton = true }: { 
  ride: Ride; 
  onJoin?: (ride: Ride) => void; 
  currentUserId?: string;
  showJoinButton?: boolean;
}) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const driverName = typeof ride.driverId === 'object' && ride.driverId ? ride.driverId.name : 'Driver';
  const rating = typeof ride.driverId === 'object' && ride.driverId ? (ride.driverId as any).avgRating ?? 4.8 : 4.8;
  const whatsappNumber = typeof ride.driverId === 'object' && ride.driverId ? ride.driverId.whatsappNumber : null;
  const perPassenger = ride.perPassengerCost ?? ride.costPerSeat;
  const total = ride.totalCost ?? (ride.costPerSeat * ride.availableSeats);
  const isMyRide = currentUserId && typeof ride.driverId === 'object' && ride.driverId && ride.driverId._id === currentUserId;
  
  
  const openWhatsApp = () => {
    if (!whatsappNumber) {
      Alert.alert('Error', 'WhatsApp number not available');
      return;
    }
    const message = encodeURIComponent(`Hi! I'm interested in your ride from ${ride.startPoint} to ${ride.destination} on ${new Date(ride.date).toLocaleDateString()}`);
    const url = `whatsapp://send?phone=${whatsappNumber}&text=${message}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'WhatsApp is not installed or number is invalid');
    });
  };


  const joinRide = async () => {
    if (isMyRide) {
      Alert.alert('Cannot Join', 'You cannot join your own ride');
      return;
    }

    try {
      setJoining(true);
      
      // Try API first, but don't fail if it doesn't work
      try {
        const token = await AsyncStorage.getItem('campool_token');
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE || 'https://campool-lm5p.vercel.app'}/api/rides/join`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ rideId: ride._id }),
        });

        if (response.ok) {
          const data = await response.json();
          Alert.alert(
            'Join Request Sent! 🚗',
            'Your request to join this ride has been sent to the ride creator. You will be notified when they respond to your request.',
            [
              { 
                text: 'Contact via WhatsApp',
                onPress: () => {
                  const whatsappNumber = typeof ride.driverId === 'object' && ride.driverId ? ride.driverId.whatsappNumber : null;
                  if (whatsappNumber) {
                    const message = encodeURIComponent(`Hi! I'm interested in joining your ride from ${ride.startPoint} to ${ride.destination} on ${new Date(ride.date).toLocaleDateString()}. Please let me know if there's a seat available.`);
                    const url = `whatsapp://send?phone=${whatsappNumber}&text=${message}`;
                    Linking.openURL(url).catch(() => {
                      Alert.alert('Error', 'WhatsApp is not installed or number is invalid');
                    });
                  }
                }
              },
              { text: 'OK' }
            ]
          );
          if (onJoin) onJoin(ride);
          return;
        }
      } catch (apiError) {
        console.log('API not available, using direct WhatsApp approach');
      }
      
      // Fallback: Direct WhatsApp approach (always works)
      Alert.alert(
        'Join Ride Request! 🚗',
        'Contact the ride creator directly via WhatsApp to join this ride.',
        [
          { 
            text: 'Open WhatsApp',
            onPress: () => {
              const whatsappNumber = typeof ride.driverId === 'object' && ride.driverId ? ride.driverId.whatsappNumber : null;
              
              if (whatsappNumber) {
                const message = encodeURIComponent(`Hi! I'm interested in joining your ride from ${ride.startPoint} to ${ride.destination} on ${new Date(ride.date).toLocaleDateString()}. Please let me know if there's a seat available.`);
                const url = `whatsapp://send?phone=${whatsappNumber}&text=${message}`;
                Linking.openURL(url).catch(() => {
                  Alert.alert('Error', 'WhatsApp is not installed or number is invalid');
                });
              } else {
                Alert.alert('Error', 'WhatsApp number not available for this ride');
              }
            }
          },
          { 
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
      
      if (onJoin) onJoin(ride);
    } catch (error) {
      console.error('Error joining ride:', error);
      Alert.alert('Error', 'Failed to join ride. Please try again.');
    } finally {
      setJoining(false);
    }
  };


  return (
    <View style={styles.card}>
      <Text style={styles.title}>{driverName} • ⭐ {Number(rating).toFixed(1)}</Text>
      <Text style={styles.route}>{ride.startPoint} → {ride.destination}</Text>
      <Text style={styles.meta}>{new Date(ride.date).toLocaleDateString()} • {ride.time}</Text>
      <Text style={styles.meta}>Seats: {ride.availableSeats}</Text>
      <View style={{ height: 6 }} />
      <Text style={styles.costHighlight}>Cost Per Passenger: Rs.{perPassenger.toFixed(2)}</Text>
      <Text style={styles.meta}>Total Ride Cost: Rs.{total.toFixed(2)}</Text>
      <View style={{ height: 8 }} />
      
      {/* Action Buttons Row */}
      <View style={styles.buttonRow}>
        <TouchableOpacity onPress={openWhatsApp} style={styles.whatsappButton}>
          <LinearGradient colors={["#25D366", "#128C7E"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.whatsappGradient}>
            <Ionicons name="logo-whatsapp" size={18} color="#fff" />
            <Text style={styles.whatsappText}>WhatsApp</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        
        {showJoinButton && !isMyRide && (
          <TouchableOpacity 
            onPress={joinRide} 
            style={styles.joinButton}
            disabled={joining}
          >
            <LinearGradient colors={["#10b981", "#059669"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.button}>
              {joining ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="person-add-outline" size={18} color="#fff" />
                  <Text style={styles.buttonText}>Join Ride</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
        
        
        {isMyRide && (
          <TouchableOpacity style={styles.myRideButton}>
            <LinearGradient colors={["#6b7280", "#4b5563"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.button}>
              <Ionicons name="person-outline" size={18} color="#fff" />
              <Text style={styles.buttonText}>My Ride</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', padding: 14, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  title: { fontWeight: '700' },
  route: { marginTop: 6 },
  meta: { color: '#555', marginTop: 4 },
  costHighlight: { color: '#2d6a4f', fontWeight: '700', marginTop: 4 },
  buttonRow: { flexDirection: 'row', gap: 8 },
  whatsappButton: { flex: 1 },
  whatsappGradient: { paddingVertical: 10, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  whatsappText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  joinButton: { flex: 1 },
  myRideButton: { flex: 1 },
  button: { paddingVertical: 10, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
}); 