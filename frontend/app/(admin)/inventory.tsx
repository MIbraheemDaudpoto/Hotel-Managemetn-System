import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Modal, ActivityIndicator, Alert, SafeAreaView, Platform, ScrollView
} from 'react-native';
import { useHotelStore } from '../../src/store/hotelStore';
import { Room, RoomStatus } from '../../src/types';
import { AppIcon, StatusBadge, IOSButton } from '../../src/components/UI';

export default function InventoryScreen() {
  const { rooms, fetchRooms, isLoadingRooms, createRoom, updateRoom, deactivateRoom } = useHotelStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState('Deluxe Double');
  const [capacity, setCapacity] = useState('2');
  const [price, setPrice] = useState('150');
  const [status, setStatus] = useState<RoomStatus>('Available');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleOpenAdd = () => {
    setEditingRoom(null);
    setRoomNumber('');
    setRoomType('Deluxe Double');
    setCapacity('2');
    setPrice('150');
    setStatus('Available');
    setDescription('');
    setModalVisible(true);
  };

  const handleOpenEdit = (room: Room) => {
    setEditingRoom(room);
    setRoomNumber(room.room_number);
    setRoomType(room.room_type);
    setCapacity(room.capacity.toString());
    setPrice(room.price_per_night.toString());
    setStatus(room.status);
    setDescription(room.description || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!roomNumber || !roomType || !price) {
      Alert.alert('Error', 'Please fill room number, type, and nightly price.');
      return;
    }

    setSaving(true);
    if (editingRoom) {
      const ok = await updateRoom(editingRoom.id, {
        room_number: roomNumber,
        room_type: roomType,
        capacity: parseInt(capacity) || 2,
        price_per_night: parseFloat(price) || 100,
        status: status,
        description: description,
      });
      setSaving(false);
      if (ok) {
        setModalVisible(false);
        Alert.alert('Success', `Room ${roomNumber} updated.`);
      } else {
        Alert.alert('Error', 'Failed to update room.');
      }
    } else {
      const ok = await createRoom({
        room_number: roomNumber,
        room_type: roomType,
        capacity: parseInt(capacity) || 2,
        price_per_night: parseFloat(price) || 100,
        status: status,
        description: description,
        is_active: true,
      });
      setSaving(false);
      if (ok) {
        setModalVisible(false);
        Alert.alert('Success', `Room ${roomNumber} created.`);
      } else {
        Alert.alert('Error', 'Failed to create room. Number might already exist.');
      }
    }
  };

  const handleDeactivate = (room: Room) => {
    Alert.alert(
      'Deactivate Room?',
      `Deactivating Room ${room.room_number} will remove it from the guest catalog without deleting historical bookings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            const ok = await deactivateRoom(room.id);
            if (ok) Alert.alert('Deactivated', `Room ${room.room_number} has been deactivated.`);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>INVENTORY CONTROL</Text>
          <Text style={styles.title}>Room Management</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd}>
          <Text style={styles.addBtnText}>+ Add Room</Text>
        </TouchableOpacity>
      </View>

      {isLoadingRooms ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.roomNum}>Room {item.room_number}</Text>
                  <Text style={styles.roomType}>{item.room_type}</Text>
                </View>
                <StatusBadge status={item.status} />
              </View>

              <Text style={styles.itemSpecs}>
                Capacity: {item.capacity} guests | ${item.price_per_night.toFixed(0)}/night
              </Text>
              {item.description ? (
                <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
              ) : null}

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => handleOpenEdit(item)}
                >
                  <Text style={styles.editBtnText}>✏️ Edit Details</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deactBtn}
                  onPress={() => handleDeactivate(item)}
                >
                  <Text style={styles.deactBtnText}>🗑️ Deactivate</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingRoom ? `Edit Room ${editingRoom.room_number}` : 'Add New Room'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <AppIcon name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Room Number</Text>
              <TextInput
                style={styles.input}
                value={roomNumber}
                onChangeText={setRoomNumber}
                placeholder="e.g. 501"
              />

              <Text style={styles.label}>Room Type</Text>
              <TextInput
                style={styles.input}
                value={roomType}
                onChangeText={setRoomType}
                placeholder="e.g. Deluxe Suite"
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Capacity (Guests)</Text>
                  <TextInput
                    style={styles.input}
                    value={capacity}
                    onChangeText={setCapacity}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.label}>Price / Night ($)</Text>
                  <TextInput
                    style={styles.input}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.label}>Room Description</Text>
              <TextInput
                style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Panoramic views, king-sized bed, work desk..."
                multiline
              />

              <View style={{ marginTop: 20, marginBottom: 30 }}>
                <IOSButton
                  title={saving ? 'Saving...' : editingRoom ? 'Save Changes' : 'Create Room'}
                  onPress={handleSave}
                  loading={saving}
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
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  roomNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  roomType: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  itemSpecs: {
    fontSize: 12,
    color: '#475569',
    marginTop: 8,
    fontWeight: '500',
  },
  itemDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  editBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  deactBtn: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  deactBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
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
    maxHeight: '85%',
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
  formRow: {
    flexDirection: 'row',
  },
});
