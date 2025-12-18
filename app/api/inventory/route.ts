// /app/api/inventory/route.ts
<<<<<<< HEAD

import { NextRequest, NextResponse } from 'next/server';
// Import the new function
import {
  getItemsBySeller,
  createItem,
  updateItem,
  getAllItems,
} from '@/lib/db/items';
import { Item } from '@/types/item';
import { User } from '@/types/user';

// === GET (Read Inventory) ===
export async function GET(req: NextRequest) {
  const sellerId = req.nextUrl.searchParams.get('sellerId');

  let items: Item[];

  if (sellerId) {
    // Used by a SELLER for their inventory dashboard
    items = await getItemsBySeller(sellerId);
  } else {
    // Used by a BUYER (or public) for the general catalog
=======
import { NextRequest, NextResponse } from 'next/server';
import {
  getItemsBySeller,
  createItem,
  getAllItems,
  updateItemBySeller,
} from '@/lib/db/items';
import { Item } from '@/types/item';

type CurrentUser = { id: string; role: 'SELLER' | 'BUYER' | 'LOGISTICS' | 'ADMIN' };

// ✅ Replace this with your real auth (NextAuth/JWT/etc)
function getCurrentUser(req: NextRequest): CurrentUser | null {
  const id =
    req.headers.get('x-user-id') ??
    req.cookies.get('user_id')?.value ??
    null;

  const roleRaw =
    req.headers.get('x-user-role') ??
    req.cookies.get('user_role')?.value ??
    null;

  if (!id || !roleRaw) return null;

  const role = roleRaw.toUpperCase() as CurrentUser['role'];
  return { id, role };
}

// === GET ===
// Seller: only see own items
// Buyer/Public: see all items
export async function GET(req: NextRequest) {
  const user = getCurrentUser(req);

  let items: Item[];
  if (user?.role === 'SELLER') {
    items = await getItemsBySeller(user.id);
  } else {
>>>>>>> seller-buyer-improvement
    items = await getAllItems();
  }

  return NextResponse.json(items);
}

<<<<<<< HEAD
// === POST (Create New Item) ===
export async function POST(req: NextRequest) {
  const itemData = (await req.json()) as Omit<Item, 'id' | 'created_at'> & {
    seller_id: string;
  };

  // Generate necessary fields (in a real system, ID generation and seller check are crucial)
  const newItem: Item = {
    id: `i_${Date.now()}`,
    created_at: new Date().toISOString(),
    ...itemData,
    price: Number(itemData.price),
    stock: Number(itemData.stock),
=======
// === POST ===
// Only seller can create items, and seller_id is forced to current user
export async function POST(req: NextRequest) {
  const user = getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.role !== 'SELLER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await req.json()) as Omit<Item, 'id' | 'created_at' | 'seller_id'> & {
    price: number | string;
    stock: number | string;
  };

  const newItem: Item = {
    id: `i_${Date.now()}`,
    created_at: new Date().toISOString(),
    seller_id: user.id, // ✅ FORCE seller_id
    ...body,
    price: Number(body.price),
    stock: Number(body.stock),
>>>>>>> seller-buyer-improvement
  };

  const createdItem = await createItem(newItem);
  return NextResponse.json(createdItem, { status: 201 });
}

<<<<<<< HEAD
// === PUT (Update Existing Item) ===
export async function PUT(req: NextRequest) {
  const updatedItem = (await req.json()) as Item;

  // Basic validation
  if (!updatedItem.id) {
    return NextResponse.json(
      { error: 'Item ID is required for update' },
      { status: 400 }
    );
  }

  const result = await updateItem(updatedItem);
=======
// === PUT ===
// Only seller can update, and only their own item
export async function PUT(req: NextRequest) {
  const user = getCurrentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.role !== 'SELLER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const updatedItem = (await req.json()) as Item;
  if (!updatedItem.id) {
    return NextResponse.json({ error: 'Item ID is required for update' }, { status: 400 });
  }

  // ✅ Enforce ownership at DB level
  const result = await updateItemBySeller(updatedItem, user.id);
>>>>>>> seller-buyer-improvement
  return NextResponse.json(result);
}
