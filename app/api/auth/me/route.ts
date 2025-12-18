import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from '@/lib/db/users';

export async function GET(req: NextRequest) {
  // 1) Read session cookies
  const id = req.cookies.get('user_id')?.value;

  // 2) If no cookie, user is not signed in
  if (!id) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  // 3) Fetch user profile from DB
  const user = await getUserById(id);

  // 4) Return user object (or null if not found)
  return NextResponse.json({ user: user ?? null }, { status: 200 });
}
