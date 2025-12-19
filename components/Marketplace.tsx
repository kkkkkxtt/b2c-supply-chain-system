// /components/Marketplace.tsx

'use client'; // Must be a client component

import React, { useEffect, useState } from 'react';
import { Item } from '@/types/item'; // UPDATED IMPORT
import { User } from '@/types/user'; // UPDATED IMPORT
// Import necessary types that were created in Step 1
// import { OrderStatus } from '@/types/order'; // (Not strictly needed here but good practice)
import { ShoppingBag, Loader2, Wallet, AlertCircle } from 'lucide-react';

interface MarketplaceProps {
  user: User;
  refreshUser: () => void;
}

export const Marketplace: React.FC<MarketplaceProps> = ({
  user,
  refreshUser,
}) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<{
    orderId: string;
    txHash: string;
    itemName: string;
    unitPrice: number;
    quantity: number;
    total: number;
  } | null>(null);

  useEffect(() => {
    loadItems();
  }, []);

  // REFACTORED: Load items from the inventory API endpoint
  const loadItems = async () => {
    setLoading(true);
    // Note: We use the inventory endpoint to fetch all items available for sale
    try {
      const response = await fetch(`/api/inventory`);
      if (response.ok) {
        const data: Item[] = await response.json();
        setItems(data);
      } else {
        console.error('Failed to load marketplace items.');
        setItems([]);
      }
    } catch (e) {
      console.error('Fetch error:', e);
      setItems([]);
    }
    setLoading(false);
  };

  const openPurchaseModal = (item: Item) => {
    setSelectedItem(item);
    setQuantity(1);
    setInvoiceData(null);
    setShowInvoice(false);
  };

  const closePurchaseModal = () => {
    setSelectedItem(null);
    setQuantity(1);
    setShowInvoice(false);
    setInvoiceData(null);
    setPurchasing(null);
  };

  // REFACTORED: Handle Buy uses the new order API route with quantity and shows invoice
  const handleBuy = async () => {
    if (!selectedItem) return;

    const item = selectedItem;

    if (quantity <= 0) {
      alert('Quantity must be at least 1.');
      return;
    }

    const totalCost = item.price * quantity;

    if (user.wallet_balance < totalCost) {
      alert('Insufficient wallet balance for the selected quantity!');
      return;
    }

    if (item.stock < quantity) {
      alert('Requested quantity exceeds available stock.');
      return;
    }

    if (user.wallet_balance < item.price) {
      alert('Insufficient wallet balance!');
      return;
    }

    setPurchasing(item.id);

    try {
      // Send necessary data to the server API route
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyer: user, item, quantity }),
      });

      const result = await response.json();

      if (response.ok) {
        // 4. Update UI state
        refreshUser(); // Updates the user's wallet balance display
        loadItems(); // Updates the item stock display

        // Show invoice instead of simple alert
        setInvoiceData({
          orderId: result.orderId,
          txHash: result.txHash,
          itemName: result.item?.item_name ?? item.item_name,
          unitPrice: item.price,
          quantity,
          total: item.price * quantity,
        });
        setShowInvoice(true);
      } else {
        // Handle server-side validation errors (e.g., stock ran out just before purchase)
        alert(`Transaction Failed: ${result.error}`);
      }
    } catch (e: any) {
      alert(`An unexpected error occurred: ${e.message}`);
    } finally {
      setPurchasing(null);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    );

  // ... (rest of the component JSX remains the same, using the refactored handleBuy)
  return (
    <div>
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          Available Products
        </h2>
        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
          <Wallet className="text-blue-600" size={20} />
          <div>
            <span className="text-xs text-slate-500 block uppercase">
              My Balance
            </span>
            <span className="font-bold text-slate-900">
              ${user.wallet_balance.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Purchase Quantity & Invoice Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 relative">
            <h3 className="text-xl font-bold text-slate-900 mb-4 text-center">
              Purchase `{selectedItem.item_name}`
            </h3>

            {!showInvoice && (
              <>
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Unit Price</span>
                    <span className="font-semibold text-slate-900">
                      ${selectedItem.price}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Available Stock</span>
                    <span className="font-semibold text-slate-900">
                      {selectedItem.stock}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={selectedItem.stock}
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(
                          Math.max(
                            1,
                            Math.min(
                              selectedItem.stock,
                              Number(e.target.value) || 1
                            )
                          )
                        )
                      }
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-slate-900">
                    <span>Total</span>
                    <span>${(selectedItem.price * quantity).toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={closePurchaseModal}
                    className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBuy}
                    disabled={!!purchasing}
                    className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    {purchasing === selectedItem.id ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <>
                        <ShoppingBag size={16} />
                        <span>Confirm Purchase</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {showInvoice && invoiceData && (
              <>
                <div className="border border-slate-200 rounded-lg p-4 text-sm mb-4 bg-slate-50">
                  <h4 className="font-semibold text-slate-900 mb-2">
                    Purchase Invoice
                  </h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Item</span>
                      <span className="font-medium">
                        {invoiceData.itemName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Quantity</span>
                      <span className="font-medium">
                        {invoiceData.quantity}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Unit Price</span>
                      <span className="font-medium">
                        ${invoiceData.unitPrice}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total</span>
                      <span className="font-semibold text-blue-600">
                        ${invoiceData.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="block text-slate-500 text-xs">
                        Order ID
                      </span>
                      <span className="text-[11px] font-mono">
                        {invoiceData.orderId}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="block text-slate-500 text-xs">
                        Blockchain TX
                      </span>
                      <span className="text-[11px] font-mono break-all text-blue-600">
                        {invoiceData.txHash}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={closePurchaseModal}
                    className="px-4 py-2 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => {
          const isOutOfStock = item.stock <= 0;
          const canAfford = user.wallet_balance >= item.price;

          return (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group"
            >
              <div className="h-32 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-slate-200 flex items-center justify-center relative">
                <div className="text-center">
                  <ShoppingBag
                    className="text-blue-400 mx-auto mb-2"
                    size={40}
                  />
                  <p className="text-xs font-medium text-slate-500">Product</p>
                </div>
                <div
                  className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold ${
                    isOutOfStock
                      ? 'bg-red-500 text-white'
                      : 'bg-white/90 text-slate-700'
                  }`}
                >
                  {isOutOfStock ? 'Out of Stock' : `Stock: ${item.stock}`}
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-slate-900">
                    {item.item_name}
                  </h3>
                  <span className="text-lg font-bold text-blue-600">
                    ${item.price}
                  </span>
                </div>
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                  {item.description}
                </p>

                {!canAfford && !isOutOfStock && (
                  <div className="flex items-center text-xs text-red-500 mb-2">
                    <AlertCircle size={12} className="mr-1" /> Insufficient
                    Funds
                  </div>
                )}

                <button
                  onClick={() => openPurchaseModal(item)}
                  disabled={!!purchasing || isOutOfStock || !canAfford}
                  className={`w-full font-medium py-2 rounded-lg transition-colors flex items-center justify-center space-x-2 
                    ${
                      isOutOfStock || !canAfford
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                >
                  {purchasing === item.id ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <ShoppingBag size={18} />
                      <span>{isOutOfStock ? 'Sold Out' : 'Purchase Now'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
