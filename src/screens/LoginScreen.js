import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Image,
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
};

export default function LoginScreen() {
  const { signInWithGoogle, signingIn, error } = useAuth();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.logoContainer}>
          <Ionicons name="school" size={64} color={COLORS.primary} />
        </View>
        <Text style={styles.appName}>StudyApp</Text>
        <Text style={styles.tagline}>Your personal study companion</Text>
      </View>

      {/* Features */}
      <View style={styles.features}>
        <FeatureRow icon="library" text="Organize your study materials" />
        <FeatureRow icon="book" text="Read textbooks and articles" />
        <FeatureRow icon="checkmark-circle" text="Track your tasks with smart alarms" />
      </View>

      {/* Sign in */}
      <View style={styles.signInSection}>
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.googleBtn, signingIn && styles.googleBtnDisabled]}
          onPress={signInWithGoogle}
          disabled={signingIn}
          activeOpacity={0.85}
        >
          {signingIn ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="logo-google" size={22} color="#fff" />
          )}
          <Text style={styles.googleBtnText}>
            {signingIn ? 'Signing in…' : 'Continue with Google'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By continuing, you agree to our terms of service. Your data is stored securely.
        </Text>
      </View>
    </View>
  );
}

function FeatureRow({ icon, text }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={20} color={COLORS.primary} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  hero: { alignItems: 'center', marginBottom: 40 },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: { fontSize: 32, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  tagline: { fontSize: 16, color: COLORS.textLight, textAlign: 'center' },
  features: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureText: { fontSize: 15, color: COLORS.text, fontWeight: '500', flex: 1 },
  signInSection: { alignItems: 'center' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.danger + '15',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    width: '100%',
  },
  errorText: { flex: 1, fontSize: 13, color: COLORS.danger },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  googleBtnDisabled: { opacity: 0.7 },
  googleBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  disclaimer: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});
