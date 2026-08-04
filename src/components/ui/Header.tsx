import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, typography, spacing } from '../../theme';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  onBack,
  rightElement,
}) => {
  const themeColors = useThemeColors();

  return (
    <View style={[styles.header, { backgroundColor: themeColors.background.secondary, borderBottomColor: themeColors.border.default }]}>
      {showBack ? (
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text.primary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}

      <Text style={[styles.title, { color: themeColors.text.primary }]}>{title}</Text>

      {rightElement ? (
        rightElement
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: spacing.xs,
  },
  placeholder: {
    width: 32,
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
  },
});
