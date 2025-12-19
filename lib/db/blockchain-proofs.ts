// /lib/db/blockchain-proofs.ts

import { query } from '@/lib/db/client';
import { QueryResult } from 'pg';

export interface BlockchainProof {
  id: string;
  entity_id: string;
  entity_type: string; // 'USER', 'ITEM', 'ORDER', 'SHIPMENT'
  event_type: number;
  data_hash: string;
  blockchain_tx_hash: string;
  sender_address: string;
  proof_timestamp: string;
  created_at: string;
  metadata?: Record<string, any>; // Additional metadata stored as JSON
}

/**
 * Record a blockchain proof in the database
 */
export async function recordBlockchainProof(
  entityId: string,
  entityType: string,
  eventType: number,
  dataHash: string,
  txHash: string,
  senderAddress: string,
  metadata?: Record<string, any>
): Promise<BlockchainProof | null> {
  const sql = `
    INSERT INTO blockchain_proofs (
      id, entity_id, entity_type, event_type, data_hash, blockchain_tx_hash, sender_address, proof_timestamp, metadata, created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, NOW())
    RETURNING *;
  `;

  const proofId = `proof_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  const params = [
    proofId,
    entityId,
    entityType,
    eventType,
    dataHash,
    txHash,
    senderAddress,
    metadata ? JSON.stringify(metadata) : null,
  ];

  try {
    const result: QueryResult = await query(sql, params);
    return result.rows.length > 0 ? (result.rows[0] as BlockchainProof) : null;
  } catch (error) {
    console.error('Database error (recordBlockchainProof):', error);
    return null;
  }
}

/**
 * Search blockchain proofs by various criteria
 */
export async function searchBlockchainProofs(
  searchTerm: string,
  limit: number = 50
): Promise<BlockchainProof[]> {
  // Search across multiple fields: tx_hash, entity_id, sender_address, data_hash
  const sql = `
    SELECT * FROM blockchain_proofs
    WHERE 
      blockchain_tx_hash ILIKE $1 
      OR entity_id ILIKE $1 
      OR sender_address ILIKE $1 
      OR data_hash ILIKE $1
    ORDER BY created_at DESC
    LIMIT $2;
  `;

  const searchPattern = `%${searchTerm}%`;
  const params = [searchPattern, limit];

  try {
    console.log('[DB] Searching with pattern:', searchPattern);
    const result: QueryResult = await query(sql, params);
    console.log('[DB] Search returned', result.rows.length, 'rows');
    return result.rows.map((row) => ({
      ...row,
      metadata:
        row.metadata && typeof row.metadata === 'string'
          ? JSON.parse(row.metadata)
          : row.metadata,
    })) as BlockchainProof[];
  } catch (error) {
    console.error('[DB] Error in searchBlockchainProofs:', error);
    return [];
  }
}

/**
 * Get all proofs for a specific entity
 */
export async function getProofsByEntity(
  entityId: string,
  entityType?: string
): Promise<BlockchainProof[]> {
  let sql = 'SELECT * FROM blockchain_proofs WHERE entity_id = $1';
  const params: any[] = [entityId];

  if (entityType) {
    sql += ' AND entity_type = $2';
    params.push(entityType);
  }

  sql += ' ORDER BY created_at DESC;';

  try {
    const result: QueryResult = await query(sql, params);
    return result.rows.map((row) => ({
      ...row,
      metadata:
        row.metadata && typeof row.metadata === 'string'
          ? JSON.parse(row.metadata)
          : row.metadata,
    })) as BlockchainProof[];
  } catch (error) {
    console.error('[DB] Error in getProofsByEntity:', error);
    return [];
  }
}

/**
 * Get proof by transaction hash
 */
export async function getProofByTxHash(
  txHash: string
): Promise<BlockchainProof | null> {
  const sql =
    'SELECT * FROM blockchain_proofs WHERE blockchain_tx_hash = $1 LIMIT 1;';
  const params = [txHash];

  try {
    const result: QueryResult = await query(sql, params);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      ...row,
      metadata:
        row.metadata && typeof row.metadata === 'string'
          ? JSON.parse(row.metadata)
          : row.metadata,
    } as BlockchainProof;
  } catch (error) {
    console.error('[DB] Error in getProofByTxHash:', error);
    return null;
  }
}

/**
 * Get all proofs from a sender address
 */
export async function getProofsBySender(
  senderAddress: string,
  limit: number = 50
): Promise<BlockchainProof[]> {
  const sql = `
    SELECT * FROM blockchain_proofs
    WHERE sender_address = $1
    ORDER BY created_at DESC
    LIMIT $2;
  `;
  const params = [senderAddress, limit];

  try {
    const result: QueryResult = await query(sql, params);
    return result.rows.map((row) => ({
      ...row,
      metadata:
        row.metadata && typeof row.metadata === 'string'
          ? JSON.parse(row.metadata)
          : row.metadata,
    })) as BlockchainProof[];
  } catch (error) {
    console.error('[DB] Error in getProofsBySender:', error);
    return [];
  }
}

/**
 * Get all proofs for a specific event type
 */
export async function getProofsByEventType(
  eventType: number,
  limit: number = 50
): Promise<BlockchainProof[]> {
  const sql = `
    SELECT * FROM blockchain_proofs
    WHERE event_type = $1
    ORDER BY created_at DESC
    LIMIT $2;
  `;
  const params = [eventType, limit];

  try {
    const result: QueryResult = await query(sql, params);
    return result.rows.map((row) => ({
      ...row,
      metadata:
        row.metadata && typeof row.metadata === 'string'
          ? JSON.parse(row.metadata)
          : row.metadata,
    })) as BlockchainProof[];
  } catch (error) {
    console.error('[DB] Error in getProofsByEventType:', error);
    return [];
  }
}

/**
 * Get recent proofs
 */
export async function getRecentProofs(
  limit: number = 20
): Promise<BlockchainProof[]> {
  const sql = `
    SELECT * FROM blockchain_proofs
    ORDER BY created_at DESC
    LIMIT $1;
  `;
  const params = [limit];

  try {
    console.log('[DB] Fetching recent proofs, limit:', limit);
    const result: QueryResult = await query(sql, params);
    console.log('[DB] Recent proofs returned', result.rows.length, 'rows');
    const parsed = result.rows.map((row) => ({
      ...row,
      metadata:
        row.metadata && typeof row.metadata === 'string'
          ? JSON.parse(row.metadata)
          : row.metadata,
    })) as BlockchainProof[];
    console.log('[DB] Parsed proofs:', parsed.length);
    return parsed;
  } catch (error) {
    console.error('[DB] Error in getRecentProofs:', error);
    return [];
  }
}
