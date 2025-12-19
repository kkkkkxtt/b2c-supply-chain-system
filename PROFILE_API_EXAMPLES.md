# Profile & Wallet API Integration Examples

## Overview

This document provides practical code examples for integrating the new profile and wallet features.

---

## 1. Signup with Auto-Generated Wallet

### Frontend Code

```typescript
// components/SignupForm.tsx
const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();

  // Prepare signup data (NO wallet address!)
  const signupData = {
    name: formData.name,
    email: formData.email,
    password: formData.password,
    role: formData.role,
    address: formData.address,
    contact_number: formData.contact_number, // Optional
  };

  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signupData),
    });

    if (response.ok) {
      const newUser = await response.json();
      console.log('Signup successful!');
      console.log('Generated wallet:', newUser.wallet_address);

      // Auto-login after signup
      setCurrentUser(newUser);
      localStorage.setItem('session_user', JSON.stringify(newUser));

      // Redirect to profile
      router.push('/profile');
    } else {
      const error = await response.json();
      setError(error.error || 'Signup failed');
    }
  } catch (err) {
    setError('Network error during signup');
  }
};
```

### Backend Behavior

```typescript
// app/api/auth/signup/route.ts
export async function POST(req: NextRequest) {
  const userData = await req.json();

  // 1. Generate unique wallet
  const generatedWallet = Wallet.createRandom();

  // 2. Create user object with wallet
  const user = {
    ...userData,
    wallet_address: generatedWallet.address,
    id: generateUserId(),
    wallet_balance: 0,
  };

  // 3. Register in database
  const newUser = await registerUser(user);

  // 4. Return user with wallet
  return NextResponse.json(newUser, { status: 201 });
}
```

---

## 2. Fetch User Profile

### Frontend Code

```typescript
// pages/profile.tsx
useEffect(() => {
  const fetchProfile = async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/profile?userId=${userId}`);

      if (response.ok) {
        const profile = await response.json();
        setUserProfile(profile);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  fetchProfile();
}, [userId]);
```

### API Request Example

```bash
curl "http://localhost:3000/api/profile?userId=user_1703005400123_x1y2z3" \
  -H "Content-Type: application/json"
```

### API Response

```json
{
  "id": "user_1703005400123_x1y2z3",
  "role": "SELLER",
  "name": "John Doe",
  "email": "john@example.com",
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc0e7595f8f0Ae",
  "wallet_balance": 500.5,
  "contact_number": "+1-555-123-4567",
  "address": "123 Main St, New York, NY 10001",
  "created_at": "2025-12-19T10:30:00.000Z",
  "updated_at": "2025-12-19T15:45:00.000Z"
}
```

---

## 3. Update User Profile

### Frontend Code - Using UserProfile Component

```typescript
// app/page.tsx
{
  page === 'profile' && (
    <UserProfile
      user={currentUser}
      onProfileUpdate={async (updatedUser) => {
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            updates: updatedUser,
          }),
        });

        if (response.ok) {
          const updated = await response.json();
          setCurrentUser(updated);
          localStorage.setItem('session_user', JSON.stringify(updated));
        } else {
          throw new Error('Failed to update profile');
        }
      }}
      isLoading={loading}
    />
  );
}
```

### Frontend Code - Direct API Call

```typescript
// Manual profile update
const updateProfile = async (updates: Partial<User>) => {
  try {
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        updates: updates,
      }),
    });

    if (response.ok) {
      const updated = await response.json();

      // Update local state
      setCurrentUser(updated);

      // Persist to storage
      localStorage.setItem('session_user', JSON.stringify(updated));

      // Show success message
      alert('Profile updated successfully!');
    } else {
      const error = await response.json();
      alert(`Error: ${error.error}`);
    }
  } catch (err) {
    alert('Network error: ' + err.message);
  }
};

// Call update
updateProfile({
  name: 'Jane Smith',
  contact_number: '+1-555-987-6543',
  address: '456 Oak Ave, Los Angeles, CA 90001',
});
```

### API Request Example

```bash
curl -X PUT "http://localhost:3000/api/profile" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_1703005400123_x1y2z3",
    "updates": {
      "name": "Jane Smith",
      "contact_number": "+1-555-987-6543",
      "address": "456 Oak Ave, Los Angeles, CA 90001"
    }
  }'
