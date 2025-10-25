import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity, 
  Platform, 
  Alert,
  useColorScheme,
  Dimensions
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RideCard, { Ride } from '../components/RideCard';
import { statsService } from '../services/statsService';
import { rideTrackingService } from '../services/rideTrackingService';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');
const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'https://campool-lm5p.vercel.app';

// University options
const UNIVERSITIES = [
  'NUST',
  'FAST',
  'COMSATS',
  'LUMS',
  'IBA',
  'UET',
  'PIEAS',
  'Other'
];

export default function SearchRidesScreen() {
  const router = useRouter();
  const { isDark, colors } = useTheme();
  
  const [startPoint, setStartPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [university, setUniversity] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [showDate, setShowDate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Ride[]>([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showAllRides, setShowAllRides] = useState(true);

  // Load token and user ID on mount
  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem('campool_token');
      setToken(t);
      
      try {
        const storedUser = await AsyncStorage.getItem('campool_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setCurrentUserId(userData.id);
        }
      } catch (error) {
        console.log('Error loading user data:', error);
      }
    })();
  }, []);

  // Load all rides on mount
  useEffect(() => {
    loadAllRides();
  }, []);

  // Refresh ride status when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // This will trigger RideCard components to re-check their status
      loadAllRides();
    }, [])
  );

  const loadAllRides = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/rides/search`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.items || []);
        setShowAllRides(true);
      }
    } catch (error) {
      console.log('Error loading rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSearch = async () => {
    try {
      setLoading(true);
      
      // If no search criteria, show all rides
      if (!startPoint && !destination && !university && !date) {
        await loadAllRides();
        setSearchPerformed(false);
        setShowAllRides(true);
        return;
      }
      
      const params: Record<string, string> = {};
      if (startPoint) params.startPoint = startPoint;
      if (destination) params.destination = destination;
      if (university) params.university = university;
      if (date) params.datetime = date.toISOString();
      
      const queryString = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/api/rides/search?${queryString}`);
      
      if (res.ok) {
        const data = await res.json();
        let filteredResults = data.items || [];
        
        // Client-side filtering for university if backend doesn't support it
        if (university && university !== 'Other') {
          filteredResults = filteredResults.filter((ride: any) => {
            // Check if ride has university info or if it matches the selected university
            return ride.university === university || 
                   ride.startPoint.toLowerCase().includes(university.toLowerCase()) ||
                   ride.destination.toLowerCase().includes(university.toLowerCase());
          });
        }
        
        setResults(filteredResults);
        setSearchPerformed(true);
        setShowAllRides(false);
      }
    } catch (error) {
      console.log('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setStartPoint('');
    setDestination('');
    setUniversity('');
    setDate(undefined);
    setSearchPerformed(false);
    setShowAllRides(true);
    loadAllRides();
  };

  const UniversitySelector = () => (
    <View style={styles.universityContainer}>
      <Text style={[styles.label, isDark && styles.labelDark]}>University</Text>
      <View style={styles.universityGrid}>
        {UNIVERSITIES.map((uni) => (
          <TouchableOpacity
            key={uni}
            style={[
              styles.universityChip,
              university === uni && styles.universityChipSelected,
              isDark && styles.universityChipDark,
              university === uni && isDark && styles.universityChipSelectedDark
            ]}
            onPress={() => setUniversity(uni)}
          >
            <Text style={[
              styles.universityChipText,
              university === uni && styles.universityChipTextSelected,
              isDark && styles.universityChipTextDark,
              university === uni && isDark && styles.universityChipTextSelectedDark
            ]}>
              {uni}
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
          <Text style={styles.headerTitle}>Find a Ride</Text>
          <Text style={styles.headerSubtitle}>
            {showAllRides ? 'All available rides' : 'Search results'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/post-ride')}
          style={styles.postRideButton}
        >
          <Ionicons name="add-circle-outline" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Search Form */}
      <View style={[styles.searchForm, isDark && styles.searchFormDark]}>
        <View style={styles.searchRow}>
          <View style={styles.inputContainer}>
            <Ionicons name="location-outline" size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              placeholder="From"
              placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
              value={startPoint}
              onChangeText={setStartPoint}
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="location" size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
            <TextInput
              style={[styles.input, isDark && styles.inputDark]}
              placeholder="To"
              placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
              value={destination}
              onChangeText={setDestination}
            />
          </View>
        </View>

        <UniversitySelector />

        <View style={styles.dateContainer}>
          <TouchableOpacity
            style={[styles.dateButton, isDark && styles.dateButtonDark]}
            onPress={() => setShowDate(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
            <Text style={[styles.dateText, isDark && styles.dateTextDark]}>
              {date ? date.toLocaleDateString() : 'Select Date'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.searchButton, isDark && styles.searchButtonDark]}
            onPress={onSearch}
            disabled={loading}
          >
            <LinearGradient
              colors={isDark ? ['#374151', '#1f2937'] : ['#3b82f6', '#1d4ed8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.searchButtonGradient}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="search" size={20} color="white" />
                  <Text style={styles.searchButtonText}>Search</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.resetButton, isDark && styles.resetButtonDark]}
            onPress={resetSearch}
          >
            <Ionicons name="refresh" size={20} color={isDark ? "#9ca3af" : "#6b7280"} />
            <Text style={[styles.resetButtonText, isDark && styles.resetButtonTextDark]}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Results */}
      <View style={styles.resultsContainer}>
        <View style={styles.resultsHeader}>
          <Text style={[styles.resultsTitle, isDark && styles.resultsTitleDark]}>
            {showAllRides ? 'All Available Rides' : 'Search Results'}
          </Text>
          <Text style={[styles.resultsCount, isDark && styles.resultsCountDark]}>
            {results.length} ride{results.length !== 1 ? 's' : ''} found
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
              {showAllRides ? 'Loading rides...' : 'Searching...'}
            </Text>
          </View>
        ) : results.length > 0 ? (
          <FlatList
            data={results}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <RideCard 
                ride={item} 
                currentUserId={currentUserId}
                // No callback needed - stats are updated in RideCard
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.ridesList}
          />
        ) : (
          <View style={[styles.emptyState, isDark && styles.emptyStateDark]}>
            <Ionicons name="search-outline" size={48} color={isDark ? "#6b7280" : "#9ca3af"} />
            <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>
              {showAllRides ? 'No rides available' : 'No rides found'}
            </Text>
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
              {showAllRides 
                ? 'Be the first to post a ride!' 
                : 'Try adjusting your search criteria'
              }
            </Text>
          </View>
        )}
      </View>

      {/* Date Picker */}
      {showDate && (
        <DateTimePicker
          value={date || new Date()}
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
  postRideButton: {
    padding: 8,
  },
  searchForm: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  searchFormDark: {
    backgroundColor: '#1f2937',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
  universityContainer: {
    marginBottom: 16,
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
  universityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  universityChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  universityChipSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  universityChipDark: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
  },
  universityChipSelectedDark: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  universityChipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  universityChipTextSelected: {
    color: 'white',
  },
  universityChipTextDark: {
    color: '#d1d5db',
  },
  universityChipTextSelectedDark: {
    color: 'white',
  },
  dateContainer: {
    marginBottom: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dateButtonDark: {
    backgroundColor: '#374151',
    borderColor: '#4b5563',
  },
  dateText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#1f2937',
  },
  dateTextDark: {
    color: '#f9fafb',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  searchButton: {
    flex: 1,
  },
  searchButtonDark: {
    // Same as searchButton
  },
  searchButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  resultsTitleDark: {
    color: '#f9fafb',
  },
  resultsCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  resultsCountDark: {
    color: '#9ca3af',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  loadingTextDark: {
    color: '#9ca3af',
  },
  ridesList: {
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateDark: {
    // Same as emptyState
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyTitleDark: {
    color: '#f9fafb',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyTextDark: {
    color: '#9ca3af',
  },
});