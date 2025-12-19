## 🔌 API Integration Guide - Wallet Address Support

### Overview

This guide explains how to integrate wallet addresses from Hardhat accounts into the B2C Supply Chain system API.

---

## 🔐 Authentication & User Management

### 1. User Registration

**Endpoint:** `POST /api/auth/signup`

**Request Body:**

```json
{
  "name": "John Buyer",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "BUYER",
  "wallet_address": "0x1234567890123456789012345678901234567890",
  "contact_number": "+1-555-123-4567",
  "address": "123 Main Street, City, State 12345"
}
```

**Required Fields:**

- `name`: Display name
- `email`: Unique email address
- `password`: Will be hashed with bcrypt (SALT_ROUNDS=10)
- `role`: One of `BUYER`, `SELLER`, `LOGISTICS`
- `wallet_address`: Ethereum address (0x + 40 hex chars) from Hardhat account
- `contact_number`: Optional phone number
- `address`: Optional physical address

**Response:**

```json
{
  "id": "uuid-generated-id",
  "role": "BUYER",
  "name": "John Buyer",
  "email": "john@example.com",
  "wallet_address": "0x1234567890123456789012345678901234567890",
  "wallet_balance": 0.0,
  "contact_number": "+1-555-123-4567",
  "address": "123 Main Street, City, State 12345",
  "created_at": "2025-12-19T10:30:00Z",
  "updated_at": "2025-12-19T10:30:00Z"
}
```

**On-Chain Action:**

- Event `USER_IDENTITY_HASHED` recorded with hash of:
  ```json
  {
    "userId": "generated-id",
    "role": "BUYER",
    "walletAddress": "0x1234567890123456789012345678901234567890"
  }
  ```

**Error Responses:**

```json
// Email already exists
{ "error": "User with this email already exists." }

// Wallet address already registered
{ "error": "Wallet address already registered." }

// Invalid role
{ "error": "Invalid role provided." }

// Database error
{ "error": "Registration failed due to a database error." }
```

---

### 2. User Login

**Endpoint:** `POST /api/auth/route`

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**

```json
{
  "id": "uuid-id",
  "role": "BUYER",
  "name": "John Buyer",
  "email": "john@example.com",
  "wallet_address": "0x1234567890123456789012345678901234567890",
  "wallet_balance": 5000.0,
  "contact_number": "+1-555-123-4567",
  "address": "123 Main Street, City, State 12345",
  "created_at": "2025-12-19T10:30:00Z",
  "updated_at": "2025-12-19T12:45:00Z"
}
```

---

### 3. Update User Profile

**Endpoint:** `PUT /api/profile`

**Request Body:**

```json
{
  "name": "John Q. Buyer",
  "email": "newemail@example.com",
  "contact_number": "+1-555-999-8888",
  "address": "456 Oak Avenue, New City, State 67890"
}
```

**Immutable Fields (Cannot be modified):**

- `id` - User ID
- `role` - User role (BUYER/SELLER/LOGISTICS)
- `wallet_address` - Ethereum address
- `password_hash` - Stored password hash

**Mutable Fields:**

- `name`
- `email`
- `contact_number`
- `address`

**Response:**

```json
{
  "id": "uuid-id",
  "role": "BUYER",
  "name": "John Q. Buyer",
  "email": "newemail@example.com",
  "wallet_address": "0x1234567890123456789012345678901234567890",
  "wallet_balance": 5000.0,
  "contact_number": "+1-555-999-8888",
  "address": "456 Oak Avenue, New City, State 67890",
  "created_at": "2025-12-19T10:30:00Z",
  "updated_at": "2025-12-19T13:00:00Z"
}
```

---

## 📦 Inventory Management

### 4. Create Item (Seller)

**Endpoint:** `POST /api/inventory`

**Authentication Required:** YES (Must be SELLER)

**Request Body:**

```json
{
  "item_name": "Premium Wireless Headphones",
  "description": "High-quality noise-canceling headphones with 30-hour battery",
  "price": 149.99,
  "stock": 50,
  "image_url": "https://example.com/images/headphones.jpg"
}
```

**Required Fields:**

- `item_name`: Product name
- `description`: Product description
- `price`: Price in decimal format
- `stock`: Available quantity
- `image_url`: Optional image URL

**Response:**

