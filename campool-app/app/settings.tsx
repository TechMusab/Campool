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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from '@/hooks/useNotifications';

export default function SettingsScreen() {
  const router = useRouter();
  const { getPushToken } = useNotifications();
  const [settings, setSettings] = useState({
    notifications: true,
    locationSharing: true,
    darkMode: false,
    autoLogin: true,
  });

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

  const handleToggle = (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
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
            await AsyncStorage.removeItem('campool_token');
            router.replace('/login');
          },
        },
      ]
    );
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://campool.com/privacy');
  };

  const openTermsOfService = () => {
    Linking.openURL('https://campool.com/terms');
  };

  const openSupport = () => {
    Linking.openURL('mailto:support@campool.com');
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightComponent, 
    showArrow = true 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any} size={24} color="#2d6a4f" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showArrow && onPress && (
          <Ionicons name="chevron-forward" size={20} color="#6b7280" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
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
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      {/* Settings Content */}
      <View style={styles.content}>
        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <SettingItem
            icon="notifications-outline"
            title="Push Notifications"
            subtitle="Receive ride updates and messages"
            rightComponent={
              <Switch
                value={settings.notifications}
                onValueChange={() => handleToggle('notifications')}
                trackColor={{ false: '#d1d5db', true: '#2d6a4f' }}
                thumbColor={settings.notifications ? '#ffffff' : '#f4f3f4'}
              />
            }
            showArrow={false}
          />
        </View>

        {/* Privacy & Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          <SettingItem
            icon="location-outline"
            title="Location Sharing"
            subtitle="Share location with other users"
            rightComponent={
              <Switch
                value={settings.locationSharing}
                onValueChange={() => handleToggle('locationSharing')}
                trackColor={{ false: '#d1d5db', true: '#2d6a4f' }}
                thumbColor={settings.locationSharing ? '#ffffff' : '#f4f3f4'}
              />
            }
            showArrow={false}
          />
          <SettingItem
            icon="shield-checkmark-outline"
            title="Privacy Policy"
            onPress={openPrivacyPolicy}
          />
          <SettingItem
            icon="document-text-outline"
            title="Terms of Service"
            onPress={openTermsOfService}
          />
        </View>

        {/* App Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Preferences</Text>
          <SettingItem
            icon="moon-outline"
            title="Dark Mode"
            subtitle="Switch to dark theme"
            rightComponent={
              <Switch
                value={settings.darkMode}
                onValueChange={() => handleToggle('darkMode')}
                trackColor={{ false: '#d1d5db', true: '#2d6a4f' }}
                thumbColor={settings.darkMode ? '#ffffff' : '#f4f3f4'}
              />
            }
            showArrow={false}
          />
          <SettingItem
            icon="log-in-outline"
            title="Auto Login"
            subtitle="Stay logged in"
            rightComponent={
              <Switch
                value={settings.autoLogin}
                onValueChange={() => handleToggle('autoLogin')}
                trackColor={{ false: '#d1d5db', true: '#2d6a4f' }}
                thumbColor={settings.autoLogin ? '#ffffff' : '#f4f3f4'}
              />
            }
            showArrow={false}
          />
        </View>

        {/* Data & Storage Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Storage</Text>
          <SettingItem
            icon="trash-outline"
            title="Clear Cache"
            subtitle="Free up storage space"
            onPress={handleClearCache}
          />
          <SettingItem
            icon="download-outline"
            title="Export Data"
            subtitle="Download your data"
            onPress={() => Alert.alert('Coming Soon', 'Data export feature will be available soon')}
          />
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <SettingItem
            icon="help-circle-outline"
            title="Help Center"
            onPress={() => router.push('/help')}
          />
          <SettingItem
            icon="mail-outline"
            title="Contact Support"
            onPress={openSupport}
          />
          <SettingItem
            icon="information-circle-outline"
            title="About"
            subtitle="Version 1.0.0"
            onPress={() => Alert.alert('About', 'Campool v1.0.0\nBuilt with React Native & Expo')}
          />
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <SettingItem
            icon="person-outline"
            title="Edit Profile"
            onPress={() => router.push('/profile')}
          />
          <SettingItem
            icon="log-out-outline"
            title="Logout"
            onPress={handleLogout}
            rightComponent={
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            }
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
