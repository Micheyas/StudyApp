import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { checkServerHealth } from '../services/aiService';

const COLORS = {
  primary: '#4A90E2',
  primaryDark: '#2C6FBF',
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

function StatCard({ icon, label, value, color, onPress }) {
  return (
    <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statInfo}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
    </TouchableOpacity>
  );
}

function QuickActionButton({ icon, label, color, onPress }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={26} color="#fff" />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const { state } = useApp();
  const [serverOnline, setServerOnline] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const { notes, library, quizzes, quizResults, settings } = state;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const checkServer = async () => {
    const online = await checkServerHealth();
    setServerOnline(online);
  };

  useEffect(() => {
    checkServer();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await checkServer();
    setRefreshing(false);
  };

  // Recent activity
  const recentNotes = notes.slice(0, 3);
  const avgScore =
    quizResults.length > 0
      ? Math.round(quizResults.reduce((sum, r) => sum + r.score, 0) / quizResults.length)
      : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()}{settings.userName ? `, ${settings.userName}` : ''}!</Text>
          <Text style={styles.headerSub}>Ready to study?</Text>
        </View>
        <View style={[styles.serverBadge, { backgroundColor: serverOnline === null ? COLORS.warning : serverOnline ? COLORS.success : COLORS.danger }]}>
          <Ionicons name={serverOnline ? 'cloud-done' : 'cloud-offline'} size={14} color="#fff" />
          <Text style={styles.serverBadgeText}>{serverOnline === null ? 'Checking…' : serverOnline ? 'AI Online' : 'AI Offline'}</Text>
        </View>
      </View>

      {/* Stats */}
      <Text style={styles.sectionTitle}>Overview</Text>
      <StatCard
        icon="document-text"
        label="Notes"
        value={notes.length}
        color={COLORS.primary}
        onPress={() => navigation.navigate('NotesTab')}
      />
      <StatCard
        icon="library"
        label="Library Items"
        value={library.length}
        color={COLORS.secondary}
        onPress={() => navigation.navigate('LibraryTab')}
      />
      <StatCard
        icon="checkmark-circle"
        label="Quizzes Taken"
        value={quizResults.length}
        color={COLORS.success}
        onPress={() => navigation.navigate('QuizTab')}
      />
      {avgScore !== null && (
        <StatCard
          icon="star"
          label="Average Quiz Score"
          value={`${avgScore}%`}
          color={COLORS.warning}
          onPress={() => navigation.navigate('QuizTab')}
        />
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <QuickActionButton
          icon="add-circle"
          label="New Note"
          color={COLORS.primary}
          onPress={() => navigation.navigate('NotesTab', { screen: 'NoteEditor' })}
        />
        <QuickActionButton
          icon="flash"
          label="Take Quiz"
          color={COLORS.secondary}
          onPress={() => navigation.navigate('QuizTab')}
        />
        <QuickActionButton
          icon="chatbubble-ellipses"
          label="Ask AI"
          color={COLORS.success}
          onPress={() => navigation.navigate('AITab')}
        />
        <QuickActionButton
          icon="book"
          label="Library"
          color={COLORS.warning}
          onPress={() => navigation.navigate('LibraryTab')}
        />
      </View>

      {/* Recent Notes */}
      {recentNotes.length > 0 && (
        <>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Recent Notes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('NotesTab')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {recentNotes.map((note) => (
            <TouchableOpacity
              key={note.id}
              style={styles.recentNote}
              onPress={() => navigation.navigate('NotesTab', { screen: 'NoteEditor', params: { noteId: note.id } })}
              activeOpacity={0.8}
            >
              <View style={styles.recentNoteIcon}>
                <Ionicons name="document-text" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.recentNoteInfo}>
                <Text style={styles.recentNoteTitle} numberOfLines={1}>{note.title || 'Untitled Note'}</Text>
                <Text style={styles.recentNoteDate}>
                  {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Empty state */}
      {notes.length === 0 && library.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="school" size={64} color={COLORS.border} />
          <Text style={styles.emptyTitle}>Welcome to StudyApp!</Text>
          <Text style={styles.emptyText}>
            Start by adding a note, uploading a study material, or asking the AI assistant a question.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  headerSub: { fontSize: 14, color: COLORS.textLight, marginTop: 2 },
  serverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  serverBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 10, marginTop: 8 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  seeAll: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  statCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  statInfo: { flex: 1 },
  statValue: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  statLabel: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  quickAction: { alignItems: 'center', flex: 1 },
  quickActionIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  quickActionLabel: { fontSize: 12, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
  recentNote: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  recentNoteIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  recentNoteInfo: { flex: 1 },
  recentNoteTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  recentNoteDate: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingTop: 48, paddingBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', lineHeight: 22, paddingHorizontal: 16 },
});