```json
{
  "id": "item-uuid-id",
  "seller_id": "seller-uuid-id",
  "seller_wallet_address": "0x0987654321098765432109876543210987654321",
  "item_name": "Premium Wireless Headphones",
  "description": "High-quality noise-canceling headphones with 30-hour battery",
  "price": 149.99,
  "stock": 50,
  "image_url": "https://example.com/images/headphones.jpg",
  "created_at": "2025-12-19T14:30:00Z",
  "updated_at": "2025-12-19T14:30:00Z"
}
```

**On-Chain Action:**

- Event `ITEM_METADATA_HASHED` recorded with hash of:
  ```json
  {
    "itemId": "item-uuid-id",
    "sellerId": "seller-uuid-id",
    "sellerWallet": "0x0987654321098765432109876543210987654321",
    "name": "Premium Wireless Headphones",
    "description": "High-quality noise-canceling headphones with 30-hour battery",
    "price": 149.99,
    "stock": 50,
    "imageUrl": "https://example.com/images/headphones.jpg",
    "createdAt": "2025-12-19T14:30:00Z"
  }
  ```

---

### 5. Update Item (Seller)

**Endpoint:** `PUT /api/inventory/:itemId`

**Authentication Required:** YES (Must be item seller)

**Request Body:**

```json
{
  "item_name": "Premium Wireless Headphones v2",
  "description": "Updated description",
  "price": 139.99,
  "stock": 45,
  "image_url": "https://example.com/images/headphones-v2.jpg"
}
```

**Immutable Fields:**

- `id` - Item ID
- `seller_id` - Original seller
- `seller_wallet_address` - Seller's wallet address

**Response:**

```json
{
  "id": "item-uuid-id",
  "seller_id": "seller-uuid-id",
  "seller_wallet_address": "0x0987654321098765432109876543210987654321",
  "item_name": "Premium Wireless Headphones v2",
  "description": "Updated description",
  "price": 139.99,
  "stock": 45,
  "image_url": "https://example.com/images/headphones-v2.jpg",
  "created_at": "2025-12-19T14:30:00Z",
  "updated_at": "2025-12-19T15:00:00Z"
}
```

---

## 📋 Order Management

### 6. Create Order (Buyer)

**Endpoint:** `POST /api/orders`

**Authentication Required:** YES (Must be BUYER)

**Request Body:**

```json
{
  "item_id": "item-uuid-id",
  "quantity": 1
}
```

**Logic:**

1. Validates buyer has sufficient wallet_balance
2. Validates item stock is available
3. Creates order with status PENDING
4. Deducts amount from buyer's wallet_balance
5. Reduces item stock
6. Generates SHA-256 hash of order data
7. Records on blockchain with buyer_wallet_address

**Response:**

```json
{
  "order": {
    "order_id": "ord-uuid-1234567890",
    "buyer_id": "buyer-uuid-id",
    "buyer_wallet_address": "0x1234567890123456789012345678901234567890",
    "item_id": "item-uuid-id",
    "quantity": 1,
    "total_amount": 149.99,
    "order_status": "PENDING",
    "blockchain_tx_hash": "0xabcdef1234567890...",
    "order_timestamp": "2025-12-19T16:00:00Z",
    "payment_collected": false,
    "created_at": "2025-12-19T16:00:00Z",
    "updated_at": "2025-12-19T16:00:00Z"
  },
  "shipment": {
    "shipment_id": "shp-uuid-1234567890",
    "order_id": "ord-uuid-1234567890",
    "logistics_id": "logistics-uuid-id",
    "current_status": "Awaiting Seller Acceptance",
    "last_update": "2025-12-19T16:00:00Z",
    "estimated_arrival": "Pending",
    "created_at": "2025-12-19T16:00:00Z",
    "updated_at": "2025-12-19T16:00:00Z"
  },
  "txHash": "0xabcdef1234567890..."
}
```

**On-Chain Action:**

- Event `ORDER_CREATED` recorded with hash of:
  ```json
  {
    "id": "ord-uuid-1234567890",
    "amount": 149.99,
    "buyer": "buyer-uuid-id",
    "buyerWallet": "0x1234567890123456789012345678901234567890",
    "item": "item-uuid-id",
    "quantity": 1
  }
  ```

**Error Responses:**

