// /components/BlockchainHashViewer.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Loader2,
  Copy,
  CheckCircle2,
  Hash,
  User,
  Package,
  ShoppingCart,
  Truck,
  X,
} from 'lucide-react';
import { Pagination } from '@/components/Pagination';

interface BlockchainProof {
  id: string;
  entity_id: string;
  entity_type: string;
  event_type: number;
  data_hash: string;
  blockchain_tx_hash: string;
  sender_address: string;
  proof_timestamp: string;
  created_at: string;
  metadata?: Record<string, any>;
}

const EVENT_TYPE_MAP: Record<number, string> = {
  0: 'ORDER_CREATED',
  1: 'STATUS_UPDATE',
  2: 'DELIVERY_CONFIRMED',
  3: 'PAYMENT_RELEASED',
  4: 'ITEM_METADATA_HASHED',
  5: 'USER_IDENTITY_HASHED',
  7: 'ITEM_UPDATED',
  8: 'USER_PROFILE_UPDATED',
};

const ENTITY_TYPE_ICONS: Record<string, any> = {
  USER: <User size={16} className="text-blue-500" />,
  ITEM: <Package size={16} className="text-orange-500" />,
  ORDER: <ShoppingCart size={16} className="text-green-500" />,
  SHIPMENT: <Truck size={16} className="text-purple-500" />,
};

