import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

const STORAGE_KEY_USER = 'studyapp_mobile_user';
const STORAGE_KEY_GOOGLE_CLIENT_ID = 'studyapp_google_client_id_mobile';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [googleClientId, setGoogleClientId] = useState('');

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: googleClientId || undefined,
    iosClientId: googleClientId || undefined,
    webClientId: googleClientId || undefined,
  });

  useEffect(() => {
    loadStoredSession();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        fetchGoogleUserProfile(authentication.accessToken);
      }
    }
  }, [response]);

  async function loadStoredSession() {
    try {
      const [storedUser, storedClientId] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_USER),
        AsyncStorage.getItem(STORAGE_KEY_GOOGLE_CLIENT_ID),
      ]);

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      if (storedClientId) {
        setGoogleClientId(storedClientId);
      }
    } catch (err) {
      console.warn('Error loading auth session:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchGoogleUserProfile(token) {
    try {
      const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profile = await res.json();
      const userData = {
        name: profile.name || (profile.email ? profile.email.split('@')[0] : 'Student'),
        email: profile.email || 'student@gmail.com',
        picture: profile.picture || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(profile.email || 'student'),
        isGuest: false,
        signedInAt: new Date().toISOString(),
      };
      await saveSession(userData);
    } catch (err) {
      console.error('Failed to fetch Google profile:', err);
    }
  }

  async function signInWithGoogle() {
    if (promptAsync) {
      return promptAsync();
    }
  }

  async function signInAsGuest() {
    const guestUser = {
      name: 'Student Guest',
      email: 'student@studyapp.local',
      picture: 'https://api.dicebear.com/7.x/bottts/svg?seed=guest-student',
      isGuest: true,
      signedInAt: new Date().toISOString(),
    };
    await saveSession(guestUser);
  }

  async function saveSession(userData) {
    setUser(userData);
    await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userData));
  }

  async function signOut() {
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEY_USER);
  }

  async function updateGoogleClientId(newId) {
    const clean = (newId || '').trim();
    setGoogleClientId(clean);
    await AsyncStorage.setItem(STORAGE_KEY_GOOGLE_CLIENT_ID, clean);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        googleClientId,
        signInWithGoogle,
        signInAsGuest,
        signOut,
        updateGoogleClientId,
        isConfigured: !!googleClientId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
