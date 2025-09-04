export const theme = {
  colors: {
    primary: '#1e3c72', // Dark blue (matches login button start)
    secondary: '#2a5298', // Medium blue (matches login button end)
    background: '#FAFAFA',
    surface: '#FFFFFF',
    text: '#1F2937',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
    gradient: ['#F8FAFC', '#F1F5F9', '#E2E8F0'],
    overlay: 'rgba(0, 0, 0, 0.05)',
    border: '#E5E7EB',
    accent: '#F3F4F6',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  fontFamily: {
    regular: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semiBold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
  },
};

export type Theme = typeof theme;
