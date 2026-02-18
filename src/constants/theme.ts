// NeuroScan Design System — Refined Medical AI Aesthetic
// Deep teal + warm neutrals, premium glass morphism, subtle gradients.

export const Colors = {
  // Primary palette — Teal spectrum
  primary: '#0D9488',
  primaryLight: '#14B8A6',
  primaryDark: '#0F766E',
  primaryMuted: 'rgba(13, 148, 136, 0.12)',
  primaryGlow: 'rgba(13, 148, 136, 0.25)',

  // Accent — Warm amber for CTAs and highlights
  accent: '#F59E0B',
  accentLight: '#FCD34D',
  accentMuted: 'rgba(245, 158, 11, 0.15)',

  // Severity / classification colors
  success: '#10B981',
  successBg: 'rgba(16, 185, 129, 0.1)',
  warning: '#F59E0B',
  warningBg: 'rgba(245, 158, 11, 0.1)',
  danger: '#EF4444',
  dangerBg: 'rgba(239, 68, 68, 0.1)',
  info: '#3B82F6',
  infoBg: 'rgba(59, 130, 246, 0.1)',

  // Neutrals
  background: '#F8FAFB',
  surface: '#FFFFFF',
  surfaceHover: '#F1F5F9',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: 'rgba(0, 0, 0, 0.06)',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',

  // Borders & dividers
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  divider: '#E2E8F0',

  // Overlays
  overlay: 'rgba(15, 23, 42, 0.5)',
  overlayLight: 'rgba(15, 23, 42, 0.2)',

  // Gradients (as arrays for LinearGradient)
  gradientPrimary: ['#0D9488', '#0F766E'] as const,
  gradientHero: ['#0F766E', '#0D9488', '#14B8A6'] as const,
  gradientCard: [
    'rgba(13, 148, 136, 0.08)',
    'rgba(13, 148, 136, 0.02)',
  ] as const,
  gradientDark: ['#0F172A', '#1E293B'] as const,
  gradientGlass: ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)'] as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
} as const;

export const FontFamily = {
  light: 'Poppins_300Light',
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  glow: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// Classification label helpers
export const classificationColors: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  'Non Demented': {
    color: Colors.success,
    bg: Colors.successBg,
    label: 'Non Demented',
  },
  'No Impairment': {
    color: Colors.success,
    bg: Colors.successBg,
    label: 'No Impairment',
  },
  'Very Mild Dementia': {
    color: Colors.info,
    bg: Colors.infoBg,
    label: 'Very Mild',
  },
  'Mild Dementia': {
    color: Colors.warning,
    bg: Colors.warningBg,
    label: 'Mild',
  },
  'Moderate Dementia': {
    color: Colors.danger,
    bg: Colors.dangerBg,
    label: 'Moderate',
  },
};