export const BlockchainHashViewer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [proofs, setProofs] = useState<BlockchainProof[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEventType, setSelectedEventType] = useState<number | null>(null);

  const PROOFS_PER_PAGE = 2;

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setCurrentPage(1);

    // If event type is selected, search by event type
    if (selectedEventType !== null) {
      setLoading(true);
      setSearched(true);
      try {
        console.log('[Viewer] Searching by event type:', selectedEventType);
        const response = await fetch(
          `/api/blockchain-proofs?eventType=${selectedEventType}&limit=200`
        );
        if (response.ok) {
          const data = await response.json();
          console.log('[Viewer] Event type search returned', data.length, 'results');
          setProofs(data);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Search failed');
          setProofs([]);
        }
      } catch (error) {
        console.error('[Viewer] Event type search failed:', error);
        setError(error instanceof Error ? error.message : 'Search failed');
        setProofs([]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Don't search if search term is empty
    if (!searchTerm.trim()) {
      setSearched(false);
      setProofs([]);
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      console.log('[Viewer] Searching for:', searchTerm);
      const response = await fetch(
        `/api/blockchain-proofs?search=${encodeURIComponent(searchTerm)}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log('[Viewer] Search returned', data.length, 'results');
        setProofs(data);
      } else {
        const errorData = await response.json();
        console.error('[Viewer] Search error:', errorData);
        setError(errorData.error || 'Search failed');
        setProofs([]);
      }
    } catch (error) {
      console.error('[Viewer] Search failed:', error);
      setError(error instanceof Error ? error.message : 'Search failed');
      setProofs([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedEventType]);

  // Check for txHash in sessionStorage on mount (from "View on Blockchain Hash Viewer" link)
  useEffect(() => {
    const storedTxHash = sessionStorage.getItem('searchTxHash');
    if (storedTxHash) {
      setSearchTerm(storedTxHash);
      sessionStorage.removeItem('searchTxHash'); // Clear after reading
      // Auto-search after a brief delay to ensure component is ready
      setTimeout(() => {
        handleSearch();
      }, 100);
    }
  }, [handleSearch]); // Include handleSearch in dependencies

  const clearResults = () => {
    setSearched(false);
    setProofs([]);
    setSearchTerm('');
    setSelectedEventType(null);
    setCurrentPage(1);
    setError(null);
  };

  const handleEventTypeFilter = (eventType: number | null) => {
    setSelectedEventType(eventType);
    setSearchTerm(''); // Clear search term when filtering by event type
    if (eventType !== null) {
      handleSearch();
    } else {
      clearResults();
    }
  };

  const handleCopyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(fieldId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const truncateHash = (hash: string, length: number = 12) => {
    if (hash.length <= length) return hash;
    return hash.substring(0, length) + '...' + hash.substring(hash.length - 6);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-8 border border-slate-700 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <Hash size={28} className="text-blue-400" />
          <h2 className="text-3xl font-bold">Blockchain Hash Viewer</h2>
        </div>
        <p className="text-slate-300">
          Search and verify blockchain transactions, hashes, and proof records.
          You can search by transaction hash, entity ID, wallet address, or data
          hash.
        </p>
      </div>

      {/* Event Type Filter Buttons */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          Filter by Event Type:
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleEventTypeFilter(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedEventType === null
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Events
          </button>
          {Object.entries(EVENT_TYPE_MAP).map(([type, name]) => (
            <button
              key={type}
              type="button"
              onClick={() => handleEventTypeFilter(parseInt(type))}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedEventType === parseInt(type)
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by TX hash, entity ID, wallet address, or data hash..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedEventType(null); // Clear event type filter when typing
              }}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <Search
              className="absolute right-3 top-3.5 text-slate-400"
              size={20}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search size={18} />
                <span>Search</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Results */}
      {error && (
        <div className="bg-red-50 rounded-xl p-4 border border-red-200 text-red-700 flex items-center justify-between">
          <p className="font-semibold">Error: {error}</p>
          <button
            onClick={clearResults}
            className="p-1 hover:bg-red-100 rounded transition-colors"
          >
            <X size={18} className="text-red-600" />
          </button>
        </div>
      )}

      {searched && !error && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">
              {loading
                ? 'Searching...'
                : `Found ${proofs.length} result${
                    proofs.length !== 1 ? 's' : ''
                  }`}
            </h3>
            <button
              onClick={clearResults}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 hover:text-slate-800"
              title="Close results"
            >
              <X size={20} />
            </button>
          </div>

          {proofs.length === 0 && !loading && (
            <div className="bg-slate-50 rounded-xl p-8 text-center text-slate-600 border border-slate-200">
              <p>No blockchain proofs found matching your search.</p>
              <p className="text-sm text-slate-500 mt-2">
                Try searching with a transaction hash, wallet address, or entity
                ID.
              </p>
            </div>
          )}

          {proofs.length > 0 &&
            (() => {
              const totalPages = Math.ceil(proofs.length / PROOFS_PER_PAGE);
              const startIndex = (currentPage - 1) * PROOFS_PER_PAGE;
              const endIndex = startIndex + PROOFS_PER_PAGE;
              const paginatedProofs = proofs.slice(startIndex, endIndex);

              return (
                <>
                  {paginatedProofs.map((proof) => (
                    <div
                      key={proof.id}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {ENTITY_TYPE_ICONS[proof.entity_type] || (
                            <Package size={16} />
                          )}
                          <div>
                            <p className="text-sm font-bold text-slate-700">
                              {EVENT_TYPE_MAP[proof.event_type] ||
                                `Event ${proof.event_type}`}
                            </p>
                            <p className="text-xs text-slate-500">
                              {proof.entity_type} •{' '}
                              {formatDate(proof.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full">
                          <CheckCircle2 size={14} className="text-green-600" />
                          <span className="text-xs font-mono font-bold text-blue-600">
                            Verified
                          </span>
                        </div>
                      </div>

                      <div className="p-6 space-y-4">
                        {/* Entity ID */}
                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                            Entity ID
                          </label>
                          <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <code className="flex-1 font-mono text-sm text-slate-800 break-all">
                              {proof.entity_id}
                            </code>
                            <button
                              onClick={() =>
                                handleCopyToClipboard(
                                  proof.entity_id,
                                  `entity-${proof.id}`
                                )
                              }
                              className="p-2 hover:bg-slate-200 rounded transition-colors"
                            >
                              {copiedId === `entity-${proof.id}` ? (
                                <CheckCircle2
                                  size={16}
                                  className="text-green-600"
                                />
                              ) : (
                                <Copy size={16} className="text-slate-600" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Transaction Hash */}
                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                            Blockchain Transaction Hash
                          </label>
                          <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <code className="flex-1 font-mono text-sm text-blue-600 break-all">
                              {proof.blockchain_tx_hash}
                            </code>
                            <button
                              onClick={() =>
                                handleCopyToClipboard(
                                  proof.blockchain_tx_hash,
                                  `tx-${proof.id}`
                                )
                              }
                              className="p-2 hover:bg-slate-200 rounded transition-colors"
                            >
                              {copiedId === `tx-${proof.id}` ? (
                                <CheckCircle2
                                  size={16}
                                  className="text-green-600"
                                />
                              ) : (
                                <Copy size={16} className="text-slate-600" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Data Hash */}
                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                            Data Hash (SHA-256)
                          </label>
                          <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <code className="flex-1 font-mono text-sm text-orange-600 break-all">
                              {proof.data_hash}
                            </code>
                            <button
                              onClick={() =>
                                handleCopyToClipboard(
                                  proof.data_hash,
                                  `hash-${proof.id}`
                                )
                              }
                              className="p-2 hover:bg-slate-200 rounded transition-colors"
                            >
                              {copiedId === `hash-${proof.id}` ? (
                                <CheckCircle2
                                  size={16}
                                  className="text-green-600"
                                />
                              ) : (
                                <Copy size={16} className="text-slate-600" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Sender Address */}
                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                            Wallet Address (Sender)
                          </label>
                          <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <code className="flex-1 font-mono text-sm text-purple-600 break-all">
                              {proof.sender_address}
                            </code>
                            <button
                              onClick={() =>
                                handleCopyToClipboard(
                                  proof.sender_address,
                                  `sender-${proof.id}`
                                )
                              }
                              className="p-2 hover:bg-slate-200 rounded transition-colors"
                            >
                              {copiedId === `sender-${proof.id}` ? (
                                <CheckCircle2
                                  size={16}
                                  className="text-green-600"
                                />
                              ) : (
                                <Copy size={16} className="text-slate-600" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Proof Timestamp */}
                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                            Proof Timestamp
                          </label>
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <p className="font-mono text-sm text-slate-700">
                              {formatDate(proof.proof_timestamp)}
                            </p>
                          </div>
                        </div>

                        {/* Metadata */}
                        {proof.metadata &&
                          Object.keys(proof.metadata).length > 0 && (
                            <div>
                              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                                Additional Metadata
                              </label>
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 overflow-x-auto">
                                <pre className="font-mono text-xs text-slate-700 whitespace-pre-wrap break-words">
                                  {JSON.stringify(proof.metadata, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  ))}

                  {totalPages > 1 && (
                    <div className="mt-6">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={PROOFS_PER_PAGE}
                        totalItems={proofs.length}
                      />
                    </div>
                  )}
                </>
              );
            })()}
        </div>
      )}
    </div>
  );
};