```json
// Insufficient balance
{ "error": "Pre-transaction validation failed: Insufficient funds or stock." }

// No logistics provider
{ "error": "No Logistics Provider available..." }

// Blockchain failed
{ "error": "Blockchain record failed. Aborting transaction." }
```

---

### 7. Update Order Status (Seller)

**Endpoint:** `PUT /api/orders/:orderId/status`

**Authentication Required:** YES

**Request Body:**

```json
{
  "status": "ACCEPTED"
}
```

**Valid Status Transitions:**

- `PENDING` → `ACCEPTED` (Seller accepts order)
- `ACCEPTED` → `SHIPPED` (Seller ships order)
- `SHIPPED` → `DELIVERED` (Logistics confirms delivery)
- `DELIVERED` → `CONFIRMED` (Buyer confirms receipt)

**Response:**

```json
{
  "order_id": "ord-uuid-1234567890",
  "buyer_id": "buyer-uuid-id",
  "buyer_wallet_address": "0x1234567890123456789012345678901234567890",
  "item_id": "item-uuid-id",
  "quantity": 1,
  "total_amount": 149.99,
  "order_status": "ACCEPTED",
  "blockchain_tx_hash": "0xabcdef1234567890...",
  "order_timestamp": "2025-12-19T16:00:00Z",
  "payment_collected": false,
  "created_at": "2025-12-19T16:00:00Z",
  "updated_at": "2025-12-19T16:30:00Z"
}
```

**On-Chain Action:**

- Event recorded with type `STATUS_UPDATE` or `DELIVERY_CONFIRMED`

---

## 🚚 Shipment Tracking

### 8. Update Shipment Location

**Endpoint:** `PUT /api/shipments/:shipmentId`

**Authentication Required:** YES (Must be logistics provider)

**Request Body:**

```json
{
  "current_status": "In Transit to Buyer"
}
```

**Response:**

```json
{
  "shipment_id": "shp-uuid-1234567890",
  "order_id": "ord-uuid-1234567890",
  "logistics_id": "logistics-uuid-id",
  "current_status": "In Transit to Buyer",
  "last_update": "2025-12-19T17:00:00Z",
  "estimated_arrival": "2025-12-21",
  "created_at": "2025-12-19T16:00:00Z",
  "updated_at": "2025-12-19T17:00:00Z"
}
```

**On-Chain Action:**

- Event `STATUS_UPDATE` recorded with hash of:
  ```json
  {
    "orderId": "ord-uuid-1234567890",
    "shipmentId": "shp-uuid-1234567890",
    "location": "In Transit to Buyer",
    "updater": "logistics-uuid-id",
    "updatedAt": "2025-12-19T17:00:00Z"
  }
  ```

---

## 💰 Payment Management

### 9. Collect Payment (Seller)

**Endpoint:** `POST /api/orders/:orderId/collect-payment`

**Authentication Required:** YES (Seller)

**Prerequisites:**

- Order status must be `DELIVERED` or `CONFIRMED`
- Payment not already collected (`payment_collected = false`)

**Request Body:**

```json
{}
```

**Logic:**

1. Verifies order status is DELIVERED or CONFIRMED
2. Checks payment hasn't been collected
3. Generates payment hash
4. Records on blockchain
5. Transfers order amount to seller's wallet_balance
6. Marks order as payment_collected = true

**Response:**

```json
{
  "order_id": "ord-uuid-1234567890",
  "buyer_id": "buyer-uuid-id",
  "buyer_wallet_address": "0x1234567890123456789012345678901234567890",
  "item_id": "item-uuid-id",
  "quantity": 1,
  "total_amount": 149.99,
  "order_status": "CONFIRMED",
  "blockchain_tx_hash": "0xabcdef1234567890...",
  "order_timestamp": "2025-12-19T16:00:00Z",
  "payment_collected": true,
  "created_at": "2025-12-19T16:00:00Z",
  "updated_at": "2025-12-19T18:30:00Z"
}
```

**On-Chain Action:**

- Event `PAYMENT_RELEASED` recorded with hash of:
  ```json
  {
    "id": "ord-uuid-1234567890",
    "amount": 149.99,
    "seller": "seller-uuid-id"
  }
  ```

---

## 📊 Data Query Endpoints

### 10. Get User Profile

**Endpoint:** `GET /api/profile`

**Authentication Required:** YES

