import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './src/context/AuthContext';

import LoginScreen from './src/screens/LoginScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import NotesScreen from './src/screens/NotesScreen';
import QuizzesScreen from './src/screens/QuizzesScreen';
import SettingsScreen from './src/screens/SettingsScreen';

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('library');

  if (loading) {
    return (
      <View style={styles.splashCenter}>
        <View style={styles.splashIconBox}>
          <Text style={styles.splashEmoji}>📖</Text>
        </View>
        <Text style={styles.splashTitle}>StudyApp</Text>
        <ActivityIndicator size="small" color="#2563EB" style={{ marginTop: 12 }} />
      </View>
    );
  }

  // Not logged in: show Login Screen
  if (!user) {
    return <LoginScreen />;
  }

  // Logged in: Main App with Bottom Navigation
  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="dark" />

      {/* Top Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerLogo}>
            <Text style={{ fontSize: 16 }}>📖</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>StudyApp</Text>
            <Text style={styles.headerSubtitle}>
              {activeTab === 'library' && 'Academic Library'}
              {activeTab === 'notes' && 'Curated Notes'}
              {activeTab === 'quizzes' && 'Practice Quizzes'}
              {activeTab === 'settings' && 'App Settings & Updates'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.onlinePill}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Mobile</Text>
          </View>
        </View>
      </View>

      {/* Screen Body */}
      <View style={styles.screenContainer}>
        {activeTab === 'library' && <LibraryScreen />}
        {activeTab === 'notes' && <NotesScreen />}
        {activeTab === 'quizzes' && <QuizzesScreen />}
        {activeTab === 'settings' && <SettingsScreen />}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => setActiveTab('library')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'library' ? 'school' : 'school-outline'}
            size={22}
            color={activeTab === 'library' ? '#2563EB' : '#94A3B8'}
          />
          <Text style={[styles.tabLabel, activeTab === 'library' && styles.tabLabelActive]}>
            Library
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => setActiveTab('notes')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'notes' ? 'document-text' : 'document-text-outline'}
            size={22}
            color={activeTab === 'notes' ? '#2563EB' : '#94A3B8'}
          />
          <Text style={[styles.tabLabel, activeTab === 'notes' && styles.tabLabelActive]}>
            Notes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => setActiveTab('quizzes')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'quizzes' ? 'help-circle' : 'help-circle-outline'}
            size={22}
            color={activeTab === 'quizzes' ? '#2563EB' : '#94A3B8'}
          />
          <Text style={[styles.tabLabel, activeTab === 'quizzes' && styles.tabLabelActive]}>
            Quizzes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => setActiveTab('settings')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={activeTab === 'settings' ? 'settings' : 'settings-outline'}
            size={22}
            color={activeTab === 'settings' ? '#2563EB' : '#94A3B8'}
          />
          <Text style={[styles.tabLabel, activeTab === 'settings' && styles.tabLabelActive]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  splashCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  splashIconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  splashEmoji: {
    fontSize: 32,
  },
  splashTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogo: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  onlineText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabLabelActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
});
