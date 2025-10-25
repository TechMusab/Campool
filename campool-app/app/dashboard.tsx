import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import rideCoordinationService from '@/services/rideCoordinationService';
import { API_CONFIG, checkNetworkStatus } from '@/config/api';
import OfflineIndicator from '@/components/OfflineIndicator';

const API_BASE = API_CONFIG.BASE_URL;
const { width } = Dimensions.get('window');

interface RideStats {
  totalRides: number;
  completedRides: number;
  totalSaved: number;
  co2Saved: number;
  avgRating: number;
  totalEarnings?: number; // For drivers
}

interface RecentRide {
  id: string;
  startPoint: string;
  destination: string;
  date: string;
  status: string;
  cost: number;
  rating?: number;
}

export default function DashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<RideStats>({
    totalRides: 0,
    completedRides: 0,
    totalSaved: 0,
    co2Saved: 0,
    avgRating: 0,
  });
  const [recentRides, setRecentRides] = useState<RecentRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userType, setUserType] = useState<'passenger' | 'driver'>('passenger');
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    loadDashboardData();
    rideCoordinationService.loadFromStorage();
  }, []);

  const loadDashboardData = async () => {
    try {
      const token = await AsyncStorage.getItem('campool_token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Set default stats for offline mode
      setStats({
        totalRides: 0,
        completedRides: 0,
        totalSaved: 0,
        co2Saved: 0,
        avgRating: 0,
      });

      // Check network status first
      const isOnline = await checkNetworkStatus();
      setIsOffline(!isOnline);
      if (!isOnline) {
        console.log('No network connection, using offline mode');
        return;
      }

      // Try to load user stats with timeout
      try {
        const statsResponse = await axios.get(`${API_BASE}/api/stats/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: API_CONFIG.TIMEOUT,
        });
        setStats(statsResponse.data);
      } catch (statsError) {
        console.log('Stats API unavailable, using defaults');
      }

      // Try to load recent rides
      try {
        const ridesResponse = await axios.get(`${API_BASE}/api/rides/recent`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: API_CONFIG.TIMEOUT,
        });
        setRecentRides(ridesResponse.data);
      } catch (ridesError) {
        console.log('Recent rides API unavailable, using defaults');
        setRecentRides([]);
      }

      // Try to determine user type
      try {
        const userResponse = await axios.get(`${API_BASE}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: API_CONFIG.TIMEOUT,
        });
        setUserType(userResponse.data.isDriver ? 'driver' : 'passenger');
      } catch (userError) {
        console.log('User profile API unavailable, defaulting to passenger');
        setUserType('passenger');
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Set default values for offline mode
      setStats({
        totalRides: 0,
        completedRides: 0,
        totalSaved: 0,
        co2Saved: 0,
        avgRating: 0,
      });
      setRecentRides([]);
      setUserType('passenger');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('campool_token');
              router.replace('/login');
            } catch (error) {
              console.error('Error logging out:', error);
            }
          },
        },
      ]
    );
  };

  const StatCard = ({ title, value, icon, color, subtitle }: {
    title: string;
    value: string | number;
    icon: string;
    color: [string, string];
    subtitle?: string;
  }) => (
    <View style={styles.statCard}>
      <LinearGradient colors={color} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statGradient}>
        <Ionicons name={icon as any} size={24} color="white" />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </LinearGradient>
    </View>
  );

  const RideCard = ({ ride }: { ride: RecentRide }) => (
    <TouchableOpacity
      style={styles.rideCard}
      onPress={() => router.push(`/chat/${ride.id}`)}
    >
      <View style={styles.rideHeader}>
        <Text style={styles.rideRoute}>{ride.startPoint} → {ride.destination}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ride.status) }]}>
          <Text style={styles.statusText}>{ride.status}</Text>
        </View>
          </View>
      <View style={styles.rideDetails}>
        <Text style={styles.rideDate}>{new Date(ride.date).toLocaleDateString()}</Text>
        <Text style={styles.rideCost}>${ride.cost}</Text>
          </View>
      {ride.rating && (
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#fbbf24" />
          <Text style={styles.ratingText}>{ride.rating}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return '#10b981';
      case 'confirmed': return '#3b82f6';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <>
      <OfflineIndicator isVisible={isOffline} />
      <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <Text style={styles.headerSubtitle}>
              {userType === 'driver' ? 'Driver Overview' : 'Passenger Overview'}
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
          </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
                <StatCard 
          title="Total Rides"
          value={stats.totalRides}
          icon="car-outline"
          color={['#3b82f6', '#1d4ed8']}
                />
                <StatCard 
          title="Completed"
          value={stats.completedRides}
          icon="checkmark-circle-outline"
          color={['#10b981', '#059669']}
        />
                <StatCard 
          title={userType === 'driver' ? 'Earnings' : 'Saved'}
          value={`$${stats.totalSaved}`}
          icon={userType === 'driver' ? 'cash-outline' : 'wallet-outline'}
          color={['#f59e0b', '#d97706']}
                />
                <StatCard 
          title="CO₂ Saved"
          value={`${stats.co2Saved}kg`}
          icon="leaf-outline"
          color={['#22c55e', '#16a34a']}
          subtitle="Environmental Impact"
                />
              </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
              <TouchableOpacity 
            style={styles.quickAction}
                onPress={() => router.push('/post-ride')} 
          >
            <Ionicons name="add-circle-outline" size={32} color="#2d6a4f" />
            <Text style={styles.quickActionText}>Post Ride</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/search-rides')}
          >
            <Ionicons name="search-outline" size={32} color="#2d6a4f" />
            <Text style={styles.quickActionText}>Find Ride</Text>
              </TouchableOpacity>
              <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => router.push('/profile')}
          >
            <Ionicons name="person-outline" size={32} color="#2d6a4f" />
            <Text style={styles.quickActionText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications-outline" size={32} color="#2d6a4f" />
            <Text style={styles.quickActionText}>Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={32} color="#2d6a4f" />
            <Text style={styles.quickActionText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Rides */}
      <View style={styles.recentRidesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Rides</Text>
          <TouchableOpacity onPress={() => router.push('/ride-history')}>
            <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
        
        {recentRides.length > 0 ? (
          recentRides.map((ride) => (
            <RideCard key={ride.id} ride={ride} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyStateText}>No rides yet</Text>
            <Text style={styles.emptyStateSubtext}>
              {userType === 'driver' ? 'Post your first ride!' : 'Find your first ride!'}
            </Text>
          </View>
        )}
      </View>
      </ScrollView>
    </>
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
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#2d6a4f',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#a7f3d0',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 48) / 2,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  statTitle: {
    fontSize: 14,
    color: 'white',
    marginTop: 4,
    textAlign: 'center',
  },
  statSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    textAlign: 'center',
  },
  quickActionsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: (width - 48) / 2,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#2d6a4f',
  },
  recentRidesSection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    color: '#2d6a4f',
    fontWeight: '600',
  },
  rideCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rideRoute: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  rideDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rideDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  rideCost: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#fbbf24',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
});