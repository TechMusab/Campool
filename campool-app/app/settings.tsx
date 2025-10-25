import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  useColorScheme,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isDark: themeIsDark, toggleTheme, colors } = useTheme();
  
  const [settings, setSettings] = useState({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('app_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: typeof settings) => {
    try {
      await AsyncStorage.setItem('app_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['campool_token', 'campool_user']);
              router.replace('/login');
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const SettingItem = ({ 
    title, 
    subtitle, 
    icon, 
    onPress, 
    rightElement, 
    color = colors.primary 
  }: {
    title: string;
    subtitle?: string;
    icon: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    color?: string;
  }) => (
    <TouchableOpacity
      style={[styles.settingItem, isDark && styles.settingItemDark]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.settingIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, isDark && styles.settingTitleDark]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, isDark && styles.settingSubtitleDark]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement}
    </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Customize your experience</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Appearance */}
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Appearance</Text>
          
          <SettingItem
            title="Dark Mode"
            subtitle="Switch between light and dark themes"
            icon="moon-outline"
            rightElement={
              <Switch
                value={themeIsDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#d1d5db', true: colors.primary }}
                thumbColor={themeIsDark ? '#ffffff' : '#f3f4f6'}
              />
            }
          />
        </View>


        {/* Support */}
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Support</Text>
          
          <SettingItem
            title="Help & FAQ"
            subtitle="Get help and find answers"
            icon="help-circle-outline"
            onPress={() => router.push('/help')}
          />

          <SettingItem
            title="Contact Support"
            subtitle="Get in touch with our team"
            icon="mail-outline"
            onPress={() => {
              Linking.openURL('mailto:support@hamraah.com');
            }}
          />

          <SettingItem
            title="Rate App"
            subtitle="Rate us on the App Store"
            icon="star-outline"
            onPress={() => {
              // App store rating logic
              Alert.alert('Thank you!', 'Your feedback helps us improve Hamraah');
            }}
          />
        </View>

        {/* About */}
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>About</Text>
          
          <SettingItem
            title="App Version"
            subtitle="1.0.0"
            icon="information-circle-outline"
          />

          <SettingItem
            title="Privacy Policy"
            subtitle="Read our privacy policy"
            icon="shield-checkmark-outline"
            onPress={() => {
              Linking.openURL('https://hamraah.com/privacy');
            }}
          />

          <SettingItem
            title="Terms of Service"
            subtitle="Read our terms of service"
            icon="document-text-outline"
            onPress={() => {
              Linking.openURL('https://hamraah.com/terms');
            }}
          />
        </View>

        {/* Logout */}
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <SettingItem
            title="Logout"
            subtitle="Sign out of your account"
            icon="log-out-outline"
            color={colors.error}
            onPress={handleLogout}
          />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, isDark && styles.footerTextDark]}>
            Made with ❤️ for students
          </Text>
          <Text style={[styles.footerText, isDark && styles.footerTextDark]}>
            Hamraah © 2024
          </Text>
        </View>
      </ScrollView>
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
  section: {
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
  sectionDark: {
    backgroundColor: '#1f2937',
    shadowOpacity: 0.3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  sectionTitleDark: {
    color: '#f9fafb',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingItemDark: {
    borderBottomColor: '#374151',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  settingTitleDark: {
    color: '#f9fafb',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  settingSubtitleDark: {
    color: '#9ca3af',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerTextDark: {
    color: '#9ca3af',
  },
});