// /app/api/auth/signup/route.ts (New Registration Handler)

import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/db/users';
import { User, UserRole } from '@/types/user';
import { Wallet } from 'ethers';

// === POST (User Registration Handler) ===
// This handles the client request to /api/auth/signup
// Generates a unique Hardhat wallet address for each new account
export async function POST(req: NextRequest) {
  try {
    const userData = await req.json();

    // Basic validation
    if (!userData.email || !userData.password || !userData.name) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, name.' },
        { status: 400 }
      );
    }

    // 1. Generate a unique Hardhat wallet address
    // Using ethers.js Wallet to create a random private key and derive address
    const generatedWallet = Wallet.createRandom();
    const walletAddress = generatedWallet.address;

    console.log(
      `[Auth] Generated new wallet address for user ${userData.email}: ${walletAddress}`
    );

    // 2. Prepare user object with generated wallet address
    const user: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: userData.role || UserRole.BUYER,
      name: userData.name,
      email: userData.email,
      password: userData.password,
      wallet_address: walletAddress, // Server-generated
      wallet_balance: 0, // Initial balance
      contact_number: userData.contact_number || undefined,
      address: userData.address || undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 3. Register user (hashes password and inserts into DB)
    const newUser = await registerUser(user);

    // 4. Success - Return user with newly generated wallet
    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    console.error('API Error during registration:', error);
    // Handle database unique constraint errors gracefully
    if (error.message.includes('already exists')) {
      return NextResponse.json(
        { error: 'User with this email already exists.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Registration failed.' },
      { status: 500 }
    );
  }
}
