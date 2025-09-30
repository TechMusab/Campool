import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchStats } from '@/services/statsApi';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{ ridesTaken: number; ridesOffered: number; moneySaved: number; co2SavedKg: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('campool_token');
        // For demo, we don't have userId in storage; fetch from /auth/me normally. Here, mock: require token then call with placeholder 'me' is not available
        // You can store user id after login and use it here
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

  // Dummy invoke for now; in real app, get user id at login and persist
  useEffect(() => { loadStats((global as any).campoolUserId || '000000000000000000000000'); }, []);

  async function logout() {
    await AsyncStorage.removeItem('campool_token');
    router.replace('/login');
  }

  const width = Dimensions.get('window').width - 32;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Welcome to Campool</Text>

      {loading || !stats ? (
        <ActivityIndicator />
      ) : (
        <>
          <View style={styles.cardsRow}>
            <StatCard label="Rides Taken" value={String(stats.ridesTaken)} colors={["#1b9aaa", "#2d6a4f"]} />
            <StatCard label="Rides Offered" value={String(stats.ridesOffered)} colors={["#2d6a4f", "#1b9aaa"]} />
          </View>
          <View style={styles.cardsRow}>
            <StatCard label="Money Saved" value={`Rs.${stats.moneySaved.toFixed(0)}`} colors={["#34a0a4", "#168aad"]} />
            <StatCard label="CO₂ Saved" value={`${stats.co2SavedKg.toFixed(1)} kg`} colors={["#52b788", "#40916c"]} />
          </View>

          <Text style={styles.section}>Rides per month</Text>
          <BarChart
            width={width}
            height={180}
            data={{ labels: ['Jan','Feb','Mar','Apr','May','Jun'], datasets: [{ data: [3,2,4,5,3,6] }] }}
            chartConfig={{ backgroundGradientFrom: '#ffffff', backgroundGradientTo: '#ffffff', color: (o=1) => `rgba(27,154,170,${o})`, labelColor: () => '#666' }}
            fromZero
            style={styles.chart}
          />

          <Text style={styles.section}>Money saved over time</Text>
          <LineChart
            width={width}
            height={180}
            data={{ labels: ['Jan','Feb','Mar','Apr','May','Jun'], datasets: [{ data: [200,300,250,400,350,500] }] }}
            chartConfig={{ backgroundGradientFrom: '#ffffff', backgroundGradientTo: '#ffffff', color: (o=1) => `rgba(45,106,79,${o})`, labelColor: () => '#666' }}
            bezier
            style={styles.chart}
          />

          <Text style={styles.section}>CO₂ Saved</Text>
          <PieChart
            data={[{ name: 'Saved', population: stats.co2SavedKg, color: '#2d6a4f', legendFontColor: '#333', legendFontSize: 12 }, { name: 'Baseline', population: Math.max(1, 100 - stats.co2SavedKg), color: '#1b9aaa', legendFontColor: '#333', legendFontSize: 12 }]}
            width={width}
            height={180}
            chartConfig={{ color: () => '#333' }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="8"
            center={[0, 0]}
            hasLegend
          />
        </>
      )}

      <TouchableOpacity onPress={() => router.push('/post-ride')} style={{ width: '100%', marginTop: 12 }}>
        <LinearGradient colors={["#2d6a4f", "#1b9aaa"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.button}>
          <Text style={styles.buttonText}>Post a Ride</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/search-rides')} style={{ width: '100%', marginTop: 8 }}>
        <LinearGradient colors={["#1b9aaa", "#2d6a4f"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.button}>
          <Text style={styles.buttonText}>Search Rides</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity onPress={logout} style={{ width: '100%', marginTop: 8, marginBottom: 24 }}>
        <LinearGradient colors={["#e63946", "#ff7f7f"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.button}>
          <Text style={styles.buttonText}>Logout</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatCard({ label, value, colors }: { label: string; value: string; colors: string[] }) {
  return (
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  cardsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statCard: { flex: 1, padding: 16, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  statLabel: { color: 'white' },
  statValue: { color: 'white', fontWeight: '700', fontSize: 18, marginTop: 4 },
  section: { fontWeight: '700', marginTop: 16, marginBottom: 6 },
  chart: { borderRadius: 12 },
  button: { paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold' },
}); 