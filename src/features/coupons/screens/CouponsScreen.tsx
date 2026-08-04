import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { useThemeColors, typography, spacing } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/MainNavigator';

type Props = NativeStackScreenProps<MainStackParamList, 'Coupons'>;

export const CouponsScreen = ({ navigation }: Props) => {
  const themeColors = useThemeColors();
  const coupons = [
    { code: 'RAPID20', title: '20% OFF on First Order', desc: 'Valid on orders above ₹200' },
    { code: 'FREEDEL', title: 'Free Delivery', desc: 'Valid on medicine orders above ₹500' },
  ];

  const handleApply = (code: string) => {
    Alert.alert('Coupon Applied', `Coupon code ${code} applied successfully!`);
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: themeColors.background.secondary, borderBottomColor: themeColors.border.default }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text.primary }]}>Coupons & Offers</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {coupons.map((c, i) => (
          <Card key={i} style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.code, { color: themeColors.brand.primary }]}>{c.code}</Text>
                <Text style={[styles.cTitle, { color: themeColors.text.primary }]}>{c.title}</Text>
                <Text style={[styles.cDesc, { color: themeColors.text.secondary }]}>{c.desc}</Text>
              </View>
              <TouchableOpacity style={[styles.applyBtn, { backgroundColor: themeColors.brand.primary }]} onPress={() => handleApply(c.code)}>
                <Text style={styles.applyText}>APPLY</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}
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
  card: { marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  code: { ...typography.bodyStrong },
  cTitle: { ...typography.body, marginTop: 2 },
  cDesc: { ...typography.caption, marginTop: 2 },
  applyBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: spacing.sm },
  applyText: { ...typography.caption, color: '#FFFFFF', fontWeight: 'bold' },
});
