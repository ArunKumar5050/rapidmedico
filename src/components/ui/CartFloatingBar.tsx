import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useCartStore } from '../../store/useCartStore';
import { useThemeColors, typography, spacing } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../app/navigation/MainNavigator';

export const CartFloatingBar = () => {
  const cartItems = useCartStore((state) => state.cartItems);
  const themeColors = useThemeColors();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  if (cartItems.length === 0) return null;

  const totalItems = cartItems.reduce((sum, item) => sum + item.qty, 0);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.brand.primary }]}>
      <View style={styles.info}>
        <Text style={styles.itemsText}>{totalItems} {totalItems === 1 ? 'item' : 'items'} in cart</Text>
      </View>
      <TouchableOpacity 
        style={styles.actionBtn}
        onPress={() => navigation.navigate('Cart')}
      >
        <Text style={[styles.actionText, { color: themeColors.brand.primary }]}>View Cart</Text>
        <Ionicons name="cart" size={20} color={themeColors.brand.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopLeftRadius: spacing.lg,
    borderTopRightRadius: spacing.lg,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  info: {
    flexDirection: 'column',
  },
  itemsText: {
    ...typography.h3,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.xl,
  },
  actionText: {
    ...typography.button,
    marginRight: spacing.xs,
  }
});
