import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Modal, ActivityIndicator, Alert, SafeAreaView, Platform
} from 'react-native';
import { useHotelStore } from '../../src/store/hotelStore';
import { AppIcon, IOSButton } from '../../src/components/UI';

export default function StaffManagementScreen() {
  const { staffList, fetchStaffList, createStaff, toggleStaffActive } = useHotelStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'FRONT_DESK' | 'ADMIN'>('FRONT_DESK');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStaffList();
  }, []);

  const handleCreateStaff = async () => {
    if (!fullName || !email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setSaving(true);
    const ok = await createStaff({ full_name: fullName, email, password, role });
    setSaving(false);
    if (ok) {
      setModalVisible(false);
      setFullName('');
      setEmail('');
      setPassword('');
      Alert.alert('Success', `Staff account for ${email} provisioned.`);
    } else {
      Alert.alert('Error', 'Failed to provision staff account. Email may already exist.');
    }
  };

  const handleToggle = (user: any) => {
    Alert.alert(
      user.is_active ? 'Deactivate Staff?' : 'Activate Staff?',
      `Are you sure you want to ${user.is_active ? 'deactivate' : 'reactivate'} ${user.full_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            const ok = await toggleStaffActive(user.id);
            if (!ok) Alert.alert('Error', 'Action failed. Cannot deactivate your own admin account.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>ACCESS CONTROL</Text>
          <Text style={styles.title}>Staff Accounts</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ New Staff</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={staffList}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.staffCard}>
            <View style={styles.staffHeader}>
              <View>
                <Text style={styles.staffName}>{item.full_name}</Text>
                <Text style={styles.staffEmail}>{item.email}</Text>
              </View>
              <View style={[styles.rolePill, { backgroundColor: item.role === 'ADMIN' ? '#EDE9FE' : '#E0F2FE' }]}>
                <Text style={[styles.roleText, { color: item.role === 'ADMIN' ? '#7C3AED' : '#0284C7' }]}>
                  {item.role}
                </Text>
              </View>
            </View>

            <View style={styles.staffFooter}>
              <Text style={item.is_active ? styles.statusActive : styles.statusInactive}>
                ● {item.is_active ? 'Active Account' : 'Deactivated'}
              </Text>

              <TouchableOpacity
                style={[styles.toggleBtn, { backgroundColor: item.is_active ? '#FEE2E2' : '#DCFCE7' }]}
                onPress={() => handleToggle(item)}
              >
                <Text style={[styles.toggleBtnText, { color: item.is_active ? '#DC2626' : '#15803D' }]}>
                  {item.is_active ? 'Deactivate' : 'Reactivate'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Provision Staff Account</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <AppIcon name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Staff Member Name"
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="staff@hotel.com"
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.label}>Temporary Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Min 6 characters"
              secureTextEntry
            />

            <Text style={styles.label}>Role</Text>
            <View style={styles.rolePicker}>
              <TouchableOpacity
                style={[styles.roleOption, role === 'FRONT_DESK' && styles.roleOptionActive]}
                onPress={() => setRole('FRONT_DESK')}
              >
                <Text style={[styles.roleOptionText, role === 'FRONT_DESK' && styles.roleOptionTextActive]}>
                  Front Desk
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleOption, role === 'ADMIN' && styles.roleOptionActive]}
                onPress={() => setRole('ADMIN')}
              >
                <Text style={[styles.roleOptionText, role === 'ADMIN' && styles.roleOptionTextActive]}>
                  Admin Manager
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 20 }}>
              <IOSButton
                title={saving ? 'Provisioning...' : 'Create Staff Account'}
                onPress={handleCreateStaff}
                loading={saving}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 36 : 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  brandTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  addBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
  },
  staffCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  staffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  staffName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  staffEmail: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  rolePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  staffFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statusActive: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  statusInactive: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    fontSize: 20,
    color: '#94A3B8',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginTop: 10,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: '#0F172A',
  },
  rolePicker: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  roleOptionActive: {
    backgroundColor: '#7C3AED',
  },
  roleOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  roleOptionTextActive: {
    color: '#FFFFFF',
  },
});
