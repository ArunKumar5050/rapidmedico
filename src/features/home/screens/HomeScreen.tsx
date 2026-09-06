import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { useThemeColors, typography, spacing } from '../../../theme';
import { useAddressStore } from '../../../store/useAddressStore';
import { useReminderStore } from '../../../store/useReminderStore';
import { useAuthStore } from '../../../store/auth';
import { Card } from '../../../components/ui/Card';
import { CartFloatingBar } from '../../../components/ui/CartFloatingBar';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TabParamList } from '../../../app/navigation/TabNavigator';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { MainStackParamList } from '../../../app/navigation/MainNavigator';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'HomeTab'>,
  NativeStackScreenProps<MainStackParamList>
>;

export const HomeScreen = ({ navigation }: Props) => {
  const authUser = useAuthStore((state) => state.user);
  const firstName = authUser?.name ? authUser.name.split(' ')[0] : (authUser?.phone || 'Guest');
  const themeColors = useThemeColors();

  const getDefaultAddress = useAddressStore((state) => state.getDefaultAddress);
  const defaultAddress = getDefaultAddress();

  const { reminders, toggleReminder } = useReminderStore();
  const nextReminder = reminders.find((r) => !r.taken) || reminders[0];

  const formatAddress = (address: any) => {
    if (!address) return 'Add an address';
    const words = address.text.split(' ');
    const truncated = words.length > 3 ? words.slice(0, 3).join(' ') + '...' : address.text;
    return `${address.title} - ${truncated}`;
  };

  const quickServices = [
    {
      id: 'express',
      title: '10-Min Delivery',
      subtitle: 'Superfast Medicine',
      icon: 'flash',
      iconColor: '#F59E0B',
      bgColor: 'rgba(245, 158, 11, 0.12)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
      action: () => navigation.navigate('CustomOrderRequest', {}),
    },
    {
      id: 'rx',
      title: 'Upload Doctor Rx',
      subtitle: 'Get Instant Quote',
      icon: 'document-text',
      iconColor: '#10B981',
      bgColor: 'rgba(16, 185, 129, 0.12)',
      borderColor: 'rgba(16, 185, 129, 0.3)',
      action: () => navigation.navigate('PrescriptionUpload'),
    },
    {
      id: 'consult',
      title: 'Consult Doctor',
      subtitle: '24x7 Tele-Doc',
      icon: 'medical',
      iconColor: '#06B6D4',
      bgColor: 'rgba(6, 182, 212, 0.12)',
      borderColor: 'rgba(6, 182, 212, 0.3)',
      action: () => navigation.navigate('SupportChat'),
    },
    {
      id: 'lab',
      title: 'Book Lab Test',
      subtitle: 'Sample Pick up at Home',
      icon: 'flask',
      iconColor: '#8B5CF6',
      bgColor: 'rgba(139, 92, 246, 0.12)',
      borderColor: 'rgba(139, 92, 246, 0.3)',
      action: () => Alert.alert('Coming Soon', 'This feature is coming soon!'),
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: themeColors.background.primary }}>
      <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background.primary }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: themeColors.text.primary }]}>Hi, {firstName} 👋</Text>
          <TouchableOpacity
            style={[
              styles.addressPill,
              {
                backgroundColor: themeColors.background.secondary,
                borderColor: themeColors.border.default,
              },
            ]}
            onPress={() => navigation.navigate('AddressManagement')}
            activeOpacity={0.8}
          >
            <Ionicons name="location-sharp" size={14} color={themeColors.brand.primary} />
            <Text style={[styles.addressText, { color: themeColors.text.secondary }]} numberOfLines={1}>
              {formatAddress(defaultAddress)}
            </Text>
            <Ionicons name="chevron-down" size={12} color={themeColors.text.secondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.avatarButton, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: themeColors.brand.primary }]}
          onPress={() => navigation.navigate('ProfileTab')}
        >
          <Text style={[styles.avatarText, { color: themeColors.brand.primary }]}>{firstName.charAt(0).toUpperCase() || 'U'}</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <TouchableOpacity
        style={[
          styles.searchBar,
          {
            backgroundColor: themeColors.background.secondary,
            borderColor: themeColors.border.default,
          },
        ]}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('SearchTab')}
      >
        <Ionicons name="search-outline" size={20} color={themeColors.brand.primary} style={{ marginRight: spacing.sm }} />
        <Text style={[styles.searchText, { color: themeColors.text.secondary }]}>
          Search medicines, healthcare, lab tests...
        </Text>
      </TouchableOpacity>

      {/* Medicine Advisor Banner */}
      <TouchableOpacity
        style={[styles.emergencyBanner, { backgroundColor: '#EF4444' }]}
        activeOpacity={0.92}
        onPress={() => navigation.navigate('SupportChat')}
      >
        <View style={styles.emergencyIconBg}>
          <Ionicons name="chatbubbles" size={24} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>ASK EXPERT</Text>
          </View>
          <Text style={styles.emergencyTitle}>Medicine Advisor</Text>
          <Text style={styles.emergencySubtitle}>Chat with experts for medical queries</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Call Support Banner */}
      <TouchableOpacity
        style={[styles.emergencyBanner, { backgroundColor: '#10B981', marginTop: 0 }]}
        activeOpacity={0.92}
        onPress={() => Linking.openURL('tel:8302389192')}
      >
        <View style={styles.emergencyIconBg}>
          <Ionicons name="call" size={24} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={[styles.badgeContainer, { backgroundColor: 'rgba(255, 255, 255, 0.25)' }]}>
            <Text style={styles.badgeText}>CUSTOMER SUPPORT</Text>
          </View>
          <Text style={styles.emergencyTitle}>Call for Support</Text>
          <Text style={styles.emergencySubtitle}>Get instant help with your orders</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Quick Services Grid */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>Quick Healthcare Services</Text>
        <View style={styles.servicesGrid}>
          {quickServices.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={[
                styles.serviceCard,
                {
                  backgroundColor: themeColors.background.secondary,
                  borderColor: service.borderColor,
                },
              ]}
              onPress={service.action}
              activeOpacity={0.85}
            >
              <View style={[styles.serviceIconContainer, { backgroundColor: service.bgColor }]}>
                <Ionicons name={service.icon as any} size={22} color={service.iconColor} />
              </View>
              <Text style={[styles.serviceTitle, { color: themeColors.text.primary }]} numberOfLines={1}>
                {service.title}
              </Text>
              <Text style={[styles.serviceSub, { color: themeColors.text.secondary }]} numberOfLines={1}>
                {service.subtitle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Active Health Routine & Pill Tracker */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: themeColors.text.primary }]}>Active Pill Schedule</Text>
          <TouchableOpacity onPress={() => navigation.navigate('RemindersTab')}>
            <Text style={[styles.seeAll, { color: themeColors.brand.primary }]}>Manage All</Text>
          </TouchableOpacity>
        </View>

        {nextReminder ? (
          <Card style={[styles.routineCard, { borderColor: themeColors.border.highlight || themeColors.border.default }]}>
            <View style={styles.routineHeader}>
              <View style={styles.routineTimeBadge}>
                <Ionicons name="time" size={16} color={themeColors.brand.primary} />
                <Text style={[styles.routineTimeText, { color: themeColors.brand.primary }]}>
                  {nextReminder.time}
                </Text>
              </View>

              <View
                style={[
                  styles.statusTag,
                  { backgroundColor: nextReminder.taken ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)' },
                ]}
              >
                <Text
                  style={[
                    styles.statusTagText,
                    { color: nextReminder.taken ? themeColors.status.success : themeColors.status.warning },
                  ]}
                >
                  {nextReminder.taken ? 'COMPLETED' : 'UPCOMING'}
                </Text>
              </View>
            </View>

            <Text style={[styles.medicineTitle, { color: themeColors.text.primary }]}>
              {nextReminder.medicine}
            </Text>
            <Text style={[styles.dosageSubtitle, { color: themeColors.text.secondary }]}>
              {nextReminder.dosage}
            </Text>

            <TouchableOpacity
              style={[
                styles.actionPillBtn,
                {
                  backgroundColor: nextReminder.taken
                    ? 'rgba(16, 185, 129, 0.2)'
                    : themeColors.brand.primary,
                },
              ]}
              onPress={() => toggleReminder(nextReminder.id)}
            >
              <Ionicons
                name={nextReminder.taken ? 'checkmark-circle' : 'time-outline'}
                size={18}
                color={nextReminder.taken ? themeColors.brand.primary : '#FFFFFF'}
              />
              <Text
                style={[
                  styles.actionPillText,
                  { color: nextReminder.taken ? themeColors.brand.primary : '#FFFFFF' },
                ]}
              >
                {nextReminder.taken ? 'Dose Taken Today' : 'Mark Dose as Taken'}
              </Text>
            </TouchableOpacity>
          </Card>
        ) : (
          <Card>
            <Text style={[{ color: themeColors.text.secondary }]}>No active pill reminders found.</Text>
          </Card>
        )}
      </View>

      {/* Featured Health Offer Banner */}
      <View style={styles.section}>
        <View
          style={[
            styles.offerBanner,
            {
              backgroundColor: 'rgba(6, 182, 212, 0.12)',
              borderColor: 'rgba(6, 182, 212, 0.3)',
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <View style={styles.offerTag}>
              <Text style={styles.offerTagText}>SPECIAL OFFER</Text>
            </View>
            <Text style={[styles.offerTitle, { color: themeColors.text.primary }]}>
              Flat 20% OFF Refills
            </Text>
            <Text style={[styles.offerSub, { color: themeColors.text.secondary }]}>
              Use code <Text style={{ fontWeight: 'bold', color: themeColors.brand.primary }}>RAPID20</Text> at checkout
            </Text>
          </View>
          <Ionicons name="gift-outline" size={42} color={themeColors.brand.accent || '#06B6D4'} />
        </View>
      </View>

      {/* Privacy Promise Footer */}
      <View style={[styles.privacyFooter, { backgroundColor: themeColors.background.secondary, borderColor: themeColors.border.default }]}>
        <Ionicons name="shield-checkmark" size={22} color={themeColors.brand.primary} style={{ marginBottom: spacing.xs }} />
        <Text style={[styles.privacyTitle, { color: themeColors.text.primary }]}>100% Encrypted & Private</Text>
        <Text style={[styles.privacyText, { color: themeColors.text.secondary }]}>
          RapidMedicococo guarantees complete privacy and secure HIPAA-compliant handling of all your prescription records.
        </Text>
      </View>
      <View style={{ height: 80 }} />
      </ScrollView>
      <CartFloatingBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting: {
    ...typography.h2,
    fontSize: 22,
    marginBottom: spacing.xs,
  },
  addressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: spacing.xl,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  addressText: {
    ...typography.caption,
    fontWeight: '600',
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  avatarText: {
    ...typography.bodyStrong,
    fontWeight: 'bold',
  },
  searchBar: {
    height: 50,
    borderRadius: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  searchText: {
    ...typography.body,
    fontSize: 14,
  },
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: spacing.md,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  emergencyIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  emergencyTitle: {
    ...typography.bodyStrong,
    color: '#FFFFFF',
    fontSize: 16,
  },
  emergencySubtitle: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h2,
    fontSize: 18,
  },
  seeAll: {
    ...typography.bodyStrong,
    fontSize: 13,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  serviceCard: {
    width: '47.5%',
    padding: spacing.md,
    borderRadius: spacing.md,
    borderWidth: 1,
  },
  serviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  serviceTitle: {
    ...typography.bodyStrong,
    fontSize: 14,
  },
  serviceSub: {
    ...typography.caption,
    marginTop: 2,
    fontSize: 11,
  },
  routineCard: {
    padding: spacing.lg,
    borderWidth: 1,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  routineTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  routineTimeText: {
    ...typography.caption,
    fontWeight: 'bold',
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  medicineTitle: {
    ...typography.h2,
    fontSize: 17,
    marginTop: spacing.xs,
  },
  dosageSubtitle: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
    gap: spacing.xs,
  },
  actionPillText: {
    ...typography.bodyStrong,
    fontSize: 13,
  },
  offerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: spacing.md,
    borderWidth: 1,
  },
  offerTag: {
    backgroundColor: '#06B6D4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  offerTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  offerTitle: {
    ...typography.bodyStrong,
    fontSize: 16,
  },
  offerSub: {
    ...typography.caption,
    marginTop: 2,
  },
  privacyFooter: {
    padding: spacing.lg,
    borderRadius: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  privacyTitle: {
    ...typography.bodyStrong,
    fontSize: 13,
  },
  privacyText: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 16,
  },
});
