import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { sendChatMessage, checkServerHealth } from '../services/aiService';

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
  userBubble: '#4A90E2',
  aiBubble: '#FFFFFF',
};

const SUGGESTED_PROMPTS = [
  'Explain this concept in simple terms',
  'Give me a study plan for this topic',
  'What are the key points I should remember?',
  'Create practice questions for me',
  'Summarize what I should study today',
  'Help me understand why this matters',
];

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const isError = message.isError;

  return (
    <View style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAI]}>
      {!isUser && (
        <View style={styles.avatar}>
          <Ionicons name="sparkles" size={16} color={COLORS.secondary} />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAI,
          isError && styles.bubbleError,
        ]}
      >
        {message.isTyping ? (
          <View style={styles.typingIndicator}>
            <TypingDot delay={0} />
            <TypingDot delay={150} />
            <TypingDot delay={300} />
          </View>
        ) : (
          <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAI, isError && styles.bubbleTextError]}>
            {message.content}
          </Text>
        )}
        <Text style={[styles.bubbleTime, isUser ? styles.bubbleTimeUser : styles.bubbleTimeAI]}>
          {message.timestamp
            ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : ''}
        </Text>
      </View>
      {isUser && (
        <View style={[styles.avatar, styles.avatarUser]}>
          <Ionicons name="person" size={16} color="#fff" />
        </View>
      )}
    </View>
  );
}

function TypingDot({ delay }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => setVisible((v) => !v), 600);
    return () => clearInterval(interval);
  }, []);
  return (
    <View style={[styles.dot, { opacity: visible ? 1 : 0.2, marginLeft: delay > 0 ? 4 : 0 }]} />
  );
}

