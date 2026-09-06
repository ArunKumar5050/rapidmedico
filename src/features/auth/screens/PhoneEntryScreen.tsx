import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Text, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PhoneEntrySchema } from '../../../types/schemas';
import { Button } from '../../../components/ui/Button';
import { TextInput } from '../../../components/ui/TextInput';
import { colors, typography, spacing } from '../../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../app/navigation/AuthNavigator';
import { AuthService } from '../../../services/firebase/auth';

type Props = NativeStackScreenProps<AuthStackParamList, 'PhoneEntry'>;

interface FormData {
  countryCode: string;
  phoneNumber: string;
}

export const PhoneEntryScreen = ({ navigation }: Props) => {
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(PhoneEntrySchema),
    defaultValues: {
      countryCode: '+91',
      phoneNumber: '',
    }
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const fullPhone = `${data.countryCode}${data.phoneNumber}`;
      
      const { success, otpCode } = await AuthService.sendOtp(fullPhone);
      
      if (success) {
        Alert.alert(
          'OTP Sent',
          `Verification code sent to ${fullPhone}.\nUse OTP: ${otpCode}`,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('OtpVerification', { phone: fullPhone }),
            }
          ]
        );
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Failed to send OTP.');
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
        <Text style={styles.title}>Welcome to RapidMedico</Text>
        <Text style={styles.subtitle}>Enter your phone number to continue</Text>

        <View style={styles.phoneRow}>
          <Controller
            control={control}
            name="countryCode"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Code"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.countryCode?.message}
                containerStyle={styles.countryCode}
              />
            )}
          />
          
          <Controller
            control={control}
            name="phoneNumber"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Phone Number"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                keyboardType="phone-pad"
                error={errors.phoneNumber?.message}
                containerStyle={styles.phoneNumber}
                maxLength={10}
              />
            )}
          />
        </View>

        <Button 
          title="Continue" 
          onPress={handleSubmit(onSubmit)} 
          loading={isLoading}
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
  phoneRow: {
    flexDirection: 'row',
  },
  countryCode: {
    width: 80,
    marginRight: spacing.md,
  },
  phoneNumber: {
    flex: 1,
  },
});
