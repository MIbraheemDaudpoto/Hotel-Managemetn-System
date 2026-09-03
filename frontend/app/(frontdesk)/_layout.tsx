import React from 'react';
import { Tabs } from 'expo-router';
import { AppIcon } from '../../src/components/UI';

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
          tabBarIcon: ({ color }) => <AppIcon name="grid" color={color} />,
        }}
      />
      <Tabs.Screen
        name="operations"
        options={{
          title: 'Daily Flow',
          tabBarIcon: ({ color }) => <AppIcon name="headset" color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports & Logs',
          tabBarIcon: ({ color }) => <AppIcon name="clipboard" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Staff',
          tabBarIcon: ({ color }) => <AppIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
