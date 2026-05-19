import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants';

interface PageLoaderProps {
  message?: string;
  visible?: boolean;
}

export function PageLoader({ message = 'Loading...', visible = true }: PageLoaderProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <View style={styles.card}>
        <View style={styles.logoMark}>
          <Text style={styles.logoText}>S</Text>
        </View>
        <ActivityIndicator size="small" color={COLORS.accent} style={styles.spinner} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,18,33,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  card: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 32,
    paddingHorizontal: 40,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
    minWidth: 160,
  },
  logoMark: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 22, fontWeight: '800', color: COLORS.accent },
  spinner: { marginTop: 2 },
  message: {
    fontSize: 13, color: COLORS.textSecondary,
    fontWeight: '500', textAlign: 'center',
  },
});
