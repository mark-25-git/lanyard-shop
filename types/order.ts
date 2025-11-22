export type OrderStatus = 
  | 'pending' 
  | 'payment_pending' 
  | 'payment_pending_verification'
  | 'paid' 
  | 'design_file_pending'
  | 'design_file_received'
  | 'in_production' 
  | 'order_shipped'
  | 'completed' 
  | 'cancelled';

export interface BillingAddress {
  name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string | null; // Foreign key to customers table (nullable for backward compatibility)
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  design_file_url: string | null;
  event_or_organization_name: string | null;
  status: OrderStatus;
  payment_method: string;
  payment_reference: string | null;
  payment_confirmed_at: string | null;
  // Billing address
  billing_name: string | null;
  billing_email: string | null;
  billing_phone: string | null;
  billing_address_line1: string | null;
  billing_address_line2: string | null;
  billing_city: string | null;
  billing_state: string | null;
  billing_postal_code: string | null;
  billing_country: string | null;
  // Shipping address
  shipping_name: string | null;
  shipping_phone: string | null;
  shipping_address_line1: string | null;
  shipping_address_line2: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
  created_at: string;
  updated_at: string;
}

export interface PricingTier {
  id: string;
  min_quantity: number;
  max_quantity: number | null;
  unit_price: number;
  is_active: boolean;
}

export interface PriceCalculation {
  quantity: number;
  unit_price: number;
  total_price: number;
  tier?: PricingTier;
}

