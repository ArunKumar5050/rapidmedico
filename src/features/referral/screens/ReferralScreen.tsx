import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useThemeColors, typography, spacing } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/MainNavigator';

type Props = NativeStackScreenProps<MainStackParamList, 'Referral'>;

export const ReferralScreen = ({ navigation }: Props) => {
  const themeColors = useThemeColors();

  const handleShare = () => {
    Alert.alert('Share Referral', 'Referral code RAPID100 copied to clipboard! Opening WhatsApp share options...');
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: themeColors.background.secondary, borderBottomColor: themeColors.border.default }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text.primary }]}>Refer & Earn</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Ionicons name="gift-outline" size={48} color={themeColors.brand.primary} style={{ alignSelf: 'center' }} />
          <Text style={[styles.heading, { color: themeColors.text.primary }]}>Invite Friends to RapidMedico</Text>
          <Text style={[styles.sub, { color: themeColors.text.secondary }]}>Earn ₹100 in your wallet for every friend who places their first medicine order!</Text>

          <TouchableOpacity style={[styles.codeBox, { backgroundColor: themeColors.background.primary, borderColor: themeColors.brand.primary }]} onPress={handleShare}>
            <Text style={[styles.codeText, { color: themeColors.brand.primary }]}>RAPID100</Text>
            <Ionicons name="copy-outline" size={20} color={themeColors.brand.primary} />
          </TouchableOpacity>

          <Button title="Share Code via WhatsApp" onPress={handleShare} />
        </Card>
      </ScrollView>
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
  card: { padding: spacing.xl, alignItems: 'center' },
  heading: { ...typography.h2, marginTop: spacing.md, textAlign: 'center' },
  sub: { ...typography.body, textAlign: 'center', marginVertical: spacing.md },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: spacing.md,
    marginBottom: spacing.xl,
  },
  codeText: { ...typography.h1, letterSpacing: 2 },
});
