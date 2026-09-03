import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Initial State ─────────────────────────────────────────────────────────────
const initialState = {
  library: [],
  settings: {
    serverUrl: 'https://studyapp-ym4e.onrender.com',
    theme: 'light',
    userName: '',
  },
  isLoading: false,
  error: null,
};

// ── Action Types ──────────────────────────────────────────────────────────────
export const ACTIONS = {
  ADD_LIBRARY_ITEM: 'ADD_LIBRARY_ITEM',
  UPDATE_LIBRARY_ITEM: 'UPDATE_LIBRARY_ITEM',
  DELETE_LIBRARY_ITEM: 'DELETE_LIBRARY_ITEM',
  SET_LIBRARY: 'SET_LIBRARY',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  HYDRATE: 'HYDRATE',
};

// ── Reducer ───────────────────────────────────────────────────────────────────
function appReducer(state, action) {
  switch (action.type) {
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
    case ACTIONS.UPDATE_SETTINGS:
      return { ...state, settings: { ...state.settings, ...action.payload } };
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
  LIBRARY: '@studyapp_library',
  SETTINGS: '@studyapp_settings',
};

// ── Context & Provider ────────────────────────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Hydrate from AsyncStorage on mount
  useEffect(() => {
    async function hydrate() {
      try {
        const [library, settings] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.LIBRARY),
          AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
        ]);
        dispatch({
          type: ACTIONS.HYDRATE,
          payload: {
            library: library ? JSON.parse(library) : [],
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

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.LIBRARY, JSON.stringify(state.library)).catch(console.error);
  }, [state.library]);

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
