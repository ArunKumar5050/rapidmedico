import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Button } from '../../../components/ui/Button';
import { TextInput } from '../../../components/ui/TextInput';
import { colors, typography, spacing } from '../../../theme';
import { useAuthStore } from '../../../store/auth';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../app/navigation/AuthNavigator';
import { auth } from '../../../services/firebase/auth';
import { saveDocument } from '../../../services/firebase/firestoreHelpers';

type Props = NativeStackScreenProps<AuthStackParamList, 'ProfileCompletion'>;

export const ProfileCompletionScreen = ({ route }: Props) => {
  const { phone } = route.params;
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);

  const handleComplete = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setIsLoading(true);
    try {
      const uid = auth.currentUser?.uid || `local-${Date.now()}`;
      const userData = {
        id: uid,
        phone,
        name: name.trim(),
        createdAt: new Date().toISOString(),
      };

      await saveDocument('users', userData);
      
      setUser({ uid, phone, name: name.trim() });
      setAuthenticated(true);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Complete Profile</Text>
        <Text style={styles.subtitle}>Please enter your name to continue</Text>
        
        <TextInput
          label="Full Name"
          placeholder="Your full name"
          value={name}
          onChangeText={setName}
          style={styles.input}
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
  input: {
    marginBottom: spacing.xl,
  },
  btn: {
    width: '100%',
  }
});
