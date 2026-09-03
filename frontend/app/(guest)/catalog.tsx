import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, ActivityIndicator, Alert, SafeAreaView, Platform, Image
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useHotelStore } from '../../src/store/hotelStore';
import { useAuthStore } from '../../src/store/authStore';
import { Room } from '../../src/types';
import { AppIcon, StatusBadge, IOSButton } from '../../src/components/UI';

const getRoomImage = (roomType: string, customUrl?: string) => {
  if (customUrl && customUrl.startsWith('http')) return customUrl;
  const t = (roomType || '').toLowerCase();
  if (t.includes('suite') || t.includes('penthouse')) {
    return 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80';
  } else if (t.includes('deluxe')) {
    return 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&q=80';
  } else if (t.includes('executive')) {
    return 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600&q=80';
  }
  return 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600&q=80';
};

const formatDateDisplay = (isoDate: string) => {
  try {
    const [y, m, d] = isoDate.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d} ${months[parseInt(m) - 1]} ${y}`;
  } catch {
    return isoDate;
  }
};

export default function CatalogScreen() {
  const {
    rooms, fetchRooms, isLoadingRooms,
    checkInDate, checkOutDate, setCheckInDate, setCheckOutDate,
    roomTypeFilter, setRoomTypeFilter,
    createBooking
  } = useHotelStore();
  const { user } = useAuthStore();

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Date picker state
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, [checkInDate, checkOutDate, roomTypeFilter]);

  const handleCheckInChange = (event: any, selected?: Date) => {
    setShowCheckInPicker(Platform.OS === 'ios');
    if (selected) {
      const todayStr = new Date().toISOString().split('T')[0];
      const selectedStr = selected.toISOString().split('T')[0];
      if (selectedStr < todayStr) {
        Alert.alert('Invalid Check-In Date', 'Check-in date cannot be in the past. Please select today or a future date.');
        return;
      }
      setCheckInDate(selectedStr);
      // If checkout is now on or before check-in, push checkout forward
      if (selectedStr >= checkOutDate) {
        const nextDay = new Date(selected);
        nextDay.setDate(nextDay.getDate() + 2);
        setCheckOutDate(nextDay.toISOString().split('T')[0]);
      }
    }
  };

  const handleCheckOutChange = (event: any, selected?: Date) => {
    setShowCheckOutPicker(Platform.OS === 'ios');
    if (selected) {
      const selectedStr = selected.toISOString().split('T')[0];
      if (selectedStr <= checkInDate) {
        Alert.alert('Invalid Check-Out Date', 'Check-out date must be strictly after the check-in date.');
        return;
      }
      setCheckOutDate(selectedStr);
    }
  };

  const handleOpenBooking = (room: Room) => {
    setSelectedRoom(room);
    setModalVisible(true);
  };

  const calculateStayNights = () => {
    try {
      const d1 = new Date(checkInDate);
      const d2 = new Date(checkOutDate);
      const diffTime = d2.getTime() - d1.getTime();
      const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return nights > 0 ? nights : 1;
    } catch {
      return 1;
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedRoom) return;
    setBookingLoading(true);
    const res = await createBooking(selectedRoom.id, checkInDate, checkOutDate, user?.full_name);
    setBookingLoading(false);

    if (res.success) {
      setModalVisible(false);
      Alert.alert(
        'Booking Confirmed!',
        `Reference: ${res.data.booking_reference}\nRoom: ${selectedRoom.room_number} (${selectedRoom.room_type})\nTotal: $${res.data.total_price.toFixed(2)}`
      );
    } else {
      Alert.alert('Booking Conflict', res.error || 'Failed to complete booking. Please choose another date range.');
    }
  };

  const nights = calculateStayNights();
  const totalPrice = selectedRoom ? selectedRoom.price_per_night * nights : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.hotelBrand}>GRAND HOTEL</Text>
          <Text style={styles.title}>Find & Book Rooms</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchRooms}>
          <AppIcon name="refresh" size={18} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>CHOOSE DATES</Text>
        <View style={styles.dateRow}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowCheckInPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.filterLabel}>CHECK-IN</Text>
            <View style={styles.dateValue}><AppIcon name="calendar" size={16} color="#2563EB" /><Text style={styles.dateValueText}>{formatDateDisplay(checkInDate)}</Text></View>
          </TouchableOpacity>

          <Text style={styles.dateArrow}>→</Text>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowCheckOutPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.filterLabel}>CHECK-OUT</Text>
            <View style={styles.dateValue}><AppIcon name="calendar" size={16} color="#2563EB" /><Text style={styles.dateValueText}>{formatDateDisplay(checkOutDate)}</Text></View>
          </TouchableOpacity>
        </View>

        {showCheckInPicker ? (
          <DateTimePicker
            value={new Date(checkInDate)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={new Date()}
            onChange={handleCheckInChange}
          />
        ) : null}

        {showCheckOutPicker ? (
          <DateTimePicker
            value={new Date(checkOutDate)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={new Date(new Date(checkInDate).getTime() + 86400000)}
            onChange={handleCheckOutChange}
          />
        ) : null}

        <View style={styles.chipsRow}>
          {['', 'Deluxe', 'Standard', 'Suite'].map((type) => (
            <TouchableOpacity
              key={type || 'all'}
              style={[styles.chip, roomTypeFilter === type && styles.chipActive]}
              onPress={() => setRoomTypeFilter(type)}
            >
              <Text style={[styles.chipText, roomTypeFilter === type && styles.chipTextActive]}>
                {type ? type : 'All Rooms'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoadingRooms ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Checking live server availability...</Text>
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <AppIcon name="hotel" size={40} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Rooms Available</Text>
              <Text style={styles.emptyDesc}>Try adjusting your check-in or check-out dates.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.roomCard}>
              <Image
                source={{ uri: getRoomImage(item.room_type, item.image_url) }}
                style={styles.roomImage}
                resizeMode="cover"
              />

              <View style={styles.roomCardBody}>
                <View style={styles.roomCardHeader}>
                  <View>
                    <Text style={styles.roomNumber}>Room {item.room_number}</Text>
                    <Text style={styles.roomType}>{item.room_type}</Text>
                  </View>
                  <StatusBadge status={item.status} />
                </View>

                <Text style={styles.roomDescription} numberOfLines={2}>
                  {item.description || 'Comfortable and elegantly appointed hotel accommodation with premium amenities.'}
                </Text>

                <View style={styles.roomSpecs}>
                  <View style={styles.specItem}>
                    <AppIcon name="users" size={16} color="#64748B" />
                    <Text style={styles.specText}>Up to {item.capacity} Guests</Text>
                  </View>
                  <View style={styles.specItem}>
                    <AppIcon name="message" size={16} color="#64748B" />
                    <Text style={styles.specText}>Free High-Speed Wi-Fi</Text>
                  </View>
                </View>

                <View style={styles.roomFooter}>
                  <View>
                    <Text style={styles.priceAmount}>${item.price_per_night.toFixed(0)}</Text>
                    <Text style={styles.pricePerNight}>per night</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.bookButton}
                    onPress={() => handleOpenBooking(item)}
                  >
                    <Text style={styles.bookButtonText}>Book Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Reservation</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <AppIcon name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {selectedRoom ? (
              <View style={styles.modalBody}>
                <Image
                  source={{ uri: getRoomImage(selectedRoom.room_type, selectedRoom.image_url) }}
                  style={styles.modalRoomImage}
                  resizeMode="cover"
                />

                <View style={styles.summaryBox}>
                  <Text style={styles.summaryRoom}>Room {selectedRoom.room_number} - {selectedRoom.room_type}</Text>
                  <View style={styles.summaryLine}><AppIcon name="calendar" size={16} color="#64748B" /><Text style={styles.summaryDates}>{formatDateDisplay(checkInDate)} to {formatDateDisplay(checkOutDate)} ({nights} {nights === 1 ? 'Night' : 'Nights'})</Text></View>
                  <View style={styles.summaryLine}><AppIcon name="user" size={16} color="#64748B" /><Text style={styles.summaryGuest}>Guest: {user?.full_name || 'Guest User'}</Text></View>
                  <View style={styles.divider} />
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Nightly Rate</Text>
                    <Text style={styles.priceVal}>${selectedRoom.price_per_night.toFixed(2)}</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Length of Stay</Text>
                    <Text style={styles.priceVal}>{nights} nights</Text>
                  </View>
                  <View style={[styles.priceRow, { marginTop: 8 }]}>
                    <Text style={styles.totalLabel}>Total Price ({nights} nights)</Text>
                    <Text style={styles.totalVal}>${totalPrice.toFixed(2)}</Text>
                  </View>
                </View>

                <View style={styles.guaranteeBox}>
                  <View style={styles.summaryLine}><AppIcon name="shield" size={16} color="#047857" /><Text style={styles.guaranteeText}>Dates protected by the transactional availability engine.</Text></View>
                </View>

                <View style={{ marginTop: 16 }}>
                  <IOSButton
                    title={bookingLoading ? 'Securing Room...' : `Confirm & Pay $${totalPrice.toFixed(2)}`}
                    onPress={handleConfirmBooking}
                    loading={bookingLoading}
                  />
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
  hotelBrand: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
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
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  dateValueText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  dateValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateArrow: {
    paddingHorizontal: 8,
    color: '#94A3B8',
    fontSize: 16,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  chipActive: {
    backgroundColor: '#2563EB',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
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
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
  },
  emptyDesc: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  roomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  roomImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#E2E8F0',
  },
  modalRoomImage: {
    width: '100%',
    height: 110,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#E2E8F0',
  },
  roomCardBody: {
    padding: 16,
  },
  roomCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  roomNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  roomType: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  roomDescription: {
    fontSize: 13,
    color: '#475569',
    marginTop: 8,
    lineHeight: 18,
  },
  roomSpecs: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specIcon: {
    fontSize: 14,
  },
  specText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  roomFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  priceAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  pricePerNight: {
    fontSize: 11,
    color: '#94A3B8',
  },
  bookButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
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
    padding: 20,
    maxHeight: '85%',
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
    padding: 4,
  },
  modalBody: {
    marginTop: 4,
  },
  summaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryRoom: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  summaryDates: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
  },
  summaryGuest: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  summaryLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  priceLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  priceVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalVal: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2563EB',
  },
  guaranteeBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  guaranteeText: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: '500',
  },
});
