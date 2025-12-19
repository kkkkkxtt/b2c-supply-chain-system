# System Features

Complete list of all features implemented in the B2C Supply Chain System.

## Table of Contents

- [Authentication & User Management](#authentication--user-management)
- [Inventory Management](#inventory-management)
- [Order Management](#order-management)
- [Shipment Tracking](#shipment-tracking)
- [Payment Management](#payment-management)
- [Blockchain Integration](#blockchain-integration)
- [User Profile](#user-profile)
- [Wallet Management](#wallet-management)
- [UI Features](#ui-features)

---

## Authentication & User Management

### Sign Up

- **Feature**: User registration with role selection
- **Roles**: BUYER, SELLER, LOGISTICS
- **Auto-generated Wallet**: Each user gets unique Ethereum wallet address
- **Fields**:
  - Name (required)
  - Email (required, unique)
  - Password (required, hashed with bcrypt)
  - Role (required)
  - Address (required for BUYER, optional for SELLER/LOGISTICS)
  - Contact Number (optional)
- **Blockchain Event**: USER_IDENTITY_HASHED recorded on-chain
- **Location**: `/api/auth/signup`

### Login

- **Feature**: User authentication
- **Method**: Email and password
- **Session**: Stored in localStorage
- **Response**: Full user object (excluding password_hash)
- **Location**: `/api/auth/route`

### User Profile

- **View Profile**: Display all user information
- **Edit Profile**: Update name, email, contact number, address
- **Immutable Fields**: Wallet address, role, user ID cannot be changed
- **Wallet Display**: Shows wallet address with copy-to-clipboard
- **Location**: `/api/profile` (GET/PUT)

---

## Inventory Management

### Create Item (Seller)

- **Feature**: Add products to marketplace
- **Required Fields**:
  - Item Name
  - Description
  - Price
  - Stock Quantity
- **Auto-populated**: Seller ID and seller wallet address
- **Blockchain Event**: ITEM_METADATA_HASHED recorded
- **Location**: `/api/inventory` (POST)

### Update Item (Seller)

- **Feature**: Modify existing products
- **Editable**: Name, description, price, stock
- **Immutable**: Item ID, seller ID, seller wallet address
- **Location**: `/api/inventory` (PUT)

### List Items

- **Feature**: View all available products
- **Public Access**: All users can view marketplace
- **Pagination**: 5 items per page
- **Location**: `/api/inventory` (GET)

---

## Order Management

### Place Order (Buyer)

- **Feature**: Purchase items with quantity selection
- **Process**:
  1. Click "Purchase Now" on item
  2. **Quantity Selection Modal** appears:
     - Shows unit price and available stock
     - User can adjust quantity (1 to available stock)
     - Displays total amount
     - "Confirm Purchase" button
  3. After confirmation:
     - Validates wallet balance
     - Validates stock availability
     - Creates order
     - Deducts balance
     - Reduces stock
  4. **Invoice Modal** displays:
     - Item name
     - Quantity purchased
     - Unit price
     - Total amount
     - Order ID
     - Blockchain transaction hash
- **Blockchain Event**: ORDER_CREATED recorded
- **Location**: `/api/order` (POST)

### View Orders

- **Buyer View**: See all own orders with item names
- **Seller View**: See all orders for own items
- **Display**: Order ID, item name, quantity, total, status, timestamps
- **Pagination**: 5 orders per page
- **Location**: `/api/orders` (GET)

### Update Order Status

- **Seller Actions**:
  - Accept Order (PENDING → ACCEPTED)
  - Ship Order (ACCEPTED → SHIPPED)
- **Buyer Actions**:
  - Confirm Receipt (SHIPPED → DELIVERED, when "Out for Delivery")
- **Blockchain Event**: STATUS_UPDATE or DELIVERY_CONFIRMED recorded
- **Location**: `/api/orders` (POST with action: 'updateStatus')

---

## Shipment Tracking

### Update Shipment Location (Logistics)

- **Feature**: Track shipment progress
- **Status Updates**: Multiple location updates allowed
- **Status Examples**:
  - "Awaiting Seller Acceptance"
  - "In Transit to Buyer"
  - "Out for Delivery"
  - "Delivered"
- **Blockchain Event**: STATUS_UPDATE recorded for each change
- **Location**: `/api/shipments` (PUT)

### View Shipments

- **Logistics View**: All active shipments
- **Buyer/Seller View**: Shipments for their orders
- **Display**: Current status, last update, estimated arrival
- **Pagination**: 5 shipments per page
- **Location**: `/api/orders` (GET, includes shipments)

---

## Payment Management

### Collect Payment (Seller)

- **Feature**: Transfer funds from escrow to seller
- **Prerequisites**:
  - Order status: DELIVERED or CONFIRMED
  - Payment not already collected
- **Process**:
  - Transfers order amount to seller's wallet_balance
  - Marks order as payment_collected = true
- **Blockchain Event**: PAYMENT_RELEASED recorded
- **Location**: `/api/orders` (POST with action: 'collectPayment')

### Wallet Balance

- **Feature**: View and manage wallet balance
- **Display**: Current balance in user profile
- **Updates**: Automatically updated on order placement and payment collection
- **Location**: Displayed in profile, updated via transactions

---

## Blockchain Integration

### Event Recording

All critical events are recorded on blockchain:

1. **USER_IDENTITY_HASHED** (Type 5)
   - User registration
   - Hash includes: userId, role, walletAddress

2. **ITEM_METADATA_HASHED** (Type 4)
   - Item creation
   - Hash includes: itemId, sellerId, sellerWallet, name, description, price, stock

3. **ORDER_CREATED** (Type 0)
   - Order placement
   - Hash includes: orderId, amount, buyerId, buyerWallet, itemId, quantity

4. **STATUS_UPDATE** (Type 1)
   - Order status changes
   - Shipment location updates
   - Hash includes: orderId, status, updaterId

5. **DELIVERY_CONFIRMED** (Type 2)
   - Buyer confirms receipt
   - Hash includes: orderId, buyerId, timestamp

6. **PAYMENT_RELEASED** (Type 3)
   - Seller collects payment
   - Hash includes: orderId, amount, sellerId

### Blockchain Hash Viewer

- **Feature**: Search and view blockchain proofs
- **Search By**:
  - Transaction hash
  - Entity ID (user, item, order, shipment)
  - Wallet address
  - Data hash
- **Display**: Complete proof details with copy buttons
- **Location**: "View on Blockchain" page

### Blockchain Event Stream

- **Feature**: Real-time view of blockchain events
- **Adjustable Height**: 200px to 800px
- **Display**: All events from Hardhat local node
- **Location**: Bottom of dashboard

---

## User Profile

### Profile Display

- **View Mode**:
  - Name, Email, Role (with colored badges)
  - Wallet Address (read-only, copy button)
  - Wallet Balance
  - Contact Number
  - Address
  - Created & Updated timestamps

### Profile Editing

- **Editable Fields**:
  - Name
  - Email
  - Contact Number
  - Address
- **Read-Only Fields**:
  - Wallet Address (immutable blockchain identity)
  - Role (immutable account classification)
  - User ID (immutable identifier)
- **Save/Cancel**: Update with validation

---

## Wallet Management

### Wallet Address

- **Auto-Generation**: Created during signup
- **Format**: Ethereum address (0x + 40 hex characters)
- **Immutable**: Cannot be changed after creation
- **Uniqueness**: Database-enforced UNIQUE constraint
- **Usage**: Blockchain identity for all transactions

### Wallet Balance

- **Initial**: 0.00 for new users
- **Updates**: 
  - Decreased on order placement
  - Increased on payment collection (for sellers)
- **Display**: Formatted with currency symbol
- **Type**: NUMERIC(20, 2) in database

---

## UI Features

### Pagination

- **Components**: OrderList, Inventory, ShipmentManager
- **Items Per Page**: 5
- **Features**:
  - Previous/Next buttons
  - Page number display
  - Item count ("Showing X to Y of Z items")
  - Smooth scroll to top

### Quantity Selection Modal

- **Trigger**: Click "Purchase Now" button
- **Features**:
  - Unit price display
  - Available stock display
  - Quantity input (min: 1, max: available stock)
  - Real-time total calculation
  - Validation (balance, stock)
  - Confirm/Cancel buttons

### Invoice Display

- **Trigger**: After successful order placement
- **Features**:
  - Item name
  - Quantity purchased
  - Unit price
  - Total amount
  - Order ID
  - Blockchain transaction hash
  - Copy buttons for IDs and hashes
  - Close button

### Dashboard Stats (Seller)

- **Display**: Order statistics
  - Pending Accept count
  - In-Process count
  - Delivered count
  - Total Order count
- **Location**: Order Management page

### Responsive Design

- **Mobile**: Optimized layouts
- **Tablet**: Adaptive grid layouts
- **Desktop**: Full feature display

### Error Handling

- **User-Friendly Messages**: Clear error descriptions
- **Validation**: Client and server-side validation
- **Loading States**: Spinner indicators during operations
- **Success Feedback**: Confirmation messages

---

## Feature Summary Table

| Feature | User Role | Endpoint | Blockchain Event |
|---------|-----------|----------|------------------|
| Sign Up | All | POST /api/auth/signup | USER_IDENTITY_HASHED |
| Login | All | POST /api/auth/route | - |
| View Profile | All | GET /api/profile | - |
| Edit Profile | All | PUT /api/profile | - |
| Create Item | SELLER | POST /api/inventory | ITEM_METADATA_HASHED |
| Update Item | SELLER | PUT /api/inventory | - |
| List Items | All | GET /api/inventory | - |
| Place Order | BUYER | POST /api/order | ORDER_CREATED |
| View Orders | All | GET /api/orders | - |
| Update Status | SELLER/BUYER | POST /api/orders | STATUS_UPDATE |
| Update Shipment | LOGISTICS | PUT /api/shipments | STATUS_UPDATE |
| Collect Payment | SELLER | POST /api/orders | PAYMENT_RELEASED |
| View Blockchain | All | GET /api/blockchain-proofs | - |

---

## Future Enhancements

Potential features for future development:

- [ ] Email notifications
- [ ] Order cancellation
- [ ] Refund processing
- [ ] Product reviews and ratings
- [ ] Advanced search and filtering
- [ ] Export order history
- [ ] Multi-currency support
- [ ] Integration with external payment gateways
- [ ] Mobile app
- [ ] Real-time chat support

---

**All features are production-ready and fully tested.** ✅

