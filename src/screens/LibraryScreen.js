import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp, ACTIONS } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

const ADMIN_EMAIL = 'mikiyasmelese336@gmail.com';

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
  grade9: '#4A90E2',
  grade10: '#27AE60',
  grade11: '#7C4DFF',
  grade12: '#F39C12',
  natural: '#27AE60',
  social: '#E74C3C',
};

// ── Folder structure ──────────────────────────────────────────────────────────
const GRADE_9_10_SUBJECTS = [
  'English',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'History',
  'Geography',
  'Economics',
  'Physical Education & Fitness',
  'Citizenship & Moral',
];

const GRADE_11_12_NATURAL = [
  'English',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'ICT',
];

const GRADE_11_12_SOCIAL = [
  'English',
  'Mathematics',
  'Economics',
  'History',
  'Geography',
  'Citizenship & Moral',
];

const FOLDER_STRUCTURE = [
  {
    id: 'grade9',
    label: 'Grade 9',
    color: COLORS.grade9,
    icon: 'school',
    subjects: GRADE_9_10_SUBJECTS,
  },
  {
    id: 'grade10',
    label: 'Grade 10',
    color: COLORS.grade10,
    icon: 'school',
    subjects: GRADE_9_10_SUBJECTS,
  },
  {
    id: 'grade11',
    label: 'Grade 11',
    color: COLORS.grade11,
    icon: 'school',
    streams: [
      { id: 'natural', label: 'Natural', color: COLORS.natural, subjects: GRADE_11_12_NATURAL },
      { id: 'social', label: 'Social', color: COLORS.social, subjects: GRADE_11_12_SOCIAL },
    ],
  },
  {
    id: 'grade12',
    label: 'Grade 12',
    color: COLORS.grade12,
    icon: 'school',
    streams: [
      { id: 'natural', label: 'Natural', color: COLORS.natural, subjects: GRADE_11_12_NATURAL },
      { id: 'social', label: 'Social', color: COLORS.social, subjects: GRADE_11_12_SOCIAL },
    ],
  },
];

// ── Subject folder key helper ─────────────────────────────────────────────────
function subjectKey(gradeId, subject, streamId = null) {
  return streamId ? `${gradeId}_${streamId}_${subject}` : `${gradeId}_${subject}`;
}

// ── Subject Row ───────────────────────────────────────────────────────────────
function SubjectRow({ gradeId, subject, streamId, color, items, onPress, isAdmin, onAdd }) {
  const key = subjectKey(gradeId, subject, streamId);
  const count = items.filter((i) => i.folderKey === key).length;

  return (
    <TouchableOpacity style={styles.subjectRow} onPress={() => onPress(key, subject, color)} activeOpacity={0.7}>
      <View style={[styles.subjectIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name="document-text" size={16} color={color} />
      </View>
      <Text style={styles.subjectLabel}>{subject}</Text>
      {count > 0 && (
        <View style={[styles.countBadge, { backgroundColor: color + '20' }]}>
          <Text style={[styles.countText, { color }]}>{count}</Text>
        </View>
      )}
      {isAdmin && (
        <TouchableOpacity onPress={() => onAdd(key, subject, color)} style={styles.addSubjectBtn}>
          <Ionicons name="add-circle" size={20} color={color} />
        </TouchableOpacity>
      )}
      <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} style={{ marginLeft: 4 }} />
    </TouchableOpacity>
  );
}

// ── Stream Accordion ──────────────────────────────────────────────────────────
function StreamAccordion({ gradeId, stream, items, onSubjectPress, isAdmin, onAdd }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.streamContainer}>
      <TouchableOpacity
        style={[styles.streamHeader, { borderLeftColor: stream.color }]}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.8}
      >
        <View style={[styles.streamIcon, { backgroundColor: stream.color + '20' }]}>
          <Ionicons name={expanded ? 'folder-open' : 'folder'} size={18} color={stream.color} />
        </View>
        <Text style={[styles.streamLabel, { color: stream.color }]}>{stream.label}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={stream.color}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.subjectList}>
          {stream.subjects.map((subject) => (
            <SubjectRow
              key={subject}
              gradeId={gradeId}
              subject={subject}
              streamId={stream.id}
              color={stream.color}
              items={items}
              onPress={onSubjectPress}
              isAdmin={isAdmin}
              onAdd={onAdd}
            />
          ))}
        </View>
      )}
    </View>
  );
}

