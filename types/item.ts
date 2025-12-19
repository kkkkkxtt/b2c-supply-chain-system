// /types/item.ts

export interface Item {
  id: string; // Primary key
  seller_id: string; // Foreign key to users
  seller_wallet_address: string; // Cached seller wallet for blockchain proof
  item_name: string;
  description: string;
  price: number;
  stock: number;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}
