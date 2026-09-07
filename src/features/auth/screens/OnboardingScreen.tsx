import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Button } from '../../../components/ui/Button';
import { colors, typography, spacing } from '../../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../app/navigation/AuthNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

export const OnboardingScreen = ({ navigation }: Props) => {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" translucent={false} />
      <View style={styles.content}>
        <Text style={styles.title}>RapidMedico</Text>
        <Text style={styles.subtitle}>Your trusted pharmacy, delivered fast.</Text>
      </View>
      <View style={styles.footer}>
        <Button 
          title="Get Started" 
          onPress={() => navigation.navigate('PhoneEntry')} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.light.background.primary 
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  title: {
    ...typography.display,
    color: colors.light.brand.primary,
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.h2,
    color: colors.light.text.secondary,
    textAlign: 'center',
  },
  footer: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  }
});
