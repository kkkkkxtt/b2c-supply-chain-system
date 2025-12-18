// /components/Inventory.tsx
<<<<<<< HEAD

'use client'; // Must be a client component

import React, { useEffect, useState } from 'react';
// 1. UPDATED IMPORTS (Using absolute paths to /types)
=======
'use client';

import React, { useEffect, useState } from 'react';
>>>>>>> seller-buyer-improvement
import { Item } from '@/types/item';
import { User } from '@/types/user';
import { Plus, Loader2, Edit, Save, X } from 'lucide-react';

<<<<<<< HEAD
// 2. INTERFACE DEFINITION (From your original code)
=======
>>>>>>> seller-buyer-improvement
interface InventoryProps {
  user: User;
}

export const Inventory: React.FC<InventoryProps> = ({ user }) => {
<<<<<<< HEAD
  // 3. STATE DEFINITIONS (From your original code)
=======
>>>>>>> seller-buyer-improvement
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // For Create
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    desc: '',
    stock: '',
  });

  // For Edit
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemData, setEditItemData] = useState<Partial<Item>>({});

<<<<<<< HEAD
  // 4. REFRACTORED DATA FETCHING LOGIC (Using API Route)
  const fetchItems = async () => {
    setLoading(true);
    // Fetch data from the Next.js API Route
    const response = await fetch(`/api/inventory?sellerId=${user.id}`);
=======
  // ✅ helper: send identity to API (your route.ts reads these headers)
  const authHeaders = () => ({
    'x-user-id': String(user.id),
    'x-user-role': String((user as any).role ?? ''), // assumes user.role exists (SELLER/BUYER/...)
  });

  // ✅ GET: no sellerId param; server uses headers to decide seller vs buyer view
  const fetchItems = async () => {
    setLoading(true);

    const response = await fetch('/api/inventory', {
      headers: {
        ...authHeaders(),
      },
    });

>>>>>>> seller-buyer-improvement
    if (response.ok) {
      const data: Item[] = await response.json();
      setItems(data);
    } else {
<<<<<<< HEAD
      console.error('Failed to fetch inventory.');
      setItems([]);
    }
=======
      const text = await response.text();
      console.error('Failed to fetch inventory:', response.status, text);
      setItems([]);
    }

>>>>>>> seller-buyer-improvement
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
<<<<<<< HEAD
  }, [user.id]);

  // 5. REFRACTORED CREATE LOGIC (Using API Route)
=======
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  // ✅ POST: do NOT send seller_id; server forces it from headers
>>>>>>> seller-buyer-improvement
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
<<<<<<< HEAD
      seller_id: user.id,
      item_name: newItem.name,
      description: newItem.desc,
      price: Number(newItem.price), // Convert to number for payload
      stock: Number(newItem.stock), // Convert to number for payload
=======
      item_name: newItem.name,
      description: newItem.desc,
      price: Number(newItem.price),
      stock: Number(newItem.stock),
>>>>>>> seller-buyer-improvement
      image_url: `https://picsum.photos/400/300?random=${Date.now()}`,
    };

    const response = await fetch('/api/inventory', {
      method: 'POST',
<<<<<<< HEAD
      headers: { 'Content-Type': 'application/json' },
=======
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(), // ✅ REQUIRED
      },
>>>>>>> seller-buyer-improvement
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      setNewItem({ name: '', price: '', desc: '', stock: '' });
      setShowForm(false);
<<<<<<< HEAD
      fetchItems();
    } else {
      console.error('Failed to create item.');
=======
      await fetchItems();
      setLoading(false);
    } else {
      const text = await response.text(); // ✅ show real reason (401/403/500)
      console.error('Failed to create item:', response.status, text);
>>>>>>> seller-buyer-improvement
      setLoading(false);
    }
  };

<<<<<<< HEAD
  // 6. ORIGINAL HELPER FUNCTIONS
=======
>>>>>>> seller-buyer-improvement
  const startEdit = (item: Item) => {
    setEditingItemId(item.id);
    setEditItemData({ ...item });
  };

  const cancelEdit = () => {
    setEditingItemId(null);
    setEditItemData({});
  };

<<<<<<< HEAD
  // 7. REFRACTORED UPDATE LOGIC (Using API Route)
=======
  // ✅ PUT: send headers so API can enforce ownership
>>>>>>> seller-buyer-improvement
  const handleUpdateSubmit = async () => {
    if (!editingItemId || !editItemData) return;

    setLoading(true);
    const original = items.find((i) => i.id === editingItemId);
    if (!original) {
      setLoading(false);
      return;
    }

    const updated: Item = {
      ...original,
      ...editItemData,
      price: Number(editItemData.price),
      stock: Number(editItemData.stock),
      id: editingItemId,
    };

    const response = await fetch('/api/inventory', {
      method: 'PUT',
<<<<<<< HEAD
      headers: { 'Content-Type': 'application/json' },
=======
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(), // ✅ REQUIRED
      },
>>>>>>> seller-buyer-improvement
      body: JSON.stringify(updated),
    });

    if (response.ok) {
      setEditingItemId(null);
<<<<<<< HEAD
      fetchItems();
    } else {
      console.error('Failed to update item.');
=======
      await fetchItems();
      setLoading(false);
    } else {
      const text = await response.text();
      console.error('Failed to update item:', response.status, text);
>>>>>>> seller-buyer-improvement
      setLoading(false);
    }
  };

  if (loading && !items.length)
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    );

