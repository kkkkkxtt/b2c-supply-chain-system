// /lib/db/users.ts

import { query } from '@/lib/db/client'; // PostgreSQL client connection
import { User, UserRole } from '@/types/user';
import bcrypt from 'bcrypt';
import { QueryResult } from 'pg';
import { recordEventOnChain } from '@/lib/blockchain';
import { recordBlockchainProof } from '@/lib/db/blockchain-proofs';
import { Hex } from 'viem';
import crypto from 'crypto';

const EVENT_USER_IDENTITY_HASHED = 5;
const EVENT_USER_PROFILE_UPDATED = 8; // New event type for profile updates

const SALT_ROUNDS = 10;

// --- Helper function to select non-sensitive fields ---
const USER_FIELDS =
  'id, role, name, email, wallet_address, wallet_balance, contact_number, address, created_at, updated_at';

// --- Login Handler ---
export async function login(
  email: string,
  password: string
): Promise<User | null> {
  const text = `SELECT ${USER_FIELDS}, password_hash FROM users WHERE email = $1`;
  const values = [email];

  try {
    const result: QueryResult = await query(text, values);
    if (result.rows.length === 0) return null;

    const userRow = result.rows[0];
    const match = await bcrypt.compare(password, userRow.password_hash);

    if (!match) return null;

    const { password_hash, ...user } = userRow;
    return { ...user, wallet_balance: Number(user.wallet_balance) } as User;
  } catch (error) {
    console.error('Database query error (login):', error);
    return null;
  }
}

// --- Registration Handler ---
export async function registerUser(user: User): Promise<User> {
  const {
    id,
    role,
    name,
    email,
    password,
    wallet_address,
    address,
    contact_number,
  } = user;

  const existing = await query('SELECT email FROM users WHERE email = $1', [
    email,
  ]);
  if (existing.rows.length > 0)
    throw new Error('User with this email already exists.');

  // Check if wallet address is already used
  const existingWallet = await query(
    'SELECT wallet_address FROM users WHERE wallet_address = $1',
    [wallet_address]
  );
  if (existingWallet.rows.length > 0)
    throw new Error('Wallet address already registered.');

  const passwordHash = await bcrypt.hash(password!, SALT_ROUNDS);

  const text =
    'INSERT INTO users (id, role, name, email, password_hash, wallet_address, wallet_balance, contact_number, address, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) RETURNING *';
  const values = [
    id,
    role,
    name,
    email,
    passwordHash,
    wallet_address,
    0, // Initial wallet balance
    contact_number || null,
    address || null,
  ];

  try {
    const result: QueryResult = await query(text, values);
    const userRow = result.rows[0];
    const { password_hash, ...newUser } = userRow;
    // --- On-chain proof (hash only, no PII) ---
    try {
      const identityPayload = {
        userId: newUser.id,
        role: newUser.role,
        walletAddress: newUser.wallet_address,
      };

      const hashHex = crypto
        .createHash('sha256')
        .update(JSON.stringify(identityPayload))
        .digest('hex');

      const dataHash = `0x${hashHex}` as Hex;

      const txHash = await recordEventOnChain(
        newUser.id,
        EVENT_USER_IDENTITY_HASHED,
        dataHash,
        newUser.wallet_address
      );
      
      // Store proof in database
      await recordBlockchainProof(
        newUser.id,
        'USER',
        EVENT_USER_IDENTITY_HASHED,
        dataHash,
        txHash,
        newUser.wallet_address,
        {
          userId: newUser.id,
          role: newUser.role,
          walletAddress: newUser.wallet_address,
        }
      );
      console.log(`[DB] User identity proof recorded for ${newUser.id}`);
    } catch (e) {
      console.error('[BC] Failed to record USER_IDENTITY_HASHED:', e);
      // Option A (recommended): do NOT block registration if blockchain fails
      // Option B (strict): throw new Error('Blockchain transaction failed.');
    }
    return {
      ...newUser,
      wallet_balance: Number(newUser.wallet_balance),
    } as User;
  } catch (error) {
    console.error('Database insertion error (registerUser):', error);
    throw new Error('Registration failed due to a database error.');
  }
}

/**
 * Fully implemented function to update only non-sensitive profile fields.
 * This is used for the "Edit Profile" functionality.
 * Note: wallet_address and role cannot be modified after creation.
 */
