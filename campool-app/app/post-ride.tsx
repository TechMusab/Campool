import { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, ScrollView } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Logo from '@/components/Logo';
import { spacing, borderRadius, fontSize, colors } from '@/constants/spacing';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'https://campool-lm5p.vercel.app';

export default function PostRideScreen() {
  const [startPoint, setStartPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [seats, setSeats] = useState('1');
  const [costPerSeat, setCostPerSeat] = useState('0');
  const [distanceKm, setDistanceKm] = useState('1');
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
    setDistanceKm('1');
  }

  async function onSubmit() {
    if (!startPoint || !destination) {
      Alert.alert('Validation', 'Start and destination are required');
      return;
    }
    const seatsNum = Number(seats);
    const costNum = Number(costPerSeat);
    const distanceNum = Number(distanceKm);
    if (!(seatsNum > 0)) return Alert.alert('Validation', 'Seats must be > 0');
    if (!(costNum > 0)) return Alert.alert('Validation', 'Cost per seat must be > 0');
    if (!(distanceNum > 0)) return Alert.alert('Validation', 'Distance must be > 0');

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
          distanceKm: distanceNum,
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
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Logo size="medium" showText={false} />
        <Text style={styles.title}>Post a Ride</Text>
        <Text style={styles.subtitle}>Share your journey and save together</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Start Location</Text>
          <View style={styles.inputRow}>
            <Ionicons name="location-outline" size={20} color={colors.textSecondary} style={styles.icon} />
            <TextInput 
              placeholder="Enter start point" 
              placeholderTextColor={colors.textMuted}
              style={styles.input} 
              value={startPoint} 
              onChangeText={setStartPoint}
            />
          </View>
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Destination</Text>
          <View style={styles.inputRow}>
            <Ionicons name="flag-outline" size={20} color={colors.textSecondary} style={styles.icon} />
            <TextInput 
              placeholder="Enter destination" 
              placeholderTextColor={colors.textMuted}
              style={styles.input} 
              value={destination} 
              onChangeText={setDestination}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputWrapper, { flex: 1 }]}>
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity onPress={() => setShowDate(true)} style={styles.inputRow}> 
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} style={styles.icon} />
              <Text style={styles.inputText}>{date.toDateString()}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.inputWrapper, { flex: 1 }]}>
            <Text style={styles.label}>Time</Text>
            <TouchableOpacity onPress={() => setShowTime(true)} style={styles.inputRow}> 
              <Ionicons name="time-outline" size={20} color={colors.textSecondary} style={styles.icon} />
              <Text style={styles.inputText}>{`${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`}</Text>
            </TouchableOpacity>
          </View>
        </View>

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

        <View style={styles.row}>
          <View style={[styles.inputWrapper, { flex: 1 }]}>
            <Text style={styles.label}>Seats</Text>
            <View style={styles.inputRow}>
              <Ionicons name="people-outline" size={20} color={colors.textSecondary} style={styles.icon} />
              <TextInput
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                style={styles.input}
                value={seats}
                onChangeText={(v) => setSeats(v.replace(/[^0-9]/g, ''))}
              />
            </View>
          </View>

          <View style={[styles.inputWrapper, { flex: 1 }]}>
            <Text style={styles.label}>Distance (km)</Text>
            <View style={styles.inputRow}>
              <Ionicons name="speedometer-outline" size={20} color={colors.textSecondary} style={styles.icon} />
              <TextInput
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                style={styles.input}
                value={distanceKm}
                onChangeText={(v) => setDistanceKm(v.replace(/[^0-9.]/g, ''))}
              />
            </View>
          </View>
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Cost per Seat (Rs)</Text>
          <View style={styles.inputRow}>
            <Ionicons name="cash-outline" size={20} color={colors.textSecondary} style={styles.icon} />
            <TextInput
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              style={styles.input}
              value={costPerSeat}
              onChangeText={(v) => setCostPerSeat(v.replace(/[^0-9.]/g, ''))}
            />
          </View>
        </View>

        <View style={styles.card}> 
          <View style={styles.cardContent}>
            <Ionicons name="calculator-outline" size={24} color={colors.primary} />
            <View style={{ marginLeft: spacing.md }}>
              <Text style={styles.cardLabel}>Total Ride Cost</Text>
              <Text style={styles.cardValue}>Rs. {totalCost.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={onSubmit} disabled={loading} style={styles.buttonWrapper}>
          <LinearGradient colors={[colors.primary, colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.button}>
            <Ionicons name={loading ? "hourglass-outline" : "checkmark-circle-outline"} size={20} color={colors.white} />
            <Text style={styles.buttonText}>{loading ? 'Posting...' : 'Post Ride'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.xxl,
    paddingTop: spacing.huge + spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  form: {
    gap: spacing.lg,
  },
  inputWrapper: {
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  inputRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1.5, 
    borderColor: colors.border, 
    borderRadius: borderRadius.md, 
    paddingHorizontal: spacing.lg, 
    paddingVertical: spacing.md + 2, 
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  icon: { 
    marginRight: spacing.md,
  },
  input: { 
    flex: 1,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  inputText: {
    flex: 1,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  card: { 
    padding: spacing.lg, 
    borderRadius: borderRadius.md, 
    backgroundColor: '#f0fff4', 
    borderWidth: 1.5, 
    borderColor: colors.borderLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  cardValue: {
    fontSize: fontSize.title,
    fontWeight: '700',
    color: colors.primary,
  },
  buttonWrapper: {
    marginTop: spacing.md,
  },
  button: { 
    paddingVertical: spacing.lg, 
    borderRadius: borderRadius.md, 
    alignItems: 'center', 
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: { 
    color: colors.white, 
    fontWeight: '700',
    fontSize: fontSize.lg,
  },
});
