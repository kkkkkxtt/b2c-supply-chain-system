# Setup for Online Environment

Complete guide for deploying the B2C Supply Chain System to online/production environments.

## Overview

This guide covers deployment to:
- **Vercel** (Hosting)
- **Neon** (Database)
- **Sepolia Testnet** (Blockchain)

All services offer free tiers suitable for development and testing.

---

## Step 1: Prepare Deployer Wallet

### Create MetaMask Wallet

1. Install MetaMask browser extension
2. Create new wallet or use existing
3. **Important**: Save your private key securely

### Get Sepolia Test ETH

1. Go to [Alchemy Sepolia Faucet](https://sepoliafaucet.com/) or [Google Cloud Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
2. Enter your MetaMask wallet address
3. Request test ETH (usually 0.5 ETH per request)
4. Wait for confirmation (may take a few minutes)

### Export Private Key

1. Open MetaMask → Settings → Advanced
2. Click "Show Private Key"
3. Enter password
4. **Copy and save securely** - This will be used for contract deployment

**⚠️ Security Warning**: Never share your private key. This is for deployment only.

---

## Step 2: Setup Database (Neon)

### Create Neon Account

1. Go to [Neon.tech](https://neon.tech/)
2. Sign up for free account
3. Verify email if required

### Create Project

1. Click "Create Project"
2. Choose region (closest to your users)
3. Select PostgreSQL version (14+)
4. Click "Create Project"

### Get Connection String

1. After project creation, you'll see connection details
2. Copy the **Connection String** (format: `postgresql://user:password@host/dbname?sslmode=require`)
3. Save for later use

**Example Format**:
```
postgresql://neondb_owner:password@ep-xyz.aws.neon.tech/neondb?sslmode=require
```

### Initialize Database Schema

**Option 1: Using psql (Local)**

```bash
# Connect to Neon database
psql 'postgresql://neondb_owner:password@ep-xyz.aws.neon.tech/neondb?sslmode=require'

# Run setup script
\i scripts/setup_db_complete.sql

# Or run directly:
psql 'postgresql://neondb_owner:password@ep-xyz.aws.neon.tech/neondb?sslmode=require' -f scripts/setup_db_complete.sql
```

**Option 2: Using Neon SQL Editor**

1. Go to Neon dashboard
2. Click "SQL Editor"
3. Copy contents of `scripts/setup_db_complete.sql`
4. Paste into SQL Editor
5. Click "Run"
6. Verify tables created: `\dt` (if using psql) or check in dashboard

### Verify Database Setup

```bash
# Connect and verify
psql 'postgresql://neondb_owner:password@ep-xyz.aws.neon.tech/neondb?sslmode=require' -c "\dt"

# Should see: users, items, orders, shipments, blockchain_proofs
```

---

## Step 3: Get Blockchain RPC (Alchemy)

### Create Alchemy Account

1. Go to [Alchemy.com](https://www.alchemy.com/)
2. Sign up for free account
3. Verify email if required

### Create App

1. Click "Create App"
2. Fill details:
   - **Name**: B2C Supply Chain
   - **Chain**: Ethereum
   - **Network**: Sepolia
3. Click "Create App"

### Get API Key

1. Click on your app
2. Click "API Key" tab
3. Copy the **HTTPS URL** (format: `https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY`)
4. Save for later use

**Example Format**:
```
https://eth-sepolia.g.alchemy.com/v2/omEX1b70HrUQsbSedya19
```

---

## Step 4: Deploy to Vercel

### Push Code to GitHub

1. Ensure all code is committed:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

### Create Vercel Project

1. Go to [Vercel.com](https://vercel.com/)
2. Sign up/login with GitHub
3. Click "Add New" → "Project"
4. Import your GitHub repository
5. Select repository

### Configure Environment Variables

In Vercel project settings, add these environment variables:

| Name | Value | Description |
|------|-------|-------------|
| `DB_HOST` | `ep-xyz.aws.neon.tech` | Neon host (from connection string) |
| `DB_USER` | `neondb_owner` | Neon user |
| `DB_PASSWORD` | `your_password` | Neon password |
| `DB_NAME` | `neondb` | Database name |
| `DB_PORT` | `5432` | PostgreSQL port |
| `PRIVATE_KEY` | `0xYourMetaMaskPrivateKey` | Your MetaMask private key |
| `SEPOLIA_RPC_URL` | `https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY` | Alchemy RPC URL |
| `NEXT_PUBLIC_BLOCKCHAIN_NETWORK` | `sepolia` | Network identifier |
| `CONTRACT_ADDRESS` | `(will be set after deployment)` | Contract address |

**Or use DATABASE_URL format**:
```
DATABASE_URL=postgresql://neondb_owner:password@ep-xyz.aws.neon.tech/neondb?sslmode=require
```

### Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Note the deployment URL (e.g., `https://your-project.vercel.app`)

---

## Step 5: Deploy Smart Contract to Sepolia

### Update Hardhat Config

Ensure `hardhat.config.ts` includes Sepolia network:

```typescript
networks: {
  sepolia: {
    url: process.env.SEPOLIA_RPC_URL,
    accounts: [process.env.PRIVATE_KEY!],
  },
}
```

### Deploy Contract

**From local terminal**:

```bash
# Set environment variables
export SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY"
export PRIVATE_KEY="0xYourMetaMaskPrivateKey"

# Deploy to Sepolia
npx hardhat run scripts/deploy.ts --network sepolia
```

**Expected Output**:
```
OrderTracker deployed to: 0x1234567890abcdef1234567890abcdef12345678
```

### Update Vercel Environment

1. Go to Vercel project → Settings → Environment Variables
2. Add/Update:
   - `CONTRACT_ADDRESS` = `0x1234567890abcdef1234567890abcdef12345678`
3. **Redeploy** to apply changes

### Update Code

Also update `lib/blockchain.ts`:

```typescript
const CONTRACT_ADDRESS: Address = getAddress('0x1234567890abcdef1234567890abcdef12345678');
```

Commit and push:
```bash
git add lib/blockchain.ts
git commit -m "Update contract address for Sepolia"
git push origin main
```

Vercel will auto-deploy on push.

---

## Step 6: Verify Deployment

### Check Application

1. Visit your Vercel URL: `https://your-project.vercel.app`
2. Verify page loads without errors
3. Check browser console for errors

### Test Database Connection

1. Try to sign up a new user
2. Check Neon dashboard → Tables → users
3. Verify user was created

### Test Blockchain Connection

1. Create an order
2. Check Sepolia Etherscan: [https://sepolia.etherscan.io/](https://sepolia.etherscan.io/)
3. Search for your contract address
4. Verify transactions appear

---

## Step 7: Post-Deployment Configuration

### Update Contract Address in Code

If contract address changed, update:

1. **Vercel Environment Variable**: `CONTRACT_ADDRESS`
2. **Code**: `lib/blockchain.ts`
3. **Redeploy**: Push changes or trigger redeploy

### Verify Environment Variables

In Vercel dashboard, verify all variables are set:

- ✅ Database connection (DB_HOST, DB_USER, etc. or DATABASE_URL)
- ✅ Blockchain RPC URL (SEPOLIA_RPC_URL)
- ✅ Private Key (PRIVATE_KEY)
- ✅ Contract Address (CONTRACT_ADDRESS)
- ✅ Network (NEXT_PUBLIC_BLOCKCHAIN_NETWORK)

---

## Troubleshooting Online Deployment

### Database Connection Issues

**Error**: `Connection refused` or `SSL required`

**Solution**:
- Verify connection string includes `?sslmode=require`
- Check Neon dashboard for correct connection details
- Ensure database is accessible (not paused)

**Command**:
```bash
psql 'postgresql://user:pass@host/db?sslmode=require' -c "SELECT 1;"
```

### Blockchain Connection Issues

**Error**: `Network error` or `RPC error`

**Solution**:
- Verify SEPOLIA_RPC_URL is correct
- Check Alchemy dashboard for API status
- Ensure private key has Sepolia ETH
- Verify network is set to `sepolia`

**Check**:
```bash
curl https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

### Contract Deployment Issues

**Error**: `Insufficient funds` or `Transaction failed`

**Solution**:
- Ensure MetaMask wallet has Sepolia ETH
- Verify private key is correct
- Check gas prices on Sepolia
- Retry deployment

**Get More ETH**:
- Visit Sepolia faucet again
- Wait for previous transaction to confirm

### Application Build Issues

**Error**: Build fails on Vercel

**Solution**:
- Check build logs in Vercel dashboard
- Verify all dependencies in `package.json`
- Ensure TypeScript compiles without errors
- Check environment variables are set

**Local Test**:
```bash
npm run build
```

---

## Environment Variables Reference

### Required Variables

```env
# Database (Neon)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
# OR separate variables:
DB_HOST=ep-xyz.aws.neon.tech
DB_USER=neondb_owner
DB_PASSWORD=password
DB_NAME=neondb
DB_PORT=5432

# Blockchain (Sepolia)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=0xYourMetaMaskPrivateKey
NEXT_PUBLIC_BLOCKCHAIN_NETWORK=sepolia
CONTRACT_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
```

### Optional Variables

```env
# For local development
NEXT_PUBLIC_HARDHAT_RPC_URL=http://127.0.0.1:8545
```

---

## Monitoring & Maintenance

### Monitor Database

- **Neon Dashboard**: Check connection count, query performance
- **Database Size**: Monitor storage usage
- **Backups**: Neon provides automatic backups

### Monitor Blockchain

- **Sepolia Etherscan**: View transactions and contract interactions
- **Alchemy Dashboard**: Monitor API usage and errors
- **Gas Costs**: Track transaction costs

### Monitor Application

- **Vercel Dashboard**: View deployment logs, function logs
- **Error Tracking**: Check Vercel logs for errors
- **Performance**: Monitor response times

---

## Cost Estimation

### Free Tier Limits

**Neon**:
- 0.5 GB storage
- Unlimited projects
- Automatic backups

**Vercel**:
- 100 GB bandwidth/month
- Unlimited deployments
- Serverless functions

**Alchemy**:
- 300M compute units/month
- 100M credits/month
- Sufficient for development/testing

**Sepolia**:
- Free test ETH from faucets
- No real money required

### Scaling Considerations

For production:
- Consider paid tiers for higher limits
- Monitor usage and upgrade as needed
- Implement rate limiting
- Use caching strategies

---

## Security Best Practices

### Environment Variables

- ✅ Never commit `.env` files
- ✅ Use Vercel environment variables (not hardcoded)
- ✅ Rotate keys regularly
- ✅ Use different keys for dev/prod

### Private Keys

- ✅ Store securely (password manager)
- ✅ Never share or commit
- ✅ Use separate wallet for production
- ✅ Consider hardware wallet for large amounts

### Database

- ✅ Use SSL connections (`sslmode=require`)
- ✅ Limit database access
- ✅ Regular backups
- ✅ Monitor for suspicious activity

---

## Rollback Procedure

If deployment fails:

1. **Revert Code**:
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Revert Environment Variables**:
   - Update in Vercel dashboard
   - Trigger redeploy

3. **Database Rollback**:
   - Use Neon point-in-time recovery
   - Or restore from backup

---

## Next Steps

After successful deployment:

1. ✅ Test all features on production URL
2. ✅ Monitor error logs
3. ✅ Set up monitoring alerts
4. ✅ Document production URLs
5. ✅ Share with team/users

---

## Additional Resources

- **Neon Docs**: [https://neon.tech/docs](https://neon.tech/docs)
- **Vercel Docs**: [https://vercel.com/docs](https://vercel.com/docs)
- **Alchemy Docs**: [https://docs.alchemy.com](https://docs.alchemy.com)
- **Sepolia Etherscan**: [https://sepolia.etherscan.io](https://sepolia.etherscan.io)

---

**Deployment Complete!** 🎉

Your application is now live at: `https://your-project.vercel.app`

