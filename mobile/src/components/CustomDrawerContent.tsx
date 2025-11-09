import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { dimensions, spacing, fontSize, borderRadius, scale, verticalScale, moderateScale } from '../utils/responsive';

interface CustomDrawerContentProps {
  navigation: import('../types/navigation').AppNavigationProp;
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
  const { user, signOut } = useAuth();

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
      {
        icon: 'map-outline',
        label: 'Barangay Map',
        color: '#10b981',
        onPress: () => navigation.navigate('Map'),
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
          onPress: () => navigation.navigate('CertificateRequests'),
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

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Logging out...');
              await signOut();
              console.log('Logout successful');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderMenuItem = (item: MenuItem, index: number) => {
    const iconSize = dimensions.width < 360 ? moderateScale(19) : moderateScale(21);
    const chevronSize = dimensions.width < 360 ? moderateScale(15) : moderateScale(17);

    return (
      <TouchableOpacity
        key={index}
        style={styles.menuItem}
        onPress={item.onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.menuIconContainer, { backgroundColor: item.color + '25' }]}>
          <Ionicons name={item.icon as any} size={iconSize} color={item.color} />
        </View>
        <Text
          style={styles.menuLabel}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.label}
        </Text>
        <Ionicons name="chevron-forward" size={chevronSize} color={theme.colors.textSecondary} style={styles.chevronIcon} />
      </TouchableOpacity>
    );
  };

  const renderContactItem = (item: ContactItem, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.contactItem}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={item.icon as any} size={moderateScale(20)} color={theme.colors.primary} />
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

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={moderateScale(22)} color={theme.colors.error} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>v1.0.0</Text>
        <Text style={styles.footerSubtext}>© {new Date().getFullYear()} Barangay Luna</Text>
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
    paddingTop: spacing.md,
    paddingBottom: 0,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: dimensions.width < 360 ? scale(180) : scale(200),
    height: dimensions.width < 360 ? verticalScale(180) : verticalScale(200),
    maxWidth: dimensions.width * 0.65,
    maxHeight: verticalScale(200),
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: spacing.lg,
  },
  menuContainer: {
    paddingHorizontal: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(8),
    marginBottom: verticalScale(4),
    borderRadius: borderRadius.md,
    backgroundColor: 'transparent',
    minHeight: verticalScale(48),
  },
  menuIconContainer: {
    width: dimensions.width < 360 ? moderateScale(34) : moderateScale(38),
    height: dimensions.width < 360 ? moderateScale(34) : moderateScale(38),
    borderRadius: dimensions.width < 360 ? moderateScale(17) : moderateScale(19),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: dimensions.width < 360 ? scale(8) : scale(10),
    flexShrink: 0,
  },
  menuLabel: {
    flex: 1,
    fontSize: dimensions.width < 360 ? moderateScale(13) : moderateScale(14.5),
    color: theme.colors.text,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    letterSpacing: -0.2,
    lineHeight: dimensions.width < 360 ? moderateScale(16) : moderateScale(18),
  },
  chevronIcon: {
    alignSelf: 'center',
    marginLeft: scale(4),
    flexShrink: 0,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: spacing.xl,
    marginHorizontal: spacing.xl,
    opacity: 0.5,
  },
  contactSection: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  contactTitle: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: spacing.md,
    letterSpacing: 0.3,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
    borderRadius: borderRadius.md,
  },
  contactText: {
    marginLeft: spacing.md,
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: theme.colors.error + '10',
    borderWidth: 1,
    borderColor: theme.colors.error + '30',
  },
  logoutText: {
    marginLeft: spacing.sm,
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.error,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  footerText: {
    fontSize: fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
  },
  footerSubtext: {
    fontSize: fontSize.xs,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginTop: spacing.xs,
  },
});