import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchQuizzes, fetchQuizDetails, submitQuiz } from '../api/client';

export default function QuizzesScreen() {
  const [quizzesList, setQuizzesList] = useState([]);
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [quizLoading, setQuizLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadQuizzes();
  }, []);

  async function loadQuizzes() {
    try {
      setLoading(true);
      const res = await fetchQuizzes();
      const list = res.quizzes || [];
      setQuizzesList(list);
      if (list.length > 0) {
        selectQuiz(list[0].id);
      }
    } catch (err) {
      console.warn('Error loading quizzes:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function selectQuiz(id) {
    try {
      setActiveQuizId(id);
      setQuizLoading(true);
      setAnswers({});
      setResults(null);
      const data = await fetchQuizDetails(id);
      setActiveQuiz(data);
    } catch (err) {
      console.warn('Error loading quiz detail:', err);
    } finally {
      setQuizLoading(false);
    }
  }

  function handleSelectOption(qId, optIdx) {
    setAnswers(prev => ({ ...prev, [qId]: optIdx }));
  }

  async function handleSubmit() {
    if (!activeQuiz) return;
    try {
      setSubmitting(true);
      const res = await submitQuiz(activeQuiz.id, answers);
      setResults(res);
    } catch (err) {
      alert('Could not grade quiz. Make sure the backend server is reachable.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading Quizzes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Quiz Selector Horizontal Tabs */}
      <View style={styles.pickerBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerScroll}>
          {quizzesList.map(q => {
            const isSelected = q.id === activeQuizId;
            return (
              <TouchableOpacity
                key={q.id}
                style={[styles.quizTab, isSelected && styles.quizTabActive]}
                onPress={() => selectQuiz(q.id)}
              >
                <Text style={[styles.quizTabText, isSelected && styles.quizTabTextActive]}>
                  {q.title}
                </Text>
                <Text style={[styles.quizTabCount, isSelected && styles.quizTabCountActive]}>
                  {q.questionCount} Qs
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadQuizzes(); }} />}
      >
        {quizLoading ? (
          <View style={styles.quizLoadingBox}>
            <ActivityIndicator size="small" color="#2563EB" />
            <Text style={styles.loadingText}>Loading questions...</Text>
          </View>
        ) : activeQuiz ? (
          <View style={styles.quizBody}>
            {/* Quiz Info Banner */}
            <View style={styles.infoBanner}>
              <View style={styles.infoHeader}>
                <Text style={styles.quizTitle}>{activeQuiz.title}</Text>
                <View style={styles.diffPill}>
                  <Text style={styles.diffPillText}>{activeQuiz.difficulty || 'Medium'}</Text>
                </View>
              </View>
              <Text style={styles.quizDesc}>
                Select the correct answer for each question below and tap Submit to grade.
              </Text>
            </View>

            {/* Questions List */}
            {(activeQuiz.questions || []).map((q, qIdx) => (
              <View key={q.id} style={styles.questionCard}>
                <Text style={styles.questionText}>
                  <Text style={styles.qNum}>Q{qIdx + 1}. </Text>
                  {q.question}
                </Text>

                <View style={styles.optionsList}>
                  {q.options.map((opt, optIdx) => {
                    const isSelected = answers[q.id] === optIdx;
                    return (
                      <TouchableOpacity
                        key={optIdx}
                        style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                        onPress={() => handleSelectOption(q.id, optIdx)}
                      >
                        <View style={[styles.radio, isSelected && styles.radioSelected]}>
                          {isSelected && <View style={styles.radioDot} />}
                        </View>
                        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            {/* Submit Quiz Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="rocket-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Submit &amp; Grade Quiz</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Results Review Card */}
            {results && (
              <View style={styles.resultsCard}>
                <View style={styles.resultsHeader}>
                  <View>
                    <Text style={styles.resultsScore}>
                      Score: {results.score} / {results.totalQuestions} ({results.percentage}%)
                    </Text>
                    <Text style={styles.resultsSub}>{results.title}</Text>
                  </View>
                  <View style={[styles.badge, results.passed ? styles.badgeGreen : styles.badgeRed]}>
                    <Text style={[styles.badgeText, results.passed ? styles.textGreen : styles.textRed]}>
                      {results.passed ? '✓ Passed!' : '✗ Try Again'}
                    </Text>
                  </View>
                </View>

                <View style={styles.resultsList}>
                  {results.results.map((r, idx) => (
                    <View key={idx} style={[styles.resItem, r.isCorrect ? styles.resCorrect : styles.resWrong]}>
                      <Text style={styles.resQTitle}>
                        {r.isCorrect ? '✓ ' : '✗ '} {r.question}
                      </Text>
                      <Text style={styles.resAnswerLine}>
                        Your Answer: <Text style={styles.bold}>{r.selectedOption}</Text>
                      </Text>
                      {!r.isCorrect && (
                        <Text style={styles.resCorrectLine}>
                          Correct: <Text style={styles.bold}>{r.correctOption}</Text>
                        </Text>
                      )}
                      {r.explanation ? (
                        <Text style={styles.resExp}>💡 {r.explanation}</Text>
                      ) : null}
                    </View>
                  ))}
                </View>
              </View>
            )}

          </View>
        ) : (
          <Text style={styles.emptyText}>No quiz selected.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
  },
  pickerBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 10,
  },
  pickerScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quizTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quizTabActive: {
    backgroundColor: '#2563EB',
  },
  quizTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  quizTabTextActive: {
    color: '#FFFFFF',
  },
  quizTabCount: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  quizTabCountActive: {
    color: '#BFDBFE',
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  quizLoadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  quizBody: {
    gap: 16,
  },
  infoBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 6,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  diffPill: {
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  diffPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7E22CE',
    textTransform: 'uppercase',
  },
  quizDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
  },
  questionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 20,
  },
  qNum: {
    color: '#2563EB',
    fontWeight: '800',
  },
  optionsList: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    borderRadius: 12,
  },
  optionItemSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#2563EB',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  optionText: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  optionTextSelected: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resultsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  resultsScore: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  resultsSub: {
    fontSize: 12,
    color: '#64748B',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeGreen: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  badgeRed: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textGreen: {
    color: '#059669',
  },
  textRed: {
    color: '#DC2626',
  },
  resultsList: {
    gap: 10,
  },
  resItem: {
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  resCorrect: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  resWrong: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  resQTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  resAnswerLine: {
    fontSize: 12,
    color: '#475569',
  },
  resCorrectLine: {
    fontSize: 12,
    color: '#059669',
  },
  resExp: {
    fontSize: 12,
    color: '#334155',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  bold: {
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 40,
  },
});
