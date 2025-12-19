// /app/api/profile/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { updateUser, getUserById } from '@/lib/db/users';
import { User } from '@/types/user';

// === GET (Fetch Current User Profile) ===
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter.' },
        { status: 400 }
      );
    }

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error: any) {
    console.error('API Error during profile fetch:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch profile.' },
      { status: 500 }
    );
  }
}

// === PUT (Update User Profile) ===
// Allows updating: name, email, contact_number, address
// NOT allowed: role, wallet_address (immutable after creation)
export async function PUT(req: NextRequest) {
  try {
    const { userId, updates } = await req.json();

    if (!userId || !updates) {
      return NextResponse.json(
        { error: 'Missing user ID or update data.' },
        { status: 400 }
      );
    }

    // Prevent updating immutable fields
    if (updates.wallet_address || updates.role || updates.id) {
      return NextResponse.json(
        { error: 'Cannot modify wallet_address, role, or id.' },
        { status: 403 }
      );
    }

    const updatedUser = await updateUser({ id: userId, ...updates });

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Return the updated user object to refresh the frontend state
    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error('API Error saving profile:', error);
    return NextResponse.json(
      { error: 'Internal Server Error saving profile.' },
      { status: 500 }
    );
  }
}

// === POST (Alias for PUT) ===
export async function POST(req: NextRequest) {
  return PUT(req);
}
