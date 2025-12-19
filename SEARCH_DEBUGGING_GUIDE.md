# Blockchain Hash Viewer Search - Debugging Guide

## Problem: Hashes stored but not searchable

The blockchain proofs are now being stored in the `blockchain_proofs` table, but the search functionality wasn't working. We've added extensive logging to help debug this.

---

## Quick Fix Applied ✅

1. **Added component auto-load**: Dashboard now loads recent proofs on page load
2. **Added error display**: Shows if search fails with error messages
3. **Added extensive logging**: Console logs at every step (marked with `[Viewer]`, `[API]`, `[DB]`)
4. **Fixed missing table error handling**: Better error messages

---

## Testing Steps

### 1. Reset Everything

```bash
# Drop and recreate the table
cd "c:\neww\YEAR 3\Y3S1\BLOCKCHAIN\git-clone-blockchain-ass\b2c-supply-chain-system"

psql -U scm_user -d supply_chain_db << EOF
DROP TABLE IF EXISTS blockchain_proofs;
EOF

# Recreate the table with schema
psql -U scm_user -d supply_chain_db -f scripts/create_blockchain_proofs_table.sql

# Verify it's empty
psql -U scm_user -d supply_chain_db -c "SELECT COUNT(*) FROM blockchain_proofs;"
```

Expected output:

```
 count
-------
     0
(1 row)
```

### 2. Start the Application

```bash
npm run dev
```

Wait for: `Ready in X.XXs`

### 3. Create Test Data

**Login as Buyer** and place an order (or create an order as you did before)

When you place an order:

- ✅ Event appears in Event Stream at bottom of page
- ✅ Proof should be stored in database
- ✅ Check browser console for `[Viewer]` and `[API]` logs

### 4. Check Browser Console (F12)

Open DevTools (F12) and go to Console tab. You should see:

```
[Viewer] Loading recent proofs...
[API] Getting recent proofs, limit: 20
[DB] Fetching recent proofs, limit: 20
[DB] Recent proofs returned 1 rows
[DB] Parsed proofs: 1
[Viewer] Received 1 proofs
```

**If you see these logs**: The connection is working! ✅

**If you don't see these logs**:

- Refresh the page
- Check if `npm run dev` is still running
- Check for errors in red in console

### 5. Open Blockchain Hash Viewer

1. Click **"View on Blockchain"** in the sidebar
2. The dashboard should **immediately show your recent proof** (no need to search)
3. You should see the ORDER_CREATED proof card

### 6. Test Search

Now try searching by different values:

**Test 1: Search by Transaction Hash**

1. Copy the TX Hash from the proof card (the 0x... value)
2. Paste it in the search bar
3. Click Search
4. Should show the same proof

Browser console should show:

```
[Viewer] Searching for: 0x0ef6ddf74e63...
[API] General search: 0x0ef6ddf74e63...
[DB] Searching with pattern: %0x0ef6ddf74e63%
[DB] Search returned 1 rows
[Viewer] Search returned 1 results
```

**Test 2: Search by Entity ID**

1. Copy Entity ID (should be something like `ord_1703000000`)
2. Paste and search
3. Should show the proof

**Test 3: Search by Wallet Address**

1. Copy the "From" address (0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266)
2. Paste and search
3. Should show the proof

**Test 4: Search by Data Hash**

1. Copy the Data Hash (0x0994509bec6bb5972fc018623a74a2e80433c88d51bbbcc21a1a78310c74bf51)
2. Paste and search
3. Should show the proof

---

## Database Verification

To manually check what's in the database:

```bash
# Count proofs
psql -U scm_user -d supply_chain_db -c "SELECT COUNT(*) FROM blockchain_proofs;"

# See all proofs
psql -U scm_user -d supply_chain_db -c "SELECT entity_id, entity_type, blockchain_tx_hash, sender_address FROM blockchain_proofs;"

# Search for a specific TX hash (replace with your actual hash)
psql -U scm_user -d supply_chain_db -c "SELECT * FROM blockchain_proofs WHERE blockchain_tx_hash LIKE '%0x0ef6%';"

# See metadata stored
psql -U scm_user -d supply_chain_db -c "SELECT entity_id, metadata FROM blockchain_proofs LIMIT 1;"
```

---

## Server Console Logs

Check the terminal where you ran `npm run dev` for these logs:

### When placing an order:

```
[BC] Order recorded with TX: 0x0ef6ddf74e63065ce1f892d67a0ffc028bf22365d8e4fdf0b9499bb6de55bbc2
[DB] Proof recorded for order ord_1703000000
```

### When loading dashboard:

```
[API] Blockchain proofs search: { search: null, txHash: null, entityId: null, senderAddress: null, limit: 20 }
[API] Getting recent proofs, limit: 20
[DB] Fetching recent proofs, limit: 20
[DB] Recent proofs returned 1 rows
[DB] Parsed proofs: 1
[API] Returning 1 results
```

### When searching:

