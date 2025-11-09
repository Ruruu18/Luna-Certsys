export const theme = {
  colors: {
    primary: '#2563eb', // Bright blue (from logo background)
    secondary: '#3b82f6', // Lighter blue
    background: '#FFFFFF', // Pure white background
    surface: '#FAFBFF', // Very light blue-white for cards
    text: '#1F2937',
    textSecondary: '#64748b',
    textTertiary: '#94a3b8',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
    gradient: ['#2563eb', '#3b82f6', '#60a5fa'], // Blue gradient from logo
    overlay: 'rgba(37, 99, 235, 0.05)', // Very light blue overlay
    border: '#E2E8F0', // Light gray border (not blue)
    accent: '#F8FAFC', // Very light gray-blue accent
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
