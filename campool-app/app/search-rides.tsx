import { useState } from 'react';
import { View, TextInput, StyleSheet, FlatList, Text, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import RideCard, { Ride } from '@/components/RideCard';
import { LinearGradient } from 'expo-linear-gradient';
import { TouchableOpacity } from 'react-native-gesture-handler';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'http://localhost:4000';

export default function SearchRidesScreen() {
  const [startPoint, setStartPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [showDate, setShowDate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Ride[]>([]);

  async function onSearch() {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (startPoint) params.startPoint = startPoint;
      if (destination) params.destination = destination;
      if (date) params.datetime = date.toISOString();
      const res = await axios.get(`${API_BASE}/rides/search`, { params });
      setResults(res.data.items || []);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <TextInput placeholder="Start Location" style={styles.input} value={startPoint} onChangeText={setStartPoint} />
      <TextInput placeholder="Destination" style={styles.input} value={destination} onChangeText={setDestination} />

      <TouchableOpacity onPress={() => setShowDate(true)} style={styles.input}> 
        <Text>{date ? date.toDateString() : 'Any date'}</Text>
      </TouchableOpacity>
      {showDate && (
        <DateTimePicker
          value={date || new Date()}
          mode="date"
          onChange={(e, selected) => {
            setShowDate(false);
            if (selected) setDate(selected);
          }}
        />
      )}

      <TouchableOpacity onPress={onSearch}>
        <LinearGradient colors={["#2d6a4f", "#1b9aaa"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.button}>
          <Text style={styles.buttonText}>Search</Text>
        </LinearGradient>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 16 }} />
      ) : results.length === 0 ? (
        <Text style={{ marginTop: 16, textAlign: 'center' }}>No rides found</Text>
      ) : (
        <FlatList
          style={{ marginTop: 12 }}
          data={results}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <RideCard ride={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  input: { borderWidth: 1, borderColor: '#cce3de', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff', marginBottom: 8 },
  button: { paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold' },
}); 