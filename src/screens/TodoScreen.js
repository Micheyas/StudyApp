import React, { useState, useEffect, useCallback } from 'react';
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
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../context/AuthContext';

// ── Notification handler (show when app is foregrounded too) ──────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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

const PRIORITIES = [
  { label: 'Low', color: COLORS.success, icon: 'arrow-down' },
  { label: 'Medium', color: COLORS.warning, icon: 'remove' },
  { label: 'High', color: COLORS.danger, icon: 'arrow-up' },
];

const STORAGE_KEY = '@studyapp_todos';

// ── Request notification permissions ─────────────────────────────────────────
async function requestPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    return status === 'granted';
  }
  return true;
}

// ── Schedule a notification/alarm ─────────────────────────────────────────────
async function scheduleAlarm(todo) {
  if (!todo.alarmEnabled || !todo.alarmTime) return null;

  const granted = await requestPermissions();
  if (!granted) {
    Alert.alert('Permission Required', 'Please enable notifications to use alarms.');
    return null;
  }

  // Cancel existing notification for this todo
  if (todo.notificationId) {
    await Notifications.cancelScheduledNotificationAsync(todo.notificationId).catch(() => {});
  }

  const alarmDate = new Date(todo.alarmTime);
  if (alarmDate <= new Date()) {
    return null; // time is in the past
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '⏰ StudyApp Reminder',
      body: todo.title,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
      vibrate: [0, 250, 250, 250],
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: alarmDate,
      channelId: 'alarms',
    },
  });

  return id;
}

// ── Cancel a scheduled alarm ──────────────────────────────────────────────────
async function cancelAlarm(notificationId) {
  if (notificationId) {
    await Notifications.cancelScheduledNotificationAsync(notificationId).catch(() => {});
  }
}

