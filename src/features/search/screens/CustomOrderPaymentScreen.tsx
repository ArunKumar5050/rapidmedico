import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { useThemeColors, typography, spacing } from '../../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/MainNavigator';
import { subscribeToCustomOrder, payCustomOrder, CustomOrder } from '../../../services/firebase/customOrders';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../../components/ui/Header';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<MainStackParamList, 'CustomOrderPayment'>;

export const CustomOrderPaymentScreen = ({ navigation, route }: Props) => {
  const { orderId } = route.params;
  const themeColors = useThemeColors();
  const [order, setOrder] = useState<CustomOrder | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToCustomOrder(orderId, (updatedOrder) => {
      setOrder(updatedOrder);
    });

    return () => unsubscribe();
  }, [orderId]);

  if (!order) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
        <Header title="Payment" showBack onBack={() => navigation.goBack()} />
        <View style={styles.centerContent}>
          <Text>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate totals
  const deliveryFee = order.deliveryCharge ?? 200;
  const finalTotal = order.billAmount || 0;
  
  const itemTotal = order.itemizedBill 
    ? order.itemizedBill.reduce((sum, item) => sum + item.price, 0)
    : Math.max(0, finalTotal - deliveryFee);

  const handlePayment = () => {
    navigation.navigate('PaymentMethods', { 
      orderId, 
      amount: finalTotal, 
      isCustomOrder: true 
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      <Header title="Bill Details" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        
        <View style={styles.successIconContainer}>
          <Ionicons name="checkmark-circle" size={64} color={themeColors.status.success} />
          <Text style={[styles.successTitle, { color: themeColors.text.primary }]}>
            Store Found!
          </Text>
          <Text style={[styles.successSubtitle, { color: themeColors.text.secondary }]}>
            A nearby store has confirmed stock and priced your order.
          </Text>
        </View>

        <Card style={styles.billCard}>
          <Text style={[styles.billTitle, { color: themeColors.text.primary }]}>Itemized Bill</Text>
          
          {order.itemizedBill && order.itemizedBill.length > 0 ? (
            order.itemizedBill.map((item, index) => (
              <View key={index} style={[styles.row, { borderBottomColor: themeColors.border.default }]}>
                <Text style={[styles.label, { color: themeColors.text.secondary }]}>{item.medicine}</Text>
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
            <Text style={[styles.value, { color: themeColors.text.primary }]}>{order.userName}</Text>
          </View>

          <View style={[styles.row, { borderBottomColor: themeColors.border.default }]}>
            <Text style={[styles.label, { color: themeColors.text.secondary }]}>Address</Text>
            <Text style={[styles.value, { color: themeColors.text.primary, flex: 1, textAlign: 'right' }]}>{order.address}</Text>
          </View>

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: themeColors.text.primary }]}>Total Amount</Text>
            <Text style={[styles.totalValue, { color: themeColors.brand.primary }]}>
              ₹{finalTotal.toFixed(2)}
            </Text>
          </View>
        </Card>

      </ScrollView>

      <View style={[styles.footer, { borderTopColor: themeColors.border.default, backgroundColor: themeColors.background.primary }]}>
        <Button
          title={`Proceed to Pay ₹${finalTotal.toFixed(2)}`}
          onPress={handlePayment}
          style={styles.payBtn}
        />
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
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    marginTop: spacing.xl,
  },
  successTitle: {
    ...typography.h2,
    marginTop: spacing.md,
  },
  successSubtitle: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.xs,
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
  }
});
