import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { useThemeColors, typography, spacing } from '../../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/MainNavigator';
import { subscribeToCustomOrder, CustomOrder } from '../../../services/firebase/customOrders';
import { subscribeToOrder } from '../../../services/firebase/orders';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../../components/ui/Header';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<MainStackParamList, 'CustomOrderPayment'>;

export const CustomOrderPaymentScreen = ({ navigation, route }: Props) => {
  const { orderId, isCustomOrder = true } = route.params;
  const themeColors = useThemeColors();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const handleUpdate = (updatedOrder: any) => {
      setOrder(updatedOrder);
      
      // If payment is already done or delivery partner is assigned, jump to tracking
      if (
        updatedOrder?.paymentStatus === 'COMPLETED' ||
        updatedOrder?.paymentStatus === 'COD' ||
        updatedOrder?.status === 'completed' ||
        updatedOrder?.status === 'ready_for_pickup' ||
        updatedOrder?.status === 'out_for_delivery' ||
        updatedOrder?.status === 'delivered' ||
        updatedOrder?.storeStatus === 'DELIVERY_PARTNER_ASSIGNED' ||
        updatedOrder?.storeStatus === 'PICKED_UP'
      ) {
        navigation.replace('OrderTracking', { orderId: updatedOrder.id!, isCustomOrder });
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

  if (!order) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
        <Header title="Payment" showBack onBack={() => navigation.goBack()} />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={themeColors.brand.primary} />
          <Text style={[styles.loadingText, { color: themeColors.text.secondary }]}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate totals
  const deliveryFee = order.deliveryCharge ?? 100;
  const finalTotal = order.billAmount || 0;
  const hasPricedBill = Boolean(order.billAmount && order.billAmount > 0);
  
  const itemTotal = order.itemizedBill && order.itemizedBill.length > 0
    ? order.itemizedBill.reduce((sum: number, item: any) => sum + (item.price || 0), 0)
    : Math.max(0, finalTotal - deliveryFee);

  const handlePayment = () => {
    if (!hasPricedBill) {
      Alert.alert('Billing in Process', 'Please wait until the pharmacist enters the medicine prices.');
      return;
    }

    navigation.navigate('PaymentMethods', { 
      orderId, 
      amount: finalTotal, 
      isCustomOrder
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      <Header title="Bill Details" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* If the store hasn't priced the order yet, show Billing is on process */}
        {!hasPricedBill ? (
          <View style={styles.unpricedContainer}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: themeColors.brand.primary }]}>
              <Ionicons name="receipt-outline" size={54} color={themeColors.brand.primary} />
            </View>

            <View style={[styles.statusBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name="checkmark-circle" size={16} color={themeColors.status.success} />
              <Text style={[styles.statusBadgeText, { color: themeColors.status.success }]}>
                Store Accepted Request
              </Text>
            </View>

            <Text style={[styles.unpricedTitle, { color: themeColors.text.primary }]}>
              Billing is on process
            </Text>
            
            <Text style={[styles.unpricedSubtitle, { color: themeColors.text.secondary }]}>
              The pharmacy is currently reviewing your medicines and adding pricing to your bill. Please wait a moment...
            </Text>

            <Card style={[styles.waitingCard, { backgroundColor: themeColors.background.secondary, borderColor: themeColors.border.default }]}>
              <ActivityIndicator size="small" color={themeColors.brand.primary} />
              <Text style={[styles.waitingCardText, { color: themeColors.text.primary }]}>
                Awaiting pharmacist price entry...
              </Text>
            </Card>

            <Card style={[styles.previewCard, { backgroundColor: themeColors.background.secondary, borderColor: themeColors.border.default }]}>
              <Text style={[styles.previewHeading, { color: themeColors.text.primary }]}>Requested Medicines</Text>
              {order.medicines && order.medicines.length > 0 ? (
                order.medicines.map((med: string, idx: number) => (
                  <View key={idx} style={[styles.previewRow, { borderBottomColor: themeColors.border.default }]}>
                    <Ionicons name="medkit-outline" size={16} color={themeColors.brand.primary} />
                    <Text style={[styles.previewMedText, { color: themeColors.text.primary }]}>{med}</Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: themeColors.text.secondary, fontStyle: 'italic' }}>Uploaded Prescription Order</Text>
              )}
            </Card>
          </View>
        ) : (
          /* Store has priced the bill */
          <>
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={64} color={themeColors.status.success} />
              <Text style={[styles.successTitle, { color: themeColors.text.primary }]}>
                Store Priced & Confirmed!
              </Text>
              <Text style={[styles.successSubtitle, { color: themeColors.text.secondary }]}>
                The pharmacy has confirmed stock and added the itemized medicine prices.
              </Text>
            </View>

            <Card style={styles.billCard}>
              <Text style={[styles.billTitle, { color: themeColors.text.primary }]}>Itemized Bill</Text>
              
              {order.itemizedBill && order.itemizedBill.length > 0 ? (
                order.itemizedBill.map((item: any, index: number) => (
                  <View key={index} style={[styles.row, { borderBottomColor: themeColors.border.default }]}>
                    <Text style={[styles.label, { color: themeColors.text.secondary, flex: 1 }]}>{item.medicine}</Text>
                    <Text style={[styles.value, { color: themeColors.text.primary }]}>₹{item.price.toFixed(2)}</Text>
                  </View>
                ))
              ) : (
                <View style={[styles.row, { borderBottomColor: themeColors.border.default }]}>
                  <Text style={[styles.label, { color: themeColors.text.secondary, flex: 1 }]}>{order.medicines?.join(', ')}</Text>
                  <Text style={[styles.value, { color: themeColors.text.primary }]}>₹{itemTotal.toFixed(2)}</Text>
                </View>
              )}

              <View style={[styles.row, { borderBottomColor: themeColors.border.default }]}>
                <Text style={[styles.label, { color: themeColors.text.secondary }]}>Delivery Charge</Text>
                <Text style={[styles.value, { color: themeColors.text.primary }]}>₹{deliveryFee.toFixed(2)}</Text>
              </View>
              
              <View style={[styles.row, { borderBottomColor: themeColors.border.default }]}>
                <Text style={[styles.label, { color: themeColors.text.secondary }]}>Deliver To</Text>
                <Text style={[styles.value, { color: themeColors.text.primary }]}>{order.userName || 'Customer'}</Text>
              </View>

              <View style={[styles.row, { borderBottomColor: themeColors.border.default }]}>
                <Text style={[styles.label, { color: themeColors.text.secondary }]}>Address</Text>
                <Text style={[styles.value, { color: themeColors.text.primary, flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                  {order.address}
                </Text>
              </View>

              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: themeColors.text.primary }]}>Total Amount</Text>
                <Text style={[styles.totalValue, { color: themeColors.brand.primary }]}>
                  ₹{finalTotal.toFixed(2)}
                </Text>
              </View>
            </Card>
          </>
        )}

      </ScrollView>

      {/* Footer Payment CTA */}
      <View style={[styles.footer, { borderTopColor: themeColors.border.default, backgroundColor: themeColors.background.primary }]}>
        {hasPricedBill ? (
          <Button
            title={`Proceed to Pay ₹${finalTotal.toFixed(2)}`}
            onPress={handlePayment}
            style={styles.payBtn}
          />
        ) : (
          <View style={[styles.disabledBtnBox, { backgroundColor: themeColors.background.secondary, borderColor: themeColors.border.default }]}>
            <ActivityIndicator size="small" color={themeColors.brand.primary} />
            <Text style={[styles.disabledBtnText, { color: themeColors.text.secondary }]}>
              Billing is on process...
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
    padding: spacing.lg,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.md,
  },
  unpricedContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: 16,
    marginBottom: spacing.md,
  },
  statusBadgeText: {
    fontWeight: '800',
    fontSize: 12,
  },
  unpricedTitle: {
    ...typography.h2,
    fontSize: 22,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  unpricedSubtitle: {
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
  previewCard: {
    width: '100%',
    padding: spacing.md,
    borderWidth: 1,
  },
  previewHeading: {
    ...typography.bodyStrong,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  previewMedText: {
    ...typography.body,
    fontSize: 14,
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  successTitle: {
    ...typography.h2,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  successSubtitle: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  billCard: {
    padding: spacing.lg,
  },
  billTitle: {
    ...typography.bodyStrong,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  label: {
    ...typography.body,
  },
  value: {
    ...typography.bodyStrong,
    marginLeft: spacing.lg,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    paddingTop: spacing.md,
  },
  totalLabel: {
    ...typography.h2,
  },
  totalValue: {
    ...typography.h1,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  payBtn: {
    width: '100%',
  },
  disabledBtnBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: spacing.sm,
    borderWidth: 1,
    width: '100%',
  },
  disabledBtnText: {
    ...typography.bodyStrong,
    fontSize: 14,
  },
});
