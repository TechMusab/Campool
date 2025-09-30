import { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'http://localhost:4000';

export default function PostRideScreen() {
  const [startPoint, setStartPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [seats, setSeats] = useState('1');
  const [costPerSeat, setCostPerSeat] = useState('0');
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [loading, setLoading] = useState(false);

  const totalCost = useMemo(() => {
    const s = Number(seats);
    const c = Number(costPerSeat);
    if (!isFinite(s) || !isFinite(c)) return 0;
    return Math.max(0, s) * Math.max(0, c);
  }, [seats, costPerSeat]);

  function reset() {
    setStartPoint('');
    setDestination('');
    setDate(new Date());
    setTime(new Date());
    setSeats('1');
    setCostPerSeat('0');
  }

  async function onSubmit() {
    if (!startPoint || !destination) {
      Alert.alert('Validation', 'Start and destination are required');
      return;
    }
    const seatsNum = Number(seats);
    const costNum = Number(costPerSeat);
    if (!(seatsNum > 0)) return Alert.alert('Validation', 'Seats must be > 0');
    if (!(costNum > 0)) return Alert.alert('Validation', 'Cost per seat must be > 0');

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('campool_token');
      const isoDate = new Date(date);
      isoDate.setHours(time.getHours(), time.getMinutes(), 0, 0);
      await axios.post(
        `${API_BASE}/rides/create`,
        {
          startPoint,
          destination,
          date: isoDate.toISOString(),
          time: `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`,
          seats: seatsNum,
          costPerSeat: costNum,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Success', 'Ride posted');
      reset();
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Failed to post ride';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <TextInput placeholder="Start Location" style={styles.input} value={startPoint} onChangeText={setStartPoint} />
      <TextInput placeholder="Destination" style={styles.input} value={destination} onChangeText={setDestination} />

      <TouchableOpacity onPress={() => setShowDate(true)} style={styles.input}> 
        <Text>{date.toDateString()}</Text>
      </TouchableOpacity>
      {showDate && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, selected) => {
            setShowDate(false);
            if (selected) setDate(selected);
          }}
        />
      )}

      <TouchableOpacity onPress={() => setShowTime(true)} style={styles.input}> 
        <Text>{`${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`}</Text>
      </TouchableOpacity>
      {showTime && (
        <DateTimePicker
          value={time}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(e, selected) => {
            setShowTime(false);
            if (selected) setTime(selected);
          }}
        />
      )}

      <TextInput
        placeholder="Seats"
        keyboardType="numeric"
        style={styles.input}
        value={seats}
        onChangeText={(v) => setSeats(v.replace(/[^0-9]/g, ''))}
      />
      <TextInput
        placeholder="Cost per seat"
        keyboardType="numeric"
        style={styles.input}
        value={costPerSeat}
        onChangeText={(v) => setCostPerSeat(v.replace(/[^0-9.]/g, ''))}
      />

      <View style={styles.card}> 
        <Text style={{ fontWeight: '700' }}>Total Ride Cost</Text>
        <Text style={{ color: '#2d6a4f', fontWeight: '700', marginTop: 4 }}>Rs.{totalCost.toFixed(2)}</Text>
      </View>

      <TouchableOpacity onPress={onSubmit} disabled={loading} style={{ width: '100%' }}>
        <LinearGradient colors={["#2d6a4f", "#1b9aaa"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.button}>
          <Text style={styles.buttonText}>{loading ? 'Posting...' : 'Post Ride'}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 10 },
  input: { borderWidth: 1, borderColor: '#cce3de', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff' },
  button: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { color: 'white', fontWeight: 'bold' },
  card: { padding: 12, borderRadius: 12, backgroundColor: '#f0fff4', borderWidth: 1, borderColor: '#cce3de' },
}); 