import { View, Text, StyleSheet } from 'react-native';

export default function TypingIndicator({ name }: { name: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{name} is typing…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 6 },
  text: { fontSize: 12, color: '#64748b' },
}); 