import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { IOSButton } from '../../src/components/UI';

export default function AdminProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Sign out of Admin Control Center?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Profile</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={{ fontSize: 32 }}>👑</Text>
          </View>
          <Text style={styles.name}>{user ? user.full_name : 'System Administrator'}</Text>
          <Text style={styles.email}>{user ? user.email : ''}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>Role: SYSTEM ADMIN</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>System Governance</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Database Engine</Text>
            <Text style={styles.infoVal}>SQLAlchemy 2.0 + SQLite</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Double-Booking Guard</Text>
            <Text style={styles.infoValActive}>DB Unique Constraint</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>AI Concierge Model</Text>
            <Text style={styles.infoVal}>Rule-Based Local Matcher</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>iOS Bundle Target</Text>
            <Text style={styles.infoVal}>com.hotelmng.app</Text>
          </View>
        </View>

        <View style={{ marginTop: 24 }}>
          <IOSButton
            title="Sign Out of Admin Console"
            variant="danger"
            onPress={handleLogout}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 36 : 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  content: {
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  email: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  roleBadge: {
    marginTop: 10,
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    color: '#7C3AED',
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  infoValActive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16A34A',
  },
});
