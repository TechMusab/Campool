import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'http://192.168.10.17:4000';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const next: typeof errors = {};
    if (!email) next.email = 'Email is required';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit() {
    if (!validate()) return;
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
      await AsyncStorage.setItem('campool_token', res.data.token);
      router.replace('/dashboard');
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Login failed';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <Ionicons name="mail" size={20} color="#2d6a4f" style={styles.icon} />
        <TextInput
          placeholder="University Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
      </View>
      {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}

      <View style={styles.inputRow}>
        <Ionicons name="lock-closed" size={20} color="#2d6a4f" style={styles.icon} />
        <TextInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />
      </View>
      {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}

      <TouchableOpacity onPress={onSubmit} disabled={loading} style={{ width: '100%' }}>
        <LinearGradient colors={["#2d6a4f", "#1b9aaa"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.button}>
          <Text style={styles.buttonText}>{loading ? 'Please wait...' : 'Login'}</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={{ marginTop: 16 }}>
        <Link href="/signup">New here? Signup</Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 6, justifyContent: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#cce3de', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#f5fffa' },
  icon: { marginRight: 8 },
  input: { flex: 1 },
  button: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold' },
  error: { color: '#d00000', marginLeft: 8, marginBottom: 6 },
}); 
