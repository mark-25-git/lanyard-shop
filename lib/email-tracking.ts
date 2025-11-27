import { createServerClient } from '@/lib/supabase';
import { EmailType, EmailStatus } from '@/types/order-email';

/**
 * Track email sent status in order_emails table
 * Creates or updates the email record with sent status
 */
export async function trackEmailSent(
  orderNumber: string,
  emailType: EmailType
): Promise<void> {
  try {
    const supabase = createServerClient();
    const now = new Date().toISOString();

    // Use upsert to create or update the email record
    const { error } = await supabase
      .from('order_emails')
      .upsert(
        {
          order_number: orderNumber,
          email_type: emailType,
          status: 'sent' as EmailStatus,
          sent_at: now,
          updated_at: now,
        },
        {
          onConflict: 'order_number,email_type', // Use the unique constraint
        }
      );

    if (error) {
      console.error(`Error tracking email ${emailType} for order ${orderNumber}:`, error);
      // Don't throw - email tracking is non-critical
    }
  } catch (error) {
    console.error(`Exception tracking email ${emailType} for order ${orderNumber}:`, error);
    // Don't throw - email tracking is non-critical
  }
}

/**
 * Get email status for an order
 */
export async function getOrderEmails(orderNumber: string): Promise<any[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('order_emails')
      .select('*')
      .eq('order_number', orderNumber)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching order emails:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception fetching order emails:', error);
    return [];
  }
}

