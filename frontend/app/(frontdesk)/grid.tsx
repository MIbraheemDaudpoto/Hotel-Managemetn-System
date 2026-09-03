import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, ActivityIndicator, Alert, SafeAreaView, Platform
} from 'react-native';
import { useHotelStore } from '../../src/store/hotelStore';
import { Room, RoomStatus } from '../../src/types';
import { StatusBadge } from '../../src/components/UI';

export default function RoomGridScreen() {
  const { operations, fetchOperations, isLoadingOperations, updateRoomStatus } = useHotelStore();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('All');

  useEffect(() => {
    fetchOperations();
    const interval = setInterval(fetchOperations, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenStatusModal = (room: Room) => {
    setSelectedRoom(room);
    setModalVisible(true);
  };

  const handleUpdateStatus = async (newStatus: RoomStatus) => {
    if (!selectedRoom) return;
    const ok = await updateRoomStatus(selectedRoom.id, newStatus);
    if (ok) {
      setModalVisible(false);
      Alert.alert('Status Updated', `Room ${selectedRoom.room_number} set to ${newStatus}`);
    } else {
      Alert.alert('Error', 'Could not update room status');
    }
  };

  const rooms = operations ? operations.all_rooms : [];
  const filteredRooms = statusFilter === 'All'
    ? rooms
    : rooms.filter((r) => r.status === statusFilter);

  const counts = {
    Available: rooms.filter((r) => r.status === 'Available').length,
    Occupied: rooms.filter((r) => r.status === 'Occupied').length,
    Cleaning: rooms.filter((r) => r.status === 'Cleaning').length,
    Maintenance: rooms.filter((r) => r.status === 'Maintenance').length,
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>FRONT DESK OPS</Text>
          <Text style={styles.title}>Live Room Status Grid</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchOperations}>
          <Text style={styles.refreshText}>🔄</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryBar}>
        <View style={[styles.summaryPill, { backgroundColor: '#DCFCE7' }]}>
          <Text style={[styles.pillNum, { color: '#15803D' }]}>{counts.Available}</Text>
          <Text style={[styles.pillLabel, { color: '#15803D' }]}>Available</Text>
        </View>
        <View style={[styles.summaryPill, { backgroundColor: '#DBEAFE' }]}>
          <Text style={[styles.pillNum, { color: '#1D4ED8' }]}>{counts.Occupied}</Text>
          <Text style={[styles.pillLabel, { color: '#1D4ED8' }]}>Occupied</Text>
        </View>
        <View style={[styles.summaryPill, { backgroundColor: '#FEF3C7' }]}>
          <Text style={[styles.pillNum, { color: '#B45309' }]}>{counts.Cleaning}</Text>
          <Text style={[styles.pillLabel, { color: '#B45309' }]}>Cleaning</Text>
        </View>
        <View style={[styles.summaryPill, { backgroundColor: '#FEE2E2' }]}>
          <Text style={[styles.pillNum, { color: '#B91C1C' }]}>{counts.Maintenance}</Text>
          <Text style={[styles.pillLabel, { color: '#B91C1C' }]}>Maint.</Text>
        </View>
      </View>

      <View style={styles.filterTabs}>
        {['All', 'Available', 'Occupied', 'Cleaning', 'Maintenance'].map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterTab, statusFilter === s && styles.filterTabActive]}
            onPress={() => setStatusFilter(s)}
          >
            <Text style={[styles.filterTabText, statusFilter === s && styles.filterTabTextActive]}>
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoadingOperations && !operations ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#0284C7" />
        </View>
      ) : (
        <FlatList
          data={filteredRooms}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.rowWrapper}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.gridCard}
              onPress={() => handleOpenStatusModal(item)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.roomNum}>#{item.room_number}</Text>
                <StatusBadge status={item.status} />
              </View>

              <Text style={styles.gridType}>{item.room_type}</Text>
              <Text style={styles.gridCap}>👥 {item.capacity} guests • ${item.price_per_night}/n</Text>

              <View style={styles.tapAction}>
                <Text style={styles.tapActionText}>Tap to change status →</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Room Status</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedRoom ? (
              <View>
                <Text style={styles.modalSub}>
                  Room {selectedRoom.room_number} ({selectedRoom.room_type})
                </Text>
                <Text style={styles.currentStatusText}>Current Status: {selectedRoom.status}</Text>

                <View style={styles.statusActionList}>
                  {(['Available', 'Occupied', 'Cleaning', 'Maintenance'] as RoomStatus[]).map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.statusOptionBtn,
                        selectedRoom.status === s && styles.statusOptionCurrent,
                      ]}
                      onPress={() => handleUpdateStatus(s)}
                    >
                      <StatusBadge status={s} />
                      <Text style={styles.statusOptionText}>Set to {s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}
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
  summaryBar: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  summaryPill: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  pillNum: {
    fontSize: 16,
    fontWeight: '800',
  },
  pillLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  filterTabActive: {
    backgroundColor: '#0284C7',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  gridContent: {
    padding: 16,
  },
  rowWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    width: '48%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
  },
  roomNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  gridType: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
    marginTop: 6,
  },
  gridCap: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  tapAction: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  tapActionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    fontSize: 20,
    color: '#94A3B8',
  },
  modalSub: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  currentStatusText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 16,
  },
  statusActionList: {
    gap: 10,
    marginBottom: 20,
  },
  statusOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusOptionCurrent: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
});
