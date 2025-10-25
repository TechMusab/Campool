import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HelpScreen() {
  const router = useRouter();

  const openEmail = () => {
    Linking.openURL('mailto:support@campool.com');
  };

  const openPhone = () => {
    Linking.openURL('tel:+1234567890');
  };

  const openWebsite = () => {
    Linking.openURL('https://campool.com');
  };

  const HelpSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const HelpItem = ({ 
    icon, 
    title, 
    description, 
    onPress 
  }: { 
    icon: string; 
    title: string; 
    description: string; 
    onPress?: () => void; 
  }) => (
    <TouchableOpacity
      style={styles.helpItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.helpItemLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon as any} size={24} color="#2d6a4f" />
        </View>
        <View style={styles.helpItemContent}>
          <Text style={styles.helpItemTitle}>{title}</Text>
          <Text style={styles.helpItemDescription}>{description}</Text>
        </View>
      </View>
      {onPress && (
        <Ionicons name="chevron-forward" size={20} color="#6b7280" />
      )}
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
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        <HelpSection title="Getting Started">
          <HelpItem
            icon="car-outline"
            title="How to Post a Ride"
            description="Learn how to share your journey with other students"
          />
          <HelpItem
            icon="search-outline"
            title="How to Find Rides"
            description="Discover available rides in your area"
          />
          <HelpItem
            icon="chatbubble-outline"
            title="Using Chat"
            description="Communicate with drivers and passengers"
          />
        </HelpSection>

        <HelpSection title="Safety & Security">
          <HelpItem
            icon="shield-checkmark-outline"
            title="Safety Guidelines"
            description="Important safety tips for ride sharing"
          />
          <HelpItem
            icon="warning-outline"
            title="Emergency Features"
            description="How to use emergency contacts and alerts"
          />
          <HelpItem
            icon="person-outline"
            title="User Verification"
            description="How our verification system works"
          />
        </HelpSection>

        <HelpSection title="Payment & Billing">
          <HelpItem
            icon="card-outline"
            title="Payment Methods"
            description="Accepted payment options and how to pay"
          />
          <HelpItem
            icon="receipt-outline"
            title="Ride Costs"
            description="Understanding ride pricing and cost sharing"
          />
          <HelpItem
            icon="cash-outline"
            title="Refunds"
            description="How to request refunds for cancelled rides"
          />
        </HelpSection>

        <HelpSection title="Contact Support">
          <HelpItem
            icon="mail-outline"
            title="Email Support"
            description="support@campool.com"
            onPress={openEmail}
          />
          <HelpItem
            icon="call-outline"
            title="Phone Support"
            description="+1 (234) 567-890"
            onPress={openPhone}
          />
          <HelpItem
            icon="globe-outline"
            title="Website"
            description="Visit our website for more information"
            onPress={openWebsite}
          />
        </HelpSection>

        <HelpSection title="App Information">
          <View style={styles.appInfo}>
            <Text style={styles.appInfoText}>Campool v1.0.0</Text>
            <Text style={styles.appInfoSubtext}>Built with React Native & Expo</Text>
            <Text style={styles.appInfoSubtext}>© 2024 Campool. All rights reserved.</Text>
          </View>
        </HelpSection>
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
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  helpItem: {
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
  helpItemLeft: {
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
  helpItemContent: {
    flex: 1,
  },
  helpItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  helpItemDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  appInfo: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  appInfoText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  appInfoSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
  },
});
