# User Profile & Wallet Address Integration Guide

## Overview

This document describes the comprehensive user profile system and Hardhat wallet address integration implemented in the ChainLink Supply system.

---

## 1. Hardhat Wallet Address Generation

### What Changed

When users create a new account, the system now **automatically generates a unique Ethereum wallet address** using Hardhat/ethers.js. This address serves as:

- **Blockchain Identity**: Unique identifier on the blockchain
- **Transaction Sender**: Used as the sender address in all on-chain transactions
- **Immutable Account Link**: Cannot be changed after account creation

### Implementation Details

**File**: `/app/api/auth/signup/route.ts`

```typescript
// Generate unique wallet for each account
const generatedWallet = Wallet.createRandom();
const walletAddress = generatedWallet.address;
```

**Key Points**:

- Uses `ethers.js` Wallet class to generate random private key and derive public address
- Address format: `0x` + 40 hexadecimal characters (standard Ethereum format)
- Uniqueness enforced at database level with `UNIQUE` constraint
- No manual wallet input required from user during signup

### Signup Flow

```
User Registration Form (No wallet address input needed)
    ↓
POST /api/auth/signup
    ↓
Generate Random Wallet Address (Server-side)
    ↓
Register User with Generated Wallet
    ↓
Hash User Identity with Wallet Address
    ↓
Record on Blockchain (USER_IDENTITY_HASHED event)
    ↓
Return New User with Assigned Wallet Address
```

---

## 2. Comprehensive User Profile Component

### What's New

A new `UserProfile` component (`/components/UserProfile.tsx`) provides:

#### **View Mode Features**

- Display all user attributes with visual organization
- Color-coded sections for different field types:
  - **Name**: Blue badge
  - **Email**: Amber badge
  - **Role**: Purple badge (immutable)
  - **Wallet Address**: Green badge (immutable, with copy button)
  - **Contact Number**: Cyan badge
  - **Address**: Rose badge
  - **Timestamps**: Indigo/Teal badges
- Copy-to-clipboard functionality for wallet address
- Formatted timestamps showing creation and last update dates

#### **Edit Mode Features**

- Edit Fields:
  - ✅ Name
  - ✅ Email
  - ✅ Contact Number (new)
  - ✅ Address
- Read-Only Fields (Cannot Edit):

  - 🔒 Wallet Address (blockchain identity)
  - 🔒 Role (account classification)
  - 🔒 ID (unique identifier)

- UI Elements:
  - Save/Cancel buttons
  - Error messages for failed updates
  - Loading states
  - Form validation

### Component Props

```typescript
interface UserProfileProps {
  user: User; // Current user object
  onProfileUpdate: (updatedUser: User) => Promise<void>; // Update callback
  isLoading?: boolean; // Loading state
}
```

### Usage Example

```tsx
<UserProfile
  user={currentUser}
  onProfileUpdate={async (updatedUser) => {
    // Handle profile update
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        updates: updatedUser,
      }),
    });
    // Update UI state...
  }}
  isLoading={loading}
/>
```

---

## 3. Profile API Endpoint

### Route: `/api/profile`

#### **GET** - Fetch User Profile

```
GET /api/profile?userId=<user_id>
```

**Response** (200 OK):

```json
{
  "id": "user_1234567890_abc123",
  "role": "SELLER",
  "name": "John Doe",
  "email": "john@example.com",
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc0e7595f8f0Ae",
  "wallet_balance": 500.5,
  "contact_number": "+1-555-123-4567",
  "address": "123 Main St, New York, NY 10001",
  "created_at": "2025-12-19T10:30:00Z",
  "updated_at": "2025-12-19T15:45:00Z"
}
```

#### **PUT/POST** - Update User Profile

```
PUT /api/profile
Content-Type: application/json

{
  "userId": "user_1234567890_abc123",
  "updates": {
    "name": "Jane Doe",
    "contact_number": "+1-555-987-6543",
    "address": "456 Oak Ave, Los Angeles, CA 90001"
  }
}
```

**Protected Fields** (Cannot be updated):

- `wallet_address` - Blockchain identity (immutable)
- `role` - Account role (immutable)
- `id` - User identifier (immutable)

**Response** (200 OK): Returns updated user object

**Error** (403 Forbidden):

```json
{
  "error": "Cannot modify wallet_address, role, or id."
}
```

---

## 4. Updated User Type Definition

**File**: `/types/user.ts`

