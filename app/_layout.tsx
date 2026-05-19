import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useRef } from 'react';
import { NavigationLoadingProvider } from '../context/NavigationLoadingContext';
import { auth } from '../firebase/config';
import { initStores } from '../store';

export default function RootLayout() {
  const unsubStoresRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Listen to Firebase Auth state
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User just logged in — start Firestore listeners now (auth is ready)
        if (!unsubStoresRef.current) {
          unsubStoresRef.current = initStores();
        }
        router.replace('/home' as any);
      } else {
        // User logged out — stop Firestore listeners to avoid permission errors
        unsubStoresRef.current?.();
        unsubStoresRef.current = null;
        router.replace('/landing' as any);
      }
    });

    return () => {
      unsubAuth();
      unsubStoresRef.current?.();
    };
  }, []);

  return (
    <NavigationLoadingProvider>
      <StatusBar style="light" backgroundColor="#208AEF" />
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
        <Stack.Screen name="admin" />
      </Stack>
    </NavigationLoadingProvider>
  );
}
