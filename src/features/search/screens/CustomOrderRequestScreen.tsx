import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput } from '../../../components/ui/TextInput';
import { Button } from '../../../components/ui/Button';
import { useThemeColors, typography, spacing } from '../../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/MainNavigator';
import { createCustomOrder } from '../../../services/firebase/customOrders';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../../components/ui/Header';

type Props = NativeStackScreenProps<MainStackParamList, 'CustomOrderRequest'>;

export const CustomOrderRequestScreen = ({ navigation, route }: Props) => {
  const { initialMedicineName = '' } = route.params || {};
  const themeColors = useThemeColors();
  const { user } = useAuthStore();
  
  const [medicineName, setMedicineName] = useState(initialMedicineName);
  const [userName, setUserName] = useState(user?.name || '');
  const [mobile, setMobile] = useState(user?.phone || '');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!medicineName.trim() || !userName.trim() || !mobile.trim() || !address.trim()) {
      Alert.alert("Error", "Please fill all the details.");
      return;
    }

    if (!user) {
      Alert.alert("Error", "You must be logged in to submit a request.");
      return;
    }

    setIsLoading(true);
    try {
      const orderId = await createCustomOrder({
        medicineName,
        userName,
        mobile,
        address,
        userId: user.uid,
      });
      navigation.replace('CustomOrderProcessing', { orderId });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to submit request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      <Header title="Request Medicine" showBack onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.subtitle, { color: themeColors.text.secondary }]}>
            Can't find your medicine? Fill out the form below and we'll search nearby medical stores for you.
          </Text>

          <TextInput
            label="Medicine Name"
            placeholder="Enter medicine name"
            value={medicineName}
            onChangeText={setMedicineName}
            containerStyle={styles.inputContainer}
          />

          <TextInput
            label="Your Name"
            placeholder="Enter your name"
            value={userName}
            onChangeText={setUserName}
            containerStyle={styles.inputContainer}
          />

          <TextInput
            label="Mobile Number"
            placeholder="Enter mobile number"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            containerStyle={styles.inputContainer}
          />

          <TextInput
            label="Detailed Address"
            placeholder="Enter your full address"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={4}
            containerStyle={styles.inputContainer}
            style={styles.textArea}
          />

        </ScrollView>
        <View style={[styles.footer, { borderTopColor: themeColors.border.default, backgroundColor: themeColors.background.primary }]}>
            <Button
              title="Submit Request"
              onPress={handleSubmit}
              loading={isLoading}
              style={styles.submitBtn}
            />
          </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    marginBottom: spacing.xl,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  submitBtn: {
    width: '100%',
  }
});
