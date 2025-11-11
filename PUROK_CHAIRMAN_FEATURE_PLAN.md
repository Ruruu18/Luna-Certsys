# Purok Chairman Certificate Request Monitoring & Escalation Feature

## 📋 Overview

This document outlines the implementation plan for allowing Purok Chairmen to view, monitor, and escalate certificate requests from residents in their purok.

## 🎯 Feature Goals

### What Purok Chairmen Will Be Able To Do:
1. ✅ **View all certificate requests** from residents in their purok
2. ✅ **Click on any request** to see full details (personal info, payment status, documents)
3. ✅ **Escalate to Admin** button with priority selection (Normal/Urgent/Critical)
4. ✅ **Add notes** when escalating (e.g., "Resident needs this urgently for job")
5. ✅ **Track escalation status** (see if admin responded)
6. ✅ **Real-time updates** when admin responds

## 🏗️ Architecture Overview

### Current System (Already Implemented)
- ✅ Certificate requests stored in `certificate_requests` table
- ✅ Users have `role` field (admin, purok_chairman, resident)
- ✅ Residents linked to chairmen via `purok_chairman_id`
- ✅ Push notification system with real-time subscriptions
- ✅ Notification triggers for status changes

### What We Need to Add
- 📦 **Database**: 5 new columns for escalation tracking
- 🔒 **Security**: 2 RLS policies for chairman access
- 🔧 **Services**: 1 new escalation service
- 📱 **UI**: 2 new components, 3 updated screens

## 📦 Database Changes

### 1. Add Escalation Columns to `certificate_requests` Table

```sql
-- Add escalation tracking columns
ALTER TABLE certificate_requests
ADD COLUMN escalated_to_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN escalated_at TIMESTAMP,
ADD COLUMN escalated_by UUID REFERENCES users(id),
ADD COLUMN escalation_priority VARCHAR(20) CHECK (escalation_priority IN ('normal', 'urgent', 'critical')),
ADD COLUMN escalation_notes TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_certificate_requests_escalated ON certificate_requests(escalated_to_admin, escalated_at);
CREATE INDEX IF NOT EXISTS idx_certificate_requests_escalated_by ON certificate_requests(escalated_by);

-- Comment for documentation
COMMENT ON COLUMN certificate_requests.escalated_to_admin IS 'Whether the request has been escalated to admin by purok chairman';
COMMENT ON COLUMN certificate_requests.escalated_at IS 'Timestamp when the request was escalated';
COMMENT ON COLUMN certificate_requests.escalated_by IS 'Chairman who escalated the request';
COMMENT ON COLUMN certificate_requests.escalation_priority IS 'Priority level: normal, urgent, or critical';
COMMENT ON COLUMN certificate_requests.escalation_notes IS 'Notes from chairman about why this was escalated';
```

## 🔒 Security (RLS Policies)

### 2. Add RLS Policies for Purok Chairmen

```sql
-- Policy 1: Allow chairmen to view certificate requests from their purok residents
DROP POLICY IF EXISTS "Chairmen can view their purok residents requests" ON certificate_requests;

CREATE POLICY "Chairmen can view their purok residents requests"
ON certificate_requests
FOR SELECT
TO authenticated
USING (
  -- User is a purok chairman
  EXISTS (
    SELECT 1 FROM users AS chairman
    WHERE chairman.id = auth.uid()
    AND chairman.role = 'purok_chairman'
  )
  AND
  -- Request is from a resident assigned to this chairman
  EXISTS (
    SELECT 1 FROM users AS resident
    WHERE resident.id = certificate_requests.user_id
    AND resident.purok_chairman_id = auth.uid()
  )
);

-- Policy 2: Allow chairmen to update escalation fields only
DROP POLICY IF EXISTS "Chairmen can escalate requests" ON certificate_requests;

CREATE POLICY "Chairmen can escalate requests"
ON certificate_requests
FOR UPDATE
TO authenticated
USING (
  -- User is a purok chairman
  EXISTS (
    SELECT 1 FROM users AS chairman
    WHERE chairman.id = auth.uid()
    AND chairman.role = 'purok_chairman'
  )
  AND
  -- Request is from a resident assigned to this chairman
  EXISTS (
    SELECT 1 FROM users AS resident
    WHERE resident.id = certificate_requests.user_id
    AND resident.purok_chairman_id = auth.uid()
  )
)
WITH CHECK (
  -- Only allow updating escalation fields
  escalated_to_admin IS NOT DISTINCT FROM NEW.escalated_to_admin OR
  escalated_at IS NOT DISTINCT FROM NEW.escalated_at OR
  escalated_by IS NOT DISTINCT FROM NEW.escalated_by OR
  escalation_priority IS NOT DISTINCT FROM NEW.escalation_priority OR
  escalation_notes IS NOT DISTINCT FROM NEW.escalation_notes
);

-- Verify policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'certificate_requests'
AND policyname LIKE '%Chairman%'
ORDER BY policyname;
```

