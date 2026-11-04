import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import { useAuth } from '../context/AuthContext';
import { getApiBaseUrl, setApiBaseUrl, syncAllContentForOffline } from '../api/client';

export default function SettingsScreen() {
  const { user, signOut, googleClientId, updateGoogleClientId } = useAuth();

  const [apiUrl, setApiUrl] = useState('');
  const [clientIdInput, setClientIdInput] = useState('');
  const [savingUrl, setSavingUrl] = useState(false);

  // Self-Update State
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(null);

  // Offline Sync State
  const [syncingOffline, setSyncingOffline] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const currentUrl = await getApiBaseUrl();
    setApiUrl(currentUrl);
    setClientIdInput(googleClientId || '');
  }

  async function handleSaveSettings() {
    setSavingUrl(true);
    try {
      await setApiBaseUrl(apiUrl);
      await updateGoogleClientId(clientIdInput);
      Alert.alert('Saved', 'Backend and Auth settings have been saved successfully.');
    } catch (err) {
      Alert.alert('Error', 'Failed to save settings.');
    } finally {
      setSavingUrl(false);
    }
  }

  // ── In-App OTA Self-Update ──────────────────────────────────────────
  async function handleCheckForUpdate() {
    try {
      setCheckingUpdate(true);
      setUpdateStatus('Checking server for updates...');

      if (__DEV__) {
        setUpdateStatus('App is running in development mode. In-app updates activate in production builds.');
        return;
      }

      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        setUpdateStatus('Downloading new update...');
        await Updates.fetchUpdateAsync();
        setUpdateStatus('Update downloaded! Reloading app...');
        await Updates.reloadAsync();
      } else {
        setUpdateStatus('✓ App is already running the latest version!');
      }
    } catch (err) {
      setUpdateStatus(`Update check: ${err.message || 'Up to date'}`);
    } finally {
      setCheckingUpdate(false);
    }
  }

  // ── Offline Pre-Cache Sync ──────────────────────────────────────────
  async function handleOfflineSync() {
    try {
      setSyncingOffline(true);
      setSyncResult(null);
      const res = await syncAllContentForOffline();
      setSyncResult(res);
      Alert.alert(
        'Offline Cache Ready',
        `Successfully cached ${res.gradesCount} Grades, ${res.notesCount} Notes, and ${res.quizzesCount} Quizzes! You can now study completely offline.`
      );
    } catch (err) {
      Alert.alert('Sync Failed', 'Could not reach backend to sync. Check your Backend URL.');
    } finally {
      setSyncingOffline(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      
      {/* Student Profile Card */}
      <View style={styles.card}>
        <View style={styles.profileRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>{user?.isGuest ? '👤' : '🎓'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.name || 'Student'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'student@studyapp.local'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
                {user?.isGuest ? 'Demo Guest Mode' : 'Authenticated Student'} &bull; Read-Only
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
          <Ionicons name="log-out-outline" size={16} color="#DC2626" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* In-App Self-Update Section */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="sync-circle-outline" size={20} color="#4F46E5" />
          <Text style={styles.sectionTitle}>In-App OTA Self-Update</Text>
        </View>
        <Text style={styles.sectionDesc}>
          Update code and features directly inside the app over-the-air, without needing an app store or external installer.
        </Text>

        <TouchableOpacity
          style={styles.actionBtnBlue}
          onPress={handleCheckForUpdate}
          disabled={checkingUpdate}
        >
          {checkingUpdate ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="refresh-outline" size={16} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Check for Updates Now</Text>
            </>
          )}
        </TouchableOpacity>

        {updateStatus ? (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>{updateStatus}</Text>
          </View>
        ) : null}
      </View>

      {/* Offline Sync Section */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="cloud-download-outline" size={20} color="#059669" />
          <Text style={styles.sectionTitle}>Offline Study Cache</Text>
        </View>
        <Text style={styles.sectionDesc}>
          Pre-download and store all 4 grades, study notes, and quizzes into local device storage so you can study without internet.
        </Text>

        <TouchableOpacity
          style={styles.actionBtnGreen}
          onPress={handleOfflineSync}
          disabled={syncingOffline}
        >
          {syncingOffline ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="download-outline" size={16} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Sync All Content for Offline</Text>
            </>
          )}
        </TouchableOpacity>

        {syncResult ? (
          <View style={styles.syncBox}>
            <Text style={styles.syncText}>
              ✓ Cached: {syncResult.gradesCount} Grades, {syncResult.notesCount} Notes, {syncResult.quizzesCount} Quizzes
            </Text>
          </View>
        ) : null}
      </View>

      {/* Backend & Auth Configuration */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="server-outline" size={20} color="#2563EB" />
          <Text style={styles.sectionTitle}>Backend Connection</Text>
        </View>
        <Text style={styles.sectionDesc}>
          Set your backend server URL (e.g., your computer's Wi-Fi IP like <code>http://192.168.1.X:3001</code> or deployed URL).
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Backend Server URL</Text>
          <TextInput
            style={styles.textInput}
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder="http://192.168.1.X:3001"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Google OAuth Client ID (Optional)</Text>
          <TextInput
            style={styles.textInput}
            value={clientIdInput}
            onChangeText={setClientIdInput}
            placeholder="your-client-id.apps.googleusercontent.com"
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSaveSettings}
          disabled={savingUrl}
        >
          {savingUrl ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>Save Settings</Text>
          )}
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  userEmail: {
    fontSize: 12,
    color: '#64748B',
  },
  roleBadge: {
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  signOutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  actionBtnBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionBtnGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusText: {
    fontSize: 12,
    color: '#334155',
    textAlign: 'center',
  },
  syncBox: {
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  syncText: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '600',
    textAlign: 'center',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  saveBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
