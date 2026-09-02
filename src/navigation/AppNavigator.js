import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// ── Screens ───────────────────────────────────────────────────────────────────
import HomeScreen from '../screens/HomeScreen';
import LibraryScreen from '../screens/LibraryScreen';
import NotesScreen from '../screens/NotesScreen';
import NoteEditorScreen from '../screens/NoteEditorScreen';
import QuizScreen from '../screens/QuizScreen';
import QuizResultScreen from '../screens/QuizResultScreen';
import TextbookReaderScreen from '../screens/TextbookReaderScreen';
import AIAssistantScreen from '../screens/AIAssistantScreen';

// ── Theme ─────────────────────────────────────────────────────────────────────
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

// ── Stack navigators for each tab ─────────────────────────────────────────────

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
      <Stack.Screen
        name="TextbookReader"
        component={TextbookReaderScreen}
        options={{ title: 'Reader' }}
      />
    </Stack.Navigator>
  );
}

function NotesStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Notes" component={NotesScreen} options={{ title: 'My Notes' }} />
      <Stack.Screen
        name="NoteEditor"
        component={NoteEditorScreen}
        options={({ route }) => ({
          title: route.params?.noteId ? 'Edit Note' : 'New Note',
        })}
      />
    </Stack.Navigator>
  );
}

function QuizStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Quiz" component={QuizScreen} options={{ title: 'Quizzes' }} />
      <Stack.Screen
        name="QuizResult"
        component={QuizResultScreen}
        options={{ title: 'Results', headerBackVisible: false }}
      />
    </Stack.Navigator>
  );
}

function AIStack() {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="AIAssistant"
        component={AIAssistantScreen}
        options={{ title: 'AI Assistant' }}
      />
    </Stack.Navigator>
  );
}

// ── Shared stack screen options ───────────────────────────────────────────────
const stackScreenOptions = {
  headerStyle: { backgroundColor: COLORS.primary },
  headerTintColor: COLORS.white,
  headerTitleStyle: { fontWeight: '700', fontSize: 18 },
  contentStyle: { backgroundColor: COLORS.background },
};

// ── Bottom Tab Navigator ──────────────────────────────────────────────────────
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
            NotesTab: focused ? 'document-text' : 'document-text-outline',
            QuizTab: focused ? 'checkmark-circle' : 'checkmark-circle-outline',
            AITab: focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="LibraryTab" component={LibraryStack} options={{ tabBarLabel: 'Library' }} />
      <Tab.Screen name="NotesTab" component={NotesStack} options={{ tabBarLabel: 'Notes' }} />
      <Tab.Screen name="QuizTab" component={QuizStack} options={{ tabBarLabel: 'Quiz' }} />
      <Tab.Screen name="AITab" component={AIStack} options={{ tabBarLabel: 'AI Help' }} />
    </Tab.Navigator>
  );
}

// ── Root Navigator ────────────────────────────────────────────────────────────
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  );
}
