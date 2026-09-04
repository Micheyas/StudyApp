import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyDtvqWH46XTXbdzFf6_iANvn5KnyOJ5qiI',
  authDomain: 'studyapp-fd932.firebaseapp.com',
  projectId: 'studyapp-fd932',
  storageBucket: 'studyapp-fd932.firebasestorage.app',
  messagingSenderId: '1013108908488',
  appId: '1:1013108908488:android:4d2053b133fb8950f560fd',
};

// Prevent duplicate initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use AsyncStorage for auth persistence (required for React Native)
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // Already initialized
  const { getAuth } = require('firebase/auth');
  auth = getAuth(app);
}

export { auth };
export default app;
