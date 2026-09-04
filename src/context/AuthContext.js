import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';

// Required for expo-auth-session to work with redirects
WebBrowser.maybeCompleteAuthSession();

// ── Config ────────────────────────────────────────────────────────────────────
const GOOGLE_CLIENT_ID = '840343648380-p6bhcck8m3npk6o1cs98508rnlvs6iin.apps.googleusercontent.com';

const USERS_KEY = '@studyapp_users';
const SESSION_KEY = '@studyapp_session';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState(null);

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'study-app',
    path: 'redirect',
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Token,
      redirectUri,
    },
    discovery
  );

  // Restore session on mount
  useEffect(() => {
    async function restoreSession() {
      try {
        const session = await AsyncStorage.getItem(SESSION_KEY);
        if (session) setUser(JSON.parse(session));
      } catch (e) {
        console.error('Session restore error:', e);
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  // Handle Google auth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { access_token } = response.params;
      fetchGoogleUser(access_token);
    } else if (response?.type === 'error') {
      setError('Google sign in failed. Please try again.');
      setSigningIn(false);
    } else if (response?.type === 'dismiss') {
      setSigningIn(false);
    }
  }, [response]);

  const fetchGoogleUser = async (accessToken) => {
    try {
      const res = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const googleUser = await res.json();
      const sessionUser = {
        uid: googleUser.id,
        email: googleUser.email,
        displayName: googleUser.name,
        photoUrl: googleUser.picture,
        provider: 'google',
      };
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
      setUser(sessionUser);
      setError(null);
    } catch (e) {
      setError('Failed to get user info from Google.');
    } finally {
      setSigningIn(false);
    }
  };

  const signInWithGoogle = async () => {
    setSigningIn(true);
    setError(null);
    await promptAsync();
  };

  // ── Local email/password auth ─────────────────────────────────────────────
  const getUsers = async () => {
    try {
      const data = await AsyncStorage.getItem(USERS_KEY);
      return data ? JSON.parse(data) : {};
    } catch { return {}; }
  };

  const saveUsers = async (users) => {
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
  };

  const hashPassword = (password) => {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  };

  const signUp = async (email, password, name) => {
    setSigningIn(true);
    setError(null);
    try {
      if (!email.trim() || !password.trim()) { setError('Email and password are required.'); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
      const users = await getUsers();
      const emailKey = email.toLowerCase().trim();
      if (users[emailKey]) { setError('An account with this email already exists.'); return; }
      const newUser = {
        uid: Date.now().toString(),
        email: emailKey,
        displayName: name || email.split('@')[0],
        createdAt: new Date().toISOString(),
        passwordHash: hashPassword(password),
      };
      users[emailKey] = newUser;
      await saveUsers(users);
      const sessionUser = { uid: newUser.uid, email: newUser.email, displayName: newUser.displayName };
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
      setUser(sessionUser);
    } catch (e) {
      setError('Sign up failed. Please try again.');
    } finally {
      setSigningIn(false);
    }
  };

  const signIn = async (email, password) => {
    setSigningIn(true);
    setError(null);
    try {
      if (!email.trim() || !password.trim()) { setError('Email and password are required.'); return; }
      const users = await getUsers();
      const emailKey = email.toLowerCase().trim();
      const storedUser = users[emailKey];
      if (!storedUser || storedUser.passwordHash !== hashPassword(password)) {
        setError('Invalid email or password.');
        return;
      }
      const sessionUser = { uid: storedUser.uid, email: storedUser.email, displayName: storedUser.displayName };
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
      setUser(sessionUser);
    } catch (e) {
      setError('Sign in failed. Please try again.');
    } finally {
      setSigningIn(false);
    }
  };

  const signOutUser = async () => {
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
      setUser(null);
    } catch (e) {
      console.error('Sign out error:', e);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{
      user, loading, signingIn, error,
      signIn, signUp, signOutUser, clearError,
      signInWithGoogle, googleRequest: request,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export default AuthContext;
