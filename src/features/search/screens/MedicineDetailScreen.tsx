import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { useThemeColors, typography, spacing } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/MainNavigator';
import { getMedicineById } from '../../../services/firebase/medicines';
import { MedicineItem, MEDICINE_CATALOG } from '../../../data/medicineCatalog';

type Props = NativeStackScreenProps<MainStackParamList, 'MedicineDetail'>;

export const MedicineDetailScreen = ({ route, navigation }: Props) => {
  const { medicineId } = route.params || { medicineId: 'med_1' };
  const themeColors = useThemeColors();

  const [medicine, setMedicine] = useState<MedicineItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getMedicineById(medicineId).then((res) => {
      if (isMounted) {
        setMedicine(res || MEDICINE_CATALOG.find(m => m.id === medicineId) || MEDICINE_CATALOG[0]);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [medicineId]);

  const handleOrderMedicine = () => {
    if (!medicine) return;
    navigation.navigate('CustomOrderRequest', { initialMedicineName: medicine.name });
  };

  if (loading || !medicine) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: themeColors.background.primary }]}>
        <ActivityIndicator size="large" color={themeColors.brand.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: themeColors.background.secondary, borderBottomColor: themeColors.border.default }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text.primary }]} numberOfLines={1}>
          {medicine.name}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.imageCard, { backgroundColor: themeColors.background.secondary, borderColor: themeColors.border.default }]}>
          <Ionicons 
            name={medicine.category.includes('Injection') ? 'shield-checkmark' : medicine.category.includes('Syrup') ? 'flask' : 'medical'} 
            size={64} 
            color={themeColors.brand.primary} 
          />
          <View style={[styles.formBadge, { backgroundColor: themeColors.brand.primary + '15' }]}>
            <Text style={[styles.formBadgeText, { color: themeColors.brand.primary }]}>{medicine.dosageForm}</Text>
          </View>
        </View>

        <Text style={[styles.medName, { color: themeColors.text.primary }]}>{medicine.name}</Text>
        <Text style={[styles.category, { color: themeColors.text.secondary }]}>{medicine.category}</Text>

        {medicine.rxRequired && (
          <View style={styles.rxBadgeRow}>
            <View style={styles.rxBadge}>
              <Ionicons name="document-text" size={12} color="#EF4444" style={{ marginRight: 4 }} />
              <Text style={styles.rxText}>Prescription (Rx) Required</Text>
            </View>
          </View>
        )}

        <Card style={styles.infoCard}>
          <Text style={[styles.sectionHeading, { color: themeColors.text.primary }]}>Product Description</Text>
          <Text style={[styles.description, { color: themeColors.text.secondary }]}>
            {medicine.description}
          </Text>
        </Card>

        <Card style={styles.infoCard}>
          <Text style={[styles.sectionHeading, { color: themeColors.text.primary }]}>How Custom Ordering Works</Text>
          <View style={styles.safetyRow}>
            <Ionicons name="flash-outline" size={20} color={themeColors.brand.primary} />
            <Text style={[styles.safetyText, { color: themeColors.text.secondary }]}>
              Add this medicine to your order request. Nearby partner pharmacies will confirm availability and bill the exact pricing directly for ultra-fast delivery.
            </Text>
          </View>
        </Card>

        <Card style={styles.infoCard}>
          <Text style={[styles.sectionHeading, { color: themeColors.text.primary }]}>Safety Advice</Text>
          <View style={styles.safetyRow}>
            <Ionicons name="warning-outline" size={20} color={themeColors.status.warning} />
            <Text style={[styles.safetyText, { color: themeColors.text.secondary }]}>
              Consult your physician before taking this medicine if pregnant, breastfeeding, or taking other medications.
            </Text>
          </View>
        </Card>

        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: themeColors.background.secondary, borderTopColor: themeColors.border.default }]}>
        <Button
          title="Add to Custom Order"
          onPress={handleOrderMedicine}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  iconButton: {
    padding: spacing.xs,
  },
  title: { ...typography.bodyStrong, flex: 1, marginHorizontal: spacing.md, fontSize: 16 },
  content: { padding: spacing.lg },
  imageCard: {
    height: 180,
    borderRadius: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    position: 'relative',
  },
  formBadge: {
    position: 'absolute',
    bottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.sm,
  },
  formBadgeText: {
    ...typography.caption,
    fontWeight: 'bold',
  },
  medName: { ...typography.h1, fontSize: 20 },
  category: { ...typography.body, marginTop: 4, marginBottom: spacing.sm },
  rxBadgeRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  rxBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  rxText: {
    ...typography.caption,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  infoCard: { marginBottom: spacing.md },
  sectionHeading: { ...typography.bodyStrong, marginBottom: spacing.xs },
  description: { ...typography.body, lineHeight: 20 },
  safetyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  safetyText: { ...typography.caption, flex: 1, lineHeight: 18 },
  footer: { padding: spacing.lg, paddingBottom: spacing.xxxl, borderTopWidth: 1 },
});