// ── Simple time picker component ──────────────────────────────────────────────
function TimePicker({ value, onChange }) {
  const date = value ? new Date(value) : new Date();
  const [hour, setHour] = useState(date.getHours());
  const [minute, setMinute] = useState(date.getMinutes());
  const [dayOffset, setDayOffset] = useState(0); // 0=today, 1=tomorrow

  const updateTime = (h, m, offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    d.setHours(h, m, 0, 0);
    onChange(d.toISOString());
  };

  const changeHour = (delta) => {
    const h = (hour + delta + 24) % 24;
    setHour(h);
    updateTime(h, minute, dayOffset);
  };

  const changeMinute = (delta) => {
    const m = (minute + delta + 60) % 60;
    setMinute(m);
    updateTime(hour, m, dayOffset);
  };

  const changeDay = (offset) => {
    setDayOffset(offset);
    updateTime(hour, minute, offset);
  };

  return (
    <View style={tpStyles.container}>
      {/* Day selector */}
      <View style={tpStyles.dayRow}>
        {['Today', 'Tomorrow'].map((label, i) => (
          <TouchableOpacity
            key={label}
            style={[tpStyles.dayBtn, dayOffset === i && tpStyles.dayBtnActive]}
            onPress={() => changeDay(i)}
          >
            <Text style={[tpStyles.dayBtnText, dayOffset === i && tpStyles.dayBtnTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Time selector */}
      <View style={tpStyles.timeRow}>
        {/* Hours */}
        <View style={tpStyles.unit}>
          <TouchableOpacity onPress={() => changeHour(1)} style={tpStyles.arrow}>
            <Ionicons name="chevron-up" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={tpStyles.timeValue}>{String(hour).padStart(2, '0')}</Text>
          <TouchableOpacity onPress={() => changeHour(-1)} style={tpStyles.arrow}>
            <Ionicons name="chevron-down" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <Text style={tpStyles.colon}>:</Text>

        {/* Minutes */}
        <View style={tpStyles.unit}>
          <TouchableOpacity onPress={() => changeMinute(5)} style={tpStyles.arrow}>
            <Ionicons name="chevron-up" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={tpStyles.timeValue}>{String(minute).padStart(2, '0')}</Text>
          <TouchableOpacity onPress={() => changeMinute(-5)} style={tpStyles.arrow}>
            <Ionicons name="chevron-down" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={tpStyles.preview}>
        Alarm: {new Date(value || new Date()).toLocaleString([], {
          weekday: 'short', month: 'short', day: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })}
      </Text>
    </View>
  );
}

const tpStyles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 8 },
  dayRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  dayBtn: {
    paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  dayBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dayBtnText: { fontSize: 14, fontWeight: '600', color: COLORS.textLight },
  dayBtnTextActive: { color: '#fff' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  unit: { alignItems: 'center' },
  arrow: { padding: 6 },
  timeValue: { fontSize: 40, fontWeight: '800', color: COLORS.text, width: 70, textAlign: 'center' },
  colon: { fontSize: 36, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  preview: { fontSize: 13, color: COLORS.textLight, marginTop: 12, fontWeight: '500' },
});

// ── Add/Edit Todo Modal ───────────────────────────────────────────────────────
function TodoModal({ visible, onClose, onSave, editTodo }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(1);
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [alarmTime, setAlarmTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d.toISOString();
  });

  useEffect(() => {
    if (editTodo) {
      setTitle(editTodo.title || '');
      setDescription(editTodo.description || '');
      setPriority(editTodo.priority ?? 1);
      setAlarmEnabled(editTodo.alarmEnabled || false);
      setAlarmTime(editTodo.alarmTime || alarmTime);
    } else {
      setTitle('');
      setDescription('');
      setPriority(1);
      setAlarmEnabled(false);
      const d = new Date();
      d.setHours(d.getHours() + 1, 0, 0, 0);
      setAlarmTime(d.toISOString());
    }
  }, [editTodo, visible]);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a task title.');
      return;
    }
    onSave({ title: title.trim(), description: description.trim(), priority, alarmEnabled, alarmTime });
  };

  const p = PRIORITIES[priority];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={modalStyles.container}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>{editTodo ? 'Edit Task' : 'New Task'}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={26} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={modalStyles.body} keyboardShouldPersistTaps="handled">
          {/* Title */}
          <Text style={modalStyles.label}>Task *</Text>
          <TextInput
            style={modalStyles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="What do you need to do?"
            placeholderTextColor={COLORS.textLight}
            autoFocus
          />

          {/* Description */}
          <Text style={modalStyles.label}>Notes</Text>
          <TextInput
            style={[modalStyles.input, modalStyles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Add details (optional)"
            placeholderTextColor={COLORS.textLight}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Priority */}
          <Text style={modalStyles.label}>Priority</Text>
          <View style={modalStyles.priorityRow}>
            {PRIORITIES.map((p, i) => (
              <TouchableOpacity
                key={p.label}
                style={[modalStyles.priorityBtn, priority === i && { backgroundColor: p.color, borderColor: p.color }]}
                onPress={() => setPriority(i)}
              >
                <Ionicons name={p.icon} size={14} color={priority === i ? '#fff' : p.color} />
                <Text style={[modalStyles.priorityBtnText, priority === i && { color: '#fff' }]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Alarm toggle */}
          <View style={modalStyles.alarmRow}>
            <View style={modalStyles.alarmLeft}>
              <Ionicons name="alarm" size={20} color={alarmEnabled ? COLORS.primary : COLORS.textLight} />
              <View>
                <Text style={modalStyles.alarmTitle}>Set Alarm</Text>
                <Text style={modalStyles.alarmSub}>Sounds even when phone is locked</Text>
              </View>
            </View>
            <Switch
              value={alarmEnabled}
              onValueChange={setAlarmEnabled}
              trackColor={{ false: COLORS.border, true: COLORS.primary + '60' }}
              thumbColor={alarmEnabled ? COLORS.primary : '#f4f3f4'}
            />
          </View>

          {/* Time picker */}
          {alarmEnabled && (
            <View style={modalStyles.timePickerBox}>
              <TimePicker value={alarmTime} onChange={setAlarmTime} />
            </View>
          )}

          {/* Save */}
          <TouchableOpacity style={modalStyles.saveBtn} onPress={handleSave}>
            <Ionicons name="checkmark" size={20} color="#fff" />
            <Text style={modalStyles.saveBtnText}>{editTodo ? 'Save Changes' : 'Add Task'}</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: COLORS.card,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  body: { padding: 16 },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8, marginTop: 14 },
  input: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, padding: 12, fontSize: 15, color: COLORS.text,
  },
  textArea: { height: 90, textAlignVertical: 'top' },
  priorityRow: { flexDirection: 'row', gap: 10 },
  priorityBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card,
  },
  priorityBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.textLight },
  alarmRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginTop: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  alarmLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  alarmTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  alarmSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  timePickerBox: {
    backgroundColor: COLORS.card, borderRadius: 12, padding: 16, marginTop: 10,
    borderWidth: 1, borderColor: COLORS.primary + '30',
  },
  saveBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, marginTop: 24,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

// ── Todo Card ─────────────────────────────────────────────────────────────────
function TodoCard({ todo, onToggle, onEdit, onDelete }) {
  const p = PRIORITIES[todo.priority ?? 1];
  const isOverdue = todo.alarmEnabled && todo.alarmTime && new Date(todo.alarmTime) < new Date() && !todo.completed;

  return (
    <View style={[cardStyles.card, todo.completed && cardStyles.cardCompleted]}>
      <TouchableOpacity style={cardStyles.checkbox} onPress={onToggle}>
        <View style={[cardStyles.check, todo.completed && cardStyles.checkDone]}>
          {todo.completed && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
      </TouchableOpacity>

      <View style={cardStyles.content}>
        <Text style={[cardStyles.title, todo.completed && cardStyles.titleDone]} numberOfLines={2}>
          {todo.title}
        </Text>
        {todo.description ? (
          <Text style={cardStyles.desc} numberOfLines={1}>{todo.description}</Text>
        ) : null}
        <View style={cardStyles.meta}>
          <View style={[cardStyles.priorityBadge, { backgroundColor: p.color + '20' }]}>
            <Ionicons name={p.icon} size={10} color={p.color} />
            <Text style={[cardStyles.priorityText, { color: p.color }]}>{p.label}</Text>
          </View>
          {todo.alarmEnabled && todo.alarmTime && (
            <View style={[cardStyles.alarmBadge, isOverdue && cardStyles.alarmBadgeOverdue]}>
              <Ionicons
                name="alarm"
                size={11}
                color={isOverdue ? COLORS.danger : COLORS.primary}
              />
              <Text style={[cardStyles.alarmText, isOverdue && cardStyles.alarmTextOverdue]}>
                {new Date(todo.alarmTime).toLocaleString([], {
                  month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={cardStyles.actions}>
        <TouchableOpacity onPress={onEdit} style={cardStyles.actionBtn}>
          <Ionicons name="pencil" size={16} color={COLORS.textLight} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={cardStyles.actionBtn}>
          <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: COLORS.card, borderRadius: 12, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardCompleted: { opacity: 0.6 },
  checkbox: { marginRight: 12, marginTop: 2 },
  check: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  checkDone: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: COLORS.text, lineHeight: 21 },
  titleDone: { textDecorationLine: 'line-through', color: COLORS.textLight },
  desc: { fontSize: 13, color: COLORS.textLight, marginTop: 3 },
  meta: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  priorityBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  priorityText: { fontSize: 11, fontWeight: '700' },
  alarmBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
    backgroundColor: COLORS.primary + '15',
  },
  alarmBadgeOverdue: { backgroundColor: COLORS.danger + '15' },
  alarmText: { fontSize: 11, fontWeight: '600', color: COLORS.primary },
  alarmTextOverdue: { color: COLORS.danger },
  actions: { gap: 8, marginLeft: 8 },
  actionBtn: { padding: 4 },
});

// ── Main TodoScreen ───────────────────────────────────────────────────────────
export default function TodoScreen() {
  const { user, signOutUser } = useAuth();
  const [todos, setTodos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTodo, setEditTodo] = useState(null);
  const [filter, setFilter] = useState('all'); // all | active | completed

  const storageKey = `${STORAGE_KEY}_${user?.uid || 'guest'}`;

  // Load todos
  useEffect(() => {
    AsyncStorage.getItem(storageKey).then((data) => {
      if (data) setTodos(JSON.parse(data));
    });
  }, [storageKey]);

  // Save todos
  useEffect(() => {
    AsyncStorage.setItem(storageKey, JSON.stringify(todos));
  }, [todos, storageKey]);

  // Register notification channel (Android)
  useEffect(() => {
    Notifications.setNotificationChannelAsync('alarms', {
      name: 'Study Alarms',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: true,
    });
  }, []);

  const saveTodo = async (data) => {
    if (editTodo) {
      // Update existing
      const updated = {
        ...editTodo,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      // Reschedule alarm
      const notificationId = await scheduleAlarm(updated);
      if (notificationId) updated.notificationId = notificationId;
      else if (!data.alarmEnabled && updated.notificationId) {
        await cancelAlarm(updated.notificationId);
        updated.notificationId = null;
      }
      setTodos((prev) => prev.map((t) => (t.id === editTodo.id ? updated : t)));
    } else {
      // Create new
      const newTodo = {
        id: Date.now().toString(),
        ...data,
        completed: false,
        createdAt: new Date().toISOString(),
        notificationId: null,
      };
      const notificationId = await scheduleAlarm(newTodo);
      if (notificationId) newTodo.notificationId = notificationId;
      setTodos((prev) => [newTodo, ...prev]);
    }
    setModalVisible(false);
    setEditTodo(null);
  };

  const toggleTodo = async (id) => {
    setTodos((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, completed: !t.completed };
        if (updated.completed && updated.notificationId) {
          cancelAlarm(updated.notificationId);
          updated.notificationId = null;
        }
        return updated;
      })
    );
  };

  const deleteTodo = (id) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const todo = todos.find((t) => t.id === id);
          if (todo?.notificationId) await cancelAlarm(todo.notificationId);
          setTodos((prev) => prev.filter((t) => t.id !== id));
        },
      },
    ]);
  };

  const openEdit = (todo) => {
    setEditTodo(todo);
    setModalVisible(true);
  };

  const filtered = todos.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <View style={styles.container}>
      {/* User header */}
      <View style={styles.userBar}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.displayName || user?.email}
            </Text>
            <Text style={styles.userSub}>{activeCount} task{activeCount !== 1 ? 's' : ''} remaining</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => Alert.alert('Sign Out', 'Sign out of your account?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign Out', style: 'destructive', onPress: signOutUser },
        ])}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {[
          { key: 'all', label: `All (${todos.length})` },
          { key: 'active', label: `Active (${activeCount})` },
          { key: 'completed', label: `Done (${completedCount})` },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterBtnText, filter === f.key && styles.filterBtnTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Todo list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TodoCard
            todo={item}
            onToggle={() => toggleTodo(item.id)}
            onEdit={() => openEdit(item)}
            onDelete={() => deleteTodo(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle-outline" size={60} color={COLORS.border} />
            <Text style={styles.emptyTitle}>
              {filter === 'completed' ? 'No completed tasks' : 'No tasks yet'}
            </Text>
            <Text style={styles.emptyText}>
              {filter === 'completed'
                ? 'Complete some tasks to see them here'
                : 'Tap + to add your first task'}
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => { setEditTodo(null); setModalVisible(true); }}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <TodoModal
        visible={modalVisible}
        onClose={() => { setModalVisible(false); setEditTodo(null); }}
        onSave={saveTodo}
        editTodo={editTodo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  userBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  userName: { fontSize: 14, fontWeight: '600', color: COLORS.text, maxWidth: 200 },
  userSub: { fontSize: 12, color: COLORS.textLight },
  filterRow: {
    flexDirection: 'row', backgroundColor: COLORS.card,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  filterBtn: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  filterBtnActive: { borderBottomColor: COLORS.primary },
  filterBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.textLight },
  filterBtnTextActive: { color: COLORS.primary },
  list: { padding: 12, paddingBottom: 100 },
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: 14, marginBottom: 6 },
  emptyText: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', paddingHorizontal: 32 },
});
