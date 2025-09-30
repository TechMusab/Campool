import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useChatSocket } from '@/hooks/useChatSocket';
import MessageBubble from '@/components/MessageBubble';
import TypingIndicator from '@/components/TypingIndicator';
import { fetchMessages, markRead } from '@/services/chatApi';
import { LinearGradient } from 'expo-linear-gradient';

const SERVER_URL = process.env.EXPO_PUBLIC_API_BASE || 'http://localhost:4000';

type Message = { _id: string; rideId: string; senderId: string; senderName: string; text: string; createdAt: string };

type TempMessage = Message & { temp?: boolean };

export default function ChatScreen() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const [token, setToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<TempMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    (async () => {
      const t = await AsyncStorage.getItem('campool_token');
      setToken(t);
    })();
  }, []);

  const socket = useChatSocket(SERVER_URL, token);

  useEffect(() => {
    if (!rideId || !token) return;
    (async () => {
      try {
        const data = await fetchMessages(token, rideId, { page: 1, limit: 50 });
        setMessages(data.messages || []);
      } catch (e) {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [rideId, token]);

  useEffect(() => {
    if (!rideId) return;
    socket.joinRoom(rideId);
    const onReceive = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      flatListRef.current?.scrollToEnd({ animated: true });
    };
    const onTyping = (payload: any) => {
      if (payload?.userId) setTypingUsers((p) => ({ ...p, [payload.userId]: payload.name || 'Someone' }));
    };
    const onStopTyping = (payload: any) => {
      if (payload?.userId) setTypingUsers((p) => { const c = { ...p }; delete c[payload.userId]; return c; });
    };
    socket.on('receiveMessage', onReceive);
    socket.on('typing', onTyping);
    socket.on('stopTyping', onStopTyping);

    return () => {
      socket.leaveRoom(rideId);
      socket.off('receiveMessage', onReceive);
      socket.off('typing', onTyping);
      socket.off('stopTyping', onStopTyping);
    };
  }, [rideId, socket]);

  async function send() {
    const text = input.trim();
    if (!text || !rideId) return;
    setInput('');
    const temp: TempMessage = { _id: `temp-${Date.now()}`, rideId, senderId: 'me', senderName: 'Me', text, createdAt: new Date().toISOString(), temp: true };
    setMessages((prev) => [...prev, temp]);
    flatListRef.current?.scrollToEnd({ animated: true });
    socket.sendMessage({ rideId, text }, (res: any) => {
      if (res?.ok && res.message) {
        setMessages((prev) => prev.map((m) => (m._id === temp._id ? res.message : m)));
      } else {
        setMessages((prev) => prev.map((m) => (m._id === temp._id ? { ...m, text: `${m.text} (failed)` } : m)));
      }
    });
  }

  function onInputChange(v: string) {
    setInput(v);
    if (rideId) socket.on('noop', () => {}); // placeholder to keep reference
    if (rideId) socket.sendMessage; // no-op; could emit typing here with debounce
  }

  useEffect(() => {
    // mark read on mount and when messages change
    (async () => {
      if (!token || !rideId || messages.length === 0) return;
      const last = messages[messages.length - 1];
      try { await markRead(token, rideId, { lastMessageId: last._id }); } catch {}
    })();
  }, [messages, rideId, token]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      {loading ? (
        <View style={styles.center}><ActivityIndicator /></View>
      ) : (
        <View style={styles.container}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <MessageBubble text={item.text} senderName={item.senderName} createdAt={item.createdAt} isSelf={item.senderId === 'me'} />
            )}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
          {Object.values(typingUsers).map((n) => (
            <TypingIndicator key={n} name={n} />
          ))}
          <View style={styles.inputRow}>
            <TextInput placeholder="Message" value={input} onChangeText={onInputChange} style={styles.input} />
            <TouchableOpacity onPress={send} style={styles.sendBtn}>
              <LinearGradient colors={["#2d6a4f", "#1b9aaa"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sendBtnInner}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Send</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 8, gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#cce3de', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' },
  sendBtn: { },
  sendBtnInner: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10 },
}); 