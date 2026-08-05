import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useThemeColors, typography, spacing } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/MainNavigator';
import { subscribeToOrder, Order, OrderStatus } from '../../../services/firebase/orders';

type Props = NativeStackScreenProps<MainStackParamList, 'OrderTracking'>;

// Map the backend status to an index to easily calculate "done" and "active" states
const STATUS_INDEX: Record<OrderStatus, number> = {
  'PENDING': 0,
  'PREPARING': 1,
  'ASSIGNED': 2,
  'OUT_FOR_DELIVERY': 3,
  'DELIVERED': 4,
};

export const OrderTrackingScreen = ({ route, navigation }: Props) => {
  const { orderId } = route.params || { orderId: 'ORD-89421' };
  const themeColors = useThemeColors();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderId || orderId.startsWith('ORD-')) {
      // Mock or missing ID fallback
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToOrder(orderId, (fetchedOrder) => {
      setOrder(fetchedOrder);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [orderId]);

  const currentIndex = order ? STATUS_INDEX[order.status] : 1; // Default to index 1 if mock

  const steps = [
    { label: 'Order Placed & Searching Pharmacy', done: currentIndex >= 0, active: currentIndex === 0 },
    { label: 'Pharmacy Assigned & Preparing', done: currentIndex >= 1, active: currentIndex === 1 },
    { label: 'Delivery Partner Assigned', done: currentIndex >= 2, active: currentIndex === 2 },
    { label: 'Out for Delivery', done: currentIndex >= 3, active: currentIndex === 3 },
    { label: 'Delivered', done: currentIndex >= 4, active: currentIndex === 4 },
  ];

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: themeColors.background.primary }]}>
        <ActivityIndicator size="large" color={themeColors.brand.primary} />
      </View>
    );
  }

  const displayId = order ? order.id?.substring(0, 8).toUpperCase() : orderId;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: themeColors.background.secondary, borderBottomColor: themeColors.border.default }]}>
        <TouchableOpacity onPress={() => navigation.navigate('Tabs')}>
          <Ionicons name="close" size={24} color={themeColors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text.primary }]}>Order Status</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Card style={styles.statusCard}>
          <Text style={[styles.orderIdTitle, { color: themeColors.text.primary }]}>{displayId}</Text>
          <Text style={[styles.etaText, { color: themeColors.brand.primary }]}>Estimated Delivery: 15-20 mins</Text>

          <View style={styles.timeline}>
            {steps.map((step, idx) => (
              <View key={idx} style={styles.timelineItem}>
                <View style={styles.iconColumn}>
                  <View style={[
                    styles.circle,
                    { borderColor: themeColors.border.default, backgroundColor: themeColors.background.primary },
                    step.done && { backgroundColor: themeColors.status.success, borderColor: themeColors.status.success },
                    step.active && { borderColor: themeColors.brand.primary, backgroundColor: 'rgba(16, 185, 129, 0.2)' },
                  ]}>
                    {step.done && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                  {idx < steps.length - 1 && <View style={[styles.line, { backgroundColor: themeColors.border.default }, step.done && { backgroundColor: themeColors.status.success }]} />}
                </View>
                <Text style={[
                  styles.stepText,
                  { color: themeColors.text.secondary },
                  step.done && { color: themeColors.text.primary },
                  step.active && { color: themeColors.brand.primary, fontWeight: 'bold' },
                ]}>
                  {step.label}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Privacy Notice Banner */}
        <Card style={styles.privacyCard}>
          <Ionicons name="shield-checkmark-outline" size={24} color={themeColors.brand.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.privacyHeading, { color: themeColors.brand.primary }]}>Strict Privacy Active</Text>
            <Text style={[styles.privacySub, { color: themeColors.text.secondary }]}>Fulfillment store information is anonymized to protect your personal order data.</Text>
          </View>
        </Card>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: themeColors.background.secondary, borderTopColor: themeColors.border.default }]}>
        <Button
          title="Track Delivery Partner Live"
          onPress={() => navigation.navigate('LiveTracking', { orderId })}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
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
  statusCard: { marginBottom: spacing.lg },
  orderIdTitle: { ...typography.h2 },
  etaText: { ...typography.bodyStrong, marginBottom: spacing.lg },
  timeline: { paddingLeft: spacing.xs },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, minHeight: 50 },
  iconColumn: { alignItems: 'center' },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  line: { width: 2, height: 30 },
  stepText: { ...typography.body },
  privacyCard: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  privacyHeading: { ...typography.bodyStrong },
  privacySub: { ...typography.caption, marginTop: 2 },
  footer: { padding: spacing.lg, paddingBottom: spacing.xxxl, borderTopWidth: 1 },
});
