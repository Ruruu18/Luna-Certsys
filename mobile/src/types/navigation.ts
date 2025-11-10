// Navigation types for TypeScript support
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ParamListBase } from '@react-navigation/native';

// Combined navigation prop type that works with both Drawer and Stack navigators
export type AppNavigationProp = CompositeNavigationProp<
  DrawerNavigationProp<ParamListBase>,
  StackNavigationProp<ParamListBase>
>;

// Icon type for Ionicons
import { Ionicons } from '@expo/vector-icons';
export type IoniconsName = keyof typeof Ionicons.glyphMap;
