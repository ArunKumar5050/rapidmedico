import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { colors, useThemeColors, typography, spacing } from '../../../theme';
import { useThemeStore } from '../../../store/theme';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../app/navigation/MainNavigator';

type Props = NativeStackScreenProps<MainStackParamList, 'Settings'>;

export const SettingsScreen = ({ navigation }: Props) => {
  const [pushNotifs, setPushNotifs] = useState(true);
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const toggleDarkMode = useThemeStore((state) => state.toggleDarkMode);
  const themeColors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: themeColors.background.secondary, borderBottomColor: themeColors.border.default }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text.primary }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Card style={{ backgroundColor: themeColors.background.secondary, borderColor: themeColors.border.default, marginBottom: spacing.md }}>
          <View style={styles.row}>
            <Text style={[styles.label, { color: themeColors.text.primary }]}>Push Notifications</Text>
            <Switch value={pushNotifs} onValueChange={setPushNotifs} />
          </View>
          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: themeColors.border.default, paddingTop: spacing.md }]}>
            <Text style={[styles.label, { color: themeColors.text.primary }]}>Dark Mode</Text>
            <Switch 
              value={isDarkMode} 
              onValueChange={toggleDarkMode} 
              trackColor={{ false: themeColors.border.default, true: themeColors.brand.primary }}
            />
          </View>
        </Card>

        <Card style={{ backgroundColor: themeColors.background.secondary, borderColor: themeColors.border.default, marginBottom: spacing.md }}>
          <TouchableOpacity style={styles.linkRow}>
            <Text style={[styles.label, { color: themeColors.text.primary }]}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={18} color={themeColors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.linkRow, { borderTopWidth: 1, borderTopColor: themeColors.border.default, paddingTop: spacing.md }]}>
            <Text style={[styles.label, { color: themeColors.text.primary }]}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={18} color={themeColors.text.secondary} />
          </TouchableOpacity>
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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { ...typography.body },
});
