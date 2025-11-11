import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import StatusBarWrapper from '../components/StatusBarWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { dimensions, spacing, fontSize, borderRadius, scale, verticalScale, moderateScale } from '../utils/responsive';
import { pickProfileImage, uploadProfileImage } from '../utils/profileImageUpload';

interface ProfileScreenProps {
  navigation: import('../types/navigation').AppNavigationProp;
}

interface ProfileAction {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  color: string;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Default avatar image
  const defaultAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.full_name || 'User') + '&size=200&background=4A90E2&color=fff';

  useEffect(() => {
    // Check for face photo from registration
    const extendedUser = user as any;
    if (extendedUser?.photo_url) {
      setProfileImage(extendedUser.photo_url);
    }
  }, [user]);

  const handleUploadProfileImage = async () => {
    // Only allow purok chairman and admin to upload profile images
    if (user?.role !== 'purok_chairman' && user?.role !== 'admin') {
      Alert.alert(
        'Permission Denied',
        'Only administrators and purok chairmen can upload profile pictures. This is a government application that requires official profile photos.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const imageUri = await pickProfileImage();

      if (!imageUri) return;

      setUploading(true);

      const result: any = await uploadProfileImage(user.id, imageUri);

      if (result && typeof result === 'object' && result.success && result.imageUrl) {
        setProfileImage(result.imageUrl);
        Alert.alert(
          'Success',
          'Profile picture updated successfully!',
          [{ text: 'OK' }]
        );
      } else {
        const errorMsg = result && typeof result === 'object' && result.error ? result.error : 'Failed to upload profile picture. Please try again.';
        Alert.alert(
          'Upload Failed',
          errorMsg,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error uploading profile image:', error);
      Alert.alert(
        'Upload Failed',
        'An error occurred while uploading your profile picture.',
        [{ text: 'OK' }]
      );
    } finally {
      setUploading(false);
    }
  };
  
  // Format member since date
  const formatMemberSince = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  // Different actions based on user role
  const getProfileActions = (): ProfileAction[] => {
    const commonActions = [
      {
        icon: 'shield-checkmark-outline',
        title: 'Change Password',
        subtitle: 'Update your account password',
        color: theme.colors.success,
        onPress: () => navigation.navigate('ChangePassword'),
      },
      {
        icon: 'notifications-outline',
        title: 'Notification Settings',
        subtitle: 'Configure notification preferences',
        color: theme.colors.warning,
        onPress: () => {
          Alert.alert(
            'Notification Settings',
            'Configure how and when you receive notifications about certificate requests, updates, and announcements.\n\nComing soon!',
            [{ text: 'OK' }]
          );
        },
      },
      {
        icon: 'help-circle-outline',
        title: 'Help & Support',
        subtitle: 'Get help and contact support',
        color: theme.colors.info,
        onPress: () => {
          Alert.alert(
            'Help & Support',
            'Need assistance? You can:\n\n• Check our FAQ section\n• Contact support via email\n• Call our helpline\n• Visit the barangay office\n\nComing soon!',
            [{ text: 'OK' }]
          );
        },
      },
      {
        icon: 'document-text-outline',
        title: 'Terms of Service',
        subtitle: 'Read our terms and conditions',
        color: theme.colors.secondary,
        onPress: () => navigation.navigate('Terms'),
      },
      {
        icon: 'shield-outline',
        title: 'Privacy Policy',
        subtitle: 'View our privacy policy',
        color: theme.colors.success,
        onPress: () => navigation.navigate('PrivacyPolicy'),
      },
    ];

    // Only residents can edit their profile and see their chairman
    if (user?.role === 'resident') {
      return [
        {
          icon: 'create-outline',
          title: 'Edit Profile',
          subtitle: 'Update your personal information',
          color: theme.colors.primary,
          onPress: () => navigation.navigate('EditProfile'),
        },
        {
          icon: 'person-circle-outline',
          title: 'My Purok Chairman',
          subtitle: 'View your purok chairman details',
          color: theme.colors.info,
          onPress: () => navigation.navigate('MyPurokChairman'),
        },
        ...commonActions,
      ];
    }

    // Chairman has read-only profile
    return commonActions;
  };

  const profileActions = getProfileActions();

  const renderInfoItem = (icon: string, label: string, value: string) => (
    <View style={styles.infoItem}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon as any} size={moderateScale(20)} color={theme.colors.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
      </View>
    </View>
  );

  const renderActionItem = (action: ProfileAction) => (
    <TouchableOpacity
      key={action.title}
      style={styles.actionItem}
      onPress={action.onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
        <Ionicons name={action.icon as any} size={moderateScale(22)} color={action.color} />
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{action.title}</Text>
        <Text style={styles.actionSubtitle} numberOfLines={1}>{action.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={moderateScale(16)} color={theme.colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBarWrapper backgroundColor={theme.colors.primary} style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={moderateScale(24)} color="white" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.title}>Profile</Text>
          </View>

          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {uploading ? (
              <View style={[styles.avatar, styles.avatarLoading]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            ) : (
              <Image
                source={{ uri: profileImage || defaultAvatar }}
                style={styles.avatar}
                onError={() => setProfileImage(null)}
              />
            )}
            {(user?.role === 'purok_chairman' || user?.role === 'admin') && (
              <TouchableOpacity
                style={styles.editAvatarButton}
                onPress={handleUploadProfileImage}
                disabled={uploading}
              >
                <Ionicons name="camera" size={moderateScale(16)} color="white" />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.userName} numberOfLines={1}>{user?.full_name || 'User'}</Text>
          <Text style={styles.memberSince} numberOfLines={1}>
            Member since {user?.created_at ? formatMemberSince(user.created_at) : 'N/A'}
          </Text>

          {user?.role === 'resident' ? (
            <TouchableOpacity style={styles.editProfileButton}>
              <Ionicons name="create" size={moderateScale(16)} color="white" />
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.adminNotice}>
              <Ionicons name="lock-closed" size={moderateScale(16)} color={theme.colors.warning} />
              <Text style={styles.adminNoticeText}>Profile managed by administrator</Text>
            </View>
          )}
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoContainer}>
            {renderInfoItem('mail', 'Email', user?.email || 'N/A')}
            {renderInfoItem('call', 'Phone', user?.phone_number || 'N/A')}
            {renderInfoItem('location', 'Address', user?.address || 'N/A')}
            {user?.purok && renderInfoItem('business', 'Purok', user.purok)}
            {renderInfoItem('shield', 'Role', user?.role ? user.role.replace('_', ' ').toUpperCase() : 'N/A')}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings & More</Text>
          <View style={styles.actionsContainer}>
            {profileActions.map(renderActionItem)}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    padding: spacing.sm,
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: 'white',
  },
  headerRight: {
    width: moderateScale(40),
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  profileCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(4),
    },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(8),
    elevation: 5,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    borderWidth: scale(4),
    borderColor: theme.colors.primary,
  },
  avatarLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    borderRadius: moderateScale(15),
    width: moderateScale(30),
    height: moderateScale(30),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(2),
    },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(3.84),
    elevation: 5,
  },
  userName: {
    fontSize: fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  memberSince: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  editProfileText: {
    marginLeft: spacing.xs,
    color: 'white',
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
  },
  adminNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning + '15',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.warning + '30',
  },
  adminNoticeText: {
    marginLeft: spacing.sm,
    color: theme.colors.warning,
    fontSize: fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: spacing.md,
  },
  infoContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(2),
    },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(4),
    elevation: 3,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    flexShrink: 0,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: fontSize.md,
    color: theme.colors.text,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
    flexWrap: 'wrap',
  },
  actionsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(2),
    },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(4),
    elevation: 3,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  actionIcon: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    flexShrink: 0,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  actionSubtitle: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
});