export async function updateUser(user: Partial<User>): Promise<User | null> {
  if (!user.id) return null;

  const fields = [];
  const values = [];
  let index = 1;

  // 1. Check for Name update
  if (user.name !== undefined) {
    fields.push(`name = $${index++}`);
    values.push(user.name);
  }
  // 2. Check for Email update
  if (user.email !== undefined) {
    fields.push(`email = $${index++}`);
    values.push(user.email);
  }
  // 3. Check for Contact Number update
  if (user.contact_number !== undefined) {
    fields.push(`contact_number = $${index++}`);
    values.push(user.contact_number);
  }
  // 4. Check for Address update
  if (user.address !== undefined) {
    fields.push(`address = $${index++}`);
    values.push(user.address);
  }
  // NOTE: wallet_balance update is handled by the dedicated transaction logic.
  // NOTE: wallet_address and role are immutable after creation

  if (fields.length === 0) {
    // If nothing changed, just fetch the existing user
    const result = await query(
      `SELECT ${USER_FIELDS} FROM users WHERE id = $1`,
      [user.id]
    );
    if (result.rows.length === 0) return null;

    const fetchedUser = result.rows[0];
    return {
      ...fetchedUser,
      wallet_balance: Number(fetchedUser.wallet_balance),
    } as User;
  }

  const text = `UPDATE users SET ${fields.join(
    ', '
  )} WHERE id = $${index} RETURNING ${USER_FIELDS}`;
  values.push(user.id);

  try {
    const result: QueryResult = await query(text, values);
    if (result.rows.length === 0) return null;

    const updatedUser = result.rows[0];
    const finalUser = {
      ...updatedUser,
      wallet_balance: Number(updatedUser.wallet_balance),
    } as User;

    // Record profile update on blockchain
    if (!finalUser.wallet_address) {
      console.warn(`[DB] User ${finalUser.id} missing wallet_address, skipping blockchain proof`);
    } else {
      try {
        const profileUpdatePayload = {
          userId: finalUser.id,
          role: finalUser.role,
          walletAddress: finalUser.wallet_address,
          name: finalUser.name,
          email: finalUser.email,
          contactNumber: finalUser.contact_number,
          address: finalUser.address,
          updatedAt: finalUser.updated_at,
        };

        const hashHex = crypto
          .createHash('sha256')
          .update(JSON.stringify(profileUpdatePayload))
          .digest('hex');

        const dataHash = `0x${hashHex}` as Hex;

        console.log(`[BC] Recording USER_PROFILE_UPDATED event for user ${finalUser.id}, event type: ${EVENT_USER_PROFILE_UPDATED}`);
        
        const txHash = await recordEventOnChain(
          finalUser.id,
          EVENT_USER_PROFILE_UPDATED,
          dataHash,
          finalUser.wallet_address
        );

        console.log(`[BC] USER_PROFILE_UPDATED recorded on chain, TX: ${txHash}`);

        // Store proof in database
        const proof = await recordBlockchainProof(
          finalUser.id,
          'USER',
          EVENT_USER_PROFILE_UPDATED,
          dataHash,
          txHash,
          finalUser.wallet_address,
          {
            userId: finalUser.id,
            role: finalUser.role,
            walletAddress: finalUser.wallet_address,
            name: finalUser.name,
            email: finalUser.email,
            contactNumber: finalUser.contact_number,
            address: finalUser.address,
            updatedAt: finalUser.updated_at,
          }
        );
        
        if (proof) {
          console.log(`[DB] User profile update proof recorded for ${finalUser.id}, proof ID: ${proof.id}`);
        } else {
          console.error(`[DB] Failed to store proof in database for user ${finalUser.id}`);
        }
      } catch (e) {
        console.error('[BC] Failed to record USER_PROFILE_UPDATED:', e);
        if (e instanceof Error) {
          console.error('[BC] Error details:', e.message, e.stack);
        }
        // Don't block update if blockchain fails
      }
    }

    return finalUser;
  } catch (error) {
    console.error('Database query error (updateUser):', error);
    return null;
  }
}

// --- Existing functions (simplified SELECT) ---
export async function getUserByEmail(email: string): Promise<User | null> {
  const text = `SELECT ${USER_FIELDS} FROM users WHERE email = $1`;
  try {
    const result: QueryResult = await query(text, [email]);
    if (result.rows.length === 0) return null;

    const user = result.rows[0];
    return {
      ...user,
      wallet_balance: Number(user.wallet_balance),
    } as User;
  } catch (error) {
    console.error('Database query error (getUserByEmail):', error);
    return null;
  }
}

export async function getUserById(id: string): Promise<User | null> {
  const text = `SELECT ${USER_FIELDS} FROM users WHERE id = $1`;
  try {
    const result: QueryResult = await query(text, [id]);
    if (result.rows.length === 0) return null;

    const user = result.rows[0];
    return {
      ...user,
      wallet_balance: Number(user.wallet_balance),
    } as User;
  } catch (error) {
    console.error('Database query error (getUserById):', error);
    return null;
  }
}
