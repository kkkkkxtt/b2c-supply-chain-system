// /app/api/inventory/route.ts
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
    items = await getAllItems();
  }

  return NextResponse.json(items);
}

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
  };

  const createdItem = await createItem(newItem);
  return NextResponse.json(createdItem, { status: 201 });
}

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
  return NextResponse.json(result);
}