```

### Successful Response (200 OK)

```json
{
  "id": "user_1703005400123_x1y2z3",
  "role": "SELLER",
  "name": "Jane Smith",
  "email": "john@example.com",
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc0e7595f8f0Ae",
  "wallet_balance": 500.5,
  "contact_number": "+1-555-987-6543",
  "address": "456 Oak Ave, Los Angeles, CA 90001",
  "created_at": "2025-12-19T10:30:00.000Z",
  "updated_at": "2025-12-19T16:00:00.000Z"
}
```

---

## 4. Copy Wallet Address

### Frontend Code

```typescript
// In UserProfile component
const handleCopyToClipboard = (text: string, fieldName: string) => {
  navigator.clipboard.writeText(text);
  setCopiedField(fieldName);

  // Show confirmation for 2 seconds
  setTimeout(() => setCopiedField(null), 2000);
};

// Usage
<button
  onClick={() => handleCopyToClipboard(user.wallet_address, 'wallet')}
  className="copy-button"
>
  {copiedField === 'wallet' ? '✓ Copied!' : '📋 Copy'}
</button>;
```

---

## 5. Protect Immutable Fields

### Frontend Code

```typescript
// Prevent user from editing immutable fields
const handleEditChange = (field: string, value: string) => {
  // Block immutable fields
  const immutableFields = ['wallet_address', 'role', 'id'];

  if (immutableFields.includes(field)) {
    console.warn(`Cannot edit ${field} - field is immutable`);
    return;
  }

  // Allow edit
  setEditForm(prev => ({
    ...prev,
    [field]: value,
  }));
};

