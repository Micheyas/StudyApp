const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default initial study data
const SEED_DATA = {
  notes: [
    {
      id: 'note-1',
      title: 'Introduction to Data Structures',
      subject: 'Computer Science',
      tags: ['algorithms', 'basics'],
      content: 'Arrays store elements in contiguous memory. Linked lists store elements with pointers.',
      createdAt: '2026-11-01T08:00:00.000Z',
    },
    {
      id: 'note-2',
      title: 'Photosynthesis Overview',
      subject: 'Biology',
      tags: ['botany', 'energy'],
      content: 'Plants convert sunlight, carbon dioxide, and water into glucose and oxygen.',
      createdAt: '2026-11-01T08:00:00.000Z',
    },
  ],
  quizzes: [
    {
      id: 'quiz-1',
      title: 'General Science Fundamentals',
      topic: 'Science',
      difficulty: 'easy',
      questions: [
        {
          id: 1,
          question: 'What is the chemical symbol for Water?',
          options: ['H2O', 'CO2', 'NaCl', 'O2'],
          correctIndex: 0,
          explanation: 'Water consists of two Hydrogen atoms and one Oxygen atom (H2O).',
        },
        {
          id: 2,
          question: 'Which planet is known as the Red Planet?',
          options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
          correctIndex: 1,
          explanation: 'Mars appears reddish due to iron oxide (rust) on its surface.',
        },
      ],
      createdAt: '2026-11-01T08:00:00.000Z',
    },
  ],
};

function getFilePath(collection) {
  return path.join(DATA_DIR, `${collection}.json`);
}

// Seed the files if they don't exist yet
function initCollection(collection) {
  const filePath = getFilePath(collection);
  if (!fs.existsSync(filePath)) {
    const initial = SEED_DATA[collection] || [];
    fs.writeFileSync(filePath, JSON.stringify(initial, null, 2), 'utf-8');
  }
}

['notes', 'quizzes', 'library'].forEach(initCollection);

// Read-only access methods
function read(collection) {
  const filePath = getFilePath(collection);
  try {
    if (!fs.existsSync(filePath)) {
      return SEED_DATA[collection] || [];
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content || '[]');
  } catch (error) {
    console.error(`Error reading ${collection}:`, error.message);
    return SEED_DATA[collection] || [];
  }
}

function findById(collection, id) {
  const items = read(collection);
  return items.find((item) => item.id === id) || null;
}

module.exports = {
  read,
  findById,
};
