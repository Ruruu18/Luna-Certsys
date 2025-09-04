// @ts-nocheck
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
  Alert,
  Dimensions,
} from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';

const { height: screenHeight } = Dimensions.get('window');

interface CustomDrawerContentProps {
  navigation: any;
}

interface MenuItem {
  icon: string;
  label: string;
  onPress: () => void;
  color: string;
}

interface ContactItem {
  icon: string;
  text: string;
  onPress: () => void;
}

export default function CustomDrawerContent({ navigation }: CustomDrawerContentProps) {
  const { user } = useAuth();

  // Different menu items based on user role
  const getMenuItems = (): MenuItem[] => {
    const commonItems = [
      {
        icon: 'home-outline',
        label: 'Dashboard',
        color: theme.colors.primary,
        onPress: () => navigation.navigate('Dashboard'),
      },
      {
        icon: 'person-outline',
        label: 'Profile',
        color: theme.colors.info,
        onPress: () => navigation.navigate('Profile'),
      },
    ];

    if (user?.role === 'purok_chairman') {
      // Chairman-specific menu items
      return [
        ...commonItems,
        {
          icon: 'people-outline',
          label: 'Manage Residents',
          color: theme.colors.success,
          onPress: () => navigation.navigate('ManageResidents'),
        },
        {
          icon: 'document-text-outline',
          label: 'Certificate Requests',
          color: theme.colors.warning,
          onPress: () => navigation.navigate('ManageCertificateRequests'),
        },
        {
          icon: 'notifications-outline',
          label: 'Notifications',
          color: theme.colors.error,
          onPress: () => navigation.navigate('Notifications'),
        },
      ];
    } else {
      // Regular resident menu items
      return [
        ...commonItems,
        {
          icon: 'document-text-outline',
          label: 'Request Certificate',
          color: theme.colors.success,
          onPress: () => navigation.navigate('RequestCertificate'),
        },
        {
          icon: 'search-outline',
          label: 'Track Request',
          color: theme.colors.warning,
          onPress: () => navigation.navigate('TrackRequest'),
        },
        {
          icon: 'card-outline',
          label: 'Transactions',
          color: theme.colors.secondary,
          onPress: () => navigation.navigate('Transaction'),
        },
        {
          icon: 'notifications-outline',
          label: 'Notifications',
          color: theme.colors.error,
          onPress: () => navigation.navigate('Notifications'),
        },
      ];
    }
  };

  const menuItems = getMenuItems();

  const contactItems: ContactItem[] = [
    {
      icon: 'call-outline',
      text: '09123456789',
      onPress: () => handlePhoneCall(),
    },
    {
      icon: 'mail-outline',
      text: 'brgy_luna@surigao.gov.ph',
      onPress: () => handleEmailPress(),
    },
    {
      icon: 'logo-facebook',
      text: 'Facebook Page',
      onPress: () => handleFacebookPress(),
    },
  ];

  const handlePhoneCall = () => {
    const phoneNumber = '09123456789';
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Error', 'Unable to make phone call');
    });
  };

  const handleEmailPress = () => {
    const email = 'brgy_luna@surigao.gov.ph';
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Error', 'Unable to open email client');
    });
  };

  const handleFacebookPress = () => {
    const facebookUrl = 'https://www.facebook.com/BarangayLunaSurigaoCity';
    Linking.openURL(facebookUrl).catch(() => {
      Alert.alert('Error', 'Unable to open Facebook page');
    });
  };

  const renderMenuItem = (item: MenuItem, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.menuItem}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconContainer, { backgroundColor: item.color + '15' }]}>
        <Ionicons name={item.icon as any} size={22} color={item.color} />
      </View>
      <Text style={styles.menuLabel}>{item.label}</Text>
      <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} />
    </TouchableOpacity>
  );

  const renderContactItem = (item: ContactItem, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.contactItem}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={item.icon as any} size={18} color={theme.colors.primary} />
      <Text style={styles.contactText}>{item.text}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.appName}>Luna Certsys</Text>
        <Text style={styles.appSubtitle}>Barangay Luna, Surigao City</Text>
      </LinearGradient>

      <DrawerContentScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map(renderMenuItem)}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Contact Section */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Contact Us</Text>
          {contactItems.map(renderContactItem)}
        </View>
      </DrawerContentScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>v1.0.0</Text>
        <Text style={styles.footerSubtext}>© 2024 Barangay Luna</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    paddingTop: theme.spacing.xl + 10,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 180,
    height: 180,
  },
  appName: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: 'white',
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: theme.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 18,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: theme.spacing.md,
  },
  menuContainer: {
    paddingHorizontal: theme.spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'transparent',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
  },
  contactSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  contactTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  contactText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: 'center',
  },
  footerText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
    fontWeight: theme.fontWeight.medium,
  },
  footerSubtext: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.xs,
  },
});