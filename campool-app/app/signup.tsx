import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'http://192.168.10.17:4000';
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const UNIVERSITY_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)*(edu|ac)\.[a-zA-Z]{2,}$/;

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    console.log("=== FRONTEND SIGNUP START ===");
    console.log("Form data:", { name, email, studentId, passwordLength: password.length });
    console.log("API endpoint:", `${API_BASE}/api/auth/signup`);
    if (!validate()) return;
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/api/auth/signup`, {
        name,
        email,
        password,
        studentId,
      });
      console.log("✓ Signup successful!");
      Alert.alert("Success", "Account created. Please login.");
      router.replace('/login');
    } catch (e: any) {
      console.log("=== FRONTEND SIGNUP ERROR ===");
      console.error("Error details:", e);
      console.error("Error message:", e.message);
      if (e.response) {
        console.error("Response status:", e.response.status);
        console.error("Response data:", e.response.data);
      } else if (e.request) {
        console.error("Network error - no response received");
      }
      const msg = e?.response?.data?.error || 'Signup failed';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#2d6a4f', '#1b9aaa']}
              style={styles.logoGradient}
            >
              <Ionicons name="school" size={32} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Campool to start saving money</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          {/* Name Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Full Name</Text>
            <View style={[styles.inputRow, errors.name && styles.inputError]}>
              <Ionicons name="person-outline" size={20} color="#52796f" style={styles.icon} />
              <TextInput 
                placeholder="Enter your full name" 
                placeholderTextColor="#a8b5b2"
                value={name} 
                onChangeText={setName} 
                style={styles.input}
              />
            </View>
            {errors.name ? <Text style={styles.error}>{errors.name}</Text> : null}
          </View>

          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>University Email</Text>
            <View style={[styles.inputRow, errors.email && styles.inputError]}>
              <Ionicons name="mail-outline" size={20} color="#52796f" style={styles.icon} />
              <TextInput
                placeholder="yourname@university.edu"
                placeholderTextColor="#a8b5b2"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
              />
            </View>
            {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}
          </View>

          {/* Password Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputRow, errors.password && styles.inputError]}>
              <Ionicons name="lock-closed-outline" size={20} color="#52796f" style={styles.icon} />
              <TextInput
                placeholder="Create a strong password"
                placeholderTextColor="#a8b5b2"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                style={styles.input}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#52796f" 
                />
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}
          </View>

          {/* Student ID Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Student ID</Text>
            <View style={[styles.inputRow, errors.studentId && styles.inputError]}>
              <Ionicons name="id-card-outline" size={20} color="#52796f" style={styles.icon} />
              <TextInput 
                placeholder="Enter your student ID" 
                placeholderTextColor="#a8b5b2"
                value={studentId} 
                onChangeText={setStudentId} 
                style={styles.input}
              />
            </View>
            {errors.studentId ? <Text style={styles.error}>{errors.studentId}</Text> : null}
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            onPress={onSubmit} 
            disabled={loading} 
            style={styles.buttonWrapper}
            activeOpacity={0.8}
          >
            <LinearGradient 
              colors={loading ? ["#84a98c", "#84a98c"] : ["#2d6a4f", "#1b9aaa"]} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 0 }} 
              style={styles.button}
            >
              {loading ? (
                <Text style={styles.buttonText}>Creating Account...</Text>
              ) : (
                <>
                  <Text style={styles.buttonText}>Create Account</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/login" style={styles.link}>
              <Text style={styles.linkText}>Login</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fffe' 
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoGradient: {
    width: 70,
    height: 70,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2d6a4f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1b4332',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#52796f',
    fontWeight: '400',
  },
  formContainer: {
    gap: 20,
  },
  inputWrapper: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d6a4f',
    marginLeft: 4,
  },
  inputRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1.5, 
    borderColor: '#d8e9e4', 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputError: {
    borderColor: '#ef233c',
    backgroundColor: '#fff5f5',
  },
  icon: { 
    marginRight: 12 
  },
  input: { 
    flex: 1,
    fontSize: 16,
    color: '#1b4332',
  },
  error: { 
    color: '#ef233c', 
    fontSize: 13, 
    marginLeft: 4,
    marginTop: -4,
  },
  buttonWrapper: {
    marginTop: 12,
    width: '100%',
  },
  button: { 
    paddingVertical: 16, 
    borderRadius: 12, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#2d6a4f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: { 
    color: '#ffffff', 
    fontWeight: '700',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 15,
    color: '#52796f',
  },
  link: {
    marginLeft: 4,
  },
  linkText: {
    fontSize: 15,
    color: '#1b9aaa',
    fontWeight: '600',
  },
});