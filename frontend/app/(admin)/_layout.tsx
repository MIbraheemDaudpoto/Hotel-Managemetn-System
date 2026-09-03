import React from 'react';
import { Tabs } from 'expo-router';
import { AppIcon } from '../../src/components/UI';

export default function AdminLayout() {
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
        tabBarActiveTintColor: '#7C3AED',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'KPIs',
          tabBarIcon: ({ color }) => <AppIcon name="gauge" color={color} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          tabBarIcon: ({ color }) => <AppIcon name="door" color={color} />,
        }}
      />
      <Tabs.Screen
        name="staff"
        options={{
          title: 'Staff',
          tabBarIcon: ({ color }) => <AppIcon name="users" color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Audit & Logs',
          tabBarIcon: ({ color }) => <AppIcon name="file" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Admin',
          tabBarIcon: ({ color }) => <AppIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