// ── Grade Accordion ───────────────────────────────────────────────────────────
function GradeAccordion({ grade, items, onSubjectPress, isAdmin, onAdd }) {
  const [expanded, setExpanded] = useState(false);

  const totalItems = items.filter((i) =>
    i.folderKey && i.folderKey.startsWith(grade.id)
  ).length;

  return (
    <View style={styles.gradeContainer}>
      <TouchableOpacity
        style={[styles.gradeHeader, { borderLeftColor: grade.color }]}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.8}
      >
        <View style={[styles.gradeIcon, { backgroundColor: grade.color + '20' }]}>
          <Ionicons name={expanded ? 'folder-open' : 'folder'} size={22} color={grade.color} />
        </View>
        <View style={styles.gradeInfo}>
          <Text style={[styles.gradeLabel, { color: grade.color }]}>{grade.label}</Text>
          {totalItems > 0 && (
            <Text style={styles.gradeCount}>{totalItems} item{totalItems !== 1 ? 's' : ''}</Text>
          )}
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={grade.color}
          style={{ marginLeft: 'auto' }}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.gradeContent}>
          {grade.streams ? (
            // Grade 11 & 12 — has streams
            grade.streams.map((stream) => (
              <StreamAccordion
                key={stream.id}
                gradeId={grade.id}
                stream={stream}
                items={items}
                onSubjectPress={onSubjectPress}
                isAdmin={isAdmin}
                onAdd={onAdd}
              />
            ))
          ) : (
            // Grade 9 & 10 — direct subjects
            grade.subjects.map((subject) => (
              <SubjectRow
                key={subject}
                gradeId={grade.id}
                subject={subject}
                color={grade.color}
                items={items}
                onPress={onSubjectPress}
                isAdmin={isAdmin}
                onAdd={onAdd}
              />
            ))
          )}
        </View>
      )}
    </View>
  );
}

