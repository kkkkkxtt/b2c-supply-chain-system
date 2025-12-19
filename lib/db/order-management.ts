// /lib/db/order-management.ts

import { query } from '@/lib/db/client';
import { Order, OrderStatus } from '@/types/order';
import { Shipment } from '@/types/shipment';
import { User, UserRole } from '@/types/user';
import { recordEventOnChain } from '@/lib/blockchain';
import { recordBlockchainProof } from '@/lib/db/blockchain-proofs';
import { Hex } from 'viem';
import crypto from 'crypto';

// Solidity Event Type Enum Index (from OrderTracker.sol)
const EVENT_STATUS_UPDATE = 1;
const EVENT_DELIVERY_CONFIRMED = 2;
const EVENT_PAYMENT_RELEASED = 3;

// --- 1. Fetching Logic (Simplified) ---

export async function getOrdersAndShipments(
  user: User
): Promise<{ orders: Order[]; shipments: Shipment[] }> {
  console.log(`[DB] Fetching orders for role: ${user.role}`);

  // Base SQL queries (simplified for demo based on mock data structure)
  let orderText =
    'SELECT o.*, i.item_name FROM orders o LEFT JOIN items i ON o.item_id = i.id ORDER BY o.order_timestamp DESC';
  const orderValues: string[] = [];

  if (user.role === UserRole.BUYER) {
    orderText =
      'SELECT o.*, i.item_name FROM orders o JOIN items i ON o.item_id = i.id WHERE o.buyer_id = $1 ORDER BY o.order_timestamp DESC';
    orderValues.push(user.id);
  }
  // Seller logic (assuming seller sees all orders for now, or you implement the JOIN later)

  try {
    const orderResult = await query(orderText, orderValues);
    // Fetch all shipments, as the client handles filtering by order ID
    const shipmentResult = await query(
      'SELECT * FROM shipments ORDER BY last_update DESC'
    );

    return {
      orders: orderResult.rows as Order[],
      shipments: shipmentResult.rows as Shipment[],
    };
  } catch (error) {
    console.error('Database fetch error:', error);
    return { orders: [], shipments: [] };
  }
}

// --- 2. Update Status Logic ---

export async function updateOrderStatusTransaction(
  orderId: string,
  newStatus: OrderStatus,
  userId: string // User performing the update
): Promise<Hex> {
  const eventType =
    newStatus === OrderStatus.DELIVERED
      ? EVENT_DELIVERY_CONFIRMED
      : EVENT_STATUS_UPDATE;

  // --- 1. GENERATE DATA HASH ---
  const dataHashInput = JSON.stringify({
    id: orderId,
    status: newStatus,
    updater: userId,
  });
  const dataHash = `0x${crypto
    .createHash('sha256')
    .update(dataHashInput)
    .digest('hex')}` as Hex;

  // --- 2. RECORD ON BLOCKCHAIN ---
  let txHash: Hex;
  try {
    // Fetch user wallet address for transaction identity
    const userResult = await query(
      'SELECT wallet_address FROM users WHERE id = $1',
      [userId]
    );
    const userWalletAddress = userResult.rows[0]?.wallet_address || undefined;

    txHash = await recordEventOnChain(
      orderId,
      eventType,
      dataHash,
      userWalletAddress
    );
    console.log(
      `[BC] Order status updated with TX: ${txHash} from user wallet: ${userWalletAddress}`
    );

    // Store proof in database for STATUS_UPDATE (including ACCEPTED) and DELIVERY_CONFIRMED
    await recordBlockchainProof(
      orderId,
      'ORDER',
      eventType,
      dataHash,
      txHash,
      userWalletAddress || '',
      {
        orderId,
        status: newStatus,
        updater: userId,
      }
    );
    console.log(`[DB] Order status proof recorded for ${orderId}, status: ${newStatus}`);
  } catch (e) {
    console.error('Blockchain record failed during status update:', e);
    throw new Error('Blockchain transaction failed. Status not updated.');
  }

  // --- 3. DATABASE UPDATE ---
  await query(
    'UPDATE orders SET order_status = $1, blockchain_tx_hash = $2 WHERE order_id = $3',
    [newStatus, txHash, orderId]
  );

  return txHash;
}

// --- 3. Collect Payment Logic ---

export async function collectPaymentTransaction(
  orderId: string,
  sellerId: string
): Promise<Hex> {
  // --- 1. CHECK STATUS ---
  const orderResult = await query(
    'SELECT total_amount, order_status, payment_collected FROM orders WHERE order_id = $1',
    [orderId]
  );
  const order = orderResult.rows[0];

  if (!order || order.payment_collected) {
    throw new Error('Payment already collected or order not found.');
  }
  if (
    order.order_status !== OrderStatus.DELIVERED &&
    order.order_status !== OrderStatus.CONFIRMED
  ) {
    throw new Error('Cannot collect payment: Order not delivered/confirmed.');
  }

  // --- 2. GENERATE DATA HASH ---
  const dataHashInput = JSON.stringify({
    id: orderId,
    amount: order.total_amount,
    seller: sellerId,
  });
  const dataHash = `0x${crypto
    .createHash('sha256')
    .update(dataHashInput)
    .digest('hex')}` as Hex;

  // --- 3. RECORD ON BLOCKCHAIN ---
  let txHash: Hex;
  try {
    // Fetch seller wallet address for transaction identity
    const sellerResult = await query(
      'SELECT wallet_address FROM users WHERE id = $1',
      [sellerId]
    );
    const sellerWalletAddress =
      sellerResult.rows[0]?.wallet_address || undefined;

    txHash = await recordEventOnChain(
      orderId,
      EVENT_PAYMENT_RELEASED,
      dataHash,
      sellerWalletAddress
    );
    console.log(
      `[BC] Payment released with TX: ${txHash} from seller wallet: ${sellerWalletAddress}`
    );

    // Store proof in database for PAYMENT_RELEASED
    await recordBlockchainProof(
      orderId,
      'ORDER',
      EVENT_PAYMENT_RELEASED,
      dataHash,
      txHash,
      sellerWalletAddress || '',
      {
        orderId,
        amount: order.total_amount,
        seller: sellerId,
      }
    );
    console.log(`[DB] Payment release proof recorded for ${orderId}`);
  } catch (e) {
    console.error('Blockchain record failed during payment release:', e);
    throw new Error('Blockchain transaction failed. Payment not released.');
  }

  // --- 4. DATABASE UPDATE (Atomic Fund Transfer & Status Update) ---
  try {
    // A. Transfer fund to Seller's wallet_balance
    await query(
      'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2',
      [order.total_amount, sellerId]
    );

    // B. Mark Order as payment_collected = TRUE
    await query(
      'UPDATE orders SET payment_collected = TRUE, blockchain_tx_hash = $1 WHERE order_id = $2',
      [txHash, orderId]
    );
  } catch (e) {
    console.error('Database fund transfer failed:', e);
    // If DB fails, you'd need a complex rollback/compensation mechanism (not included here)
    throw new Error('Database operation failed. Funds may be stuck.');
  }

  return txHash;
}
