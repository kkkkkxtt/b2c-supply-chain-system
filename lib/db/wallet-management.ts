// /lib/db/wallet-management.ts (NEW FILE)

import { query } from '@/lib/db/client';
import { User } from '@/types/user';
import { QueryResult } from 'pg';

/**
 * Handles deposit or withdrawal transactions by updating the user's wallet_balance.
 * @param userId The ID of the user whose balance is being changed.
 * @param amount The amount of the transaction.
 * @param type 'deposit' or 'withdraw'.
 * @returns The updated User object, or null on failure.
 */
export async function updateWalletBalance(
  userId: string,
  amount: number,
  type: 'deposit' | 'withdraw'
): Promise<User | null> {
  const adjustment = type === 'deposit' ? amount : -amount;

  try {
    // Check current balance before withdrawal (prevents negative balance)
    if (type === 'withdraw') {
      const balanceCheck: QueryResult = await query(
        'SELECT wallet_balance FROM users WHERE id = $1',
        [userId]
      );
      if (balanceCheck.rows.length === 0) {
        throw new Error('User not found.');
      }
      const currentBalance = Number(balanceCheck.rows[0].wallet_balance);
      if (currentBalance + adjustment < 0) {
        throw new Error(
          `Insufficient funds for withdrawal. Current balance: $${currentBalance.toFixed(
            2
          )}`
        );
      }
    }

    // Update the balance using a single atomic SQL statement
    const text = `
        UPDATE users
        SET wallet_balance = wallet_balance + $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, role, name, email, wallet_address, wallet_balance, contact_number, address, created_at, updated_at
    `;
    const values = [adjustment, userId];

    const result: QueryResult = await query(text, values);

    if (result.rows.length === 0) return null;

    // Ensure wallet_balance is a number, not a string
    const user = result.rows[0] as User;
    return {
      ...user,
      wallet_balance: Number(user.wallet_balance),
    };
  } catch (error: any) {
    console.error('Database error during wallet transaction:', error.message);
    throw new Error(error.message || 'Wallet transaction failed.');
  }
}
