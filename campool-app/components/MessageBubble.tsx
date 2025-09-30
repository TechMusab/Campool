import { View, Text, StyleSheet } from 'react-native';

export default function MessageBubble({ text, senderName, createdAt, isSelf }: { text: string; senderName: string; createdAt: string; isSelf: boolean }) {
  return (
    <View style={[styles.container, isSelf ? styles.self : styles.other]}>
      {!isSelf && <Text style={styles.sender}>{senderName}</Text>}
      <Text style={styles.text}>{text}</Text>
      <Text style={styles.time}>{new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { maxWidth: '80%', padding: 10, borderRadius: 12, marginVertical: 4 },
  self: { alignSelf: 'flex-end', backgroundColor: '#d1fae5' },
  other: { alignSelf: 'flex-start', backgroundColor: '#f1f5f9' },
  sender: { fontSize: 12, color: '#334155' },
  text: { fontSize: 14, color: '#111827' },
  time: { fontSize: 10, color: '#6b7280', alignSelf: 'flex-end', marginTop: 4 },
}); 