require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const notesRouter = require('./routes/notes');
const quizzesRouter = require('./routes/quizzes');
const libraryRouter = require('./routes/library');
const db = require('./db/storage');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN && process.env.ALLOWED_ORIGIN !== '*' ? process.env.ALLOWED_ORIGIN : '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// ── Static Web Frontend ───────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Auth Config (Google Client ID) ────────────────────────────────────────────
app.get('/api/auth/config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  });
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    readOnly: true,
    timestamp: new Date().toISOString(),
  });
});

// ── API Overview & Stats ──────────────────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  const notes = db.read('notes');
  const quizzes = db.read('quizzes');
  const library = db.read('library');

  const uniqueSubjects = new Set([
    ...notes.map((n) => n.subject),
    ...quizzes.map((q) => q.topic),
  ]);

  res.json({
    readOnly: true,
    totalGrades: library.length,
    totalNotes: notes.length,
    totalQuizzes: quizzes.length,
    subjectsCount: uniqueSubjects.size,
    timestamp: new Date().toISOString(),
  });
});

// ── Version & Change Detection Endpoint ───────────────────────────────────────
app.get('/api/version', (req, res) => {
  const notes = db.read('notes');
  const quizzes = db.read('quizzes');
  const library = db.read('library');

  let latestMtime = 0;
  const DATA_DIR = path.join(__dirname, 'data');
  ['notes.json', 'quizzes.json', 'library.json'].forEach((file) => {
    try {
      const p = path.join(DATA_DIR, file);
      if (fs.existsSync(p)) {
        const stat = fs.statSync(p);
        if (stat.mtimeMs > latestMtime) latestMtime = stat.mtimeMs;
      }
    } catch (_) {}
  });

  const contentHash = `v1-${Math.floor(latestMtime)}-n${notes.length}-q${quizzes.length}-g${library.length}`;

  res.json({
    version: '1.1.0',
    contentHash,
    lastModified: new Date(latestMtime || Date.now()).toISOString(),
    totalNotes: notes.length,
    totalQuizzes: quizzes.length,
    totalGrades: library.length,
    timestamp: new Date().toISOString(),
  });
});

// ── Resource Routes (Read-Only) ───────────────────────────────────────────────
app.use('/api/library', libraryRouter);
app.use('/api/notes', notesRouter);
app.use('/api/quizzes', quizzesRouter);

// Fallback to index.html for frontend routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── 404 Handler for API ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🔒 StudyApp Portal & API running on http://localhost:${PORT}`);
  console.log(`   Web App:         http://localhost:${PORT}`);
  console.log(`   Health check:    http://localhost:${PORT}/health`);
  console.log(`   Overview & Stats: http://localhost:${PORT}/api/stats`);
  console.log(`   Library API:     http://localhost:${PORT}/api/library (4 grades with Notes & Quizzes)`);
  console.log(`   Notes API:       http://localhost:${PORT}/api/notes (read-only)`);
  console.log(`   Quizzes API:     http://localhost:${PORT}/api/quizzes (read-only)\n`);
});
