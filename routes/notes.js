const express = require('express');
const router = express.Router();
const db = require('../db/storage');

// GET /api/notes - List notes (read-only, with search & filtering)
router.get('/', (req, res) => {
  const { subject, search, grade } = req.query;
  let notes = db.read('notes');

  if (subject) {
    notes = notes.filter((n) => n.subject && n.subject.toLowerCase() === subject.toLowerCase());
  }

  if (grade !== undefined && grade !== null && grade !== '') {
    const gradeStr = String(grade).toLowerCase().replace(/^grade\s*/i, '').trim();
    notes = notes.filter((n) => {
      const g = n.grade != null ? String(n.grade).toLowerCase() : '';
      const gl = n.gradeLevel != null ? String(n.gradeLevel).toLowerCase() : '';
      return g === gradeStr || gl === gradeStr || `grade ${g}` === grade.toLowerCase().trim();
    });
  }

  if (search) {
    const term = search.toLowerCase();
    notes = notes.filter(
      (n) =>
        (n.title && n.title.toLowerCase().includes(term)) ||
        (n.content && n.content.toLowerCase().includes(term)) ||
        (n.tags && n.tags.some((t) => t.toLowerCase().includes(term)))
    );
  }

  res.json({ count: notes.length, notes });
});

// GET /api/notes/:id - Get a single note (read-only)
router.get('/:id', (req, res) => {
  const note = db.findById('notes', req.params.id);
  if (!note) {
    return res.status(404).json({ error: 'Note not found' });
  }
  res.json(note);
});

// Reject any modifications
router.all('*', (req, res) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return res.status(403).json({
      error: 'Read-only mode: Adding, updating, or deleting notes is not permitted.',
    });
  }
  res.status(405).json({ error: 'Method not allowed' });
});

module.exports = router;
