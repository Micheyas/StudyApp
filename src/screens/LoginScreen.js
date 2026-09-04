import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const COLORS = {
  primary: '#4A90E2',
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#2C3E50',
  textLight: '#7F8C8D',
  border: '#E9ECEF',
  danger: '#E74C3C',
  success: '#27AE60',
};

export default function LoginScreen() {
  const { signIn, signUp, signingIn, error, clearError, signInWithGoogle, googleRequest } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = () => {
    if (!email.trim() || !password.trim()) return;
    if (mode === 'login') {
      signIn(email.trim(), password);
    } else {
      signUp(email.trim(), password, name.trim());
    }
  };

  const switchMode = () => {
    clearError();
    setMode(mode === 'login' ? 'signup' : 'login');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.logoContainer}>
            <Ionicons name="school" size={56} color={COLORS.primary} />
          </View>
          <Text style={styles.appName}>StudyApp</Text>
          <Text style={styles.tagline}>Your personal study companion</Text>
        </View>

        {/* Form card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {mode === 'signup' && (
            <>
              <Text style={styles.label}>Your Name</Text>
              <View style={styles.inputRow}>
                <Ionicons name="person-outline" size={18} color={COLORS.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor={COLORS.textLight}
                  autoCapitalize="words"
                />
              </View>
            </>
          )}

          <Text style={styles.label}>Email</Text>
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={18} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={COLORS.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={COLORS.textLight}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, (signingIn || !email || !password) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={signingIn || !email || !password}
            activeOpacity={0.85}
          >
            {signingIn ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name={mode === 'login' ? 'log-in-outline' : 'person-add-outline'} size={20} color="#fff" />
            )}
            <Text style={styles.submitBtnText}>
              {signingIn ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchBtn} onPress={switchMode}>
            <Text style={styles.switchText}>
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <Text style={styles.switchLink}>
                {mode === 'login' ? 'Sign Up' : 'Sign In'}
              </Text>
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign In */}
          <TouchableOpacity
            style={[styles.googleBtn, (!googleRequest || signingIn) && styles.submitBtnDisabled]}
            onPress={signInWithGoogle}
            disabled={!googleRequest || signingIn}
            activeOpacity={0.85}
          >
            <Ionicons name="logo-google" size={20} color={COLORS.danger} />
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  hero: { alignItems: 'center', marginBottom: 32 },
  logoContainer: {
    width: 90, height: 90, borderRadius: 24,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  appName: { fontSize: 30, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  tagline: { fontSize: 15, color: COLORS.textLight },
  card: {
    backgroundColor: COLORS.card, borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 20 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.danger + '15', borderRadius: 10,
    padding: 12, marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 13, color: COLORS.danger },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 6, marginTop: 12 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 13, fontSize: 15, color: COLORS.text },
  eyeBtn: { padding: 4 },
  submitBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, marginTop: 24,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.6, shadowOpacity: 0 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  switchBtn: { alignItems: 'center', marginTop: 16 },
  switchText: { fontSize: 14, color: COLORS.textLight },
  switchLink: { color: COLORS.primary, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: 13, color: COLORS.textLight, marginHorizontal: 12 },
  googleBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.card, borderRadius: 14, padding: 14, marginTop: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  googleBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.text },
});
