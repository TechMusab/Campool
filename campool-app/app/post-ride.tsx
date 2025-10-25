import { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Platform, 
  ScrollView,
  useColorScheme,
  ActivityIndicator
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'https://campool-lm5p.vercel.app';

export default function PostRideScreen() {
  const router = useRouter();
  const { isDark, colors } = useTheme();
  
  const [startPoint, setStartPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [seats, setSeats] = useState('1');
  const [costPerSeat, setCostPerSeat] = useState('0');
  const [distanceKm, setDistanceKm] = useState('1');
  const [passengerPreference, setPassengerPreference] = useState<'any' | 'male' | 'female'>('any');
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
    setPassengerPreference('any');
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
      
      const response = await fetch(`${API_BASE}/api/rides/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startPoint,
          destination,
          date: isoDate.toISOString(),
          time: `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`,
          seats: seatsNum,
          costPerSeat: costNum,
          distanceKm: distanceNum,
          passengerPreference,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Ride posted successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
        reset();
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'Failed to post ride');
      }
    } catch (e: any) {
      console.error('Post ride error:', e);
      Alert.alert('Error', 'Failed to post ride. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const PassengerPreferenceSelector = () => (
    <View style={styles.preferenceContainer}>
      <Text style={[styles.label, isDark && styles.labelDark]}>Passenger Preference</Text>
      <View style={styles.preferenceRow}>
        {[
          { value: 'any', label: 'Any', icon: 'people-outline' },
          { value: 'male', label: 'Male Only', icon: 'man-outline' },
          { value: 'female', label: 'Female Only', icon: 'woman-outline' },
        ].map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.preferenceButton,
              passengerPreference === option.value && styles.preferenceButtonSelected,
              isDark && styles.preferenceButtonDark,
              passengerPreference === option.value && isDark && styles.preferenceButtonSelectedDark
            ]}
            onPress={() => setPassengerPreference(option.value as any)}
          >
            <Ionicons 
              name={option.icon as any} 
              size={20} 
              color={passengerPreference === option.value ? 'white' : (isDark ? '#9ca3af' : '#6b7280')} 
            />
            <Text style={[
              styles.preferenceText,
              passengerPreference === option.value && styles.preferenceTextSelected,
              isDark && styles.preferenceTextDark,
              passengerPreference === option.value && isDark && styles.preferenceTextSelectedDark
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#1a1a1a', '#2d2d2d'] : ['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Post a Ride</Text>
          <Text style={styles.headerSubtitle}>Share your journey and save together</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Form */}
        <View style={[styles.form, isDark && styles.formDark]}>
          {/* Location Inputs */}
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, isDark && styles.labelDark]}>From</Text>
              <View style={[styles.inputWrapper, isDark && styles.inputWrapperDark]}>
                <Ionicons name="location-outline" size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
                <TextInput
                  placeholder="Enter start point"
                  placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                  style={[styles.input, isDark && styles.inputDark]}
                  value={startPoint}
                  onChangeText={setStartPoint}
                />
              </View>
            </View>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, isDark && styles.labelDark]}>To</Text>
              <View style={[styles.inputWrapper, isDark && styles.inputWrapperDark]}>
                <Ionicons name="location" size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
                <TextInput
                  placeholder="Enter destination"
                  placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                  style={[styles.input, isDark && styles.inputDark]}
                  value={destination}
                  onChangeText={setDestination}
                />
              </View>
            </View>
          </View>

          {/* Date and Time */}
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, isDark && styles.labelDark]}>Date</Text>
              <TouchableOpacity
                style={[styles.dateTimeButton, isDark && styles.dateTimeButtonDark]}
                onPress={() => setShowDate(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
                <Text style={[styles.dateTimeText, isDark && styles.dateTimeTextDark]}>
                  {date.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, isDark && styles.labelDark]}>Time</Text>
              <TouchableOpacity
                style={[styles.dateTimeButton, isDark && styles.dateTimeButtonDark]}
                onPress={() => setShowTime(true)}
              >
                <Ionicons name="time-outline" size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
                <Text style={[styles.dateTimeText, isDark && styles.dateTimeTextDark]}>
                  {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Seats and Cost */}
          <View style={styles.inputRow}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, isDark && styles.labelDark]}>Available Seats</Text>
              <View style={[styles.inputWrapper, isDark && styles.inputWrapperDark]}>
                <Ionicons name="people-outline" size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
                <TextInput
                  placeholder="Number of seats"
                  placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                  style={[styles.input, isDark && styles.inputDark]}
                  value={seats}
                  onChangeText={setSeats}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, isDark && styles.labelDark]}>Cost per Seat (Rs.)</Text>
              <View style={[styles.inputWrapper, isDark && styles.inputWrapperDark]}>
                <Ionicons name="wallet-outline" size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
                <TextInput
                  placeholder="Cost per seat"
                  placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                  style={[styles.input, isDark && styles.inputDark]}
                  value={costPerSeat}
                  onChangeText={setCostPerSeat}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Distance */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, isDark && styles.labelDark]}>Distance (km)</Text>
            <View style={[styles.inputWrapper, isDark && styles.inputWrapperDark]}>
              <Ionicons name="speedometer-outline" size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
              <TextInput
                placeholder="Distance in kilometers"
                placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                style={[styles.input, isDark && styles.inputDark]}
                value={distanceKm}
                onChangeText={setDistanceKm}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Passenger Preference */}
          <PassengerPreferenceSelector />

          {/* Cost Summary */}
          <View style={[styles.costSummary, isDark && styles.costSummaryDark]}>
            <Text style={[styles.costLabel, isDark && styles.costLabelDark]}>Total Ride Cost</Text>
            <Text style={[styles.costValue, isDark && styles.costValueDark]}>Rs. {totalCost.toFixed(2)}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.resetButton, isDark && styles.resetButtonDark]}
              onPress={reset}
            >
              <Ionicons name="refresh" size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
              <Text style={[styles.resetButtonText, isDark && styles.resetButtonTextDark]}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={onSubmit}
              disabled={loading}
            >
              <LinearGradient
                colors={isDark ? ['#374151', '#1f2937'] : ['#10b981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                    <Text style={styles.submitButtonText}>Post Ride</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Date Picker */}
      {showDate && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDate(false);
            if (selectedDate) {
              setDate(selectedDate);
            }
          }}
        />
      )}

      {/* Time Picker */}
      {showTime && (
        <DateTimePicker
          value={time}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedTime) => {
            setShowTime(false);
            if (selectedTime) {
              setTime(selectedTime);
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  containerDark: {
    backgroundColor: '#0f0f0f',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  formDark: {
    backgroundColor: '#1f2937',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  labelDark: {
    color: '#f9fafb',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputWrapperDark: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1f2937',
  },
  inputDark: {
    color: '#f9fafb',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dateTimeButtonDark: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
  },
  dateTimeText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#1f2937',
  },
  dateTimeTextDark: {
    color: '#f9fafb',
  },
  preferenceContainer: {
    marginBottom: 16,
  },
  preferenceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  preferenceButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  preferenceButtonSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  preferenceButtonDark: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
  },
  preferenceButtonSelectedDark: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  preferenceText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  preferenceTextSelected: {
    color: 'white',
  },
  preferenceTextDark: {
    color: '#d1d5db',
  },
  preferenceTextSelectedDark: {
    color: 'white',
  },
  costSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  costSummaryDark: {
    backgroundColor: '#1e3a8a',
    borderColor: '#3b82f6',
  },
  costLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0369a1',
  },
  costLabelDark: {
    color: '#93c5fd',
  },
  costValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0369a1',
  },
  costValueDark: {
    color: '#93c5fd',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
  },
  resetButtonDark: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
  },
  resetButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#6b7280',
  },
  resetButtonTextDark: {
    color: '#9ca3af',
  },
  submitButton: {
    flex: 1,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});