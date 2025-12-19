# API Guide

Complete API reference and usage guidelines for the B2C Supply Chain System.

## Table of Contents

- [Authentication APIs](#authentication-apis)
- [Profile APIs](#profile-apis)
- [Inventory APIs](#inventory-apis)
- [Order APIs](#order-apis)
- [Shipment APIs](#shipment-apis)
- [Blockchain APIs](#blockchain-apis)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

---

## Authentication APIs

### POST /api/auth/signup

**Description**: Register a new user account

**Request Body**:
```json
{
  "name": "John Buyer",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "BUYER",
  "address": "123 Main Street",
  "contact_number": "+1-555-123-4567"
}
```

**Response** (201 Created):
```json
{
  "id": "user_1234567890_abc",
  "role": "BUYER",
  "name": "John Buyer",
  "email": "john@example.com",
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc0e7595f8f0Ae",
  "wallet_balance": 0,
  "contact_number": "+1-555-123-4567",
  "address": "123 Main Street",
  "created_at": "2025-12-19T10:30:00Z",
  "updated_at": "2025-12-19T10:30:00Z"
}
```

**Errors**:
- `400`: Missing required fields
- `409`: Email or wallet address already exists
- `500`: Server error

**Blockchain Event**: USER_IDENTITY_HASHED

---

### POST /api/auth/route

**Description**: Login to existing account

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response** (200 OK):
```json
{
  "id": "user_1234567890_abc",
  "role": "BUYER",
  "name": "John Buyer",
  "email": "john@example.com",
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc0e7595f8f0Ae",
  "wallet_balance": 5000,
  "contact_number": "+1-555-123-4567",
  "address": "123 Main Street",
  "created_at": "2025-12-19T10:30:00Z",
  "updated_at": "2025-12-19T15:45:00Z"
}
```

**Errors**:
- `401`: Invalid credentials
- `404`: User not found

---

## Profile APIs

### GET /api/profile?userId={userId}

**Description**: Get user profile information

**Query Parameters**:
- `userId` (required): User ID

**Response** (200 OK):
```json
{
  "id": "user_1234567890_abc",
  "role": "BUYER",
  "name": "John Buyer",
  "email": "john@example.com",
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc0e7595f8f0Ae",
  "wallet_balance": 5000,
  "contact_number": "+1-555-123-4567",
  "address": "123 Main Street",
  "created_at": "2025-12-19T10:30:00Z",
  "updated_at": "2025-12-19T15:45:00Z"
}
```

**Errors**:
- `400`: Missing userId
- `404`: User not found

---

### PUT /api/profile

**Description**: Update user profile

**Request Body**:
```json
{
  "userId": "user_1234567890_abc",
  "updates": {
    "name": "John Q. Buyer",
    "email": "newemail@example.com",
    "contact_number": "+1-555-999-8888",
    "address": "456 Oak Avenue"
  }
}
```

**Immutable Fields** (cannot be updated):
- `wallet_address`
- `role`
- `id`

**Response** (200 OK):
```json
{
  "id": "user_1234567890_abc",
  "role": "BUYER",
  "name": "John Q. Buyer",
  "email": "newemail@example.com",
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc0e7595f8f0Ae",
  "wallet_balance": 5000,
  "contact_number": "+1-555-999-8888",
  "address": "456 Oak Avenue",
  "created_at": "2025-12-19T10:30:00Z",
  "updated_at": "2025-12-19T16:00:00Z"
}
```

**Errors**:
- `400`: Invalid updates
- `403`: Attempting to modify immutable field
- `404`: User not found

---

## Inventory APIs

### POST /api/inventory

**Description**: Create new item (Seller only)

**Request Body**:
```json
{
  "item_name": "Premium Wireless Headphones",
  "description": "High-quality noise-canceling headphones",
  "price": 149.99,
  "stock": 50
}
```

**Response** (201 Created):
```json
{
  "id": "item_1234567890_xyz",
  "seller_id": "seller_123",
  "seller_wallet_address": "0x0987654321098765432109876543210987654321",
  "item_name": "Premium Wireless Headphones",
  "description": "High-quality noise-canceling headphones",
  "price": 149.99,
  "stock": 50,
  "created_at": "2025-12-19T14:30:00Z",
  "updated_at": "2025-12-19T14:30:00Z"
}
```

**Blockchain Event**: ITEM_METADATA_HASHED

**Errors**:
- `401`: Not authenticated as seller
- `400`: Missing required fields

---

### GET /api/inventory

**Description**: List all available items

**Response** (200 OK):
```json
[
  {
    "id": "item_1234567890_xyz",
    "seller_id": "seller_123",
    "seller_wallet_address": "0x0987654321098765432109876543210987654321",
    "item_name": "Premium Wireless Headphones",
    "description": "High-quality noise-canceling headphones",
    "price": 149.99,
    "stock": 50,
    "created_at": "2025-12-19T14:30:00Z",
    "updated_at": "2025-12-19T14:30:00Z"
  }
]
```

---

### PUT /api/inventory

**Description**: Update existing item (Seller only, own items)

**Request Body**:
```json
{
  "id": "item_1234567890_xyz",
  "item_name": "Premium Wireless Headphones v2",
  "description": "Updated description",
  "price": 139.99,
  "stock": 45
}
```

**Response** (200 OK): Updated item object

**Errors**:
- `401`: Not authenticated as seller
- `403`: Not the item owner
- `404`: Item not found

---

## Order APIs

### POST /api/order

**Description**: Create new order (Buyer only)

**Request Body**:
```json
{
  "buyer": {
    "id": "buyer_123",
    "wallet_address": "0x742d35Cc6634C0532925a3b844Bc0e7595f8f0Ae",
    "wallet_balance": 5000
  },
  "item": {
    "id": "item_123",
    "price": 149.99,
    "stock": 50
  },
  "quantity": 2
}
```

**Response** (201 Created):
```json
{
  "message": "Order successfully placed.",
  "orderId": "ord_1234567890",
  "txHash": "0xabcdef1234567890...",
  "order": {
    "order_id": "ord_1234567890",
    "buyer_id": "buyer_123",
    "buyer_wallet_address": "0x742d35Cc6634C0532925a3b844Bc0e7595f8f0Ae",
    "item_id": "item_123",
    "quantity": 2,
    "total_amount": 299.98,
    "order_status": "PENDING",
    "blockchain_tx_hash": "0xabcdef1234567890...",
    "order_timestamp": "2025-12-19T16:00:00Z",
    "payment_collected": false,
    "created_at": "2025-12-19T16:00:00Z",
    "updated_at": "2025-12-19T16:00:00Z"
  },
  "item": {
    "item_name": "Premium Wireless Headphones"
  }
}
```

**Blockchain Event**: ORDER_CREATED

**Errors**:
- `400`: Insufficient funds or stock
- `401`: Not authenticated as buyer
- `500`: Transaction failed

---

### GET /api/orders?userId={userId}&userRole={role}

**Description**: Get orders and shipments for user

**Query Parameters**:
- `userId` (required): User ID
- `userRole` (required): BUYER, SELLER, or LOGISTICS

**Response** (200 OK):
```json
{
  "orders": [
    {
      "order_id": "ord_1234567890",
      "buyer_id": "buyer_123",
      "buyer_wallet_address": "0x742d35Cc6634C0532925a3b844Bc0e7595f8f0Ae",
      "item_id": "item_123",
      "item_name": "Premium Wireless Headphones",
      "quantity": 2,
      "total_amount": 299.98,
      "order_status": "PENDING",
      "blockchain_tx_hash": "0xabcdef1234567890...",
      "order_timestamp": "2025-12-19T16:00:00Z",
      "payment_collected": false,
      "created_at": "2025-12-19T16:00:00Z",
      "updated_at": "2025-12-19T16:00:00Z"
    }
  ],
  "shipments": [
    {
      "shipment_id": "shp_1234567890",
      "order_id": "ord_1234567890",
      "logistics_id": "logistics_123",
      "current_status": "Awaiting Seller Acceptance",
      "last_update": "2025-12-19T16:00:00Z",
      "estimated_arrival": "Pending",
      "created_at": "2025-12-19T16:00:00Z",
      "updated_at": "2025-12-19T16:00:00Z"
    }
  ]
}
```

---

### POST /api/orders

**Description**: Update order status or collect payment

**Request Body** (Update Status):
```json
{
  "action": "updateStatus",
  "orderId": "ord_1234567890",
  "newStatus": "ACCEPTED",
  "userId": "seller_123"
}
```

**Request Body** (Collect Payment):
```json
{
  "action": "collectPayment",
  "orderId": "ord_1234567890",
  "userId": "seller_123"
}
```

**Response** (200 OK):
```json
{
  "message": "Status updated and recorded on chain.",
  "txHash": "0xabcdef1234567890..."
}
```

**Blockchain Events**: STATUS_UPDATE, DELIVERY_CONFIRMED, or PAYMENT_RELEASED

**Errors**:
- `400`: Invalid action or missing parameters
- `403`: Insufficient permissions
- `404`: Order not found

---

## Shipment APIs

### PUT /api/shipments/{shipmentId}

**Description**: Update shipment location (Logistics only)

**Request Body**:
```json
{
  "current_status": "In Transit to Buyer",
  "estimated_arrival": "2025-12-21"
}
```

**Response** (200 OK):
```json
{
  "shipment_id": "shp_1234567890",
  "order_id": "ord_1234567890",
  "logistics_id": "logistics_123",
  "current_status": "In Transit to Buyer",
  "last_update": "2025-12-19T17:00:00Z",
  "estimated_arrival": "2025-12-21",
  "created_at": "2025-12-19T16:00:00Z",
  "updated_at": "2025-12-19T17:00:00Z"
}
```

**Blockchain Event**: STATUS_UPDATE

**Errors**:
- `401`: Not authenticated as logistics provider
- `404`: Shipment not found

---

## Blockchain APIs

### GET /api/blockchain-proofs

**Description**: Search blockchain proofs

**Query Parameters**:
- `search` (optional): Full-text search
- `txHash` (optional): Transaction hash
- `entity` (optional): Entity ID
- `sender` (optional): Wallet address
- `type` (optional): Entity type (USER, ITEM, ORDER, SHIPMENT)
- `limit` (optional): Result limit (default: 50, max: 200)

**Response** (200 OK):
```json
[
  {
    "id": "proof_123",
    "entity_id": "ord_1234567890",
    "entity_type": "ORDER",
    "event_type": 0,
    "data_hash": "0xsha256hash...",
    "blockchain_tx_hash": "0xtxhash...",
    "sender_address": "0xwalletaddress...",
    "proof_timestamp": "2025-12-19T16:00:00Z",
    "metadata": {
      "buyer_id": "buyer_123",
      "item_id": "item_123",
      "amount": 299.98,
      "quantity": 2
    },
    "created_at": "2025-12-19T16:00:00Z"
  }
]
```

---

## Error Handling

### Standard Error Response

```json
{
  "error": "Error message description"
}
```

### HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate resource)
- `500`: Internal Server Error

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "User with this email already exists" | Duplicate email | Use different email |
| "Wallet address already registered" | Duplicate wallet | Use different wallet |
| "Insufficient funds or stock" | Balance/stock too low | Add funds or reduce quantity |
| "Cannot modify wallet_address" | Immutable field | Field cannot be changed |
| "Order not found" | Invalid order ID | Check order ID |
| "Blockchain transaction failed" | Hardhat not running | Start Hardhat node |

---

## Best Practices

### Authentication

- Store user session in localStorage after login
- Include user context in API requests
- Validate user role before operations

### Error Handling

- Always check response status
- Display user-friendly error messages
- Log errors for debugging

### Rate Limiting

- Implement client-side rate limiting
- Avoid rapid successive requests
- Handle rate limit errors gracefully

### Data Validation

- Validate on client and server
- Check required fields
- Verify data types and formats

### Security

- Never expose passwords
- Use HTTPS in production
- Validate user permissions
- Sanitize user inputs

### Performance

- Use pagination for large lists
- Cache frequently accessed data
- Optimize database queries

---

## Example Usage

### Complete Order Flow

```javascript
// 1. Register user
const signupResponse = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Buyer',
    email: 'john@example.com',
    password: 'SecurePass123',
    role: 'BUYER',
    address: '123 Main St'
  })
});
const user = await signupResponse.json();

// 2. Create order
const orderResponse = await fetch('/api/order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    buyer: user,
    item: { id: 'item_123', price: 149.99, stock: 50 },
    quantity: 2
  })
});
const orderResult = await orderResponse.json();

// 3. View orders
const ordersResponse = await fetch(
  `/api/orders?userId=${user.id}&userRole=${user.role}`
);
const { orders, shipments } = await ordersResponse.json();
```

---

**For detailed endpoint documentation, see individual API route files in `/app/api/`**

