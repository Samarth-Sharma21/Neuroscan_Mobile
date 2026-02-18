import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import {
  Home,
  ScanLine,
  ClipboardList,
  UserCircle,
  Stethoscope,
} from 'lucide-react-native';
import {
  Colors,
  FontFamily,
  FontSize,
  Shadows,
} from '../../src/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarLabelStyle: {
          fontFamily: FontFamily.medium,
          fontSize: FontSize.xs,
          marginTop: -2,
          marginBottom: Platform.OS === 'ios' ? 0 : 6,
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 16,
          left: 20,
          right: 20,
          height: 68,
          borderRadius: 24,
          backgroundColor: 'rgba(255,255,255,0.97)',
          borderTopWidth: 0,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 8 : 8,
          ...Shadows.lg,
          shadowColor: 'rgba(13, 148, 136, 0.15)',
          elevation: 12,
        },
        tabBarItemStyle: {
          borderRadius: 16,
          marginHorizontal: 4,
        },
      }}>
      <Tabs.Screen
        name='index'
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrap : undefined}>
              <Home size={22} color={color} strokeWidth={focused ? 2.2 : 1.8} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name='scan'
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.scanIconActive : styles.scanIcon}>
              <ScanLine
                size={22}
                color={focused ? '#fff' : color}
                strokeWidth={focused ? 2.2 : 1.8}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name='history'
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrap : undefined}>
              <ClipboardList
                size={22}
                color={color}
                strokeWidth={focused ? 2.2 : 1.8}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name='doctors'
        options={{
          title: 'Doctors',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrap : undefined}>
              <Stethoscope
                size={22}
                color={color}
                strokeWidth={focused ? 2.2 : 1.8}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconWrap : undefined}>
              <UserCircle
                size={22}
                color={color}
                strokeWidth={focused ? 2.2 : 1.8}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeIconWrap: {
    backgroundColor: Colors.primaryMuted,
    borderRadius: 12,
    padding: 6,
  },
  scanIcon: {
    padding: 6,
  },
  scanIconActive: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    padding: 8,
    marginTop: -8,
    ...Shadows.glow,
  },
});
