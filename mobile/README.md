# StudyApp Mobile (React Native + Expo)

Dedicated cross-platform mobile app for **Android** and **iOS** designed for students to browse curated academic notes, practice self-grading quizzes, and study completely offline.

---

## Features

- 🔐 **Google Sign-In & Guest Mode**: Log in with Google or continue in 1-tap Guest demo mode. All accounts have read-only student permissions (no admin required).
- 🎓 **Academic Library (4 Grades)**: Grade 9, 10, 11, and 12 hubs with notes and practice quizzes.
- 📝 **Searchable Study Notes**: Instant keyword and topic search with clean monospace reading view.
- 🧠 **Self-Grading Quizzes**: Multiple choice question runner with instant scoring and explanations.
- 🔄 **In-App OTA Self-Update (`expo-updates`)**: Receive updates and improvements over-the-air without needing an app store or external installer.
- 📦 **Offline-First Cache**: Pre-download and cache all notes and quizzes to device storage (`AsyncStorage`) for studying without an internet connection.

---

## Quick Start (How to Run on Phone)

### 1. Install Dependencies
In your terminal, navigate to the `mobile` folder and install dependencies:

```bash
cd mobile
npm install
```

### 2. Start the Mobile App
```bash
npx expo start
```

### 3. Open on Your Phone
1. Install **Expo Go** from Google Play (Android) or the App Store (iOS).
2. Scan the QR code shown in your terminal using:
   - **Android**: Expo Go app camera/scanner.
   - **iOS**: iPhone Camera app $\rightarrow$ tap the Expo Go banner.

---

## Connecting to Backend API

By default, the mobile app looks for your server on:
- **Android Emulator**: `http://10.0.2.2:3001`
- **iOS Simulator / Localhost**: `http://localhost:3001`

**When testing on a real physical phone over Wi-Fi:**
1. Make sure your computer and phone are connected to the same Wi-Fi.
2. Find your computer's local IP address (e.g., `192.168.1.50`).
3. Inside the mobile app, go to the **Settings** tab and set the Backend Server URL to:
   ```
   http://192.168.1.50:3001
   ```
4. Tap **Save Settings** and tap **Sync All Content for Offline**. All notes and quizzes will be cached on your phone!

---

## In-App Self-Updates

The app includes `expo-updates` configured to check on app start:
- When code or design changes are published, the app fetches them silently in the background.
- Users can also tap **"Check for Updates Now"** in the Settings tab to trigger an instant check and reload.
