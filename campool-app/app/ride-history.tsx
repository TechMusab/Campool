import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_CONFIG } from '@/config/api';

const API_BASE = API_CONFIG.BASE_URL;

interface RideHistory {
  id: string;
  startPoint: string;
  destination: string;
  date: string;
  time: string;
  status: 'completed' | 'cancelled' | 'ongoing' | 'pending';
  cost: number;
  seats: number;
  rating?: number;
  driverName?: string;
  passengerNames?: string[];
}

export default function RideHistoryScreen() {
  const router = useRouter();
  const [rides, setRides] = useState<RideHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled' | 'ongoing'>('all');

  useEffect(() => {
    loadRideHistory();
  }, []);

  const loadRideHistory = async () => {
    try {
      const token = await AsyncStorage.getItem('campool_token');
      if (!token) {
        router.replace('/login');
        return;
      }

      const response = await axios.get(`${API_BASE}/api/rides/history`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: API_CONFIG.TIMEOUT,
      });

      setRides(response.data || []);
    } catch (error) {
      console.error('Error loading ride history:', error);
      // Set empty array for offline mode
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRideHistory();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return '#10b981';
      case 'ongoing': return '#3b82f6';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'checkmark-circle';
      case 'ongoing': return 'play-circle';
      case 'pending': return 'time';
      case 'cancelled': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const filteredRides = rides.filter(ride => 
    filter === 'all' || ride.status === filter
  );

  const RideCard = ({ ride }: { ride: RideHistory }) => (
    <TouchableOpacity
      style={styles.rideCard}
      onPress={() => router.push(`/chat/${ride.id}`)}
    >
      <View style={styles.rideHeader}>
        <View style={styles.routeInfo}>
          <Text style={styles.routeText}>{ride.startPoint} → {ride.destination}</Text>
          <Text style={styles.dateText}>
            {new Date(ride.date).toLocaleDateString()} at {ride.time}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ride.status) }]}>
          <Ionicons 
            name={getStatusIcon(ride.status) as any} 
            size={16} 
            color="white" 
          />
          <Text style={styles.statusText}>{ride.status}</Text>
        </View>
      </View>

      <View style={styles.rideDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="people-outline" size={16} color="#6b7280" />
          <Text style={styles.detailText}>{ride.seats} seats</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="cash-outline" size={16} color="#6b7280" />
          <Text style={styles.detailText}>Rs. {ride.cost}</Text>
        </View>
        {ride.rating && (
          <View style={styles.detailItem}>
            <Ionicons name="star" size={16} color="#fbbf24" />
            <Text style={styles.detailText}>{ride.rating}/5</Text>
          </View>
        )}
      </View>

      {ride.driverName && (
        <Text style={styles.driverText}>Driver: {ride.driverName}</Text>
      )}
      {ride.passengerNames && ride.passengerNames.length > 0 && (
        <Text style={styles.passengerText}>
          Passengers: {ride.passengerNames.join(', ')}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2d6a4f" />
        <Text style={styles.loadingText}>Loading ride history...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <LinearGradient
        colors={['#2d6a4f', '#1b9aaa']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride History</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(['all', 'completed', 'ongoing', 'cancelled'] as const).map((filterType) => (
            <TouchableOpacity
              key={filterType}
              style={[
                styles.filterButton,
                filter === filterType && styles.filterButtonActive
              ]}
              onPress={() => setFilter(filterType)}
            >
              <Text style={[
                styles.filterText,
                filter === filterType && styles.filterTextActive
              ]}>
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Ride List */}
      <View style={styles.content}>
        {filteredRides.length > 0 ? (
          filteredRides.map((ride) => (
            <RideCard key={ride.id} ride={ride} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No rides found</Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all' 
                ? "You haven't taken any rides yet" 
                : `No ${filter} rides found`
              }
            </Text>
            <TouchableOpacity
              style={styles.findRideButton}
              onPress={() => router.push('/search-rides')}
            >
              <Ionicons name="search-outline" size={20} color="white" />
              <Text style={styles.findRideText}>Find Rides</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  filterContainer: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterButtonActive: {
    backgroundColor: '#2d6a4f',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterTextActive: {
    color: 'white',
  },
  content: {
    padding: 20,
  },
  rideCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routeInfo: {
    flex: 1,
  },
  routeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  rideDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  driverText: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    marginTop: 4,
  },
  passengerText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
  },
  findRideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d6a4f',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  findRideText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
