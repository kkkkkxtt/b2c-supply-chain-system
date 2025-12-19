## 🚀 Quick Start Guide - Wallet Address Integration

### ⚡ 5-Minute Setup

#### Step 1: Create Test Database

```bash
cd scripts
psql -U postgres -f setup_db_test.sql
```

#### Step 2: Update Environment

```bash
# .env.local
DATABASE_URL=postgresql://spc_user:123456@localhost:5432/supply_chain_test
NEXT_PUBLIC_BLOCKCHAIN_NETWORK=hardhat
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

#### Step 3: Start Hardhat (Terminal 1)

```bash
npx hardhat node
```

#### Step 4: Deploy Contract (Terminal 2)

```bash
npx hardhat run scripts/deploy.ts --network localhost
# Copy CONTRACT_ADDRESS to .env
```

#### Step 5: Start App (Terminal 3)

```bash
npm run dev
```

---

### 📝 How to Register with Wallet Address

#### Frontend Flow

1. User navigates to `/auth/signup`
2. Fill form with:

   - Name: "John Buyer"
   - Email: "john@example.com"
   - Password: "SecurePass123"
   - Role: "BUYER"
   - **Wallet Address: "0x1234567890123456789012345678901234567890"** ← FROM HARDHAT
   - Contact: "+1-555-1234"
   - Address: "123 Main St"

3. Submit form

#### What Happens Behind Scenes

```
✓ Email uniqueness check
✓ Wallet address uniqueness check
✓ Password hashed with bcrypt (SALT=10)
✓ User inserted into database with:
  - id: generated UUID
  - wallet_address: 0x1234...
  - wallet_balance: 0.00
  - created_at: NOW()
  - updated_at: NOW()
✓ On-chain event: USER_IDENTITY_HASHED
  - Hash includes: userId, role, walletAddress
✓ Return user object (no password_hash exposed)
```

---

### 🛍️ How to Create & Order Item

#### Seller Creates Item

```
POST /api/inventory
{
  "item_name": "Wireless Headphones",
  "description": "High-quality...",
  "price": 149.99,
  "stock": 50,
  "image_url": "https://..."
}
```

**Result:**

```
✓ Item stored with seller_wallet_address
✓ On-chain event: ITEM_METADATA_HASHED
  - Hash includes: itemId, sellerId, sellerWallet, ...details
✓ Item ID returned for buyers
```

#### Buyer Creates Order

```
POST /api/orders
{
  "item_id": "item-uuid",
  "quantity": 1
}
```

**Result:**

```
✓ Check: buyer wallet_balance ≥ price
✓ Deduct amount from wallet_balance
✓ Reduce item stock by 1
✓ Create order with buyer_wallet_address
✓ On-chain event: ORDER_CREATED
  - Hash includes: orderId, amount, buyerId, buyerWallet, ...
✓ Create shipment assigned to logistics
✓ Return order_id, shipment_id, txHash
```

---

### 📊 Database Schema at a Glance

#### Users Table

```
id (PK)
├─ role (BUYER|SELLER|LOGISTICS)
├─ name
├─ email (UNIQUE)
├─ wallet_address (UNIQUE) ← NEW & IMMUTABLE
├─ wallet_balance
├─ password_hash (never exposed)
├─ contact_number ← NEW
├─ address
├─ created_at ← NEW (auto)
└─ updated_at ← NEW (auto)
```

#### Items Table

```
id (PK)
├─ seller_id (FK)
├─ seller_wallet_address ← NEW & CACHED
├─ item_name
├─ description
├─ price
├─ stock
├─ image_url
├─ created_at
└─ updated_at ← NEW (auto)
```

#### Orders Table

```
order_id (PK)
├─ buyer_id (FK)
├─ buyer_wallet_address ← NEW & CACHED
├─ item_id (FK)
├─ quantity
├─ total_amount
├─ order_status (PENDING|ACCEPTED|SHIPPED|DELIVERED|CONFIRMED|CANCELLED)
│  └─ RENAMED from current_status
├─ blockchain_tx_hash
├─ order_timestamp
├─ payment_collected
├─ created_at ← NEW
└─ updated_at ← NEW (auto)
```

#### Shipments Table

```
shipment_id (PK)
├─ order_id (FK)
├─ logistics_id (FK)
├─ current_status (location)
├─ last_update
├─ estimated_arrival
├─ created_at ← NEW
└─ updated_at ← NEW (auto)
```

---

### 🔗 Blockchain Integration

#### What Gets Hashed?

**1. User Identity**

```json
{
  "userId": "user-id",
  "role": "BUYER",
  "walletAddress": "0x1234..."
}
→ SHA-256 → 0xabcdef...
→ Event: USER_IDENTITY_HASHED (Type 5)
```

**2. Item Metadata**

```json
{
  "itemId": "item-id",
  "sellerId": "seller-id",
  "sellerWallet": "0x5678...",
  "name": "Headphones",
  ...details
}
→ SHA-256 → 0xabcdef...
→ Event: ITEM_METADATA_HASHED (Type 4)
```

**3. Order Creation**

```json
{
  "id": "order-id",
  "amount": 149.99,
  "buyer": "buyer-id",
  "buyerWallet": "0x1234...",
  "item": "item-id",
  "quantity": 1
}
→ SHA-256 → 0xabcdef...
→ Event: ORDER_CREATED (Type 0)
```

#### What's Stored On-Chain?

```
OrderEvent {
  entityKey: keccak256(uniqueId)  ← indexed for filtering
  eventType: 0|1|2|3|4|5|6
  uniqueId: "order-123"           ← readable
  dataHash: 0xabcdef...           ← SHA-256 hash
  sender: 0x...                   ← account address
  timestamp: block.timestamp
}
```

---

### 🧪 Quick Test Commands

#### Register New User

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPass123",
    "role": "BUYER",
    "wallet_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "contact_number": "+1-555-0123",
    "address": "123 Test St"
  }'
```

