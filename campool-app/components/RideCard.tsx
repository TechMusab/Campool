import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
  driverId?: { name?: string; rating?: number } | string;
};

export default function RideCard({ ride, onJoin }: { ride: Ride; onJoin?: (ride: Ride) => void }) {
  const driverName = typeof ride.driverId === 'object' && ride.driverId ? ride.driverId.name : 'Driver';
  const rating = typeof ride.driverId === 'object' && ride.driverId ? (ride.driverId as any).avgRating ?? 4.8 : 4.8;
  const perPassenger = ride.perPassengerCost ?? ride.costPerSeat;
  const total = ride.totalCost ?? (ride.costPerSeat * ride.availableSeats);
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
      <TouchableOpacity onPress={() => onJoin?.(ride)}>
        <LinearGradient colors={["#2d6a4f", "#1b9aaa"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.button}>
          <Text style={styles.buttonText}>Join Ride</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', padding: 14, borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  title: { fontWeight: '700' },
  route: { marginTop: 6 },
  meta: { color: '#555', marginTop: 4 },
  costHighlight: { color: '#2d6a4f', fontWeight: '700', marginTop: 4 },
  button: { paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold' },
}); 