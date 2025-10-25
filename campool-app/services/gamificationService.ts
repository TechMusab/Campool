import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlockedAt?: string;
  category: 'ride' | 'streak' | 'social' | 'eco' | 'special';
}

export interface UserStats {
  totalPoints: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  achievements: Achievement[];
  badges: string[];
  lastRideDate?: string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastRideDate?: string;
}

class GamificationService {
  private readonly STATS_KEY = 'user_gamification_stats';
  private readonly ACHIEVEMENTS_KEY = 'user_achievements';
  private readonly STREAK_KEY = 'ride_streak';

  // Initialize user stats
  async initializeStats(): Promise<UserStats> {
    const defaultStats: UserStats = {
      totalPoints: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0,
      achievements: [],
      badges: []
    };

    try {
      await AsyncStorage.setItem(this.STATS_KEY, JSON.stringify(defaultStats));
      return defaultStats;
    } catch (error) {
      console.error('Error initializing stats:', error);
      return defaultStats;
    }
  }

  // Get user stats
  async getUserStats(): Promise<UserStats> {
    try {
      const stats = await AsyncStorage.getItem(this.STATS_KEY);
      return stats ? JSON.parse(stats) : await this.initializeStats();
    } catch (error) {
      console.error('Error getting user stats:', error);
      return await this.initializeStats();
    }
  }

  // Add points for ride completion
  async addRidePoints(rideCost: number, distance: number): Promise<UserStats> {
    try {
      const stats = await this.getUserStats();
      
      // Calculate points based on ride
      let points = 0;
      points += Math.floor(rideCost * 0.1); // 10% of cost as points
      points += Math.floor(distance * 2); // 2 points per km
      points += 10; // Base completion points

      // Update stats
      stats.totalPoints += points;
      stats.level = Math.floor(stats.totalPoints / 100) + 1;

      // Update streak
      await this.updateStreak();

      // Check for new achievements
      await this.checkAchievements(stats);

      await AsyncStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
      return stats;
    } catch (error) {
      console.error('Error adding ride points:', error);
      return await this.getUserStats();
    }
  }

  // Update ride streak
  async updateStreak(): Promise<StreakData> {
    try {
      const today = new Date().toDateString();
      const streakData = await this.getStreakData();

      if (streakData.lastRideDate === today) {
        // Already rode today, no change
        return streakData;
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      if (streakData.lastRideDate === yesterdayStr) {
        // Continuing streak
        streakData.currentStreak += 1;
      } else if (streakData.lastRideDate && streakData.lastRideDate !== yesterdayStr) {
        // Streak broken
        streakData.currentStreak = 1;
      } else {
        // First ride or starting new streak
        streakData.currentStreak = 1;
      }

      streakData.longestStreak = Math.max(streakData.longestStreak, streakData.currentStreak);
      streakData.lastRideDate = today;

      await AsyncStorage.setItem(this.STREAK_KEY, JSON.stringify(streakData));
      return streakData;
    } catch (error) {
      console.error('Error updating streak:', error);
      return { currentStreak: 0, longestStreak: 0 };
    }
  }

  // Get streak data
  async getStreakData(): Promise<StreakData> {
    try {
      const streak = await AsyncStorage.getItem(this.STREAK_KEY);
      return streak ? JSON.parse(streak) : { currentStreak: 0, longestStreak: 0 };
    } catch (error) {
      console.error('Error getting streak data:', error);
      return { currentStreak: 0, longestStreak: 0 };
    }
  }

  // Check for new achievements
  async checkAchievements(stats: UserStats): Promise<Achievement[]> {
    const allAchievements = this.getAllAchievements();
    const newAchievements: Achievement[] = [];

    for (const achievement of allAchievements) {
      if (this.isAchievementUnlocked(achievement, stats) && 
          !stats.achievements.find(a => a.id === achievement.id)) {
        
        const unlockedAchievement = {
          ...achievement,
          unlockedAt: new Date().toISOString()
        };
        
        stats.achievements.push(unlockedAchievement);
        newAchievements.push(unlockedAchievement);
      }
    }

    return newAchievements;
  }

  // Check if achievement is unlocked
  private isAchievementUnlocked(achievement: Achievement, stats: UserStats): boolean {
    switch (achievement.id) {
      case 'first_ride':
        return stats.totalPoints > 0;
      case 'level_5':
        return stats.level >= 5;
      case 'level_10':
        return stats.level >= 10;
      case 'streak_7':
        return stats.currentStreak >= 7;
      case 'streak_30':
        return stats.currentStreak >= 30;
      case 'points_1000':
        return stats.totalPoints >= 1000;
      case 'eco_warrior':
        return stats.achievements.filter(a => a.category === 'eco').length >= 3;
      case 'social_butterfly':
        return stats.achievements.filter(a => a.category === 'social').length >= 2;
      default:
        return false;
    }
  }

  // Get all available achievements
  private getAllAchievements(): Achievement[] {
    return [
      {
        id: 'first_ride',
        name: 'First Ride',
        description: 'Complete your first ride',
        icon: '🚗',
        points: 50,
        category: 'ride'
      },
      {
        id: 'level_5',
        name: 'Rising Star',
        description: 'Reach level 5',
        icon: '⭐',
        points: 100,
        category: 'ride'
      },
      {
        id: 'level_10',
        name: 'Ride Master',
        description: 'Reach level 10',
        icon: '👑',
        points: 200,
        category: 'ride'
      },
      {
        id: 'streak_7',
        name: 'Week Warrior',
        description: 'Ride for 7 days straight',
        icon: '🔥',
        points: 150,
        category: 'streak'
      },
      {
        id: 'streak_30',
        name: 'Month Master',
        description: 'Ride for 30 days straight',
        icon: '💎',
        points: 500,
        category: 'streak'
      },
      {
        id: 'points_1000',
        name: 'Point Collector',
        description: 'Earn 1000 points',
        icon: '💰',
        points: 300,
        category: 'special'
      },
      {
        id: 'eco_warrior',
        name: 'Eco Warrior',
        description: 'Save the planet with 10 eco-friendly rides',
        icon: '🌱',
        points: 250,
        category: 'eco'
      },
      {
        id: 'social_butterfly',
        name: 'Social Butterfly',
        description: 'Share 5 rides with friends',
        icon: '🦋',
        points: 200,
        category: 'social'
      }
    ];
  }

  // Get leaderboard data (mock for now)
  async getLeaderboard(): Promise<any[]> {
    // This would typically fetch from backend
    return [
      { rank: 1, name: 'Alex', points: 2500, level: 15 },
      { rank: 2, name: 'Sarah', points: 2200, level: 14 },
      { rank: 3, name: 'Mike', points: 2000, level: 13 }
    ];
  }

  // Get daily challenges
  async getDailyChallenges(): Promise<any[]> {
    return [
      {
        id: 'daily_ride',
        title: 'Daily Ride',
        description: 'Complete a ride today',
        points: 50,
        completed: false
      },
      {
        id: 'share_ride',
        title: 'Share a Ride',
        description: 'Share a ride with friends',
        points: 25,
        completed: false
      },
      {
        id: 'eco_ride',
        title: 'Eco Ride',
        description: 'Take a ride that saves CO2',
        points: 75,
        completed: false
      }
    ];
  }

  // Reset stats (for testing)
  async resetStats(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STATS_KEY);
      await AsyncStorage.removeItem(this.ACHIEVEMENTS_KEY);
      await AsyncStorage.removeItem(this.STREAK_KEY);
    } catch (error) {
      console.error('Error resetting stats:', error);
    }
  }
}

export const gamificationService = new GamificationService();
