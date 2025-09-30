import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function StarRating({ value, onChange, size = 28 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  const stars = [1,2,3,4,5];
  return (
    <View style={styles.row}>
      {stars.map((s) => (
        <TouchableOpacity key={s} onPress={() => onChange?.(s)}>
          <Ionicons name={s <= value ? 'star' : 'star-outline'} size={size} color="#f59e0b" />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: 6 } }); 