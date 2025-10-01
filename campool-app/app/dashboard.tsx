import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, ScrollView, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchStats } from '@/services/statsApi';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ ridesTaken: number; ridesOffered: number; moneySaved: number; co2SavedKg: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('campool_token');
        const userId = 'me';
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function loadStats(userId: string) {
    const token = await AsyncStorage.getItem('campool_token');
    if (!token) return;
    const data = await fetchStats(token, userId);
    setStats({ ridesTaken: data.ridesTaken, ridesOffered: data.ridesOffered, moneySaved: data.moneySaved, co2SavedKg: data.co2SavedKg });
  }

  useEffect(() => { loadStats((global as any).campoolUserId || '000000000000000000000000'); }, []);

  async function logout() {
    await AsyncStorage.removeItem('campool_token');
    router.replace('/login');
  }

  const width = Dimensions.get('window').width - 48;

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="light-content" />
      
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#2d6a4f', '#1b9aaa']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Welcome Back</Text>
            <Text style={styles.headerTitle}>Your Journey Dashboard</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {loading || !stats ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2d6a4f" />
            <Text style={styles.loadingText}>Loading your stats...</Text>
          </View>
        ) : (
          <>
            {/* Stats Cards */}
            <View style={styles.statsSection}>
              <View style={styles.cardsRow}>
                <StatCard 
                  label="Rides Taken" 
                  value={String(stats.ridesTaken)} 
                  icon="car-sport"
                  colors={["#1b9aaa", "#2d6a4f"]} 
                />
                <StatCard 
                  label="Rides Offered" 
                  value={String(stats.ridesOffered)} 
                  icon="car"
                  colors={["#2d6a4f", "#1b9aaa"]} 
                />
              </View>
              <View style={styles.cardsRow}>
                <StatCard 
                  label="Money Saved" 
                  value={`Rs.${stats.moneySaved.toFixed(0)}`} 
                  icon="wallet"
                  colors={["#34a0a4", "#168aad"]} 
                />
                <StatCard 
                  label="CO₂ Saved" 
                  value={`${stats.co2SavedKg.toFixed(1)} kg`} 
                  icon="leaf"
                  colors={["#52b788", "#40916c"]} 
                />
              </View>
            </View>

            {/* Charts Section */}
            <View style={styles.chartSection}>
              <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <Ionicons name="bar-chart" size={20} color="#2d6a4f" />
                  <Text style={styles.chartTitle}>Rides per Month</Text>
                </View>
                <BarChart
                  width={width - 32}
                  height={180}
                  data={{ labels: ['Jan','Feb','Mar','Apr','May','Jun'], datasets: [{ data: [3,2,4,5,3,6] }] }}
                  chartConfig={{
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    color: (opacity = 1) => `rgba(27,154,170,${opacity})`,
                    labelColor: () => '#52796f',
                    barPercentage: 0.6,
                    decimalPlaces: 0,
                  }}
                  fromZero
                  style={styles.chart}
                  showValuesOnTopOfBars
                />
              </View>

              <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <Ionicons name="trending-up" size={20} color="#2d6a4f" />
                  <Text style={styles.chartTitle}>Money Saved Over Time</Text>
                </View>
                <LineChart
                  width={width - 32}
                  height={180}
                  data={{ labels: ['Jan','Feb','Mar','Apr','May','Jun'], datasets: [{ data: [200,300,250,400,350,500] }] }}
                  chartConfig={{
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    color: (opacity = 1) => `rgba(45,106,79,${opacity})`,
                    labelColor: () => '#52796f',
                    decimalPlaces: 0,
                  }}
                  bezier
                  style={styles.chart}
                />
              </View>

              <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                  <Ionicons name="pie-chart" size={20} color="#2d6a4f" />
                  <Text style={styles.chartTitle}>Environmental Impact</Text>
                </View>
                <PieChart
                  data={[
                    { name: 'CO₂ Saved', population: stats.co2SavedKg, color: '#2d6a4f', legendFontColor: '#52796f', legendFontSize: 13 },
                    { name: 'Baseline', population: Math.max(1, 100 - stats.co2SavedKg), color: '#d8e9e4', legendFontColor: '#84a98c', legendFontSize: 13 }
                  ]}
                  width={width - 32}
                  height={180}
                  chartConfig={{ color: () => '#333' }}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  center={[10, 0]}
                  hasLegend
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsSection}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              
              <TouchableOpacity 
                onPress={() => router.push('/post-ride')} 
                style={styles.actionButtonWrapper}
                activeOpacity={0.8}
              >
                <LinearGradient 
                  colors={["#2d6a4f", "#1b9aaa"]} 
                  start={{ x: 0, y: 0 }} 
                  end={{ x: 1, y: 0 }} 
                  style={styles.actionButton}
                >
                  <Ionicons name="add-circle-outline" size={24} color="#fff" />
                  <Text style={styles.actionButtonText}>Post a Ride</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => router.push('/search-rides')} 
                style={styles.actionButtonWrapper}
                activeOpacity={0.8}
              >
                <LinearGradient 
                  colors={["#1b9aaa", "#34a0a4"]} 
                  start={{ x: 0, y: 0 }} 
                  end={{ x: 1, y: 0 }} 
                  style={styles.actionButton}
                >
                  <Ionicons name="search-outline" size={24} color="#fff" />
                  <Text style={styles.actionButtonText}>Search Rides</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, icon, colors }: { label: string; value: string; icon: any; colors: string[] }) {
  return (
    <LinearGradient 
      colors={colors} 
      start={{ x: 0, y: 0 }} 
      end={{ x: 1, y: 1 }} 
      style={styles.statCard}
    >
      <View style={styles.statIconContainer}>
        <Ionicons name={icon} size={24} color="rgba(255,255,255,0.9)" />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f8fffe',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#2d6a4f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 24,
    paddingTop: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#52796f',
  },
  statsSection: {
    marginBottom: 24,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    minHeight: 120,
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 24,
  },
  chartSection: {
    gap: 20,
    marginBottom: 24,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1b4332',
  },
  chart: {
    borderRadius: 8,
    marginVertical: 8,
  },
  actionsSection: {
    gap: 12,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1b4332',
    marginBottom: 8,
  },
  actionButtonWrapper: {
    width: '100%',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    shadowColor: '#2d6a4f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButtonText: {
    flex: 1,
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 12,
  },
});