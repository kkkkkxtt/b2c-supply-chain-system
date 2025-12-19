# Comprehensive Setup Guide

Complete setup instructions for the B2C Supply Chain System.

## Table of Contents

1. [Environment Setup](#1-environment-setting)
2. [Repository Clone](#2-repo-clone)
3. [Dependencies Management](#3-dependencies-management)
4. [Setup Local Database (PostgreSQL)](#4-setup-local-database-postgresql)
5. [Setup Local Blockchain (Hardhat Local Node)](#5-setup-local-blockchain-hardhat-local-node)
6. [How to Run the Application](#6-how-to-run-the-application)
7. [Work Flow to Test](#7-work-flow-to-test)
8. [Simple Troubleshooting](#8-simple-troubleshooting)

---

## 1. Environment Setting

### Prerequisites

Ensure you have the following installed:

- **Node.js** (v18 or later)
- **Git**
- **PostgreSQL** (v14 or later)
- **npm** or **yarn**

### Verify Installation

```bash
node --version    # Should be v18+
npm --version     # Should be v8+
psql --version    # Should be v14+
git --version
```

---

## 2. Repo Clone

### Clone Repository

```bash
git clone <repository-url>
cd b2c-supply-chain-system
```

### Verify Repository Structure

```bash
ls -la
# Should see: app/, components/, lib/, scripts/, contracts/, etc.
```

---

## 3. Dependencies Management

### Install Dependencies

```bash
npm install
```

### Verify Installation

```bash
npm list --depth=0
# Should show all dependencies installed
```

### Key Dependencies

- `next`: Next.js framework
- `react`: React library
- `typescript`: TypeScript compiler
- `pg`: PostgreSQL client
- `hardhat`: Ethereum development environment
- `viem`: Ethereum library
- `ethers`: Ethereum utilities
- `bcrypt`: Password hashing
- `tailwindcss`: CSS framework

---

## 4. Setup Local Database (PostgreSQL)

### Step 1: Start PostgreSQL Service

**macOS (Homebrew):**
```bash
brew services start postgresql@14
```

**Linux:**
```bash
sudo systemctl start postgresql
```

**Windows:**
- Start PostgreSQL service from Services panel

### Step 2: Create Database and User

Run the complete setup script:

```bash
# Connect as postgres superuser
psql -U postgres

# Create database (if needed)
CREATE DATABASE "supply-chain-test";

# Run setup script
\i scripts/setup_db_complete.sql

# Or run directly:
psql -U postgres -d supply-chain-test -f scripts/setup_db_complete.sql
```

### Step 3: Verify Database Setup

```bash
psql -U spc_user -d supply-chain-test

# Check tables
\dt

# Should see: users, items, orders, shipments, blockchain_proofs

# Check users table structure
\d users

# Exit
\q
```

### Step 4: Configure Environment Variables

Create `.env` file in root directory:

```env
# Database Configuration
DB_USER=spc_user
DB_PASSWORD=123456
DB_HOST=localhost
DB_NAME=supply-chain-test
DB_PORT=5432

# Or use DATABASE_URL format
DATABASE_URL=postgresql://spc_user:123456@localhost:5432/supply-chain-test

# Blockchain Configuration
NEXT_PUBLIC_BLOCKCHAIN_NETWORK=hardhat
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
NEXT_PUBLIC_HARDHAT_RPC_URL=http://127.0.0.1:8545

# Contract Address (will be set after deployment)
CONTRACT_ADDRESS=
```

---

## 5. Setup Local Blockchain (Hardhat Local Node)

### Step 1: Start Hardhat Node

**Open Terminal 1** and run:

```bash
npx hardhat node
```

**Expected Output:**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
...
```

**Keep this terminal open!** This is your local blockchain running.

### Step 2: Deploy Smart Contract

**Open Terminal 2** and run:

```bash
npx hardhat run scripts/deploy.ts --network localhost
```

**Expected Output:**
```
OrderTracker deployed to: 0x5FbDB2315678afec8c3562b921AA65B2eB42d14A
```

### Step 3: Update Contract Address

Copy the contract address and update `.env`:

```env
CONTRACT_ADDRESS=0x5FbDB2315678afec8c3562b921AA65B2eB42d14A
```

Also update `lib/blockchain.ts`:

```typescript
const CONTRACT_ADDRESS: Address = getAddress('0x5FbDB2315678afec8c3562b921AA65B2eB42d14A');
```

---

## 6. How to Run the Application

### Start Development Server

**Open Terminal 3** and run:

```bash
npm run dev
```

**Expected Output:**
```
> b2c-supply-chain-system@0.1.0 dev
> next dev

  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Ready in Xs
```

### Access Application

Open browser and navigate to:
- **Local**: [http://localhost:3000](http://localhost:3000)

### Verify All Services Running

- ✅ PostgreSQL: `psql -U spc_user -d supply-chain-test -c "SELECT 1;"`
- ✅ Hardhat Node: Check Terminal 1 is running
- ✅ Next.js App: Check browser loads at localhost:3000

---

## 7. Work Flow to Test

### Complete Test Flow

#### 1. Register Users

**Buyer:**
- Navigate to signup page
- Fill form:
  - Name: "Alice Buyer"
  - Email: "alice@example.com"
  - Password: "SecurePass123"
  - Role: "BUYER"
  - Address: "123 Buyer Lane"
- Submit → Account created with auto-generated wallet

**Seller:**
- Open incognito window
- Signup with:
  - Name: "Bob Seller"
  - Email: "bob@example.com"
  - Role: "SELLER"
  - Address: "456 Seller Road" (optional)
- Submit → Seller account created

**Logistics Provider:**
- Open another incognito window
- Signup with:
  - Name: "Charlie Logistics"
  - Email: "charlie@example.com"
  - Role: "LOGISTICS"
- Submit → Logistics account created

#### 2. Seller Creates Item

- Login as Seller
- Navigate to "Inventory"
- Click "Add New Item"
- Fill form:
  - Item Name: "Wireless Headphones"
  - Description: "High-quality noise-canceling headphones"
  - Price: 149.99
  - Stock: 50
- Submit → Item created, blockchain event recorded

#### 3. Buyer Places Order

- Login as Buyer
- Navigate to "Marketplace"
- Find item → Click "Purchase Now"
- **Quantity Selection Modal** appears:
  - Adjust quantity (1-50)
  - Review total amount
  - Click "Confirm Purchase"
- **Invoice Modal** appears showing:
  - Item name, quantity, unit price, total
  - Order ID
  - Blockchain transaction hash
- Close invoice → Order created

#### 4. Seller Accepts Order

- Login as Seller
- Navigate to "My Orders"
- Find pending order
- Click "Accept Order"
- Status changes to ACCEPTED
- Blockchain event recorded

#### 5. Logistics Updates Shipment

- Login as Logistics Provider
- Navigate to "Active Shipments"
- Find shipment for accepted order
- Update location: "In Transit to Buyer"
- Status updates → Blockchain event recorded

#### 6. Buyer Confirms Receipt

- Login as Buyer
- Navigate to "My Orders"
- Find shipped order
- When status shows "Out for Delivery"
- Click "Confirm Receipt"
- Status changes to DELIVERED
- Blockchain event recorded

#### 7. Seller Collects Payment

- Login as Seller
- Navigate to "My Orders"
- Find delivered order
- Click "Collect Payment"
- Payment transferred to seller wallet
- Blockchain event recorded

### Verification Points

- ✅ All blockchain events recorded (check Hardhat node terminal)
- ✅ Database updated correctly (check PostgreSQL)
- ✅ Wallet balances updated
- ✅ Order statuses progress correctly
- ✅ Shipment locations update

---

## 8. Simple Troubleshooting

### Database Issues

**Error: `ECONNREFUSED` or `Connection refused`**
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT version();"

# If not running, start it:
# macOS: brew services start postgresql@14
# Linux: sudo systemctl start postgresql
```

**Error: `database "supply-chain-test" does not exist`**
```bash
# Create database
psql -U postgres -c 'CREATE DATABASE "supply-chain-test";'

# Run setup script
psql -U postgres -d supply-chain-test -f scripts/setup_db_complete.sql
```

**Error: `role "spc_user" does not exist`**
```bash
# User creation is in setup script, but you can create manually:
psql -U postgres -c "CREATE ROLE spc_user LOGIN PASSWORD '123456';"
psql -U postgres -c 'GRANT ALL PRIVILEGES ON DATABASE "supply-chain-test" TO spc_user;'
```

### Blockchain Issues

**Error: `ECONNREFUSED 127.0.0.1:8545`**
```bash
# Hardhat node not running
# Start it: npx hardhat node
# Keep terminal open!
```

**Error: `InvalidAddressError`**
```bash
# Contract address wrong or not deployed
# 1. Deploy contract: npx hardhat run scripts/deploy.ts --network localhost
# 2. Copy address to .env: CONTRACT_ADDRESS=0x...
# 3. Update lib/blockchain.ts with same address
# 4. Restart Next.js server
```

**Error: `No accounts available`**
```bash
# Hardhat node restarted, accounts reset
# Redeploy contract and update CONTRACT_ADDRESS
```

### Application Issues

**Error: `Module not found`**
```bash
# Dependencies not installed
npm install
```

**Error: `Port 3000 already in use`**
```bash
# Kill process on port 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Or use different port:
PORT=3001 npm run dev
```

**Error: `wallet_balance.toFixed is not a function`**
```bash
# Database returns string, needs conversion
# This should be fixed in code, but verify:
# Check lib/db/users.ts and lib/db/wallet-management.ts
# Ensure Number() conversion is present
```

### Order Issues

**Error: `Insufficient funds`**
```bash
# Buyer wallet balance too low
# Solution: Add funds via wallet management or create new buyer with higher balance
```

**Error: `No Logistics Provider available`**
```bash
# Need at least one user with LOGISTICS role
# Create logistics account via signup
```

**Error: `Foreign key violation`**
```bash
# Missing required user/item
# Ensure all referenced entities exist in database
```

### General Debugging

**Check Database Connection:**
```bash
psql -U spc_user -d supply-chain-test -c "SELECT COUNT(*) FROM users;"
```

**Check Blockchain Connection:**
```bash
# In browser console or terminal:
curl http://127.0.0.1:8545
# Should return JSON-RPC response
```

**Check Application Logs:**
```bash
# Next.js terminal shows errors
# Check browser console (F12) for frontend errors
# Check Hardhat terminal for blockchain errors
```

**Reset Everything:**
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

# 5. Update CONTRACT_ADDRESS

# 6. Restart Next.js
npm run dev
```

---

## Next Steps

After successful setup:

1. Review [SYSTEM-FEATURE.md](./SYSTEM-FEATURE.md) for all features
2. Check [API-GUIDE.md](./API-GUIDE.md) for API usage
3. Read [USERROLE-FUNCTIONALITIES.md](./USERROLE-FUNCTIONALITIES.md) for role details
4. See [SETUP-FOR-ONLINE.md](./SETUP-FOR-ONLINE.md) for production deployment

---

**Setup Complete!** 🎉

If you encounter issues not covered here, check [COMMON-PROBLEMS-FIX.md](./COMMON-PROBLEMS-FIX.md) for detailed solutions.

