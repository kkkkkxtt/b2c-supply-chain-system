// /types/order.ts
import { UserRole } from './user'; // Assuming defined elsewhere

export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  SHIPPED = 'SHIPPED',
  // IN_TRANSIT is not in DB enum, mapping logical flow to SHIPPED or separating if needed, but keeping simple for now
  DELIVERED = 'DELIVERED',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export interface Order {
  order_id: string; // Primary key
  buyer_id: string; // Foreign key to users
  buyer_wallet_address: string; // Cached buyer wallet for blockchain proof
  item_id: string; // Foreign key to items
  quantity: number;
  total_amount: number;
  order_status: OrderStatus; // Stored off-chain
  blockchain_tx_hash?: string; // Stored off-chain, linked to on-chain proof
  order_timestamp: string; // ISO timestamp
  payment_collected?: boolean; // Payment collection flag
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  // Optional denormalized field from JOIN with items for display purposes
  item_name?: string;
}
