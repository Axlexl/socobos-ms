import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView, Platform, StyleSheet,
    Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiLogin } from '../src/api/client';
import { COLORS } from '../src/constants';
import { initStores } from '../src/store';

export default function AuthScreen() {
  const [password, setPassword] = useState('');
  const [hidden,   setHidden]   = useState(true);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleLogin() {
    if (!password.trim()) { setError('Password is required.'); return; }
    setError('');
    setLoading(true);
    try {
      await apiLogin(password.trim());
      await initStores();
      router.replace('/home' as any);
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (msg.includes('Incorrect')) {
        setError('Incorrect password. Please try again.');
      } else if (msg.includes('fetch') || msg.includes('Network')) {
        setError('Cannot reach server. Check your connection.');
      } else {
        setError('Login failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topAccent} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          {/* Logo */}
          <View style={styles.logoSection}>
            <View style={styles.logoOuter}>
              <View style={styles.logoInner}>
                <Text style={styles.logoText}>S</Text>
              </View>
            </View>
            <Text style={styles.brandName}>SOCOBOS</Text>
            <Text style={styles.brandSub}>Property Management</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSub}>Enter your password to access the dashboard</Text>

            <View style={styles.inputWrap}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setError(''); }}
                  secureTextEntry={hidden}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  autoFocus
                />
                <TouchableOpacity onPress={() => setHidden((h) => !h)} style={styles.eyeBtn} hitSlop={8}>
                  <Text style={styles.eyeText}>{hidden ? 'Show' : 'Hide'}</Text>
                </TouchableOpacity>
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.loginBtnText}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>© 2025 Socobos MS · All rights reserved</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.primary },
  topAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: COLORS.accent },
  flex: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 28, gap: 32 },
  logoSection: { alignItems: 'center', gap: 10 },
  logoOuter: { width: 72, height: 72, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  logoInner: { width: 54, height: 54, borderRadius: 14, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 26, fontWeight: '800', color: COLORS.primary },
  brandName: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 6 },
  brandSub: { fontSize: 11, color: COLORS.accent, letterSpacing: 2.5, textTransform: 'uppercase', fontWeight: '500' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 24, gap: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 10 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  cardSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: -12, lineHeight: 20 },
  inputWrap: { gap: 6 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, letterSpacing: 0.5 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border },
  inputRowError: { borderColor: COLORS.danger },
  input: { flex: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: COLORS.textPrimary },
  eyeBtn: { paddingRight: 16 },
  eyeText: { fontSize: 13, color: COLORS.accent, fontWeight: '600' },
  errorText: { fontSize: 12, color: COLORS.danger, marginTop: 2 },
  loginBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  footer: { textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: 0.5 },
});
