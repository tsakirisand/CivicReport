import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { subscribeToRealtimeReports } from '../lib/reports-service';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // ⚡ Initialize Realtime Supabase Sync for Citizen App
    const unsubscribeRealtime = subscribeToRealtimeReports();

    // Process deep link URL
    const handleDeepLink = (url: string | null) => {
      if (!url) return;

      const parsed = Linking.parse(url);
      const { hostname, path, queryParams } = parsed;

      const targetPath = path || hostname;
      const mode = queryParams?.mode ? String(queryParams.mode) : '';
      const oobCode = queryParams?.oobCode ? String(queryParams.oobCode) : '';
      const rawCode = queryParams?.code || queryParams?.token || queryParams?.oobCode;
      const code = rawCode ? String(rawCode) : '';
      const email = queryParams?.email ? String(queryParams.email) : '';

      if (targetPath === 'verify-email' || mode === 'verifyEmail') {
        router.push({
          pathname: '/(auth)/verify-email',
          params: { email, code },
        });
      } else if (targetPath === 'reset-password' || mode === 'resetPassword') {
        router.push({
          pathname: '/(auth)/reset-password',
          params: { email, code },
        });
      }
    };

    // Initial URL on startup
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // Event listener for incoming URLs while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
      unsubscribeRealtime();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
