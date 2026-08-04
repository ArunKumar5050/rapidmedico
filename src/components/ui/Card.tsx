import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemeColors, spacing } from '../../theme';

export const Card = ({ children, style }: { children: React.ReactNode, style?: any }) => {
  const themeColors = useThemeColors();

  return (
    <View 
      style={[
        styles.card, 
        { 
          backgroundColor: themeColors.background.secondary,
          borderColor: themeColors.border.default,
        }, 
        style
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: spacing.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
  }
});
