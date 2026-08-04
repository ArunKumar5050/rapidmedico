import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { useThemeColors, typography, spacing } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/MainNavigator';

type Props = NativeStackScreenProps<MainStackParamList, 'LiveTracking'>;

export const LiveTrackingScreen = ({ navigation }: Props) => {
  const themeColors = useThemeColors();

  const handleCallRider = () => {
    Alert.alert('Calling Partner', 'Connecting call to Ramesh Kumar (+91 98765 00000)...');
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      {/* Map Placeholder */}
      <View style={[styles.mapPlaceholder, { backgroundColor: themeColors.background.secondary }]}>
        <Ionicons name="map-outline" size={64} color={themeColors.brand.primary} />
        <Text style={[styles.mapText, { color: themeColors.text.primary }]}>Live GPS Tracking Map</Text>
        <Text style={[styles.mapSubText, { color: themeColors.text.secondary }]}>Delivery partner is 1.2 km away</Text>
      </View>

      <TouchableOpacity 
        style={[styles.backBtn, { backgroundColor: themeColors.background.primary }]} 
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color={themeColors.text.primary} />
      </TouchableOpacity>

      <Card style={styles.riderCard}>
        <View style={styles.riderRow}>
          <View style={[styles.avatar, { backgroundColor: themeColors.brand.primary }]}>
            <Text style={styles.avatarText}>R</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.riderName, { color: themeColors.text.primary }]}>Ramesh Kumar</Text>
            <Text style={[styles.riderRole, { color: themeColors.text.secondary }]}>Rapidmedi Delivery Partner ★ 4.9</Text>
          </View>
          <TouchableOpacity style={[styles.callBtn, { backgroundColor: themeColors.status.success }]} onPress={handleCallRider}>
            <Ionicons name="call" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <View style={[styles.codeRow, { backgroundColor: themeColors.background.primary }]}>
          <Text style={[styles.codeLabel, { color: themeColors.text.secondary }]}>Delivery OTP Pin:</Text>
          <Text style={[styles.codeValue, { color: themeColors.brand.primary }]}>4821</Text>
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: { ...typography.h2, marginTop: spacing.md },
  mapSubText: { ...typography.body, marginTop: 4 },
  backBtn: {
    position: 'absolute',
    top: spacing.xxxl,
    left: spacing.lg,
    padding: spacing.sm,
    borderRadius: spacing.xl,
    elevation: 4,
  },
  riderCard: {
    position: 'absolute',
    bottom: spacing.xxxl,
    left: spacing.lg,
    right: spacing.lg,
    elevation: 8,
  },
  riderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { ...typography.h2, color: '#FFFFFF' },
  riderName: { ...typography.bodyStrong },
  riderRole: { ...typography.caption },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: spacing.sm,
  },
  codeLabel: { ...typography.body },
  codeValue: { ...typography.h1, letterSpacing: 4 },
});