**Response:**

```json
{
  "id": "uuid-id",
  "role": "BUYER",
  "name": "John Buyer",
  "email": "john@example.com",
  "wallet_address": "0x1234567890123456789012345678901234567890",
  "wallet_balance": 4850.01,
  "contact_number": "+1-555-123-4567",
  "address": "123 Main Street, City, State 12345",
  "created_at": "2025-12-19T10:30:00Z",
  "updated_at": "2025-12-19T13:00:00Z"
}
```

---

### 11. Get Orders & Shipments

**Endpoint:** `GET /api/orders`

**Authentication Required:** YES

**Response (Buyer):**

```json
{
  "orders": [
    {
      "order_id": "ord-uuid-1",
      "buyer_id": "buyer-uuid-id",
      "buyer_wallet_address": "0x1234567890123456789012345678901234567890",
      "item_id": "item-uuid-1",
      "quantity": 1,
      "total_amount": 149.99,
      "order_status": "DELIVERED",
      "blockchain_tx_hash": "0xabcdef...",
      "order_timestamp": "2025-12-19T16:00:00Z",
      "payment_collected": false,
      "created_at": "2025-12-19T16:00:00Z",
      "updated_at": "2025-12-19T17:30:00Z"
    }
  ],
  "shipments": [
    {
      "shipment_id": "shp-uuid-1",
      "order_id": "ord-uuid-1",
      "logistics_id": "logistics-uuid-id",
      "current_status": "Out for Delivery",
      "last_update": "2025-12-19T17:00:00Z",
      "estimated_arrival": "2025-12-19",
      "created_at": "2025-12-19T16:00:00Z",
      "updated_at": "2025-12-19T17:00:00Z"
    }
  ]
}
```

---

## ⚙️ Environment Configuration

**Required Environment Variables:**

```bash
# Database
DATABASE_URL=postgresql://spc_user:123456@localhost:5432/supply_chain_test

# Blockchain
NEXT_PUBLIC_BLOCKCHAIN_NETWORK=hardhat  # or 'sepolia'
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
NEXT_PUBLIC_HARDHAT_RPC_URL=http://127.0.0.1:8545
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Contract
CONTRACT_ADDRESS=0x0165878a594ca255338adfa4d48449f69242eb8f
```

---

## 🔒 Security Considerations

1. **Password Hashing:** All passwords hashed with bcrypt (SALT_ROUNDS=10)
2. **Wallet Address:** Immutable after creation, used for blockchain identity
3. **Transactions:** Off-chain data remains private; only hashes stored on-chain
4. **PII Protection:** No personal information stored on blockchain
5. **Access Control:** Role-based restrictions (BUYER/SELLER/LOGISTICS)

---

## 📝 Example Flow

### Complete Order Flow with Wallet Addresses

```
1. User Registration (BUYER)
   → wallet_address provided: 0x1111...

2. Seller creates Item
   → seller_wallet_address cached: 0x2222...

3. Buyer creates Order
   → buyer_wallet_address included: 0x1111...
   → Order hash includes wallet addresses
   → blockchain_tx_hash recorded

4. Seller accepts Order
   → order_status updated to ACCEPTED
   → blockchain event recorded

5. Seller ships Order
   → Shipment created with status update
   → blockchain event recorded

6. Logistics updates Location
   → current_status updated multiple times
   → Each update recorded on blockchain

7. Delivery confirmed
   → order_status changed to DELIVERED
   → blockchain event recorded

8. Buyer confirms receipt
   → order_status changed to CONFIRMED

9. Seller collects Payment
   → Amount transferred to seller's wallet_balance
   → payment_collected = true
   → blockchain event PAYMENT_RELEASED recorded
```

---

## 🐛 Troubleshooting

### "Wallet address already registered"

- The wallet_address has a UNIQUE constraint
- Either use a different address or delete the previous account

### "Insufficient funds or stock"

- Buyer's wallet_balance is less than item price
- Top up balance or try a cheaper item
- Item stock is 0 or less

### "Blockchain transaction failed"

- Check Hardhat is running: `npx hardhat node`
- Verify CONTRACT_ADDRESS is correct
- Check PRIVATE_KEY is valid
- Verify network connectivity

### "Order not found or access denied"

- User role may not have permission
- Order ID doesn't exist
- User is trying to access another user's order
