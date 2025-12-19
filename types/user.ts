// /types/user.ts (MODIFIED)

export enum UserRole {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  LOGISTICS = 'LOGISTICS',
}

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  password_hash?: string; // bcrypt hash, never exposed to frontend
  password?: string; // temporary field for registration only
  wallet_address: string; // Ethereum address (0x + 40 hex chars) - from Hardhat
  wallet_balance: number; // Off-chain balance for payment purposes
  contact_number?: string;
  address?: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}
