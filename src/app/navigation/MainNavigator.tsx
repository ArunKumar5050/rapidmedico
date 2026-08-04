import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { MedicineDetailScreen } from '../../features/search/screens/MedicineDetailScreen';
import { PrescriptionUploadScreen } from '../../features/prescription/screens/PrescriptionUploadScreen';
import { CartScreen } from '../../features/cart/screens/CartScreen';
import { CheckoutScreen } from '../../features/checkout/screens/CheckoutScreen';
import { OrderTrackingScreen } from '../../features/tracking/screens/OrderTrackingScreen';
import { LiveTrackingScreen } from '../../features/tracking/screens/LiveTrackingScreen';
import { SupportChatScreen } from '../../features/support/screens/SupportChatScreen';
import { AddressManagementScreen } from '../../features/profile/screens/AddressManagementScreen';
import { FamilyMembersScreen } from '../../features/familyMembers/screens/FamilyMembersScreen';
import { HealthRecordsScreen } from '../../features/healthRecords/screens/HealthRecordsScreen';
import { SettingsScreen } from '../../features/settings/screens/SettingsScreen';
import { ReferralScreen } from '../../features/referral/screens/ReferralScreen';
import { CouponsScreen } from '../../features/coupons/screens/CouponsScreen';
import { CustomOrderRequestScreen } from '../../features/search/screens/CustomOrderRequestScreen';
import { CustomOrderProcessingScreen } from '../../features/search/screens/CustomOrderProcessingScreen';
import { CustomOrderPaymentScreen } from '../../features/search/screens/CustomOrderPaymentScreen';

export type MainStackParamList = {
  Tabs: undefined;
  MedicineDetail: { medicineId: string };
  PrescriptionUpload: undefined;
  Cart: undefined;
  Checkout: undefined;
  OrderTracking: { orderId: string };
  LiveTracking: { orderId: string };
  SupportChat: undefined;
  AddressManagement: undefined;
  FamilyMembers: undefined;
  HealthRecords: undefined;
  Settings: undefined;
  Referral: undefined;
  Coupons: undefined;
  CustomOrderRequest: { initialMedicineName?: string };
  CustomOrderProcessing: { orderId: string };
  CustomOrderPayment: { orderId: string };
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export const MainNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="MedicineDetail" component={MedicineDetailScreen} />
      <Stack.Screen name="PrescriptionUpload" component={PrescriptionUploadScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
      <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} />
      <Stack.Screen name="SupportChat" component={SupportChatScreen} />
      <Stack.Screen name="AddressManagement" component={AddressManagementScreen} />
      <Stack.Screen name="FamilyMembers" component={FamilyMembersScreen} />
      <Stack.Screen name="HealthRecords" component={HealthRecordsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Referral" component={ReferralScreen} />
      <Stack.Screen name="Coupons" component={CouponsScreen} />
      <Stack.Screen name="CustomOrderRequest" component={CustomOrderRequestScreen} />
      <Stack.Screen name="CustomOrderProcessing" component={CustomOrderProcessingScreen} />
      <Stack.Screen name="CustomOrderPayment" component={CustomOrderPaymentScreen} />
    </Stack.Navigator>
  );
};
