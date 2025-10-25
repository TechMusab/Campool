import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CustomTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
  };
  isCustom: boolean;
  isActive: boolean;
}

export interface UserPreferences {
  theme: string;
  fontSize: 'small' | 'medium' | 'large';
  language: string;
  notifications: {
    rideUpdates: boolean;
    promotions: boolean;
    achievements: boolean;
    social: boolean;
  };
  privacy: {
    shareLocation: boolean;
    showProfile: boolean;
    allowMessages: boolean;
  };
  accessibility: {
    highContrast: boolean;
    reduceMotion: boolean;
    voiceOver: boolean;
  };
}

class PersonalizationService {
  private readonly PREFERENCES_KEY = 'user_preferences';
  private readonly THEMES_KEY = 'custom_themes';
  private readonly ACTIVE_THEME_KEY = 'active_theme';

  // Default themes
  private defaultThemes: CustomTheme[] = [
    {
      id: 'default_light',
      name: 'Light Mode',
      colors: {
        primary: '#3b82f6',
        secondary: '#6b7280',
        background: '#f8fafc',
        surface: '#ffffff',
        text: '#1f2937',
        textSecondary: '#6b7280',
        border: '#e5e7eb',
        accent: '#10b981',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      },
      isCustom: false,
      isActive: false
    },
    {
      id: 'default_dark',
      name: 'Dark Mode',
      colors: {
        primary: '#3b82f6',
        secondary: '#9ca3af',
        background: '#0f0f0f',
        surface: '#1f2937',
        text: '#f9fafb',
        textSecondary: '#9ca3af',
        border: '#374151',
        accent: '#10b981',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      },
      isCustom: false,
      isActive: false
    },
    {
      id: 'ocean_blue',
      name: 'Ocean Blue',
      colors: {
        primary: '#0ea5e9',
        secondary: '#64748b',
        background: '#f0f9ff',
        surface: '#ffffff',
        text: '#0f172a',
        textSecondary: '#64748b',
        border: '#cbd5e1',
        accent: '#06b6d4',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      },
      isCustom: false,
      isActive: false
    },
    {
      id: 'forest_green',
      name: 'Forest Green',
      colors: {
        primary: '#059669',
        secondary: '#6b7280',
        background: '#f0fdf4',
        surface: '#ffffff',
        text: '#14532d',
        textSecondary: '#6b7280',
        border: '#bbf7d0',
        accent: '#22c55e',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      },
      isCustom: false,
      isActive: false
    },
    {
      id: 'sunset_orange',
      name: 'Sunset Orange',
      colors: {
        primary: '#ea580c',
        secondary: '#6b7280',
        background: '#fff7ed',
        surface: '#ffffff',
        text: '#9a3412',
        textSecondary: '#6b7280',
        border: '#fed7aa',
        accent: '#f97316',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      },
      isCustom: false,
      isActive: false
    }
  ];

