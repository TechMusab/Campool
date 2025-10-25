import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OfflineIndicatorProps {
  isVisible: boolean;
}

export default function OfflineIndicator({ isVisible }: OfflineIndicatorProps) {
  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <Ionicons name="wifi-off" size={16} color="white" />
      <Text style={styles.text}>Offline Mode</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  text: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});
