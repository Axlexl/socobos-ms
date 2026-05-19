// ─── Design System ────────────────────────────────────────────────────────────

export const COLORS = {
  // Brand
  primary: '#1A1F36',        // deep navy
  primaryDark: '#0F1221',    // darker navy
  primaryLight: '#F0F2FF',   // soft lavender tint

  accent: '#C9A84C',         // warm gold
  accentLight: '#FDF6E3',    // gold tint bg
  accentDark: '#A8873A',     // deeper gold

  // Status
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',

  // Neutrals
  white: '#FFFFFF',
  background: '#F7F8FC',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F2FF',
  border: '#E4E7F0',
  divider: '#F0F2F8',

  // Text
  textPrimary: '#0F1221',
  textSecondary: '#4B5270',
  textMuted: '#9399B2',

  // Bill status aliases
  paid: '#16A34A',
  partial: '#D97706',
  unpaid: '#DC2626',
} as const;

export const FONTS = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;

// Default utility rates (editable by admin)
export const DEFAULT_ELECTRICITY_RATE = 12; // ₱ per kWh
export const DEFAULT_WATER_RATE = 20;        // ₱ per unit

// Move-in fees
export const SECURITY_DEPOSIT = 3500;  // ₱
export const ADVANCE_PAYMENT = 3500;   // ₱

// Owner account — only one user, email is fixed so login only needs a password
export const OWNER_EMAIL = 'owner@socobos.com';
