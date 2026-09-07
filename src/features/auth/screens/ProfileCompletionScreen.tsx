import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../../../components/ui/Button';
import { TextInput } from '../../../components/ui/TextInput';
import { colors, typography, spacing } from '../../../theme';
import { useAuthStore } from '../../../store/auth';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../app/navigation/AuthNavigator';
import { saveDocument } from '../../../services/firebase/firestoreHelpers';

type Props = NativeStackScreenProps<AuthStackParamList, 'ProfileCompletion'>;

export const ProfileCompletionScreen = ({ route }: Props) => {
  const { phone } = route.params;
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);

  const handleComplete = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setIsLoading(true);
    try {
      const uid = `user_${phone.replace(/\D/g, '')}`;
      const userData = {
        id: uid,
        phone,
        name: trimmedName,
        createdAt: new Date().toISOString(),
      };

      // 1. Instantly set user and authenticate to transition directly to HomeScreen
      setUser({ uid, phone, name: trimmedName });
      setAuthenticated(true);

      // 2. Fire and forget saving to Firestore in background
      saveDocument('users', userData).catch((err) =>
        console.log('Failed to save profile in background:', err)
      );
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" backgroundColor="#FFFFFF" translucent={false} />
      <View style={styles.content}>
        <Text style={styles.title}>Complete Profile</Text>
        <Text style={styles.subtitle}>Please enter your name to continue</Text>
        
        <TextInput
          label="Full Name"
          placeholder="Your full name"
          value={name}
          onChangeText={setName}
          containerStyle={styles.inputContainer}
          autoFocus
        />

        <Button 
          title="Complete Profile" 
          onPress={handleComplete} 
          loading={isLoading}
          style={styles.btn}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.light.background.primary,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.light.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.light.text.secondary,
    marginBottom: spacing.xl,
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  btn: {
    width: '100%',
  }
});
