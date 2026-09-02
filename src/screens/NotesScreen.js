import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

// Pastel tag colors cycling for variety
const TAG_COLORS = ['#4A90E2', '#7C4DFF', '#27AE60', '#F39C12', '#E74C3C', '#00BCD4'];

function NoteCard({ note, onPress, onDelete, index }) {
  const accentColor = TAG_COLORS[index % TAG_COLORS.length];
  const preview = note.content ? note.content.replace(/\n/g, ' ').trim() : '';

  return (
    <TouchableOpacity style={[styles.noteCard, { borderLeftColor: accentColor }]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.noteCardHeader}>
        <Text style={styles.noteTitle} numberOfLines={1}>{note.title || 'Untitled Note'}</Text>
        <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="trash-outline" size={17} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
      {preview.length > 0 && (
        <Text style={styles.notePreview} numberOfLines={2}>{preview}</Text>
      )}
      <View style={styles.noteFooter}>
        <View style={styles.noteMeta}>
          {note.tags && note.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {note.tags.slice(0, 3).map((tag, i) => (
                <View key={i} style={[styles.tagBadge, { backgroundColor: TAG_COLORS[i % TAG_COLORS.length] + '20' }]}>
                  <Text style={[styles.tagText, { color: TAG_COLORS[i % TAG_COLORS.length] }]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <Text style={styles.noteDate}>
          {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function NotesScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'title'

  const filtered = state.notes
    .filter((note) => {
      const q = search.toLowerCase();
      return (
        (note.title || '').toLowerCase().includes(q) ||
        (note.content || '').toLowerCase().includes(q) ||
        (note.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
    });

  const handleDelete = (id) => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => dispatch({ type: ACTIONS.DELETE_NOTE, payload: id }),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.textLight} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search notes…"
          placeholderTextColor={COLORS.textLight}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Sort controls */}
      <View style={styles.sortRow}>
        <Text style={styles.countText}>{filtered.length} note{filtered.length !== 1 ? 's' : ''}</Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[styles.sortBtn, sortBy === 'date' && styles.sortBtnActive]}
            onPress={() => setSortBy('date')}
          >
            <Ionicons name="time-outline" size={14} color={sortBy === 'date' ? '#fff' : COLORS.textLight} />
            <Text style={[styles.sortBtnText, sortBy === 'date' && styles.sortBtnTextActive]}>Recent</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortBtn, sortBy === 'title' && styles.sortBtnActive]}
            onPress={() => setSortBy('title')}
          >
            <Ionicons name="text-outline" size={14} color={sortBy === 'title' ? '#fff' : COLORS.textLight} />
            <Text style={[styles.sortBtnText, sortBy === 'title' && styles.sortBtnTextActive]}>A–Z</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notes list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <NoteCard
            note={item}
            index={index}
            onPress={() => navigation.navigate('NoteEditor', { noteId: item.id })}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={60} color={COLORS.border} />
            <Text style={styles.emptyTitle}>
              {search ? 'No notes match your search' : 'No notes yet'}
            </Text>
            <Text style={styles.emptyText}>
              {search
                ? 'Try a different keyword'
                : 'Tap the + button to create your first note'}
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NoteEditor', {})}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    margin: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.text },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  countText: { fontSize: 13, color: COLORS.textLight, fontWeight: '500' },
  sortButtons: { flexDirection: 'row', gap: 6 },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  sortBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.textLight },
  sortBtnTextActive: { color: '#fff' },
  list: { padding: 12, paddingBottom: 100 },
  noteCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  noteCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  noteTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.text, marginRight: 8 },
  notePreview: { fontSize: 13, color: COLORS.textLight, lineHeight: 19, marginBottom: 8 },
  noteFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  noteMeta: { flex: 1 },
  tagsRow: { flexDirection: 'row', gap: 6 },
  tagBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  tagText: { fontSize: 11, fontWeight: '700' },
  noteDate: { fontSize: 11, color: COLORS.textLight },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: 14, marginBottom: 6 },
  emptyText: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', paddingHorizontal: 32 },
});