```typescript
export interface User {
  id: string;
  role: UserRole; // BUYER | SELLER | LOGISTICS
  name: string;
  email: string;
  password_hash?: string; // Server-only (never sent to frontend)
  password?: string; // Temporary (signup only)

  // NEW: Blockchain Integration
  wallet_address: string; // 0x + 40 hex chars (immutable)
  wallet_balance: number; // Off-chain balance

  // NEW: Extended Profile
  contact_number?: string; // Phone number
  address?: string; // Physical address

  // Timestamps
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}
```

---

## 5. Database Schema Updates

### Users Table

```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  role VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,

  -- Blockchain Integration
  wallet_address VARCHAR(42) UNIQUE NOT NULL,  -- 0x + 40 hex
  wallet_balance DECIMAL(15, 2) DEFAULT 0,

  -- Extended Profile
  contact_number VARCHAR(20),
  address TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Constraints

- `email`: UNIQUE (one email per user)
- `wallet_address`: UNIQUE (one wallet per user)
- `wallet_address`: NOT NULL (auto-generated)

---

## 6. Signup Form Changes

### Before (Old)

- User manually enters wallet address ❌
- No contact_number field
- Limited profile information

### After (New)

- **No wallet address input** ✅ (Server-generated)
- Contact number field (optional)
- Address field (required for Buyers/Sellers, optional for Logistics)
- Cleaner form with fewer fields

**Signup Form Fields**:

1. Full Name (required)
2. Email Address (required)
3. Password (required)
4. Role (required)
5. Address (conditional - required for Buyer/Seller)
6. Contact Number (optional) _[added]_

---

## 7. Wallet Identity Workflow

### Event Recording

When a new user registers:

```
generateWallet() → registerUser() → recordEventOnChain()
                                   ↓
                        EVENT_USER_IDENTITY_HASHED
                                   ↓
                        Hash includes:
                        - User ID
                        - Role
                        - Wallet Address
```

**On-Chain Storage**: Hashes only (no PII)

```solidity
event UserIdentityHashed(
  indexed string userId,
  bytes32 identityHash,
  address walletAddress,
  uint256 timestamp
);
```

---

## 8. Transaction Flow with Wallet Address

### Order Creation Flow

```
User (wallet: 0x742d35Cc...) Creates Order
    ↓
POST /api/orders
    ↓
Create Transaction Record:
- buyer_wallet_address: 0x742d35Cc...
- seller_wallet_address: [from item]
- Hash includes buyer wallet context
    ↓
Record on Blockchain (ORDER_CREATED event)
    ↓
Sender Address: User's wallet_address
```

### Payment Collection Flow

```
Seller (wallet: 0xAbc123...) Collects Payment
    ↓
POST /api/orders (collectPayment)
    ↓
Update Order:
- Payment processed by: seller_wallet_address
    ↓
Record on Blockchain (PAYMENT_RELEASED event)
    ↓
Sender Address: Seller's wallet_address
```

---

## 9. Frontend Integration

### Main App Component

**File**: `/app/page.tsx`

**Changes**:

1. Import `UserProfile` component
2. Add profile update handler
3. Remove old profile editing state
4. Integrate UserProfile into profile page view

```tsx
import { UserProfile } from '@/components/UserProfile';

