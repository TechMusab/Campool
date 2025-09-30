import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'http://localhost:4000';
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const UNIVERSITY_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)*(edu|ac)\.[a-zA-Z]{2,}$/;

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const next: { [k: string]: string } = {};
    if (!name) next.name = 'Name is required';
    if (!email) next.email = 'Email is required';
    else if (!UNIVERSITY_EMAIL_REGEX.test(email)) next.email = 'Use a valid university email';
    if (!password) next.password = 'Password is required';
    else if (!PASSWORD_REGEX.test(password)) next.password = '8+ chars, uppercase, lowercase, number';
    if (!studentId) next.studentId = 'Student ID is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit() {
    if (!validate()) return;
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/auth/register`, {
        name,
        email,
        password,
        studentId,
      });
      Alert.alert('Success', 'Account created. Please login.');
      router.replace('/login');
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Signup failed';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <Ionicons name="person" size={20} color="#2d6a4f" style={styles.icon} />
        <TextInput placeholder="Full Name" value={name} onChangeText={setName} style={styles.input} />
      </View>
      {errors.name ? <Text style={styles.error}>{errors.name}</Text> : null}

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

      <View style={styles.inputRow}>
        <Ionicons name="id-card" size={20} color="#2d6a4f" style={styles.icon} />
        <TextInput placeholder="Student ID" value={studentId} onChangeText={setStudentId} style={styles.input} />
      </View>
      {errors.studentId ? <Text style={styles.error}>{errors.studentId}</Text> : null}

      <TouchableOpacity onPress={onSubmit} disabled={loading} style={{ width: '100%' }}>
        <LinearGradient colors={["#2d6a4f", "#1b9aaa"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.button}>
          <Text style={styles.buttonText}>{loading ? 'Please wait...' : 'Create Account'}</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={{ marginTop: 16 }}>
        <Link href="/login">Already have an account? Login</Link>
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