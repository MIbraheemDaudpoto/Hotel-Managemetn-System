import React from 'react';
import { Tabs } from 'expo-router';
import { AppIcon } from '../../src/components/UI';

export default function GuestLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Find Rooms',
          tabBarIcon: ({ color }) => <AppIcon name="hotel" color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'My Stays',
          tabBarIcon: ({ color }) => <AppIcon name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="concierge"
        options={{
          title: 'AI Concierge',
          tabBarIcon: ({ color }) => <AppIcon name="message" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <AppIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