  // Initialize user preferences
  async initializePreferences(): Promise<UserPreferences> {
    const defaultPreferences: UserPreferences = {
      theme: 'default_light',
      fontSize: 'medium',
      language: 'en',
      notifications: {
        rideUpdates: true,
        promotions: true,
        achievements: true,
        social: true
      },
      privacy: {
        shareLocation: true,
        showProfile: true,
        allowMessages: true
      },
      accessibility: {
        highContrast: false,
        reduceMotion: false,
        voiceOver: false
      }
    };

    try {
      await AsyncStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(defaultPreferences));
      await this.initializeThemes();
      return defaultPreferences;
    } catch (error) {
      console.error('Error initializing preferences:', error);
      return defaultPreferences;
    }
  }

  // Initialize themes
  async initializeThemes(): Promise<void> {
    try {
      const existingThemes = await this.getCustomThemes();
      if (existingThemes.length === 0) {
        await AsyncStorage.setItem(this.THEMES_KEY, JSON.stringify(this.defaultThemes));
      }
    } catch (error) {
      console.error('Error initializing themes:', error);
    }
  }

  // Get user preferences
  async getPreferences(): Promise<UserPreferences> {
    try {
      const preferences = await AsyncStorage.getItem(this.PREFERENCES_KEY);
      return preferences ? JSON.parse(preferences) : await this.initializePreferences();
    } catch (error) {
      console.error('Error getting preferences:', error);
      return await this.initializePreferences();
    }
  }

  // Update user preferences
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      const currentPreferences = await this.getPreferences();
      const updatedPreferences = { ...currentPreferences, ...preferences };
      await AsyncStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(updatedPreferences));
      return updatedPreferences;
    } catch (error) {
      console.error('Error updating preferences:', error);
      return await this.getPreferences();
    }
  }

  // Get all themes
  async getCustomThemes(): Promise<CustomTheme[]> {
    try {
      const themes = await AsyncStorage.getItem(this.THEMES_KEY);
      return themes ? JSON.parse(themes) : this.defaultThemes;
    } catch (error) {
      console.error('Error getting themes:', error);
      return this.defaultThemes;
    }
  }

  // Get active theme
  async getActiveTheme(): Promise<CustomTheme> {
    try {
      const activeThemeId = await AsyncStorage.getItem(this.ACTIVE_THEME_KEY);
      const themes = await this.getCustomThemes();
      const activeTheme = themes.find(theme => theme.id === activeThemeId);
      return activeTheme || themes[0];
    } catch (error) {
      console.error('Error getting active theme:', error);
      return this.defaultThemes[0];
    }
  }

  // Set active theme
  async setActiveTheme(themeId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.ACTIVE_THEME_KEY, themeId);
      
      // Update theme active status
      const themes = await this.getCustomThemes();
      const updatedThemes = themes.map(theme => ({
        ...theme,
        isActive: theme.id === themeId
      }));
      
      await AsyncStorage.setItem(this.THEMES_KEY, JSON.stringify(updatedThemes));
    } catch (error) {
      console.error('Error setting active theme:', error);
    }
  }

  // Create custom theme
  async createCustomTheme(theme: Omit<CustomTheme, 'id' | 'isActive'>): Promise<CustomTheme> {
    try {
      const themes = await this.getCustomThemes();
      const newTheme: CustomTheme = {
        ...theme,
        id: `custom_${Date.now()}`,
        isActive: false
      };
      
      themes.push(newTheme);
      await AsyncStorage.setItem(this.THEMES_KEY, JSON.stringify(themes));
      return newTheme;
    } catch (error) {
      console.error('Error creating custom theme:', error);
      throw error;
    }
  }

  // Update custom theme
  async updateCustomTheme(themeId: string, updates: Partial<CustomTheme>): Promise<void> {
    try {
      const themes = await this.getCustomThemes();
      const themeIndex = themes.findIndex(theme => theme.id === themeId);
      
      if (themeIndex >= 0) {
        themes[themeIndex] = { ...themes[themeIndex], ...updates };
        await AsyncStorage.setItem(this.THEMES_KEY, JSON.stringify(themes));
      }
    } catch (error) {
      console.error('Error updating custom theme:', error);
    }
  }

  // Delete custom theme
  async deleteCustomTheme(themeId: string): Promise<void> {
    try {
      const themes = await this.getCustomThemes();
      const filteredThemes = themes.filter(theme => theme.id !== themeId);
      await AsyncStorage.setItem(this.THEMES_KEY, JSON.stringify(filteredThemes));
    } catch (error) {
      console.error('Error deleting custom theme:', error);
    }
  }

  // Generate theme from image colors
  async generateThemeFromImage(imageColors: string[], name: string): Promise<CustomTheme> {
    try {
      const primaryColor = imageColors[0] || '#3b82f6';
      const secondaryColor = imageColors[1] || '#6b7280';
      const accentColor = imageColors[2] || '#10b981';

      const theme: Omit<CustomTheme, 'id' | 'isActive'> = {
        name,
        colors: {
          primary: primaryColor,
          secondary: secondaryColor,
          background: this.lightenColor(primaryColor, 0.95),
          surface: '#ffffff',
          text: this.darkenColor(primaryColor, 0.8),
          textSecondary: secondaryColor,
          border: this.lightenColor(secondaryColor, 0.8),
          accent: accentColor,
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444'
        },
        isCustom: true
      };

      return await this.createCustomTheme(theme);
    } catch (error) {
      console.error('Error generating theme from image:', error);
      throw error;
    }
  }

  // Get font size multiplier
  getFontSizeMultiplier(fontSize: 'small' | 'medium' | 'large'): number {
    switch (fontSize) {
      case 'small': return 0.9;
      case 'medium': return 1.0;
      case 'large': return 1.1;
      default: return 1.0;
    }
  }

  // Get accessibility settings
  async getAccessibilitySettings(): Promise<UserPreferences['accessibility']> {
    try {
      const preferences = await this.getPreferences();
      return preferences.accessibility;
    } catch (error) {
      console.error('Error getting accessibility settings:', error);
      return {
        highContrast: false,
        reduceMotion: false,
        voiceOver: false
      };
    }
  }

  // Update accessibility settings
  async updateAccessibilitySettings(settings: Partial<UserPreferences['accessibility']>): Promise<void> {
    try {
      const preferences = await this.getPreferences();
      preferences.accessibility = { ...preferences.accessibility, ...settings };
      await this.updatePreferences(preferences);
    } catch (error) {
      console.error('Error updating accessibility settings:', error);
    }
  }

  // Helper function to lighten color
  private lightenColor(color: string, amount: number): string {
    // Simple color lightening - in a real app, you'd use a proper color library
    return color + Math.floor(amount * 255).toString(16).padStart(2, '0');
  }

  // Helper function to darken color
  private darkenColor(color: string, amount: number): string {
    // Simple color darkening - in a real app, you'd use a proper color library
    return color.replace('#', '') + Math.floor(amount * 255).toString(16).padStart(2, '0');
  }

  // Reset to default preferences
  async resetPreferences(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.PREFERENCES_KEY);
      await AsyncStorage.removeItem(this.ACTIVE_THEME_KEY);
      await this.initializePreferences();
    } catch (error) {
      console.error('Error resetting preferences:', error);
    }
  }

  // Export preferences (for backup)
  async exportPreferences(): Promise<string> {
    try {
      const preferences = await this.getPreferences();
      const themes = await this.getCustomThemes();
      return JSON.stringify({ preferences, themes }, null, 2);
    } catch (error) {
      console.error('Error exporting preferences:', error);
      return '';
    }
  }

  // Import preferences (for restore)
  async importPreferences(data: string): Promise<void> {
    try {
      const { preferences, themes } = JSON.parse(data);
      await AsyncStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(preferences));
      await AsyncStorage.setItem(this.THEMES_KEY, JSON.stringify(themes));
    } catch (error) {
      console.error('Error importing preferences:', error);
      throw error;
    }
  }
}

export const personalizationService = new PersonalizationService();