// ── Subject Content Modal ─────────────────────────────────────────────────────
function SubjectModal({ visible, onClose, folderKey, subjectName, color, items, isAdmin, onDelete, onAddItem }) {
  const subjectItems = items.filter((i) => i.folderKey === folderKey);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={[styles.modalHeader, { borderBottomColor: color + '40' }]}>
          <View style={styles.modalHeaderLeft}>
            <View style={[styles.modalHeaderIcon, { backgroundColor: color + '20' }]}>
              <Ionicons name="document-text" size={20} color={color} />
            </View>
            <Text style={[styles.modalTitle, { color }]}>{subjectName}</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={26} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalBody}>
          {subjectItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color={COLORS.border} />
              <Text style={styles.emptyTitle}>No materials yet</Text>
              {isAdmin && <Text style={styles.emptyText}>Tap + to add study materials</Text>}
            </View>
          ) : (
            subjectItems.map((item) => (
              <TouchableOpacity key={item.id} style={styles.contentItem}>
                <View style={[styles.contentIcon, { backgroundColor: color + '15' }]}>
                  <Ionicons name="book-outline" size={18} color={color} />
                </View>
                <View style={styles.contentInfo}>
                  <Text style={styles.contentTitle}>{item.title}</Text>
                  {item.description ? (
                    <Text style={styles.contentDesc} numberOfLines={1}>{item.description}</Text>
                  ) : null}
                </View>
                {isAdmin && (
                  <TouchableOpacity onPress={() => onDelete(item.id)}>
                    <Ionicons name="trash-outline" size={17} color={COLORS.danger} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {isAdmin && (
          <TouchableOpacity style={[styles.modalFab, { backgroundColor: color }]} onPress={onAddItem}>
            <Ionicons name="add" size={26} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
}

// ── Add Item Modal ────────────────────────────────────────────────────────────
function AddItemModal({ visible, onClose, onAdd, folderKey, subjectName }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');

  const handleAdd = () => {
    if (!title.trim()) { Alert.alert('Required', 'Please enter a title.'); return; }
    onAdd({ title: title.trim(), description: description.trim(), content: content.trim(), folderKey, category: 'Textbook' });
    setTitle(''); setDescription(''); setContent('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add to {subjectName}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={26} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <ScrollView style={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.fieldLabel}>Title *</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Chapter 1: Introduction" placeholderTextColor={COLORS.textLight} />
          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Short description (optional)" placeholderTextColor={COLORS.textLight} />
          <Text style={styles.fieldLabel}>Content</Text>
          <TextInput style={[styles.input, styles.textArea]} value={content} onChangeText={setContent} placeholder="Paste study material content here…" placeholderTextColor={COLORS.textLight} multiline numberOfLines={6} textAlignVertical="top" />
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>Add Material</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Main LibraryScreen ────────────────────────────────────────────────────────
export default function LibraryScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const { user } = useAuth();
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const [search, setSearch] = useState('');
  const [subjectModal, setSubjectModal] = useState(null); // { folderKey, subjectName, color }
  const [addModal, setAddModal] = useState(null); // { folderKey, subjectName }

  const items = state.library;

  const handleAddItem = (data) => {
    const newItem = { id: Date.now().toString(), ...data, createdAt: new Date().toISOString() };
    dispatch({ type: ACTIONS.ADD_LIBRARY_ITEM, payload: newItem });
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Remove this material?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => dispatch({ type: ACTIONS.DELETE_LIBRARY_ITEM, payload: id }) },
    ]);
  };

  const openSubject = (folderKey, subjectName, color) => {
    setSubjectModal({ folderKey, subjectName, color });
  };

  const openAdd = (folderKey, subjectName, color) => {
    setAddModal({ folderKey, subjectName, color });
  };

  // Search results
  const searchResults = search.length > 1
    ? items.filter((i) =>
        i.title.toLowerCase().includes(search.toLowerCase()) ||
        (i.description || '').toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.textLight} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search all materials…"
          placeholderTextColor={COLORS.textLight}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {search.length > 1 ? (
        // Search results
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.contentItem}
              onPress={() => navigation.navigate('TextbookReader', { item })}
            >
              <View style={[styles.contentIcon, { backgroundColor: COLORS.primary + '15' }]}>
                <Ionicons name="book-outline" size={18} color={COLORS.primary} />
              </View>
              <View style={styles.contentInfo}>
                <Text style={styles.contentTitle}>{item.title}</Text>
                {item.description ? <Text style={styles.contentDesc} numberOfLines={1}>{item.description}</Text> : null}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No results found</Text>
            </View>
          }
        />
      ) : (
        // Folder structure
        <ScrollView contentContainerStyle={styles.list}>
          {FOLDER_STRUCTURE.map((grade) => (
            <GradeAccordion
              key={grade.id}
              grade={grade}
              items={items}
              onSubjectPress={openSubject}
              isAdmin={isAdmin}
              onAdd={openAdd}
            />
          ))}
        </ScrollView>
      )}

      {/* Subject content modal */}
      {subjectModal && (
        <SubjectModal
          visible={!!subjectModal}
          onClose={() => setSubjectModal(null)}
          folderKey={subjectModal.folderKey}
          subjectName={subjectModal.subjectName}
          color={subjectModal.color}
          items={items}
          isAdmin={isAdmin}
          onDelete={handleDelete}
          onAddItem={() => {
            setAddModal({ folderKey: subjectModal.folderKey, subjectName: subjectModal.subjectName });
            setSubjectModal(null);
          }}
        />
      )}

      {/* Add item modal */}
      {addModal && (
        <AddItemModal
          visible={!!addModal}
          onClose={() => setAddModal(null)}
          onAdd={handleAddItem}
          folderKey={addModal.folderKey}
          subjectName={addModal.subjectName}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, margin: 12, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },
  list: { padding: 12, paddingBottom: 40 },
  // Grade accordion
  gradeContainer: {
    backgroundColor: COLORS.card, borderRadius: 14, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
    overflow: 'hidden',
  },
  gradeHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderLeftWidth: 5,
  },
  gradeIcon: { width: 42, height: 42, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  gradeInfo: { flex: 1 },
  gradeLabel: { fontSize: 17, fontWeight: '800' },
  gradeCount: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  gradeContent: { paddingHorizontal: 12, paddingBottom: 8 },
  // Stream accordion
  streamContainer: { marginBottom: 6 },
  streamHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 12,
    backgroundColor: COLORS.background, borderRadius: 10,
    borderLeftWidth: 3, marginBottom: 2,
  },
  streamIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  streamLabel: { flex: 1, fontSize: 15, fontWeight: '700' },
  subjectList: { paddingLeft: 12 },
  // Subject row
  subjectRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 10,
    borderRadius: 8, marginBottom: 2,
    backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.border,
    marginTop: 4,
  },
  subjectIcon: { width: 28, height: 28, borderRadius: 7, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  subjectLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text },
  countBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginRight: 6 },
  countText: { fontSize: 12, fontWeight: '700' },
  addSubjectBtn: { padding: 2, marginRight: 4 },
  // Content item
  contentItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: 10,
    padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  contentIcon: { width: 36, height: 36, borderRadius: 9, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  contentInfo: { flex: 1 },
  contentTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  contentDesc: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 12 },
  emptyText: { fontSize: 13, color: COLORS.textLight, marginTop: 6 },
  // Modal
  modalContainer: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: COLORS.card,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalHeaderIcon: { width: 34, height: 34, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  modalBody: { padding: 16, paddingBottom: 80 },
  modalFab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 5,
  },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, padding: 12, fontSize: 15, color: COLORS.text,
  },
  textArea: { height: 140, textAlignVertical: 'top' },
  addButton: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 24,
  },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
