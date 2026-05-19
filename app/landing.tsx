import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../src/constants';
import { useNav } from '../src/hooks/useNav';

const { width } = Dimensions.get('window');

export default function LandingScreen() {
  const nav = useNav();

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top decorative band */}
      <View style={styles.topBand} />

      <View style={styles.container}>
        {/* Logo mark */}
        <View style={styles.logoWrap}>
          <View style={styles.logoOuter}>
            <View style={styles.logoInner}>
              <Text style={styles.logoText}>S</Text>
            </View>
          </View>
        </View>

        {/* Brand name */}
        <View style={styles.brandWrap}>
          <Text style={styles.brandName}>SOCOBOS</Text>
          <View style={styles.brandDivider} />
          <Text style={styles.brandSub}>Property Management</Text>
        </View>

        {/* Tagline */}
        <Text style={styles.tagline}>
          Rooms. Billing. Payments.{'\n'}All in one place.
        </Text>

        {/* Feature pills */}
        <View style={styles.pills}>
          {['Room Tracking', 'Auto Billing', 'Payment Records'].map((f) => (
            <View key={f} style={styles.pill}>
              <Text style={styles.pillText}>{f}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bottom CTA */}
      <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.ctaBtn}
          onPress={() => nav.push('/auth' as any, 'Loading...')}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>Enter</Text>
          <Text style={styles.ctaArrow}>→</Text>
        </TouchableOpacity>
        <Text style={styles.version}>v1.0  ·  Socobos MS</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  topBand: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    backgroundColor: COLORS.accent,
  },
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 28,
  },
  logoWrap: { alignItems: 'center' },
  logoOuter: {
    width: 96, height: 96, borderRadius: 28,
    borderWidth: 1.5, borderColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  logoInner: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 36, fontWeight: '800', color: COLORS.primary },
  brandWrap: { alignItems: 'center', gap: 8 },
  brandName: {
    fontSize: 30, fontWeight: '800', color: '#FFFFFF',
    letterSpacing: 8,
  },
  brandDivider: {
    width: 32, height: 1.5, backgroundColor: COLORS.accent,
  },
  brandSub: {
    fontSize: 12, fontWeight: '500', color: COLORS.accent,
    letterSpacing: 3, textTransform: 'uppercase',
  },
  tagline: {
    fontSize: 16, color: 'rgba(255,255,255,0.55)',
    textAlign: 'center', lineHeight: 26, fontWeight: '400',
  },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  pill: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 99, borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.35)',
    backgroundColor: 'rgba(201,168,76,0.08)',
  },
  pillText: { fontSize: 12, color: COLORS.accent, fontWeight: '500', letterSpacing: 0.5 },
  bottom: {
    paddingHorizontal: 32, paddingBottom: 40, gap: 16, alignItems: 'center',
  },
  ctaBtn: {
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.accent, borderRadius: 14,
    paddingVertical: 18, gap: 10,
  },
  ctaText: { fontSize: 16, fontWeight: '700', color: COLORS.primary, letterSpacing: 1 },
  ctaArrow: { fontSize: 18, color: COLORS.primary, fontWeight: '700' },
  version: { fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: 1 },
});
