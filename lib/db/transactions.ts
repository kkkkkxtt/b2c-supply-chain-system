// /lib/db/transactions.ts

import { query } from '@/lib/db/client';
import { Order, OrderStatus } from '@/types/order';
import { Shipment } from '@/types/shipment';
import { User } from '@/types/user';
import { Item } from '@/types/item';
import { recordEventOnChain } from '@/lib/blockchain';
import { recordBlockchainProof } from '@/lib/db/blockchain-proofs';
import crypto from 'crypto'; // Node.js built-in cryptography module
import { Hex } from 'viem';

// Solidity Event Type Enum Index (from OrderTracker.sol)
const EVENT_ORDER_CREATED = 0;
const EVENT_DELIVERY_CONFIRMED = 2;

interface OrderCreationResult {
  order: Order;
  shipment: Shipment;
  txHash: Hex;
}

/**
 * Executes an atomic transaction to create an order, update balances/stock,
 * and log the initial state on the blockchain.
 */
export async function createOrderTransaction(
  buyer: User,
  item: Item,
  quantity: number = 1
): Promise<OrderCreationResult> {
  // ✅ normalize numeric values from DB (pg NUMERIC often returns string)
  const buyerBalance = Number(buyer.wallet_balance);
  const itemPrice = Number(item.price);
  const itemStock = Number(item.stock);
  const orderQuantity = Number(quantity) || 1;

  if (
    Number.isNaN(buyerBalance) ||
    Number.isNaN(itemPrice) ||
    Number.isNaN(itemStock)
  ) {
    throw new Error('Invalid numeric data (wallet_balance/price/stock).');
  }

  // Server-side validation
  if (orderQuantity <= 0) {
    throw new Error('Quantity must be at least 1.');
  }

  const totalAmount = itemPrice * orderQuantity;

  if (buyerBalance < totalAmount || itemStock < orderQuantity) {
    throw new Error(
      'Pre-transaction validation failed: Insufficient funds or stock.'
    );
  }

  const orderId = `ord_${Date.now()}`;
  const shipmentId = `shp_${Date.now()}`;
  const currentTimestamp = new Date().toISOString();

  const newOrder: Order = {
    order_id: orderId,
    buyer_id: buyer.id,
    buyer_wallet_address: buyer.wallet_address,
    item_id: item.id,
    quantity: orderQuantity,
    total_amount: totalAmount,
    order_status: OrderStatus.PENDING,
    order_timestamp: currentTimestamp,
    blockchain_tx_hash: undefined,
    payment_collected: false,
    created_at: currentTimestamp,
    updated_at: currentTimestamp,
  };

  // --- FETCH LOGISTICS PROVIDER ---
  // Select a random logistics provider to assign the shipment to
  const logisticsResult = await query(
    "SELECT id FROM users WHERE role = 'LOGISTICS' LIMIT 1"
  );

  if (logisticsResult.rows.length === 0) {
    throw new Error(
      'No Logistics Provider available. Please create an account with the role "Logistics Provider".'
    );
  }

  const logisticsId = logisticsResult.rows[0].id;

  const newShipment: Shipment = {
    shipment_id: shipmentId,
    order_id: orderId,
    logistics_id: logisticsId,
    current_status: 'Awaiting Seller Acceptance',
    last_update: currentTimestamp,
    estimated_arrival: 'Pending',
    created_at: currentTimestamp,
    updated_at: currentTimestamp,
  };

  // --- 1. GENERATE DATA HASH ---
  // Hash of the critical order data for blockchain proof of integrity
  const dataHashInput = JSON.stringify({
    id: orderId,
    amount: newOrder.total_amount,
    buyer: newOrder.buyer_id,
    buyerWallet: newOrder.buyer_wallet_address,
    item: newOrder.item_id,
    quantity: newOrder.quantity,
  });
  const dataHash = `0x${crypto
    .createHash('sha256')
    .update(dataHashInput)
    .digest('hex')}` as Hex;

  // --- 2. RECORD ON BLOCKCHAIN ---
  let txHash: Hex;
  try {
    // Pass buyer's wallet address to record transaction with user identity
    txHash = await recordEventOnChain(
      orderId,
      EVENT_ORDER_CREATED,
      dataHash,
      buyer.wallet_address
    );
    console.log(
      `[BC] Order recorded with TX: ${txHash} from buyer wallet: ${buyer.wallet_address}`
    );

    // --- 2B. STORE PROOF IN DATABASE ---
    await recordBlockchainProof(
      orderId,
      'ORDER',
      EVENT_ORDER_CREATED,
      dataHash,
      txHash,
      buyer.wallet_address,
      {
        buyer_id: buyer.id,
        item_id: item.id,
        amount: newOrder.total_amount,
        quantity: orderQuantity,
        seller_id: item.seller_id,
      }
    );
    console.log(`[DB] Proof recorded for order ${orderId}`);
  } catch (e) {
    console.error('Blockchain transaction failed during order creation:', e);
    throw new Error('Blockchain record failed. Aborting transaction.');
  }

  // --- 3. START DATABASE TRANSACTION (PostgreSQL) ---
  // NOTE: pg library does not support explicit transaction blocks (BEGIN/COMMIT)
  // with its simple query function. For robustness, this should be done
  // using a dedicated transaction client, but we use sequential queries for demo.

  try {
    // A. Deduct buyer balance (Transfer to 'Escrow' - not explicitly modeled here, just deduction)
    const deduct = await query(
      'UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2 AND wallet_balance >= $1',
      [totalAmount, buyer.id]
    );

    if (deduct.rowCount === 0) {
      throw new Error('Insufficient funds (DB check).');
    }

    // B. Deduct item stock
    await query('UPDATE items SET stock = stock - $1 WHERE id = $2', [
      orderQuantity,
      item.id,
    ]);

    // C. Insert new order, including the blockchain hash
    await query(
      'INSERT INTO orders (order_id, buyer_id, buyer_wallet_address, item_id, quantity, total_amount, order_status, blockchain_tx_hash, payment_collected, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())',
      [
        newOrder.order_id,
        newOrder.buyer_id,
        newOrder.buyer_wallet_address,
        newOrder.item_id,
        newOrder.quantity,
        newOrder.total_amount,
        newOrder.order_status,
        txHash,
        newOrder.payment_collected,
      ]
    );

    // D. Insert new shipment
    await query(
      'INSERT INTO shipments (shipment_id, order_id, logistics_id, current_status, last_update, estimated_arrival, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), $5, NOW(), NOW())',
      [
        newShipment.shipment_id,
        newShipment.order_id,
        newShipment.logistics_id,
        newShipment.current_status,
        newShipment.estimated_arrival,
      ]
    );

    return { order: newOrder, shipment: newShipment, txHash };
  } catch (e) {
    console.error('Database transaction failed:', e);
    // In a true atomic system, we would ROLLBACK the DB and potentially
    // log a 'TRANSACTION_FAILED' event on the blockchain.
    throw new Error('Order creation failed during atomic operation.');
  }
}
