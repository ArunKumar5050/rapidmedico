import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useThemeColors, typography, spacing } from '../../../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/MainNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../../components/ui/Header';
import { Ionicons } from '@expo/vector-icons';
import { payCustomOrder } from '../../../services/firebase/customOrders';

type Props = NativeStackScreenProps<MainStackParamList, 'PaymentMethods'>;

export const PaymentMethodsScreen = ({ navigation, route }: Props) => {
  const { orderId, amount, isCustomOrder } = route.params;
  const themeColors = useThemeColors();

  const handleRazorpay = () => {
    navigation.navigate('RazorpayCheckout', { orderId, amount, isCustomOrder });
  };

  const handleCOD = async () => {
    try {
      if (isCustomOrder) {
        await payCustomOrder(orderId);
      } else {
        // Handle standard order COD
      }
      
      Alert.alert(
        "Order Confirmed",
        "Your order has been placed with Cash on Delivery.",
        [
          { text: "View Orders", onPress: () => navigation.navigate('Tabs', { screen: 'Orders' } as any) },
          { text: "OK", onPress: () => navigation.navigate('Tabs') }
        ]
      );
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to confirm order. Please try again.");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      <Header title="Payment Options" showBack onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        
        <Text style={[styles.title, { color: themeColors.text.primary }]}>
          Amount to Pay: <Text style={{ color: themeColors.brand.primary }}>₹{amount.toFixed(2)}</Text>
        </Text>

        <Text style={[styles.subtitle, { color: themeColors.text.secondary }]}>
          Choose a payment method to complete your order.
        </Text>

        <TouchableOpacity 
          style={[styles.methodCard, { backgroundColor: themeColors.background.secondary, borderColor: themeColors.border.default }]} 
          onPress={handleRazorpay}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#3395FF20' }]}>
            <Ionicons name="card" size={28} color="#3395FF" />
          </View>
          <View style={styles.methodInfo}>
            <Text style={[styles.methodTitle, { color: themeColors.text.primary }]}>Pay Online (Razorpay)</Text>
            <Text style={[styles.methodSubtitle, { color: themeColors.text.secondary }]}>UPI, Credit/Debit Cards, Netbanking</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={themeColors.text.secondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.methodCard, { backgroundColor: themeColors.background.secondary, borderColor: themeColors.border.default }]} 
          onPress={handleCOD}
        >
          <View style={[styles.iconContainer, { backgroundColor: themeColors.status.success + '20' }]}>
            <Ionicons name="cash" size={28} color={themeColors.status.success} />
          </View>
          <View style={styles.methodInfo}>
            <Text style={[styles.methodTitle, { color: themeColors.text.primary }]}>Cash on Delivery</Text>
            <Text style={[styles.methodSubtitle, { color: themeColors.text.secondary }]}>Pay when your order arrives</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={themeColors.text.secondary} />
        </TouchableOpacity>

      </ScrollView>
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
  title: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    marginBottom: spacing.xl,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: spacing.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    ...typography.bodyStrong,
    marginBottom: spacing.xs,
  },
  methodSubtitle: {
    ...typography.caption,
  }
});
