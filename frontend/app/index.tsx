import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { AppIcon } from '../src/components/UI';

export default function IndexScreen() {
  const { user, token } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!token || !user) {
        router.replace('/(auth)/login');
      } else {
        switch (user.role) {
          case 'ADMIN':
            router.replace('/(admin)/dashboard');
            break;
          case 'FRONT_DESK':
            router.replace('/(frontdesk)/grid');
            break;
          case 'GUEST':
          default:
            router.replace('/(guest)/catalog');
            break;
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [token, user]);

  return (
    <View style={styles.container}>
      <View style={styles.logoBadge}>
        <AppIcon name="hotel" size={38} color="#38BDF8" />
      </View>
      <Text style={styles.title}>Grand Hotel</Text>
      <Text style={styles.subtitle}>iOS Operations Platform</Text>
      <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logoIcon: {
    fontSize: 36,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#94A3B8',
    marginTop: 6,
    fontWeight: '500',
  },
});
