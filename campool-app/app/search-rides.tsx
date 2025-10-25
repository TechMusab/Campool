import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, ActivityIndicator, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import RideCard, { Ride } from '@/components/RideCard';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Logo from '@/components/Logo';
import { spacing, borderRadius, fontSize, colors } from '@/constants/spacing';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'https://campool-lm5p.vercel.app';

export default function SearchRidesScreen() {
  const router = useRouter();
  const [startPoint, setStartPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [showDate, setShowDate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Ride[]>([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Load token and user ID on mount
  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem('campool_token');
      setToken(t);
      
      // Get current user ID from stored user data
      const storedUser = await AsyncStorage.getItem('campool_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setCurrentUserId(userData.id);
      }
    })();
  }, []);

  async function onSearch() {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (startPoint) params.startPoint = startPoint;
      if (destination) params.destination = destination;
      if (date) params.datetime = date.toISOString();
      const res = await axios.get(`${API_BASE}/api/rides/search`, { params });
      setResults(res.data.items || []);
      setSearchPerformed(true); // Hide search form after search
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function resetSearch() {
    setStartPoint('');
    setDestination('');
    setDate(undefined);
    setSearchPerformed(false);
    setResults([]);
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#2d6a4f', '#1b9aaa']}
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
          <Text style={styles.headerSubtitle}>Search for available rides</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/post-ride')}
          style={styles.postRideButton}
        >
          <Ionicons name="add-circle-outline" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Search Form - Hidden after search */}
      {!searchPerformed && (
        <View style={styles.searchForm}>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>From</Text>
            <View style={styles.inputRow}>
              <Ionicons name="location-outline" size={20} color={colors.textSecondary} style={styles.icon} />
              <TextInput 
                placeholder="Start location" 
                placeholderTextColor={colors.textMuted}
                style={styles.input} 
                value={startPoint} 
                onChangeText={setStartPoint}
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>To</Text>
            <View style={styles.inputRow}>
              <Ionicons name="flag-outline" size={20} color={colors.textSecondary} style={styles.icon} />
              <TextInput 
                placeholder="Destination" 
                placeholderTextColor={colors.textMuted}
                style={styles.input} 
                value={destination} 
                onChangeText={setDestination}
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Date (Optional)</Text>
            <TouchableOpacity onPress={() => setShowDate(true)} style={styles.inputRow}> 
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} style={styles.icon} />
              <Text style={[styles.input, { paddingVertical: spacing.xs }]}>
                {date ? date.toDateString() : 'Any date'}
              </Text>
            </TouchableOpacity>
          </View>

          {showDate && (
            <DateTimePicker
              value={date || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(e, selected) => {
                setShowDate(false);
                if (selected) setDate(selected);
              }}
            />
          )}

          <TouchableOpacity onPress={onSearch} style={styles.buttonWrapper}>
            <LinearGradient colors={[colors.primary, colors.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.button}>
              <Ionicons name="search-outline" size={20} color={colors.white} />
              <Text style={styles.buttonText}>Search Rides</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Results */}
      <View style={styles.resultsContainer}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Searching for rides...</Text>
          </View>
        ) : results.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="car-outline" size={64} color={colors.textLight} />
            <Text style={styles.emptyText}>No rides found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search criteria</Text>
          </View>
        ) : (
          <>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {results.length} ride{results.length !== 1 ? 's' : ''} found
              </Text>
              <TouchableOpacity onPress={resetSearch} style={styles.resetButton}>
                <Ionicons name="search-outline" size={16} color={colors.primary} />
                <Text style={styles.resetButtonText}>Search</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={results}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => <RideCard ride={item} currentUserId={currentUserId} />}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  postRideButton: {
    padding: 8,
  },
  searchForm: {
    padding: spacing.xxl,
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
  buttonWrapper: {
    marginTop: spacing.sm,
  },
  button: { 
    paddingVertical: spacing.lg, 
    borderRadius: borderRadius.md, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  resultsContainer: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  resultsCount: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resetButtonText: {
    fontSize: fontSize.base,
    color: colors.primary,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing.huge * 2,
    paddingVertical: spacing.huge,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  emptyText: {
    marginTop: spacing.lg,
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
  },
  emptySubtext: {
    marginTop: spacing.sm,
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
});
