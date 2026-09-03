import React, { useState } from 'react';
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

const COLORS = {
  primary: '#4A90E2',
  primaryDark: '#2C6FBF',
  secondary: '#7C4DFF',
  success: '#27AE60',
  warning: '#F39C12',
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#2C3E50',
  textLight: '#7F8C8D',
  border: '#E9ECEF',
};

const CATEGORY_COLORS = {
  Textbook: COLORS.primary,
  Article: COLORS.success,
  Notes: COLORS.secondary,
  Video: '#E74C3C',
  Other: COLORS.warning,
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
  const [refreshing, setRefreshing] = useState(false);

  const { library, settings } = state;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const recentItems = library.slice(0, 3);

  // Count by category
  const categoryCounts = library.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

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
        <View style={styles.headerIcon}>
          <Ionicons name="school" size={28} color={COLORS.primary} />
        </View>
      </View>

      {/* Stats */}
      <Text style={styles.sectionTitle}>Your Library</Text>
      <StatCard
        icon="library"
        label="Total Items"
        value={library.length}
        color={COLORS.primary}
        onPress={() => navigation.navigate('LibraryTab')}
      />
      {Object.entries(categoryCounts).map(([category, count]) => (
        <StatCard
          key={category}
          icon={categoryIcon(category)}
          label={category}
          value={count}
          color={CATEGORY_COLORS[category] || COLORS.textLight}
          onPress={() => navigation.navigate('LibraryTab')}
        />
      ))}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickActions}>
        <QuickActionButton
          icon="add-circle"
          label="Add Item"
          color={COLORS.primary}
          onPress={() => navigation.navigate('LibraryTab')}
        />
        <QuickActionButton
          icon="book-outline"
          label="Browse"
          color={COLORS.secondary}
          onPress={() => navigation.navigate('LibraryTab')}
        />
      </View>

      {/* Recent Items */}
      {recentItems.length > 0 && (
        <>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Recently Added</Text>
            <TouchableOpacity onPress={() => navigation.navigate('LibraryTab')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {recentItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.recentItem}
              onPress={() => navigation.navigate('LibraryTab', { screen: 'TextbookReader', params: { item } })}
              activeOpacity={0.8}
            >
              <View style={[styles.recentItemIcon, { backgroundColor: (CATEGORY_COLORS[item.category] || COLORS.primary) + '15' }]}>
                <Ionicons name={categoryIcon(item.category)} size={20} color={CATEGORY_COLORS[item.category] || COLORS.primary} />
              </View>
              <View style={styles.recentItemInfo}>
                <Text style={styles.recentItemTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.recentItemDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textLight} />
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Empty state */}
      {library.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="school" size={64} color={COLORS.border} />
          <Text style={styles.emptyTitle}>Welcome to StudyApp!</Text>
          <Text style={styles.emptyText}>
            Go to the Library tab to add your study materials — textbooks, articles, notes, and more.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => navigation.navigate('LibraryTab')}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.emptyBtnText}>Go to Library</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
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
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  quickActions: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  quickAction: { alignItems: 'center', flex: 1 },
  quickActionIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  quickActionLabel: { fontSize: 12, fontWeight: '600', color: COLORS.text, textAlign: 'center' },
  recentItem: {
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
  recentItemIcon: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  recentItemInfo: { flex: 1 },
  recentItemTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  recentItemDate: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingTop: 48, paddingBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', lineHeight: 22, paddingHorizontal: 16, marginBottom: 20 },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