// In page render:
{
  page === 'profile' && (
    <div className="grid grid-cols-1 gap-8">
      <UserProfile
        user={currentUser}
        onProfileUpdate={async (updatedUser) => {
          // Handle update...
        }}
        isLoading={loading}
      />
      {/* Wallet card still shown for Buyers/Sellers */}
    </div>
  );
}
```

### Navigation Options

Users can access profile from:

1. **Sidebar**: "Profile" link
2. **After Signup**: Auto-redirected to profile page
3. **During Session**: Click profile link anytime

---

## 10. Security Considerations

### Wallet Address Protection

| Action                | Allowed | Reason                            |
| --------------------- | ------- | --------------------------------- |
| View wallet address   | ✅ Yes  | User needs to know their identity |
| Copy wallet address   | ✅ Yes  | Copy button for convenience       |
| Edit wallet address   | ❌ No   | Blockchain identity (immutable)   |
| Delete wallet address | ❌ No   | Permanent account link            |

### Password Security

- Passwords hashed with bcrypt (SALT_ROUNDS=10)
- Never exposed to frontend (password_hash field excluded from User object)
- Cannot be viewed in profile

### Profile Updates

- Updates validated server-side
- Immutable fields protected in API
- User sessions refreshed after updates
- Changes logged in `updated_at` timestamp

---

## 11. Testing Checklist

### New User Registration

- [ ] User can sign up without entering wallet address
- [ ] Wallet address is auto-generated and unique
- [ ] Wallet address is 42 characters (0x + 40 hex)
- [ ] User identity hashed and recorded on blockchain
- [ ] User redirected to profile after signup
- [ ] Contact number and address saved correctly

### Profile Viewing

- [ ] All user attributes display correctly
- [ ] Wallet address shown with copy button
- [ ] Timestamps formatted properly
- [ ] Immutable fields clearly marked (read-only)
- [ ] Role displayed correctly

### Profile Editing

- [ ] Can edit: name, email, contact_number, address
- [ ] Cannot edit: wallet_address, role, id
- [ ] Save updates to database
- [ ] Error message if update fails
- [ ] UI refreshed with new values
- [ ] LocalStorage updated with new user data

### API Endpoints

- [ ] GET /api/profile?userId=... returns user data
- [ ] PUT /api/profile updates editable fields
- [ ] PUT /api/profile rejects immutable field updates (403 Forbidden)
- [ ] Wallet address uniqueness enforced at DB

### Transactions

- [ ] Orders created with buyer_wallet_address
- [ ] Shipments include wallet context
- [ ] Payments use seller_wallet_address
- [ ] Blockchain events include wallet addresses

---

## 12. Rollout Steps

### 1. Database Migration

```bash
# Create backup
pg_dump -U postgres supply_chain_test > backup.sql

# Run migration (if needed for existing users)
psql -U postgres -d supply_chain_test -f scripts/migrate_to_v2.sql
```

### 2. Code Deployment

1. Update signup route (generates wallet)
2. Deploy UserProfile component
3. Update page.tsx with new profile integration
4. Deploy API profile endpoint

### 3. Testing

- Test signup → wallet generation
- Test profile view/edit flows
- Test wallet address immutability
- Verify blockchain events

### 4. User Communication

- Document that wallet address is auto-generated
- Explain wallet address purpose (blockchain identity)
- Guide users on profile management

---

## 13. Future Enhancements

Potential improvements:

- [ ] Export wallet private key securely
- [ ] Multi-signature wallets
- [ ] Wallet recovery/restoration
- [ ] Transaction history
- [ ] Wallet import from external sources
- [ ] Hardware wallet support
- [ ] Two-factor authentication
- [ ] Profile picture upload

---

## 14. FAQ

**Q: Can I change my wallet address?**
A: No, wallet address is immutable after account creation. It serves as your blockchain identity.

**Q: What if I forget my wallet address?**
A: Your wallet address is always visible in your profile. You can also export it from the profile page.

**Q: Is my wallet address public?**
A: Yes, wallet addresses are public by nature of blockchain. Your wallet address is visible to anyone who views your orders/shipments.

**Q: Can someone else use my wallet address?**
A: No, wallet addresses are unique and database-enforced with a UNIQUE constraint.

**Q: Where is my private key stored?**
A: Private keys are NOT stored in the system. Each registration generates a new address. For production, consider using external wallet providers like MetaMask.

---

## 15. File Summary

### New Files Created

- `/components/UserProfile.tsx` - Comprehensive profile component
- `/app/api/profile/route.ts` - Profile API endpoints (updated)

### Modified Files

- `/app/api/auth/signup/route.ts` - Wallet generation in signup
- `/app/page.tsx` - UserProfile integration
- `/types/user.ts` - Wallet address fields (already existed)

### No Changes Needed

- Database schema (already supports wallet_address)
- Blockchain integration (already hashes wallet data)
- Order/transaction logic (already uses wallet addresses)

---

## 16. Support & Troubleshooting

### Issue: "Wallet address already registered"

**Cause**: Database constraint violation (duplicate wallet address)
**Solution**: This should not occur. Contact developers if it happens.

### Issue: "Cannot modify wallet_address"

**Cause**: Attempting to update immutable field via API
**Solution**: Wallet address cannot be changed. It's your blockchain identity.

### Issue: Profile not saving

**Cause**: Network error or server issue
**Solution**:

1. Check browser console for errors
2. Verify API endpoint responding
3. Check database connection

### Issue: Wallet address not showing in profile

**Cause**: User data not loaded or API error
**Solution**:

1. Refresh page
2. Clear browser cache
3. Re-login

---

**Documentation Version**: 1.0  
**Last Updated**: December 19, 2025  
**Maintained By**: Development Team
