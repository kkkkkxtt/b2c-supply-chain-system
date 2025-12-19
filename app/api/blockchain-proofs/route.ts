// /app/api/blockchain-proofs/route.ts

import { NextRequest, NextResponse } from 'next/server';
import {
  searchBlockchainProofs,
  getProofByTxHash,
  getProofsByEntity,
  getProofsBySender,
  getRecentProofs,
} from '@/lib/db/blockchain-proofs';

/**
 * GET /api/blockchain-proofs
 * Search blockchain proofs with various filters
 * Query params:
 * - search: Search term (searches tx_hash, entity_id, sender_address, data_hash)
 * - type: Get proofs of specific entity type (USER, ITEM, ORDER, SHIPMENT)
 * - sender: Get proofs from specific sender address
 * - txHash: Get specific proof by transaction hash
 * - entity: Get proofs for specific entity ID
 * - limit: Result limit (default: 50, max: 200)
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search');
    const txHash = searchParams.get('txHash');
    const entityId = searchParams.get('entity');
    const senderAddress = searchParams.get('sender');
    const limitParam = searchParams.get('limit') || '50';
    const limit = Math.min(parseInt(limitParam), 200);

    console.log('[API] Blockchain proofs search:', {
      search,
      txHash,
      entityId,
      senderAddress,
      limit,
    });

    let results = [];

    // If searching by specific tx hash
    if (txHash) {
      console.log('[API] Searching by TX hash:', txHash);
      const proof = await getProofByTxHash(txHash);
      results = proof ? [proof] : [];
    }
    // If searching by sender address
    else if (senderAddress) {
      console.log('[API] Searching by sender:', senderAddress);
      results = await getProofsBySender(senderAddress, limit);
    }
    // If searching by entity ID
    else if (entityId) {
      console.log('[API] Searching by entity:', entityId);
      results = await getProofsByEntity(entityId);
    }
    // If doing general search
    else if (search) {
      console.log('[API] General search:', search);
      results = await searchBlockchainProofs(search, limit);
    }
    // Default: get recent proofs
    else {
      console.log('[API] Getting recent proofs, limit:', limit);
      results = await getRecentProofs(limit);
    }

    console.log('[API] Returning', results.length, 'results');
    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    console.error('[API] Error searching blockchain proofs:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search blockchain proofs.' },
      { status: 500 }
    );
  }
}
