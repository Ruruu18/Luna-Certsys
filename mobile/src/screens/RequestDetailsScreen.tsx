import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import StatusBarWrapper from '../components/StatusBarWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { CertificateRequest } from '../lib/supabase';
import { dimensions, spacing, fontSize, borderRadius, scale, verticalScale, moderateScale } from '../utils/responsive';
import { downloadCertificate, generateCertificatePDF } from '../services/certificateGenerator';
import { ExtendedCertificateRequest } from '../types/certificateRequest';

interface RequestDetailsScreenProps {
  navigation: import('../types/navigation').AppNavigationProp;
  route: any;
}

export default function RequestDetailsScreen({ navigation, route }: RequestDetailsScreenProps) {
  const { request }: { request: ExtendedCertificateRequest } = route.params;
  const [downloading, setDownloading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return theme.colors.warning;
      case 'in_progress':
        return theme.colors.info;
      case 'completed':
        return theme.colors.success;
      case 'rejected':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return 'time';
      case 'in_progress':
        return 'refresh';
      case 'completed':
        return 'checkmark-done';
      case 'rejected':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const getProgressForStatus = (status: string): number => {
    switch (status) {
      case 'pending':
        return 25;
      case 'in_progress':
        return 65;
      case 'completed':
        return 100;
      case 'rejected':
        return 0;
      default:
        return 0;
    }
  };

  const handleGenerateCertificate = async () => {
    if (request.status !== 'completed') {
      Alert.alert('Not Ready', 'Your request must be completed before generating the certificate.');
      return;
    }

    // Check if payment is required and paid
    if (request.payment_amount && request.payment_status !== 'paid') {
      Alert.alert(
        'Payment Required',
        'Please complete the payment before generating your certificate.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Generate Certificate',
      'This will create your official certificate PDF. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            setGenerating(true);
            try {
              console.log('Generating certificate for request:', request.id);

              const result = await generateCertificatePDF({
                requestId: request.id,
                userId: request.user_id,
                certificateType: request.certificate_type,
                purpose: request.purpose,
              });

              if (result.success) {
                Alert.alert(
                  'Success!',
                  `Certificate generated successfully!\nCertificate No: ${result.certificateNumber}`,
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Refresh the screen to show the download button
                        navigation.replace('RequestDetails', {
                          request: {
                            ...request,
                            pdf_url: result.pdfUrl,
                            certificate_number: result.certificateNumber,
                            pdf_generated_at: new Date().toISOString()
                          }
                        });
                      }
                    }
                  ]
                );
              } else {
                Alert.alert(
                  'Generation Failed',
                  result.error || 'Failed to generate certificate. Please try again or contact support.'
                );
              }
            } catch (error: any) {
              console.error('Certificate generation error:', error);
              Alert.alert(
                'Error',
                error.message || 'An unexpected error occurred. Please try again.'
              );
            } finally {
              setGenerating(false);
            }
          }
        }
      ]
    );
  };

  const handleDownloadCertificate = async () => {
    if (request.status !== 'completed' || !request.pdf_url) {
      Alert.alert('Not Available', 'Certificate is not yet ready for download.');
      return;
    }

    setDownloading(true);
    try {
      const fileName = `Certificate_${request.certificate_number || 'Document'}.pdf`;
      const result = await downloadCertificate(request.pdf_url, fileName);

      if (!result.success) {
        Alert.alert('Download Failed', result.error || 'Failed to download certificate');
      } else {
        Alert.alert('Success', 'Certificate downloaded successfully!');
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'An unexpected error occurred while downloading the certificate');
    } finally {
      setDownloading(false);
    }
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Need help with your request?\n\nCall: 09123456789\nEmail: brgy_luna@surigao.gov.ph',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call Now', onPress: () => {} },
      ]
    );
  };

  const progress = getProgressForStatus(request.status);

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
            <Text style={styles.title}>Request Details</Text>
          </View>

          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusIconContainer, { backgroundColor: getStatusColor(request.status) }]}>
            <Ionicons
              name={getStatusIcon(request.status) as any}
              size={moderateScale(48)}
              color="white"
            />
          </View>
          <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
            {getStatusLabel(request.status)}
          </Text>
          <Text style={styles.referenceNumber}>REF-{request.id.slice(0, 8).toUpperCase()}</Text>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Request Progress</Text>
            <Text style={styles.progressPercentage}>{progress}%</Text>
          </View>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progress}%`,
                  backgroundColor: getStatusColor(request.status)
                }
              ]}
            />
          </View>
          <View style={styles.progressSteps}>
            <View style={styles.progressStep}>
              <View style={[styles.stepDot, progress >= 25 && styles.stepDotActive]} />
              <Text style={styles.stepLabel}>Submitted</Text>
            </View>
            <View style={styles.progressStep}>
              <View style={[styles.stepDot, progress >= 65 && styles.stepDotActive]} />
              <Text style={styles.stepLabel}>Processing</Text>
            </View>
            <View style={styles.progressStep}>
              <View style={[styles.stepDot, progress >= 100 && styles.stepDotActive]} />
              <Text style={styles.stepLabel}>Completed</Text>
            </View>
          </View>
        </View>

        {/* Request Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Request Information</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Ionicons name="ribbon-outline" size={moderateScale(20)} color={theme.colors.textSecondary} />
              <Text style={styles.detailLabel}>Certificate Type</Text>
            </View>
            <Text style={styles.detailValue}>{request.certificate_type}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Ionicons name="document-text-outline" size={moderateScale(20)} color={theme.colors.textSecondary} />
              <Text style={styles.detailLabel}>Purpose</Text>
            </View>
            <Text style={styles.detailValue}>{request.purpose}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Ionicons name="calendar-outline" size={moderateScale(20)} color={theme.colors.textSecondary} />
              <Text style={styles.detailLabel}>Date Submitted</Text>
            </View>
            <Text style={styles.detailValue}>
              {new Date(request.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailLeft}>
              <Ionicons name="cash-outline" size={moderateScale(20)} color={theme.colors.textSecondary} />
              <Text style={styles.detailLabel}>Fee Amount</Text>
            </View>
            <Text style={[styles.detailValue, styles.amountValue]}>₱{request.amount || 50}</Text>
          </View>

          {request.payment_status && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailRow}>
                <View style={styles.detailLeft}>
                  <Ionicons name="card-outline" size={moderateScale(20)} color={theme.colors.textSecondary} />
                  <Text style={styles.detailLabel}>Payment Status</Text>
                </View>
                <View style={[
                  styles.paymentBadge,
                  {
                    backgroundColor: request.payment_status === 'paid'
                      ? theme.colors.success + '15'
                      : theme.colors.warning + '15'
                  }
                ]}>
                  <Text style={[
                    styles.paymentBadgeText,
                    {
                      color: request.payment_status === 'paid'
                        ? theme.colors.success
                        : theme.colors.warning
                    }
                  ]}>
                    {request.payment_status === 'paid' ? 'Paid' : 'Pending'}
                  </Text>
                </View>
              </View>
            </>
          )}

          {request.notes && (
            <>
              <View style={styles.divider} />
              <View style={styles.detailColumn}>
                <View style={styles.detailLeft}>
                  <Ionicons name="chatbox-outline" size={moderateScale(20)} color={theme.colors.textSecondary} />
                  <Text style={styles.detailLabel}>Notes</Text>
                </View>
                <Text style={styles.notesText}>{request.notes}</Text>
              </View>
            </>
          )}
        </View>

        {/* Timeline Card */}
        <View style={styles.timelineCard}>
          <Text style={styles.sectionTitle}>Request Timeline</Text>

          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, styles.timelineDotActive]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>Request Submitted</Text>
              <Text style={styles.timelineDate}>
                {new Date(request.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>

          {request.status !== 'pending' && (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, styles.timelineDotActive]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Processing Started</Text>
                <Text style={styles.timelineDate}>
                  {new Date(request.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          )}

          {request.status === 'completed' && (
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, styles.timelineDotActive]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Request Completed</Text>
                <Text style={styles.timelineDate}>
                  {new Date(request.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        {request.status === 'completed' && !request.pdf_url && (
          <TouchableOpacity
            style={[styles.generateButton, generating && styles.generateButtonDisabled]}
            onPress={handleGenerateCertificate}
            disabled={generating}
            activeOpacity={0.7}
          >
            {generating ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons name="document-text-outline" size={moderateScale(20)} color="white" />
            )}
            <Text style={styles.generateButtonText}>
              {generating ? 'Generating Certificate...' : 'Generate Certificate'}
            </Text>
          </TouchableOpacity>
        )}

        {request.status === 'completed' && request.pdf_url && (
          <>
            {request.certificate_number && (
              <View style={styles.certNumberContainer}>
                <Text style={styles.certNumberLabel}>Certificate Number:</Text>
                <Text style={styles.certNumberValue}>{request.certificate_number}</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.downloadButton, downloading && styles.downloadButtonDisabled]}
              onPress={handleDownloadCertificate}
              disabled={downloading}
              activeOpacity={0.7}
            >
              {downloading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Ionicons name="download-outline" size={moderateScale(20)} color="white" />
              )}
              <Text style={styles.downloadButtonText}>
                {downloading ? 'Downloading...' : 'Download Certificate'}
              </Text>
            </TouchableOpacity>
          </>
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
            You will be notified when your certificate is ready for pickup or download.
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
  referenceNumber: {
    fontSize: fontSize.md,
    color: theme.colors.textSecondary,
    fontFamily: theme.fontFamily.medium,
  },
  progressCard: {
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
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressTitle: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.text,
  },
  progressPercentage: {
    fontSize: fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.primary,
  },
  progressBarBackground: {
    height: verticalScale(8),
    backgroundColor: theme.colors.border,
    borderRadius: moderateScale(4),
    marginBottom: spacing.lg,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: moderateScale(4),
  },
  progressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStep: {
    alignItems: 'center',
  },
  stepDot: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    backgroundColor: theme.colors.border,
    marginBottom: spacing.xs,
  },
  stepDotActive: {
    backgroundColor: theme.colors.primary,
  },
  stepLabel: {
    fontSize: fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
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
  detailColumn: {
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
  amountValue: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
  },
  paymentBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  paymentBadgeText: {
    fontSize: fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    fontFamily: theme.fontFamily.medium,
  },
  notesText: {
    fontSize: fontSize.sm,
    color: theme.colors.text,
    marginLeft: spacing.lg + spacing.sm,
    marginTop: spacing.xs,
    lineHeight: verticalScale(20),
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: spacing.sm,
  },
  timelineCard: {
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
  timelineItem: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  timelineDot: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    backgroundColor: theme.colors.border,
    marginRight: spacing.md,
    marginTop: spacing.xs,
  },
  timelineDotActive: {
    backgroundColor: theme.colors.primary,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  timelineDate: {
    fontSize: fontSize.sm,
    color: theme.colors.textSecondary,
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
  downloadButtonDisabled: {
    opacity: 0.6,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.success,
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
  generateButtonText: {
    color: 'white',
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    fontFamily: theme.fontFamily.semiBold,
    marginLeft: spacing.sm,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  certNumberContainer: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
    alignItems: 'center',
  },
  certNumberLabel: {
    fontSize: fontSize.sm,
    fontFamily: theme.fontFamily.regular,
    color: theme.colors.textSecondary,
    marginBottom: spacing.xs,
  },
  certNumberValue: {
    fontSize: fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    fontFamily: theme.fontFamily.bold,
    color: theme.colors.primary,
    letterSpacing: 1,
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
