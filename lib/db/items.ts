// /lib/db/items.ts
import { query } from '@/lib/db/client';
import { Item } from '@/types/item';
import { recordEventOnChain } from '@/lib/blockchain';
import { Hex } from 'viem';
import crypto from 'crypto';

const EVENT_ITEM_METADATA_HASHED = 4;

// normalize numeric fields coming from Postgres (NUMERIC often returns string)
function normalizeItem(row: any): Item {
  return {
    ...row,
    price: Number(row.price),
    stock: Number(row.stock),
  } as Item;
}

// Seller: only own items
export async function getItemsBySeller(sellerId: string): Promise<Item[]> {
  console.log(`[DB] Fetching items for seller: ${sellerId}`);
  try {
    const result = await query(
      'SELECT * FROM items WHERE seller_id = $1 ORDER BY created_at DESC',
      [sellerId]
    );
    return result.rows.map(normalizeItem);
  } catch (error) {
    console.error('Database query error (getItemsBySeller):', error);
    return [];
  }
}

// Buyer/Public: all items
export async function getAllItems(): Promise<Item[]> {
  console.log('[DB] Fetching ALL items for public view.');
  try {
    const result = await query(
      'SELECT * FROM items ORDER BY created_at DESC',
      []
    );
    return result.rows.map(normalizeItem);
  } catch (error) {
    console.error('Database query error (getAllItems):', error);
    return [];
  }
}

// Create item (seller_id should already be forced in route.ts)
export async function createItem(item: Item): Promise<Item> {
  console.log(`[DB] Creating new item: ${item.item_name}`);
  try {
    const sql = `
      INSERT INTO items (
        id, seller_id, seller_wallet_address, item_name, description, price, stock, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *;
    `;
    const params = [
      item.id,
      item.seller_id,
      item.seller_wallet_address,
      item.item_name,
      item.description,
      Number(item.price),
      Number(item.stock),
    ];

    const result = await query(sql, params);

    if (result.rows.length === 0) {
      throw new Error('Failed to create item, database returned no rows.');
    }

    const createdItem = normalizeItem(result.rows[0]);

    // On-chain proof (hash only)
    try {
      const itemPayload = {
        itemId: createdItem.id,
        sellerId: createdItem.seller_id,
        sellerWallet: createdItem.seller_wallet_address,
        name: createdItem.item_name,
        description: createdItem.description,
        price: createdItem.price,
        stock: createdItem.stock,
        createdAt: createdItem.created_at,
      };

      const hashHex = crypto
        .createHash('sha256')
        .update(JSON.stringify(itemPayload))
        .digest('hex');

      const dataHash = `0x${hashHex}` as Hex;

      await recordEventOnChain(
        String(createdItem.id),
        EVENT_ITEM_METADATA_HASHED,
        dataHash,
        createdItem.seller_wallet_address
      );
    } catch (e) {
      console.error('[BC] Failed to record ITEM_METADATA_HASHED:', e);
    }

    return createdItem;
  } catch (error) {
    console.error('Database query error (createItem):', error);
    throw error;
  }
}

// ✅ Seller can update only own item
export async function updateItemBySeller(
  item: Item,
  sellerId: string
): Promise<Item> {
  console.log(`[DB] Updating item: ${item.id} by seller ${sellerId}`);
  try {
    const sql = `
      UPDATE items
      SET
        item_name = $1,
        description = $2,
        price = $3,
        stock = $4,
        updated_at = NOW()
      WHERE
        id = $5 AND seller_id = $6
      RETURNING *;
    `;

    const params = [
      item.item_name,
      item.description,
      Number(item.price),
      Number(item.stock),
      item.id,
      sellerId,
    ];

    const result = await query(sql, params);

    if (result.rows.length === 0) {
      throw new Error('Not found or no permission to update this item.');
    }

    return normalizeItem(result.rows[0]);
  } catch (error) {
    console.error('Database query error (updateItemBySeller):', error);
    throw error;
  }
}

// (Optional) keep this only if ADMIN needs unrestricted update.
// Otherwise, you can delete it to avoid accidental misuse.
export async function updateItem(item: Item): Promise<Item> {
  console.log(`[DB] Updating item (unrestricted): ${item.id}`);
  try {
    const sql = `
      UPDATE items
      SET
        item_name = $1,
        description = $2,
        price = $3,
        stock = $4,
        updated_at = NOW()
      WHERE
        id = $5
      RETURNING *;
    `;
    const params = [
      item.item_name,
      item.description,
      Number(item.price),
      Number(item.stock),
      item.id,
    ];

    const result = await query(sql, params);

    if (result.rows.length === 0) {
      throw new Error('Failed to update item, item ID not found.');
    }
    return normalizeItem(result.rows[0]);
  } catch (error) {
    console.error('Database query error (updateItem):', error);
    throw error;
  }
}
