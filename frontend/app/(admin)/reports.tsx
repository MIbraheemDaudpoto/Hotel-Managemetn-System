import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, SafeAreaView, Platform, Modal, Alert, ScrollView
} from 'react-native';
import { useHotelStore } from '../../src/store/hotelStore';
import { AppIcon, StatusBadge, IOSButton } from '../../src/components/UI';
import { HotelPolicyItem } from '../../src/types';

export default function ReportsAndAuditScreen() {
  const {
    allBookings, fetchAllBookings,
    auditLogs, fetchAuditLogs,
    policies, fetchPolicies, updatePolicy
  } = useHotelStore();

  const [activeTab, setActiveTab] = useState<'bookings' | 'audit' | 'policies'>('bookings');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const [editPolicyModal, setEditPolicyModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<HotelPolicyItem | null>(null);
  const [policyTitle, setPolicyTitle] = useState('');
  const [policyContent, setPolicyContent] = useState('');
  const [savingPolicy, setSavingPolicy] = useState(false);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchAllBookings(statusFilter, dateFrom, dateTo),
      fetchAuditLogs(),
      fetchPolicies()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleApplyDateFilter = () => {
    fetchAllBookings(statusFilter, dateFrom, dateTo);
  };

  const handleOpenEditPolicy = (p: HotelPolicyItem) => {
    setSelectedPolicy(p);
    setPolicyTitle(p.title);
    setPolicyContent(p.content);
    setEditPolicyModal(true);
  };

  const handleSavePolicy = async () => {
    if (!selectedPolicy || !policyTitle || !policyContent) return;
    setSavingPolicy(true);
    const ok = await updatePolicy(selectedPolicy.key, policyTitle, policyContent);
    setSavingPolicy(false);
    if (ok) {
      setEditPolicyModal(false);
      Alert.alert('Policy Updated', `Policy '${selectedPolicy.key}' updated. AI Concierge will now use this updated content.`);
    } else {
      Alert.alert('Error', 'Failed to update hotel policy.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>COMPLIANCE & GOVERNANCE</Text>
          <Text style={styles.title}>Reports, Audits & Settings</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadData}>
          <AppIcon name="refresh" size={18} color="#7C3AED" />
        </TouchableOpacity>
      </View>

      <View style={styles.navTabs}>
        <TouchableOpacity
          style={[styles.navTab, activeTab === 'bookings' && styles.navTabActive]}
          onPress={() => setActiveTab('bookings')}
        >
          <Text style={[styles.navTabText, activeTab === 'bookings' && styles.navTabTextActive]}>
            Bookings ({allBookings.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'audit' && styles.navTabActive]}
          onPress={() => setActiveTab('audit')}
        >
          <Text style={[styles.navTabText, activeTab === 'audit' && styles.navTabTextActive]}>
            Audit Trail ({auditLogs.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'policies' && styles.navTabActive]}
          onPress={() => setActiveTab('policies')}
        >
          <Text style={[styles.navTabText, activeTab === 'policies' && styles.navTabTextActive]}>
            AI Policies ({policies.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'bookings' ? (
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusChipsRow}>
            {['', 'Confirmed', 'Checked-In', 'Checked-Out', 'Cancelled'].map((s) => (
              <TouchableOpacity
                key={s || 'all'}
                style={[styles.chip, statusFilter === s && styles.chipActive]}
                onPress={() => setStatusFilter(s)}
              >
                <Text style={[styles.chipText, statusFilter === s && styles.chipTextActive]}>
                  {s ? s : 'All Statuses'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.dateFilterRow}>
            <TextInput
              style={styles.dateInput}
              value={dateFrom}
              onChangeText={setDateFrom}
              placeholder="From: YYYY-MM-DD"
            />
            <TextInput
              style={styles.dateInput}
              value={dateTo}
              onChangeText={setDateTo}
              placeholder="To: YYYY-MM-DD"
            />
            <TouchableOpacity style={styles.filterBtn} onPress={handleApplyDateFilter}>
              <Text style={styles.filterBtnText}>Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      ) : activeTab === 'bookings' ? (
        <FlatList
          data={allBookings}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No bookings match the selected criteria.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.logCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.refNum}>{item.booking_reference}</Text>
                  <Text style={styles.guestText}>{item.guest_name} ({item.guest_email})</Text>
                </View>
                <StatusBadge status={item.status} />
              </View>

              <View style={styles.bookingDetails}>
                <Text style={styles.detailText}>
                  Room #{item.room ? item.room.room_number : item.room_id} {item.room && item.room.room_type ? `(${item.room.room_type})` : ''}
                </Text>
                <Text style={styles.detailText}>{item.check_in_date} → {item.check_out_date}</Text>
                <Text style={styles.priceText}>${item.total_price.toFixed(2)}</Text>
              </View>
            </View>
          )}
        />
      ) : activeTab === 'audit' ? (
        <FlatList
          data={auditLogs}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.auditCard}>
              <View style={styles.auditHeader}>
                <Text style={styles.auditAction}>{item.action}</Text>
                <Text style={styles.auditTime}>
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <Text style={styles.auditUser}>User: {item.user_email} | Target: {item.target_type} ({item.target_id || 'N/A'})</Text>
              {item.details ? <Text style={styles.auditDetails}>{item.details}</Text> : null}
            </View>
          )}
        />
      ) : (
        <FlatList
          data={policies}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.policyCard}>
              <View style={styles.policyHeader}>
                <Text style={styles.policyKey}>[{item.key.toUpperCase()}]</Text>
                <TouchableOpacity
                  style={styles.editPolicyBtn}
                  onPress={() => handleOpenEditPolicy(item)}
                >
                  <Text style={styles.editPolicyBtnText}>✏️ Edit Text</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.policyTitle}>{item.title}</Text>
              <Text style={styles.policyContent}>{item.content}</Text>
            </View>
          )}
        />
      )}

      <Modal visible={editPolicyModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Hotel Policy ({selectedPolicy?.key})</Text>
              <TouchableOpacity onPress={() => setEditPolicyModal(false)}>
                <AppIcon name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Policy Title</Text>
              <TextInput
                style={styles.input}
                value={policyTitle}
                onChangeText={setPolicyTitle}
              />

              <Text style={styles.label}>Policy Text (Injected into AI Concierge)</Text>
              <TextInput
                style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
                value={policyContent}
                onChangeText={setPolicyContent}
                multiline
              />

              <View style={{ marginTop: 20, marginBottom: 20 }}>
                <IOSButton
                  title={savingPolicy ? 'Saving Policy...' : 'Save & Update AI Concierge'}
                  onPress={handleSavePolicy}
                  loading={savingPolicy}
                />
              </View>
            </ScrollView>
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
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshText: {
    fontSize: 16,
  },
  navTabs: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  navTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  navTabActive: {
    backgroundColor: '#7C3AED',
  },
  navTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  navTabTextActive: {
    color: '#FFFFFF',
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  statusChipsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: '#7C3AED',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  dateFilterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 36,
    fontSize: 12,
  },
  filterBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  refNum: {
    fontSize: 15,
    fontWeight: '800',
    color: '#7C3AED',
  },
  guestText: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  bookingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  detailText: {
    fontSize: 12,
    color: '#64748B',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  auditCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  auditAction: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  auditTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  auditUser: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  auditDetails: {
    fontSize: 12,
    color: '#334155',
    marginTop: 6,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
  },
  policyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  policyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  policyKey: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7C3AED',
    letterSpacing: 1,
  },
  editPolicyBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  editPolicyBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  policyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  policyContent: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
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
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
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
});
