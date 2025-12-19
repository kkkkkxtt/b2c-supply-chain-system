// /types/shipment.ts
export interface Shipment {
  shipment_id: string; // Primary key
  order_id: string; // Foreign key to orders
  logistics_id: string; // Foreign key to users (logistics provider)
  current_status: string; // Current location/status
  last_update: string; // ISO timestamp of last update
  estimated_arrival?: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}
