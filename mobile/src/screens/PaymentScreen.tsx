import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import StatusBarWrapper from '../components/StatusBarWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { theme } from '../styles/theme';
import {
  createPaymentSource,
  getSourceStatus,
  createPaymentIntent,
  createPaymentMethod,
  attachPaymentMethod,
  getPaymentStatus,
  createCheckoutSession,
  getCheckoutSessionStatus
} from '../services/paymongoService';
import { supabase } from '../lib/supabase';
import { dimensions, spacing, fontSize, borderRadius, scale, verticalScale, moderateScale } from '../utils/responsive';

interface PaymentScreenProps {
  navigation: import('../types/navigation').AppNavigationProp;
  route: any;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'gcash' | 'paymaya';
  description: string;
  useSourceAPI?: boolean; // true for Sources API (GCash), false for Payment Intents (PayMaya)
}

export default function PaymentScreen({ navigation, route }: PaymentScreenProps) {
  const { certificateRequestId, amount, certificateType } = route.params;

  const [selectedMethod, setSelectedMethod] = useState<'gcash' | 'paymaya' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSource, setPaymentSource] = useState<any>(null);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  const [checkoutSession, setCheckoutSession] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 minutes

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'gcash',
      name: 'GCash',
      icon: 'wallet-outline',
      color: '#007DFF',
      type: 'gcash',
      description: 'Pay via GCash QR Code',
      useSourceAPI: true,
    },
    {
      id: 'paymaya',
      name: 'PayMaya',
      icon: 'card-outline',
      color: '#00D632',
      type: 'paymaya',
      description: 'Pay via PayMaya',
      useSourceAPI: false,
    },
  ];

  // Countdown timer
  useEffect(() => {
    if ((paymentSource || checkoutSession) && isPolling && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }

    if (countdown === 0) {
      handlePaymentTimeout();
    }
  }, [paymentSource, checkoutSession, isPolling, countdown]);

  // Poll payment status
  useEffect(() => {
    if ((paymentSource || checkoutSession) && isPolling) {
      const interval = setInterval(async () => {
        await checkPaymentStatus();
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [paymentSource, checkoutSession, isPolling]);

  const handlePaymentTimeout = () => {
    setIsPolling(false);
    Alert.alert(
      'Payment Expired',
      'Your payment session has expired. Please try again.',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  const checkPaymentStatus = async () => {
    if (!paymentSource && !checkoutSession) return;

    try {
      let status = '';
      let referenceId = '';

      // Check based on which payment type was used
      if (selectedMethod === 'gcash') {
        // GCash uses Sources API
        const sourceData = await getSourceStatus(paymentSource.id);
        status = sourceData.attributes.status;
        referenceId = paymentSource.id;
        console.log('GCash payment status:', status);
      } else if (selectedMethod === 'paymaya') {
        // PayMaya uses Checkout Sessions API
        const sessionData = await getCheckoutSessionStatus(checkoutSession.id);

        console.log('===== CHECKOUT SESSION STATUS DEBUG =====');
        console.log('Full session data:', JSON.stringify(sessionData, null, 2));
        console.log('Session status:', sessionData.attributes.status);
        console.log('Payment intent status:', sessionData.attributes.payment_intent?.attributes?.status);
        console.log('Payments array:', sessionData.attributes.payments);
        console.log('==========================================');

        // For checkout sessions, check the payment_intent status or if there are payments
        const paymentIntentStatus = sessionData.attributes.payment_intent?.attributes?.status;
        const hasPayments = sessionData.attributes.payments && sessionData.attributes.payments.length > 0;

        // If there are completed payments, consider it paid
        if (hasPayments) {
          status = 'paid';
        } else {
          status = paymentIntentStatus || sessionData.attributes.status;
        }

        referenceId = checkoutSession.id;
        console.log('Determined status:', status);
      }

      if (status === 'chargeable' || status === 'paid' || status === 'succeeded') {
        setIsPolling(false);
        await updateCertificateRequestPayment('paid');

        // Navigate to confirmation screen
        navigation.replace('PaymentConfirmation', {
          certificateType,
          amount,
          certificateRequestId,
          paymentMethod: selectedMethod,
          paymentReference: referenceId,
        });
      } else if (status === 'failed' || status === 'cancelled') {
        setIsPolling(false);
        await updateCertificateRequestPayment('failed');

        Alert.alert(
          'Payment Failed',
          'Your payment was not successful. Please try again.',
          [
            {
              text: 'Retry',
              onPress: () => {
                setPaymentSource(null);
                setCheckoutSession(null);
                setSelectedMethod(null);
              },
            },
            {
              text: 'Cancel',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  };

  const updateCertificateRequestPayment = async (paymentStatus: string) => {
    try {
      const updateData: any = {
        payment_status: paymentStatus,
        payment_reference: paymentSource?.id || checkoutSession?.id,
        payment_amount: amount, // Set the payment amount
        updated_at: new Date().toISOString(),
      };

      // Only set payment_date if payment is successful
      if (paymentStatus === 'paid') {
        updateData.payment_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('certificate_requests')
        .update(updateData)
        .eq('id', certificateRequestId);

      if (error) {
        console.error('Error updating payment status:', error);
      }
    } catch (error) {
      console.error('Error updating certificate request:', error);
    }
  };

  const handlePaymentMethodSelect = async (method: PaymentMethod) => {
    setSelectedMethod(method.type);
    setIsProcessing(true);

    try {
      if (method.useSourceAPI) {
        // GCash: Use Sources API
        const source = await createPaymentSource(
          amount,
          `${certificateType} - Request ID: ${certificateRequestId.slice(0, 8)}`,
          method.type as 'gcash'
        );

        setPaymentSource(source);
        setIsPolling(true);
        setCountdown(600); // Reset countdown

        // Update certificate request with payment info
        await supabase
          .from('certificate_requests')
          .update({
            payment_status: 'pending',
            payment_method: method.type,
            payment_reference: source.id,
          })
          .eq('id', certificateRequestId);
      } else {
        // PayMaya: Use Checkout Sessions API (works like GCash)
        const session = await createCheckoutSession(
          amount,
          `${certificateType} - Request ID: ${certificateRequestId.slice(0, 8)}`,
          'paymaya'
        );

        console.log('===== PAYMAYA CHECKOUT DEBUG =====');
        console.log('Full Checkout Session:', JSON.stringify(session, null, 2));
        console.log('Checkout URL:', session?.attributes?.checkout_url);
        console.log('Payment Intent ID:', session?.attributes?.payment_intent?.id);
        console.log('Status:', session?.attributes?.status);
        console.log('==================================');

        // Check if we got a valid checkout session
        if (!session || !session.attributes || !session.attributes.checkout_url) {
          throw new Error('Invalid checkout session response from PayMongo');
        }

        setCheckoutSession(session);
        setIsPolling(true);
        setCountdown(600); // Reset countdown

        // Update certificate request with payment info
        await supabase
          .from('certificate_requests')
          .update({
            payment_status: 'pending',
            payment_method: method.type,
            payment_reference: session.id,
          })
          .eq('id', certificateRequestId);
      }
    } catch (error: any) {
      console.error('Payment creation error:', error);
      Alert.alert(
        'Payment Error',
        error.message || 'Failed to initialize payment. Please try again.',
        [{ text: 'OK' }]
      );
      setSelectedMethod(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenCheckout = () => {
    let checkoutUrl = '';

    if (selectedMethod === 'gcash' && paymentSource?.attributes?.redirect?.checkout_url) {
      checkoutUrl = paymentSource.attributes.redirect.checkout_url;
    } else if (selectedMethod === 'paymaya' && checkoutSession?.attributes?.checkout_url) {
      checkoutUrl = checkoutSession.attributes.checkout_url;
    }

    if (checkoutUrl) {
      Linking.openURL(checkoutUrl).catch(() => {
        Alert.alert('Error', 'Unable to open payment page');
      });
    }
  };

  const handleSimulatePayment = async () => {
    Alert.alert(
      'Simulate Payment',
      'This will simulate a successful payment in TEST MODE. In production, actual payment would be required.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Simulate Success',
          onPress: async () => {
            setIsPolling(false);
            await updateCertificateRequestPayment('paid');

            // Navigate to confirmation screen
            navigation.replace('PaymentConfirmation', {
              certificateType,
              amount,
              certificateRequestId,
              paymentMethod: selectedMethod,
              paymentReference: paymentSource?.id || checkoutSession?.id || 'TEST-' + certificateRequestId.slice(0, 8),
            });
          },
        },
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderPaymentMethod = (method: PaymentMethod) => (
    <TouchableOpacity
      key={method.id}
      style={[
        styles.methodCard,
        selectedMethod === method.type && styles.selectedMethodCard,
      ]}
      onPress={() => !isProcessing && !paymentSource && !checkoutSession && handlePaymentMethodSelect(method)}
      disabled={isProcessing || !!paymentSource || !!checkoutSession}
      activeOpacity={0.7}
    >
      <View style={[styles.methodIcon, { backgroundColor: method.color + '20' }]}>
        <Ionicons name={method.icon as any} size={moderateScale(28)} color={method.color} />
      </View>
      <View style={styles.methodInfo}>
        <Text style={styles.methodName}>{method.name}</Text>
        <Text style={styles.methodDescription}>{method.description}</Text>
      </View>
      {selectedMethod === method.type && !paymentSource && !checkoutSession && (
        <ActivityIndicator size="small" color={method.color} />
      )}
      {selectedMethod === method.type && (paymentSource || checkoutSession) && (
        <Ionicons name="checkmark-circle" size={moderateScale(24)} color={theme.colors.success} />
      )}
    </TouchableOpacity>
  );

  const renderQRSection = () => (
    <View style={styles.qrSection}>
      <View style={styles.qrHeader}>
        <Ionicons name="time-outline" size={moderateScale(20)} color={theme.colors.warning} />
        <Text style={styles.qrTimer}>Time remaining: {formatTime(countdown)}</Text>
      </View>

      <View style={styles.qrContainer}>
        {(selectedMethod === 'gcash' && paymentSource?.attributes?.redirect?.checkout_url) ||
         (selectedMethod === 'paymaya' && checkoutSession?.attributes?.checkout_url) ? (
          <QRCode
            value={
              selectedMethod === 'gcash'
                ? paymentSource.attributes.redirect.checkout_url
                : checkoutSession.attributes.checkout_url
            }
            size={dimensions.width * 0.6}
            color="black"
            backgroundColor="white"
          />
        ) : (
          <ActivityIndicator size="large" color={theme.colors.primary} />
        )}
      </View>

      {/* Test Mode Indicator */}
      <View style={styles.testModeBanner}>
        <Ionicons name="flask-outline" size={moderateScale(18)} color={theme.colors.info} />
        <Text style={styles.testModeText}>TEST MODE - No real money will be charged</Text>
      </View>

      <View style={styles.qrInstructions}>
        <Text style={styles.instructionTitle}>How to Pay:</Text>
        <View style={styles.instructionStep}>
          <Text style={styles.stepNumber}>1.</Text>
          <Text style={styles.stepText}>Open your {paymentMethods.find(m => m.type === selectedMethod)?.name} app</Text>
        </View>
        <View style={styles.instructionStep}>
          <Text style={styles.stepNumber}>2.</Text>
          <Text style={styles.stepText}>Scan the QR code above</Text>
        </View>
        <View style={styles.instructionStep}>
          <Text style={styles.stepNumber}>3.</Text>
          <Text style={styles.stepText}>Confirm the payment amount: ₱{amount}</Text>
        </View>
        <View style={styles.instructionStep}>
          <Text style={styles.stepNumber}>4.</Text>
          <Text style={styles.stepText}>Complete the payment</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.checkoutButton}
        onPress={handleOpenCheckout}
        activeOpacity={0.7}
      >
        <Ionicons name="open-outline" size={moderateScale(18)} color="white" />
        <Text style={styles.checkoutButtonText}>
          Open in {paymentMethods.find(m => m.type === selectedMethod)?.name} App
        </Text>
      </TouchableOpacity>

      {/* TEST MODE ONLY: Simulate Payment Button */}
      <TouchableOpacity
        style={styles.simulateButton}
        onPress={handleSimulatePayment}
        activeOpacity={0.7}
      >
        <Ionicons name="checkmark-done-outline" size={moderateScale(18)} color={theme.colors.success} />
        <Text style={styles.simulateButtonText}>Simulate Successful Payment (Test Mode)</Text>
      </TouchableOpacity>

      <View style={styles.pollingIndicator}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.pollingText}>Waiting for payment confirmation...</Text>
      </View>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => {
          setIsPolling(false);
          setPaymentSource(null);
          setCheckoutSession(null);
          setSelectedMethod(null);
        }}
      >
        <Text style={styles.cancelButtonText}>Cancel Payment</Text>
      </TouchableOpacity>
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
            onPress={() => {
              if (paymentSource && isPolling) {
                Alert.alert(
                  'Cancel Payment?',
                  'Are you sure you want to cancel this payment?',
                  [
                    { text: 'No', style: 'cancel' },
                    {
                      text: 'Yes',
                      onPress: () => {
                        setIsPolling(false);
                        navigation.goBack();
                      },
                    },
                  ]
                );
              } else {
                navigation.goBack();
              }
            }}
          >
            <Ionicons name="arrow-back" size={moderateScale(24)} color="white" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.title}>Payment</Text>
          </View>

          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Payment Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="receipt-outline" size={moderateScale(24)} color={theme.colors.primary} />
            <Text style={styles.summaryTitle}>Payment Summary</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Certificate Type:</Text>
            <Text style={styles.summaryValue}>{certificateType}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Request ID:</Text>
            <Text style={styles.summaryValue}>{certificateRequestId.slice(0, 8).toUpperCase()}</Text>
          </View>

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalValue}>₱{amount}</Text>
          </View>
        </View>

        {/* Payment Methods or QR Code */}
        {!paymentSource && !checkoutSession ? (
          <View style={styles.methodsSection}>
            <Text style={styles.sectionTitle}>Select Payment Method</Text>
            <Text style={styles.sectionSubtitle}>Choose your preferred payment option</Text>
            {paymentMethods.map(renderPaymentMethod)}
          </View>
        ) : (
          renderQRSection()
        )}

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Ionicons name="shield-checkmark" size={moderateScale(18)} color={theme.colors.success} />
          <Text style={styles.securityText}>
            Secured by PayMongo. Your payment information is encrypted and safe.
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
  summaryCard: {
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
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  summaryTitle: {
    fontSize: fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
    marginLeft: spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  summaryValue: {
    fontSize: fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.text,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.primary,
  },
  methodsSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginBottom: spacing.lg,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(2),
    },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(4),
    elevation: 3,
  },
  selectedMethodCard: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '05',
  },
  methodIcon: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  methodDescription: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
  },
  qrSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(4),
    },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(8),
    elevation: 5,
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning + '15',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  qrTimer: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.warning,
    marginLeft: spacing.sm,
  },
  qrContainer: {
    width: dimensions.width * 0.7,
    height: dimensions.width * 0.7,
    backgroundColor: 'white',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testModeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.info + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.info + '30',
  },
  testModeText: {
    fontSize: fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.info,
    marginLeft: spacing.sm,
    flex: 1,
  },
  qrInstructions: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  instructionTitle: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: spacing.md,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  stepNumber: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.primary,
    marginRight: spacing.sm,
    width: moderateScale(20),
  },
  stepText: {
    flex: 1,
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.text,
    lineHeight: verticalScale(20),
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    width: '100%',
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    marginLeft: spacing.sm,
  },
  simulateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.success + '15',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    width: '100%',
    borderWidth: 2,
    borderColor: theme.colors.success,
    borderStyle: 'dashed',
  },
  simulateButtonText: {
    color: theme.colors.success,
    fontSize: fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    marginLeft: spacing.sm,
  },
  pollingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  pollingText: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginLeft: spacing.sm,
  },
  cancelButton: {
    paddingVertical: spacing.md,
  },
  cancelButtonText: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.medium,
    color: theme.colors.error,
    textAlign: 'center',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success + '10',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.success + '30',
  },
  securityText: {
    flex: 1,
    fontSize: fontSize.xs,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginLeft: spacing.sm,
    lineHeight: verticalScale(16),
  },
  paymayaIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  paymayaText: {
    fontSize: fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.text,
    marginTop: spacing.md,
  },
  paymayaSubtext: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
