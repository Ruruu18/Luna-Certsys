import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, ActivityIndicator } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationScreen from '../screens/NotificationScreen';
import RequestCertificateScreen from '../screens/RequestCertificateScreen';
import TrackRequestScreen from '../screens/TrackRequestScreen';
import TransactionScreen from '../screens/TransactionScreen';
import ManageResidentsScreen from '../screens/ManageResidentsScreen';
import ManageCertificateRequestsScreen from '../screens/ManageCertificateRequestsScreen';
import CustomDrawerContent from '../components/CustomDrawerContent';
import { useAuth } from '../contexts/AuthContext';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: '#FFFFFF',
          width: 280,
        },
        drawerType: 'slide',
        overlayColor: 'rgba(0, 0, 0, 0.3)',
        swipeEnabled: true,
        swipeEdgeWidth: 50,
      }}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen name="Profile" component={ProfileScreen} />
      <Drawer.Screen name="RequestCertificate" component={RequestCertificateScreen} />
      <Drawer.Screen name="TrackRequest" component={TrackRequestScreen} />
      <Drawer.Screen name="Transaction" component={TransactionScreen} />
    </Drawer.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#1e3c72" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={user ? "Main" : "Login"}
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
          animationEnabled: false,
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{
            gestureEnabled: false,
            animationEnabled: false,
          }}
        />
        <Stack.Screen 
          name="Registration" 
          component={RegistrationScreen}
        />
        <Stack.Screen 
          name="Main" 
          component={DrawerNavigator}
          options={{
            gestureEnabled: false,
            animationEnabled: false,
          }}
        />
        <Stack.Screen 
          name="Notifications" 
          component={NotificationScreen}
        />
        <Stack.Screen 
          name="ManageResidents" 
          component={ManageResidentsScreen}
        />
        <Stack.Screen 
          name="ManageCertificateRequests" 
          component={ManageCertificateRequestsScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}