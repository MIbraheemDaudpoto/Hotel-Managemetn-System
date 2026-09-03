import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { IOSButton } from '../../src/components/UI';

export default function LoginScreen() {
  const [email, setEmail] = useState('guest@hotel.com');
  const [password, setPassword] = useState('Guest123!');
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    const ok = await login(email, password);
    if (ok) {
      router.replace('/');
    }
  };

  const setDemoRole = (roleEmail: string, rolePass: string) => {
    clearError();
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.hotelIcon}>🏨</Text>
          <Text style={styles.title}>Grand Hotel</Text>
          <Text style={styles.subtitle}>Sign in to access your operations dashboard</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.com"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#94A3B8"
            secureTextEntry
          />

          <View style={{ marginTop: 16 }}>
            <IOSButton
              title={isLoading ? 'Signing In...' : 'Sign In'}
              onPress={handleLogin}
              loading={isLoading}
            />
          </View>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.registerLink}>Sign Up as Guest</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>QUICK DEMO ROLES</Text>
          <View style={styles.demoButtons}>
            <TouchableOpacity
              style={[styles.demoBtn, email === 'guest@hotel.com' && styles.demoBtnActive]}
              onPress={() => setDemoRole('guest@hotel.com', 'Guest123!')}
            >
              <Text style={styles.demoBtnText}>Guest</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoBtn, email === 'frontdesk@hotel.com' && styles.demoBtnActive]}
              onPress={() => setDemoRole('frontdesk@hotel.com', 'FrontDesk123!')}
            >
              <Text style={styles.demoBtnText}>Front Desk</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.demoBtn, email === 'admin@hotel.com' && styles.demoBtnActive]}
              onPress={() => setDemoRole('admin@hotel.com', 'Admin123!')}
            >
              <Text style={styles.demoBtnText}>Admin</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  hotelIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 6,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#7F1D1D',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  errorText: {
    color: '#FECACA',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 46,
    color: '#FFFFFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  registerText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  registerLink: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '600',
  },
  demoSection: {
    marginTop: 28,
    alignItems: 'center',
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 10,
  },
  demoButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  demoBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  demoBtnActive: {
    borderColor: '#38BDF8',
    backgroundColor: '#0369A1',
  },
  demoBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
