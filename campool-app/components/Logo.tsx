import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export default function Logo({ size = 'medium', showText = true }: LogoProps) {
  const dimensions = {
    small: { container: 40, icon: 20, text: 16 },
    medium: { container: 70, icon: 32, text: 24 },
    large: { container: 90, icon: 40, text: 28 },
  };

  const { container, icon, text } = dimensions[size];

  return (
    <View style={styles.logoWrapper}>
      <LinearGradient
        colors={['#2d6a4f', '#1b9aaa']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.logoContainer, { width: container, height: container, borderRadius: container * 0.3 }]}
      >
        <Ionicons name="car-sport" size={icon} color="#fff" />
      </LinearGradient>
      {showText && (
        <Text style={[styles.logoText, { fontSize: text }]}>Hamraah</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  logoWrapper: {
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2d6a4f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontWeight: '700',
    color: '#1b4332',
    letterSpacing: 1,
  },
});

