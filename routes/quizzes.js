const express = require('express');
const router = express.Router();
const db = require('../db/storage');

// GET /api/quizzes - List quizzes (read-only)
router.get('/', (req, res) => {
  const { topic, difficulty, grade } = req.query;
  let quizzes = db.read('quizzes');

  if (topic) {
    quizzes = quizzes.filter((q) => q.topic && q.topic.toLowerCase() === topic.toLowerCase());
  }

  if (difficulty) {
    quizzes = quizzes.filter(
      (q) => q.difficulty && q.difficulty.toLowerCase() === difficulty.toLowerCase()
    );
  }

  if (grade !== undefined && grade !== null && grade !== '') {
    const gradeStr = String(grade).toLowerCase().replace(/^grade\s*/i, '').trim();
    quizzes = quizzes.filter((q) => {
      const g = q.grade != null ? String(q.grade).toLowerCase() : '';
      const gl = q.gradeLevel != null ? String(q.gradeLevel).toLowerCase() : '';
      return g === gradeStr || gl === gradeStr || `grade ${g}` === grade.toLowerCase().trim();
    });
  }

  const list = quizzes.map((q) => ({
    id: q.id,
    title: q.title,
    topic: q.topic,
    grade: q.grade,
    gradeLevel: q.gradeLevel,
    difficulty: q.difficulty,
    questionCount: q.questions ? q.questions.length : 0,
    createdAt: q.createdAt,
  }));

  res.json({ count: list.length, quizzes: list });
});

// GET /api/quizzes/:id - Get quiz details (read-only)
router.get('/:id', (req, res) => {
  const quiz = db.findById('quizzes', req.params.id);
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }

  const sanitizeQuestions = req.query.mode === 'take';
  if (sanitizeQuestions) {
    const studentVersion = {
      ...quiz,
      questions: quiz.questions.map((q) => ({
        id: q.id,
        question: q.question,
        options: q.options,
      })),
    };
    return res.json(studentVersion);
  }

  res.json(quiz);
});

// POST /api/quizzes/:id/submit - Score student answers in-memory (does not modify database)
router.post('/:id/submit', (req, res) => {
  const quiz = db.findById('quizzes', req.params.id);
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
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
      selectedOption: q.options[studentChoice] || 'No answer',
      correctOption: q.options[q.correctIndex],
      isCorrect,
      explanation: q.explanation,
    };
  });

  const totalQuestions = quiz.questions.length;
  const scorePercent = Math.round((correctCount / totalQuestions) * 100);

  res.json({
    quizId: quiz.id,
    title: quiz.title,
    score: correctCount,
    totalQuestions,
    percentage: scorePercent,
    passed: scorePercent >= 60,
    results,
  });
});

// Reject creation of new quizzes
router.post('/', (req, res) => {
  res.status(403).json({
    error: 'Read-only mode: Adding new quizzes is not permitted.',
  });
});

// Reject any other modifications
router.all('*', (req, res) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return res.status(403).json({
      error: 'Read-only mode: Adding, updating, or deleting quizzes is not permitted.',
    });
  }
  res.status(405).json({ error: 'Method not allowed' });
});

module.exports = router;
