import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDtvqWH46XTXbdzFf6_iANvn5KnyOJ5qiI',
  authDomain: 'studyapp-fd932.firebaseapp.com',
  projectId: 'studyapp-fd932',
  storageBucket: 'studyapp-fd932.firebasestorage.app',
  messagingSenderId: '1013108908488',
  appId: '1:1013108908488:android:4d2053b133fb8950f560fd',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
