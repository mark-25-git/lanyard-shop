export interface Customer {
  id: string;
  email: string;
  phone: string | null;
  name: string | null;
  // Default addresses (optional)
  default_billing_address_line1: string | null;
  default_billing_city: string | null;
  default_billing_state: string | null;
  default_billing_postal_code: string | null;
  default_billing_country: string | null;
  default_shipping_address_line1: string | null;
  default_shipping_city: string | null;
  default_shipping_state: string | null;
  default_shipping_postal_code: string | null;
  default_shipping_country: string | null;
  // Statistics
  total_orders: number;
  total_spent: number;
  first_order_at: string | null;
  last_order_at: string | null;
  created_at: string;
  updated_at: string;
}




