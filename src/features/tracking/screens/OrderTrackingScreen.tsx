import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useThemeColors, typography, spacing } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/MainNavigator';
import { subscribeToOrder, Order } from '../../../services/firebase/orders';
import { subscribeToCustomOrder, CustomOrder } from '../../../services/firebase/customOrders';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<MainStackParamList, 'OrderTracking'>;

export const OrderTrackingScreen = ({ route, navigation }: Props) => {
  const { orderId, isCustomOrder } = route.params || { orderId: '', isCustomOrder: false };
  const themeColors = useThemeColors();
  
  const [order, setOrder] = useState<Order | CustomOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }

    if (isCustomOrder) {
      const unsubscribe = subscribeToCustomOrder(orderId, (fetchedOrder) => {
        setOrder(fetchedOrder);
        setIsLoading(false);
      });
      return () => unsubscribe();
    } else {
      const unsubscribe = subscribeToOrder(orderId, (fetchedOrder) => {
        if (fetchedOrder) {
          setOrder(fetchedOrder);
        } else {
          subscribeToCustomOrder(orderId, (customFetched) => {
            setOrder(customFetched);
          });
        }
        setIsLoading(false);
      });
      return () => unsubscribe();
    }
  }, [orderId, isCustomOrder]);

  if (isLoading || !order) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent, { backgroundColor: themeColors.background.primary }]}>
        <ActivityIndicator size="large" color={themeColors.brand.primary} />
        <Text style={[styles.loadingText, { color: themeColors.text.secondary }]}>Loading live order details...</Text>
      </SafeAreaView>
    );
  }

  const rawStatus = String((order as any).status || '').toLowerCase();
  const rawStoreStatus = String((order as any).storeStatus || '').toUpperCase();

  // Strict check: OUT_OF_DELIVERY happens ONLY when storeStatus is OUT_OF_DELIVERY or status is out_for_delivery / delivery boy assigned
  const isDelivered = 
    rawStatus === 'completed' || 
    rawStatus === 'delivered' || 
    rawStoreStatus === 'COMPLETED' || 
    rawStoreStatus === 'DELIVERED';

  const isOutOfDelivery = 
    !isDelivered && (
      rawStoreStatus === 'OUT_OF_DELIVERY' || 
      rawStoreStatus === 'OUT_FOR_DELIVERY' || 
      rawStatus === 'out_for_delivery' || 
      rawStatus === 'delivery boy assigned'
    );

  const isPreparingOrReady = 
    !isDelivered && 
    !isOutOfDelivery && (
      rawStoreStatus === 'READY' ||
      rawStoreStatus === 'PACKED' ||
      rawStoreStatus === 'PREPARING' ||
      rawStoreStatus === 'ACCEPTED' ||
      rawStoreStatus === 'DELIVERY_REQUESTED' ||
      rawStoreStatus === 'DELIVERY_ASSIGNED' ||
      rawStatus === 'paid'
    );

  const isPendingDoctor = rawStatus === 'pending_doctor_confirmation';
  const isPendingStore = rawStatus === 'pending' || rawStoreStatus === 'NEW';

  // Stepper Calculation
  let currentIndex = 0;
  if (isDelivered) {
    currentIndex = 3;
  } else if (isOutOfDelivery) {
    currentIndex = 2;
  } else if (isPreparingOrReady) {
    currentIndex = 1;
  } else {
    currentIndex = 0;
  }

  const steps = [
    { label: isPendingDoctor ? 'Waiting for Doctor Call' : 'Order Placed & Finding Store', done: currentIndex >= 0, active: currentIndex === 0 },
    { label: 'Pharmacy Preparing & Packing Order', done: currentIndex >= 1, active: currentIndex === 1 },
    { label: 'Out for Delivery (Handed to Delivery Boy)', done: currentIndex >= 2, active: currentIndex === 2 },
    { label: 'Delivered', done: currentIndex >= 3, active: currentIndex === 3 },
  ];

  const displayId = order.id ? order.id.substring(0, 8).toUpperCase() : orderId;
  
  // Real database values only - NO fake hardcoded defaults
  const realDeliveryOtp = (order as any)?.deliveryOtp || (order as any)?.otp || null;
  const realRiderName = (order as any)?.deliveryPartnerName || 'RapidMedi Delivery Partner';
  const realRiderPhone = (order as any)?.deliveryPartnerPhone || '';
  const realRiderVehicle = (order as any)?.deliveryPartnerVehicle || '';

  const handleCallRider = () => {
    if (realRiderPhone && realRiderPhone.trim().length > 0) {
      Linking.openURL(`tel:${realRiderPhone.replace(/\D/g, '')}`);
    } else {
      Alert.alert('Delivery Partner', 'Phone number not available yet.');
    }
  };

  const isCustom = isCustomOrder || ('medicines' in order);
  let itemsList: any[] = [];
  if ((order as any).itemizedBill && (order as any).itemizedBill.length > 0) {
    itemsList = (order as any).itemizedBill.map((it: any) => ({
      name: it.medicine || it.name,
      qty: it.qty || it.quantity || 1,
      price: it.price || ((it.unitPrice || 0) * (it.qty || it.quantity || 1))
    }));
  } else if (isCustomOrder || ('medicines' in order)) {
    itemsList = (order as any).medicines?.map((m: string) => ({
      name: m,
      qty: 1,
      price: (order as any).billAmount || 0
    })) || [];
  } else {
    itemsList = (order as Order).items?.map((it: any) => ({
      name: it.name,
      qty: it.qty || it.quantity || 1,
      price: (it.unitPrice !== undefined ? it.unitPrice : it.price || 0) * (it.qty || it.quantity || 1)
    })) || [];
  }

  const isPaid = ['COMPLETED', 'completed', 'PAID', 'paid', 'COD', 'cod'].includes(String((order as any)?.paymentStatus || '').toUpperCase());
  const totalAmount = Number((order as any).billAmount || (order as any).totalAmount || 0);
  const hasPricedBill = Boolean(totalAmount && totalAmount > 0);
  const showPrices = !isPendingStore && !isPendingDoctor && hasPricedBill;
  const needsPayment = !isPendingStore && !isPendingDoctor && !isPaid && hasPricedBill;

  const deliveryFee = (order as any).deliveryCharge !== undefined ? Number((order as any).deliveryCharge) : (hasPricedBill ? 100 : 0);
  const itemsSubtotal = Math.max(0, totalAmount - (deliveryFee > 0 && totalAmount >= deliveryFee ? deliveryFee : 0));
  const paymentMethod = (order as any)?.paymentMethod || ((order as any)?.paymentStatus === 'COD' ? 'Cash on Delivery' : 'Paid Online');
  const deliveryAddress = (order as any)?.address || 'Near Customer Location';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColors.background.secondary, borderBottomColor: themeColors.border.default }]}>
        <TouchableOpacity onPress={() => navigation.navigate('Tabs')}>
          <Ionicons name="close" size={24} color={themeColors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text.primary }]}>Order & Delivery Tracking</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SupportChat')}>
          <Ionicons name="help-circle-outline" size={24} color={themeColors.brand.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Status & Progress Stepper */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeaderRow}>
            <View>
              <Text style={[styles.orderIdTitle, { color: themeColors.text.primary }]}>Order #{displayId}</Text>
              <Text style={[styles.etaText, { color: themeColors.brand.primary }]}>
                {isDelivered 
                  ? 'Delivered Successfully 🎉' 
                  : isOutOfDelivery 
                    ? 'Delivery Boy is On The Way ⚡' 
                    : isPreparingOrReady
                      ? 'Pharmacy is Preparing Order 🏥'
                      : isPendingDoctor
                        ? 'Wait for call from Dr. for 5 mins 🩺'
                        : 'Finding nearest store... 🏪'
                }
              </Text>
            </View>
            <View style={[styles.statusBadge, { 
              backgroundColor: isDelivered 
                ? 'rgba(16, 185, 129, 0.15)' 
                : isOutOfDelivery 
                  ? 'rgba(245, 158, 11, 0.15)' 
                  : 'rgba(59, 130, 246, 0.15)' 
            }]}>
              <Text style={[styles.statusBadgeText, { 
                color: isDelivered 
                  ? themeColors.status.success 
                  : isOutOfDelivery 
                    ? themeColors.status.warning 
                    : themeColors.brand.primary 
              }]}>
                {isDelivered 
                  ? 'DELIVERED' 
                  : isOutOfDelivery 
                    ? 'OUT FOR DELIVERY' 
                    : rawStoreStatus === 'READY' 
                      ? 'PACKED & READY' 
                      : isPreparingOrReady
                        ? 'PREPARING'
                        : isPendingDoctor
                          ? 'WAITING DOCTOR'
                          : 'SEARCHING STORE'
                }
              </Text>
            </View>
          </View>

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

        {/* Doctor Consultation Notice */}
        {isPendingDoctor && currentIndex === 0 && (
          <Card style={[styles.statusCard, { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: themeColors.brand.primary }]}>
            <View style={{ alignItems: 'center', padding: spacing.md }}>
              <Ionicons name="call" size={40} color={themeColors.brand.primary} />
              <Text style={{ ...typography.h2, color: themeColors.brand.primary, marginTop: spacing.sm, textAlign: 'center' }}>
                Doctor Consultation Required
              </Text>
              <Text style={{ ...typography.body, color: themeColors.text.primary, marginTop: spacing.xs, textAlign: 'center', lineHeight: 20 }}>
                Please wait for a call from our doctor within the next 5 minutes to confirm your prescription. After confirmation, your order will be sent to the nearest pharmacy.
              </Text>
            </View>
          </Card>
        )}

        {/* Delivery Verification OTP Box: ONLY SHOWN WHEN OUT OF DELIVERY */}
        {isOutOfDelivery && realDeliveryOtp && (
          <Card style={[styles.otpCard, { backgroundColor: themeColors.background.secondary, borderColor: themeColors.brand.primary }]}>
            <View style={styles.otpHeader}>
              <Ionicons name="key-outline" size={20} color={themeColors.brand.primary} />
              <Text style={[styles.otpTitle, { color: themeColors.brand.primary }]}>Delivery Verification OTP</Text>
            </View>
            <View style={styles.otpBox}>
              <Text style={[styles.otpValue, { color: themeColors.brand.primary }]}>{realDeliveryOtp}</Text>
            </View>
            <Text style={[styles.otpHelp, { color: themeColors.text.secondary }]}>
              Give this 4-digit OTP to the delivery boy when he reaches your location to complete delivery.
            </Text>
          </Card>
        )}

        {/* Track Delivery Boy Card: ONLY SHOWN WHEN OUT OF DELIVERY */}
        {isOutOfDelivery && (
          <Card style={[styles.deliveryBoyCard, { backgroundColor: themeColors.background.secondary, borderColor: themeColors.border.default }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeading, { color: themeColors.text.primary }]}>Delivery Partner Details</Text>
              <View style={styles.liveIndicator}>
                <View style={styles.greenDot} />
                <Text style={styles.liveText}>OUT FOR DELIVERY</Text>
              </View>
            </View>

            <View style={styles.riderRow}>
              <View style={[styles.riderAvatar, { backgroundColor: themeColors.brand.primary }]}>
                <Text style={styles.riderAvatarText}>{realRiderName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.riderName, { color: themeColors.text.primary }]}>{realRiderName}</Text>
                <Text style={[styles.riderRole, { color: themeColors.text.secondary }]}>RapidMedi Verified Partner</Text>
                {realRiderVehicle ? (
                  <Text style={[styles.riderVehicleText, { color: themeColors.text.muted }]}>🛵 {realRiderVehicle}</Text>
                ) : null}
              </View>
              {realRiderPhone ? (
                <TouchableOpacity style={[styles.callBtn, { backgroundColor: themeColors.status.success }]} onPress={handleCallRider}>
                  <Ionicons name="call" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity 
              style={[styles.mapBtn, { backgroundColor: themeColors.brand.primary }]}
              onPress={() => navigation.navigate('LiveTracking', { orderId: order.id! })}
            >
              <Ionicons name="navigate" size={18} color="#FFFFFF" />
              <Text style={styles.mapBtnText}>Track Delivery Boy on Live GPS Map</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Order Items & Medicines Details */}
        <Card style={styles.detailsCard}>
          <Text style={[styles.sectionHeading, { color: themeColors.text.primary }]}>Order Items</Text>
          {itemsList.length > 0 ? (
            itemsList.map((item, idx) => (
              <View key={idx} style={[styles.itemRow, { borderBottomColor: themeColors.border.default }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, { color: themeColors.text.primary }]}>{item.name}</Text>
                  <Text style={[styles.itemQty, { color: themeColors.text.secondary }]}>Qty: {item.qty}</Text>
                </View>
                {(showPrices && item.price > 0) && (
                  <Text style={[styles.itemPrice, { color: themeColors.text.primary }]}>₹{item.price.toFixed(2)}</Text>
                )}
              </View>
            ))
          ) : (
            <Text style={[styles.emptyItemsText, { color: themeColors.text.secondary }]}>Prescription Medicine Request</Text>
          )}

          {/* Delivery Address */}
          <View style={styles.addressSection}>
            <Text style={[styles.subHeading, { color: themeColors.text.secondary }]}>Delivery Address</Text>
            <View style={styles.addressRow}>
              <Ionicons name="location-sharp" size={18} color={themeColors.brand.primary} />
              <Text style={[styles.addressText, { color: themeColors.text.primary }]}>{deliveryAddress}</Text>
            </View>
          </View>

          {/* Bill Summary */}
          {(!isPendingStore && !isPendingDoctor && hasPricedBill) ? (
            <View style={[styles.billSection, { borderTopColor: themeColors.border.default }]}>
              <View style={styles.billRow}>
                <Text style={[styles.billLabel, { color: themeColors.text.secondary }]}>Medicines Total</Text>
                <Text style={[styles.billVal, { color: themeColors.text.primary }]}>
                  {totalAmount > 0 ? `₹${itemsSubtotal.toFixed(2)}` : 'Billing is on process'}
                </Text>
              </View>
              <View style={styles.billRow}>
                <Text style={[styles.billLabel, { color: themeColors.text.secondary }]}>Delivery Fee</Text>
                <Text style={[styles.billVal, { color: themeColors.text.primary }]}>
                  {totalAmount > 0 ? `₹${deliveryFee.toFixed(2)}` : '₹100.00'}
                </Text>
              </View>
              {isPaid && (
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, { color: themeColors.text.secondary }]}>Payment Mode</Text>
                  <Text style={[styles.billVal, { color: themeColors.brand.primary }]}>{paymentMethod}</Text>
                </View>
              )}
              <View style={[styles.billRow, styles.totalRow]}>
                <Text style={[styles.totalLabel, { color: themeColors.text.primary }]}>Grand Total</Text>
                <Text style={[styles.totalVal, { color: themeColors.brand.primary }]}>
                  {totalAmount > 0 ? `₹${totalAmount.toFixed(2)}` : 'Billing is on process'}
                </Text>
              </View>
            </View>
          ) : (
            <View style={[styles.billSection, { borderTopColor: themeColors.border.default }]}>
              <Text style={[styles.billLabel, { color: themeColors.text.secondary, textAlign: 'center', marginVertical: spacing.md }]}>
                Billing is on process. Store will verify and provide the final bill.
              </Text>
            </View>
          )}
        </Card>

        {/* Privacy Notice Banner */}
        <Card style={styles.privacyCard}>
          <Ionicons name="shield-checkmark-outline" size={24} color={themeColors.brand.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.privacyHeading, { color: themeColors.brand.primary }]}>Strict Privacy Active</Text>
            <Text style={[styles.privacySub, { color: themeColors.text.secondary }]}>All orders are packed in sealed tamper-proof packaging for full medical confidentiality.</Text>
          </View>
        </Card>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Footer CTA */}
      {needsPayment && (
        <View style={[styles.footer, { backgroundColor: themeColors.background.secondary, borderTopColor: themeColors.border.default }]}>
          <Text style={{ ...typography.caption, color: themeColors.status.warning, marginBottom: spacing.sm, textAlign: 'center' }}>
            Store has confirmed your order. Please complete payment to proceed.
          </Text>
          <Button
            title={`Pay ₹${totalAmount.toFixed(2)}`}
            onPress={() => navigation.navigate('PaymentMethods', { orderId: order.id!, amount: totalAmount, isCustomOrder: isCustom })}
          />
        </View>
      )}

      {isOutOfDelivery && !needsPayment && (
        <View style={[styles.footer, { backgroundColor: themeColors.background.secondary, borderTopColor: themeColors.border.default }]}>
          <Button
            title="Track Delivery Boy on Live Map"
            onPress={() => navigation.navigate('LiveTracking', { orderId: order.id! })}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...typography.body, marginTop: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  title: { ...typography.h2, fontSize: 18 },
  content: { padding: spacing.lg },
  statusCard: { marginBottom: spacing.md },
  statusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  orderIdTitle: { ...typography.h2, fontSize: 20 },
  etaText: { ...typography.bodyStrong, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: spacing.xs,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeline: { paddingLeft: spacing.xs, marginTop: spacing.sm },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, minHeight: 44 },
  iconColumn: { alignItems: 'center' },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  line: { width: 2, height: 24 },
  stepText: { ...typography.body, fontSize: 13 },
  otpCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  otpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  otpTitle: {
    ...typography.bodyStrong,
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  otpBox: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    marginVertical: spacing.xs,
  },
  otpValue: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 6,
  },
  otpHelp: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 16,
  },
  deliveryBoyCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionHeading: {
    ...typography.bodyStrong,
    fontSize: 15,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
  },
  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  riderAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  riderAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  riderName: {
    ...typography.bodyStrong,
    fontSize: 16,
  },
  riderRole: {
    ...typography.caption,
    marginTop: 1,
  },
  riderVehicleText: {
    fontSize: 11,
    marginTop: 2,
  },
  callBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: spacing.sm,
    gap: spacing.xs,
  },
  mapBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  detailsCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  itemName: {
    ...typography.bodyStrong,
    fontSize: 14,
  },
  itemQty: {
    ...typography.caption,
    marginTop: 2,
  },
  itemPrice: {
    ...typography.bodyStrong,
    fontSize: 14,
  },
  emptyItemsText: {
    ...typography.body,
    marginVertical: spacing.sm,
    fontStyle: 'italic',
  },
  addressSection: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  subHeading: {
    ...typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  addressText: {
    ...typography.body,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  billSection: {
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  billLabel: {
    ...typography.body,
    fontSize: 13,
  },
  billVal: {
    ...typography.bodyStrong,
    fontSize: 13,
  },
  totalRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  totalLabel: {
    ...typography.h2,
    fontSize: 16,
  },
  totalVal: {
    ...typography.h1,
    fontSize: 18,
  },
  privacyCard: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    padding: spacing.md,
  },
  privacyHeading: { ...typography.bodyStrong, fontSize: 13 },
  privacySub: { ...typography.caption, marginTop: 2, lineHeight: 16 },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
  },
});
