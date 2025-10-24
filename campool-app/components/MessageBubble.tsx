import { View, Text, StyleSheet } from 'react-native';

export default function MessageBubble({ 
  text, 
  senderName, 
  createdAt, 
  isSelf, 
  isSystemMessage = false 
}: { 
  text: string; 
  senderName: string; 
  createdAt: string; 
  isSelf: boolean;
  isSystemMessage?: boolean;
}) {
  if (isSystemMessage) {
    return (
      <View style={styles.systemContainer}>
        <Text style={styles.systemText}>{text}</Text>
        <Text style={styles.systemTime}>
          {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  }

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
  
  // System message styles
  systemContainer: {
    alignSelf: 'center',
    backgroundColor: '#fef3c7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#f59e0b',
    maxWidth: '90%',
  },
  systemText: {
    fontSize: 13,
    color: '#92400e',
    textAlign: 'center',
    fontWeight: '500',
  },
  systemTime: {
    fontSize: 10,
    color: '#a16207',
    textAlign: 'center',
    marginTop: 2,
  },
}); 