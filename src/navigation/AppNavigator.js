import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../context/AuthContext';

// ── Screens ───────────────────────────────────────────────────────────────────
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import LibraryScreen from '../screens/LibraryScreen';
import TextbookReaderScreen from '../screens/TextbookReaderScreen';
import TodoScreen from '../screens/TodoScreen';

const COLORS = {
  primary: '#4A90E2',
  background: '#F8F9FA',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E9ECEF',
  inactive: '#ADB5BD',
  white: '#FFFFFF',
};

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const stackScreenOptions = {
  headerStyle: { backgroundColor: COLORS.primary },
  headerTintColor: COLORS.white,
  headerTitleStyle: { fontWeight: '700', fontSize: 18 },
  contentStyle: { backgroundColor: COLORS.background },
};

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Study App' }} />
    </Stack.Navigator>
  );
}

function LibraryStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Library" component={LibraryScreen} options={{ title: 'Library' }} />
      <Stack.Screen name="TextbookReader" component={TextbookReaderScreen} options={{ title: 'Reader' }} />
    </Stack.Navigator>
  );
}

function TodoStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Todos" component={TodoScreen} options={{ title: 'My Tasks' }} />
    </Stack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarStyle: {
          backgroundColor: COLORS.tabBar,
          borderTopColor: COLORS.tabBarBorder,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 4,
          height: 62,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            HomeTab: focused ? 'home' : 'home-outline',
            LibraryTab: focused ? 'library' : 'library-outline',
            TodoTab: focused ? 'checkmark-circle' : 'checkmark-circle-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="LibraryTab" component={LibraryStack} options={{ tabBarLabel: 'Library' }} />
      <Tab.Screen name="TodoTab" component={TodoStack} options={{ tabBarLabel: 'Tasks' }} />
    </Tab.Navigator>
  );
}

// ── Auth gate ─────────────────────────────────────────────────────────────────
function AuthGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
      </Stack.Navigator>
    );
  }

  return <TabNavigator />;
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <AuthGate />
    </NavigationContainer>
  );
}
