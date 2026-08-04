import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { useThemeColors, typography, spacing } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/MainNavigator';

type Props = NativeStackScreenProps<MainStackParamList, 'MedicineDetail'>;

export const MedicineDetailScreen = ({ route, navigation }: Props) => {
  const { medicineId } = route.params || { medicineId: '1' };
  const themeColors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: themeColors.background.secondary, borderBottomColor: themeColors.border.default }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text.primary }]}>Medicine Details</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
          <Ionicons name="cart-outline" size={24} color={themeColors.brand.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.imageCard, { backgroundColor: themeColors.background.secondary, borderColor: themeColors.border.default }]}>
          <Ionicons name="medical" size={64} color={themeColors.brand.primary} />
        </View>

        <Text style={[styles.medName, { color: themeColors.text.primary }]}>Dolo 650mg Tablet</Text>
        <Text style={[styles.manufacturer, { color: themeColors.text.secondary }]}>Micro Labs Ltd</Text>
        <Text style={[styles.composition, { color: themeColors.brand.primary }]}>Composition: Paracetamol (650mg)</Text>

        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: themeColors.text.primary }]}>₹30.50</Text>
          <Text style={[styles.mrp, { color: themeColors.text.secondary }]}>MRP ₹38.00</Text>
          <View style={[styles.discountBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <Text style={[styles.discountText, { color: themeColors.status.success }]}>20% OFF</Text>
          </View>
        </View>

        <Card style={styles.infoCard}>
          <Text style={[styles.sectionHeading, { color: themeColors.text.primary }]}>Product Overview</Text>
          <Text style={[styles.description, { color: themeColors.text.secondary }]}>
            Dolo 650 Tablet helps relieve pain and fever by blocking the release of certain chemical messengers responsible for fever and pain.
          </Text>
        </Card>

        <Card style={styles.infoCard}>
          <Text style={[styles.sectionHeading, { color: themeColors.text.primary }]}>Safety Advice</Text>
          <View style={styles.safetyRow}>
            <Ionicons name="warning-outline" size={20} color={themeColors.status.warning} />
            <Text style={[styles.safetyText, { color: themeColors.text.secondary }]}>Consult doctor if pregnant or breastfeeding.</Text>
          </View>
        </Card>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: themeColors.background.secondary, borderTopColor: themeColors.border.default }]}>
        <Button
          title="Add to Cart"
          onPress={() => navigation.navigate('Cart')}
        />
      </View>
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
  imageCard: {
    height: 180,
    borderRadius: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  medName: { ...typography.h1 },
  manufacturer: { ...typography.body, marginTop: 2 },
  composition: { ...typography.caption, marginTop: spacing.xs, marginBottom: spacing.md },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  price: { ...typography.h1 },
  mrp: { ...typography.body, textDecorationLine: 'line-through' },
  discountBadge: { paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: 4 },
  discountText: { ...typography.caption, fontWeight: 'bold' },
  infoCard: { marginBottom: spacing.md },
  sectionHeading: { ...typography.bodyStrong, marginBottom: spacing.xs },
  description: { ...typography.body, lineHeight: 20 },
  safetyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  safetyText: { ...typography.caption, flex: 1 },
  footer: { padding: spacing.lg, paddingBottom: spacing.xxxl, borderTopWidth: 1 },
});
