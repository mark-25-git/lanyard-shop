export type EmailType = 
  | 'order_confirmation'
  | 'payment_confirmed'
  | 'order_shipped'
  | 'order_completed';

export type EmailStatus = 'pending' | 'sent';

export interface OrderEmail {
  id: string;
  order_id: string;
  order_number: string;
  email_type: EmailType;
  status: EmailStatus;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

