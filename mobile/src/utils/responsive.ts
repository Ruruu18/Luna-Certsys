import { Dimensions, PixelRatio, Platform } from 'react-native';

// Get device dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions for scaling (iPhone 11 Pro)
const baseWidth = 375;
const baseHeight = 812;

/**
 * Scales a value based on screen width
 */
export const scale = (size: number): number => {
  return Math.round((SCREEN_WIDTH / baseWidth) * size);
};

/**
 * Scales a value based on screen height
 */
export const verticalScale = (size: number): number => {
  return Math.round((SCREEN_HEIGHT / baseHeight) * size);
};

/**
 * Moderate scaling that's less aggressive
 */
export const moderateScale = (size: number, factor: number = 0.5): number => {
  const scaledSize = (SCREEN_WIDTH / baseWidth) * size;
  return Math.round(size + (scaledSize - size) * factor);
};

/**
 * Scales font size with pixel ratio
 */
export const scaleFontSize = (size: number): number => {
  const newSize = size * (SCREEN_WIDTH / baseWidth);
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
};

/**
 * Check if device is a tablet
 */
export const isTablet = (): boolean => {
  return SCREEN_WIDTH >= 768;
};

/**
 * Check if device is a small phone
 */
export const isSmallDevice = (): boolean => {
  return SCREEN_WIDTH < 375;
};

/**
 * Get responsive dimensions
 */
export const dimensions = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmallDevice: isSmallDevice(),
  isTablet: isTablet(),
};

/**
 * Get responsive spacing
 */
export const spacing = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(16),
  lg: moderateScale(24),
  xl: moderateScale(32),
  xxl: moderateScale(48),
};

/**
 * Get responsive font sizes
 */
export const fontSize = {
  xs: scaleFontSize(10),
  sm: scaleFontSize(12),
  md: scaleFontSize(14),
  base: scaleFontSize(16),
  lg: scaleFontSize(18),
  xl: scaleFontSize(20),
  xxl: scaleFontSize(24),
  xxxl: scaleFontSize(32),
};

/**
 * Get responsive border radius
 */
export const borderRadius = {
  sm: moderateScale(4),
  md: moderateScale(8),
  lg: moderateScale(12),
  xl: moderateScale(16),
  xxl: moderateScale(24),
  full: 9999,
};

/**
 * Get responsive padding for containers
 */
export const containerPadding = (): number => {
  if (isTablet()) {
    return moderateScale(32);
  } else if (isSmallDevice()) {
    return moderateScale(12);
  }
  return moderateScale(16);
};

/**
 * Get responsive max width for content
 */
export const maxContentWidth = (): number => {
  if (isTablet()) {
    return Math.round(SCREEN_WIDTH * 0.7);
  }
  return Math.round(SCREEN_WIDTH * 0.9);
};
