import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { COLORS } from '../src/constants';
import { NavigationLoadingProvider } from '../src/context/NavigationLoadingContext';
import { isLoggedIn } from './auth';

export default function RootLayout() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    isLoggedIn().then((loggedIn) => {
      router.replace(loggedIn ? '/home' as any : '/landing' as any);
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <NavigationLoadingProvider>
      <StatusBar style="light" backgroundColor={COLORS.primary} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="landing" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="home" />
        <Stack.Screen name="rooms" />
        <Stack.Screen name="rooms/add" />
        <Stack.Screen name="rooms/[id]" />
        <Stack.Screen name="billing" />
        <Stack.Screen name="billing/generate" />
        <Stack.Screen name="payments" />
        <Stack.Screen name="past-records" />
        <Stack.Screen name="past-records/[id]" />
        <Stack.Screen name="rates" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="calendar" />
      </Stack>
    </NavigationLoadingProvider>
  );
}
