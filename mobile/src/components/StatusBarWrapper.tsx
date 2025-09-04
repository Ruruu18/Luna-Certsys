import React from 'react';
import { View, Platform, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface StatusBarWrapperProps {
  backgroundColor?: string;
  style?: 'auto' | 'light' | 'dark';
  children?: React.ReactNode;
}

export const StatusBarWrapper: React.FC<StatusBarWrapperProps> = ({
  backgroundColor,
  style = 'light',
  children
}) => {
  const insets = useSafeAreaInsets();

  if (Platform.OS === 'android') {
    return (
      <>
        <StatusBar style={style} translucent />
        {backgroundColor && (
          <View 
            style={{
              height: insets.top,
              backgroundColor: backgroundColor,
            }}
          />
        )}
        {children}
      </>
    );
  }

  // iOS
  return (
    <>
      <StatusBar style={style} backgroundColor={backgroundColor} />
      {children}
    </>
  );
};

export default StatusBarWrapper;
