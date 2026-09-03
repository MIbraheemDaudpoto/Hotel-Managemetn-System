import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CalendarDays, ClipboardList, DoorOpen, FileText, Gauge, Headset, Hotel, LayoutGrid, LucideIcon, MessageCircle, RefreshCw, ShieldCheck, UserRound, UsersRound, Wrench, X } from 'lucide-react-native';

const iconMap = {
  calendar: CalendarDays,
  clipboard: ClipboardList,
  door: DoorOpen,
  file: FileText,
  gauge: Gauge,
  headset: Headset,
  hotel: Hotel,
  grid: LayoutGrid,
  message: MessageCircle,
  refresh: RefreshCw,
  shield: ShieldCheck,
  user: UserRound,
  users: UsersRound,
  wrench: Wrench,
  close: X,
} as const;

export const AppIcon = ({ name, size = 20, color = '#334155', strokeWidth = 2 }: { name: keyof typeof iconMap; size?: number; color?: string; strokeWidth?: number }) => {
  const Icon: LucideIcon = iconMap[name];
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
};

export const StatusBadge = ({ status }: { status: string }) => {
  const getColors = (s: string) => {
    switch (s) {
      case 'Available':
        return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
      case 'Occupied':
        return { bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD' };
      case 'Cleaning':
        return { bg: '#FEF3C7', text: '#B45309', border: '#FCD34D' };
      case 'Maintenance':
        return { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5' };
      case 'Confirmed':
        return { bg: '#EDE9FE', text: '#6D28D9', border: '#C4B5FD' };
      case 'Checked-In':
        return { bg: '#D1FAE5', text: '#047857', border: '#6EE7B7' };
      case 'Checked-Out':
        return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };
      case 'Pending':
        return { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' };
      case 'Cancelled':
        return { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' };
      default:
        return { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' };
    }
  };

  const c = getColors(status);

  return (
    <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{status}</Text>
    </View>
  );
};

export const KPICard = ({ title, value, subtitle, color = '#2563EB' }: { title: string; value: string | number; subtitle?: string; color?: string }) => (
  <View style={styles.kpiCard}>
    <View style={[styles.kpiIndicator, { backgroundColor: color }]} />
    <Text style={styles.kpiTitle}>{title}</Text>
    <Text style={[styles.kpiValue, { color }]}>{value}</Text>
    {subtitle ? <Text style={styles.kpiSubtitle}>{subtitle}</Text> : null}
  </View>
);

export const IOSButton = ({ title, onPress, variant = 'primary', loading = false, disabled = false }: { title: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'danger'; loading?: boolean; disabled?: boolean }) => {
  const getStyle = () => {
    if (disabled) return styles.btnDisabled;
    if (variant === 'secondary') return styles.btnSecondary;
    if (variant === 'danger') return styles.btnDanger;
    return styles.btnPrimary;
  };

  const getTextStyle = () => {
    if (variant === 'secondary') return styles.btnSecondaryText;
    return styles.btnText;
  };

  return (
    <TouchableOpacity
      style={[styles.btnBase, getStyle()]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? <ActivityIndicator color={variant === 'secondary' ? '#2563EB' : '#FFFFFF'} /> : <Text style={getTextStyle()}>{title}</Text>}
    </TouchableOpacity>
  );
};



const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  kpiIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  kpiTitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 4,
  },
  kpiSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  btnBase: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  btnPrimary: {
    backgroundColor: '#2563EB',
  },
  btnSecondary: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  btnDanger: {
    backgroundColor: '#DC2626',
  },
  btnDisabled: {
    backgroundColor: '#94A3B8',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  btnSecondaryText: {
    color: '#1E293B',
    fontSize: 16,
    fontWeight: '700',
  },
});
