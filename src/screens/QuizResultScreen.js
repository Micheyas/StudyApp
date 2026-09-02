import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

function scoreColor(score) {
  if (score >= 80) return COLORS.success;
  if (score >= 60) return COLORS.warning;
  return COLORS.danger;
}

function scoreLabel(score) {
  if (score === 100) return 'Perfect! 🏆';
  if (score >= 80) return 'Great Work! 🎉';
  if (score >= 60) return 'Good Effort 👍';
  if (score >= 40) return 'Keep Practicing 📚';
  return 'Keep Going! 💪';
}

function scoreEmoji(score) {
  if (score === 100) return '🏆';
  if (score >= 80) return '🎉';
  if (score >= 60) return '👍';
  return '📚';
}

// Animated circular progress
function CircleProgress({ score, color }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: score, duration: 900, useNativeDriver: false }).start();
  }, [score]);

  return (
    <View style={styles.circleContainer}>
      <View style={[styles.circle, { borderColor: color }]}>
        <Text style={[styles.circleScore, { color }]}>{score}%</Text>
        <Text style={styles.circleLabel}>Score</Text>
      </View>
    </View>
  );
}

export default function QuizResultScreen({ route, navigation }) {
  const { result } = route.params;
  const {
    quizTopic,
    difficulty,
    totalQuestions,
    correctAnswers,
    score,
    answers,
    questions,
    completedAt,
  } = result;

  const color = scoreColor(score);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: color + '15' }]}>
        <CircleProgress score={score} color={color} />
        <Text style={[styles.heroLabel, { color }]}>{scoreLabel(score)}</Text>
        <Text style={styles.heroTopic}>{quizTopic}</Text>
        <View style={styles.heroBadges}>
          <View style={styles.heroBadge}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
            <Text style={styles.heroBadgeText}>{correctAnswers} correct</Text>
          </View>
          <View style={styles.heroBadge}>
            <Ionicons name="close-circle" size={14} color={COLORS.danger} />
            <Text style={styles.heroBadgeText}>{totalQuestions - correctAnswers} wrong</Text>
          </View>
          <View style={styles.heroBadge}>
            <Ionicons name="layers" size={14} color={COLORS.primary} />
            <Text style={styles.heroBadgeText}>{difficulty}</Text>
          </View>
        </View>
        <Text style={styles.heroDate}>
          Completed {new Date(completedAt).toLocaleDateString()} at{' '}
          {new Date(completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: COLORS.primary }]}>{totalQuestions}</Text>
          <Text style={styles.statLabel}>Questions</Text>
        </View>
        <View style={[styles.statBox, styles.statBoxMiddle]}>
          <Text style={[styles.statValue, { color: COLORS.success }]}>{correctAnswers}</Text>
          <Text style={styles.statLabel}>Correct</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: color }]}>{score}%</Text>
          <Text style={styles.statLabel}>Score</Text>
        </View>
      </View>

      {/* Question review */}
      <Text style={styles.sectionTitle}>Question Review</Text>
      {questions.map((q, i) => {
        const answer = answers[i];
        const isCorrect = answer?.correct;
        return (
          <View key={i} style={[styles.reviewCard, isCorrect ? styles.reviewCorrect : styles.reviewWrong]}>
            <View style={styles.reviewHeader}>
              <View style={[styles.reviewBadge, { backgroundColor: isCorrect ? COLORS.success : COLORS.danger }]}>
                <Ionicons name={isCorrect ? 'checkmark' : 'close'} size={14} color="#fff" />
              </View>
              <Text style={styles.reviewNumber}>Q{i + 1}</Text>
            </View>
            <Text style={styles.reviewQuestion}>{q.question}</Text>

            {/* Options */}
            {q.options.map((opt, j) => {
              let optStyle = styles.reviewOption;
              let textStyle = styles.reviewOptionText;
              if (j === q.correctIndex) {
                optStyle = [styles.reviewOption, styles.reviewOptionCorrect];
                textStyle = [styles.reviewOptionText, { color: COLORS.success, fontWeight: '600' }];
              } else if (j === answer?.selectedIndex && !isCorrect) {
                optStyle = [styles.reviewOption, styles.reviewOptionSelected];
                textStyle = [styles.reviewOptionText, { color: COLORS.danger }];
              }
              return (
                <View key={j} style={optStyle}>
                  <Text style={styles.reviewOptionLetter}>{String.fromCharCode(65 + j)}.</Text>
                  <Text style={textStyle}>{opt}</Text>
                  {j === q.correctIndex && (
                    <Ionicons name="checkmark-circle" size={16} color={COLORS.success} style={{ marginLeft: 4 }} />
                  )}
                </View>
              );
            })}

            {/* Explanation */}
            {q.explanation && (
              <View style={styles.reviewExplanation}>
                <Ionicons name="bulb-outline" size={14} color={COLORS.warning} />
                <Text style={styles.reviewExplanationText}>{q.explanation}</Text>
              </View>
            )}
          </View>
        );
      })}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Quiz')}
          activeOpacity={0.85}
        >
          <Ionicons name="flash" size={20} color="#fff" />
          <Text style={styles.actionBtnText}>New Quiz</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnSecondary]}
          onPress={() => navigation.navigate('QuizTab')}
          activeOpacity={0.85}
        >
          <Ionicons name="home" size={20} color={COLORS.primary} />
          <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Back to Quizzes</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 40 },
  hero: { alignItems: 'center', padding: 24, borderRadius: 0, marginBottom: 0 },
  circleContainer: { marginBottom: 14 },
  circle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.card,
  },
  circleScore: { fontSize: 28, fontWeight: '800' },
  circleLabel: { fontSize: 12, color: COLORS.textLight, fontWeight: '600' },
  heroLabel: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  heroTopic: { fontSize: 15, color: COLORS.text, fontWeight: '600', marginBottom: 12 },
  heroBadges: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.card,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  heroBadgeText: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  heroDate: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statBoxMiddle: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: COLORS.border },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, color: COLORS.textLight, marginTop: 2, fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 10, paddingHorizontal: 14 },
  reviewCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
  },
  reviewCorrect: { borderLeftColor: COLORS.success },
  reviewWrong: { borderLeftColor: COLORS.danger },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  reviewBadge: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  reviewNumber: { fontSize: 13, fontWeight: '700', color: COLORS.textLight },
  reviewQuestion: { fontSize: 14, fontWeight: '600', color: COLORS.text, lineHeight: 21, marginBottom: 10 },
  reviewOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderRadius: 6,
    marginBottom: 3,
  },
  reviewOptionCorrect: { backgroundColor: COLORS.success + '12' },
  reviewOptionSelected: { backgroundColor: COLORS.danger + '12' },
  reviewOptionLetter: { fontSize: 13, fontWeight: '700', color: COLORS.textLight, width: 22 },
  reviewOptionText: { flex: 1, fontSize: 13, color: COLORS.text, lineHeight: 19 },
  reviewExplanation: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: COLORS.warning + '10',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  reviewExplanationText: { flex: 1, fontSize: 13, color: COLORS.text, lineHeight: 19 },
  actions: { padding: 14, gap: 10, marginTop: 6 },
  actionBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 15,
  },
  actionBtnSecondary: { backgroundColor: COLORS.primary + '15' },
  actionBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
