import { NextRequest, NextResponse } from 'next/server';
import { login } from '@/lib/db/users'; 
// ^ Your existing DB function: login(email, password) -> User | null

export async function POST(req: NextRequest) {
  // 1) Read credentials from client
  const { email, password } = await req.json();

  // 2) Validate user in DB (bcrypt compare happens inside /lib/db/users.ts login())
  const user = await login(email, password);

  // 3) If invalid, return 401 so frontend knows login failed
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // 4) If valid, return user and SET COOKIES (this is what persists session across reload)
  const res = NextResponse.json({ user });

  // Cookie stores user id (used by /api/auth/me and other protected routes)
  res.cookies.set('user_id', String(user.id), {
    path: '/',          // cookie is available to all pages
    sameSite: 'lax',    // safe default for same-site apps
    // httpOnly: true,  // enable if you do NOT need JS to read it (more secure)
  });

  // Cookie stores user role (SELLER/BUYER/etc) to enforce access control
  res.cookies.set('user_role', String(user.role), {
    path: '/',
    sameSite: 'lax',
    // httpOnly: true,
  });

  return res;
}
