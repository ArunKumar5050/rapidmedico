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

import { useAddressStore } from '../../../store/useAddressStore';

type Props = NativeStackScreenProps<MainStackParamList, 'Checkout'>;

export const CheckoutScreen = ({ navigation }: Props) => {
  const [isEmergency, setIsEmergency] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  
  const themeColors = useThemeColors();
  const { cartItems, clearCart, prescriptionUrl, prescriptionDescription, prescriptionOption } = useCartStore();
  const { user } = useAuthStore();
  const { getDefaultAddress } = useAddressStore();
  const activeAddress = getDefaultAddress();

  const totalAmount = cartItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);

  const handlePlaceOrder = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to place an order.');
      return;
    }

    if (cartItems.length === 0 && !prescriptionUrl) {
      Alert.alert('Error', 'Your cart is empty and no prescription is attached.');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const orderPayload: any = {
        userId: user.uid,
        items: cartItems,
        totalAmount,
        isEmergency,
        address: activeAddress?.text || '123 Main St, Apartment 4B, Koramangala, Bangalore',
        ...(prescriptionUrl && { prescriptionUrl }),
        ...(prescriptionDescription && { notes: prescriptionDescription }),
        ...(prescriptionOption && { prescriptionOption }),
        status: prescriptionOption === 'contact_doctor' ? 'PENDING_DOCTOR_CONFIRMATION' : 'PENDING',
      };

      if (activeAddress?.latitude && activeAddress?.longitude) {
        orderPayload.latitude = activeAddress.latitude;
        orderPayload.longitude = activeAddress.longitude;
        orderPayload.customerLat = activeAddress.latitude;
        orderPayload.customerLng = activeAddress.longitude;
        orderPayload.userLat = activeAddress.latitude;
        orderPayload.userLng = activeAddress.longitude;
        orderPayload.location = {
          lat: activeAddress.latitude,
          lng: activeAddress.longitude,
          latitude: activeAddress.latitude,
          longitude: activeAddress.longitude,
          timestamp: Date.now(),
        };
        orderPayload.coordinates = {
          latitude: activeAddress.latitude,
          longitude: activeAddress.longitude,
        };
      }

      const orderId = await createOrder(orderPayload);
      
      clearCart();
      navigation.replace('CustomOrderProcessing', { orderId, isCustomOrder: false });
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
            <View style={{ flex: 1 }}>
              <Text style={[styles.addressName, { color: themeColors.text.primary }]}>{activeAddress?.title || 'Delivery Location'}</Text>
              <Text style={[styles.addressText, { color: themeColors.text.secondary }]}>{activeAddress?.text || 'No address selected'}</Text>
              {activeAddress?.latitude && activeAddress?.longitude && (
                <Text style={{ fontSize: 11, color: themeColors.status.success, fontWeight: '700', marginTop: 2 }}>
                  📍 GPS Pinned ({activeAddress.latitude.toFixed(4)}, {activeAddress.longitude.toFixed(4)})
                </Text>
              )}
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


      </ScrollView>

      <View style={[styles.footer, { backgroundColor: themeColors.background.secondary, borderTopColor: themeColors.border.default }]}>
        <Text style={{ ...typography.caption, color: themeColors.text.secondary, marginBottom: spacing.md, textAlign: 'center' }}>
          Final bill amount will be calculated by the pharmacy upon confirmation.
        </Text>
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
});