<<<<<<< HEAD
  // 8. ORIGINAL JSX RENDER BLOCK
=======
>>>>>>> seller-buyer-improvement
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">My Inventory</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
        >
          <Plus size={18} />
          <span>Add Item</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-fade-in">
          <h3 className="font-bold mb-4">Add New Product</h3>
          <form
            onSubmit={handleCreateSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <input
              required
              placeholder="Item Name"
              className="border p-2 rounded"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            />
            <input
              required
              placeholder="Price ($)"
              type="number"
              className="border p-2 rounded"
              value={newItem.price}
              onChange={(e) =>
                setNewItem({ ...newItem, price: e.target.value })
              }
            />
            <input
              required
              placeholder="Stock"
              type="number"
              className="border p-2 rounded"
              value={newItem.stock}
              onChange={(e) =>
                setNewItem({ ...newItem, stock: e.target.value })
              }
            />
            <textarea
              required
              placeholder="Description"
              className="border p-2 rounded md:col-span-2"
              value={newItem.desc}
              onChange={(e) => setNewItem({ ...newItem, desc: e.target.value })}
            />
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="bg-slate-900 text-white px-6 py-2 rounded hover:bg-slate-800"
              >
                Save Product
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="p-4">Product</th>
              <th className="p-4 w-32">Price</th>
              <th className="p-4 w-32">Stock</th>
              <th className="p-4">Created At</th>
              <th className="p-4 w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="p-4">
                  {editingItemId === item.id ? (
                    <div className="space-y-2">
                      <input
                        className="border p-1 rounded w-full"
<<<<<<< HEAD
                        value={editItemData.item_name}
=======
                        value={editItemData.item_name ?? ''}
>>>>>>> seller-buyer-improvement
                        onChange={(e) =>
                          setEditItemData({
                            ...editItemData,
                            item_name: e.target.value,
                          })
                        }
                      />
                      <textarea
                        className="border p-1 rounded w-full text-xs"
<<<<<<< HEAD
                        value={editItemData.description}
=======
                        value={editItemData.description ?? ''}
>>>>>>> seller-buyer-improvement
                        onChange={(e) =>
                          setEditItemData({
                            ...editItemData,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium text-slate-900">
                        {item.item_name}
                      </div>
                      <div className="text-slate-500 text-xs truncate max-w-xs">
                        {item.description}
                      </div>
                    </div>
                  )}
                </td>
<<<<<<< HEAD
=======

>>>>>>> seller-buyer-improvement
                <td className="p-4">
                  {editingItemId === item.id ? (
                    <input
                      type="number"
                      className="border p-1 rounded w-20"
<<<<<<< HEAD
                      value={editItemData.price}
=======
                      value={String(editItemData.price ?? '')}
>>>>>>> seller-buyer-improvement
                      onChange={(e) =>
                        setEditItemData({
                          ...editItemData,
                          price: Number(e.target.value),
                        })
                      }
                    />
                  ) : (
                    <span>${item.price}</span>
                  )}
                </td>
<<<<<<< HEAD
=======

>>>>>>> seller-buyer-improvement
                <td className="p-4">
                  {editingItemId === item.id ? (
                    <input
                      type="number"
                      className="border p-1 rounded w-20"
<<<<<<< HEAD
                      value={editItemData.stock}
=======
                      value={String(editItemData.stock ?? '')}
>>>>>>> seller-buyer-improvement
                      onChange={(e) =>
                        setEditItemData({
                          ...editItemData,
                          stock: Number(e.target.value),
                        })
                      }
                    />
                  ) : (
<<<<<<< HEAD
                    <span
                      className={
                        item.stock === 0 ? 'text-red-500 font-bold' : ''
                      }
                    >
=======
                    <span className={item.stock === 0 ? 'text-red-500 font-bold' : ''}>
>>>>>>> seller-buyer-improvement
                      {item.stock} units
                    </span>
                  )}
                </td>
<<<<<<< HEAD
                <td className="p-4 text-slate-500">
                  {new Date(item.created_at).toLocaleDateString()}
                </td>
=======

                <td className="p-4 text-slate-500">
                  {new Date(item.created_at).toLocaleDateString()}
                </td>

>>>>>>> seller-buyer-improvement
                <td className="p-4">
                  {editingItemId === item.id ? (
                    <div className="flex space-x-1">
                      <button
                        onClick={handleUpdateSubmit}
                        className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(item)}
                      className="p-2 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
<<<<<<< HEAD
=======

>>>>>>> seller-buyer-improvement
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  No items in inventory.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
