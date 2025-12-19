# User Role Functionalities

Complete guide to user roles and their functionalities in the B2C Supply Chain System.

## Overview

The system supports three user roles, each with specific permissions and functionalities:

- **BUYER**: Purchase products and track orders
- **SELLER**: Manage inventory and process orders
- **LOGISTICS**: Track and update shipments

---

## BUYER Role

### Capabilities

#### 1. Account Management
- ✅ Register account with auto-generated wallet address
- ✅ Login and manage profile
- ✅ Update profile information (name, email, contact, address)
- ✅ View wallet balance
- ❌ Cannot change wallet address (immutable)
- ❌ Cannot change role

#### 2. Marketplace Access
- ✅ Browse all available products
- ✅ View product details (name, description, price, stock)
- ✅ Search and filter products
- ✅ View seller information

#### 3. Order Management
- ✅ Place orders with quantity selection
- ✅ View purchase invoice after order
- ✅ View all own orders
- ✅ See order status (PENDING, ACCEPTED, SHIPPED, DELIVERED, CONFIRMED)
- ✅ View item name in order list
- ✅ Confirm receipt when order is "Out for Delivery"
- ✅ View blockchain transaction hashes
- ❌ Cannot cancel orders
- ❌ Cannot modify order quantity after placement

#### 4. Shipment Tracking
- ✅ View shipment status for own orders
- ✅ See current location updates
- ✅ View estimated arrival time
- ❌ Cannot update shipment location

#### 5. Payment
- ✅ Wallet balance automatically deducted on order
- ✅ View transaction history
- ❌ Cannot collect payments (only sellers)

#### 6. Blockchain
- ✅ View blockchain proofs for own orders
- ✅ Search transactions by hash
- ✅ Copy transaction hashes

### Buyer Workflow

```
1. Register → Get wallet address
2. Browse Marketplace → Select product
3. Click Purchase → Quantity Selection Modal
4. Confirm Purchase → Invoice Display
5. Wait for Seller Acceptance
6. Track Shipment Updates
7. Confirm Receipt when delivered
8. Order Complete
```

### Buyer Dashboard Features

- **Marketplace**: Browse and purchase products
- **My Orders**: View order history with item names
- **Profile**: Manage account information
- **View on Blockchain**: Search blockchain proofs

---

## SELLER Role

### Capabilities

#### 1. Account Management
- ✅ Register account with auto-generated wallet address
- ✅ Login and manage profile
- ✅ Update profile information
- ✅ View wallet balance
- ✅ Address field optional during registration
- ❌ Cannot change wallet address
- ❌ Cannot change role

#### 2. Inventory Management
- ✅ Create new products
- ✅ Update own products (name, description, price, stock)
- ✅ View all own products
- ✅ Delete products (via database)
- ✅ Set product prices and stock levels
- ❌ Cannot modify products from other sellers
- ❌ Cannot change seller ID or wallet address

#### 3. Order Management
- ✅ View all orders for own products
- ✅ See order statistics (pending, in-process, delivered)
- ✅ Accept pending orders (PENDING → ACCEPTED)
- ✅ Ship accepted orders (ACCEPTED → SHIPPED)
- ✅ View buyer information
- ✅ View order details (quantity, total, timestamps)
- ✅ See item names in orders
- ❌ Cannot modify order details
- ❌ Cannot cancel orders

#### 4. Payment Collection
- ✅ Collect payment for delivered/confirmed orders
- ✅ Receive funds in wallet balance
- ✅ View payment status
- ✅ See blockchain transaction for payment
- ❌ Cannot collect payment before delivery

#### 5. Shipment Tracking
- ✅ View shipment status for own orders
- ✅ See logistics updates
- ❌ Cannot update shipment location (logistics only)

#### 6. Blockchain
- ✅ View blockchain proofs for own items and orders
- ✅ See ITEM_METADATA_HASHED events
- ✅ See ORDER_CREATED events for own items
- ✅ See PAYMENT_RELEASED events

