import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const { signInWithGoogle, signInAsGuest, isConfigured } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* App Logo / Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.iconCircle}>
            <Text style={styles.bookEmoji}>📖</Text>
          </View>
          <Text style={styles.appTitle}>StudyApp</Text>
          <Text style={styles.appSubtitle}>Mobile Academic Library & Quiz Hub</Text>
          
          <View style={styles.badge}>
            <Ionicons name="school" size={12} color="#059669" />
            <Text style={styles.badgeText}>Student Portal • Grades 9–12</Text>
          </View>
        </View>

        {/* Features Preview */}
        <View style={styles.featuresCard}>
          <View style={styles.featureItem}>
            <Ionicons name="school-outline" size={20} color="#2563EB" />
            <Text style={styles.featureText}>Curated Notes across 4 Academic Grades</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="help-circle-outline" size={20} color="#9333EA" />
            <Text style={styles.featureText}>Self-Grading Quizzes with Explanations</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="cloud-offline-outline" size={20} color="#059669" />
            <Text style={styles.featureText}>Offline-First: Study without Internet</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="phone-portrait-outline" size={20} color="#4F46E5" />
            <Text style={styles.featureText}>Standalone Native Android App</Text>
          </View>
        </View>

        {/* Sign In Options */}
        <View style={styles.authActions}>
          {/* Primary Instant Student Login */}
          <TouchableOpacity
            style={styles.guestBtn}
            activeOpacity={0.85}
            onPress={signInAsGuest}
          >
            <Ionicons name="arrow-forward-circle" size={20} color="#FFFFFF" />
            <Text style={styles.guestBtnText}>Continue as Student (Instant Access)</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Secondary Google Login */}
          <TouchableOpacity
            style={styles.googleBtn}
            activeOpacity={0.85}
            onPress={signInWithGoogle}
          >
            <Ionicons name="logo-google" size={18} color="#EA4335" />
            <Text style={styles.googleBtnText}>Sign In with Google</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerNote}>
          Free, read-only educational library. No registration required.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  heroCard: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
  },
  bookEmoji: {
    fontSize: 34,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  featuresCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    gap: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  authActions: {
    width: '100%',
    gap: 12,
  },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#2563EB',
    paddingVertical: 15,
    borderRadius: 14,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  guestBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    borderRadius: 14,
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  footerNote: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 24,
  },
});
