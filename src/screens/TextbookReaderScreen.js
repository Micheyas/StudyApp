import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { summarizeText, generateQuiz } from '../services/aiService';
import { useApp, ACTIONS } from '../context/AppContext';

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

const FONT_SIZES = [14, 16, 18, 20, 22];
const THEMES = [
  { name: 'Light', bg: '#FFFFFF', text: '#2C3E50' },
  { name: 'Sepia', bg: '#FBF0D9', text: '#433422' },
  { name: 'Dark', bg: '#1A1A2E', text: '#E0E0E0' },
];

export default function TextbookReaderScreen({ route, navigation }) {
  const { item } = route.params;
  const { dispatch } = useApp();

  const [fontSizeIndex, setFontSizeIndex] = useState(1);
  const [themeIndex, setThemeIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [summary, setSummary] = useState('');
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [highlightedText, setHighlightedText] = useState('');
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [noteText, setNoteText] = useState('');

  const theme = THEMES[themeIndex];
  const fontSize = FONT_SIZES[fontSizeIndex];
  const content = item.content || item.description || 'No content available for this item.';

  const handleSummarize = async () => {
    if (!item.content) {
      Alert.alert('No Content', 'This item has no text content to summarize.');
      return;
    }
    setIsSummarizing(true);
    setSummaryVisible(true);
    setSummary('');
    try {
      const result = await summarizeText(item.content, 'bullet-points');
      setSummary(result.summary);
    } catch (error) {
      setSummary('Could not generate summary. Make sure the server is running.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!item.content) {
      Alert.alert('No Content', 'This item has no content to generate a quiz from.');
      return;
    }
    setIsGeneratingQuiz(true);
    try {
      const result = await generateQuiz(item.title, 5, 'medium');
      const saved = {
        id: Date.now().toString(),
        ...result,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: ACTIONS.ADD_QUIZ, payload: saved });
      Alert.alert(
        'Quiz Generated!',
        `A 5-question quiz on "${item.title}" has been saved. Find it in the Quiz tab under Saved.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not generate quiz.');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleSaveNote = () => {
    if (!noteText.trim()) return;
    const now = new Date().toISOString();
    dispatch({
      type: ACTIONS.ADD_NOTE,
      payload: {
        id: Date.now().toString(),
        title: `Note from: ${item.title}`,
        content: noteText.trim(),
        tags: ['from-reader', item.category?.toLowerCase() || 'reading'].map(t => t.replace(/\s+/g, '-')),
        createdAt: now,
        updatedAt: now,
      },
    });
    setNoteText('');
    setNoteModalVisible(false);
    Alert.alert('Saved', 'Your note has been saved to the Notes section.');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={themeIndex === 2 ? 'light-content' : 'dark-content'} />

      {/* Toolbar */}
      <View style={[styles.toolbar, { backgroundColor: theme.bg, borderBottomColor: COLORS.border }]}>
        {/* Left: font size */}
        <View style={styles.toolbarGroup}>
          <TouchableOpacity
            style={styles.toolbarBtn}
            onPress={() => setFontSizeIndex(Math.max(0, fontSizeIndex - 1))}
            disabled={fontSizeIndex === 0}
          >
            <Text style={[styles.toolbarBtnText, { color: fontSizeIndex === 0 ? COLORS.border : COLORS.textLight }]}>A-</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolbarBtn}
            onPress={() => setFontSizeIndex(Math.min(FONT_SIZES.length - 1, fontSizeIndex + 1))}
            disabled={fontSizeIndex === FONT_SIZES.length - 1}
          >
            <Text style={[styles.toolbarBtnText, { fontSize: 18, color: fontSizeIndex === FONT_SIZES.length - 1 ? COLORS.border : COLORS.text }]}>A+</Text>
          </TouchableOpacity>
        </View>

        {/* Center: actions */}
        <View style={styles.toolbarGroup}>
          <TouchableOpacity style={styles.toolbarActionBtn} onPress={handleSummarize} disabled={isSummarizing}>
            {isSummarizing
              ? <ActivityIndicator size="small" color={COLORS.secondary} />
              : <Ionicons name="sparkles" size={20} color={COLORS.secondary} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarActionBtn} onPress={handleGenerateQuiz} disabled={isGeneratingQuiz}>
            {isGeneratingQuiz
              ? <ActivityIndicator size="small" color={COLORS.warning} />
              : <Ionicons name="flash" size={20} color={COLORS.warning} />}
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolbarActionBtn} onPress={() => setNoteModalVisible(true)}>
            <Ionicons name="create" size={20} color={COLORS.success} />
          </TouchableOpacity>
        </View>

        {/* Right: theme */}
        <TouchableOpacity
          style={styles.toolbarBtn}
          onPress={() => setThemeIndex((themeIndex + 1) % THEMES.length)}
        >
          <Ionicons
            name={themeIndex === 2 ? 'sunny' : 'moon'}
            size={20}
            color={COLORS.textLight}
          />
        </TouchableOpacity>
      </View>

      {/* Toolbar legend */}
      <View style={[styles.legend, { backgroundColor: theme.bg }]}>
        <LegendItem icon="sparkles" color={COLORS.secondary} label="Summarize" />
        <LegendItem icon="flash" color={COLORS.warning} label="Make Quiz" />
        <LegendItem icon="create" color={COLORS.success} label="Add Note" />
      </View>

      {/* Summary panel */}
      {summaryVisible && (
        <View style={[styles.summaryPanel, { backgroundColor: COLORS.secondary + '12', borderColor: COLORS.secondary + '40' }]}>
          <View style={styles.summaryPanelHeader}>
            <Ionicons name="sparkles" size={15} color={COLORS.secondary} />
            <Text style={[styles.summaryPanelTitle, { color: COLORS.secondary }]}>AI Summary</Text>
            <TouchableOpacity onPress={() => setSummaryVisible(false)}>
              <Ionicons name="close" size={18} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
          {isSummarizing ? (
            <View style={styles.summaryLoading}>
              <ActivityIndicator color={COLORS.secondary} />
              <Text style={styles.summaryLoadingText}>Summarizing…</Text>
            </View>
          ) : (
            <Text style={[styles.summaryPanelText, { color: theme.text }]}>{summary}</Text>
          )}
        </View>
      )}

      {/* Main content */}
      <ScrollView
        style={styles.reader}
        contentContainerStyle={styles.readerContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.articleHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: COLORS.primary + '20' }]}>
            <Text style={[styles.categoryText, { color: COLORS.primary }]}>{item.category || 'Reading'}</Text>
          </View>
          <Text style={[styles.articleTitle, { color: theme.text, fontSize: fontSize + 6 }]}>
            {item.title}
          </Text>
          {item.description ? (
            <Text style={[styles.articleSubtitle, { color: COLORS.textLight, fontSize: fontSize - 2 }]}>
              {item.description}
            </Text>
          ) : null}
          <View style={styles.articleMeta}>
            <Ionicons name="calendar-outline" size={13} color={COLORS.textLight} />
            <Text style={styles.articleMetaText}>
              Added {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            <Text style={styles.articleMetaDot}>·</Text>
            <Ionicons name="text-outline" size={13} color={COLORS.textLight} />
            <Text style={styles.articleMetaText}>
              ~{Math.ceil(content.split(/\s+/).length / 200)} min read
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: COLORS.border }]} />

        {/* Content body */}
        <Text style={[styles.bodyText, { color: theme.text, fontSize, lineHeight: fontSize * 1.75 }]}>
          {content}
        </Text>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Take Note Modal */}
      <Modal visible={noteModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setNoteModalVisible(false)}>
        <View style={styles.noteModal}>
          <View style={styles.noteModalHeader}>
            <Text style={styles.noteModalTitle}>Take a Note</Text>
            <TouchableOpacity onPress={() => setNoteModalVisible(false)}>
              <Ionicons name="close" size={26} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.noteModalSub}>From: {item.title}</Text>
          <TextInput
            style={styles.noteModalInput}
            value={noteText}
            onChangeText={setNoteText}
            placeholder="Write your thoughts, key points, or observations…"
            placeholderTextColor={COLORS.textLight}
            multiline
            autoFocus
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.noteModalSave, !noteText.trim() && styles.noteModalSaveDisabled]}
            onPress={handleSaveNote}
            disabled={!noteText.trim()}
          >
            <Ionicons name="save" size={18} color="#fff" />
            <Text style={styles.noteModalSaveText}>Save Note</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

function LegendItem({ icon, color, label }) {
  return (
    <View style={styles.legendItem}>
      <Ionicons name={icon} size={12} color={color} />
      <Text style={[styles.legendText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  toolbarGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  toolbarBtn: { padding: 6 },
  toolbarBtnText: { fontSize: 14, fontWeight: '700' },
  toolbarActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 6,
    paddingTop: 2,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendText: { fontSize: 11, fontWeight: '600' },
  summaryPanel: {
    margin: 12,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  summaryPanelHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  summaryPanelTitle: { flex: 1, fontSize: 13, fontWeight: '700' },
  summaryLoading: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  summaryLoadingText: { color: COLORS.textLight, fontSize: 13 },
  summaryPanelText: { fontSize: 14, lineHeight: 22 },
  reader: { flex: 1 },
  readerContent: { paddingHorizontal: 20, paddingTop: 20 },
  articleHeader: { marginBottom: 16 },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginBottom: 10 },
  categoryText: { fontSize: 12, fontWeight: '700' },
  articleTitle: { fontWeight: '800', lineHeight: 34, marginBottom: 8 },
  articleSubtitle: { lineHeight: 22, marginBottom: 10 },
  articleMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  articleMetaText: { fontSize: 12, color: COLORS.textLight },
  articleMetaDot: { fontSize: 12, color: COLORS.textLight, marginHorizontal: 4 },
  divider: { height: 1, marginVertical: 16 },
  bodyText: { lineHeight: 28 },
  // Note modal
  noteModal: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  noteModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  noteModalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  noteModalSub: { fontSize: 13, color: COLORS.textLight, marginBottom: 14 },
  noteModalInput: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: 14,
  },
  noteModalSave: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.success,
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  noteModalSaveDisabled: { backgroundColor: COLORS.border },
  noteModalSaveText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
