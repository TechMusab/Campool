import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RideStats {
  totalRides: number;
  completedRides: number;
  totalSaved: number;
  co2Saved: number;
  avgRating: number;
}

const STATS_KEY = 'hamraah_stats';

export const statsService = {
  // Get current stats
  async getStats(): Promise<RideStats> {
    try {
      const stats = await AsyncStorage.getItem(STATS_KEY);
      if (stats) {
        return JSON.parse(stats);
      }
      return {
        totalRides: 0,
        completedRides: 0,
        totalSaved: 0,
        co2Saved: 0,
        avgRating: 0,
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return {
        totalRides: 0,
        completedRides: 0,
        totalSaved: 0,
        co2Saved: 0,
        avgRating: 0,
      };
    }
  },

  // Update stats when a ride is started
  async updateStatsAfterRideStart(rideCost: number, distance: number): Promise<RideStats> {
    try {
      const currentStats = await this.getStats();
      const updatedStats: RideStats = {
        ...currentStats,
        totalRides: currentStats.totalRides + 1,
        totalSaved: currentStats.totalSaved + rideCost,
        co2Saved: currentStats.co2Saved + (distance * 0.2), // Approximate CO2 saved per km
      };
      
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(updatedStats));
      return updatedStats;
    } catch (error) {
      console.error('Error updating stats:', error);
      return await this.getStats();
    }
  },

  // Update stats when a ride is completed
  async updateStatsAfterRideComplete(): Promise<RideStats> {
    try {
      const currentStats = await this.getStats();
      const updatedStats: RideStats = {
        ...currentStats,
        completedRides: currentStats.completedRides + 1,
      };
      
      await AsyncStorage.setItem(STATS_KEY, JSON.stringify(updatedStats));
      return updatedStats;
    } catch (error) {
      console.error('Error updating stats:', error);
      return await this.getStats();
    }
  },

  // Reset stats (for testing)
  async resetStats(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STATS_KEY);
    } catch (error) {
      console.error('Error resetting stats:', error);
    }
  }
};
