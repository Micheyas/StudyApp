import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, ACTIONS } from '../context/AppContext';
import { summarizeText } from '../services/aiService';

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

export default function NoteEditorScreen({ route, navigation }) {
  const { noteId } = route.params || {};
  const { state, dispatch } = useApp();

  // Load existing note or create blank
  const existingNote = noteId ? state.notes.find((n) => n.id === noteId) : null;

  const [title, setTitle] = useState(existingNote?.title || '');
  const [content, setContent] = useState(existingNote?.content || '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(existingNote?.tags || []);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  const contentRef = useRef(null);

  // Mark dirty on any change
  useEffect(() => {
    if (existingNote) {
      const changed =
        title !== existingNote.title ||
        content !== existingNote.content ||
        JSON.stringify(tags) !== JSON.stringify(existingNote.tags);
      setIsDirty(changed);
    } else {
      setIsDirty(title.length > 0 || content.length > 0);
    }
  }, [title, content, tags]);

  // Warn on back if unsaved
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!isDirty) return;
      e.preventDefault();
      Alert.alert('Unsaved Changes', 'You have unsaved changes. Save before leaving?', [
        { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
        { text: 'Save & Leave', onPress: () => { handleSave(); navigation.dispatch(e.data.action); } },
        { text: 'Stay', style: 'cancel' },
      ]);
    });
    return unsubscribe;
  }, [navigation, isDirty, title, content, tags]);

  const handleSave = () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert('Empty Note', 'Please add a title or some content before saving.');
      return;
    }

    const now = new Date().toISOString();

    if (existingNote) {
      dispatch({
        type: ACTIONS.UPDATE_NOTE,
        payload: {
          id: existingNote.id,
          title: title.trim(),
          content,
          tags,
          updatedAt: now,
        },
      });
    } else {
      dispatch({
        type: ACTIONS.ADD_NOTE,
        payload: {
          id: Date.now().toString(),
          title: title.trim(),
          content,
          tags,
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    setIsDirty(false);
    navigation.goBack();
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (!tag) return;
    if (tags.includes(tag)) {
      setTagInput('');
      return;
    }
    setTags([...tags, tag]);
    setTagInput('');
  };

  const removeTag = (tag) => setTags(tags.filter((t) => t !== tag));

  const handleSummarize = async () => {
    if (!content.trim()) {
      Alert.alert('No Content', 'Add some content to the note before summarizing.');
      return;
    }
    setIsSummarizing(true);
    setSummary('');
    try {
      const result = await summarizeText(content, 'bullet-points');
      setSummary(result.summary);
    } catch (error) {
      Alert.alert('Error', `Could not summarize: ${error.message}`);
    } finally {
      setIsSummarizing(false);
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.toolbarStats}>
          <Text style={styles.statText}>{wordCount} words</Text>
          <Text style={styles.statDivider}>·</Text>
          <Text style={styles.statText}>{charCount} chars</Text>
        </View>
        <View style={styles.toolbarActions}>
          <TouchableOpacity
            style={styles.toolbarBtn}
            onPress={handleSummarize}
            disabled={isSummarizing}
          >
            {isSummarizing ? (
              <ActivityIndicator size="small" color={COLORS.secondary} />
            ) : (
              <Ionicons name="sparkles" size={20} color={COLORS.secondary} />
            )}
            <Text style={[styles.toolbarBtnText, { color: COLORS.secondary }]}>
              {isSummarizing ? 'Summarizing…' : 'Summarize'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toolbarBtn, styles.saveBtn, !isDirty && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!isDirty}
          >
            <Ionicons name="checkmark" size={20} color={isDirty ? '#fff' : COLORS.textLight} />
            <Text style={[styles.toolbarBtnText, { color: isDirty ? '#fff' : COLORS.textLight }]}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        {/* Title */}
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Note title…"
          placeholderTextColor={COLORS.border}
          fontSize={22}
          fontWeight="700"
          color={COLORS.text}
          returnKeyType="next"
          onSubmitEditing={() => contentRef.current?.focus()}
        />

        {/* Tags */}
        <View style={styles.tagsSection}>
          <View style={styles.tagsRow}>
            {tags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={styles.tag}
                onPress={() => removeTag(tag)}
              >
                <Text style={styles.tagText}>#{tag}</Text>
                <Ionicons name="close" size={12} color={COLORS.primary} />
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.tagInputRow}>
            <Ionicons name="pricetag-outline" size={16} color={COLORS.textLight} />
            <TextInput
              style={styles.tagInput}
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="Add tag…"
              placeholderTextColor={COLORS.textLight}
              onSubmitEditing={addTag}
              returnKeyType="done"
              blurOnSubmit={false}
            />
            {tagInput.length > 0 && (
              <TouchableOpacity onPress={addTag}>
                <Text style={styles.tagAddBtn}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Content */}
        <TextInput
          ref={contentRef}
          style={styles.contentInput}
          value={content}
          onChangeText={setContent}
          placeholder="Start writing your note here…"
          placeholderTextColor={COLORS.textLight}
          multiline
          textAlignVertical="top"
          scrollEnabled={false}
        />

        {/* AI Summary */}
        {summary.length > 0 && (
          <View style={styles.summaryBox}>
            <View style={styles.summaryHeader}>
              <Ionicons name="sparkles" size={16} color={COLORS.secondary} />
              <Text style={styles.summaryTitle}>AI Summary</Text>
              <TouchableOpacity onPress={() => setSummary('')} style={styles.summaryClose}>
                <Ionicons name="close" size={16} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
            <Text style={styles.summaryText}>{summary}</Text>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.card },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  toolbarStats: { flexDirection: 'row', alignItems: 'center' },
  statText: { fontSize: 12, color: COLORS.textLight },
  statDivider: { fontSize: 12, color: COLORS.textLight, marginHorizontal: 4 },
  toolbarActions: { flexDirection: 'row', gap: 8 },
  toolbarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  toolbarBtnText: { fontSize: 13, fontWeight: '600' },
  saveBtn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  saveBtnDisabled: { backgroundColor: COLORS.border, borderColor: COLORS.border },
  scrollView: { flex: 1 },
  titleInput: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  tagsSection: { paddingHorizontal: 16, paddingBottom: 8 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  tagInput: { flex: 1, fontSize: 13, color: COLORS.text },
  tagAddBtn: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 16, marginVertical: 8 },
  contentInput: {
    paddingHorizontal: 16,
    paddingTop: 8,
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 26,
    minHeight: 300,
  },
  summaryBox: {
    margin: 16,
    backgroundColor: COLORS.secondary + '10',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.secondary + '30',
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  summaryTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.secondary },
  summaryClose: { padding: 2 },
  summaryText: { fontSize: 14, color: COLORS.text, lineHeight: 22 },
});
