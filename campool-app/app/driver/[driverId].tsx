import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getDriverRatings } from '@/services/ratingsApi';
import StarRating from '@/components/StarRating';

export default function DriverProfile() {
  const { driverId } = useLocalSearchParams<{ driverId: string }>();
  const [loading, setLoading] = useState(true);
  const [driver, setDriver] = useState<{ name: string; avgRating?: number; totalRatings?: number } | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  async function load(p = 1) {
    if (!driverId) return;
    setLoading(true);
    try {
      const data = await getDriverRatings(driverId, { page: p, limit: 10 });
      setDriver(data.driver);
      if (p === 1) setItems(data.items);
      else setItems((prev) => [...prev, ...(data.items || [])]);
      setHasMore(p * 10 < data.total);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(1); }, [driverId]);

  if (loading && page === 1) return <View style={styles.center}><ActivityIndicator /></View>;
  if (!driver) return <View style={styles.center}><Text>Driver not found</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{driver.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <StarRating value={Math.round((driver.avgRating || 0))} size={20} />
          <Text>({driver.avgRating?.toFixed(1) || '0.0'}) • {driver.totalRatings || 0} reviews</Text>
        </View>
      </View>

      {items.length === 0 ? (
        <Text style={{ textAlign: 'center', marginTop: 16 }}>No ratings yet.</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <StarRating value={item.rating} size={18} />
                <Text style={{ color: '#64748b' }}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              {item.review ? <Text style={{ marginBottom: 6 }}>{item.review}</Text> : null}
              <Text style={{ color: '#475569' }}>by {item.passengerId?.name || 'Passenger'}</Text>
            </View>
          )}
          onEndReached={() => hasMore && load(page + 1)}
          onEndReachedThreshold={0.5}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '700' },
  card: { backgroundColor: 'white', padding: 12, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
}); 