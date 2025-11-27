export interface Shipment {
  id: string;
  order_number: string;
  courier: string;
  courier_tracking_number: string;
  courier_tracking_url: string;
  shipped_at: string;
  created_at: string;
  updated_at: string;
}

export interface CourierWebsite {
  id: string;
  courier_name: string;
  tracking_url_template: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

