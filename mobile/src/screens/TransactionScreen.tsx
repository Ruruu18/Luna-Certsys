// @ts-nocheck
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

interface TransactionScreenProps {
  navigation: any;
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
  const [selectedPeriod, setSelectedPeriod] = useState('All Time');

  const mockTransactions: Transaction[] = [
    {
      id: '1',
      referenceNumber: 'REF-2024-001',
      certificateType: 'Barangay Clearance',
      amount: 50,
      paymentMethod: 'GCash',
      status: 'Paid',
      date: '2024-01-15',
      receiptNumber: 'RCP-001-2024',
    },
    {
      id: '2',
      referenceNumber: 'REF-2024-002',
      certificateType: 'Certificate of Residency',
      amount: 100,
      paymentMethod: 'Cash',
      status: 'Paid',
      date: '2024-01-18',
      receiptNumber: 'RCP-002-2024',
    },
    {
      id: '3',
      referenceNumber: 'REF-2024-003',
      certificateType: 'Certificate of Indigency',
      amount: 50,
      paymentMethod: 'Bank Transfer',
      status: 'Pending',
      date: '2024-01-20',
    },
    {
      id: '4',
      referenceNumber: 'REF-2024-004',
      certificateType: 'Business Permit',
      amount: 200,
      paymentMethod: 'Credit Card',
      status: 'Failed',
      date: '2024-01-22',
    },
  ];

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
    return mockTransactions
      .filter(t => t.status === 'Paid')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getPendingAmount = () => {
    return mockTransactions
      .filter(t => t.status === 'Pending')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const handleDownloadReceipt = (transaction: Transaction) => {
    if (transaction.receiptNumber) {
      Alert.alert(
        'Download Receipt',
        `Receipt ${transaction.receiptNumber} will be downloaded.`,
        [{ text: 'OK' }]
      );
    }
  };

  const renderSummaryCard = (title: string, amount: number, icon: string, color: string) => (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.summaryContent}>
        <Text style={styles.summaryAmount}>₱{amount}</Text>
        <Text style={styles.summaryTitle}>{title}</Text>
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
              size={14} 
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
            size={16} 
            color={theme.colors.textSecondary} 
          />
          <Text style={styles.paymentMethodText}>{item.paymentMethod}</Text>
        </View>
        {item.receiptNumber && (
          <Text style={styles.receiptNumber}>Receipt: {item.receiptNumber}</Text>
        )}
      </View>

      <View style={styles.transactionActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="eye-outline" size={16} color={theme.colors.primary} />
          <Text style={styles.actionButtonText}>View Details</Text>
        </TouchableOpacity>
        {item.receiptNumber && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryActionButton]}
            onPress={() => handleDownloadReceipt(item)}
          >
            <Ionicons name="download-outline" size={16} color="white" />
            <Text style={[styles.actionButtonText, styles.primaryActionButtonText]}>
              Receipt
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={theme.colors.primary} />
      
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
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.title}>Transactions</Text>
          
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
              {mockTransactions.length} transaction{mockTransactions.length !== 1 ? 's' : ''}
            </Text>
          </View>

          <FlatList
            data={mockTransactions}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="card-outline" size={64} color={theme.colors.textTertiary} />
                <Text style={styles.emptyStateText}>No transactions found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Your payment history will appear here
                </Text>
              </View>
            }
          />
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
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: 'white',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  summarySection: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
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
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.xs,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  summaryContent: {
    flex: 1,
  },
  summaryAmount: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  summaryTitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.medium,
  },
  filterSection: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  periodButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  periodButton: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activePeriodButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  periodButtonText: {
    fontSize: theme.fontSize.sm,
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  listTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.text,
  },
  transactionCount: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  listContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  transactionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  referenceNumber: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  certificateType: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  transactionDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  amountSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  statusText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    marginLeft: theme.spacing.xs,
  },
  transactionDetails: {
    marginBottom: theme.spacing.lg,
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  paymentMethodText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },
  receiptNumber: {
    fontSize: theme.fontSize.sm,
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
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  primaryActionButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  actionButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.medium,
    marginLeft: theme.spacing.xs,
  },
  primaryActionButtonText: {
    color: 'white',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
    lineHeight: 20,
  },
});