-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('certificate_status', 'payment', 'system', 'approval', 'rejection', 'reminder')),
  related_certificate_id UUID REFERENCES certificate_requests(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: System can insert notifications for any user
CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on row update
CREATE TRIGGER notifications_updated_at_trigger
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- Function to create notification when certificate status changes
CREATE OR REPLACE FUNCTION notify_certificate_status_change()
RETURNS TRIGGER AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  notification_type TEXT;
BEGIN
  -- Only create notification if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN

    -- Determine notification content based on new status
    CASE NEW.status
      WHEN 'in_progress' THEN
        notification_title := 'Certificate Request In Progress';
        notification_message := 'Your ' || NEW.certificate_type || ' request is now being processed.';
        notification_type := 'certificate_status';

      WHEN 'completed' THEN
        notification_title := 'Certificate Ready for Pickup';
        notification_message := 'Your ' || NEW.certificate_type || ' is ready for pickup at the Barangay Hall.';
        notification_type := 'approval';

      WHEN 'rejected' THEN
        notification_title := 'Certificate Request Rejected';
        notification_message := 'Your ' || NEW.certificate_type || ' request has been rejected. ' || COALESCE('Reason: ' || NEW.notes, 'Please contact the barangay office for more information.');
        notification_type := 'rejection';

      ELSE
        notification_title := 'Certificate Status Updated';
        notification_message := 'Your ' || NEW.certificate_type || ' request status has been updated to ' || NEW.status || '.';
        notification_type := 'certificate_status';
    END CASE;

    -- Insert notification
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      related_certificate_id,
      metadata
    ) VALUES (
      NEW.user_id,
      notification_title,
      notification_message,
      notification_type,
      NEW.id,
      jsonb_build_object(
        'certificate_type', NEW.certificate_type,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for certificate status changes
DROP TRIGGER IF EXISTS certificate_status_notification_trigger ON certificate_requests;
CREATE TRIGGER certificate_status_notification_trigger
  AFTER UPDATE ON certificate_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_certificate_status_change();

-- Function to create notification when payment is successful
CREATE OR REPLACE FUNCTION notify_payment_success()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if payment status changed to 'paid'
  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status
     AND NEW.payment_status = 'paid' THEN

    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      related_certificate_id,
      metadata
    ) VALUES (
      NEW.user_id,
      'Payment Confirmed',
      'Your payment of ₱' || NEW.payment_amount || ' for ' || NEW.certificate_type || ' has been confirmed.',
      'payment',
      NEW.id,
      jsonb_build_object(
        'payment_amount', NEW.payment_amount,
        'payment_method', NEW.payment_method,
        'payment_reference', NEW.payment_reference
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for payment confirmations
DROP TRIGGER IF EXISTS payment_confirmation_notification_trigger ON certificate_requests;
CREATE TRIGGER payment_confirmation_notification_trigger
  AFTER UPDATE ON certificate_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_payment_success();

-- Function to create welcome notification for new users
CREATE OR REPLACE FUNCTION notify_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only for non-admin users
  IF NEW.role != 'admin' THEN
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      metadata
    ) VALUES (
      NEW.id,
      'Welcome to Barangay Luna!',
      'Thank you for registering. You can now request certificates and track your submissions.',
      'system',
      jsonb_build_object(
        'registration_date', NEW.created_at
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new user welcome notifications
DROP TRIGGER IF EXISTS new_user_welcome_notification_trigger ON users;
CREATE TRIGGER new_user_welcome_notification_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_user();

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE notifications
  SET is_read = TRUE
  WHERE user_id = p_user_id AND is_read = FALSE;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete old read notifications (cleanup)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE is_read = TRUE
    AND created_at < NOW() - INTERVAL '90 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to cleanup old notifications (if pg_cron is available)
-- This is optional and depends on your Supabase plan
-- SELECT cron.schedule('cleanup-old-notifications', '0 2 * * 0', 'SELECT cleanup_old_notifications();');

COMMENT ON TABLE notifications IS 'Stores user notifications for certificate status changes, payments, and system messages';
COMMENT ON COLUMN notifications.type IS 'Type of notification: certificate_status, payment, system, approval, rejection, reminder';
COMMENT ON COLUMN notifications.metadata IS 'Additional data related to the notification in JSON format';
