import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from '../../../components/ui/Button';
import { useThemeColors, typography, spacing } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../../store/useCartStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/MainNavigator';

type Props = NativeStackScreenProps<MainStackParamList>;

export const CartScreen = ({ navigation }: Props) => {
  const { cartItems, updateQty } = useCartStore();
  const themeColors = useThemeColors();

  const subtotal = cartItems.reduce((acc, item) => acc + item.unitPrice * item.qty, 0);
  const deliveryFee = cartItems.length > 0 ? 25.0 : 0.0;
  const total = subtotal + deliveryFee;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: themeColors.background.secondary, borderBottomColor: themeColors.border.default }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text.primary }]}>My Cart</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {cartItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cart-outline" size={64} color={themeColors.text.secondary} />
            <Text style={[styles.emptyTitle, { color: themeColors.text.primary }]}>Your Cart is Empty</Text>
            <Text style={[styles.emptySub, { color: themeColors.text.secondary }]}>Add medicines from search or home to proceed.</Text>
            <Button
              title="Browse Medicines"
              onPress={() => navigation.navigate('Tabs')}
              style={styles.browseBtn}
            />
          </View>
        ) : (
          <>
            {cartItems.map((item) => (
              <View key={item.id} style={[styles.cartItem, { backgroundColor: themeColors.background.secondary, borderColor: themeColors.border.default }]}>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { color: themeColors.text.primary }]}>{item.name}</Text>
                  <Text style={[styles.itemPrice, { color: themeColors.brand.primary }]}>₹{(item.unitPrice * item.qty).toFixed(2)}</Text>
                  {item.rxRequired && (
                    <View style={styles.rxBadge}>
                      <Text style={styles.rxText}>Prescription Needed</Text>
                    </View>
                  )}
                </View>

                <View style={[styles.qtyContainer, { backgroundColor: themeColors.background.primary, borderColor: themeColors.border.default }]}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, -1)}>
                    <Ionicons name="remove" size={16} color={themeColors.brand.primary} />
                  </TouchableOpacity>
                  <Text style={[styles.qtyText, { color: themeColors.text.primary }]}>{item.qty}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item.id, 1)}>
                    <Ionicons name="add" size={16} color={themeColors.brand.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={[styles.billCard, { backgroundColor: themeColors.background.secondary, borderColor: themeColors.border.default }]}>
              <Text style={[styles.billTitle, { color: themeColors.text.primary }]}>Bill Summary</Text>
              <View style={styles.billRow}>
                <Text style={[styles.billLabel, { color: themeColors.text.secondary }]}>Item Total</Text>
                <Text style={[styles.billValue, { color: themeColors.text.primary }]}>₹{subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={[styles.billLabel, { color: themeColors.text.secondary }]}>Delivery Fee</Text>
                <Text style={[styles.billValue, { color: themeColors.text.primary }]}>₹{deliveryFee.toFixed(2)}</Text>
              </View>
              <View style={[styles.billRow, styles.totalRow, { borderTopColor: themeColors.border.default }]}>
                <Text style={[styles.totalLabel, { color: themeColors.text.primary }]}>To Pay</Text>
                <Text style={[styles.totalValue, { color: themeColors.brand.primary }]}>₹{total.toFixed(2)}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {cartItems.length > 0 && (
        <View style={[styles.footer, { backgroundColor: themeColors.background.secondary, borderTopColor: themeColors.border.default }]}>
          <Button
            title="Proceed to Checkout"
            onPress={() => navigation.navigate('Checkout')}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  title: {
    ...typography.h2,
  },
  content: {
    padding: spacing.lg,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...typography.bodyStrong,
  },
  itemPrice: {
    ...typography.body,
    marginTop: 2,
  },
  rxBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  rxText: {
    ...typography.caption,
    color: '#EF4444',
    fontSize: 10,
    fontWeight: 'bold',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: spacing.sm,
    borderWidth: 1,
  },
  qtyBtn: {
    padding: spacing.xs,
  },
  qtyText: {
    ...typography.bodyStrong,
    paddingHorizontal: spacing.sm,
  },
  billCard: {
    padding: spacing.lg,
    borderRadius: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
  },
  billTitle: {
    ...typography.h2,
    marginBottom: spacing.md,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  billLabel: {
    ...typography.body,
  },
  billValue: {
    ...typography.body,
  },
  totalRow: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },
  totalLabel: {
    ...typography.h2,
  },
  totalValue: {
    ...typography.h2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyTitle: {
    ...typography.h2,
    marginTop: spacing.md,
  },
  emptySub: {
    ...typography.body,
    marginTop: 4,
    marginBottom: spacing.xl,
  },
  browseBtn: {
    width: 200,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    borderTopWidth: 1,
  },
});
