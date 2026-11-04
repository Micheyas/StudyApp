import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY_API = 'studyapp_mobile_api_url';
const STORAGE_KEY_CACHE_LIBRARY = 'studyapp_cache_library';
const STORAGE_KEY_CACHE_NOTES = 'studyapp_cache_notes';
const STORAGE_KEY_CACHE_QUIZZES = 'studyapp_cache_quizzes';

// Default host: Android emulator uses 10.0.2.2, iOS simulator uses localhost
const DEFAULT_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001';

export async function getApiBaseUrl() {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY_API);
    return saved || DEFAULT_URL;
  } catch {
    return DEFAULT_URL;
  }
}

export async function setApiBaseUrl(url) {
  const clean = (url || '').trim().replace(/\/+$/, '');
  await AsyncStorage.setItem(STORAGE_KEY_API, clean);
  return clean;
}

// Fetch helper with timeout
async function request(endpoint, options = {}) {
  const base = await getApiBaseUrl();
  const url = `${base}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// ── Stats ─────────────────────────────────────────────────────────────
export async function fetchStats() {
  return request('/api/stats');
}

// ── Academic Library (4 Grades) ─────────────────────────────────────────
export async function fetchLibrary() {
  try {
    const data = await request('/api/library/grades');
    if (data && data.grades) {
      await AsyncStorage.setItem(STORAGE_KEY_CACHE_LIBRARY, JSON.stringify(data.grades));
      return { grades: data.grades, fromCache: false };
    }
  } catch (err) {
    const cached = await AsyncStorage.getItem(STORAGE_KEY_CACHE_LIBRARY);
    if (cached) {
      return { grades: JSON.parse(cached), fromCache: true };
    }
    throw err;
  }
}

// ── Notes ─────────────────────────────────────────────────────────────
export async function fetchNotes(search = '') {
  try {
    const endpoint = search ? `/api/notes?search=${encodeURIComponent(search)}` : '/api/notes';
    const data = await request(endpoint);
    if (data && data.notes) {
      if (!search) {
        await AsyncStorage.setItem(STORAGE_KEY_CACHE_NOTES, JSON.stringify(data.notes));
      }
      return { notes: data.notes, fromCache: false };
    }
  } catch (err) {
    const cached = await AsyncStorage.getItem(STORAGE_KEY_CACHE_NOTES);
    if (cached) {
      let notes = JSON.parse(cached);
      if (search) {
        const q = search.toLowerCase();
        notes = notes.filter(
          n =>
            (n.title && n.title.toLowerCase().includes(q)) ||
            (n.content && n.content.toLowerCase().includes(q)) ||
            (n.subject && n.subject.toLowerCase().includes(q))
        );
      }
      return { notes, fromCache: true };
    }
    throw err;
  }
}

// ── Quizzes ────────────────────────────────────────────────────────────
export async function fetchQuizzes() {
  try {
    const data = await request('/api/quizzes');
    if (data && data.quizzes) {
      await AsyncStorage.setItem(STORAGE_KEY_CACHE_QUIZZES, JSON.stringify(data.quizzes));
      return { quizzes: data.quizzes, fromCache: false };
    }
  } catch (err) {
    const cached = await AsyncStorage.getItem(STORAGE_KEY_CACHE_QUIZZES);
    if (cached) {
      return { quizzes: JSON.parse(cached), fromCache: true };
    }
    throw err;
  }
}

export async function fetchQuizDetails(quizId) {
  return request(`/api/quizzes/${quizId}?mode=take`);
}

export async function submitQuiz(quizId, answers) {
  return request(`/api/quizzes/${quizId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
}

export async function submitLibraryGradeQuiz(gradeId, quizId, answers) {
  return request(`/api/library/grades/${gradeId}/quizzes/${quizId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
}

// ── Offline Sync: Pre-cache all content for offline reading ────────────
export async function syncAllContentForOffline() {
  const [libRes, notesRes, quizzesRes] = await Promise.all([
    fetchLibrary(),
    fetchNotes(),
    fetchQuizzes(),
  ]);

  return {
    gradesCount: (libRes?.grades || []).length,
    notesCount: (notesRes?.notes || []).length,
    quizzesCount: (quizzesRes?.quizzes || []).length,
    timestamp: new Date().toISOString(),
  };
}
