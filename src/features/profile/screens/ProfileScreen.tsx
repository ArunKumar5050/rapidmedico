import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, useThemeColors, typography, spacing } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../store/auth';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/MainNavigator';

type Props = NativeStackScreenProps<MainStackParamList>;

export const ProfileScreen = ({ navigation }: Props) => {
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const themeColors = useThemeColors();

  const menuSections = [
    {
      title: 'Account Settings',
      items: [
        { id: '1', label: 'Saved Addresses', icon: 'location-outline', action: () => navigation.navigate('AddressManagement') },
        { id: '2', label: 'Family Members', icon: 'people-outline', action: () => navigation.navigate('FamilyMembers') },
        { id: '3', label: 'Health Records & Prescriptions', icon: 'document-text-outline', action: () => navigation.navigate('HealthRecords') },
      ],
    },
    {
      title: 'Offers & Rewards',
      items: [
        { id: '4', label: 'Refer & Earn', icon: 'gift-outline', action: () => navigation.navigate('Referral') },
        { id: '5', label: 'Coupons & Offers', icon: 'pricetag-outline', action: () => navigation.navigate('Coupons') },
      ],
    },
    {
      title: 'Help & Preferences',
      items: [
        { id: '6', label: 'Rapidmedi Support', icon: 'chatbubbles-outline', action: () => navigation.navigate('SupportChat') },
        { id: '7', label: 'App Settings', icon: 'settings-outline', action: () => navigation.navigate('Settings') },
      ],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: themeColors.background.secondary, borderBottomColor: themeColors.border.default }]}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: themeColors.brand.primary }]}>
            <Text style={styles.avatarText}>A</Text>
          </View>
          <View>
            <Text style={[styles.userName, { color: themeColors.text.primary }]}>Arun Kumar</Text>
            <Text style={[styles.userPhone, { color: themeColors.text.secondary }]}>+91 98765 43210</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {menuSections.map((section, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.text.secondary }]}>{section.title}</Text>
            <View style={[styles.card, { backgroundColor: themeColors.background.secondary, borderColor: themeColors.border.default }]}>
              {section.items.map((item, itemIdx) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    itemIdx < section.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: themeColors.border.default },
                  ]}
                  onPress={item.action}
                >
                  <View style={styles.menuLeft}>
                    <Ionicons name={item.icon as any} size={20} color={themeColors.brand.primary} />
                    <Text style={[styles.menuLabel, { color: themeColors.text.primary }]}>{item.label}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={themeColors.text.secondary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity 
          style={styles.logoutBtn}
          onPress={() => setAuthenticated(false)}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: themeColors.text.secondary }]}>Rapidmedi v1.0.0 (Expo managed)</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.h1,
    color: '#FFFFFF',
  },
  userName: {
    ...typography.h2,
  },
  userPhone: {
    ...typography.caption,
  },
  content: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  card: {
    borderRadius: spacing.md,
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuLabel: {
    ...typography.body,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: spacing.md,
  },
  logoutText: {
    ...typography.bodyStrong,
    color: '#EF4444',
  },
  versionText: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.xxxl,
  },
});
