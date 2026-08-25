import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Alert } from 'react-native';
import { useCivicStore } from '../../lib/store';
import { TRANSLATIONS } from '../../types';

export default function TabsLayout() {
  const router = useRouter();
  const { user, isGuest, settings } = useCivicStore();
  const isDark = settings?.darkMode || false;
  const lang = settings?.language || 'EN';
  const t = TRANSLATIONS[lang] || TRANSLATIONS.EN;

  // Enforce Email Verification Requirement: Unverified users cannot access app tabs!
  useEffect(() => {
    if (user && !isGuest && !user.email_verified) {
      router.replace(`/(auth)/verify-email?email=${encodeURIComponent(user.email)}`);
    }
  }, [user, isGuest]);

  const handleGuestTabPress = (e: any, featureName: string) => {
    if (isGuest) {
      e.preventDefault();
      Alert.alert(
        'Sign In Required 🔒',
        `Guest users can only view the Home Map. Please sign in or create an account to ${featureName}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
          { text: 'Register', onPress: () => router.push('/(auth)/signup') },
        ]
      );
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? '#60a5fa' : '#2563eb',
        tabBarInactiveTintColor: isDark ? '#94a3b8' : '#64748b',
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 8,
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderTopWidth: 1,
          borderTopColor: isDark ? '#334155' : '#e2e8f0',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.35 : 0.08,
          shadowRadius: 12,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.homeMap,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'map' : 'map-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: t.createReport,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'add-circle' : 'add-circle-outline'}
              size={26}
              color={focused ? (isDark ? '#60a5fa' : '#2563eb') : (isDark ? '#94a3b8' : '#64748b')}
            />
          ),
        }}
        listeners={{
          tabPress: (e) => handleGuestTabPress(e, 'submit a report'),
        }}
      />
      <Tabs.Screen
        name="my-reports"
        options={{
          title: t.myReports,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'clipboard' : 'clipboard-outline'}
              size={size}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: (e) => handleGuestTabPress(e, 'view your reports'),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: t.messagesTab || 'Messages',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
              size={size}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: (e) => handleGuestTabPress(e, 'chat with municipal officials'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.profile,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={size}
              color={color}
            />
          ),
        }}
        listeners={{
          tabPress: (e) => handleGuestTabPress(e, 'view citizen profile'),
        }}
      />
    </Tabs>
  );
}