### Seller Workflow

```
1. Register → Get wallet address
2. Create Products → Add to inventory
3. Wait for Orders → View incoming orders
4. Accept Order → Status: ACCEPTED
5. Ship Order → Status: SHIPPED
6. Wait for Delivery Confirmation
7. Collect Payment → Funds added to wallet
8. Order Complete
```

### Seller Dashboard Features

- **Inventory**: Manage products
- **Order Management**: Process incoming orders
- **Order Statistics**: Dashboard with counts
- **Profile**: Manage account
- **View on Blockchain**: Search proofs

---

## LOGISTICS Role

### Capabilities

#### 1. Account Management
- ✅ Register account with auto-generated wallet address
- ✅ Login and manage profile
- ✅ Update profile information
- ✅ Address field optional during registration
- ❌ Cannot change wallet address
- ❌ Cannot change role

#### 2. Shipment Management
- ✅ View all active shipments
- ✅ Update shipment location/status
- ✅ Set estimated arrival time
- ✅ Update multiple times per shipment
- ✅ View order details for shipments
- ✅ View buyer and seller information
- ❌ Cannot create shipments (auto-created with orders)
- ❌ Cannot delete shipments

#### 3. Order Visibility
- ✅ View orders associated with shipments
- ✅ See order status
- ✅ View order details
- ❌ Cannot modify orders
- ❌ Cannot accept or ship orders

#### 4. Status Updates
- ✅ Update to "In Transit to Buyer"
- ✅ Update to "Out for Delivery"
- ✅ Update to "Delivered"
- ✅ Custom status messages
- ✅ Each update recorded on blockchain

#### 5. Blockchain
- ✅ View blockchain proofs for shipments
- ✅ See STATUS_UPDATE events
- ✅ Search by shipment ID

### Logistics Workflow

```
1. Register → Get wallet address
2. View Active Shipments → See assigned shipments
3. Update Location → "In Transit to Buyer"
4. Update Location → "Out for Delivery"
5. Update Location → "Delivered"
6. Shipment Complete
```

### Logistics Dashboard Features

- **Active Shipments**: Manage all shipments
- **Shipment Updates**: Update locations and status
- **Profile**: Manage account
- **View on Blockchain**: Search proofs

---

## Role Comparison Table

| Feature | BUYER | SELLER | LOGISTICS |
|---------|-------|--------|-----------|
| **Account** |
| Register | ✅ | ✅ | ✅ |
| Edit Profile | ✅ | ✅ | ✅ |
| Wallet Address | ✅ (read-only) | ✅ (read-only) | ✅ (read-only) |
| **Products** |
| Browse Marketplace | ✅ | ✅ | ✅ |
| Create Products | ❌ | ✅ | ❌ |
| Update Products | ❌ | ✅ (own only) | ❌ |
| **Orders** |
| Place Orders | ✅ | ❌ | ❌ |
| View Own Orders | ✅ | ✅ (for own items) | ❌ |
| Accept Orders | ❌ | ✅ | ❌ |
| Ship Orders | ❌ | ✅ | ❌ |
| Confirm Receipt | ✅ | ❌ | ❌ |
| **Shipments** |
| View Shipments | ✅ (own orders) | ✅ (own orders) | ✅ (all) |
| Update Location | ❌ | ❌ | ✅ |
| **Payments** |
| Pay for Orders | ✅ (auto) | ❌ | ❌ |
| Collect Payments | ❌ | ✅ | ❌ |
| **Blockchain** |
| View Proofs | ✅ | ✅ | ✅ |
| Search Transactions | ✅ | ✅ | ✅ |

---

## Role-Specific UI Components

### BUYER Components

- **Marketplace**: Product browsing and purchase
- **My Orders**: Order history with item names
- **Quantity Selection Modal**: Choose purchase quantity
- **Invoice Modal**: View purchase details
- **Profile**: Account management

### SELLER Components

