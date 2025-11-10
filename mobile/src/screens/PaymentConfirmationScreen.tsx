import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  ScrollView,
} from 'react-native';
import StatusBarWrapper from '../components/StatusBarWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { dimensions, spacing, fontSize, borderRadius, scale, verticalScale, moderateScale } from '../utils/responsive';

interface PaymentConfirmationScreenProps {
  navigation: import('../types/navigation').AppNavigationProp;
  route: any;
}

export default function PaymentConfirmationScreen({ navigation, route }: PaymentConfirmationScreenProps) {
  const {
    certificateType,
    amount,
    certificateRequestId,
    paymentMethod,
    paymentReference
  } = route.params;

  const scaleAnim = new Animated.Value(0);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    // Animate success icon
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 10,
      friction: 3,
      useNativeDriver: true,
    }).start();

    // Fade in content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      delay: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleGoToDashboard = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  const handleViewRequest = () => {
    navigation.reset({
      index: 0,
      routes: [
        { name: 'Main' },
        { name: 'TrackRequest' }
      ],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBarWrapper backgroundColor={theme.colors.success} style="light" />

      {/* Header */}
      <LinearGradient
        colors={[theme.colors.success, '#059669']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Payment Successful</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Icon */}
        <Animated.View
          style={[
            styles.successIconContainer,
            {
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark" size={moderateScale(80)} color="white" />
          </View>
        </Animated.View>

        {/* Success Message */}
        <Animated.View style={[styles.messageContainer, { opacity: fadeAnim }]}>
          <Text style={styles.successTitle}>Payment Confirmed!</Text>
          <Text style={styles.successSubtitle}>
            Your payment has been successfully processed
          </Text>
        </Animated.View>

        {/* Payment Details Card */}
        <Animated.View style={[styles.detailsCard, { opacity: fadeAnim }]}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Certificate Type</Text>
            <Text style={styles.detailValue}>{certificateType}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount Paid</Text>
            <Text style={[styles.detailValue, styles.amountValue]}>₱{amount}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method</Text>
            <View style={styles.paymentMethodBadge}>
              <Ionicons
                name={
                  paymentMethod === 'gcash' ? 'wallet' :
                  paymentMethod === 'paymaya' ? 'card' :
                  'phone-portrait'
                }
                size={moderateScale(16)}
                color={theme.colors.primary}
              />
              <Text style={styles.paymentMethodText}>
                {paymentMethod === 'gcash' ? 'GCash' :
                 paymentMethod === 'paymaya' ? 'PayMaya' :
                 'GrabPay'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Request ID</Text>
            <Text style={styles.detailValue}>{certificateRequestId.slice(0, 8).toUpperCase()}</Text>
          </View>

          {paymentReference && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Reference No.</Text>
                <Text style={styles.detailValueSmall}>{paymentReference.slice(0, 16)}</Text>
              </View>
            </>
          )}

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>
              {new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })} at {new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </Animated.View>

        {/* What's Next Section */}
        <Animated.View style={[styles.nextStepsCard, { opacity: fadeAnim }]}>
          <View style={styles.nextStepsHeader}>
            <Ionicons name="information-circle" size={moderateScale(20)} color={theme.colors.info} />
            <Text style={styles.nextStepsTitle}>What's Next?</Text>
          </View>
          <View style={styles.nextStepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>Your certificate request is being processed</Text>
          </View>
          <View style={styles.nextStepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>You'll receive updates on the request status</Text>
          </View>
          <View style={styles.nextStepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>Pick up your certificate when ready</Text>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View style={[styles.actionsContainer, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleGoToDashboard}
            activeOpacity={0.7}
          >
            <Ionicons name="home" size={moderateScale(20)} color="white" />
            <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleViewRequest}
            activeOpacity={0.7}
          >
            <Ionicons name="document-text" size={moderateScale(20)} color={theme.colors.primary} />
            <Text style={styles.secondaryButtonText}>Track My Request</Text>
          </TouchableOpacity>
        </Animated.View>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: 'white',
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: verticalScale(120), // Extra padding at bottom for buttons
  },
  successIconContainer: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  successIconCircle: {
    width: moderateScale(140),
    height: moderateScale(140),
    borderRadius: moderateScale(70),
    backgroundColor: theme.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.success,
    shadowOffset: {
      width: 0,
      height: verticalScale(8),
    },
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(16),
    elevation: 10,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  successTitle: {
    fontSize: fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: fontSize.md,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  detailsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
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
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
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
  amountValue: {
    fontSize: fontSize.xl,
    color: theme.colors.success,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
  },
  paymentMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: spacing.sm,
  },
  nextStepsCard: {
    backgroundColor: theme.colors.info + '10',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.info + '30',
  },
  nextStepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  nextStepsTitle: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.text,
    marginLeft: spacing.sm,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  stepNumber: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: theme.colors.info,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  stepNumberText: {
    fontSize: fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: 'white',
  },
  stepText: {
    flex: 1,
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.text,
    lineHeight: verticalScale(20),
  },
  actionsContainer: {
    marginTop: spacing.md,
  },
  primaryButton: {
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
  primaryButtonText: {
    color: 'white',
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    marginLeft: spacing.sm,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    marginLeft: spacing.sm,
  },
});
