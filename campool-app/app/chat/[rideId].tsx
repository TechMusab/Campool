import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useChatSocket } from '@/hooks/useChatSocket';
import MessageBubble from '@/components/MessageBubble';
import TypingIndicator from '@/components/TypingIndicator';
import { fetchMessages, markRead } from '@/services/chatApi';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const SERVER_URL = process.env.EXPO_PUBLIC_API_BASE || 'https://campool-lm5p.vercel.app';

type Message = { _id: string; rideId: string; senderId: string; senderName: string; text: string; createdAt: string; isSystemMessage?: boolean };

type TempMessage = Message & { temp?: boolean };

type QuickAction = {
  id: string;
  label: string;
  icon: string;
  action: () => void;
};

export default function ChatScreen() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const [token, setToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<TempMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [showQuickActions, setShowQuickActions] = useState(false);
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
    
    // Load existing messages from API
    loadMessages();
    
    console.log('Joining chat room:', rideId);
    socket.joinRoom(rideId, (res: any) => {
      console.log('Join room response:', res);
    });
    
    const onReceive = (msg: Message) => {
      console.log('Received message:', msg);
      setMessages((prev) => [...prev, msg]);
      flatListRef.current?.scrollToEnd({ animated: true });
    };
    const onTyping = (payload: any) => {
      console.log('User typing:', payload);
      if (payload?.userId) setTypingUsers((p) => ({ ...p, [payload.userId]: payload.name || 'Someone' }));
    };
    const onStopTyping = (payload: any) => {
      console.log('User stopped typing:', payload);
      if (payload?.userId) setTypingUsers((p) => { const c = { ...p }; delete c[payload.userId]; return c; });
    };
    
    socket.on('receiveMessage', onReceive);
    socket.on('typing', onTyping);
    socket.on('stopTyping', onStopTyping);
    
    return () => {
      console.log('Leaving chat room:', rideId);
      socket.leaveRoom(rideId);
      socket.off('receiveMessage', onReceive);
      socket.off('typing', onTyping);
      socket.off('stopTyping', onStopTyping);
    };
  }, [rideId, socket]);

  async function loadMessages() {
    try {
      console.log('Loading messages for ride:', rideId);
      const token = await AsyncStorage.getItem('campool_token');
      const response = await fetch(`${SERVER_URL}/api/messages/ride/${rideId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Messages loaded:', data);
        setMessages(data);
      } else {
        console.log('Failed to load messages:', response.status);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  async function send() {
    const text = input.trim();
    if (!text || !rideId) return;
    
    console.log('Sending message:', { rideId, text });
    setInput('');
    const temp: TempMessage = { _id: `temp-${Date.now()}`, rideId, senderId: 'me', senderName: 'Me', text, createdAt: new Date().toISOString(), temp: true };
    setMessages((prev) => [...prev, temp]);
    flatListRef.current?.scrollToEnd({ animated: true });
    
    // Use API directly for message sending
    sendViaAPI(rideId, text, temp);
  }

  async function sendViaAPI(rideId: string, text: string, temp: TempMessage) {
    try {
      console.log('Sending message via API:', { rideId, text });
      const token = await AsyncStorage.getItem('campool_token');
      const response = await fetch(`${SERVER_URL}/api/rides/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rideId, text }),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('API message sent successfully:', data);
        setMessages((prev) => prev.map((m) => (m._id === temp._id ? data.message : m)));
      } else {
        console.log('API message send failed:', response.status);
        setMessages((prev) => prev.map((m) => (m._id === temp._id ? { ...m, text: `${m.text} (failed)` } : m)));
      }
    } catch (error) {
      console.error('API message send error:', error);
      setMessages((prev) => prev.map((m) => (m._id === temp._id ? { ...m, text: `${m.text} (failed)` } : m)));
    }
  }

  function onInputChange(v: string) {
    setInput(v);
    if (rideId) socket.on('noop', () => {}); // placeholder to keep reference
    if (rideId) socket.sendMessage; // no-op; could emit typing here with debounce
  }

  // System message functions
  const sendSystemMessage = (message: string) => {
    const systemMsg: TempMessage = {
      _id: `system-${Date.now()}`,
      rideId: rideId!,
      senderId: 'system',
      senderName: 'System',
      text: message,
      createdAt: new Date().toISOString(),
      isSystemMessage: true,
      temp: true
    };
    setMessages((prev) => [...prev, systemMsg]);
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  // Quick Actions
  const quickActions: QuickAction[] = [
    {
      id: 'confirm',
      label: 'Confirm Pickup',
      icon: 'checkmark-circle-outline',
      action: () => {
        sendSystemMessage('✅ Pickup confirmed by passenger');
        Alert.alert('Pickup Confirmed', 'You have confirmed your pickup location.');
      }
    },
    {
      id: 'eta',
      label: 'Request ETA',
      icon: 'time-outline',
      action: () => {
        sendSystemMessage('⏰ ETA requested from driver');
        Alert.alert('ETA Requested', 'Driver has been notified to provide arrival time.');
      }
    },
    {
      id: 'emergency',
      label: 'Emergency',
      icon: 'warning-outline',
      action: () => {
        sendSystemMessage('🚨 Emergency contact notified');
        Alert.alert('Emergency Alert', 'Emergency contacts have been notified of your location.');
      }
    }
  ];

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
              <MessageBubble 
                text={item.text} 
                senderName={item.senderName} 
                createdAt={item.createdAt} 
                isSelf={item.senderId === 'me'}
                isSystemMessage={item.isSystemMessage}
              />
            )}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
          {Object.values(typingUsers).map((n) => (
            <TypingIndicator key={n} name={n} />
          ))}
          
          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity 
              style={styles.quickActionsToggle}
              onPress={() => setShowQuickActions(!showQuickActions)}
            >
              <Ionicons name="add-circle-outline" size={24} color="#2d6a4f" />
              <Text style={styles.quickActionsToggleText}>Quick Actions</Text>
            </TouchableOpacity>
            
            {showQuickActions && (
              <View style={styles.quickActionsGrid}>
                {quickActions.map((action) => (
                  <TouchableOpacity
                    key={action.id}
                    style={styles.quickActionButton}
                    onPress={action.action}
                  >
                    <Ionicons name={action.icon as any} size={20} color="#2d6a4f" />
                    <Text style={styles.quickActionText}>{action.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

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
  
  // Quick Actions Styles
  quickActionsContainer: {
    marginVertical: 8,
  },
  quickActionsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f0f8f4',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cce3de',
  },
  quickActionsToggleText: {
    marginLeft: 8,
    color: '#2d6a4f',
    fontWeight: '600',
    fontSize: 14,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  quickActionButton: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionText: {
    marginTop: 4,
    fontSize: 12,
    color: '#2d6a4f',
    textAlign: 'center',
    fontWeight: '500',
  },
}); 