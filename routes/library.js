const express = require('express');
const router = express.Router();
const db = require('../db/storage');

function normalizeId(str) {
  return String(str || '').toLowerCase().trim();
}

// Find a grade matching id, gradeNumber, level, or aliases
function resolveGrade(gradeId) {
  const library = db.read('library');
  const cleanId = normalizeId(gradeId);

  return library.find((g) => {
    if (normalizeId(g.id) === cleanId) return true;
    if (String(g.gradeNumber) === cleanId) return true;
    if (String(g.level) === cleanId) return true;
    if (normalizeId(g.name) === cleanId || normalizeId(g.name).replace(/\s+/g, '') === cleanId.replace(/\s+/g, '')) return true;
    if (Array.isArray(g.aliases) && g.aliases.map(normalizeId).includes(cleanId)) return true;
    return false;
  }) || null;
}

// GET /api/library - Library overview with all 4 grades
router.get('/', (req, res) => {
  const library = db.read('library');

  const overview = library.map((g) => ({
    id: g.id,
    name: g.name,
    displayName: g.displayName || g.name,
    gradeNumber: g.gradeNumber,
    level: g.level,
    description: g.description,
    subjects: g.subjects || [],
    noteCount: (g.notes || []).length,
    quizCount: (g.quizzes || []).length,
    notes: (g.notes || []).map((n) => ({
      id: n.id,
      title: n.title,
      subject: n.subject,
      summary: n.summary,
    })),
    quizzes: (g.quizzes || []).map((q) => ({
      id: q.id,
      title: q.title,
      topic: q.topic,
      difficulty: q.difficulty,
      questionCount: (q.questions || []).length,
    })),
  }));

  res.json({
    totalGrades: overview.length,
    description: 'StudyApp Library: 4 Grades with comprehensive Notes and Quizzes',
    grades: overview,
  });
});

// GET /api/library/grades - List all 4 grades with full details
router.get('/grades', (req, res) => {
  const library = db.read('library');
  res.json({
    count: library.length,
    grades: library,
  });
});

// GET /api/library/grades/:gradeId - Specific grade details
router.get('/grades/:gradeId', (req, res) => {
  const grade = resolveGrade(req.params.gradeId);
  if (!grade) {
    return res.status(404).json({
      error: `Grade '${req.params.gradeId}' not found. Available grades: Grade 9, Grade 10, Grade 11, Grade 12 (or 1, 2, 3, 4)`,
    });
  }
  res.json(grade);
});

// GET /api/library/grades/:gradeId/notes - Notes under a specific grade
router.get('/grades/:gradeId/notes', (req, res) => {
  const grade = resolveGrade(req.params.gradeId);
  if (!grade) {
    return res.status(404).json({ error: `Grade '${req.params.gradeId}' not found` });
  }

  const { search, subject } = req.query;
  let notes = grade.notes || [];

  if (subject) {
    notes = notes.filter((n) => n.subject && n.subject.toLowerCase() === subject.toLowerCase());
  }

  if (search) {
    const term = search.toLowerCase();
    notes = notes.filter(
      (n) =>
        (n.title && n.title.toLowerCase().includes(term)) ||
        (n.content && n.content.toLowerCase().includes(term))
    );
  }

  res.json({
    grade: grade.name,
    gradeNumber: grade.gradeNumber,
    count: notes.length,
    notes,
  });
});

// GET /api/library/grades/:gradeId/notes/:noteId - Single note under a grade
router.get('/grades/:gradeId/notes/:noteId', (req, res) => {
  const grade = resolveGrade(req.params.gradeId);
  if (!grade) {
    return res.status(404).json({ error: `Grade '${req.params.gradeId}' not found` });
  }

  const note = (grade.notes || []).find((n) => n.id === req.params.noteId);
  if (!note) {
    return res.status(404).json({ error: 'Note not found in this grade' });
  }

  res.json({
    grade: grade.name,
    note,
  });
});

// GET /api/library/grades/:gradeId/quizzes - Quizzes under a specific grade
router.get('/grades/:gradeId/quizzes', (req, res) => {
  const grade = resolveGrade(req.params.gradeId);
  if (!grade) {
    return res.status(404).json({ error: `Grade '${req.params.gradeId}' not found` });
  }

  const quizzes = (grade.quizzes || []).map((q) => ({
    id: q.id,
    title: q.title,
    topic: q.topic,
    difficulty: q.difficulty,
    questionCount: (q.questions || []).length,
    createdAt: q.createdAt,
  }));

  res.json({
    grade: grade.name,
    gradeNumber: grade.gradeNumber,
    count: quizzes.length,
    quizzes,
  });
});

// GET /api/library/grades/:gradeId/quizzes/:quizId - Single quiz under a grade
router.get('/grades/:gradeId/quizzes/:quizId', (req, res) => {
  const grade = resolveGrade(req.params.gradeId);
  if (!grade) {
    return res.status(404).json({ error: `Grade '${req.params.gradeId}' not found` });
  }

  const quiz = (grade.quizzes || []).find((q) => q.id === req.params.quizId);
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found in this grade' });
  }

  const sanitizeQuestions = req.query.mode === 'take';
  if (sanitizeQuestions) {
    return res.json({
      grade: grade.name,
      ...quiz,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
      })),
    });
  }

  res.json({
    grade: grade.name,
    ...quiz,
  });
});

// POST /api/library/grades/:gradeId/quizzes/:quizId/submit - Score quiz answers in-memory
router.post('/grades/:gradeId/quizzes/:quizId/submit', (req, res) => {
  const grade = resolveGrade(req.params.gradeId);
  if (!grade) {
    return res.status(404).json({ error: `Grade '${req.params.gradeId}' not found` });
  }

  const quiz = (grade.quizzes || []).find((q) => q.id === req.params.quizId);
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found in this grade' });
  }

  const { answers } = req.body;
  if (!answers) {
    return res.status(400).json({ error: 'answers array or object is required' });
  }

  let correctCount = 0;
  const results = quiz.questions.map((q, index) => {
    let studentChoice;
    if (Array.isArray(answers)) {
      studentChoice = answers[index];
    } else {
      studentChoice = answers[q.id];
    }

    const isCorrect = studentChoice === q.correctIndex;
    if (isCorrect) correctCount++;

    return {
      questionId: q.id,
      question: q.question,
      selectedOption: q.options[studentChoice] !== undefined ? q.options[studentChoice] : 'No answer',
      correctOption: q.options[q.correctIndex],
      isCorrect,
      explanation: q.explanation,
    };
  });

  const totalQuestions = quiz.questions.length;
  const scorePercent = Math.round((correctCount / totalQuestions) * 100);

  res.json({
    grade: grade.name,
    quizId: quiz.id,
    title: quiz.title,
    score: correctCount,
    totalQuestions,
    percentage: scorePercent,
    passed: scorePercent >= 60,
    results,
  });
});

// Reject modifications (Read-only mode)
router.all('*', (req, res) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return res.status(403).json({
      error: 'Read-only mode: Library modification is not permitted.',
    });
  }
  res.status(405).json({ error: 'Method not allowed' });
});

module.exports = router;
