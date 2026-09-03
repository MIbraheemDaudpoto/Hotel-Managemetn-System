import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function FrontDeskLayout() {
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
        tabBarActiveTintColor: '#0284C7',
        tabBarInactiveTintColor: '#64748B',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="grid"
        options={{
          title: 'Room Grid',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🔲</Text>,
        }}
      />
      <Tabs.Screen
        name="operations"
        options={{
          title: 'Daily Flow',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🛎️</Text>,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports & Logs',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>📋</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Staff',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}
