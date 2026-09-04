import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TextInput, Alert } from 'react-native';
import { AuthService } from '../../../services/firebase/auth';
import { getDocument } from '../../../services/firebase/firestoreHelpers';
import { useAuthStore } from '../../../store/auth';
import { Button } from '../../../components/ui/Button';
import { colors, typography, spacing } from '../../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../app/navigation/AuthNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpVerification'>;

export const OtpVerificationScreen = ({ route, navigation }: Props) => {
  const { phone } = route.params;
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    setIsLoading(true);
    try {
      const user = await AuthService.verifyOtp(phone, otp);
      
      // Check if user profile already exists in Firestore
      const userData = await getDocument('users', user.uid) as { name?: string } | null;
      
      if (userData && userData.name) {
        setUser({ uid: user.uid, phone: user.phone || phone, name: userData.name });
        setAuthenticated(true);
      } else {
        // Navigate to Profile completion so they can enter their name
        navigation.navigate('ProfileCompletion', { phone });
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Verification Failed', error.message || 'Verification failed. Use OTP: 123456');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      setCountdown(30);
      const { otpCode } = await AuthService.sendOtp(phone);
      Alert.alert('OTP Resent', `New OTP sent to ${phone}.\nUse OTP: ${otpCode}`);
    } catch (err) {
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Verify your number</Text>
        <Text style={styles.subtitle}>Enter the 6-digit code sent to {phone}</Text>
        <Text style={styles.hintText}>(Test code: 123456)</Text>

        <TextInput
          style={styles.otpInput}
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="123456"
          placeholderTextColor={colors.light.text.secondary}
        />

        <Button 
          title="Verify & Continue" 
          onPress={handleVerify} 
          loading={isLoading}
          disabled={otp.length !== 6}
          style={styles.verifyBtn}
        />

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          <Text 
            style={[styles.resendLink, countdown > 0 && styles.resendDisabled]} 
            onPress={handleResend}
          >
            {countdown > 0 ? `Resend in ${countdown}s` : 'Resend now'}
          </Text>
        </View>
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
    marginBottom: spacing.xs,
  },
  hintText: {
    ...typography.caption,
    color: colors.light.brand.primary,
    marginBottom: spacing.xl,
    fontWeight: '600',
  },
  otpInput: {
    ...typography.display,
    letterSpacing: 8,
    textAlign: 'center',
    height: 64,
    borderWidth: 1,
    borderColor: colors.light.border.default,
    borderRadius: spacing.sm,
    backgroundColor: colors.light.background.primary,
    color: colors.light.text.primary,
    marginBottom: spacing.xl,
  },
  verifyBtn: {
    marginBottom: spacing.xl,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  resendText: {
    ...typography.body,
    color: colors.light.text.secondary,
  },
  resendLink: {
    ...typography.bodyStrong,
    color: colors.light.brand.primary,
  },
  resendDisabled: {
    color: colors.light.text.secondary,
  },
});