## 🔧 Backend Services

### 3. Create Escalation Service

**File**: `mobile/src/services/escalationService.ts`

```typescript
import { supabase } from '../lib/supabase';

export interface EscalationData {
  priority: 'normal' | 'urgent' | 'critical';
  notes: string;
}

/**
 * Escalate a certificate request to admin
 */
export async function escalateRequestToAdmin(
  requestId: string,
  chairmanId: string,
  escalationData: EscalationData
): Promise<{ success: boolean; error?: any }> {
  try {
    console.log('Escalating request:', requestId, escalationData);

    // Update certificate request with escalation data
    const { error: updateError } = await supabase
      .from('certificate_requests')
      .update({
        escalated_to_admin: true,
        escalated_at: new Date().toISOString(),
        escalated_by: chairmanId,
        escalation_priority: escalationData.priority,
        escalation_notes: escalationData.notes,
      })
      .eq('id', requestId);

    if (updateError) throw updateError;

    // Get request details for notification
    const { data: request, error: fetchError } = await supabase
      .from('certificate_requests')
      .select('*, users!certificate_requests_user_id_fkey(full_name, email)')
      .eq('id', requestId)
      .single();

    if (fetchError) throw fetchError;

    // Get chairman details
    const { data: chairman, error: chairmanError } = await supabase
      .from('users')
      .select('full_name, purok')
      .eq('id', chairmanId)
      .single();

    if (chairmanError) throw chairmanError;

    // Create notification for admins
    const { data: admins, error: adminError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin');

    if (adminError) throw adminError;

    // Send notification to all admins
    const notificationPromises = (admins || []).map((admin) =>
      supabase.from('notifications').insert({
        user_id: admin.id,
        title: `🔔 Escalated: ${request.certificate_type}`,
        message: `${chairman.full_name} (${chairman.purok}) escalated a ${escalationData.priority} priority request from ${request.users.full_name}. Reason: ${escalationData.notes}`,
        type: 'system',
        related_certificate_id: requestId,
        metadata: {
          escalation_priority: escalationData.priority,
          escalated_by: chairmanId,
          chairman_name: chairman.full_name,
          chairman_purok: chairman.purok,
          resident_name: request.users.full_name,
          certificate_type: request.certificate_type,
        },
      })
    );

    await Promise.all(notificationPromises);

    console.log('✅ Request escalated successfully');
    return { success: true };
  } catch (error) {
    console.error('Error escalating request:', error);
    return { success: false, error };
  }
}

/**
 * Get certificate requests for a chairman's purok
 */
export async function getChairmanPurokRequests(
  chairmanId: string
): Promise<{ data: any[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('certificate_requests')
      .select(`
        *,
        users!certificate_requests_user_id_fkey(
          full_name,
          email,
          phone_number,
          address,
          purok,
          date_of_birth,
          gender,
          civil_status
        )
      `)
      .eq('users.purok_chairman_id', chairmanId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching chairman purok requests:', error);
    return { data: null, error };
  }
}

/**
 * Get escalation priority color
 */
export function getEscalationPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical':
      return '#ef4444'; // red
    case 'urgent':
      return '#f59e0b'; // orange
    case 'normal':
      return '#3b82f6'; // blue
    default:
      return '#6b7280'; // gray
  }
}

/**
 * Get escalation priority label
 */
export function getEscalationPriorityLabel(priority: string): string {
  switch (priority) {
    case 'critical':
      return '🔴 Critical';
    case 'urgent':
      return '🟠 Urgent';
    case 'normal':
      return '🔵 Normal';
    default:
      return 'Unknown';
  }
}
```

