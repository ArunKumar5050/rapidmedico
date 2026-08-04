import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingScreen } from '../../features/auth/screens/OnboardingScreen';
import { PhoneEntryScreen } from '../../features/auth/screens/PhoneEntryScreen';
import { OtpVerificationScreen } from '../../features/auth/screens/OtpVerificationScreen';
import { ProfileCompletionScreen } from '../../features/auth/screens/ProfileCompletionScreen';

export type AuthStackParamList = {
  Onboarding: undefined;
  PhoneEntry: undefined;
  OtpVerification: { phone: string };
  ProfileCompletion: { phone: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="PhoneEntry" component={PhoneEntryScreen} />
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
      <Stack.Screen name="ProfileCompletion" component={ProfileCompletionScreen} />
    </Stack.Navigator>
  );
};
