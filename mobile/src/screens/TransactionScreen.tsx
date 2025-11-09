import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import StatusBarWrapper from '../components/StatusBarWrapper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { dimensions, spacing, fontSize, borderRadius, scale, verticalScale, moderateScale } from '../utils/responsive';
import { downloadReceipt } from '../utils/receiptGenerator';

interface TransactionScreenProps {
  navigation: import('../types/navigation').AppNavigationProp;
}

interface Transaction {
  id: string;
  referenceNumber: string;
  certificateType: string;
  amount: number;
  paymentMethod: 'Cash' | 'GCash' | 'Bank Transfer' | 'Credit Card';
  status: 'Paid' | 'Pending' | 'Failed' | 'Refunded';
  date: string;
  receiptNumber?: string;
}

export default function TransactionScreen({ navigation }: TransactionScreenProps) {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('All Time');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('certificate_requests')
        .select('*')
        .eq('user_id', user.id)
        .not('payment_status', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
        throw error;
      }

      // Map database records to Transaction interface
      const mappedTransactions: Transaction[] = (data || []).map(item => ({
        id: item.id,
        referenceNumber: item.id.slice(0, 8).toUpperCase(),
        certificateType: item.certificate_type,
        amount: item.payment_amount || item.amount || 0,
        paymentMethod: (item.payment_method === 'gcash' ? 'GCash' :
                       item.payment_method === 'bank_transfer' ? 'Bank Transfer' :
                       item.payment_method === 'credit_card' ? 'Credit Card' : 'Cash') as 'Cash' | 'GCash' | 'Bank Transfer' | 'Credit Card',
        status: (item.payment_status === 'paid' ? 'Paid' :
                item.payment_status === 'failed' ? 'Failed' :
                item.payment_status === 'refunded' ? 'Refunded' : 'Pending') as 'Pending' | 'Paid' | 'Failed' | 'Refunded',
        date: new Date(item.payment_date || item.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        receiptNumber: item.payment_reference,
      }));

      setTransactions(mappedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      Alert.alert('Error', 'Failed to load transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const periodOptions = ['All Time', 'This Month', 'Last Month', 'Last 3 Months'];

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

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'Cash':
        return 'cash-outline';
      case 'GCash':
        return 'phone-portrait-outline';
      case 'Bank Transfer':
        return 'card-outline';
      case 'Credit Card':
        return 'card-outline';
      default:
        return 'wallet-outline';
    }
  };

  const getTotalAmount = () => {
    return transactions
      .filter(t => t.status === 'Paid')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getPendingAmount = () => {
    return transactions
      .filter(t => t.status === 'Pending')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const handleDownloadReceipt = async (transaction: Transaction) => {
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

  const renderSummaryCard = (title: string, amount: number, icon: string, color: string) => (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon as any} size={moderateScale(24)} color={color} />
      </View>
      <View style={styles.summaryContent}>
        <Text
          style={styles.summaryAmount}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          ₱{amount}
        </Text>
        <Text style={styles.summaryTitle}>
          {title}
        </Text>
      </View>
    </View>
  );

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionInfo}>
          <Text style={styles.referenceNumber}>{item.referenceNumber}</Text>
          <Text style={styles.certificateType}>{item.certificateType}</Text>
          <Text style={styles.transactionDate}>{item.date}</Text>
        </View>
        <View style={styles.amountSection}>
          <Text style={styles.amount}>₱{item.amount}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
            <Ionicons
              name={getStatusIcon(item.status) as any}
              size={moderateScale(14)}
              color={getStatusColor(item.status)}
            />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.transactionDetails}>
        <View style={styles.paymentMethodContainer}>
          <Ionicons
            name={getPaymentMethodIcon(item.paymentMethod) as any}
            size={moderateScale(16)}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.paymentMethodText}>{item.paymentMethod}</Text>
        </View>
        {item.receiptNumber && (
          <Text style={styles.receiptNumber}>Receipt: {item.receiptNumber}</Text>
        )}
      </View>

      <View style={styles.transactionActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('TransactionDetails', { transaction: item })}
        >
          <Ionicons name="eye-outline" size={moderateScale(16)} color={theme.colors.primary} />
          <Text style={styles.actionButtonText}>View Details</Text>
        </TouchableOpacity>
        {item.status === 'Pending' ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryActionButton]}
            onPress={() => navigation.navigate('Payment', {
              certificateRequestId: item.id,
              amount: item.amount,
              certificateType: item.certificateType,
            })}
          >
            <Ionicons name="card-outline" size={moderateScale(16)} color="white" />
            <Text style={[styles.actionButtonText, styles.primaryActionButtonText]}>
              Pay Now
            </Text>
          </TouchableOpacity>
        ) : item.status === 'Paid' && item.receiptNumber ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryActionButton]}
            onPress={() => handleDownloadReceipt(item)}
          >
            <Ionicons name="download-outline" size={moderateScale(16)} color="white" />
            <Text style={[styles.actionButtonText, styles.primaryActionButtonText]}>
              Receipt
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
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
            <Text style={styles.title}>Transactions</Text>
          </View>

          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <View style={styles.summaryContainer}>
            {renderSummaryCard('Total Paid', getTotalAmount(), 'checkmark-circle', theme.colors.success)}
            {renderSummaryCard('Pending', getPendingAmount(), 'time', theme.colors.warning)}
          </View>
        </View>

        {/* Period Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Period</Text>
          <View style={styles.periodButtons}>
            {periodOptions.map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.activePeriodButton
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text style={[
                  styles.periodButtonText,
                  selectedPeriod === period && styles.activePeriodButtonText
                ]}>
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Transaction List */}
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Transaction History</Text>
            <Text style={styles.transactionCount}>
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading transactions...</Text>
            </View>
          ) : (
            <FlatList
              data={transactions}
              renderItem={renderTransaction}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="card-outline" size={moderateScale(64)} color={theme.colors.textTertiary} />
                  <Text style={styles.emptyStateText}>No transactions found</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Your payment history will appear here
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </View>
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
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  headerRight: {
    width: moderateScale(40),
  },
  content: {
    flex: 1,
  },
  summarySection: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.xs,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(2),
    },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(4),
    elevation: 3,
    minHeight: verticalScale(90),
  },
  summaryIcon: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    flexShrink: 0,
  },
  summaryContent: {
    flex: 1,
    minWidth: 0,
  },
  summaryAmount: {
    fontSize: fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  summaryTitle: {
    fontSize: fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
    flexWrap: 'wrap',
  },
  filterSection: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterLabel: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  periodButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xs,
  },
  periodButton: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activePeriodButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  periodButtonText: {
    fontSize: fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  activePeriodButtonText: {
    color: 'white',
    fontWeight: theme.fontWeight.semibold,
  },
  listSection: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  listTitle: {
    fontSize: fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  transactionCount: {
    fontSize: fontSize.sm,
    color: theme.colors.textSecondary,
  },
  listContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  transactionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: verticalScale(2),
    },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(4),
    elevation: 3,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  referenceNumber: {
    fontSize: fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  certificateType: {
    fontSize: fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: spacing.xs,
  },
  transactionDate: {
    fontSize: fontSize.sm,
    color: theme.colors.textSecondary,
  },
  amountSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    marginLeft: spacing.xs,
  },
  transactionDetails: {
    marginBottom: spacing.lg,
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  paymentMethodText: {
    fontSize: fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: spacing.sm,
  },
  receiptNumber: {
    fontSize: fontSize.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  transactionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginLeft: spacing.sm,
  },
  primaryActionButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  actionButtonText: {
    fontSize: fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
    marginLeft: spacing.xs,
  },
  primaryActionButtonText: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 3,
  },
  loadingText: {
    fontSize: fontSize.md,
    color: theme.colors.textSecondary,
    marginTop: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: fontSize.md,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: verticalScale(20),
  },
});