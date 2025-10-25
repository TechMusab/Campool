import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Ride {
  id: string;
  status: string;
  startedAt?: string;
  completedAt?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  driver: {
    name: string;
    whatsappNumber: string;
  };
  passengers: Array<{
    userId: {
      name: string;
      whatsappNumber: string;
    };
    joinedAt: string;
    status: string;
  }>;
  startPoint: string;
  destination: string;
  date: string;
  time: string;
}

export default function RideTrackingScreen() {
  const router = useRouter();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    loadRides();
  }, []);

  const loadRides = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('campool_token');
      if (!token) {
        router.replace('/login');
        return;
      }

      // For now, we'll use a mock approach since we need to implement the backend
      // This would normally fetch rides where user is driver or passenger
      setRides([]);
    } catch (error) {
      console.error('Error loading rides:', error);
      Alert.alert('Error', 'Failed to load rides');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRides();
    setRefreshing(false);
  };

  const updateRideStatus = async (rideId: string, status: string) => {
    try {
      const token = await AsyncStorage.getItem('campool_token');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE || 'https://campool-lm5p.vercel.app'}/api/rides/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rideId, status }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Ride status updated:', data);
        await loadRides(); // Refresh the list
        Alert.alert('Success', `Ride status updated to ${status}`);
      } else {
        Alert.alert('Error', 'Failed to update ride status');
      }
    } catch (error) {
      console.error('Error updating ride status:', error);
      Alert.alert('Error', 'Failed to update ride status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'confirmed': return '#3b82f6';
      case 'started': return '#10b981';
      case 'in_progress': return '#8b5cf6';
      case 'completed': return '#059669';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'confirmed': return 'checkmark-circle-outline';
      case 'started': return 'play-circle-outline';
      case 'in_progress': return 'car-outline';
      case 'completed': return 'checkmark-done-outline';
      case 'cancelled': return 'close-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  const filteredRides = rides.filter(ride => {
    if (filter === 'active') {
      return ['pending', 'confirmed', 'started', 'in_progress'].includes(ride.status);
    } else if (filter === 'completed') {
      return ['completed', 'cancelled'].includes(ride.status);
    }
    return true;
  });

  const RideCard = ({ ride }: { ride: Ride }) => {
    const isDriver = true; // This would be determined by checking if current user is driver
    const canUpdateStatus = isDriver && ['pending', 'confirmed', 'started', 'in_progress'].includes(ride.status);

    return (
      <View style={styles.rideCard}>
        <View style={styles.rideHeader}>
          <View style={styles.routeInfo}>
            <Text style={styles.route}>{ride.startPoint} → {ride.destination}</Text>
            <Text style={styles.dateTime}>
              {new Date(ride.date).toLocaleDateString()} • {ride.time}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ride.status) }]}>
            <Ionicons name={getStatusIcon(ride.status)} size={16} color="white" />
            <Text style={styles.statusText}>{ride.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.rideDetails}>
          <Text style={styles.driverInfo}>Driver: {ride.driver.name}</Text>
          <Text style={styles.passengerCount}>
            Passengers: {ride.passengers.length}
          </Text>
        </View>

        {ride.startedAt && (
          <Text style={styles.timestamp}>
            Started: {new Date(ride.startedAt).toLocaleString()}
          </Text>
        )}

        {ride.completedAt && (
          <Text style={styles.timestamp}>
            Completed: {new Date(ride.completedAt).toLocaleString()}
          </Text>
        )}

        {canUpdateStatus && (
          <View style={styles.actionButtons}>
            {ride.status === 'confirmed' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.startButton]}
                onPress={() => updateRideStatus(ride.id, 'started')}
              >
                <Ionicons name="play" size={16} color="white" />
                <Text style={styles.actionButtonText}>Start Ride</Text>
              </TouchableOpacity>
            )}

            {ride.status === 'started' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.progressButton]}
                onPress={() => updateRideStatus(ride.id, 'in_progress')}
              >
                <Ionicons name="car" size={16} color="white" />
                <Text style={styles.actionButtonText}>In Progress</Text>
              </TouchableOpacity>
            )}

            {['started', 'in_progress'].includes(ride.status) && (
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={() => updateRideStatus(ride.id, 'completed')}
              >
                <Ionicons name="checkmark" size={16} color="white" />
                <Text style={styles.actionButtonText}>Complete Ride</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.whatsappInfo}>
          <Text style={styles.whatsappText}>
            Contact driver via WhatsApp: {ride.driver.whatsappNumber}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2d6a4f" />
        <Text style={styles.loadingText}>Loading rides...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#2d6a4f', '#1b9aaa']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride Tracking</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
            All Rides
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'active' && styles.activeFilter]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterText, filter === 'active' && styles.activeFilterText]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'completed' && styles.activeFilter]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.filterText, filter === 'completed' && styles.activeFilterText]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Rides List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredRides.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="car-outline" size={64} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No rides found</Text>
            <Text style={styles.emptyText}>
              {filter === 'active' 
                ? 'No active rides at the moment'
                : filter === 'completed'
                ? 'No completed rides yet'
                : 'You haven\'t joined any rides yet'
              }
            </Text>
          </View>
        ) : (
          filteredRides.map((ride) => (
            <RideCard key={ride.id} ride={ride} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: '#2d6a4f',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeFilterText: {
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  rideCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
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
  route: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  dateTime: {
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
    fontWeight: '600',
    color: 'white',
  },
  rideDetails: {
    marginBottom: 12,
  },
  driverInfo: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  passengerCount: {
    fontSize: 14,
    color: '#374151',
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  startButton: {
    backgroundColor: '#10b981',
  },
  progressButton: {
    backgroundColor: '#8b5cf6',
  },
  completeButton: {
    backgroundColor: '#059669',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  whatsappInfo: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  whatsappText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
