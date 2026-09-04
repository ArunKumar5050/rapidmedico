import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors, typography, spacing } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/MainNavigator';

type Props = NativeStackScreenProps<MainStackParamList, 'SupportChat'>;

export const SupportChatScreen = ({ navigation }: Props) => {
  const themeColors = useThemeColors();
  const [messages, setMessages] = useState([
    { id: '1', sender: 'bot', text: 'Hello! Welcome to Rapidmedi Support. How can we assist you with your order today?' },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg = { id: Date.now().toString(), sender: 'user', text: input };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: 'bot', text: 'Thanks for reaching out! A support executive has been notified.' },
      ]);
    }, 1000);
  };

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
      <View style={[styles.header, { backgroundColor: themeColors.background.secondary, borderBottomColor: themeColors.border.default }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text.primary }]}>Rapidmedi Support</Text>
        <TouchableOpacity onPress={() => Linking.openURL('tel:8302389192')}>
          <Ionicons name="call" size={24} color={themeColors.brand.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.chatList}>
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.bubble,
              msg.sender === 'user' 
                ? [styles.userBubble, { backgroundColor: themeColors.brand.primary }]
                : [styles.botBubble, { backgroundColor: themeColors.background.secondary, borderColor: themeColors.border.default }],
            ]}
          >
            <Text style={[
              styles.msgText,
              msg.sender === 'user' ? { color: '#FFFFFF' } : { color: themeColors.text.primary },
            ]}>
              {msg.text}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.inputRow, { backgroundColor: themeColors.background.secondary, borderTopColor: themeColors.border.default }]}>
        <TextInput
          style={[styles.textInput, { backgroundColor: themeColors.background.primary, borderColor: themeColors.border.default, color: themeColors.text.primary }]}
          placeholder="Type your message..."
          placeholderTextColor={themeColors.text.secondary}
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity style={[styles.sendBtn, { backgroundColor: themeColors.brand.primary }]} onPress={handleSend}>
          <Ionicons name="send" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  title: { ...typography.h2 },
  chatList: { flex: 1, padding: spacing.lg },
  bubble: { maxWidth: '80%', padding: spacing.md, borderRadius: spacing.md, marginBottom: spacing.md },
  botBubble: { alignSelf: 'flex-start', borderWidth: 1 },
  userBubble: { alignSelf: 'flex-end' },
  msgText: { ...typography.body },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    height: 44,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
