# Testing the Blockchain Dashboard Feature

## Problem We Fixed ✅

The blockchain proofs were being **recorded on-chain** (you could see them in the Event Stream), but they were **NOT stored in the `blockchain_proofs` table**. This meant the dashboard search feature had no data to display.

**Root Cause**: The `recordBlockchainProof()` function was never being called when orders and shipments were created.

**Solution**: Added explicit calls to `recordBlockchainProof()` in:

- `lib/db/transactions.ts` → When orders are created
- `lib/db/shipment-management.ts` → When shipments are updated

---

## Step-by-Step Testing Guide

### 1. Database Setup

First, recreate the `blockchain_proofs` table:

```bash
cd c:\neww\YEAR 3\Y3S1\BLOCKCHAIN\git-clone-blockchain-ass\b2c-supply-chain-system
psql -U scm_user -d supply_chain_db -f scripts/create_blockchain_proofs_table.sql
```

Verify the table is empty:

```bash
psql -U scm_user -d supply_chain_db -c "SELECT COUNT(*) FROM blockchain_proofs;"
```

Expected output: `count = 0`

---

### 2. Start the Application

```bash
npm run dev
```

Wait for compilation to complete (should show "Ready in X.XXs").

---

### 3. Create Test Accounts (If Needed)

Open browser: `http://localhost:3000`

Create accounts if you don't have them:

**Account 1 - Buyer:**

- Name: John Buyer
- Email: buyer@test.com
- Password: Test123!
- Role: Buyer
- Address: 123 Main St (REQUIRED for Buyers)

**Account 2 - Seller:**

- Name: Jane Seller
- Email: seller@test.com
- Password: Test123!
- Role: Seller
- Address: (OPTIONAL - leave blank or fill)

**Account 3 - Logistics:**

- Name: Bob Logistics
- Email: logistics@test.com
- Password: Test123!
- Role: Logistics Provider
- Address: (OPTIONAL - leave blank or fill)

---

### 4. Create an Item (as Seller)

Login as Seller (`seller@test.com`):

1. Click "Manage Inventory" in sidebar
2. Fill in:
   - Item Name: "Test Product"
   - Description: "Testing blockchain dashboard"
   - Price: 100
   - Stock: 5
3. Click "Add Item"

**Wait 2 seconds** for the item to be stored.

---

### 5. Place an Order (as Buyer)

Logout and login as Buyer (`buyer@test.com`):

1. Click "Marketplace"
2. You should see "Test Product" with a **gradient placeholder** (no image)
3. Click "Buy"
4. Confirm the order

**This triggers**:

- ✅ Event recorded on blockchain (visible in Event Stream)
- ✅ Proof recorded in `blockchain_proofs` table (NEW!)

---

### 6. Check the Event Stream

1. Still in Marketplace or any page, scroll to the bottom
2. Find "Hardhat Local Node - Event Stream"
3. You should see an entry like:

```
ORDER_CREATED
5:47:45 PM
TX Hash: 0x0ef6ddf74e63065ce1f892d67a0ffc028bf22365d8e4fdf0b9499bb6de55bbc2
Data Hash: 0x0994509bec6bb5972fc018623a74a2e80433c88d51bbbcc21a1a78310c74bf51
From: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

---

### 7. View the Dashboard (NEW!)

Now the magic happens:

1. Click **"View on Blockchain"** in the sidebar (new menu item)
2. You should see the dashboard with:
   - Search bar at top
   - Your ORDER_CREATED proof displayed as a card

**Card shows**:

- Entity Type: ORDER
- Event Type: ORDER_CREATED
- TX Hash: (the hash from Event Stream)
- Data Hash: (the hash from Event Stream)
- From: (wallet address)
- Metadata: JSON showing buyer_id, item_id, amount, quantity, seller_id

---

### 8. Test Dashboard Search Features

### Search by Transaction Hash:

1. Copy the TX Hash from the proof card (or from Event Stream)
2. Paste it in the search bar
3. Click search or press Enter
4. The proof should appear ✅

### Search by Wallet Address:

1. Copy the wallet address from the proof card
2. Paste it in the search bar
3. Results should show all proofs from that wallet

### Search by Entity ID:

1. Copy the Order ID (should be visible in metadata)
2. Paste it in the search bar
3. Results should show proofs related to that order

### Search by Data Hash:

1. Copy the Data Hash
2. Paste it in the search bar
3. Results should show

---

### 9. Test Shipment Status Update (Optional)

To create a SHIPMENT_STATUS_UPDATE proof:

1. Login as Logistics (`logistics@test.com`)
2. Click "Shipment Management"
3. Find the shipment for the order you created
4. Click the input box in "Update Status" column
5. Type: "In Transit"
6. Click "Update Location"

**This triggers**:

- Event recorded on blockchain
- ✅ **Proof recorded in `blockchain_proofs` table**

Now refresh the dashboard:

- You should see 2 proofs: ORDER_CREATED and SHIPMENT_STATUS_UPDATE

---

## Database Verification

To verify proofs are being stored, run this SQL command:

```bash
psql -U scm_user -d supply_chain_db -c "SELECT entity_id, entity_type, event_type, blockchain_tx_hash FROM blockchain_proofs ORDER BY created_at DESC LIMIT 10;"
```

Expected output:

```
 entity_id       | entity_type | event_type |               blockchain_tx_hash
