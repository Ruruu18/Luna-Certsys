import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
} from 'react-native';
import StatusBarWrapper from '../components/StatusBarWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { dimensions, spacing, fontSize, borderRadius, moderateScale, verticalScale, scale } from '../utils/responsive';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface PurokChairman {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  address: string;
  purok: string;
  photo_url: string | null;
  created_at: string;
}

interface MyPurokChairmanScreenProps {
  navigation: import('../types/navigation').AppNavigationProp;
}

export default function MyPurokChairmanScreen({ navigation }: MyPurokChairmanScreenProps) {
  const { user } = useAuth();
  const [chairman, setChairman] = useState<PurokChairman | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChairman();
  }, []);

  const loadChairman = async () => {
    try {
      setLoading(true);

      if (!user?.purok) {
        Alert.alert('Error', 'Your account does not have a purok assigned.');
        setLoading(false);
        return;
      }

      console.log('Looking for chairman with purok:', user.purok);
      console.log('User object:', user);

      // Normalize the purok value - trim whitespace
      const normalizedPurok = user.purok.trim();

      // Extract just the number from formats like "Purok 1" or "1"
      const purokNumber = normalizedPurok.replace(/[^0-9]/g, '');

      console.log('Normalized purok:', normalizedPurok);
      console.log('Extracted purok number:', purokNumber);

      // Strategy: Query certificate_requests to find the chairman
      // Since users can see their own certificate requests, and certificate requests
      // have user information joined, we can get chairman data that way

      // First, try to get chairman from current user's data if purok_chairman_id exists
      const extendedUser = user as any;
      if (extendedUser.purok_chairman_id) {
        console.log('User has purok_chairman_id:', extendedUser.purok_chairman_id);

        const { data: chairmanData, error: chairmanError } = await supabase
          .from('users')
          .select('*')
          .eq('id', extendedUser.purok_chairman_id)
          .single();

        console.log('Chairman from purok_chairman_id - data:', chairmanData);
        console.log('Chairman from purok_chairman_id - error:', chairmanError);

        if (chairmanData) {
          setChairman(chairmanData);
          return;
        }
      }

      // Fallback: Try multiple query variations
      console.log('Trying multiple query variations...');

      // Try 1: Exact match
      let result = await supabase
        .from('users')
        .select('*')
        .eq('role', 'purok_chairman')
        .eq('purok', normalizedPurok)
        .maybeSingle();

      console.log('Try 1 (exact match):', result);

      if (!result.data && purokNumber) {
        // Try 2: Just the number
        result = await supabase
          .from('users')
          .select('*')
          .eq('role', 'purok_chairman')
          .eq('purok', purokNumber)
          .maybeSingle();

        console.log('Try 2 (number only):', result);
      }

      if (!result.data && purokNumber) {
        // Try 3: With "Purok " prefix
        result = await supabase
          .from('users')
          .select('*')
          .eq('role', 'purok_chairman')
          .eq('purok', `Purok ${purokNumber}`)
          .maybeSingle();

        console.log('Try 3 (with prefix):', result);
      }

      if (!result.data && purokNumber) {
        // Try 4: Case insensitive with ilike
        result = await supabase
          .from('users')
          .select('*')
          .eq('role', 'purok_chairman')
          .ilike('purok', purokNumber)
          .maybeSingle();

        console.log('Try 4 (ilike number):', result);
      }

      if (result.data) {
        setChairman(result.data);
      } else {
        console.log('No chairman found after all attempts');
        Alert.alert(
          'Database Permission Issue',
          `Cannot retrieve chairman information due to database security settings.\n\nYour purok: "${normalizedPurok}"\n\nPlease ask your administrator to:\n1. Update Row Level Security policies\n2. Or set the purok_chairman_id field in your user record`
        );
      }
    } catch (error) {
      console.error('Error loading chairman:', error);
      Alert.alert('Error', `Failed to load chairman information: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (chairman?.phone_number) {
      Linking.openURL(`tel:${chairman.phone_number}`);
    }
  };

  const handleEmail = () => {
    if (chairman?.email) {
      Linking.openURL(`mailto:${chairman.email}`);
    }
  };

  const formatMemberSince = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const defaultAvatar = chairman
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(chairman.full_name)}&size=200&background=4A90E2&color=fff`
    : '';

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBarWrapper backgroundColor={theme.colors.primary} style="light" />
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
              <Text style={styles.title}>My Purok Chairman</Text>
            </View>

            <View style={styles.headerRight} />
          </View>
        </LinearGradient>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading chairman information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!chairman) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBarWrapper backgroundColor={theme.colors.primary} style="light" />
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
              <Text style={styles.title}>My Purok Chairman</Text>
            </View>

            <View style={styles.headerRight} />
          </View>
        </LinearGradient>

        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={moderateScale(80)} color={theme.colors.textTertiary} />
          <Text style={styles.emptyTitle}>No Chairman Assigned</Text>
          <Text style={styles.emptyText}>
            There is currently no chairman assigned for your purok.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.title}>My Purok Chairman</Text>
          </View>

          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Chairman Card */}
        <View style={styles.chairmanCard}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: chairman.photo_url || defaultAvatar }}
              style={styles.avatar}
              onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
            />
            <View style={styles.badge}>
              <Ionicons name="shield-checkmark" size={moderateScale(16)} color="white" />
            </View>
          </View>

          <Text style={styles.chairmanName}>{chairman.full_name}</Text>
          <Text style={styles.chairmanRole}>Purok Chairman</Text>
          <View style={styles.purokBadge}>
            <Ionicons name="location" size={moderateScale(14)} color={theme.colors.primary} />
            <Text style={styles.purokText}>
              {chairman.purok.match(/^[0-9]+$/) ? `Purok ${chairman.purok}` : chairman.purok}
            </Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.callButton]}
              onPress={handleCall}
            >
              <Ionicons name="call" size={moderateScale(20)} color="white" />
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.emailButton]}
              onPress={handleEmail}
            >
              <Ionicons name="mail" size={moderateScale(20)} color="white" />
              <Text style={styles.actionButtonText}>Email</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons name="call-outline" size={moderateScale(20)} color={theme.colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={styles.infoValue}>{chairman.phone_number || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons name="mail-outline" size={moderateScale(20)} color={theme.colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue} numberOfLines={2}>{chairman.email || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons name="location-outline" size={moderateScale(20)} color={theme.colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue} numberOfLines={3}>{chairman.address || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Ionicons name="calendar-outline" size={moderateScale(20)} color={theme.colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>In Office Since</Text>
                <Text style={styles.infoValue}>{formatMemberSince(chairman.created_at)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Help Text */}
        <View style={styles.helpCard}>
          <Ionicons name="information-circle" size={moderateScale(24)} color={theme.colors.info} />
          <Text style={styles.helpText}>
            Your purok chairman is your primary point of contact for barangay matters, certificate requests, and community concerns.
          </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: fontSize.md,
    color: theme.colors.textSecondary,
    fontFamily: theme.fontFamily.regular,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.md,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: fontSize.md * 1.5,
  },
  chairmanCard: {
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
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    borderWidth: scale(4),
    borderColor: theme.colors.primary,
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.success,
    borderRadius: moderateScale(15),
    width: moderateScale(30),
    height: moderateScale(30),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: scale(3),
    borderColor: theme.colors.surface,
  },
  chairmanName: {
    fontSize: fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  chairmanRole: {
    fontSize: fontSize.md,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.textSecondary,
    marginBottom: spacing.sm,
  },
  purokBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  purokText: {
    marginLeft: spacing.xs,
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.primary,
  },
  quickActions: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  callButton: {
    backgroundColor: theme.colors.success,
  },
  emailButton: {
    backgroundColor: theme.colors.info,
  },
  actionButtonText: {
    color: 'white',
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
  },
  section: {
    marginBottom: spacing.lg,
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
    alignItems: 'flex-start',
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
  },
  helpCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.info + '10',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderLeftWidth: scale(4),
    borderLeftColor: theme.colors.info,
  },
  helpText: {
    flex: 1,
    marginLeft: spacing.md,
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    lineHeight: fontSize.sm * 1.6,
  },
});
