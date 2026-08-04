import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { useThemeColors, typography, spacing } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/MainNavigator';
import { useAuthStore } from '../../../store/auth';
import { subscribeToUserOrders, Order, OrderStatus } from '../../../services/firebase/orders';
import { subscribeToUserCustomOrders, CustomOrder } from '../../../services/firebase/customOrders';

type Props = NativeStackScreenProps<MainStackParamList>;

// Unified type for rendering
type UnifiedOrder = 
  | (Order & { type: 'standard' })
  | (CustomOrder & { type: 'custom' });

const getStatusConfig = (status: string, themeColors: any) => {
  switch (status) {
    case 'PENDING':
    case 'processing':
      return { label: 'Pending', color: themeColors.status.info };
    case 'PREPARING':
    case 'confirmed':
      return { label: 'Preparing', color: themeColors.status.warning };
    case 'ASSIGNED':
      return { label: 'Partner Assigned', color: themeColors.status.info };
    case 'OUT_FOR_DELIVERY':
      return { label: 'Out for Delivery', color: themeColors.status.warning };
    case 'DELIVERED':
    case 'completed':
    case 'paid':
      return { label: 'Completed', color: themeColors.status.success };
    default:
      return { label: 'Unknown', color: themeColors.text.muted };
  }
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return 'Just now';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const OrdersListScreen = ({ navigation }: Props) => {
  const themeColors = useThemeColors();
  const { user } = useAuthStore();
  
  const [standardOrders, setStandardOrders] = useState<Order[]>([]);
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    let standardLoaded = false;
    let customLoaded = false;

    const checkLoaded = () => {
      if (standardLoaded && customLoaded) setIsLoading(false);
    };

    const unsubStandard = subscribeToUserOrders(user.uid, (fetchedOrders) => {
      setStandardOrders(fetchedOrders);
      standardLoaded = true;
      checkLoaded();
    });

    const unsubCustom = subscribeToUserCustomOrders(user.uid, (fetchedCustom) => {
      setCustomOrders(fetchedCustom);
      customLoaded = true;
      checkLoaded();
    });

    return () => {
      unsubStandard();
      unsubCustom();
    };
  }, [user]);

  const allOrders: UnifiedOrder[] = [
    ...standardOrders.map(o => ({ ...o, type: 'standard' as const })),
    ...customOrders.map(o => ({ ...o, type: 'custom' as const }))
  ].sort((a, b) => {
    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return timeB - timeA;
  });

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: themeColors.background.primary }]}>
        <ActivityIndicator size="large" color={themeColors.brand.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: themeColors.background.secondary, borderBottomColor: themeColors.border.default }]}>
        <Text style={[styles.title, { color: themeColors.text.primary }]}>My Orders</Text>
      </View>

      <ScrollView style={styles.content}>
        {allOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={themeColors.text.muted} />
            <Text style={[styles.emptyText, { color: themeColors.text.secondary }]}>No orders found.</Text>
          </View>
        ) : (
          allOrders.map((order) => {
            const statusConfig = getStatusConfig(order.status, themeColors);
            const isCustom = order.type === 'custom';
            
            const itemCount = !isCustom 
              ? (order as Order).items?.reduce((sum, item) => sum + item.qty, 0) || 0
              : 1; // Custom orders are technically just 1 prescription upload

            const title = isCustom 
              ? (order as CustomOrder).medicineName 
              : `${(order as Order).id?.substring(0, 8).toUpperCase() || 'ORDER'}`;

            const total = isCustom 
              ? (order as CustomOrder).billAmount ? `₹${(order as CustomOrder).billAmount?.toFixed(2)}` : 'Pending Bill'
              : `₹${(order as Order).totalAmount?.toFixed(2)}`;

            return (
              <Card key={order.id} style={styles.orderCard}>
                <TouchableOpacity
                  onPress={() => {
                    if (isCustom) {
                      // Navigate to custom order tracking/details
                      navigation.navigate('CustomOrderProcessing', { orderId: order.id! });
                    } else {
                      // Navigate to standard order tracking
                      navigation.navigate('OrderTracking', { orderId: order.id! });
                    }
                  }}
                >
                  <View style={styles.cardHeader}>
                    <Text style={[styles.orderId, { color: themeColors.text.primary }]}>
                      {isCustom ? `Prescription Request` : title}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
                      <Text style={[styles.statusText, { color: statusConfig.color }]}>
                        {statusConfig.label}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.dateText, { color: themeColors.text.secondary }]}>
                    {formatDate(order.createdAt)}
                  </Text>

                  <View style={[styles.cardFooter, { borderTopColor: themeColors.border.default }]}>
                    <Text style={[styles.itemsCount, { color: themeColors.text.secondary }]}>
                      {isCustom ? title : `${itemCount} Items`}
                    </Text>
                    <Text style={[styles.totalText, { color: themeColors.brand.primary }]}>{total}</Text>
                  </View>

                  {order.status === 'OUT_FOR_DELIVERY' && !isCustom && (
                    <TouchableOpacity 
                      style={[styles.trackBtn, { backgroundColor: themeColors.brand.primary }]}
                      onPress={() => navigation.navigate('LiveTracking', { orderId: order.id! })}
                    >
                      <Ionicons name="location" size={16} color="#FFFFFF" />
                      <Text style={styles.trackBtnText}>Track Order Live</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </Card>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  title: {
    ...typography.h1,
  },
  content: {
    padding: spacing.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
  },
  orderCard: {
    marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  orderId: {
    ...typography.bodyStrong,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: spacing.xs,
  },
  statusText: {
    ...typography.caption,
    fontWeight: 'bold',
  },
  dateText: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: spacing.sm,
  },
  itemsCount: {
    ...typography.body,
  },
  totalText: {
    ...typography.bodyStrong,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  trackBtnText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