#### Check User Profile

```bash
curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Create Item

```bash
curl -X POST http://localhost:3000/api/inventory \
  -H "Authorization: Bearer SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "item_name": "Test Item",
    "description": "A test item",
    "price": 99.99,
    "stock": 10,
    "image_url": "https://example.com/image.jpg"
  }'
```

---

### 🐛 Common Issues & Fixes

| Issue                               | Cause                                 | Fix                                   |
| ----------------------------------- | ------------------------------------- | ------------------------------------- |
| "Wallet address already registered" | Using same address twice              | Create new address or delete old user |
| "Insufficient funds"                | wallet_balance < price                | Add balance or use cheaper item       |
| "Blockchain transaction failed"     | Hardhat node not running              | `npx hardhat node` in terminal        |
| "Invalid contract address"          | CONTRACT_ADDRESS wrong in .env        | Update from deploy output             |
| "Cannot modify wallet_address"      | Trying to update immutable field      | Wallet address cannot be changed      |
| "Order status not updating"         | Using old field name `current_status` | Use `order_status` instead            |

---

### 📖 Full Documentation

For complete details, see:

- **`DATABASE_CHANGES.md`** — Full schema & storage breakdown
- **`API_INTEGRATION_GUIDE.md`** — All API endpoints & examples
- **`IMPLEMENTATION_SUMMARY.md`** — Complete change summary
- **`scripts/setup_db_test.sql`** — Database creation script
- **`scripts/migrate_to_v2.sql`** — Migration for existing DBs

---

### 🎯 Key Points

✅ **Wallet Address Features:**

- Immutable after registration
- Used as blockchain identity
- Cached on items & orders
- Displayed in UI but not editable
- Included in all blockchain hashes

✅ **Timestamps:**

- `created_at` — immutable creation time
- `updated_at` — auto-updated on modification
- Database triggers handle updates
- Complete audit trail

✅ **Data Storage:**

- Full business data in PostgreSQL
- Hashes only on blockchain
- Privacy: No PII on-chain
- Immutability: No data loss on-chain

✅ **Field Changes:**

- `current_status` → `order_status` (everywhere)
- All components & queries updated
- No breaking changes to business logic

---

### ✅ Verification

After setup, verify:

```bash
# 1. Database exists
psql -U spc_user -d supply_chain_test -c "\dt"

# 2. App starts without errors
npm run dev

# 3. Can register user with wallet
curl http://localhost:3000/api/auth/signup ...

# 4. Wallet shown in profile
curl http://localhost:3000/api/profile ...

# 5. Blockchain events recorded
# Check OrderTracker contract events
```

---

### 🚀 Ready?

1. Run setup script ✓
2. Update `.env` ✓
3. Start Hardhat + deploy ✓
4. Start Next.js app ✓
5. Register user with wallet ✓
6. Create item & order ✓
7. Check blockchain ✓

**All set! 🎉**
