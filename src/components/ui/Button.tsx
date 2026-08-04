import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { colors, typography, spacing } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          button: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: colors.light.brand.primary,
          },
          text: {
            color: colors.light.brand.primary,
          },
        };
      case 'tertiary':
        return {
          button: {
            backgroundColor: 'transparent',
          },
          text: {
            color: colors.light.brand.primary,
          },
        };
      case 'destructive':
        return {
          button: {
            backgroundColor: colors.light.status.error,
          },
          text: {
            color: colors.light.background.primary,
          },
        };
      case 'primary':
      default:
        return {
          button: {
            backgroundColor: colors.light.brand.primary,
          },
          text: {
            color: colors.light.background.primary,
          },
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      activeOpacity={0.97} // specified micro-interaction
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.baseButton,
        variantStyles.button,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.text.color} />
      ) : (
        <Text style={[styles.baseText, variantStyles.text, textStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    height: 48,
    borderRadius: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
  },
  baseText: {
    ...typography.button,
  },
  disabled: {
    opacity: 0.4,
  },
});
