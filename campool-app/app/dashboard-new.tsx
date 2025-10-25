import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RideCard from '../components/RideCard';
import { checkNetworkStatus } from '../config/api';
import OfflineIndicator from '../components/OfflineIndicator';

const { width } = Dimensions.get('window');
const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'https://campool-lm5p.vercel.app';

interface RideStats {
  totalRides: number;
  completedRides: number;
  totalSaved: number;
  co2Saved: number;
  avgRating: number;
}

interface RecentRide {
  id: string;
  startPoint: string;
  destination: string;
  date: string;
  cost: number;
  status: string;
  rating?: number;
}

export default function DashboardScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [stats, setStats] = useState<RideStats>({
    totalRides: 0,
    completedRides: 0,
    totalSaved: 0,
    co2Saved: 0,
    avgRating: 0,
  });
  const [recentRides, setRecentRides] = useState<RecentRide[]>([]);
  const [userName, setUserName] = useState('Student');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('campool_token');
      if (!token) {
        router.replace('/login');
        return;
      }

      // Check network status
      const networkStatus = await checkNetworkStatus();
      setIsOffline(!networkStatus);

      if (!networkStatus) {
        console.log('Offline mode - using default data');
        setStats({
          totalRides: 0,
          completedRides: 0,
          totalSaved: 0,
          co2Saved: 0,
          avgRating: 0,
        });
        setRecentRides([]);
        setLoading(false);
        return;
      }

      // Load user data
      try {
        const storedUser = await AsyncStorage.getItem('campool_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUserName(userData.name || 'Student');
        }
      } catch (error) {
        console.log('Error loading user data:', error);
      }

      // Load stats
      try {
        const statsResponse = await fetch(`${API_BASE}/api/stats/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        } else {
          console.log('Stats API unavailable, using defaults');
        }
      } catch (error) {
        console.log('Stats API error:', error);
      }

      // Load recent rides
      try {
        const ridesResponse = await fetch(`${API_BASE}/api/rides/recent`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (ridesResponse.ok) {
          const ridesData = await ridesResponse.json();
          setRecentRides(ridesData);
        } else {
          console.log('Recent rides API unavailable, using defaults');
        }
      } catch (error) {
        console.log('Recent rides API error:', error);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const StatCard = ({ title, value, icon, color, gradient }: {
    title: string;
    value: string | number;
    icon: string;
    color: string;
    gradient: [string, string];
  }) => (
    <View style={styles.statCard}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statGradient}>
        <Ionicons name={icon as any} size={24} color="white" />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </LinearGradient>
    </View>
  );

  const QuickAction = ({ title, icon, onPress, color = "#2d6a4f" }: {
    title: string;
    icon: string;
    onPress: () => void;
    color?: string;
  }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={28} color={color} />
      </View>
      <Text style={styles.quickActionText}>{title}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2d6a4f" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <OfflineIndicator isVisible={isOffline} />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Hello,</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => router.push('/profile')}
            >
              <Ionicons name="person-circle-outline" size={32} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Your Ride Stats</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Rides"
              value={stats.totalRides}
              icon="car-outline"
              color="#3b82f6"
              gradient={['#3b82f6', '#1d4ed8']}
            />
            <StatCard
              title="Completed"
              value={stats.completedRides}
              icon="checkmark-circle-outline"
              color="#10b981"
              gradient={['#10b981', '#059669']}
            />
            <StatCard
              title="Money Saved"
              value={`Rs.${stats.totalSaved}`}
              icon="wallet-outline"
              color="#f59e0b"
              gradient={['#f59e0b', '#d97706']}
            />
            <StatCard
              title="CO₂ Saved"
              value={`${stats.co2Saved}kg`}
              icon="leaf-outline"
              color="#8b5cf6"
              gradient={['#8b5cf6', '#7c3aed']}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <QuickAction
              title="Post Ride"
              icon="add-circle-outline"
              onPress={() => router.push('/post-ride')}
              color="#10b981"
            />
            <QuickAction
              title="Find Ride"
              icon="search-outline"
              onPress={() => router.push('/search-rides')}
              color="#3b82f6"
            />
            <QuickAction
              title="Track Rides"
              icon="location-outline"
              onPress={() => router.push('/ride-tracking')}
              color="#8b5cf6"
            />
            <QuickAction
              title="Ride History"
              icon="time-outline"
              onPress={() => router.push('/ride-history')}
              color="#f59e0b"
            />
          </View>
        </View>

        {/* Recent Rides */}
        <View style={styles.recentRidesContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Rides</Text>
            <TouchableOpacity onPress={() => router.push('/ride-history')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {recentRides.length > 0 ? (
            recentRides.slice(0, 3).map((ride) => (
              <RideCard key={ride.id} ride={ride} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No rides yet</Text>
              <Text style={styles.emptyText}>
                Start by posting a ride or finding one to join!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
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
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  profileButton: {
    padding: 8,
  },
  statsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 60) / 2,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
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
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: (width - 60) / 2,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  recentRidesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
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