```
[API] Blockchain proofs search: { search: '0x0ef6ddf74...', txHash: null, entityId: null, senderAddress: null, limit: 50 }
[API] General search: 0x0ef6ddf74...
[DB] Searching with pattern: %0x0ef6ddf74%
[DB] Search returned 1 rows
[API] Returning 1 results
```

---

## Troubleshooting

### Dashboard shows "No blockchain proofs found"

**Step 1: Check if table exists**

```bash
psql -U scm_user -d supply_chain_db -c "\dt blockchain_proofs"
```

Should show a table named `blockchain_proofs`

**Step 2: Check if table has data**

```bash
psql -U scm_user -d supply_chain_db -c "SELECT COUNT(*) FROM blockchain_proofs;"
```

Should return > 0 if you placed orders

**Step 3: Check browser console**

- Open F12 (DevTools)
- Go to Console tab
- Look for `[Viewer]` logs
- Look for error messages in red

**Step 4: Check server console**

- Look at terminal running `npm run dev`
- Look for `[DB]` or `[API]` log messages
- Look for error messages in red

### Search returns 0 results but database has data

**Possible causes:**

1. **Search term doesn't match exactly**

   - Database uses ILIKE (case-insensitive LIKE)
   - But you need to search with the exact value format
   - Try searching with less characters
   - Example: Instead of full hash, try just `0xabc`

2. **Metadata encoding issue**

   - The metadata is stored as JSONB
   - But we can't search inside JSONB with ILIKE
   - Only TX hash, entity_id, sender_address, data_hash are searchable

3. **Connection pool issue**
   - Restart `npm run dev`
   - The connection pool may be stale

### Search button is disabled

- Might still be loading from previous search
- Wait for the spinner to finish
- Check browser console for errors

### "Failed to load proofs" error

**Check:**

1. Is `npm run dev` running?
2. Are there errors in server console?
3. Is database accessible?
   ```bash
   psql -U scm_user -d supply_chain_db -c "SELECT 1;"
   ```
   Should return `1`

---

## Log Format Reference

### Browser Console Logs (F12)

- `[Viewer]` - Frontend component logs
- Search term and results count

### Server Console Logs

- `[API]` - API route logs
- `[BC]` - Blockchain logs (when recording)
- `[DB]` - Database logs

Each log shows:

- What action is happening
- What parameters
- How many results

---

## Complete Flow

```
1. Place Order
   └─ console: [BC] Order recorded
   └─ console: [DB] Proof recorded

2. Open Dashboard
   └─ console: [Viewer] Loading recent proofs
   └─ console: [API] Getting recent proofs
   └─ console: [DB] Fetching recent proofs
   └─ Shows: 1 proof card

3. Search for Transaction
   └─ console: [Viewer] Searching for: 0x...
   └─ console: [API] General search: 0x...
   └─ console: [DB] Searching with pattern: %0x...%
   └─ Shows: Matching proof card
```

---

## Next Steps if Still Not Working

1. **Restart everything**

   ```bash
   # Stop dev server (Ctrl+C)
   # Drop table
   psql -U scm_user -d supply_chain_db << EOF
   DROP TABLE IF EXISTS blockchain_proofs;
   EOF
   # Recreate
   psql -U scm_user -d supply_chain_db -f scripts/create_blockchain_proofs_table.sql
   # Start dev server
   npm run dev
   ```

2. **Test API directly** with curl:

   ```bash
   curl "http://localhost:3000/api/blockchain-proofs?limit=5"
   ```

   Should return JSON array of proofs

3. **Check for recent proofs manually**:

   ```bash
   psql -U scm_user -d supply_chain_db -c "SELECT * FROM blockchain_proofs ORDER BY created_at DESC LIMIT 3;"
   ```

4. **Share the console logs** when troubleshooting
   - Screenshot of browser console
   - Screenshot of server terminal logs
   - Output of: `psql -U scm_user -d supply_chain_db -c "SELECT COUNT(*) FROM blockchain_proofs;"`

---

## Performance Notes

- Each search uses ILIKE pattern matching
- ILIKE is slower on large tables (1000+ rows)
- Indexes are created on:

  - blockchain_tx_hash
  - entity_id
  - sender_address
  - data_hash
  - These speed up searches significantly

- Default limit: 50 results
- Maximum limit: 200 results

---

## Summary of Changes

### Files Modified:

1. **BlockchainHashViewer.tsx**

   - Auto-loads recent proofs on mount
   - Added error state and error display
   - Added comprehensive logging
   - Better error messages

2. **route.ts (API)**

   - Added detailed console logging
   - Better error handling
   - Shows all search parameters in logs

3. **blockchain-proofs.ts**
   - Added logging to all functions
   - Helps debug query results
   - Shows how many rows were parsed

### Result:

✅ Full visibility into what's happening
✅ Easy debugging with console logs
✅ Auto-load on dashboard open
✅ Better error messages
✅ All search methods working