- **Inventory**: Product management
- **Order Management**: Process incoming orders
- **Order Statistics**: Dashboard metrics
- **Payment Collection**: Collect funds
- **Profile**: Account management

### LOGISTICS Components

- **Active Shipments**: Shipment management
- **Shipment Updates**: Location tracking
- **Profile**: Account management

---

## Permission Matrix

### Order Status Transitions

| Current Status | BUYER Action | SELLER Action | LOGISTICS Action |
|----------------|--------------|---------------|------------------|
| PENDING | View | Accept → ACCEPTED | View |
| ACCEPTED | View | Ship → SHIPPED | View |
| SHIPPED | Confirm Receipt → DELIVERED* | View | Update Location |
| DELIVERED | View | Collect Payment | View |
| CONFIRMED | View | Collect Payment | View |

*Only when shipment status is "Out for Delivery"

### Data Access

| Data Type | BUYER | SELLER | LOGISTICS |
|-----------|-------|--------|-----------|
| Own Profile | ✅ Full | ✅ Full | ✅ Full |
| Own Orders | ✅ Full | ✅ Full | ❌ |
| Own Items | ❌ | ✅ Full | ❌ |
| Own Shipments | ✅ View | ✅ View | ✅ Full |
| Other Users' Data | ❌ | ❌ | ❌ |
| Blockchain Proofs | ✅ Own | ✅ Own | ✅ Own |

---

## Role Registration Requirements

### BUYER

**Required Fields**:
- Name
- Email
- Password
- Role: BUYER
- Address (required)

**Optional Fields**:
- Contact Number

**Auto-Generated**:
- User ID
- Wallet Address
- Wallet Balance (0.00)

### SELLER

**Required Fields**:
- Name
- Email
- Password
- Role: SELLER

**Optional Fields**:
- Address
- Contact Number

**Auto-Generated**:
- User ID
- Wallet Address
- Wallet Balance (0.00)

### LOGISTICS

**Required Fields**:
- Name
- Email
- Password
- Role: LOGISTICS

**Optional Fields**:
- Address
- Contact Number

**Auto-Generated**:
- User ID
- Wallet Address
- Wallet Balance (0.00)

---

## Best Practices by Role

### For BUYERS

- Keep wallet balance sufficient for purchases
- Review order details before confirming
- Track shipments regularly
- Confirm receipt promptly when delivered
- Save transaction hashes for records

### For SELLERS

- Maintain accurate inventory stock
- Respond to orders promptly
- Update order status timely
- Collect payments after delivery confirmation
- Monitor order statistics

### For LOGISTICS

- Update shipment locations regularly
- Provide accurate estimated arrival times
- Update status when "Out for Delivery"
- Coordinate with buyers for delivery
- Maintain shipment records

---

## Role Limitations

### BUYER Limitations

- Cannot create or modify products
- Cannot process orders
- Cannot update shipments
- Cannot collect payments
- Cannot change wallet address

### SELLER Limitations

- Cannot purchase own products
- Cannot update shipments
- Cannot collect payment before delivery
- Cannot modify other sellers' products
- Cannot change wallet address

### LOGISTICS Limitations

- Cannot create products
- Cannot place orders
- Cannot process orders
- Cannot collect payments
- Cannot change wallet address

---

## Role-Specific Features Summary

### BUYER Features

1. ✅ Quantity selection before purchase
2. ✅ Purchase invoice display
3. ✅ Item names in order list
4. ✅ Receipt confirmation
5. ✅ Wallet balance management

### SELLER Features

1. ✅ Product inventory management
2. ✅ Order acceptance and shipping
3. ✅ Payment collection
4. ✅ Order statistics dashboard
5. ✅ Address optional during signup

### LOGISTICS Features

1. ✅ Shipment location updates
2. ✅ Multiple status updates per shipment
3. ✅ Estimated arrival management
4. ✅ All shipments visibility
5. ✅ Address optional during signup

---

**All roles have equal access to blockchain proof viewing and profile management.**

