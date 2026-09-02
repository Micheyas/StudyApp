import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Initial State ─────────────────────────────────────────────────────────────
const initialState = {
  // Notes
  notes: [],
  // Library (textbooks / study materials)
  library: [],
  // Quizzes
  quizzes: [],
  quizResults: [],
  // Settings
  settings: {
    serverUrl: 'http://localhost:3001',
    theme: 'light',
    userName: '',
  },
  // Loading flags
  isLoading: false,
  error: null,
};

// ── Action Types ──────────────────────────────────────────────────────────────
export const ACTIONS = {
  // Notes
  ADD_NOTE: 'ADD_NOTE',
  UPDATE_NOTE: 'UPDATE_NOTE',
  DELETE_NOTE: 'DELETE_NOTE',
  SET_NOTES: 'SET_NOTES',

  // Library
  ADD_LIBRARY_ITEM: 'ADD_LIBRARY_ITEM',
  UPDATE_LIBRARY_ITEM: 'UPDATE_LIBRARY_ITEM',
  DELETE_LIBRARY_ITEM: 'DELETE_LIBRARY_ITEM',
  SET_LIBRARY: 'SET_LIBRARY',

  // Quizzes
  ADD_QUIZ: 'ADD_QUIZ',
  DELETE_QUIZ: 'DELETE_QUIZ',
  SET_QUIZZES: 'SET_QUIZZES',
  ADD_QUIZ_RESULT: 'ADD_QUIZ_RESULT',
  SET_QUIZ_RESULTS: 'SET_QUIZ_RESULTS',

  // Settings
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',

  // Global
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  HYDRATE: 'HYDRATE',
};

// ── Reducer ───────────────────────────────────────────────────────────────────
function appReducer(state, action) {
  switch (action.type) {
    // ── Notes ──
    case ACTIONS.SET_NOTES:
      return { ...state, notes: action.payload };
    case ACTIONS.ADD_NOTE:
      return { ...state, notes: [action.payload, ...state.notes] };
    case ACTIONS.UPDATE_NOTE:
      return {
        ...state,
        notes: state.notes.map((n) =>
          n.id === action.payload.id ? { ...n, ...action.payload } : n
        ),
      };
    case ACTIONS.DELETE_NOTE:
      return { ...state, notes: state.notes.filter((n) => n.id !== action.payload) };

    // ── Library ──
    case ACTIONS.SET_LIBRARY:
      return { ...state, library: action.payload };
    case ACTIONS.ADD_LIBRARY_ITEM:
      return { ...state, library: [action.payload, ...state.library] };
    case ACTIONS.UPDATE_LIBRARY_ITEM:
      return {
        ...state,
        library: state.library.map((item) =>
          item.id === action.payload.id ? { ...item, ...action.payload } : item
        ),
      };
    case ACTIONS.DELETE_LIBRARY_ITEM:
      return { ...state, library: state.library.filter((item) => item.id !== action.payload) };

    // ── Quizzes ──
    case ACTIONS.SET_QUIZZES:
      return { ...state, quizzes: action.payload };
    case ACTIONS.ADD_QUIZ:
      return { ...state, quizzes: [action.payload, ...state.quizzes] };
    case ACTIONS.DELETE_QUIZ:
      return { ...state, quizzes: state.quizzes.filter((q) => q.id !== action.payload) };
    case ACTIONS.SET_QUIZ_RESULTS:
      return { ...state, quizResults: action.payload };
    case ACTIONS.ADD_QUIZ_RESULT:
      return { ...state, quizResults: [action.payload, ...state.quizResults] };

    // ── Settings ──
    case ACTIONS.UPDATE_SETTINGS:
      return { ...state, settings: { ...state.settings, ...action.payload } };

    // ── Global ──
    case ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };
    case ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    case ACTIONS.HYDRATE:
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

// ── Storage Keys ──────────────────────────────────────────────────────────────
const STORAGE_KEYS = {
  NOTES: '@studyapp_notes',
  LIBRARY: '@studyapp_library',
  QUIZZES: '@studyapp_quizzes',
  QUIZ_RESULTS: '@studyapp_quiz_results',
  SETTINGS: '@studyapp_settings',
};

// ── Context & Provider ────────────────────────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Hydrate state from AsyncStorage on mount
  useEffect(() => {
    async function hydrate() {
      try {
        const [notes, library, quizzes, quizResults, settings] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.NOTES),
          AsyncStorage.getItem(STORAGE_KEYS.LIBRARY),
          AsyncStorage.getItem(STORAGE_KEYS.QUIZZES),
          AsyncStorage.getItem(STORAGE_KEYS.QUIZ_RESULTS),
          AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
        ]);

        dispatch({
          type: ACTIONS.HYDRATE,
          payload: {
            notes: notes ? JSON.parse(notes) : [],
            library: library ? JSON.parse(library) : [],
            quizzes: quizzes ? JSON.parse(quizzes) : [],
            quizResults: quizResults ? JSON.parse(quizResults) : [],
            settings: settings
              ? { ...initialState.settings, ...JSON.parse(settings) }
              : initialState.settings,
          },
        });
      } catch (error) {
        console.error('Failed to hydrate state:', error);
      }
    }
    hydrate();
  }, []);

  // Persist notes whenever they change
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(state.notes)).catch(console.error);
  }, [state.notes]);

  // Persist library whenever it changes
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.LIBRARY, JSON.stringify(state.library)).catch(console.error);
  }, [state.library]);

  // Persist quizzes whenever they change
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(state.quizzes)).catch(console.error);
  }, [state.quizzes]);

  // Persist quiz results whenever they change
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.QUIZ_RESULTS, JSON.stringify(state.quizResults)).catch(console.error);
  }, [state.quizResults]);

  // Persist settings whenever they change
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings)).catch(console.error);
  }, [state.settings]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// ── Custom Hook ───────────────────────────────────────────────────────────────
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
