import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { useThemeColors, typography, spacing } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/MainNavigator';
import { useCartStore } from '../../../store/useCartStore';
import { useAuthStore } from '../../../store/auth';
import { createOrder } from '../../../services/firebase/orders';

type Props = NativeStackScreenProps<MainStackParamList, 'Checkout'>;

export const CheckoutScreen = ({ navigation }: Props) => {
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'COD'>('UPI');
  const [isEmergency, setIsEmergency] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  
  const themeColors = useThemeColors();
  const { cartItems, clearCart } = useCartStore();
  const { user } = useAuthStore();

  const totalAmount = cartItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);

  const handlePlaceOrder = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to place an order.');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Error', 'Your cart is empty.');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const orderId = await createOrder({
        userId: user.uid,
        items: cartItems,
        totalAmount,
        paymentMethod,
        isEmergency,
        address: '123 Main St, Apartment 4B, Koramangala, Bangalore', // Static for now, until address selection is implemented
      });
      
      clearCart();
      navigation.navigate('OrderTracking', { orderId });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: themeColors.background.secondary, borderBottomColor: themeColors.border.default }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text.primary }]}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Delivery Address */}
        <Card style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>Delivery Address</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AddressManagement')}>
              <Text style={[styles.changeBtn, { color: themeColors.brand.primary }]}>Change</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.addressRow}>
            <Ionicons name="location" size={20} color={themeColors.brand.primary} />
            <View>
              <Text style={[styles.addressName, { color: themeColors.text.primary }]}>Home</Text>
              <Text style={[styles.addressText, { color: themeColors.text.secondary }]}>123 Main St, Apartment 4B, Koramangala, Bangalore</Text>
            </View>
          </View>
        </Card>

        {/* Priority Emergency Toggle */}
        <Card style={[styles.emergencyCard, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444' }]}>
          <View style={styles.emergencyRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.emergencyTitle}>🚨 Emergency Priority Delivery</Text>
              <Text style={[styles.emergencySub, { color: themeColors.text.secondary }]}>Prioritize order dispatch from nearest available pharmacy</Text>
            </View>
            <TouchableOpacity 
              style={[styles.toggleBtn, isEmergency && styles.toggleActive]}
              onPress={() => setIsEmergency(!isEmergency)}
            >
              <View style={[styles.toggleCircle, isEmergency && styles.toggleCircleActive]} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Payment Options */}
        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>Select Payment Method</Text>

          <TouchableOpacity 
            style={[
              styles.payOption, 
              { borderColor: paymentMethod === 'UPI' ? themeColors.brand.primary : themeColors.border.default }
            ]}
            onPress={() => setPaymentMethod('UPI')}
          >
            <Ionicons name="qr-code-outline" size={20} color={themeColors.brand.primary} />
            <Text style={[styles.payText, { color: themeColors.text.primary }]}>UPI / Google Pay / PhonePe</Text>
            {paymentMethod === 'UPI' && <Ionicons name="checkmark-circle" size={20} color={themeColors.brand.primary} />}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.payOption, 
              { borderColor: paymentMethod === 'CARD' ? themeColors.brand.primary : themeColors.border.default }
            ]}
            onPress={() => setPaymentMethod('CARD')}
          >
            <Ionicons name="card-outline" size={20} color={themeColors.brand.primary} />
            <Text style={[styles.payText, { color: themeColors.text.primary }]}>Credit / Debit Card</Text>
            {paymentMethod === 'CARD' && <Ionicons name="checkmark-circle" size={20} color={themeColors.brand.primary} />}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.payOption, 
              { borderColor: paymentMethod === 'COD' ? themeColors.brand.primary : themeColors.border.default }
            ]}
            onPress={() => setPaymentMethod('COD')}
          >
            <Ionicons name="cash-outline" size={20} color={themeColors.brand.primary} />
            <Text style={[styles.payText, { color: themeColors.text.primary }]}>Cash on Delivery</Text>
            {paymentMethod === 'COD' && <Ionicons name="checkmark-circle" size={20} color={themeColors.brand.primary} />}
          </TouchableOpacity>
        </Card>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: themeColors.background.secondary, borderTopColor: themeColors.border.default }]}>
        <View style={styles.priceRow}>
          <Text style={[styles.totalLabel, { color: themeColors.text.secondary }]}>Total Payable</Text>
          <Text style={[styles.totalPrice, { color: themeColors.brand.primary }]}>₹{totalAmount.toFixed(2)}</Text>
        </View>
        <Button
          title="Place Order"
          onPress={handlePlaceOrder}
          loading={isPlacingOrder}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  title: { ...typography.h2 },
  content: { padding: spacing.lg },
  sectionCard: { marginBottom: spacing.lg },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: { ...typography.bodyStrong, marginBottom: spacing.xs },
  changeBtn: { ...typography.caption, fontWeight: 'bold' },
  addressRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  addressName: { ...typography.bodyStrong },
  addressText: { ...typography.caption, maxWidth: 260 },
  emergencyCard: { marginBottom: spacing.lg },
  emergencyRow: { flexDirection: 'row', alignItems: 'center' },
  emergencyTitle: { ...typography.bodyStrong, color: '#EF4444' },
  emergencySub: { ...typography.caption, marginTop: 2 },
  toggleBtn: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#374151',
    padding: 2,
  },
  toggleActive: { backgroundColor: '#EF4444' },
  toggleCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF' },
  toggleCircleActive: { alignSelf: 'flex-end' },
  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: spacing.sm,
    borderWidth: 1,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  payText: { flex: 1, ...typography.body },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    borderTopWidth: 1,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  totalLabel: { ...typography.body },
  totalPrice: { ...typography.h1 },
});
