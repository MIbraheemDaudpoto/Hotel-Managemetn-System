import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator, Keyboard, TouchableWithoutFeedback
} from 'react-native';
import { useHotelStore } from '../../src/store/hotelStore';

export default function ConciergeScreen() {
  const { messages, sendConciergeMessage, isChatLoading, clearChat } = useHotelStore();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const scrollToBottom = (animated = true) => {
    flatListRef.current?.scrollToEnd({ animated });
  };

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isChatLoading]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setTimeout(() => scrollToBottom(true), 100);
      }
    );
    return () => showSub.remove();
  }, []);

  const handleSend = () => {
    if (!inputText.trim()) return;
    const msg = inputText.trim();
    setInputText('');
    sendConciergeMessage(msg);
  };

  const handleSuggestedAction = (action: string) => {
    sendConciergeMessage(action);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <View style={styles.botAvatar}>
            <Text style={{ fontSize: 20 }}>🤖</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Hotel Concierge</Text>
            <Text style={styles.headerSubtitle}>24/7 Stay & Policy Assistance</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.clearBtn} onPress={clearChat}>
          <Text style={styles.clearText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={{ flex: 1 }}>
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollToBottom(false)}
              renderItem={({ item }) => {
                const isUser = item.sender === 'user';
                return (
                  <View style={[styles.messageRow, isUser ? styles.userRow : styles.botRow]}>
                    {!isUser ? (
                      <View style={styles.miniAvatar}>
                        <Text style={{ fontSize: 14 }}>🤖</Text>
                      </View>
                    ) : null}
                    <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
                      <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
                        {item.text}
                      </Text>
                      <Text style={[styles.timeText, isUser ? styles.userTime : styles.botTime]}>
                        {item.timestamp}
                      </Text>

                      {item.suggested_actions && item.suggested_actions.length > 0 ? (
                        <View style={styles.suggestionsContainer}>
                          {item.suggested_actions.map((act: string, idx: number) => (
                            <TouchableOpacity
                              key={idx}
                              style={styles.suggestionChip}
                              onPress={() => handleSuggestedAction(act)}
                            >
                              <Text style={styles.suggestionChipText}>✨ {act}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              }}
              ListFooterComponent={
                isChatLoading ? (
                  <View style={styles.typingIndicator}>
                    <ActivityIndicator size="small" color="#2563EB" />
                    <Text style={styles.typingText}>Concierge is checking hotel policies...</Text>
                  </View>
                ) : null
              }
            />

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask about Wi-Fi, pool, breakfast, checkout..."
                placeholderTextColor="#94A3B8"
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />
              <TouchableOpacity
                style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!inputText.trim() || isChatLoading}
              >
                <Text style={styles.sendIcon}>↑</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 36 : 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  botAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  clearText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  messageList: {
    padding: 16,
    paddingBottom: 16,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
    gap: 8,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  botRow: {
    justifyContent: 'flex-start',
  },
  miniAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  botText: {
    color: '#1E293B',
  },
  timeText: {
    fontSize: 10,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  userTime: {
    color: '#BFDBFE',
  },
  botTime: {
    color: '#94A3B8',
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  suggestionChip: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  suggestionChipText: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 44,
    fontSize: 14,
    color: '#0F172A',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  sendIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
});