export default function AIAssistantScreen() {
  const { state } = useApp();
  const [messages, setMessages] = useState([
    {
      id: '0',
      role: 'assistant',
      content: "Hi! I'm your AI study assistant. Ask me anything about your studies — I can explain concepts, create practice questions, help you review material, and more. What would you like to work on?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverOnline, setServerOnline] = useState(true); // assume online, don't block user
  const [contextModalVisible, setContextModalVisible] = useState(false);
  const [selectedContext, setSelectedContext] = useState(null); // library item or note

  const flatListRef = useRef(null);

  useEffect(() => {
    checkServerHealth().then(setServerOnline);
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSend = async (text = inputText) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    const typingMessage = {
      id: 'typing',
      role: 'assistant',
      content: '',
      isTyping: true,
      timestamp: null,
    };

    setMessages((prev) => [...prev, userMessage, typingMessage]);
    setInputText('');
    setIsLoading(true);
    scrollToBottom();

    try {
      // Build message history (exclude typing indicator)
      const history = [...messages, userMessage]
        .filter((m) => !m.isTyping && !m.isError)
        .map(({ role, content }) => ({ role, content }));

      // Build context string from selected library item or note
      const contextStr = selectedContext
        ? `Title: ${selectedContext.title}\n\n${selectedContext.content || selectedContext.description || ''}`
        : null;

      const response = await sendChatMessage(history, contextStr);

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev.filter((m) => !m.isTyping), aiMessage]);
    } catch (error) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I couldn't connect to the AI server. Error: ${error.message}`,
        isError: true,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev.filter((m) => !m.isTyping), errorMessage]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const handleClearChat = () => {
    Alert.alert('Clear Chat', 'Start a new conversation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () =>
          setMessages([
            {
              id: Date.now().toString(),
              role: 'assistant',
              content: "Chat cleared! What would you like to study?",
              timestamp: new Date().toISOString(),
            },
          ]),
      },
    ]);
  };

  const contextItems = [
    ...state.library.map((item) => ({ ...item, type: 'library' })),
    ...state.notes.map((note) => ({ ...note, type: 'note' })),
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header bar */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <View style={[styles.serverDot, { backgroundColor: serverOnline ? COLORS.success : COLORS.danger }]} />
          <Text style={styles.headerStatus}>
            {serverOnline === null ? 'Connecting…' : serverOnline ? 'AI Online' : 'AI Offline'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerBtn, selectedContext && styles.headerBtnActive]}
            onPress={() => setContextModalVisible(true)}
          >
            <Ionicons name="book-outline" size={18} color={selectedContext ? COLORS.primary : COLORS.textLight} />
            <Text style={[styles.headerBtnText, selectedContext && styles.headerBtnTextActive]}>
              {selectedContext ? selectedContext.title.substring(0, 14) + (selectedContext.title.length > 14 ? '…' : '') : 'Add Context'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={handleClearChat}>
            <Ionicons name="trash-outline" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Active context indicator */}
      {selectedContext && (
        <View style={styles.contextBanner}>
          <Ionicons name="book" size={13} color={COLORS.primary} />
          <Text style={styles.contextBannerText} numberOfLines={1}>
            Context: {selectedContext.title}
          </Text>
          <TouchableOpacity onPress={() => setSelectedContext(null)}>
            <Ionicons name="close-circle" size={16} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        renderItem={({ item }) => <MessageBubble message={item} />}
        onContentSizeChange={scrollToBottom}
        showsVerticalScrollIndicator={false}
      />

      {/* Suggested prompts (show when only greeting is present) */}
      {messages.length === 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionsScroll}
          contentContainerStyle={styles.suggestionsContent}
        >
          {SUGGESTED_PROMPTS.map((prompt, i) => (
            <TouchableOpacity
              key={i}
              style={styles.suggestionChip}
              onPress={() => handleSend(prompt)}
            >
              <Text style={styles.suggestionText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask me anything…"
          placeholderTextColor={COLORS.textLight}
          multiline
          maxLength={2000}
          onSubmitEditing={() => handleSend()}
          returnKeyType="send"
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!inputText.trim() || isLoading) && styles.sendBtnDisabled]}
          onPress={() => handleSend()}
          disabled={!inputText.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      {/* Context picker modal */}
      <Modal
        visible={contextModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setContextModalVisible(false)}
      >
        <View style={styles.contextModal}>
          <View style={styles.contextModalHeader}>
            <Text style={styles.contextModalTitle}>Select Study Context</Text>
            <TouchableOpacity onPress={() => setContextModalVisible(false)}>
              <Ionicons name="close" size={26} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.contextModalSub}>
            Give the AI context from your library or notes so it can give better answers.
          </Text>
          <ScrollView contentContainerStyle={styles.contextList}>
            <TouchableOpacity
              style={[styles.contextItem, !selectedContext && styles.contextItemActive]}
              onPress={() => { setSelectedContext(null); setContextModalVisible(false); }}
            >
              <Ionicons name="close-circle-outline" size={20} color={COLORS.textLight} />
              <Text style={styles.contextItemText}>No context (general chat)</Text>
            </TouchableOpacity>
            {contextItems.length === 0 && (
              <Text style={styles.contextEmpty}>
                No items in your library or notes yet. Add some first!
              </Text>
            )}
            {contextItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.contextItem, selectedContext?.id === item.id && styles.contextItemActive]}
                onPress={() => { setSelectedContext(item); setContextModalVisible(false); }}
              >
                <Ionicons
                  name={item.type === 'library' ? 'library-outline' : 'document-text-outline'}
                  size={20}
                  color={item.type === 'library' ? COLORS.primary : COLORS.secondary}
                />
                <View style={styles.contextItemInfo}>
                  <Text style={styles.contextItemTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.contextItemMeta}>
                    {item.type === 'library' ? item.category : 'Note'}
                  </Text>
                </View>
                {selectedContext?.id === item.id && (
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  serverDot: { width: 8, height: 8, borderRadius: 4 },
  headerStatus: { fontSize: 13, fontWeight: '600', color: COLORS.textLight },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
  headerBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.textLight },
  headerBtnTextActive: { color: COLORS.primary },
  contextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: COLORS.primary + '10',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary + '20',
  },
  contextBannerText: { flex: 1, fontSize: 12, fontWeight: '600', color: COLORS.primary },
  messagesList: { padding: 12, paddingBottom: 8 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  messageRowUser: { justifyContent: 'flex-end' },
  messageRowAI: { justifyContent: 'flex-start' },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  avatarUser: { backgroundColor: COLORS.primary, marginRight: 0, marginLeft: 6 },
  bubble: {
    maxWidth: '75%',
    borderRadius: 18,
    padding: 12,
    paddingHorizontal: 14,
  },
  bubbleUser: {
    backgroundColor: COLORS.userBubble,
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: COLORS.aiBubble,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bubbleError: { backgroundColor: COLORS.danger + '15', borderColor: COLORS.danger + '40' },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  bubbleTextUser: { color: '#fff' },
  bubbleTextAI: { color: COLORS.text },
  bubbleTextError: { color: COLORS.danger },
  bubbleTime: { fontSize: 10, marginTop: 4 },
  bubbleTimeUser: { color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
  bubbleTimeAI: { color: COLORS.textLight },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', padding: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.textLight },
  suggestionsScroll: { maxHeight: 50 },
  suggestionsContent: { paddingHorizontal: 12, gap: 8, alignItems: 'center' },
  suggestionChip: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.primary + '50',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  suggestionText: { fontSize: 13, color: COLORS.primary, fontWeight: '500' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    maxHeight: 120,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 1,
  },
  sendBtnDisabled: { backgroundColor: COLORS.border },
  // Context modal
  contextModal: { flex: 1, backgroundColor: COLORS.background },
  contextModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  contextModalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  contextModalSub: { fontSize: 13, color: COLORS.textLight, padding: 14, paddingTop: 10 },
  contextList: { padding: 12 },
  contextEmpty: { textAlign: 'center', color: COLORS.textLight, padding: 24 },
  contextItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contextItemActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '08' },
  contextItemInfo: { flex: 1 },
  contextItemTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  contextItemMeta: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  contextItemText: { fontSize: 14, color: COLORS.textLight, flex: 1 },
});
