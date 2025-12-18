import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true });

  // 1) Clear cookies by setting maxAge=0
  res.cookies.set('user_id', '', { path: '/', maxAge: 0 });
  res.cookies.set('user_role', '', { path: '/', maxAge: 0 });

  return res;
}
