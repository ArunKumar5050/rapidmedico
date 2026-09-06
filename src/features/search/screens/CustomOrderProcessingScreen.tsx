import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useThemeColors, typography, spacing } from '../../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/MainNavigator';
import { subscribeToCustomOrder, CustomOrder } from '../../../services/firebase/customOrders';
import { subscribeToOrder } from '../../../services/firebase/orders';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../../components/ui/Header';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../../components/ui/Card';

type Props = NativeStackScreenProps<MainStackParamList, 'CustomOrderProcessing'>;

export const CustomOrderProcessingScreen = ({ navigation, route }: Props) => {
  const { orderId, isCustomOrder = true } = route.params;
  const themeColors = useThemeColors();
  const [order, setOrder] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes countdown (120 seconds)

  // 2-minute countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const handleUpdate = (updatedOrder: any) => {
      setOrder(updatedOrder);
      
      if (
        updatedOrder?.status === 'paid' || 
        updatedOrder?.status === 'completed' ||
        updatedOrder?.status === 'delivery boy assigned' ||
        updatedOrder?.status === 'delivery partner assigned' ||
        updatedOrder?.status === 'out_for_delivery' ||
        updatedOrder?.storeStatus === 'DELIVERY_PARTNER_ASSIGNED' ||
        updatedOrder?.storeStatus === 'PICKED_UP'
      ) {
        navigation.replace('OrderTracking', { orderId: updatedOrder.id!, isCustomOrder });
      } else if (
        updatedOrder?.status === 'confirmed' && 
        updatedOrder?.billAmount && 
        updatedOrder.billAmount > 0
      ) {
        // Once the store accepts AND prices the order with a valid billAmount, redirect to payment
        navigation.replace('CustomOrderPayment', { orderId: updatedOrder.id!, isCustomOrder });
      }
    };

    let unsubscribe: () => void;
    if (isCustomOrder) {
      unsubscribe = subscribeToCustomOrder(orderId, handleUpdate);
    } else {
      unsubscribe = subscribeToOrder(orderId, handleUpdate);
    }

    return () => unsubscribe();
  }, [orderId, navigation, isCustomOrder]);

  const isStoreAccepted = 
    order?.status === 'confirmed' || 
    (order as any)?.storeStatus === 'ACCEPTED' || 
    (order as any)?.storeStatus === 'PREPARING' ||
    Boolean((order as any)?.storeId);

  const isPendingDoctor = order?.status === 'PENDING_DOCTOR_CONFIRMATION';
  const hasBillAmount = Boolean(order?.billAmount && order.billAmount > 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      <Header title="Order Processing" showBack onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        
        {isPendingDoctor ? (
          // STATE 0: Waiting for Doctor Consultation
          <View style={styles.stateWrapper}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.12)', borderColor: themeColors.brand.primary }]}>
              <Ionicons name="call" size={48} color={themeColors.brand.primary} />
            </View>

            <View style={[styles.storeAcceptedBadge, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Ionicons name="medical" size={16} color={themeColors.brand.primary} />
              <Text style={[styles.badgeText, { color: themeColors.brand.primary }]}>
                Doctor Consultation Required
              </Text>
            </View>

            <Text style={[styles.title, { color: themeColors.text.primary }]}>
              Wait for call from Dr.
            </Text>

            <Text style={[styles.subtitle, { color: themeColors.text.secondary }]}>
              Please wait for a call from our doctor within the next 5 minutes to confirm your prescription.
            </Text>

            <Card style={[styles.waitingCard, { backgroundColor: themeColors.background.secondary, borderColor: themeColors.border.default }]}>
              <ActivityIndicator size="small" color={themeColors.brand.primary} />
              <Text style={[styles.waitingCardText, { color: themeColors.text.primary }]}>
                Waiting for doctor's approval...
              </Text>
            </Card>

            <Text style={[styles.info, { color: themeColors.text.muted }]}>
              After confirmation, your order will automatically be sent to the nearest pharmacy.
            </Text>
          </View>
        ) : isStoreAccepted && !hasBillAmount ? (
          // STATE 2: Store accepted, but store owner has not entered the price yet -> Show "Billing is on process"
          <View style={styles.stateWrapper}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: themeColors.brand.primary }]}>
              <Ionicons name="receipt-outline" size={48} color={themeColors.brand.primary} />
            </View>

            <View style={[styles.storeAcceptedBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="checkmark-circle" size={16} color={themeColors.status.success} />
              <Text style={[styles.badgeText, { color: themeColors.status.success }]}>
                Store Accepted Order
              </Text>
            </View>

            <Text style={[styles.title, { color: themeColors.text.primary }]}>
              Billing is on process
            </Text>

            <Text style={[styles.subtitle, { color: themeColors.text.secondary }]}>
              The pharmacy has accepted your request and is currently adding medicine prices to your bill.
            </Text>

            <Card style={[styles.waitingCard, { backgroundColor: themeColors.background.secondary, borderColor: themeColors.border.default }]}>
              <ActivityIndicator size="small" color={themeColors.brand.primary} />
              <Text style={[styles.waitingCardText, { color: themeColors.text.primary }]}>
                Preparing itemized bill... Please wait.
              </Text>
            </Card>

            <Text style={[styles.info, { color: themeColors.text.muted }]}>
              As soon as the pharmacist adds the price, the payment screen will open automatically.
            </Text>
          </View>
        ) : (
          // STATE 1: Searching for nearest medical store with 2-minute countdown
          <View style={styles.stateWrapper}>
            <ActivityIndicator size="large" color={themeColors.brand.primary} style={styles.loader} />

            <View style={[styles.timerBadge, { backgroundColor: 'rgba(59, 130, 246, 0.12)', borderColor: 'rgba(59, 130, 246, 0.3)' }]}>
              <Ionicons name="time-outline" size={18} color="#3B82F6" />
              <Text style={styles.timerText}>
                {timeLeft > 0 ? `Wait time: ${formatTimer(timeLeft)}` : 'Connecting to nearest pharmacy...'}
              </Text>
            </View>

            <Text style={[styles.title, { color: themeColors.text.primary }]}>
              Finding Nearest Medical Store
            </Text>

            <View style={[styles.highlightBox, { backgroundColor: themeColors.background.secondary, borderColor: themeColors.brand.primary }]}>
              <Ionicons name="search" size={20} color={themeColors.brand.primary} />
              <Text style={[styles.highlightText, { color: themeColors.text.primary }]}>
                Finding nearest medical store, please wait for 2 minutes...
              </Text>
            </View>

            <Text style={[styles.subtitle, { color: themeColors.text.secondary }]}>
              We are checking nearby partner pharmacies for "{order?.medicines?.join(', ') || 'your requested medicine'}".
            </Text>

            <Text style={[styles.info, { color: themeColors.text.muted }]}>
              Please stay on this screen. When a store accepts, you will be notified instantly.
            </Text>
          </View>
        )}

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
  stateWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  loader: {
    marginBottom: spacing.lg,
    transform: [{ scale: 1.4 }],
  },
  iconBox: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  storeAcceptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: spacing.md,
  },
  badgeText: {
    fontWeight: '800',
    fontSize: 13,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  timerText: {
    color: '#3B82F6',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  title: {
    ...typography.h2,
    fontSize: 22,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: spacing.md,
    borderWidth: 1.5,
    marginBottom: spacing.lg,
    width: '100%',
  },
  highlightText: {
    ...typography.bodyStrong,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  waitingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.md,
    width: '100%',
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  waitingCardText: {
    ...typography.bodyStrong,
    fontSize: 14,
  },
  info: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 18,
  },
});
