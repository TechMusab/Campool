import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Logo from '@/components/Logo';
import { spacing, borderRadius, fontSize, colors } from '@/constants/spacing';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || 'https://campool-lm5p.vercel.app';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Create test users function
  async function createTestUsers() {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE}/api/auth/create-test-users`, {});
      
      if (response.data && response.data.users) {
        const users = response.data.users;
        const userList = users.map((user: any) => 
          `• ${user.user.email} (Password: ${user.user.email.includes('alice') ? 'alice123' : 'bob123'})`
        ).join('\n');
        
        Alert.alert(
          'Test Users Created',
          `Test users have been created successfully!\n\n${userList}\n\nYou can now login with any of these accounts.`,
          [
            { text: 'Use Alice', onPress: () => {
              setEmail('alice@university.edu');
              setPassword('alice123');
            }},
            { text: 'Use Bob', onPress: () => {
              setEmail('bob@university.edu');
              setPassword('bob123');
            }},
            { text: 'OK' }
          ]
        );
      }
    } catch (error) {
      console.error('Error creating test users:', error);
      Alert.alert('Error', 'Failed to create test users. Please try again.');
    } finally {
      setLoading(false);
    }
  }

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
      await AsyncStorage.setItem('campool_user', JSON.stringify(res.data.user));
      router.replace('/dashboard');
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Login failed';
      
      // If it's an internal server error, it might be because no users exist
      if (msg === 'Internal server error') {
        Alert.alert(
          'No Users Found',
          'No users exist in the database. Please sign up first or use the test credentials:\n\nEmail: test@university.edu\nPassword: test123',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Use Test Credentials', 
              onPress: () => {
                setEmail('test@university.edu');
                setPassword('test123');
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', msg);
      }
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
          <Logo size="large" showText={true} />
          <View style={{ height: spacing.md }} />
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Login to continue your journey</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formContainer}>
          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Email Address</Text>
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
            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity>
                <Text style={styles.forgotText}>Forgot?</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.inputRow, errors.password && styles.inputError]}>
              <Ionicons name="lock-closed-outline" size={20} color="#52796f" style={styles.icon} />
              <TextInput
                placeholder="Enter your password"
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

          {/* Login Button */}
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
                <Text style={styles.buttonText}>Logging in...</Text>
              ) : (
                <>
                  <Text style={styles.buttonText}>Login</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login Placeholder */}
          <View style={styles.socialContainer}>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
              <Ionicons name="logo-google" size={20} color="#52796f" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
              <Ionicons name="logo-apple" size={20} color="#52796f" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
              <Ionicons name="logo-facebook" size={20} color="#52796f" />
            </TouchableOpacity>
          </View>

          {/* Signup Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>New here? </Text>
            <Link href="/signup" style={styles.link}>
              <Text style={styles.linkText}>Create Account</Text>
            </Link>
          </View>

          {/* Test Users Button */}
          <TouchableOpacity 
            style={styles.testUserButton} 
            onPress={createTestUsers}
            disabled={loading}
          >
            <Text style={styles.testUserButtonText}>
              {loading ? 'Creating...' : 'Create Test Users'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.huge + spacing.xxxl,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.huge,
  },
  title: {
    fontSize: fontSize.hero,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  formContainer: {
    gap: spacing.xxl,
  },
  inputWrapper: {
    gap: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  forgotText: {
    fontSize: fontSize.sm,
    color: colors.secondary,
    fontWeight: '600',
  },
  inputRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1.5, 
    borderColor: colors.border, 
    borderRadius: borderRadius.md, 
    paddingHorizontal: spacing.lg, 
    paddingVertical: spacing.md + 2, 
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
  },
  icon: { 
    marginRight: spacing.md,
  },
  input: { 
    flex: 1,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  error: { 
    color: colors.error, 
    fontSize: fontSize.sm, 
    marginLeft: spacing.xs,
    marginTop: -spacing.xs,
  },
  buttonWrapper: {
    marginTop: spacing.sm,
    width: '100%',
  },
  button: { 
    paddingVertical: spacing.lg, 
    borderRadius: borderRadius.md, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: { 
    color: colors.white, 
    fontWeight: '700',
    fontSize: fontSize.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: spacing.lg,
    fontSize: fontSize.md,
    color: colors.textLight,
    fontWeight: '500',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md + 2,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  footerText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  link: {
    marginLeft: spacing.xs,
  },
  linkText: {
    fontSize: fontSize.base,
    color: colors.secondary,
    fontWeight: '600',
  },
  testUserButton: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  testUserButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});