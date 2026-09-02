require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
}));
app.use(express.json());

// ── Anthropic client ──────────────────────────────────────────────────────────
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── AI Chat  ──────────────────────────────────────────────────────────────────
// POST /api/chat
// Body: { messages: [{role, content}], context?: string }
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, context } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    // Build system prompt with optional study context
    const systemPrompt = context
      ? `You are an expert study assistant. The student is currently studying the following material:\n\n${context}\n\nAnswer questions clearly and helpfully. Break down complex topics, give examples, and encourage the student.`
      : `You are an expert study assistant. Answer questions clearly and helpfully. Break down complex topics, give examples, and encourage the student.`;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    res.json({
      role: 'assistant',
      content: response.content[0].text,
      usage: response.usage,
    });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.status(500).json({ error: 'Failed to get AI response', details: error.message });
  }
});

// ── AI Streaming Chat ─────────────────────────────────────────────────────────
// POST /api/chat/stream
// Body: { messages: [{role, content}], context?: string }
// Returns: Server-Sent Events stream
app.post('/api/chat/stream', async (req, res) => {
  try {
    const { messages, context } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const systemPrompt = context
      ? `You are an expert study assistant. The student is currently studying the following material:\n\n${context}\n\nAnswer questions clearly and helpfully. Break down complex topics, give examples, and encourage the student.`
      : `You are an expert study assistant. Answer questions clearly and helpfully. Break down complex topics, give examples, and encourage the student.`;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = anthropic.messages.stream({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    stream.on('text', (text) => {
      res.write(`data: ${JSON.stringify({ type: 'text', text })}\n\n`);
    });

    stream.on('message', (message) => {
      res.write(`data: ${JSON.stringify({ type: 'done', usage: message.usage })}\n\n`);
      res.end();
    });

    stream.on('error', (error) => {
      console.error('Stream error:', error.message);
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
      res.end();
    });
  } catch (error) {
    console.error('Streaming setup error:', error.message);
    res.status(500).json({ error: 'Failed to start stream', details: error.message });
  }
});

// ── Generate Quiz ─────────────────────────────────────────────────────────────
// POST /api/quiz/generate
// Body: { topic: string, numQuestions?: number, difficulty?: 'easy'|'medium'|'hard' }
app.post('/api/quiz/generate', async (req, res) => {
  try {
    const { topic, numQuestions = 5, difficulty = 'medium' } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'topic is required' });
    }

    const prompt = `Generate ${numQuestions} multiple-choice quiz questions about "${topic}" at ${difficulty} difficulty.

Return ONLY a valid JSON array in this exact format, no other text:
[
  {
    "id": 1,
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0,
    "explanation": "Brief explanation of why this is correct."
  }
]

correctIndex is the 0-based index of the correct option in the options array.`;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = response.content[0].text.trim();

    // Extract JSON from the response (handle markdown code blocks)
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Failed to parse quiz JSON from AI response' });
    }

    const questions = JSON.parse(jsonMatch[0]);
    res.json({ questions, topic, difficulty });
  } catch (error) {
    console.error('Quiz generation error:', error.message);
    res.status(500).json({ error: 'Failed to generate quiz', details: error.message });
  }
});

// ── Summarize Text ────────────────────────────────────────────────────────────
// POST /api/summarize
// Body: { text: string, style?: 'brief'|'detailed'|'bullet-points' }
app.post('/api/summarize', async (req, res) => {
  try {
    const { text, style = 'bullet-points' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const styleInstructions = {
      brief: 'Write a concise 2-3 sentence summary.',
      detailed: 'Write a detailed paragraph summary covering all key points.',
      'bullet-points': 'Write a summary as a clear bullet-point list of the key ideas.',
    };

    const prompt = `${styleInstructions[style] || styleInstructions['bullet-points']}\n\nText to summarize:\n\n${text}`;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    res.json({ summary: response.content[0].text });
  } catch (error) {
    console.error('Summarize error:', error.message);
    res.status(500).json({ error: 'Failed to summarize text', details: error.message });
  }
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 StudyApp server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   API key set: ${process.env.ANTHROPIC_API_KEY ? '✓' : '✗ (missing!)'}\n`);
});
