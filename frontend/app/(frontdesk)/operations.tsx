import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, SafeAreaView, Platform
} from 'react-native';
import { useHotelStore } from '../../src/store/hotelStore';
import { Booking } from '../../src/types';
import { StatusBadge } from '../../src/components/UI';

export default function FrontDeskOperationsScreen() {
  const { operations, fetchOperations, isLoadingOperations, checkInGuest, checkOutGuest } = useHotelStore();
  const [activeTab, setActiveTab] = useState<'arrivals' | 'departures' | 'in_house'>('arrivals');

  useEffect(() => {
    fetchOperations();
  }, []);

  const handleCheckIn = async (booking: Booking) => {
    const roomIdentifier = booking.room ? booking.room.room_number : booking.room_id;
    Alert.alert(
      'Check In Guest',
      `Check in ${booking.guest_name} into Room ${roomIdentifier}? This will update room status to Occupied.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Check In',
          onPress: async () => {
            const ok = await checkInGuest(booking.id);
            if (ok) Alert.alert('Success', `${booking.guest_name} checked in!`);
            else Alert.alert('Error', 'Check-in failed.');
          },
        },
      ]
    );
  };

  const handleCheckOut = async (booking: Booking) => {
    const roomIdentifier = booking.room ? booking.room.room_number : booking.room_id;
    Alert.alert(
      'Check Out Guest',
      `Check out ${booking.guest_name} from Room ${roomIdentifier}? This will automatically transition Room ${roomIdentifier} to Cleaning status.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Check Out',
          onPress: async () => {
            const ok = await checkOutGuest(booking.id);
            if (ok) Alert.alert('Success', `${booking.guest_name} checked out! Room set to Cleaning.`);
            else Alert.alert('Error', 'Check-out failed.');
          },
        },
      ]
    );
  };

  const getActiveList = () => {
    if (!operations) return [];
    if (activeTab === 'arrivals') return operations.expected_arrivals;
    if (activeTab === 'departures') return operations.expected_departures;
    return operations.active_in_house;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>TODAY'S SCHEDULE</Text>
          <Text style={styles.title}>Guest Operations Flow</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchOperations}>
          <Text style={styles.refreshText}>🔄</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.navTabs}>
        <TouchableOpacity
          style={[styles.navTab, activeTab === 'arrivals' && styles.navTabActive]}
          onPress={() => setActiveTab('arrivals')}
        >
          <Text style={[styles.navTabText, activeTab === 'arrivals' && styles.navTabTextActive]}>
            Arrivals ({operations ? operations.expected_arrivals.length : 0})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'departures' && styles.navTabActive]}
          onPress={() => setActiveTab('departures')}
        >
          <Text style={[styles.navTabText, activeTab === 'departures' && styles.navTabTextActive]}>
            Departures ({operations ? operations.expected_departures.length : 0})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, activeTab === 'in_house' && styles.navTabActive]}
          onPress={() => setActiveTab('in_house')}
        >
          <Text style={[styles.navTabText, activeTab === 'in_house' && styles.navTabTextActive]}>
            In-House ({operations ? operations.active_in_house.length : 0})
          </Text>
        </TouchableOpacity>
      </View>

      {isLoadingOperations && !operations ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#0284C7" />
        </View>
      ) : (
        <FlatList
          data={getActiveList()}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>✨</Text>
              <Text style={styles.emptyTitle}>No Entries Found</Text>
              <Text style={styles.emptyDesc}>No operations pending in this category for today.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.opCard}>
              <View style={styles.opHeader}>
                <View>
                  <Text style={styles.guestName}>{item.guest_name}</Text>
                  <Text style={styles.refNum}>{item.booking_reference} • {item.guest_email}</Text>
                </View>
                <StatusBadge status={item.status} />
              </View>

              <View style={styles.opDetails}>
                <Text style={styles.roomBadge}>
                  Room #{item.room ? item.room.room_number : item.room_id} {item.room && item.room.room_type ? `(${item.room.room_type})` : ''}
                </Text>
                <Text style={styles.datesText}>📅 {item.check_in_date} → {item.check_out_date}</Text>
              </View>

              <View style={styles.actionRow}>
                {item.status === 'Confirmed' ? (
                  <TouchableOpacity
                    style={styles.checkInActionBtn}
                    onPress={() => handleCheckIn(item)}
                  >
                    <Text style={styles.checkInActionText}>✓ Check-In Guest</Text>
                  </TouchableOpacity>
                ) : null}

                {item.status === 'Checked-In' ? (
                  <TouchableOpacity
                    style={styles.checkOutActionBtn}
                    onPress={() => handleCheckOut(item)}
                  >
                    <Text style={styles.checkOutActionText}>⇥ Check-Out (Sets Room to Cleaning)</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
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
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 44,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  opCard: {
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
  opHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  guestName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  refNum: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
    marginTop: 2,
  },
  opDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  roomBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  datesText: {
    fontSize: 12,
    color: '#64748B',
  },
  actionRow: {
    marginTop: 12,
  },
  checkInActionBtn: {
    backgroundColor: '#16A34A',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkInActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  checkOutActionBtn: {
    backgroundColor: '#D97706',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkOutActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
