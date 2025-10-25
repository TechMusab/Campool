import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert, ActivityIndicator, useColorScheme } from 'react-native';
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

export default function RideCard({ ride, currentUserId, onRideStarted }: { 
  ride: Ride; 
  currentUserId?: string;
  onRideStarted?: (rideCost: number, distance: number) => void;
}) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [rideStarted, setRideStarted] = useState(false);
  
  const driverName = typeof ride.driverId === 'object' && ride.driverId ? ride.driverId.name : 'Driver';
  const rating = typeof ride.driverId === 'object' && ride.driverId ? (ride.driverId as any).avgRating ?? 4.8 : 4.8;
  const whatsappNumber = typeof ride.driverId === 'object' && ride.driverId ? ride.driverId.whatsappNumber : null;
  const perPassenger = ride.perPassengerCost ?? ride.costPerSeat;
  const total = ride.totalCost ?? (ride.costPerSeat * ride.availableSeats);
  const isMyRide = currentUserId && typeof ride.driverId === 'object' && ride.driverId && ride.driverId._id === currentUserId;
  
  
  const startRide = () => {
    Alert.alert(
      'Start Ride',
      'Are you ready to start this ride? This will notify the driver and other passengers.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Ride', 
          onPress: () => {
            setRideStarted(true);
            
            // Update dashboard stats
            if (onRideStarted) {
              const distance = ride.distanceKm || 10; // Default distance if not provided
              onRideStarted(perPassenger, distance);
            }
            
            Alert.alert(
              'Ride Started! 🚗',
              'Your ride has been started. You can now contact the driver via WhatsApp.',
              [
                { text: 'OK' }
              ]
            );
          }
        }
      ]
    );
  };

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




  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.driverInfo}>
          <View style={[styles.avatar, isDark && styles.avatarDark]}>
            <Ionicons name="person" size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
          </View>
          <View style={styles.driverDetails}>
            <Text style={[styles.driverName, isDark && styles.driverNameDark]}>{driverName}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#fbbf24" />
              <Text style={[styles.rating, isDark && styles.ratingDark]}>{Number(rating).toFixed(1)}</Text>
            </View>
          </View>
        </View>
        {isMyRide && (
          <View style={[styles.myRideBadge, isDark && styles.myRideBadgeDark]}>
            <Text style={[styles.myRideText, isDark && styles.myRideTextDark]}>My Ride</Text>
          </View>
        )}
      </View>

      {/* Route */}
      <View style={styles.routeContainer}>
        <View style={styles.routePoint}>
          <View style={[styles.routeDot, styles.startDot]} />
          <Text style={[styles.routeText, isDark && styles.routeTextDark]}>{ride.startPoint}</Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routePoint}>
          <View style={[styles.routeDot, styles.endDot]} />
          <Text style={[styles.routeText, isDark && styles.routeTextDark]}>{ride.destination}</Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color={isDark ? "#9ca3af" : "#6b7280"} />
          <Text style={[styles.detailText, isDark && styles.detailTextDark]}>
            {new Date(ride.date).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={isDark ? "#9ca3af" : "#6b7280"} />
          <Text style={[styles.detailText, isDark && styles.detailTextDark]}>{ride.time}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="people-outline" size={16} color={isDark ? "#9ca3af" : "#6b7280"} />
          <Text style={[styles.detailText, isDark && styles.detailTextDark]}>
            {ride.availableSeats} seat{ride.availableSeats !== 1 ? 's' : ''} available
          </Text>
        </View>
      </View>

      {/* Cost */}
      <View style={[styles.costContainer, isDark && styles.costContainerDark]}>
        <View style={styles.costRow}>
          <Text style={[styles.costLabel, isDark && styles.costLabelDark]}>Per Passenger</Text>
          <Text style={[styles.costValue, isDark && styles.costValueDark]}>Rs. {perPassenger.toFixed(2)}</Text>
        </View>
        <View style={styles.costRow}>
          <Text style={[styles.costLabel, isDark && styles.costLabelDark]}>Total Cost</Text>
          <Text style={[styles.totalCost, isDark && styles.totalCostDark]}>Rs. {total.toFixed(2)}</Text>
        </View>
      </View>

      {/* Action Button */}
      {!rideStarted ? (
        <TouchableOpacity onPress={startRide} style={styles.startRideButton}>
          <LinearGradient 
            colors={["#10b981", "#059669"]} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 0 }} 
            style={styles.startRideGradient}
          >
            <Ionicons name="play-circle-outline" size={20} color="#fff" />
            <Text style={styles.startRideText}>Start Ride</Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={openWhatsApp} style={styles.whatsappButton}>
          <LinearGradient 
            colors={["#25D366", "#128C7E"]} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 0 }} 
            style={styles.whatsappGradient}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text style={styles.whatsappText}>Contact via WhatsApp</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cardDark: {
    backgroundColor: '#1f2937',
    shadowOpacity: 0.3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarDark: {
    backgroundColor: '#374151',
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  driverNameDark: {
    color: '#f9fafb',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  ratingDark: {
    color: '#9ca3af',
  },
  myRideBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  myRideBadgeDark: {
    backgroundColor: '#1e3a8a',
  },
  myRideText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  myRideTextDark: {
    color: '#93c5fd',
  },
  routeContainer: {
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  startDot: {
    backgroundColor: '#10b981',
  },
  endDot: {
    backgroundColor: '#ef4444',
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#e5e7eb',
    marginLeft: 5,
    marginBottom: 8,
  },
  routeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  routeTextDark: {
    color: '#f9fafb',
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  detailTextDark: {
    color: '#9ca3af',
  },
  costContainer: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  costContainerDark: {
    backgroundColor: '#1e3a8a',
    borderColor: '#3b82f6',
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  costLabel: {
    fontSize: 14,
    color: '#0369a1',
    fontWeight: '500',
  },
  costLabelDark: {
    color: '#93c5fd',
  },
  costValue: {
    fontSize: 16,
    color: '#0369a1',
    fontWeight: '600',
  },
  costValueDark: {
    color: '#93c5fd',
  },
  totalCost: {
    fontSize: 18,
    color: '#0369a1',
    fontWeight: 'bold',
  },
  totalCostDark: {
    color: '#93c5fd',
  },
  startRideButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  startRideGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  startRideText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  whatsappButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  whatsappGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  whatsappText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 