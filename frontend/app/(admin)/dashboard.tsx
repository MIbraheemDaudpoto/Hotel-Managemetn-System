import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, SafeAreaView, Platform
} from 'react-native';
import { useHotelStore } from '../../src/store/hotelStore';
import { KPICard } from '../../src/components/UI';

export default function AdminDashboardScreen() {
  const { kpis, fetchDashboardKPIs, isLoadingAdmin } = useHotelStore();

  useEffect(() => {
    fetchDashboardKPIs();
    const interval = setInterval(fetchDashboardKPIs, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>ADMIN OVERVIEW</Text>
          <Text style={styles.title}>Property KPI Dashboard</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchDashboardKPIs}>
          <Text style={styles.refreshText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {isLoadingAdmin && !kpis ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.occupancyBanner}>
            <View>
              <Text style={styles.occupancyTitle}>Occupancy Rate</Text>
              <Text style={styles.occupancyPercent}>{kpis ? kpis.occupancy_rate_percent.toFixed(1) : '0.0'}%</Text>
              <Text style={styles.occupancySub}>
                {kpis ? kpis.occupied_rooms : 0} of {kpis ? kpis.total_rooms : 0} rooms currently occupied
              </Text>
            </View>
            <View style={styles.occupancyCircle}>
              <Text style={{ fontSize: 32 }}>📈</Text>
            </View>
          </View>

          <View style={styles.kpiGrid}>
            <View style={styles.kpiCol}>
              <KPICard
                title="Available Rooms"
                value={kpis ? kpis.available_rooms : 0}
                subtitle="Clean & ready to sell"
                color="#16A34A"
              />
            </View>
            <View style={styles.kpiCol}>
              <KPICard
                title="Occupied Rooms"
                value={kpis ? kpis.occupied_rooms : 0}
                subtitle="Active guest stays"
                color="#2563EB"
              />
            </View>
          </View>

          <View style={styles.kpiGrid}>
            <View style={styles.kpiCol}>
              <KPICard
                title="Housekeeping Turnover"
                value={kpis ? kpis.cleaning_rooms : 0}
                subtitle="Vacated & awaiting clean"
                color="#D97706"
              />
            </View>
            <View style={styles.kpiCol}>
              <KPICard
                title="Under Maintenance"
                value={kpis ? kpis.maintenance_rooms : 0}
                subtitle="Repairs / offline"
                color="#DC2626"
              />
            </View>
          </View>

          <View style={styles.kpiGrid}>
            <View style={styles.kpiCol}>
              <KPICard
                title="Today's Check-Ins"
                value={kpis ? kpis.today_checkins_count : 0}
                subtitle="Scheduled arrivals"
                color="#7C3AED"
              />
            </View>
            <View style={styles.kpiCol}>
              <KPICard
                title="Active / Upcoming"
                value={kpis ? kpis.total_active_and_upcoming_bookings : 0}
                subtitle="Total pipeline reservations"
                color="#0284C7"
              />
            </View>
          </View>

          <KPICard
            title="Gross Booking Volume"
            value={kpis ? `$${kpis.total_revenue.toFixed(2)}` : '$0.00'}
            subtitle="Lifetime confirmed & completed bookings"
            color="#059669"
          />

          <View style={styles.pollingNotice}>
            <Text style={styles.pollingText}>
              ⚡ Live Short-Interval Polling Active (Aggregate Query Target &lt; 200ms)
            </Text>
          </View>
        </ScrollView>
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
  content: {
    padding: 16,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  occupancyBanner: {
    backgroundColor: '#7C3AED',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  occupancyTitle: {
    fontSize: 13,
    color: '#E9D5FF',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  occupancyPercent: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  occupancySub: {
    fontSize: 12,
    color: '#DDD6FE',
    marginTop: 4,
  },
  occupancyCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  kpiCol: {
    flex: 1,
  },
  pollingNotice: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  pollingText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
});
