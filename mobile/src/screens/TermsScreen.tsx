import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import StatusBarWrapper from '../components/StatusBarWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { dimensions, spacing, fontSize, borderRadius, moderateScale, verticalScale, scale } from '../utils/responsive';

interface TermsScreenProps {
  navigation: import('../types/navigation').AppNavigationProp;
}

export default function TermsScreen({ navigation }: TermsScreenProps) {
  const renderSection = (title: string, content: string) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionContent}>{content}</Text>
    </View>
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
            <Text style={styles.title}>Terms of Service</Text>
          </View>

          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.card}>
          <View style={styles.lastUpdated}>
            <Ionicons name="calendar-outline" size={moderateScale(16)} color={theme.colors.textSecondary} />
            <Text style={styles.lastUpdatedText}>Last Updated: January 2025</Text>
          </View>

          {renderSection(
            '1. Acceptance of Terms',
            'By accessing and using the Barangay Luna Certificate System mobile application, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.'
          )}

          {renderSection(
            '2. Use License',
            'Permission is granted to temporarily use the Barangay Luna Certificate System for personal, non-transferable purposes. This is the grant of a license, not a transfer of title, and under this license you may not:\n\n• Modify or copy the materials\n• Use the materials for any commercial purpose\n• Attempt to decompile or reverse engineer any software\n• Remove any copyright or other proprietary notations\n• Transfer the materials to another person'
          )}

          {renderSection(
            '3. User Account',
            'To use this service, you must:\n\n• Be a registered resident of Barangay Luna\n• Provide accurate and complete registration information\n• Maintain the security of your account credentials\n• Accept responsibility for all activities under your account\n• Notify us immediately of any unauthorized use\n\nYour account may be suspended or terminated if you violate these terms.'
          )}

          {renderSection(
            '4. Certificate Requests',
            'The system allows residents to request barangay certificates online. Processing times may vary depending on the type of certificate and current workload. Payment for certificate services must be completed before processing begins. All certificates are subject to verification and approval by authorized barangay officials.'
          )}

          {renderSection(
            '5. Payment Terms',
            'Certificate fees are as prescribed by the Barangay ordinance. Payment is processed through secure third-party payment gateways (PayMongo). All fees are non-refundable once processing has begun. The Barangay is not responsible for payment gateway fees or transaction charges.'
          )}

          {renderSection(
            '6. User Conduct',
            'You agree not to:\n\n• Provide false information or impersonate others\n• Submit fraudulent certificate requests\n• Interfere with the proper functioning of the system\n• Access or attempt to access other users\' accounts\n• Use the service for any illegal purposes\n• Harass or abuse barangay officials or staff'
          )}

          {renderSection(
            '7. Data Accuracy',
            'You are responsible for ensuring that all information you provide is accurate and up-to-date. The Barangay is not liable for issues arising from inaccurate or outdated information provided by users.'
          )}

          {renderSection(
            '8. Service Availability',
            'We strive to keep the service available at all times, but we do not guarantee uninterrupted access. The service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control.'
          )}

          {renderSection(
            '9. Intellectual Property',
            'The Barangay Luna Certificate System and its original content, features, and functionality are owned by Barangay Luna and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.'
          )}

          {renderSection(
            '10. Limitation of Liability',
            'Barangay Luna shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service.'
          )}

          {renderSection(
            '11. Changes to Terms',
            'We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of the service after changes constitutes acceptance of the modified terms.'
          )}

          {renderSection(
            '12. Governing Law',
            'These terms shall be governed by and construed in accordance with the laws of the Republic of the Philippines, without regard to its conflict of law provisions.'
          )}

          {renderSection(
            '13. Contact Information',
            'For questions about these Terms of Service, please contact:\n\nBarangay Luna Office\nEmail: barangayluna@gmail.com\nPhone: [Contact Number]\nAddress: Barangay Luna, Municipality'
          )}

          <View style={styles.footer}>
            <Ionicons name="shield-checkmark" size={moderateScale(40)} color={theme.colors.primary} />
            <Text style={styles.footerText}>
              By using this service, you acknowledge that you have read and understood these Terms of Service.
            </Text>
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
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(4),
    },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(8),
    elevation: 5,
  },
  lastUpdated: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  lastUpdatedText: {
    marginLeft: spacing.sm,
    fontSize: fontSize.sm,
    color: theme.colors.textSecondary,
    fontFamily: theme.fontFamily.regular,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: spacing.md,
  },
  sectionContent: {
    fontSize: fontSize.md,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    lineHeight: fontSize.md * 1.6,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  footerText: {
    marginTop: spacing.md,
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: fontSize.sm * 1.6,
  },
});
