import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useThemeColors, typography, spacing } from '../../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/MainNavigator';
import { subscribeToCustomOrder, CustomOrder } from '../../../services/firebase/customOrders';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../../components/ui/Header';

type Props = NativeStackScreenProps<MainStackParamList, 'CustomOrderProcessing'>;

export const CustomOrderProcessingScreen = ({ navigation, route }: Props) => {
  const { orderId } = route.params;
  const themeColors = useThemeColors();
  const [order, setOrder] = useState<CustomOrder | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToCustomOrder(orderId, (updatedOrder) => {
      setOrder(updatedOrder);
      
      if (updatedOrder?.status === 'confirmed') {
        navigation.replace('CustomOrderPayment', { orderId: updatedOrder.id! });
      }
    });

    return () => unsubscribe();
  }, [orderId, navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      <Header title="Order Processing" showBack onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <ActivityIndicator size="large" color={themeColors.brand.primary} style={styles.loader} />
        <Text style={[styles.title, { color: themeColors.text.primary }]}>
          Searching for your medicine
        </Text>
        <Text style={[styles.subtitle, { color: themeColors.text.secondary }]}>
          We are currently checking the nearest medical stores for "{order?.medicines?.join(', ') || 'your requested medicine'}".
        </Text>
        <Text style={[styles.info, { color: themeColors.text.secondary }]}>
          Please wait on this screen. Once a store confirms availability, you will be prompted to make the payment.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    marginBottom: spacing.xl,
    transform: [{ scale: 1.5 }],
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  info: {
    ...typography.caption,
    textAlign: 'center',
    fontStyle: 'italic',
  }
});
