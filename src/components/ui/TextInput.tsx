import React, { useState } from 'react';
import { View, TextInput as RNTextInput, Text, StyleSheet, TextInputProps, ViewStyle, Platform } from 'react-native';
import { useThemeColors, typography, spacing } from '../../theme';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const TextInput = ({ label, error, containerStyle, style, ...props }: Props) => {
  const [isFocused, setIsFocused] = useState(false);
  const themeColors = useThemeColors();

  return (
    <View style={[styles.container, containerStyle]}>
      {!!label && <Text style={[styles.label, { color: themeColors.text.secondary }]}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: themeColors.background.primary,
            borderColor: themeColors.border.default,
          },
          props.multiline && styles.multilineContainer,
          isFocused && { borderColor: themeColors.brand.primary },
          error ? { borderColor: themeColors.status.error } : null,
        ]}
      >
        <RNTextInput
          accessibilityLabel={label}
          aria-invalid={!!error}
          style={[
            styles.input, 
            { color: themeColors.text.primary },
            props.multiline && styles.multilineInput,
            style,
          ]}
          placeholderTextColor={themeColors.text.secondary}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
      </View>
      {error && <Text style={[styles.errorText, { color: themeColors.status.error }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    height: 52,
    borderWidth: 1,
    borderRadius: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  multilineContainer: {
    height: 'auto',
    minHeight: 100,
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  input: {
    flex: 1,
    ...typography.body,
    height: '100%',
    paddingVertical: 0,
    textAlignVertical: 'center',
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  multilineInput: {
    textAlignVertical: 'top',
    height: '100%',
    paddingTop: 0,
  },
  errorText: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
});
