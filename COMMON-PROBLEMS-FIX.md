# Common Problems & Fixes

Solutions to common issues encountered when using the B2C Supply Chain System.

## Table of Contents

- [Database Issues](#database-issues)
- [Blockchain Issues](#blockchain-issues)
- [Application Issues](#application-issues)
- [Order & Payment Issues](#order--payment-issues)
- [Profile & Wallet Issues](#profile--wallet-issues)
- [API Issues](#api-issues)

---

## Database Issues

### Problem: Connection Refused

**Error Message**:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**:
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT version();"

# If not running, start it:
# macOS:
brew services start postgresql@14

# Linux:
sudo systemctl start postgresql

# Windows:
# Start PostgreSQL service from Services panel
```

**Verify**:
```bash
psql -U spc_user -d supply-chain-test -c "SELECT 1;"
```

---

### Problem: Database Does Not Exist

**Error Message**:
```
Error: database "supply-chain-test" does not exist
```

**Solution**:
```bash
# Create database
psql -U postgres -c 'CREATE DATABASE "supply-chain-test";'

# Run setup script
psql -U postgres -d supply-chain-test -f scripts/setup_db_complete.sql

# Verify
psql -U spc_user -d supply-chain-test -c "\dt"
```

---

### Problem: User Does Not Exist

**Error Message**:
```
Error: role "spc_user" does not exist
```

**Solution**:
```bash
# Create user manually
psql -U postgres -c "CREATE ROLE spc_user LOGIN PASSWORD '123456';"

# Grant privileges
psql -U postgres -c 'GRANT ALL PRIVILEGES ON DATABASE "supply-chain-test" TO spc_user;'

# Or run complete setup script
psql -U postgres -d supply-chain-test -f scripts/setup_db_complete.sql
```

---

### Problem: Table Does Not Exist

**Error Message**:
```
Error: relation "users" does not exist
```

**Solution**:
```bash
# Run setup script
psql -U postgres -d supply-chain-test -f scripts/setup_db_complete.sql

# Verify tables exist
psql -U spc_user -d supply-chain-test -c "\dt"
```

---

### Problem: Foreign Key Violation

**Error Message**:
```
Error: insert or update on table "orders" violates foreign key constraint
```

**Solution**:
```bash
# Ensure referenced entities exist
psql -U spc_user -d supply-chain-test -c "SELECT id FROM users WHERE role = 'LOGISTICS' LIMIT 1;"

# If no logistics user exists, create one via signup
# Or check item exists before creating order
psql -U spc_user -d supply-chain-test -c "SELECT id FROM items LIMIT 1;"
```

---

## Blockchain Issues

### Problem: Hardhat Node Not Running

**Error Message**:
```
Error: connect ECONNREFUSED 127.0.0.1:8545
```

**Solution**:
```bash
# Start Hardhat node in Terminal 1
npx hardhat node

# Keep terminal open!
# Verify it's running:
curl http://127.0.0.1:8545
```

**Command to Run**:
```bash
npx hardhat node
```

---

### Problem: Invalid Contract Address

**Error Message**:
```
Error: InvalidAddressError: Invalid address
```

**Solution**:
```bash
# 1. Deploy contract
npx hardhat run scripts/deploy.ts --network localhost

# 2. Copy contract address from output
# Example: OrderTracker deployed to: 0x5FbDB2315678afec8c3562b921AA65B2eB42d14A

# 3. Update .env file
CONTRACT_ADDRESS=0x5FbDB2315678afec8c3562b921AA65B2eB42d14A

# 4. Update lib/blockchain.ts
const CONTRACT_ADDRESS: Address = getAddress('0x5FbDB2315678afec8c3562b921AA65B2eB42d14A');

# 5. Restart Next.js server
npm run dev
```

---

### Problem: No Accounts Available

**Error Message**:
```
Error: No accounts available
```

**Solution**:
```bash
# Hardhat node was restarted, accounts reset
# Redeploy contract:
npx hardhat run scripts/deploy.ts --network localhost

# Update CONTRACT_ADDRESS in .env and lib/blockchain.ts
# Restart Next.js server
```

---

### Problem: Transaction Failed

**Error Message**:
```
Error: Blockchain transaction failed
```

**Solution**:
```bash
# Check Hardhat node is running
npx hardhat node

# Verify contract address is correct
# Check .env CONTRACT_ADDRESS matches deployed address

# Check network configuration
# Ensure NEXT_PUBLIC_BLOCKCHAIN_NETWORK=hardhat in .env
```

---

## Application Issues

### Problem: Module Not Found

**Error Message**:
```
Error: Cannot find module 'xxx'
```

**Solution**:
```bash
# Install dependencies
npm install

# Verify installation
npm list --depth=0

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

### Problem: Port Already in Use

**Error Message**:
```
Error: Port 3000 is already in use
```

**Solution**:
```bash
# macOS/Linux: Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev

# Windows: Find and kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

### Problem: TypeScript Errors

**Error Message**:
```
Error: Type 'string' is not assignable to type 'number'
```

**Solution**:
```bash
# Check type definitions match database schema
# Common issue: wallet_balance needs Number() conversion

# Verify in lib/db/users.ts and lib/db/wallet-management.ts
# Ensure: wallet_balance: Number(user.wallet_balance)

# Rebuild
npm run build
```

---

### Problem: Build Fails

**Error Message**:
```
Error: Build failed with errors
```

**Solution**:
```bash
# Check for TypeScript errors
npx tsc --noEmit

# Fix errors reported
# Common fixes:
# - Add missing type conversions
# - Fix import paths
# - Update type definitions

# Rebuild
npm run build
```

---

## Order & Payment Issues

### Problem: Insufficient Funds

**Error Message**:
```
Error: Insufficient wallet balance
```

**Solution**:
```bash
# Check current balance
psql -U spc_user -d supply-chain-test -c "SELECT id, wallet_balance FROM users WHERE id = 'user_id';"

# Add funds (if needed, update directly in database for testing)
psql -U spc_user -d supply-chain-test -c "UPDATE users SET wallet_balance = 10000 WHERE id = 'user_id';"

# Or create new buyer account with higher initial balance
# Or use wallet management feature to deposit funds
```

**Command**:
```sql
UPDATE users SET wallet_balance = 10000 WHERE id = 'your_user_id';
```

---

### Problem: Insufficient Stock

**Error Message**:
```
Error: Requested quantity exceeds available stock
```

**Solution**:
```bash
# Check current stock
psql -U spc_user -d supply-chain-test -c "SELECT id, stock FROM items WHERE id = 'item_id';"

# Increase stock
psql -U spc_user -d supply-chain-test -c "UPDATE items SET stock = 100 WHERE id = 'item_id';"

# Or reduce order quantity
```

**Command**:
```sql
UPDATE items SET stock = 100 WHERE id = 'your_item_id';
```

---

### Problem: No Logistics Provider

**Error Message**:
```
Error: No Logistics Provider available
```

**Solution**:
```bash
# Create logistics user via signup page
# Or check if exists:
psql -U spc_user -d supply-chain-test -c "SELECT id FROM users WHERE role = 'LOGISTICS' LIMIT 1;"

# If none exists, create via signup with role LOGISTICS
```

---

### Problem: Order Status Not Updating

**Error Message**:
```
Order status remains unchanged
```

**Solution**:
```bash
# Check order exists
psql -U spc_user -d supply-chain-test -c "SELECT order_id, order_status FROM orders WHERE order_id = 'order_id';"

# Verify user has permission to update
# Seller can only accept/ship
# Buyer can only confirm receipt when "Out for Delivery"

# Check shipment status for buyer confirmation
psql -U spc_user -d supply-chain-test -c "SELECT current_status FROM shipments WHERE order_id = 'order_id';"
```

---

## Profile & Wallet Issues

### Problem: Wallet Balance toFixed Error

**Error Message**:
```
Error: wallet_balance.toFixed is not a function
```

**Solution**:
```bash
# This is a type conversion issue
# Verify lib/db/users.ts has:
wallet_balance: Number(user.wallet_balance)

# Verify lib/db/wallet-management.ts has:
wallet_balance: Number(user.wallet_balance)

# Restart server after fix
npm run dev
```

**Code Fix**:
```typescript
// In database query functions, ensure:
return {
  ...user,
  wallet_balance: Number(user.wallet_balance),
} as User;
```

---

### Problem: Cannot Update Wallet Address

**Error Message**:
```
Error: Cannot modify wallet_address
```

**Solution**:
```bash
# This is by design - wallet address is immutable
# Wallet address cannot be changed after account creation
# If you need a new wallet, create a new account

# Verify in code: lib/db/users.ts should reject wallet_address updates
```

**Note**: Wallet address is immutable for blockchain identity integrity.

---

### Problem: Profile Update Fails

**Error Message**:
```
Error: Failed to update profile
```

**Solution**:
```bash
# Check user exists
psql -U spc_user -d supply-chain-test -c "SELECT id FROM users WHERE id = 'user_id';"

# Verify not trying to update immutable fields
# Immutable: wallet_address, role, id

# Check API response in browser console
# Verify PUT /api/profile request format
```

**Valid Update**:
```json
{
  "userId": "user_id",
  "updates": {
    "name": "New Name",
    "email": "new@example.com",
    "contact_number": "+1-555-1234",
    "address": "New Address"
  }
}
```

---

## API Issues

### Problem: 401 Unauthorized

**Error Message**:
```
Error: 401 Unauthorized
```

**Solution**:
```bash
# User not logged in or session expired
# Login again:
POST /api/auth/route

# Verify user session in localStorage
# Check browser console for session data
```

---

### Problem: 403 Forbidden

**Error Message**:
```
Error: 403 Forbidden
```

**Solution**:
```bash
# Insufficient permissions
# Verify user role matches required role:
# - Sellers can only manage own items
# - Buyers can only place orders
# - Logistics can only update shipments

# Check user role:
psql -U spc_user -d supply-chain-test -c "SELECT id, role FROM users WHERE id = 'user_id';"
```

---

### Problem: 404 Not Found

**Error Message**:
```
Error: 404 Not Found
```

**Solution**:
```bash
# Resource doesn't exist
# Verify resource ID:
psql -U spc_user -d supply-chain-test -c "SELECT order_id FROM orders WHERE order_id = 'order_id';"

# Check API endpoint URL is correct
# Verify resource belongs to user (for user-specific resources)
```

---

### Problem: 500 Internal Server Error

**Error Message**:
```
Error: 500 Internal Server Error
```

**Solution**:
```bash
# Check server logs in terminal
# Common causes:
# - Database connection issue
# - Blockchain connection issue
# - Type conversion error
# - Missing required data

# Check database connection
psql -U spc_user -d supply-chain-test -c "SELECT 1;"

# Check Hardhat node
curl http://127.0.0.1:8545

# Review error details in Next.js terminal
```

---

## Quick Fix Commands

### Reset Everything

```bash
# 1. Stop all services (Ctrl+C)

# 2. Drop and recreate database
psql -U postgres -c 'DROP DATABASE IF EXISTS "supply-chain-test";'
psql -U postgres -c 'CREATE DATABASE "supply-chain-test";'
psql -U postgres -d supply-chain-test -f scripts/setup_db_complete.sql

# 3. Restart Hardhat node (new accounts)
npx hardhat node

# 4. Redeploy contract
npx hardhat run scripts/deploy.ts --network localhost

# 5. Update CONTRACT_ADDRESS in .env and lib/blockchain.ts

# 6. Restart Next.js
npm run dev
```

### Verify Setup

```bash
# Database
psql -U spc_user -d supply-chain-test -c "\dt"

# Blockchain
curl http://127.0.0.1:8545

# Application
curl http://localhost:3000
```

### Common Database Fixes

```sql
-- Add funds to user
UPDATE users SET wallet_balance = 10000 WHERE id = 'user_id';

-- Increase item stock
UPDATE items SET stock = 100 WHERE id = 'item_id';

-- Check user role
SELECT id, role FROM users WHERE email = 'email@example.com';

-- View orders
SELECT order_id, order_status, total_amount FROM orders;

-- View shipments
SELECT shipment_id, current_status FROM shipments;
```

---

## Still Having Issues?

1. **Check Logs**: Review terminal output for detailed errors
2. **Browser Console**: Check F12 console for frontend errors
3. **Database**: Verify data exists and is correct
4. **Blockchain**: Ensure Hardhat node is running
5. **Environment**: Verify .env file is configured correctly

For additional help, refer to:
- [SETUP.md](./SETUP.md) for setup issues
- [API-GUIDE.md](./API-GUIDE.md) for API problems
- [SYSTEM-FEATURE.md](./SYSTEM-FEATURE.md) for feature questions

---

**Most issues can be resolved by verifying database connection, Hardhat node status, and environment configuration.**