-----------------+-------------+------------+------------------------------------------
 ord_1703000000  | ORDER       |          0 | 0x0ef6ddf74e63065ce1f892d67a0ffc028bf22365...
 shp_1703000001  | SHIPMENT    |          1 | 0xabcdef1234567890abcdef1234567890abcdef12...
```

If you see rows here, **the fix is working!** ✅

---

## Complete Flow Diagram

```
1. Place Order
   ↓
2. recordEventOnChain()
   ├→ Event appears in Event Stream ✓ (was working)
   └→ Returns TX Hash
   ↓
3. recordBlockchainProof() [NEW]
   └→ Stores proof in blockchain_proofs table ✓ (NOW FIXED!)
   ↓
4. Refresh Dashboard
   └→ Proof appears in search results ✓
```

---

## Troubleshooting

### Dashboard shows no results:

**Check the database**:

```bash
psql -U scm_user -d supply_chain_db -c "SELECT COUNT(*) FROM blockchain_proofs;"
```

If count = 0:

- Check server console for errors (look for `[DB] Proof recorded` logs)
- Verify order was actually created (check Orders in database)
- Ensure table was created with correct schema

### Event Stream shows event but dashboard is empty:

1. Check server console logs for:
   ```
   [DB] Proof recorded for order ord_...
   ```
2. If you don't see this log, the `recordBlockchainProof()` call failed silently
   - Check for database connection errors
   - Verify blockchain_proofs table exists

### Search returns no results:

- Try searching with exact TX Hash (copy-paste from card)
- Check that the search term exists in the database row:
  ```bash
  psql -U scm_user -d supply_chain_db -c "SELECT blockchain_tx_hash FROM blockchain_proofs LIMIT 1;"
  ```
- Paste that hash in the search bar

---

## Key Changes Made

### File: `lib/db/transactions.ts`

- Added import: `recordBlockchainProof`
- After `recordEventOnChain()`, now calls `recordBlockchainProof()` with:
  - entityId: orderId
  - entityType: "ORDER"
  - eventType: EVENT_ORDER_CREATED (0)
  - dataHash, txHash, senderAddress
  - metadata: buyer_id, item_id, amount, quantity, seller_id

### File: `lib/db/shipment-management.ts`

- Added import: `recordBlockchainProof`
- After `recordEventOnChain()`, now calls `recordBlockchainProof()` with:
  - entityId: shipmentId
  - entityType: "SHIPMENT"
  - eventType: EVENT_STATUS_UPDATE (1)
  - dataHash, txHash, senderAddress
  - metadata: order_id, new_location, updater_id

---

## Next Steps

1. ✅ Place multiple orders
2. ✅ Update shipment statuses
3. ✅ Search for proofs by different criteria
4. ✅ Export proofs (future feature)
5. ✅ Real-time updates (future feature)

---

## Questions?

- Check the browser console (F12) for frontend errors
- Check the server console for backend logs with `[BC]` and `[DB]` prefixes
- Verify database connectivity with: `psql -U scm_user -d supply_chain_db -c "SELECT 1;"`
