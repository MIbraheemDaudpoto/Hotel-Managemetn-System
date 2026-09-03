import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, SafeAreaView, Platform
} from 'react-native';
import { useHotelStore } from '../../src/store/hotelStore';
import { AppIcon, StatusBadge } from '../../src/components/UI';

export default function FrontDeskReportsScreen() {
  const { allBookings, fetchAllBookings, auditLogs, fetchAuditLogs } = useHotelStore();
  const [activeTab, setActiveTab] = useState<'bookings' | 'audit'>('bookings');
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchAllBookings(), fetchAuditLogs()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>FRONT DESK OVERSIGHT</Text>
          <Text style={styles.title}>Operational Logs & Bookings</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadData}>
          <AppIcon name="refresh" size={18} color="#0284C7" />
        </TouchableOpacity>
      </View>

      <View style={styles.navTabs}>
        <TouchableOpacity
          style={[styles.navTab, activeTab === 'bookings' && styles.navTabActive]}
          onPress={() => setActiveTab('bookings')}
        >
          <Text style={[styles.navTabText, activeTab === 'bookings' && styles.navTabTextActive]}>
            All Bookings ({allBookings.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'audit' && styles.navTabActive]}
          onPress={() => setActiveTab('audit')}
        >
          <Text style={[styles.navTabText, activeTab === 'audit' && styles.navTabTextActive]}>
            Operational Log ({auditLogs.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#0284C7" />
        </View>
      ) : activeTab === 'bookings' ? (
        <FlatList
          data={allBookings}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
      ) : (
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
              <Text style={styles.auditUser}>Staff: {item.user_email} | Target: {item.target_type} ({item.target_id || 'N/A'})</Text>
              {item.details ? <Text style={styles.auditDetails}>{item.details}</Text> : null}
            </View>
          )}
        />
      )}
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
    color: '#0284C7',
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
    backgroundColor: '#0284C7',
  },
  navTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  navTabTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#0284C7',
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
    borderLeftColor: '#0284C7',
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
});
