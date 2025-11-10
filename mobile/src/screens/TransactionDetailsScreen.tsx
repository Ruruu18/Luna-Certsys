import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Share,
  Alert,
} from 'react-native';
import StatusBarWrapper from '../components/StatusBarWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { dimensions, spacing, fontSize, borderRadius, scale, verticalScale, moderateScale } from '../utils/responsive';
import { downloadReceipt } from '../utils/receiptGenerator';

interface TransactionDetailsScreenProps {
  navigation: import('../types/navigation').AppNavigationProp;
  route: any;
}

export default function TransactionDetailsScreen({ navigation, route }: TransactionDetailsScreenProps) {
  const { transaction } = route.params;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return theme.colors.success;
      case 'Pending':
        return theme.colors.warning;
      case 'Failed':
        return theme.colors.error;
      case 'Refunded':
        return theme.colors.secondary;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'checkmark-circle';
      case 'Pending':
        return 'time';
      case 'Failed':
        return 'close-circle';
      case 'Refunded':
        return 'return-up-back';
      default:
        return 'help-circle';
    }
  };

  const handleShareReceipt = async () => {
    try {
      const message = `
Transaction Receipt
-------------------
Reference: ${transaction.referenceNumber}
Certificate: ${transaction.certificateType}
Amount: ₱${transaction.amount}
Payment Method: ${transaction.paymentMethod}
Status: ${transaction.status}
Date: ${transaction.date}
${transaction.receiptNumber ? `Receipt No: ${transaction.receiptNumber}` : ''}
      `.trim();

      await Share.share({
        message,
        title: 'Transaction Receipt',
      });
    } catch (error) {
      console.error('Error sharing receipt:', error);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!transaction.receiptNumber) {
      Alert.alert(
        'No Receipt Available',
        'This transaction does not have a receipt yet. Receipts are only available for paid transactions.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await downloadReceipt(transaction);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      Alert.alert(
        'Download Failed',
        'Failed to download receipt. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Need help with this transaction?\n\nCall: 09123456789\nEmail: brgy_luna@surigao.gov.ph',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Now', onPress: () => {} },
      ]
    );
  };

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
            <Text style={styles.title}>Transaction Details</Text>
          </View>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShareReceipt}
          >
            <Ionicons name="share-outline" size={moderateScale(24)} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusIconContainer, { backgroundColor: getStatusColor(transaction.status) }]}>
            <Ionicons
              name={getStatusIcon(transaction.status) as any}
              size={moderateScale(48)}
              color="white"
            />
          </View>
          <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
            {transaction.status}
          </Text>
          <Text style={styles.statusSubtext}>
            {transaction.status === 'Paid' && 'Payment completed successfully'}
            {transaction.status === 'Pending' && 'Waiting for payment confirmation'}
            {transaction.status === 'Failed' && 'Payment was unsuccessful'}
            {transaction.status === 'Refunded' && 'Amount has been refunded'}
          </Text>
        </View>

        {/* Amount Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Total Amount</Text>
          <Text style={styles.amountValue}>₱{transaction.amount}</Text>
        </View>

        {/* Transaction Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Transaction Information</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Ionicons name="document-text-outline" size={moderateScale(20)} color={theme.colors.textSecondary} />
              <Text style={styles.detailLabel}>Reference Number</Text>
            </View>
            <Text style={styles.detailValue}>{transaction.referenceNumber}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Ionicons name="ribbon-outline" size={moderateScale(20)} color={theme.colors.textSecondary} />
              <Text style={styles.detailLabel}>Certificate Type</Text>
            </View>
            <Text style={styles.detailValue}>{transaction.certificateType}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Ionicons name="calendar-outline" size={moderateScale(20)} color={theme.colors.textSecondary} />
              <Text style={styles.detailLabel}>Transaction Date</Text>
            </View>
            <Text style={styles.detailValue}>{transaction.date}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Ionicons name="wallet-outline" size={moderateScale(20)} color={theme.colors.textSecondary} />
              <Text style={styles.detailLabel}>Payment Method</Text>
            </View>
            <View style={styles.paymentMethodBadge}>
              <Text style={styles.paymentMethodText}>{transaction.paymentMethod}</Text>
            </View>
          </View>

          {transaction.receiptNumber && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <View style={styles.detailLeft}>
                  <Ionicons name="receipt-outline" size={moderateScale(20)} color={theme.colors.textSecondary} />
                  <Text style={styles.detailLabel}>Receipt Number</Text>
                </View>
                <Text style={styles.detailValueSmall}>{transaction.receiptNumber}</Text>
              </View>
            </>
          )}
        </View>

        {/* Action Buttons */}
        {transaction.receiptNumber && (
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={handleDownloadReceipt}
            activeOpacity={0.7}
          >
            <Ionicons name="download-outline" size={moderateScale(20)} color="white" />
            <Text style={styles.downloadButtonText}>Download Receipt</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.supportButton}
          onPress={handleContactSupport}
          activeOpacity={0.7}
        >
          <Ionicons name="help-circle-outline" size={moderateScale(20)} color={theme.colors.primary} />
          <Text style={styles.supportButtonText}>Contact Support</Text>
        </TouchableOpacity>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Ionicons name="information-circle-outline" size={moderateScale(18)} color={theme.colors.info} />
          <Text style={styles.infoNoteText}>
            Keep this transaction record for your reference. Contact support if you have any questions.
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
    paddingHorizontal: spacing.lg,
  },
  backButton: {
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
    fontSize: fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: 'white',
  },
  shareButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  statusCard: {
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
  statusIconContainer: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  statusText: {
    fontSize: fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    marginBottom: spacing.xs,
  },
  statusSubtext: {
    fontSize: fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  amountCard: {
    backgroundColor: theme.colors.primary + '10',
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  amountLabel: {
    fontSize: fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: spacing.sm,
  },
  amountValue: {
    fontSize: fontSize.xxxl,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.primary,
  },
  detailsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(2),
    },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(4),
    elevation: 3,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  detailValue: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.text,
    textAlign: 'right',
    flex: 1,
  },
  detailValueSmall: {
    fontSize: fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.text,
    textAlign: 'right',
    flex: 1,
  },
  paymentMethodBadge: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  paymentMethodText: {
    fontSize: fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: spacing.sm,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(4),
    },
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(8),
    elevation: 5,
  },
  downloadButtonText: {
    color: 'white',
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    marginLeft: spacing.sm,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    marginBottom: spacing.lg,
  },
  supportButtonText: {
    color: theme.colors.primary,
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    marginLeft: spacing.sm,
  },
  infoNote: {
    flexDirection: 'row',
    backgroundColor: theme.colors.info + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.info,
  },
  infoNoteText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: theme.colors.text,
    marginLeft: spacing.sm,
    lineHeight: verticalScale(20),
  },
});
