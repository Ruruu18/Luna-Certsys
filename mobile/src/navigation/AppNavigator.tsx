import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, ActivityIndicator, Text } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import NotificationScreen from '../screens/NotificationScreen';
import NotificationDetailScreen from '../screens/NotificationDetailScreen';
import RequestCertificateScreen from '../screens/RequestCertificateScreen';
import TrackRequestScreen from '../screens/TrackRequestScreen';
import TransactionScreen from '../screens/TransactionScreen';
import TransactionDetailsScreen from '../screens/TransactionDetailsScreen';
import RequestDetailsScreen from '../screens/RequestDetailsScreen';
import ManageResidentsScreen from '../screens/ManageResidentsScreen';
import ViewResidentScreen from '../screens/ViewResidentScreen';
import ManageCertificateRequestsScreen from '../screens/ManageCertificateRequestsScreen';
import PendingRegistrationsScreen from '../screens/PendingRegistrationsScreen';
import MapScreen from '../screens/MapScreen';
import PaymentScreen from '../screens/PaymentScreen';
import PaymentConfirmationScreen from '../screens/PaymentConfirmationScreen';
import EmailTestScreen from '../screens/EmailTestScreen';
import TermsScreen from '../screens/TermsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import MyPurokChairmanScreen from '../screens/MyPurokChairmanScreen';
import CustomDrawerContent from '../components/CustomDrawerContent';
import { useAuth } from '../contexts/AuthContext';

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      // @ts-ignore - Navigation id prop type issue
      id="main-drawer"
      drawerContent={(props) => <CustomDrawerContent {...props as any} />}
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
      <Drawer.Screen name="Map" component={MapScreen} />
      <Drawer.Screen name="RequestCertificate" component={RequestCertificateScreen} />
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
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        // @ts-ignore - Navigation id prop type issue
        id="main-stack"
        initialRouteName={user ? "Main" : "Login"}
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            gestureEnabled: false,
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
          }}
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationScreen}
        />
        <Stack.Screen
          name="NotificationDetail"
          component={NotificationDetailScreen}
        />
        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
        />
        <Stack.Screen
          name="ChangePassword"
          component={ChangePasswordScreen}
        />
        <Stack.Screen
          name="ManageResidents"
          component={ManageResidentsScreen}
        />
        <Stack.Screen
          name="ViewResident"
          component={ViewResidentScreen}
        />
        <Stack.Screen
          name="CertificateRequests"
          component={ManageCertificateRequestsScreen}
        />
        <Stack.Screen
          name="PendingRegistrations"
          component={PendingRegistrationsScreen}
        />
        <Stack.Screen
          name="Payment"
          component={PaymentScreen}
        />
        <Stack.Screen
          name="PaymentConfirmation"
          component={PaymentConfirmationScreen}
        />
        <Stack.Screen
          name="TransactionDetails"
          component={TransactionDetailsScreen}
        />
        <Stack.Screen
          name="RequestDetails"
          component={RequestDetailsScreen}
        />
        <Stack.Screen
          name="TrackRequest"
          component={TrackRequestScreen}
        />
        <Stack.Screen
          name="EmailTest"
          component={EmailTestScreen}
        />
        <Stack.Screen
          name="Terms"
          component={TermsScreen}
        />
        <Stack.Screen
          name="PrivacyPolicy"
          component={PrivacyPolicyScreen}
        />
        <Stack.Screen
          name="MyPurokChairman"
          component={MyPurokChairmanScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}