import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Config ────────────────────────────────────────────────────────────────────
const DEFAULT_SERVER_URL = 'https://studyapp-ym4e.onrender.com';

async function getServerUrl() {
  try {
    const settings = await AsyncStorage.getItem('@studyapp_settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      return parsed.serverUrl || DEFAULT_SERVER_URL;
    }
  } catch (_) {}
  return DEFAULT_SERVER_URL;
}

// ── Shared fetch helper ───────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const baseUrl = await getServerUrl();
  const url = `${baseUrl}${path}`;

  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `Server error: ${response.status}`);
  }

  return response.json();
}

// ── API Functions ─────────────────────────────────────────────────────────────

/**
 * Check if the backend server is reachable.
 * @returns {Promise<boolean>}
 */
export async function checkServerHealth() {
  try {
    const baseUrl = await getServerUrl();
    const response = await fetch(`${baseUrl}/health`, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Send a chat message to the AI assistant.
 * @param {Array<{role: string, content: string}>} messages - Conversation history
 * @param {string} [context] - Optional study context (e.g., note content or textbook passage)
 * @returns {Promise<{role: string, content: string}>}
 */
export async function sendChatMessage(messages, context = null) {
  const data = await apiFetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ messages, context }),
  });
  return { role: data.role, content: data.content };
}

/**
 * Stream a chat response from the AI assistant.
 * Calls onChunk with each text chunk as it arrives, then calls onDone when finished.
 *
 * @param {Array<{role: string, content: string}>} messages
 * @param {string|null} context
 * @param {(chunk: string) => void} onChunk
 * @param {() => void} onDone
 * @param {(error: Error) => void} onError
 */
export async function streamChatMessage(messages, context, onChunk, onDone, onError) {
  try {
    const baseUrl = await getServerUrl();
    const response = await fetch(`${baseUrl}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, context }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.type === 'text') {
              onChunk(parsed.text);
            } else if (parsed.type === 'done') {
              onDone();
            } else if (parsed.type === 'error') {
              onError(new Error(parsed.error));
            }
          } catch (_) {
            // skip malformed SSE lines
          }
        }
      }
    }
  } catch (error) {
    onError(error);
  }
}

/**
 * Generate a quiz on a given topic using AI.
 * @param {string} topic
 * @param {number} [numQuestions=5]
 * @param {'easy'|'medium'|'hard'} [difficulty='medium']
 * @returns {Promise<{questions: Array, topic: string, difficulty: string}>}
 */
export async function generateQuiz(topic, numQuestions = 5, difficulty = 'medium') {
  return apiFetch('/api/quiz/generate', {
    method: 'POST',
    body: JSON.stringify({ topic, numQuestions, difficulty }),
  });
}

/**
 * Summarize a block of text using AI.
 * @param {string} text
 * @param {'brief'|'detailed'|'bullet-points'} [style='bullet-points']
 * @returns {Promise<{summary: string}>}
 */
export async function summarizeText(text, style = 'bullet-points') {
  return apiFetch('/api/summarize', {
    method: 'POST',
    body: JSON.stringify({ text, style }),
  });
}
