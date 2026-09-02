import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, ACTIONS } from '../context/AppContext';
import { generateQuiz } from '../services/aiService';

const COLORS = {
  primary: '#4A90E2',
  secondary: '#7C4DFF',
  success: '#27AE60',
  warning: '#F39C12',
  danger: '#E74C3C',
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#2C3E50',
  textLight: '#7F8C8D',
  border: '#E9ECEF',
};

const DIFFICULTIES = ['easy', 'medium', 'hard'];
const QUESTION_COUNTS = [3, 5, 10, 15];

// ── Generate Quiz Panel ───────────────────────────────────────────────────────
function GeneratePanel({ onGenerated }) {
  const [topic, setTopic] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);

  const difficultyColor = { easy: COLORS.success, medium: COLORS.warning, hard: COLORS.danger };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      Alert.alert('Topic Required', 'Please enter a topic to generate a quiz.');
      return;
    }
    setLoading(true);
    try {
      const result = await generateQuiz(topic.trim(), numQuestions, difficulty);
      onGenerated(result);
    } catch (error) {
      Alert.alert('Generation Failed', error.message || 'Could not generate quiz. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.genPanel} contentContainerStyle={styles.genPanelContent} keyboardShouldPersistTaps="handled">
      <View style={styles.genHero}>
        <View style={styles.genHeroIcon}>
          <Ionicons name="flash" size={36} color={COLORS.secondary} />
        </View>
        <Text style={styles.genHeroTitle}>AI Quiz Generator</Text>
        <Text style={styles.genHeroSub}>Enter any topic and let AI create a custom quiz for you</Text>
      </View>

      <Text style={styles.fieldLabel}>Topic</Text>
      <TextInput
        style={styles.input}
        value={topic}
        onChangeText={setTopic}
        placeholder="e.g. Photosynthesis, World War II, Python functions…"
        placeholderTextColor={COLORS.textLight}
        returnKeyType="done"
      />

      <Text style={styles.fieldLabel}>Number of Questions</Text>
      <View style={styles.optionRow}>
        {QUESTION_COUNTS.map((n) => (
          <TouchableOpacity
            key={n}
            style={[styles.optionChip, numQuestions === n && styles.optionChipActive]}
            onPress={() => setNumQuestions(n)}
          >
            <Text style={[styles.optionChipText, numQuestions === n && styles.optionChipTextActive]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Difficulty</Text>
      <View style={styles.optionRow}>
        {DIFFICULTIES.map((d) => (
          <TouchableOpacity
            key={d}
            style={[
              styles.optionChip,
              styles.diffChip,
              difficulty === d && { backgroundColor: difficultyColor[d], borderColor: difficultyColor[d] },
            ]}
            onPress={() => setDifficulty(d)}
          >
            <Text style={[styles.optionChipText, difficulty === d && styles.optionChipTextActive]}>
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.generateBtn, loading && styles.generateBtnLoading]}
        onPress={handleGenerate}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.generateBtnText}>Generating…</Text>
          </>
        ) : (
          <>
            <Ionicons name="flash" size={20} color="#fff" />
            <Text style={styles.generateBtnText}>Generate Quiz</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Active Quiz ───────────────────────────────────────────────────────────────
function ActiveQuiz({ quiz, onFinish }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [answers, setAnswers] = useState([]); // [{questionIndex, selectedIndex, correct}]
  const [showExplanation, setShowExplanation] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const question = quiz.questions[currentIndex];
  const isLast = currentIndex === quiz.questions.length - 1;
  const hasAnswered = selectedIndex !== null;

  const handleSelect = (optionIndex) => {
    if (hasAnswered) return;
    setSelectedIndex(optionIndex);
    setShowExplanation(true);
  };

  const handleNext = () => {
    const newAnswers = [
      ...answers,
      {
        questionIndex: currentIndex,
        selectedIndex,
        correct: selectedIndex === question.correctIndex,
      },
    ];
    setAnswers(newAnswers);

    if (isLast) {
      onFinish(quiz, newAnswers);
      return;
    }

    // Animate transition
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    setCurrentIndex(currentIndex + 1);
    setSelectedIndex(null);
    setShowExplanation(false);
  };

  const optionStyle = (optionIndex) => {
    if (!hasAnswered) return styles.option;
    if (optionIndex === question.correctIndex) return [styles.option, styles.optionCorrect];
    if (optionIndex === selectedIndex) return [styles.option, styles.optionWrong];
    return [styles.option, styles.optionDimmed];
  };

  const optionTextStyle = (optionIndex) => {
    if (!hasAnswered) return styles.optionText;
    if (optionIndex === question.correctIndex) return [styles.optionText, styles.optionTextCorrect];
    if (optionIndex === selectedIndex) return [styles.optionText, styles.optionTextWrong];
    return [styles.optionText, styles.optionTextDimmed];
  };

  const progress = (currentIndex / quiz.questions.length) * 100;

  return (
    <View style={styles.quizContainer}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      {/* Counter */}
      <View style={styles.quizHeader}>
        <Text style={styles.quizCounter}>
          Question {currentIndex + 1} of {quiz.questions.length}
        </Text>
        <View style={styles.topicBadge}>
          <Text style={styles.topicBadgeText}>{quiz.topic}</Text>
        </View>
      </View>

      <Animated.ScrollView style={[styles.questionScroll, { opacity: fadeAnim }]} contentContainerStyle={styles.questionContent}>
        {/* Question */}
        <Text style={styles.questionText}>{question.question}</Text>

        {/* Options */}
        {question.options.map((option, i) => (
          <TouchableOpacity
            key={i}
            style={optionStyle(i)}
            onPress={() => handleSelect(i)}
            disabled={hasAnswered}
            activeOpacity={0.8}
          >
            <View style={styles.optionLetter}>
              <Text style={styles.optionLetterText}>{String.fromCharCode(65 + i)}</Text>
            </View>
            <Text style={optionTextStyle(i)}>{option}</Text>
            {hasAnswered && i === question.correctIndex && (
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} style={styles.optionIcon} />
            )}
            {hasAnswered && i === selectedIndex && i !== question.correctIndex && (
              <Ionicons name="close-circle" size={20} color={COLORS.danger} style={styles.optionIcon} />
            )}
          </TouchableOpacity>
        ))}

        {/* Explanation */}
        {showExplanation && question.explanation && (
          <View style={styles.explanationBox}>
            <Ionicons name="information-circle" size={18} color={COLORS.primary} />
            <Text style={styles.explanationText}>{question.explanation}</Text>
          </View>
        )}

        {/* Next / Finish */}
        {hasAnswered && (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
            <Text style={styles.nextBtnText}>{isLast ? 'See Results' : 'Next Question'}</Text>
            <Ionicons name={isLast ? 'trophy' : 'arrow-forward'} size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </Animated.ScrollView>
    </View>
  );
}

// ── Main QuizScreen ───────────────────────────────────────────────────────────
export default function QuizScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [tab, setTab] = useState('generate'); // 'generate' | 'history'

  const handleGenerated = (quizData) => {
    // Save quiz to library
    const saved = {
      id: Date.now().toString(),
      ...quizData,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: ACTIONS.ADD_QUIZ, payload: saved });
    setActiveQuiz(quizData);
  };

  const handleFinish = (quiz, answers) => {
    const score = Math.round((answers.filter((a) => a.correct).length / answers.length) * 100);
    const result = {
      id: Date.now().toString(),
      quizTopic: quiz.topic,
      difficulty: quiz.difficulty,
      totalQuestions: quiz.questions.length,
      correctAnswers: answers.filter((a) => a.correct).length,
      score,
      answers,
      questions: quiz.questions,
      completedAt: new Date().toISOString(),
    };
    dispatch({ type: ACTIONS.ADD_QUIZ_RESULT, payload: result });
    setActiveQuiz(null);
    navigation.navigate('QuizResult', { result });
  };

  const handleDeleteQuiz = (id) => {
    Alert.alert('Delete Quiz', 'Remove this quiz from history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => dispatch({ type: ACTIONS.DELETE_QUIZ, payload: id }) },
    ]);
  };

  if (activeQuiz) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <TouchableOpacity
          style={styles.quitBtn}
          onPress={() => Alert.alert('Quit Quiz', 'Your progress will be lost.', [
            { text: 'Stay', style: 'cancel' },
            { text: 'Quit', style: 'destructive', onPress: () => setActiveQuiz(null) },
          ])}
        >
          <Ionicons name="close" size={20} color={COLORS.danger} />
          <Text style={styles.quitBtnText}>Quit Quiz</Text>
        </TouchableOpacity>
        <ActiveQuiz quiz={activeQuiz} onFinish={handleFinish} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'generate' && styles.tabActive]}
          onPress={() => setTab('generate')}
        >
          <Ionicons name="flash" size={16} color={tab === 'generate' ? COLORS.primary : COLORS.textLight} />
          <Text style={[styles.tabText, tab === 'generate' && styles.tabTextActive]}>Generate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'history' && styles.tabActive]}
          onPress={() => setTab('history')}
        >
          <Ionicons name="time" size={16} color={tab === 'history' ? COLORS.primary : COLORS.textLight} />
          <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>
            History ({state.quizResults.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'saved' && styles.tabActive]}
          onPress={() => setTab('saved')}
        >
          <Ionicons name="bookmark" size={16} color={tab === 'saved' ? COLORS.primary : COLORS.textLight} />
          <Text style={[styles.tabText, tab === 'saved' && styles.tabTextActive]}>
            Saved ({state.quizzes.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab content */}
      {tab === 'generate' && <GeneratePanel onGenerated={handleGenerated} />}

      {tab === 'history' && (
        <ScrollView contentContainerStyle={styles.listContent}>
          {state.quizResults.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={52} color={COLORS.border} />
              <Text style={styles.emptyTitle}>No quiz history yet</Text>
              <Text style={styles.emptyText}>Complete a quiz to see your results here</Text>
            </View>
          ) : (
            state.quizResults.map((result) => (
              <TouchableOpacity
                key={result.id}
                style={styles.historyCard}
                onPress={() => navigation.navigate('QuizResult', { result })}
                activeOpacity={0.8}
              >
                <View style={[styles.scoreCircle, { backgroundColor: result.score >= 70 ? COLORS.success : result.score >= 50 ? COLORS.warning : COLORS.danger }]}>
                  <Text style={styles.scoreCircleText}>{result.score}%</Text>
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTopic} numberOfLines={1}>{result.quizTopic}</Text>
                  <Text style={styles.historyMeta}>
                    {result.correctAnswers}/{result.totalQuestions} correct · {result.difficulty}
                  </Text>
                  <Text style={styles.historyDate}>
                    {new Date(result.completedAt).toLocaleDateString()}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {tab === 'saved' && (
        <ScrollView contentContainerStyle={styles.listContent}>
          {state.quizzes.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="bookmark-outline" size={52} color={COLORS.border} />
              <Text style={styles.emptyTitle}>No saved quizzes</Text>
              <Text style={styles.emptyText}>Generated quizzes are saved here automatically</Text>
            </View>
          ) : (
            state.quizzes.map((quiz) => (
              <View key={quiz.id} style={styles.savedCard}>
                <View style={styles.savedInfo}>
                  <Text style={styles.savedTopic} numberOfLines={1}>{quiz.topic}</Text>
                  <Text style={styles.savedMeta}>
                    {quiz.questions.length} questions · {quiz.difficulty}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.retakeBtn}
                  onPress={() => setActiveQuiz(quiz)}
                >
                  <Text style={styles.retakeBtnText}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteQuiz(quiz.id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.textLight },
  tabTextActive: { color: COLORS.primary },
  // Generate panel
  genPanel: { flex: 1 },
  genPanelContent: { padding: 16, paddingBottom: 40 },
  genHero: { alignItems: 'center', paddingVertical: 20 },
  genHeroIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: COLORS.secondary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  genHeroTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  genHeroSub: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', paddingHorizontal: 20 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  optionRow: { flexDirection: 'row', gap: 10 },
  optionChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: 'center',
  },
  optionChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  diffChip: {},
  optionChipText: { fontSize: 14, fontWeight: '600', color: COLORS.textLight },
  optionChipTextActive: { color: '#fff' },
  generateBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.secondary,
    borderRadius: 14,
    padding: 16,
    marginTop: 28,
  },
  generateBtnLoading: { opacity: 0.7 },
  generateBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  // Active quiz
  quizContainer: { flex: 1, backgroundColor: COLORS.background },
  progressBar: { height: 4, backgroundColor: COLORS.border },
  progressFill: { height: 4, backgroundColor: COLORS.primary },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  quizCounter: { fontSize: 14, fontWeight: '600', color: COLORS.textLight },
  topicBadge: { backgroundColor: COLORS.primary + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  topicBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  questionScroll: { flex: 1 },
  questionContent: { padding: 16, paddingBottom: 40 },
  questionText: { fontSize: 18, fontWeight: '700', color: COLORS.text, lineHeight: 27, marginBottom: 20 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  optionCorrect: { borderColor: COLORS.success, backgroundColor: COLORS.success + '10' },
  optionWrong: { borderColor: COLORS.danger, backgroundColor: COLORS.danger + '10' },
  optionDimmed: { opacity: 0.5 },
  optionLetter: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLetterText: { fontSize: 13, fontWeight: '700', color: COLORS.textLight },
  optionText: { flex: 1, fontSize: 15, color: COLORS.text, lineHeight: 21 },
  optionTextCorrect: { color: COLORS.success, fontWeight: '600' },
  optionTextWrong: { color: COLORS.danger },
  optionTextDimmed: { color: COLORS.textLight },
  optionIcon: { marginLeft: 8 },
  explanationBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  explanationText: { flex: 1, fontSize: 14, color: COLORS.text, lineHeight: 21 },
  nextBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  quitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
    paddingHorizontal: 16,
  },
  quitBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.danger },
  // Lists
  listContent: { padding: 12, paddingBottom: 40 },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  scoreCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  scoreCircleText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  historyInfo: { flex: 1 },
  historyTopic: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 3 },
  historyMeta: { fontSize: 13, color: COLORS.textLight },
  historyDate: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  savedInfo: { flex: 1 },
  savedTopic: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  savedMeta: { fontSize: 13, color: COLORS.textLight, marginTop: 3 },
  retakeBtn: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 10,
  },
  retakeBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  deleteBtn: { padding: 4 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: 14, marginBottom: 6 },
  emptyText: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', paddingHorizontal: 32 },
});
