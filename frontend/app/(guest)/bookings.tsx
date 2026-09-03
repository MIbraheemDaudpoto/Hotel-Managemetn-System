import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, SafeAreaView, Platform, Modal, ScrollView
} from 'react-native';
import { useHotelStore } from '../../src/store/hotelStore';
import { StatusBadge, IOSButton } from '../../src/components/UI';
import { Booking, Invoice } from '../../src/types';

export default function BookingsScreen() {
  const { myBookings, fetchMyBookings, isLoadingBookings, cancelBooking, fetchInvoice } = useHotelStore();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const handleOpenInvoice = async (bookingId: number) => {
    setInvoiceLoading(true);
    const inv = await fetchInvoice(bookingId);
    setInvoiceLoading(false);
    if (inv) {
      setSelectedInvoice(inv);
      setInvoiceModalVisible(true);
    } else {
      Alert.alert('Invoice Error', 'Unable to retrieve invoice for this reservation.');
    }
  };

  const handleCancelBooking = (bookingId: number, ref: string) => {
    Alert.alert(
      'Cancel Reservation?',
      `Are you sure you want to cancel booking ${ref}? This will instantly free the room availability.`,
      [
        { text: 'Keep Reservation', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            const ok = await cancelBooking(bookingId);
            if (ok) {
              Alert.alert('Cancelled', 'Your booking has been cancelled successfully.');
            } else {
              Alert.alert('Error', 'Unable to cancel this booking.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Stays & Bookings</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchMyBookings}>
          <Text style={styles.refreshText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {isLoadingBookings ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={myBookings}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>No Reservations Yet</Text>
              <Text style={styles.emptyDesc}>Book a room from the Find Rooms tab.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.bookingCard}>
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.refCode}>{item.booking_reference}</Text>
                  <Text style={styles.roomInfo}>
                    Room {item.room ? item.room.room_number : item.room_id} {item.room && item.room.room_type ? `• ${item.room.room_type}` : ''}
                  </Text>
                </View>
                <StatusBadge status={item.status} />
              </View>

              <View style={styles.detailsBox}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Check-In Date</Text>
                  <Text style={styles.detailVal}>📅 {item.check_in_date}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Check-Out Date</Text>
                  <Text style={styles.detailVal}>📅 {item.check_out_date}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Guest Name</Text>
                  <Text style={styles.detailVal}>👤 {item.guest_name}</Text>
                </View>
                <View style={[styles.detailRow, { marginTop: 4 }]}>
                  <Text style={styles.totalLabel}>Total Price</Text>
                  <Text style={styles.totalPrice}>${item.total_price.toFixed(2)}</Text>
                </View>
              </View>

              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={styles.invoiceBtn}
                  onPress={() => handleOpenInvoice(item.id)}
                >
                  <Text style={styles.invoiceBtnText}>📄 View Invoice</Text>
                </TouchableOpacity>

                {item.status === 'Confirmed' ? (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => handleCancelBooking(item.id, item.booking_reference)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel Booking</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={invoiceModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Booking Invoice</Text>
              <TouchableOpacity onPress={() => setInvoiceModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedInvoice ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.invoicePaper}>
                  <View style={styles.hotelHeader}>
                    <Text style={styles.hotelName}>{selectedInvoice.hotel_name}</Text>
                    <Text style={styles.hotelAddress}>{selectedInvoice.hotel_address}</Text>
                    <Text style={styles.hotelContact}>{selectedInvoice.hotel_contact}</Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.invInfoRow}>
                    <View>
                      <Text style={styles.invMetaLabel}>INVOICE NUMBER</Text>
                      <Text style={styles.invMetaVal}>{selectedInvoice.invoice_number}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.invMetaLabel}>DATE ISSUED</Text>
                      <Text style={styles.invMetaVal}>{selectedInvoice.issue_date}</Text>
                    </View>
                  </View>

                  <View style={styles.invInfoRow}>
                    <View>
                      <Text style={styles.invMetaLabel}>BILLED TO</Text>
                      <Text style={styles.invGuestName}>{selectedInvoice.guest_name}</Text>
                      <Text style={styles.invGuestEmail}>{selectedInvoice.guest_email}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.invMetaLabel}>STATUS</Text>
                      <StatusBadge status={selectedInvoice.status} />
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.itemizedBox}>
                    <Text style={styles.itemTitle}>Accommodation Details</Text>
                    <Text style={styles.itemRoom}>Room {selectedInvoice.room_number} ({selectedInvoice.room_type})</Text>
                    <Text style={styles.itemDates}>Stay: {selectedInvoice.check_in_date} to {selectedInvoice.check_out_date} ({selectedInvoice.number_of_nights} Nights)</Text>
                    <View style={styles.itemPriceRow}>
                      <Text style={styles.itemRate}>Rate: ${selectedInvoice.nightly_rate.toFixed(2)} / night</Text>
                      <Text style={styles.itemSubtotal}>${selectedInvoice.subtotal.toFixed(2)}</Text>
                    </View>
                  </View>

                  <View style={styles.totalSection}>
                    <View style={styles.calcRow}>
                      <Text style={styles.calcLabel}>Subtotal</Text>
                      <Text style={styles.calcVal}>${selectedInvoice.subtotal.toFixed(2)}</Text>
                    </View>
                    <View style={styles.calcRow}>
                      <Text style={styles.calcLabel}>Taxes & Surcharges</Text>
                      <Text style={styles.calcVal}>$0.00</Text>
                    </View>
                    <View style={[styles.calcRow, styles.totalRowHighlight]}>
                      <Text style={styles.grandTotalLabel}>Grand Total Amount</Text>
                      <Text style={styles.grandTotalVal}>${selectedInvoice.total_amount.toFixed(2)}</Text>
                    </View>
                  </View>
                </View>

                <View style={{ marginTop: 16, marginBottom: 20 }}>
                  <IOSButton
                    title="Close Invoice"
                    variant="secondary"
                    onPress={() => setInvoiceModalVisible(false)}
                  />
                </View>
              </ScrollView>
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
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  refCode: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
  },
  roomInfo: {
    fontSize: 13,
    color: '#475569',
    marginTop: 3,
    fontWeight: '600',
  },
  detailsBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  invoiceBtn: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  invoiceBtnText: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '700',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#DC2626',
    fontSize: 13,
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
    maxHeight: '90%',
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
  invoicePaper: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  hotelHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  hotelName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  hotelAddress: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  hotelContact: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  invInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  invMetaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  invMetaVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  invGuestName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  invGuestEmail: {
    fontSize: 11,
    color: '#64748B',
  },
  itemizedBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 6,
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  itemRoom: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  itemDates: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  itemPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  itemRate: {
    fontSize: 12,
    color: '#64748B',
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalSection: {
    marginTop: 10,
    gap: 4,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calcLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  calcVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  totalRowHighlight: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1',
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  grandTotalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2563EB',
  },
});
