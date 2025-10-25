import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RideRecommendation {
  id: string;
  reason: string;
  confidence: number;
  ride: any;
}

export interface UserPattern {
  frequentRoutes: { start: string; destination: string; count: number }[];
  preferredTimes: string[];
  preferredDays: string[];
  averageCost: number;
}

class RecommendationService {
  private readonly PATTERNS_KEY = 'user_patterns';
  private readonly RECOMMENDATIONS_KEY = 'ride_recommendations';

  // Analyze user patterns from ride history
  async analyzeUserPatterns(): Promise<UserPattern> {
    try {
      const rideHistory = await this.getRideHistory();
      
      const patterns: UserPattern = {
        frequentRoutes: [],
        preferredTimes: [],
        preferredDays: [],
        averageCost: 0
      };

      // Analyze frequent routes
      const routeCounts: { [key: string]: number } = {};
      const timeCounts: { [key: string]: number } = {};
      const dayCounts: { [key: string]: number } = {};
      let totalCost = 0;

      rideHistory.forEach(ride => {
        const routeKey = `${ride.startPoint}-${ride.destination}`;
        routeCounts[routeKey] = (routeCounts[routeKey] || 0) + 1;
        
        const time = ride.time.split(':')[0];
        timeCounts[time] = (timeCounts[time] || 0) + 1;
        
        const day = new Date(ride.date).getDay();
        dayCounts[day] = (dayCounts[day] || 0) + 1;
        
        totalCost += ride.costPerSeat || 0;
      });

      // Get top 3 frequent routes
      patterns.frequentRoutes = Object.entries(routeCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([route, count]) => {
          const [start, destination] = route.split('-');
          return { start, destination, count };
        });

      // Get preferred times (top 3)
      patterns.preferredTimes = Object.entries(timeCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([time]) => time);

      // Get preferred days
      patterns.preferredDays = Object.entries(dayCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([day]) => day);

      patterns.averageCost = totalCost / rideHistory.length || 0;

      await AsyncStorage.setItem(this.PATTERNS_KEY, JSON.stringify(patterns));
      return patterns;
    } catch (error) {
      console.error('Error analyzing user patterns:', error);
      return {
        frequentRoutes: [],
        preferredTimes: [],
        preferredDays: [],
        averageCost: 0
      };
    }
  }

  // Generate smart recommendations
  async generateRecommendations(availableRides: any[]): Promise<RideRecommendation[]> {
    try {
      const patterns = await this.analyzeUserPatterns();
      const recommendations: RideRecommendation[] = [];

      availableRides.forEach(ride => {
        let confidence = 0;
        let reason = '';

        // Check if route matches frequent routes
        const routeMatch = patterns.frequentRoutes.find(route => 
          route.start.toLowerCase().includes(ride.startPoint.toLowerCase()) ||
          route.destination.toLowerCase().includes(ride.destination.toLowerCase())
        );
        
        if (routeMatch) {
          confidence += 0.4;
          reason += `Matches your frequent route to ${routeMatch.destination}. `;
        }

        // Check if time matches preferred times
        const rideTime = ride.time.split(':')[0];
        if (patterns.preferredTimes.includes(rideTime)) {
          confidence += 0.3;
          reason += `Matches your preferred time (${rideTime}:00). `;
        }

        // Check if cost is reasonable
        if (ride.costPerSeat <= patterns.averageCost * 1.2) {
          confidence += 0.2;
          reason += `Good price match. `;
        }

        // Check if it's a preferred day
        const rideDay = new Date(ride.date).getDay().toString();
        if (patterns.preferredDays.includes(rideDay)) {
          confidence += 0.1;
          reason += `Matches your preferred day. `;
        }

        if (confidence > 0.3) {
          recommendations.push({
            id: `rec_${ride._id}`,
            reason: reason.trim(),
            confidence: Math.min(confidence, 1),
            ride
          });
        }
      });

      // Sort by confidence
      recommendations.sort((a, b) => b.confidence - a.confidence);

      await AsyncStorage.setItem(this.RECOMMENDATIONS_KEY, JSON.stringify(recommendations));
      return recommendations.slice(0, 5); // Top 5 recommendations
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  // Get ride history from tracking service
  private async getRideHistory(): Promise<any[]> {
    try {
      const startedRides = await AsyncStorage.getItem('started_rides');
      return startedRides ? JSON.parse(startedRides) : [];
    } catch (error) {
      console.error('Error getting ride history:', error);
      return [];
    }
  }

  // Get cached recommendations
  async getCachedRecommendations(): Promise<RideRecommendation[]> {
    try {
      const cached = await AsyncStorage.getItem(this.RECOMMENDATIONS_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Error getting cached recommendations:', error);
      return [];
    }
  }

  // Clear recommendations
  async clearRecommendations(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.RECOMMENDATIONS_KEY);
    } catch (error) {
      console.error('Error clearing recommendations:', error);
    }
  }
}

export const recommendationService = new RecommendationService();