// In UI - Render immutable fields as disabled
{isEditing ? (
  <>
    {/* Editable fields */}
    <input
      value={editForm.name}
      onChange={(e) => handleEditChange('name', e.target.value)}
    />

    {/* Immutable fields - disabled */}
    <input
      value={editForm.wallet_address}
      disabled
      style={{ opacity: 0.5, cursor: 'not-allowed' }}
    />
    <input
      value={editForm.role}
      disabled
      style={{ opacity: 0.5, cursor: 'not-allowed' }}
    />
  </>
) : (
  // View mode...
)}
```

### Backend Code - Reject Updates to Immutable Fields

```typescript
// app/api/profile/route.ts
export async function PUT(req: NextRequest) {
  const { userId, updates } = await req.json();

  // 1. Validate immutable fields
  const immutableFields = ['wallet_address', 'role', 'id'];

  for (const field of immutableFields) {
    if (field in updates) {
      return NextResponse.json(
        { error: `Cannot modify ${field}.` },
        { status: 403 }
      );
    }
  }

  // 2. Update allowed fields only
  const updatedUser = await updateUser({
    id: userId,
    ...updates,
  });

  return NextResponse.json(updatedUser);
}
```

---

## 6. Integration with Orders

### When Creating an Order

```typescript
// Create order with wallet addresses
const createOrder = async (itemId: string, quantity: number) => {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'createOrder',
      itemId: itemId,
      quantity: quantity,
      buyerId: currentUser.id,
      buyerWalletAddress: currentUser.wallet_address, // Auto-populated
      // Seller wallet comes from item metadata
    }),
  });

  if (response.ok) {
    const order = await response.json();
    console.log('Order created with blockchain TX:', order.txHash);
  }
};
```

### When Collecting Payment

```typescript
// Seller collects payment using wallet address
const collectPayment = async (orderId: string) => {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'collectPayment',
      orderId: orderId,
      userId: currentUser.id, // Seller ID
      sellerWalletAddress: currentUser.wallet_address, // Auto-used
    }),
  });

  if (response.ok) {
    const result = await response.json();
    console.log('Payment collected via blockchain:', result.txHash);
  }
};
```

---

## 7. Error Handling Examples

### Handle Immutable Field Update Attempt

```typescript
try {
  const response = await fetch('/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: currentUser.id,
      updates: {
        wallet_address: '0xNewAddress...', // Immutable!
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();

    if (response.status === 403) {
      console.error('Error:', error.error);
      // Output: "Cannot modify wallet_address."
      alert('Wallet address cannot be changed!');
    }
  }
} catch (err) {
  console.error('Network error:', err);
}
```

### Handle Profile Not Found

```typescript
try {
  const response = await fetch('/api/profile?userId=invalid_user');

  if (response.status === 404) {
    const error = await response.json();
    console.error('Error:', error.error);
    // Output: "User not found."
    alert('Profile not found!');
  }
} catch (err) {
  console.error('Network error:', err);
}
```

---

## 8. React Hook for Profile Management

```typescript
// hooks/useProfile.ts
import { useState, useCallback } from 'react';
import { User } from '@/types/user';

export function useProfile(userId: string) {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/profile?userId=${userId}`);

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to fetch profile');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Update profile
  const updateProfile = useCallback(
    async (updates: Partial<User>) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId,
            updates: updates,
          }),
        });

        if (response.ok) {
          const updated = await response.json();
          setProfile(updated);
          return updated;
        } else {
          const error = await response.json();
          setError(error.error || 'Failed to update profile');
          throw error;
        }
      } catch (err: any) {
        setError(err.message || 'Network error');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  // Copy wallet to clipboard
  const copyWalletAddress = useCallback(() => {
    if (profile?.wallet_address) {
      navigator.clipboard.writeText(profile.wallet_address);
      return true;
    }
    return false;
  }, [profile?.wallet_address]);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    copyWalletAddress,
  };
}

// Usage in component
function MyProfile() {
  const { profile, loading, updateProfile } = useProfile(currentUser.id);

  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <UserProfile user={profile!} onProfileUpdate={updateProfile} />
      )}
    </div>
  );
}
```

---

## 9. TypeScript Interfaces

```typescript
// types/user.ts
export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;

  // Wallet (Immutable)
  wallet_address: string; // 0x + 40 hex
  wallet_balance: number;

  // Profile (Editable)
  contact_number?: string;
  address?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// API Types
export interface ProfileResponse {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  wallet_address: string;
  wallet_balance: number;
  contact_number?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileRequest {
  userId: string;
  updates: Partial<Omit<User, 'wallet_address' | 'role' | 'id'>>;
}

export interface UpdateProfileResponse extends User {}
```

---

## 10. Testing Examples

### Jest/React Testing Library

```typescript
// __tests__/UserProfile.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProfile } from '@/components/UserProfile';

describe('UserProfile', () => {
  const mockUser = {
    id: 'test_user_123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'SELLER',
    wallet_address: '0x742d35Cc6634C0532925a3b844Bc0e7595f8f0Ae',
    wallet_balance: 500,
    contact_number: '+1-555-1234',
    address: '123 Test St',
    created_at: '2025-12-19T10:00:00Z',
    updated_at: '2025-12-19T15:00:00Z',
  };

  it('displays all user information', () => {
    render(<UserProfile user={mockUser} onProfileUpdate={jest.fn()} />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText(mockUser.wallet_address)).toBeInTheDocument();
  });

  it('copies wallet address to clipboard', () => {
    render(<UserProfile user={mockUser} onProfileUpdate={jest.fn()} />);

    const copyButton = screen.getByTitle('Copy wallet address');
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      mockUser.wallet_address
    );
  });

  it('prevents editing of immutable fields', () => {
    render(<UserProfile user={mockUser} onProfileUpdate={jest.fn()} />);

    fireEvent.click(screen.getByText('Edit Profile'));

    const walletInput = screen.queryByDisplayValue(mockUser.wallet_address);
    expect(walletInput).toBeDisabled();
  });

  it('calls onProfileUpdate when saving changes', async () => {
    const mockUpdate = jest.fn();
    render(<UserProfile user={mockUser} onProfileUpdate={mockUpdate} />);

    fireEvent.click(screen.getByText('Edit Profile'));
    fireEvent.change(screen.getByDisplayValue('Test User'), {
      target: { value: 'New Name' },
    });
    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalled();
    });
  });
});
```

---

## 11. Deployment Checklist

```markdown
## Pre-Deployment

- [ ] Code reviewed and approved
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Database migration tested
- [ ] Wallet generation working
- [ ] Profile component rendering correctly

## Deployment

- [ ] Merge to main branch
- [ ] Deploy backend API
- [ ] Deploy frontend
- [ ] Run database migration
- [ ] Verify wallet generation
- [ ] Test profile page
- [ ] Check API endpoints
- [ ] Verify immutable fields protected

## Post-Deployment

- [ ] Monitor error logs
- [ ] Test user signup flow
- [ ] Verify wallet uniqueness
- [ ] Monitor API performance
- [ ] Check database constraints
- [ ] User feedback collection
```

---

## 12. Troubleshooting Guide

| Problem                     | Solution                                        |
| --------------------------- | ----------------------------------------------- |
| Wallet not generated        | Check ethers.js import, verify Wallet class     |
| Profile not loading         | Check userId parameter, verify DB connection    |
| Cannot edit field           | Check if field is immutable, verify API         |
| Immutable field allows edit | Check backend validation, verify API response   |
| Copy button not working     | Check clipboard API support, verify browser     |
| API returns 403             | Check immutable field list, verify request body |

---

This document provides comprehensive examples for implementing and integrating the new profile and wallet features. For more detailed information, refer to the main documentation files.
