import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    type TouchableOpacityProps,
} from 'react-native';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      disabled={isDisabled}
      activeOpacity={0.75}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#FFFFFF' : '#208AEF'}
        />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label`], styles[`size_${size}Label`]]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },

  // Variants
  primary: { backgroundColor: '#208AEF' },
  secondary: { backgroundColor: '#E6F4FE' },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#208AEF' },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: '#EF4444' },

  // Sizes
  size_sm: { paddingHorizontal: 16, paddingVertical: 6 },
  size_md: { paddingHorizontal: 24, paddingVertical: 12 },
  size_lg: { paddingHorizontal: 32, paddingVertical: 16 },

  // Labels
  label: { fontWeight: '600' },
  primaryLabel: { color: '#FFFFFF' },
  secondaryLabel: { color: '#208AEF' },
  outlineLabel: { color: '#208AEF' },
  ghostLabel: { color: '#208AEF' },
  dangerLabel: { color: '#FFFFFF' },

  size_smLabel: { fontSize: 13 },
  size_mdLabel: { fontSize: 15 },
  size_lgLabel: { fontSize: 17 },
});
