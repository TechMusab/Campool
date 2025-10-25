import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

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

export default function RideCard({ ride, onJoin, currentUserId }: { ride: Ride; onJoin?: (ride: Ride) => void; currentUserId?: string }) {
  const router = useRouter();
  const driverName = typeof ride.driverId === 'object' && ride.driverId ? ride.driverId.name : 'Driver';
  const rating = typeof ride.driverId === 'object' && ride.driverId ? (ride.driverId as any).avgRating ?? 4.8 : 4.8;
  const whatsappNumber = typeof ride.driverId === 'object' && ride.driverId ? ride.driverId.whatsappNumber : null;
  const perPassenger = ride.perPassengerCost ?? ride.costPerSeat;
  const total = ride.totalCost ?? (ride.costPerSeat * ride.availableSeats);
  
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

  const openChat = () => {
    router.push(`/chat/${ride._id}`);
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
        <TouchableOpacity onPress={openChat} style={styles.chatButton}>
          <LinearGradient colors={["#3b82f6", "#1d4ed8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.chatGradient}>
            <Ionicons name="chatbubble-outline" size={18} color="#fff" />
            <Text style={styles.chatText}>Chat</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={openWhatsApp} style={styles.whatsappButton}>
          <LinearGradient colors={["#25D366", "#128C7E"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.whatsappGradient}>
            <Ionicons name="logo-whatsapp" size={18} color="#fff" />
            <Text style={styles.whatsappText}>WhatsApp</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        {onJoin && (
          <TouchableOpacity onPress={() => onJoin(ride)} style={styles.joinButton}>
            <LinearGradient colors={["#2d6a4f", "#1b9aaa"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.button}>
              <Text style={styles.buttonText}>Join Ride</Text>
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
  chatButton: { flex: 1 },
  chatGradient: { paddingVertical: 10, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  chatText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  whatsappButton: { flex: 1 },
  whatsappGradient: { paddingVertical: 10, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  whatsappText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  joinButton: { flex: 1 },
  button: { paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold' },
}); 