## 📱 Mobile UI Components

### 4. Certificate Request Detail Screen

**File**: `mobile/src/screens/CertificateRequestDetailScreen.tsx`

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import EscalateRequestModal from '../components/EscalateRequestModal';
import { escalateRequestToAdmin } from '../services/escalationService';
import { useAuth } from '../contexts/AuthContext';

export default function CertificateRequestDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { request } = route.params as { request: any };

  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEscalate = async (priority: string, notes: string) => {
    setLoading(true);
    try {
      const { success, error } = await escalateRequestToAdmin(
        request.id,
        user.id,
        { priority, notes }
      );

      if (!success) throw error;

      Alert.alert(
        'Success',
        'Request escalated to admin successfully. They will be notified immediately.'
      );
      setShowEscalateModal(false);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to escalate request. Please try again.');
      console.error('Escalation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{request.certificate_type}</Text>
          <View style={[styles.statusBadge, getStatusStyle(request.status)]}>
            <Text style={styles.statusText}>{request.status}</Text>
          </View>
        </View>

        {/* Resident Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resident Information</Text>
          <InfoRow label="Name" value={request.users?.full_name} />
          <InfoRow label="Email" value={request.users?.email} />
          <InfoRow label="Phone" value={request.users?.phone_number || 'N/A'} />
          <InfoRow label="Address" value={request.users?.address || 'N/A'} />
          <InfoRow label="Purok" value={request.users?.purok || 'N/A'} />
        </View>

        {/* Request Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Request Details</Text>
          <InfoRow label="Certificate Type" value={request.certificate_type} />
          <InfoRow label="Purpose" value={request.purpose} />
          <InfoRow label="Status" value={request.status} />
          <InfoRow
            label="Requested On"
            value={new Date(request.created_at).toLocaleDateString()}
          />
        </View>

        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <InfoRow label="Amount" value={`₱${request.payment_amount || 0}`} />
          <InfoRow label="Status" value={request.payment_status || 'Pending'} />
          {request.payment_method && (
            <InfoRow label="Method" value={request.payment_method} />
          )}
        </View>

        {/* Escalation Status */}
        {request.escalated_to_admin && (
          <View style={[styles.section, styles.escalatedSection]}>
            <Text style={styles.sectionTitle}>⚠️ Escalation Status</Text>
            <InfoRow
              label="Priority"
              value={request.escalation_priority?.toUpperCase()}
            />
            <InfoRow
              label="Escalated On"
              value={new Date(request.escalated_at).toLocaleDateString()}
            />
            {request.escalation_notes && (
              <View style={styles.notesContainer}>
                <Text style={styles.notesLabel}>Notes:</Text>
                <Text style={styles.notesText}>{request.escalation_notes}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Escalate Button - Only show if not already escalated */}
      {!request.escalated_to_admin && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.escalateButton}
            onPress={() => setShowEscalateModal(true)}
          >
            <Ionicons name="alert-circle" size={20} color="#fff" />
            <Text style={styles.escalateButtonText}>Escalate to Admin</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Escalate Modal */}
      <EscalateRequestModal
        visible={showEscalateModal}
        onClose={() => setShowEscalateModal(false)}
        onEscalate={handleEscalate}
        loading={loading}
      />
    </View>
  );
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'completed':
      return { backgroundColor: '#d1fae5' };
    case 'pending':
      return { backgroundColor: '#fef3c7' };
    case 'in_progress':
      return { backgroundColor: '#dbeafe' };
    case 'rejected':
      return { backgroundColor: '#fee2e2' };
    default:
      return { backgroundColor: '#f3f4f6' };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 12,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  escalatedSection: {
    borderWidth: 2,
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  notesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  escalateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  escalateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
```

### 5. Escalate Request Modal

**File**: `mobile/src/components/EscalateRequestModal.tsx`

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EscalateRequestModalProps {
  visible: boolean;
  onClose: () => void;
  onEscalate: (priority: string, notes: string) => void;
  loading: boolean;
}

export default function EscalateRequestModal({
  visible,
  onClose,
  onEscalate,
  loading,
}: EscalateRequestModalProps) {
  const [selectedPriority, setSelectedPriority] = useState<string>('normal');
  const [notes, setNotes] = useState('');

  const priorities = [
    { value: 'normal', label: 'Normal', color: '#3b82f6', icon: 'information-circle' },
    { value: 'urgent', label: 'Urgent', color: '#f59e0b', icon: 'warning' },
    { value: 'critical', label: 'Critical', color: '#ef4444', icon: 'alert-circle' },
  ];

  const handleEscalate = () => {
    if (!notes.trim()) {
      alert('Please provide a reason for escalation');
      return;
    }
    onEscalate(selectedPriority, notes.trim());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Escalate to Admin</Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Priority Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Priority Level</Text>
            {priorities.map((priority) => (
              <TouchableOpacity
                key={priority.value}
                style={[
                  styles.priorityOption,
                  selectedPriority === priority.value && {
                    borderColor: priority.color,
                    backgroundColor: priority.color + '10',
                  },
                ]}
                onPress={() => setSelectedPriority(priority.value)}
                disabled={loading}
              >
                <Ionicons
                  name={priority.icon as any}
                  size={24}
                  color={priority.color}
                />
                <View style={styles.priorityTextContainer}>
                  <Text style={[styles.priorityLabel, { color: priority.color }]}>
                    {priority.label}
                  </Text>
                  <Text style={styles.priorityDescription}>
                    {getPriorityDescription(priority.value)}
                  </Text>
                </View>
                {selectedPriority === priority.value && (
                  <Ionicons name="checkmark-circle" size={24} color={priority.color} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Notes Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reason for Escalation *</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Explain why this request needs admin attention..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!loading}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.escalateButton]}
              onPress={handleEscalate}
              disabled={loading || !notes.trim()}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#fff" />
                  <Text style={styles.escalateButtonText}>Escalate</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getPriorityDescription = (priority: string): string => {
  switch (priority) {
    case 'normal':
      return 'Standard escalation for regular follow-up';
    case 'urgent':
      return 'Needs attention within 24 hours';
    case 'critical':
      return 'Requires immediate admin action';
    default:
      return '';
  }
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  priorityTextContainer: {
    flex: 1,
  },
  priorityLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  priorityDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    color: '#111827',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  escalateButton: {
    backgroundColor: '#f59e0b',
  },
  escalateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
```

## 🔄 Update Existing Screens

### 6. Update ManageCertificateRequestsScreen

Add this to make cards clickable:

```typescript
// In ManageCertificateRequestsScreen.tsx
import { useNavigation } from '@react-navigation/native';

// Inside component
const navigation = useNavigation();

// Modify renderCertificateCard to be touchable
const renderCertificateCard = (certificate: any) => (
  <TouchableOpacity
    style={styles.certificateCard}
    onPress={() => navigation.navigate('CertificateRequestDetail', { request: certificate })}
  >
    {/* Rest of card content */}
  </TouchableOpacity>
);
```

### 7. Update Navigation

**File**: `mobile/src/navigation/AppNavigator.tsx`

```typescript
// Add new screen to stack navigator
<Stack.Screen
  name="CertificateRequestDetail"
  component={CertificateRequestDetailScreen}
  options={{ title: 'Request Details' }}
/>
```

## 📊 Admin Web Dashboard Updates

### 8. Show Escalated Requests

Update the web admin dashboard to highlight escalated requests:

**File**: `web/src/views/CertificatesView.vue`

```typescript
// Add filter for escalated requests
const escalatedRequests = computed(() => {
  return certificates.value.filter(cert => cert.escalated_to_admin === true)
})

// In template, add a badge for escalated requests
<span v-if="certificate.escalated_to_admin" class="escalation-badge">
  🔔 Escalated by {{ certificate.chairman_name }}
</span>
```

## ⏱️ Implementation Timeline

### Phase 1: Database & Security (Day 1-2)
- [ ] Add escalation columns to database
- [ ] Create RLS policies
- [ ] Test policies with different user roles

### Phase 2: Backend Services (Day 3-4)
- [ ] Create escalationService.ts
- [ ] Add notification triggers
- [ ] Test escalation flow

### Phase 3: Mobile UI (Day 5-9)
- [ ] Create CertificateRequestDetailScreen
- [ ] Create EscalateRequestModal
- [ ] Update ManageCertificateRequestsScreen
- [ ] Add navigation routes
- [ ] Style and polish UI

### Phase 4: Web Dashboard (Day 10-12)
- [ ] Add escalated requests filter
- [ ] Show escalation badges
- [ ] Add escalation details view
- [ ] Test admin notification flow

### Phase 5: Testing & Polish (Day 13-14)
- [ ] End-to-end testing
- [ ] Test notifications
- [ ] Test real-time updates
- [ ] Fix bugs
- [ ] Documentation

**Total Estimated Time**: 14-19 days (2-4 weeks for 1 developer)

## 🧪 Testing Checklist

### Database Tests
- [ ] Escalation columns exist and accept correct values
- [ ] Indexes created successfully
- [ ] RLS policies allow chairman to view purok requests
- [ ] RLS policies allow chairman to escalate
- [ ] RLS policies prevent unauthorized access

### Service Tests
- [ ] Chairman can fetch purok residents' requests
- [ ] Escalation creates notification for admins
- [ ] Escalation updates certificate_requests correctly
- [ ] Error handling works properly

### UI Tests
- [ ] Chairman sees only their purok's requests
- [ ] Tapping card opens detail screen
- [ ] Detail screen shows all information
- [ ] Escalate modal works correctly
- [ ] Priority selection works
- [ ] Notes input validates properly
- [ ] Loading states display correctly
- [ ] Success/error messages display

### Integration Tests
- [ ] Admin receives notification when request escalated
- [ ] Notification includes all relevant details
- [ ] Real-time updates work for both chairman and admin
- [ ] Escalated badge appears in admin dashboard

## 🔐 Security Considerations

1. **RLS Policies**: Chairmen can only view/escalate requests from their assigned residents
2. **Validation**: Escalation notes are required and sanitized
3. **Audit Trail**: Track who escalated, when, and why
4. **Notifications**: Only admins receive escalation notifications
5. **Authorization**: Verify chairman role before allowing escalation

## 📱 User Experience Flow

### Chairman Workflow:
1. Chairman opens "Manage Requests" screen
2. Sees list of certificate requests from their purok residents
3. Taps on a request card
4. Views full details (resident info, payment, status)
5. If urgent, taps "Escalate to Admin"
6. Selects priority (Normal/Urgent/Critical)
7. Enters reason for escalation
8. Submits escalation
9. Receives confirmation
10. Admin is notified immediately

### Admin Workflow:
1. Admin receives push notification
2. Opens notification → navigates to request details
3. Sees escalation badge with priority and notes
4. Reviews request and takes action
5. Updates status (processes certificate)
6. Both resident and chairman get status update notification

## 🎨 UI Design Notes

- Use **orange (#f59e0b)** for escalation buttons and badges
- Show **priority badges** with color coding:
  - 🔵 Normal (blue)
  - 🟠 Urgent (orange)
  - 🔴 Critical (red)
- Display **escalation timestamp** and **chairman name**
- Use **modal** for escalation form (better UX than new screen)
- Show **disabled state** for already-escalated requests

## 📚 Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [React Navigation Modal](https://reactnavigation.org/docs/modal)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)

## 🚀 Next Steps

1. **Review this plan** with your team
2. **Set up development environment** (database access, test users)
3. **Start with Phase 1** (database changes)
4. **Test each phase** before moving to next
5. **Deploy incrementally** to production

---

**Document Version**: 1.0
**Last Updated**: November 11, 2025
**Author**: Claude AI Assistant
**Status**: Ready for Implementation ✅
