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

const CATEGORIES = ['All', 'Textbook', 'Article', 'Notes', 'Video', 'Other'];
const CATEGORY_COLORS = {
  Textbook: COLORS.primary,
  Article: COLORS.success,
  Notes: COLORS.secondary,
  Video: COLORS.danger,
  Other: COLORS.warning,
};

function LibraryItem({ item, onPress, onDelete }) {
  const color = CATEGORY_COLORS[item.category] || COLORS.textLight;
  return (
    <TouchableOpacity style={styles.itemCard} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.itemIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={categoryIcon(item.category)} size={24} color={color} />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.itemMeta}>
          <View style={[styles.categoryBadge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.categoryText, { color }]}>{item.category}</Text>
          </View>
          <Text style={styles.itemDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        {item.description ? (
          <Text style={styles.itemDescription} numberOfLines={2}>{item.description}</Text>
        ) : null}
      </View>
      <TouchableOpacity onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function categoryIcon(category) {
  const map = {
    Textbook: 'book',
    Article: 'newspaper',
    Notes: 'document-text',
    Video: 'play-circle',
    Other: 'folder',
  };
  return map[category] || 'folder';
}

function AddItemModal({ visible, onClose, onAdd }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Textbook');

  const handleAdd = () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a title.');
      return;
    }
    onAdd({ title: title.trim(), description: description.trim(), content: content.trim(), category });
    setTitle('');
    setDescription('');
    setContent('');
    setCategory('Textbook');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Add to Library</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={26} color={COLORS.text} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
          <Text style={styles.fieldLabel}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Chapter 3: Photosynthesis"
            placeholderTextColor={COLORS.textLight}
          />

          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryOption, category === cat && { backgroundColor: CATEGORY_COLORS[cat] }]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.categoryOptionText, category === cat && { color: '#fff' }]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Short description (optional)"
            placeholderTextColor={COLORS.textLight}
          />

          <Text style={styles.fieldLabel}>Content / Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={content}
            onChangeText={setContent}
            placeholder="Paste or type the study material content here…"
            placeholderTextColor={COLORS.textLight}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>Add to Library</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function LibraryScreen({ navigation }) {
  const { state, dispatch } = useApp();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [modalVisible, setModalVisible] = useState(false);

  const filtered = state.library.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAdd = (itemData) => {
    const newItem = {
      id: Date.now().toString(),
      ...itemData,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: ACTIONS.ADD_LIBRARY_ITEM, payload: newItem });
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Item', 'Remove this item from your library?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => dispatch({ type: ACTIONS.DELETE_LIBRARY_ITEM, payload: id }) },
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
          placeholder="Search library…"
          placeholderTextColor={COLORS.textLight}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryScrollContent}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterChip, activeCategory === cat && styles.filterChipActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.filterChipText, activeCategory === cat && styles.filterChipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <LibraryItem
            item={item}
            onPress={() => navigation.navigate('TextbookReader', { item })}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="library-outline" size={56} color={COLORS.border} />
            <Text style={styles.emptyTitle}>
              {search || activeCategory !== 'All' ? 'No matches found' : 'Your library is empty'}
            </Text>
            <Text style={styles.emptyText}>
              {search || activeCategory !== 'All'
                ? 'Try a different search or category'
                : 'Tap + to add textbooks, articles, or study materials'}
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <AddItemModal visible={modalVisible} onClose={() => setModalVisible(false)} onAdd={handleAdd} />
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
  categoryScroll: { maxHeight: 44 },
  categoryScrollContent: { paddingHorizontal: 12, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textLight },
  filterChipTextActive: { color: '#fff' },
  list: { padding: 12, paddingBottom: 100 },
  itemCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  itemIcon: { width: 46, height: 46, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  categoryText: { fontSize: 11, fontWeight: '700' },
  itemDate: { fontSize: 12, color: COLORS.textLight },
  itemDescription: { fontSize: 13, color: COLORS.textLight, lineHeight: 18 },
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
  // Modal
  modalContainer: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  modalBody: { padding: 16 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  textArea: { height: 140, textAlignVertical: 'top' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryOption: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  categoryOptionText: { fontSize: 13, fontWeight: '600', color: COLORS.textLight },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
