import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchLibrary, submitLibraryGradeQuiz } from '../api/client';

export default function LibraryScreen() {
  const [grades, setGrades] = useState([]);
  const [currentGradeId, setCurrentGradeId] = useState('grade-9');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fromCache, setFromCache] = useState(false);

  // Note Reader Modal
  const [activeNoteModal, setActiveNoteModal] = useState(null);

  // Active Quiz State
  const [quizAnswers, setQuizAnswers] = useState({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResults, setQuizResults] = useState(null);

  useEffect(() => {
    loadLibrary();
  }, []);

  async function loadLibrary() {
    try {
      setLoading(true);
      const res = await fetchLibrary();
      setGrades(res.grades || []);
      setFromCache(res.fromCache || false);
    } catch (err) {
      console.warn('Error loading library:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function handleSelectGrade(id) {
    setCurrentGradeId(id);
    setQuizAnswers({});
    setQuizResults(null);
  }

  const currentGrade = grades.find(g => g.id === currentGradeId) || grades[0];
  const note = currentGrade?.notes?.[0];
  const quiz = currentGrade?.quizzes?.[0];

  function handleSelectOption(questionId, optionIndex) {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  }

  async function handleSubmitQuiz() {
    if (!quiz) return;
    try {
      setSubmittingQuiz(true);
      const res = await submitLibraryGradeQuiz(currentGrade.id, quiz.id, quizAnswers);
      setQuizResults(res);
    } catch (err) {
      alert('Could not submit quiz. Ensure backend is reachable or try again.');
    } finally {
      setSubmittingQuiz(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading Academic Library...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Grade Selector Tabs */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {grades.map(g => {
            const isActive = g.id === currentGrade?.id;
            return (
              <TouchableOpacity
                key={g.id}
                onPress={() => handleSelectGrade(g.id)}
                style={[styles.gradeTab, isActive && styles.gradeTabActive]}
              >
                <Text style={[styles.gradeTabText, isActive && styles.gradeTabTextActive]}>
                  🎓 {g.displayName || g.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Offline Cache Indicator */}
      {fromCache && (
        <View style={styles.cacheBanner}>
          <Ionicons name="cloud-offline" size={14} color="#047857" />
          <Text style={styles.cacheBannerText}>Viewing from offline cache</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadLibrary(); }} />}
      >
        {/* Grade Banner */}
        <View style={styles.gradeBanner}>
          <View style={styles.gradeBadgeRow}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{currentGrade?.displayName || currentGrade?.name}</Text>
            </View>
            <Text style={styles.levelText}>Academic Level {currentGrade?.level || currentGrade?.gradeNumber}</Text>
          </View>
          <Text style={styles.gradeTitle}>{currentGrade?.name} Hub</Text>
          <Text style={styles.gradeDesc}>{currentGrade?.description || 'Curated study materials for this academic grade.'}</Text>
          
          <View style={styles.subjectRow}>
            {(currentGrade?.subjects || []).map((s, idx) => (
              <View key={idx} style={styles.subjectPill}>
                <Text style={styles.subjectPillText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Note Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.cardIcon}>📝</Text>
              <Text style={styles.cardSectionTitle}>Curated Note</Text>
            </View>
            <View style={styles.subjectTag}>
              <Text style={styles.subjectTagText}>{note?.subject || 'General'}</Text>
            </View>
          </View>

          {note ? (
            <View style={styles.cardBody}>
              <Text style={styles.noteTitle}>{note.title}</Text>
              {note.summary ? (
                <View style={styles.summaryBox}>
                  <Text style={styles.summaryText}>💡 {note.summary}</Text>
                </View>
              ) : null}

              <Text numberOfLines={5} style={styles.noteSnippet}>
                {note.content}
              </Text>

              <TouchableOpacity
                style={styles.readFullBtn}
                onPress={() => setActiveNoteModal(note)}
              >
                <Ionicons name="book-outline" size={16} color="#FFFFFF" />
                <Text style={styles.readFullBtnText}>Read Full Note</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.emptyText}>No note available for this grade.</Text>
          )}
        </View>

        {/* Quiz Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.cardIcon}>🧠</Text>
              <Text style={styles.cardSectionTitle}>Self-Grading Quiz</Text>
            </View>
            <View style={styles.quizInfoRow}>
              <View style={styles.diffBadge}>
                <Text style={styles.diffBadgeText}>{quiz?.difficulty || 'Medium'}</Text>
              </View>
              <Text style={styles.qCountText}>{quiz?.questions?.length || 0} Qs</Text>
            </View>
          </View>

          {quiz ? (
            <View style={styles.cardBody}>
              <Text style={styles.noteTitle}>{quiz.title}</Text>
              <Text style={styles.quizInstructions}>
                Select an answer for each question and tap Submit for instant grading:
              </Text>

              {/* Questions */}
              <View style={styles.questionsList}>
                {(quiz.questions || []).map((q, idx) => (
                  <View key={q.id} style={styles.questionCard}>
                    <Text style={styles.questionTitle}>
                      <Text style={styles.qNumber}>Q{idx + 1}. </Text>
                      {q.question}
                    </Text>

                    <View style={styles.optionsList}>
                      {q.options.map((opt, optIdx) => {
                        const isSelected = quizAnswers[q.id] === optIdx;
                        return (
                          <TouchableOpacity
                            key={optIdx}
                            style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                            onPress={() => handleSelectOption(q.id, optIdx)}
                          >
                            <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                              {isSelected && <View style={styles.radioInner} />}
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
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitQuizBtn}
                onPress={handleSubmitQuiz}
                disabled={submittingQuiz}
              >
                {submittingQuiz ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="paper-plane-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.submitQuizBtnText}>Submit &amp; Grade Quiz</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Quiz Results Card */}
              {quizResults && (
                <View style={styles.resultsCard}>
                  <View style={styles.resultsHeader}>
                    <View>
                      <Text style={styles.resultsScore}>
                        Score: {quizResults.score} / {quizResults.totalQuestions} ({quizResults.percentage}%)
                      </Text>
                      <Text style={styles.resultsTitle}>{quizResults.title}</Text>
                    </View>
                    <View style={[styles.passBadge, quizResults.passed ? styles.passBadgeGreen : styles.passBadgeRed]}>
                      <Text style={[styles.passBadgeText, quizResults.passed ? styles.passTextGreen : styles.passTextRed]}>
                        {quizResults.passed ? '✓ Passed' : '✗ Try Again'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.resultsList}>
                    {quizResults.results.map((r, rIdx) => (
                      <View key={rIdx} style={[styles.resultItem, r.isCorrect ? styles.resultItemCorrect : styles.resultItemWrong]}>
                        <Text style={styles.resultQText}>
                          {r.isCorrect ? '✓ ' : '✗ '} {r.question}
                        </Text>
                        <Text style={styles.resultAnswerText}>
                          Your Answer: <Text style={styles.boldText}>{r.selectedOption}</Text>
                        </Text>
                        {!r.isCorrect && (
                          <Text style={styles.resultCorrectText}>
                            Correct: <Text style={styles.boldText}>{r.correctOption}</Text>
                          </Text>
                        )}
                        {r.explanation ? (
                          <Text style={styles.resultExpText}>💡 {r.explanation}</Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                </View>
              )}

            </View>
          ) : (
            <Text style={styles.emptyText}>No quiz available for this grade.</Text>
          )}
        </View>

      </ScrollView>

      {/* Note Reader Modal */}
      <Modal visible={!!activeNoteModal} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalSubject}>{activeNoteModal?.subject}</Text>
              <Text style={styles.modalTitle}>{activeNoteModal?.title}</Text>
            </View>
            <TouchableOpacity onPress={() => setActiveNoteModal(null)} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#0F172A" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            <Text style={styles.modalContent}>{activeNoteModal?.content}</Text>
          </ScrollView>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 10,
  },
  tabScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  gradeTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  gradeTabActive: {
    backgroundColor: '#2563EB',
  },
  gradeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  gradeTabTextActive: {
    color: '#FFFFFF',
  },
  cacheBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingVertical: 6,
  },
  cacheBannerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#047857',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  gradeBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    padding: 16,
    gap: 6,
  },
  gradeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  levelText: {
    fontSize: 12,
    color: '#64748B',
  },
  gradeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  gradeDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  subjectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  subjectPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  subjectPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  cardIcon: {
    fontSize: 18,
  },
  cardSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#2563EB',
  },
  subjectTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  subjectTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  quizInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  diffBadge: {
    backgroundColor: '#FAF5FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  diffBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7E22CE',
    textTransform: 'uppercase',
  },
  qCountText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  cardBody: {
    padding: 16,
    gap: 12,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  summaryBox: {
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  summaryText: {
    fontSize: 12,
    color: '#1E40AF',
    fontStyle: 'italic',
  },
  noteSnippet: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontFamily: 'monospace',
  },
  readFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 4,
  },
  readFullBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quizInstructions: {
    fontSize: 12,
    color: '#64748B',
  },
  questionsList: {
    gap: 12,
    marginTop: 4,
  },
  questionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 10,
  },
  questionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    lineHeight: 18,
  },
  qNumber: {
    color: '#7C3AED',
    fontWeight: '800',
  },
  optionsList: {
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    borderRadius: 12,
  },
  optionItemSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#2563EB',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },
  optionText: {
    fontSize: 12,
    color: '#334155',
    flex: 1,
  },
  optionTextSelected: {
    color: '#1E40AF',
    fontWeight: '600',
  },
  submitQuizBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  submitQuizBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resultsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 12,
    marginTop: 8,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
  },
  resultsScore: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  resultsTitle: {
    fontSize: 11,
    color: '#64748B',
  },
  passBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  passBadgeGreen: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  passBadgeRed: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  passBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  passTextGreen: {
    color: '#059669',
  },
  passTextRed: {
    color: '#DC2626',
  },
  resultsList: {
    gap: 8,
  },
  resultItem: {
    padding: 10,
    borderRadius: 10,
    gap: 4,
  },
  resultItemCorrect: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  resultItemWrong: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  resultQText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  resultAnswerText: {
    fontSize: 11,
    color: '#475569',
  },
  resultCorrectText: {
    fontSize: 11,
    color: '#059669',
  },
  resultExpText: {
    fontSize: 11,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 6,
    marginTop: 2,
  },
  boldText: {
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalSubject: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    textTransform: 'uppercase',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    maxWidth: 280,
  },
  closeBtn: {
    padding: 8,
  },
  modalBody: {
    padding: 20,
  },
  modalContent: {
    fontSize: 14,
    lineHeight: 24,
    color: '#334155',
    fontFamily: 'monospace',
  },
});
