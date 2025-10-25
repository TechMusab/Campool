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
import { gamificationService, UserStats, Achievement } from '../services/gamificationService';

export default function GamificationScreen() {
  const router = useRouter();
  const { isDark, colors } = useTheme();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [dailyChallenges, setDailyChallenges] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadGamificationData();
  }, []);

  const loadGamificationData = async () => {
    try {
      setLoading(true);
      const [stats, challenges, leaderboardData] = await Promise.all([
        gamificationService.getUserStats(),
        gamificationService.getDailyChallenges(),
        gamificationService.getLeaderboard()
      ]);
      
      setUserStats(stats);
      setAchievements(stats.achievements);
      setDailyChallenges(challenges);
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error loading gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGamificationData();
    setRefreshing(false);
  };

  const getLevelProgress = () => {
    if (!userStats) return 0;
    const currentLevelPoints = (userStats.level - 1) * 100;
    const nextLevelPoints = userStats.level * 100;
    const progress = ((userStats.totalPoints - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;
    return Math.min(progress, 100);
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return '🔥🔥🔥';
    if (streak >= 7) return '🔥🔥';
    if (streak >= 3) return '🔥';
    return '💪';
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
          <Text style={styles.headerTitle}>Achievements</Text>
          <Text style={styles.headerSubtitle}>Your progress & rewards</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#fff' : '#000'} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#2d6a4f" style={styles.loadingIndicator} />
        ) : (
          <>
            {/* User Stats */}
            {userStats && (
              <View style={[styles.statsCard, isDark && styles.statsCardDark]}>
                <View style={styles.statsHeader}>
                  <Text style={[styles.statsTitle, isDark && styles.statsTitleDark]}>Your Progress</Text>
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelText}>Level {userStats.level}</Text>
                  </View>
                </View>
                
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, isDark && styles.statValueDark]}>{userStats.totalPoints}</Text>
                    <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Total Points</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, isDark && styles.statValueDark]}>
                      {getStreakEmoji(userStats.currentStreak)} {userStats.currentStreak}
                    </Text>
                    <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Day Streak</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, isDark && styles.statValueDark]}>{userStats.longestStreak}</Text>
                    <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Best Streak</Text>
                  </View>
                </View>

                {/* Level Progress */}
                <View style={styles.progressContainer}>
                  <Text style={[styles.progressLabel, isDark && styles.progressLabelDark]}>
                    Progress to Level {userStats.level + 1}
                  </Text>
                  <View style={[styles.progressBar, isDark && styles.progressBarDark]}>
                    <View 
                      style={[styles.progressFill, { width: `${getLevelProgress()}%` }]} 
                    />
                  </View>
                  <Text style={[styles.progressText, isDark && styles.progressTextDark]}>
                    {userStats.totalPoints} / {(userStats.level * 100)} points
                  </Text>
                </View>
              </View>
            )}

            {/* Daily Challenges */}
            <View style={[styles.section, isDark && styles.sectionDark]}>
              <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Daily Challenges</Text>
              {dailyChallenges.map((challenge, index) => (
                <View key={index} style={[styles.challengeItem, isDark && styles.challengeItemDark]}>
                  <View style={styles.challengeInfo}>
                    <Text style={[styles.challengeTitle, isDark && styles.challengeTitleDark]}>
                      {challenge.title}
                    </Text>
                    <Text style={[styles.challengeDescription, isDark && styles.challengeDescriptionDark]}>
                      {challenge.description}
                    </Text>
                  </View>
                  <View style={styles.challengeReward}>
                    <Text style={[styles.challengePoints, isDark && styles.challengePointsDark]}>
                      +{challenge.points}
                    </Text>
                    <Ionicons 
                      name={challenge.completed ? "checkmark-circle" : "ellipse-outline"} 
                      size={24} 
                      color={challenge.completed ? "#10b981" : (isDark ? "#6b7280" : "#9ca3af")} 
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Achievements */}
            <View style={[styles.section, isDark && styles.sectionDark]}>
              <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Achievements</Text>
              <View style={styles.achievementsGrid}>
                {achievements.map((achievement, index) => (
                  <View key={index} style={[styles.achievementCard, isDark && styles.achievementCardDark]}>
                    <View style={styles.achievementIcon}>
                      <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
                    </View>
                    <Text style={[styles.achievementName, isDark && styles.achievementNameDark]}>
                      {achievement.name}
                    </Text>
                    <Text style={[styles.achievementDescription, isDark && styles.achievementDescriptionDark]}>
                      {achievement.description}
                    </Text>
                    <View style={styles.achievementReward}>
                      <Text style={[styles.achievementPoints, isDark && styles.achievementPointsDark]}>
                        +{achievement.points} pts
                      </Text>
                      {achievement.unlockedAt && (
                        <Text style={[styles.achievementDate, isDark && styles.achievementDateDark]}>
                          {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Leaderboard */}
            <View style={[styles.section, isDark && styles.sectionDark]}>
              <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Leaderboard</Text>
              {leaderboard.map((player, index) => (
                <View key={index} style={[styles.leaderboardItem, isDark && styles.leaderboardItemDark]}>
                  <View style={styles.leaderboardRank}>
                    <Text style={[styles.rankNumber, isDark && styles.rankNumberDark]}>#{player.rank}</Text>
                  </View>
                  <View style={styles.leaderboardInfo}>
                    <Text style={[styles.playerName, isDark && styles.playerNameDark]}>{player.name}</Text>
                    <Text style={[styles.playerLevel, isDark && styles.playerLevelDark]}>Level {player.level}</Text>
                  </View>
                  <View style={styles.leaderboardPoints}>
                    <Text style={[styles.playerPoints, isDark && styles.playerPointsDark]}>{player.points}</Text>
                    <Text style={[styles.pointsLabel, isDark && styles.pointsLabelDark]}>points</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
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
  scrollContent: {
    paddingBottom: 20,
  },
  statsCard: {
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 15,
    padding: 20,
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
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statsTitleDark: {
    color: '#f9fafb',
  },
  levelBadge: {
    backgroundColor: '#2d6a4f',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  levelText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
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
  progressContainer: {
    marginTop: 10,
  },
  progressLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  progressLabelDark: {
    color: '#9ca3af',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarDark: {
    backgroundColor: '#374151',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2d6a4f',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  progressTextDark: {
    color: '#9ca3af',
  },
  section: {
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionDark: {
    backgroundColor: '#1f2937',
    shadowOpacity: 0.3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
  },
  sectionTitleDark: {
    color: '#f9fafb',
  },
  challengeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  challengeItemDark: {
    borderBottomColor: '#374151',
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  challengeTitleDark: {
    color: '#f9fafb',
  },
  challengeDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  challengeDescriptionDark: {
    color: '#9ca3af',
  },
  challengeReward: {
    alignItems: 'center',
  },
  challengePoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d6a4f',
  },
  challengePointsDark: {
    color: '#1b9aaa',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementCard: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  achievementCardDark: {
    backgroundColor: '#374151',
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  achievementEmoji: {
    fontSize: 24,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementNameDark: {
    color: '#f9fafb',
  },
  achievementDescription: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  achievementDescriptionDark: {
    color: '#9ca3af',
  },
  achievementReward: {
    alignItems: 'center',
  },
  achievementPoints: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2d6a4f',
  },
  achievementPointsDark: {
    color: '#1b9aaa',
  },
  achievementDate: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },
  achievementDateDark: {
    color: '#9ca3af',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  leaderboardItemDark: {
    borderBottomColor: '#374151',
  },
  leaderboardRank: {
    width: 40,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d6a4f',
  },
  rankNumberDark: {
    color: '#1b9aaa',
  },
  leaderboardInfo: {
    flex: 1,
    marginLeft: 15,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  playerNameDark: {
    color: '#f9fafb',
  },
  playerLevel: {
    fontSize: 14,
    color: '#6b7280',
  },
  playerLevelDark: {
    color: '#9ca3af',
  },
  leaderboardPoints: {
    alignItems: 'flex-end',
  },
  playerPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d6a4f',
  },
  playerPointsDark: {
    color: '#1b9aaa',
  },
  pointsLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  pointsLabelDark: {
    color: '#9ca3af',
  },
  loadingIndicator: {
    marginTop: 50,
  },
});
