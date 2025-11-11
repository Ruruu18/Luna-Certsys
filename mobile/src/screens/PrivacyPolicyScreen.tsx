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

interface PrivacyPolicyScreenProps {
  navigation: import('../types/navigation').AppNavigationProp;
}

export default function PrivacyPolicyScreen({ navigation }: PrivacyPolicyScreenProps) {
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
            <Text style={styles.title}>Privacy Policy</Text>
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

          <View style={styles.highlight}>
            <Ionicons name="shield-checkmark-outline" size={moderateScale(24)} color={theme.colors.primary} />
            <Text style={styles.highlightText}>
              Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
            </Text>
          </View>

          {renderSection(
            '1. Information We Collect',
            'We collect information that you provide directly to us when you:\n\n• Register for an account\n• Request barangay certificates\n• Update your profile information\n• Contact customer support\n• Make payments for services\n\nThis information may include:\n• Full name, address, and contact details\n• Government-issued identification numbers\n• Date of birth and civil status\n• Face photo for verification\n• Payment and transaction information\n• Device information and usage data'
          )}

          {renderSection(
            '2. How We Use Your Information',
            'We use the collected information for the following purposes:\n\n• To verify your identity and residency\n• To process certificate requests\n• To facilitate payment transactions\n• To send notifications about your requests\n• To improve our services\n• To comply with legal obligations\n• To prevent fraud and abuse\n• To communicate important updates'
          )}

          {renderSection(
            '3. Data Storage and Security',
            'Your data is stored securely using industry-standard encryption and security measures:\n\n• All data is encrypted in transit and at rest\n• Access is restricted to authorized personnel only\n• Regular security audits are conducted\n• Secure authentication mechanisms are used\n• Data is backed up regularly\n\nWe use Supabase as our database provider, which complies with international data protection standards.'
          )}

          {renderSection(
            '4. Face Photo Verification',
            'During registration, we collect a face photo to:\n\n• Verify your identity\n• Prevent fraudulent registrations\n• Ensure account security\n\nYour face photo is:\n• Stored securely in our database\n• Only accessible to authorized officials\n• Used solely for verification purposes\n• Not shared with third parties\n• Protected under data privacy laws'
          )}

          {renderSection(
            '5. Payment Information',
            'Payment processing is handled by PayMongo, a secure third-party payment processor. We do not store your complete payment card information. Only transaction records and payment status are retained for record-keeping purposes.'
          )}

          {renderSection(
            '6. Information Sharing',
            'We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:\n\n• With authorized barangay officials for certificate processing\n• With payment processors for transaction processing\n• When required by law or legal process\n• To protect our rights and prevent fraud\n• With your explicit consent'
          )}

          {renderSection(
            '7. Data Retention',
            'We retain your personal information for as long as:\n\n• Your account is active\n• Required to provide services\n• Necessary for legal compliance\n• Needed for legitimate business purposes\n\nYou may request deletion of your account and data, subject to legal retention requirements.'
          )}

          {renderSection(
            '8. Your Privacy Rights',
            'Under the Data Privacy Act of 2012, you have the right to:\n\n• Access your personal data\n• Correct inaccurate information\n• Request deletion of your data\n• Object to data processing\n• Withdraw consent\n• File a complaint with authorities\n\nTo exercise these rights, please contact our Data Privacy Officer.'
          )}

          {renderSection(
            '9. Cookies and Tracking',
            'We use minimal tracking technologies to:\n\n• Maintain your login session\n• Remember your preferences\n• Analyze app usage for improvements\n\nYou can control these settings in your device settings.'
          )}

          {renderSection(
            '10. Children\'s Privacy',
            'This service is not intended for children under 13 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.'
          )}

          {renderSection(
            '11. Third-Party Services',
            'Our app integrates with third-party services:\n\n• Supabase (database and authentication)\n• PayMongo (payment processing)\n• Google Maps (location services)\n• Resend (email notifications)\n\nEach service has its own privacy policy governing their use of your information.'
          )}

          {renderSection(
            '12. Push Notifications',
            'We send push notifications to inform you about:\n\n• Certificate request status updates\n• Important announcements\n• Payment confirmations\n\nYou can disable notifications in your device settings at any time.'
          )}

          {renderSection(
            '13. Changes to This Policy',
            'We may update this Privacy Policy from time to time. We will notify you of any changes by:\n\n• Posting the new policy in the app\n• Updating the "Last Updated" date\n• Sending a notification for significant changes\n\nYour continued use of the service after changes indicates acceptance of the updated policy.'
          )}

          {renderSection(
            '14. Data Privacy Act Compliance',
            'This Privacy Policy complies with the Data Privacy Act of 2012 (Republic Act No. 10173) and its implementing rules and regulations. We are committed to protecting your personal information in accordance with Philippine law.'
          )}

          {renderSection(
            '15. Contact Information',
            'For privacy concerns or to exercise your data rights, contact:\n\nData Privacy Officer\nBarangay Luna Office\nEmail: barangayluna@gmail.com\nPhone: [Contact Number]\nAddress: Barangay Luna, Municipality\n\nNational Privacy Commission\nEmail: info@privacy.gov.ph\nWebsite: www.privacy.gov.ph'
          )}

          <View style={styles.footer}>
            <Ionicons name="lock-closed" size={moderateScale(40)} color={theme.colors.success} />
            <Text style={styles.footerText}>
              We are committed to protecting your privacy and ensuring the security of your personal information.
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
    marginBottom: spacing.lg,
  },
  lastUpdatedText: {
    marginLeft: spacing.sm,
    fontSize: fontSize.sm,
    color: theme.colors.textSecondary,
    fontFamily: theme.fontFamily.regular,
  },
  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '10',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    borderLeftWidth: scale(4),
    borderLeftColor: theme.colors.primary,
  },
  highlightText: {
    flex: 1,
    marginLeft: spacing.md,
    fontSize: fontSize.md,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.text,
    lineHeight: fontSize.md * 1.5,
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
