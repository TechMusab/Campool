import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { recommendationService, RideRecommendation } from '../services/recommendationService';
import { gamificationService } from '../services/gamificationService';
import RideCard from '../components/RideCard';

export default function RecommendationsScreen() {
  const router = useRouter();
  const { isDark, colors } = useTheme();
  const [recommendations, setRecommendations] = useState<RideRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userStats, setUserStats] = useState<any>(null);

  useEffect(() => {
    loadRecommendations();
    loadUserStats();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const cachedRecommendations = await recommendationService.getCachedRecommendations();
      setRecommendations(cachedRecommendations);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const stats = await gamificationService.getUserStats();
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecommendations();
    await loadUserStats();
    setRefreshing(false);
  };

  const handleRideStart = async (rideCost: number, distance: number) => {
    // Add gamification points
    await gamificationService.addRidePoints(rideCost, distance);
    await loadUserStats();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#10b981';
    if (confidence >= 0.6) return '#f59e0b';
    return '#ef4444';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'Perfect Match';
    if (confidence >= 0.6) return 'Good Match';
    return 'Maybe';
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Header */}
      <LinearGradient
        colors={['#2d6a4f', '#1b9aaa']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Smart Recommendations</Text>
          <Text style={styles.headerSubtitle}>Rides tailored for you</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      {/* User Stats */}
      {userStats && (
        <View style={[styles.statsCard, isDark && styles.statsCardDark]}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, isDark && styles.statValueDark]}>{userStats.level}</Text>
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Level</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, isDark && styles.statValueDark]}>{userStats.totalPoints}</Text>
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Points</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, isDark && styles.statValueDark]}>{userStats.currentStreak}</Text>
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Streak</Text>
            </View>
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#fff' : '#000'} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#2d6a4f" style={styles.loadingIndicator} />
        ) : recommendations.length > 0 ? (
          recommendations.map((recommendation) => (
            <View key={recommendation.id} style={[styles.recommendationCard, isDark && styles.recommendationCardDark]}>
              {/* Recommendation Header */}
              <View style={styles.recommendationHeader}>
                <View style={styles.recommendationInfo}>
                  <Text style={[styles.recommendationTitle, isDark && styles.recommendationTitleDark]}>
                    Recommended for you
                  </Text>
                  <Text style={[styles.recommendationReason, isDark && styles.recommendationReasonDark]}>
                    {recommendation.reason}
                  </Text>
                </View>
                <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(recommendation.confidence) }]}>
                  <Text style={styles.confidenceText}>
                    {getConfidenceText(recommendation.confidence)}
                  </Text>
                </View>
              </View>

              {/* Ride Card */}
              <RideCard
                ride={recommendation.ride}
                currentUserId="current_user"
                onRideStarted={handleRideStart}
              />
            </View>
          ))
        ) : (
          <View style={[styles.emptyState, isDark && styles.emptyStateDark]}>
            <Ionicons name="bulb-outline" size={48} color={isDark ? '#6b7280' : '#9ca3af'} />
            <Text style={[styles.emptyTitle, isDark && styles.emptyTitleDark]}>No recommendations yet</Text>
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
              Complete a few rides to get personalized recommendations!
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => router.push('/search-rides')}
            >
              <LinearGradient
                colors={['#2d6a4f', '#1b9aaa']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.exploreGradient}
              >
                <Text style={styles.exploreText}>Explore Rides</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  containerDark: {
    backgroundColor: '#0f0f0f',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    padding: 5,
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
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  refreshButton: {
    padding: 5,
  },
  statsCard: {
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsCardDark: {
    backgroundColor: '#1f2937',
    shadowOpacity: 0.3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d6a4f',
  },
  statValueDark: {
    color: '#1b9aaa',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statLabelDark: {
    color: '#9ca3af',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  recommendationCard: {
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  recommendationCardDark: {
    backgroundColor: '#1f2937',
    shadowOpacity: 0.3,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  recommendationInfo: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  recommendationTitleDark: {
    color: '#f9fafb',
  },
  recommendationReason: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  recommendationReasonDark: {
    color: '#9ca3af',
  },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  confidenceText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingIndicator: {
    marginTop: 50,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    marginHorizontal: 15,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateDark: {
    backgroundColor: '#1f2937',
    shadowOpacity: 0.3,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 15,
    marginBottom: 5,
  },
  emptyTitleDark: {
    color: '#f9fafb',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  emptyTextDark: {
    color: '#9ca3af',
  },
  exploreButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  exploreGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  exploreText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
