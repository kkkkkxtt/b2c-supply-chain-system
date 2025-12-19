# Other Information

Additional information and summaries about the B2C Supply Chain System.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Database Schema Summary](#database-schema-summary)
- [Blockchain Integration Details](#blockchain-integration-details)
- [Technology Stack](#technology-stack)
- [Development History](#development-history)
- [File Structure](#file-structure)
- [Key Design Decisions](#key-design-decisions)
- [Performance Considerations](#performance-considerations)
- [Security Features](#security-features)
- [Future Roadmap](#future-roadmap)

---

## Architecture Overview

### System Architecture

```
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
│   React/TS      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Routes    │
│   (Next.js)     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│   DB   │ │Blockchain│
│PostgreSQL│ │ Hardhat  │
└────────┘ └──────────┘
```

### Data Flow

1. **User Action** → Frontend Component
2. **API Call** → Next.js API Route
3. **Business Logic** → Database Query Functions
4. **Blockchain Event** → Smart Contract Recording
5. **Response** → Frontend Update

---

## Database Schema Summary

### Tables

1. **users**
   - User accounts with wallet addresses
   - Roles: BUYER, SELLER, LOGISTICS
   - Wallet balance management

2. **items**
   - Product inventory
   - Seller association
   - Stock tracking

3. **orders**
   - Order records
   - Buyer and item references
   - Status tracking
   - Payment collection flag

4. **shipments**
   - Shipment tracking
   - Logistics provider assignment
   - Status updates

5. **blockchain_proofs**
   - Audit trail of blockchain events
   - Transaction hashes
   - Entity references

### Key Relationships

- Users → Items (seller_id)
- Users → Orders (buyer_id)
- Items → Orders (item_id)
- Orders → Shipments (order_id)
- Users → Shipments (logistics_id)

---

## Blockchain Integration Details

### Smart Contract: OrderTracker.sol

**Purpose**: Record critical events on-chain

**Events**:
- `OrderEvent`: Generic event for all operations
- Event types: 0-5 (ORDER_CREATED, STATUS_UPDATE, etc.)

**Storage**:
- Only hashes stored (no PII)
- Entity keys for indexing
- Timestamps for audit

### Event Types

| Type | Event Name | Description |
|------|------------|-------------|
| 0 | ORDER_CREATED | Order placed |
| 1 | STATUS_UPDATE | Status changed |
| 2 | DELIVERY_CONFIRMED | Delivery confirmed |
| 3 | PAYMENT_RELEASED | Payment collected |
| 4 | ITEM_METADATA_HASHED | Item created |
| 5 | USER_IDENTITY_HASHED | User registered |

### Hash Strategy

- **Algorithm**: SHA-256
- **Format**: `0x` + 64 hex characters
- **Content**: Critical data only (no PII)
- **Purpose**: Proof of integrity

---

## Technology Stack

### Frontend

- **Framework**: Next.js 14
- **UI Library**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

### Backend

- **Runtime**: Node.js 18+
- **Framework**: Next.js API Routes
- **Database**: PostgreSQL 14+
- **ORM**: Raw SQL queries with pg library

### Blockchain

- **Development**: Hardhat
- **Language**: Solidity
- **Library**: viem, ethers.js
- **Network**: Hardhat (local), Sepolia (production)

### Tools

- **Package Manager**: npm
- **Version Control**: Git
- **Deployment**: Vercel
- **Database Hosting**: Neon (production)

---

## Development History

### Key Milestones

1. **Initial Setup**
   - Project structure
   - Database schema
   - Basic CRUD operations

2. **Wallet Integration**
   - Auto-generated wallet addresses
   - Blockchain identity
   - Wallet balance system

3. **Order System**
   - Order placement
   - Status management
   - Payment collection

4. **Shipment Tracking**
   - Location updates
   - Status tracking
   - Logistics integration

5. **UI Enhancements**
   - Quantity selection modal
   - Invoice display
   - Pagination
   - Blockchain viewer

6. **Production Ready**
   - Online deployment setup
   - Error handling
   - Documentation

---

## File Structure

```
b2c-supply-chain-system/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   ├── inventory/
│   │   ├── order/
│   │   ├── orders/
│   │   ├── profile/
│   │   ├── shipments/
│   │   └── blockchain-proofs/
│   ├── page.tsx
│   └── layout.tsx
├── components/
│   ├── Marketplace.tsx
│   ├── Inventory.tsx
│   ├── OrderList.tsx
│   ├── ShipmentManager.tsx
│   ├── UserProfile.tsx
│   ├── BlockchainViewer.tsx
│   ├── BlockchainHashViewer.tsx
│   └── Pagination.tsx
├── lib/
│   ├── db/
│   │   ├── client.ts
│   │   ├── users.ts
│   │   ├── items.ts
│   │   ├── transactions.ts
│   │   ├── order-management.ts
│   │   ├── shipment-management.ts
│   │   ├── wallet-management.ts
│   │   └── blockchain-proofs.ts
│   └── blockchain.ts
├── types/
│   ├── user.ts
│   ├── item.ts
│   ├── order.ts
│   └── shipment.ts
├── contracts/
│   └── OrderTracker.sol
├── scripts/
│   ├── setup_db_complete.sql
│   ├── deploy.ts
│   └── migrate_to_v2.sql
└── Documentation files (*.md)
```

---

## Key Design Decisions

### 1. Wallet Address Immutability

**Decision**: Wallet addresses cannot be changed after creation

**Reason**: 
- Blockchain identity integrity
- Audit trail consistency
- Prevents fraud

**Implementation**: Database UNIQUE constraint + API validation

### 2. Denormalized Wallet Addresses

**Decision**: Store wallet addresses in items and orders tables

**Reason**:
- Performance (no JOIN needed)
- Historical accuracy
- Blockchain hash generation speed

**Trade-off**: Slight storage increase vs. query performance

### 3. Quantity Selection Modal

**Decision**: Separate modal for quantity selection before purchase

**Reason**:
- Better UX (clear confirmation)
- Prevents accidental purchases
- Shows invoice immediately

**Implementation**: React state management + modal component

### 4. Blockchain Hash-Only Storage

**Decision**: Store only hashes on blockchain, full data in database

**Reason**:
- Privacy (no PII on-chain)
- Cost efficiency
- Flexibility

**Trade-off**: Requires database for full data retrieval

### 5. Role-Based Access Control

**Decision**: Strict role-based permissions

**Reason**:
- Security
- Clear responsibilities
- Prevents unauthorized actions

**Implementation**: Role checks in API routes

---

## Performance Considerations

### Database Optimization

- **Indexes**: On frequently queried fields
- **Pagination**: 5 items per page
- **Query Optimization**: Parameterized queries
- **Connection Pooling**: Managed by pg library

### Frontend Optimization

- **Server-Side Rendering**: Next.js SSR
- **Code Splitting**: Automatic by Next.js
- **Image Optimization**: Removed (using icons)
- **Lazy Loading**: Component-level

### Blockchain Optimization

- **Batch Operations**: Not implemented (future)
- **Gas Optimization**: Minimal on-chain storage
- **Event Filtering**: Indexed event keys

---

## Security Features

### Authentication

- **Password Hashing**: bcrypt with salt rounds 10
- **Session Management**: localStorage (client-side)
- **Role Validation**: Server-side checks

### Data Protection

- **SQL Injection Prevention**: Parameterized queries
- **XSS Prevention**: React auto-escaping
- **Input Validation**: Client and server-side

### Blockchain Security

- **Private Key Protection**: Environment variables
- **Transaction Validation**: Server-side checks
- **Hash Integrity**: SHA-256 verification

### Access Control

- **Role-Based**: BUYER, SELLER, LOGISTICS
- **Resource Ownership**: Users can only access own data
- **Immutable Fields**: Wallet address, role protection

---

## Future Roadmap

### Short-Term (Next Release)

- [ ] Email notifications
- [ ] Order cancellation
- [ ] Refund processing
- [ ] Advanced search

### Medium-Term

- [ ] Product reviews and ratings
- [ ] Multi-currency support
- [ ] Export functionality
- [ ] Mobile app

### Long-Term

- [ ] AI-powered recommendations
- [ ] Supply chain analytics
- [ ] Integration with external services
- [ ] Multi-chain support

---

## Additional Notes

### Development Environment

- **Local Development**: Hardhat local node
- **Testing**: Manual testing workflow
- **Version Control**: Git with feature branches

### Deployment

- **Staging**: Vercel preview deployments
- **Production**: Vercel production
- **Database**: Neon PostgreSQL
- **Blockchain**: Sepolia testnet

### Maintenance

- **Updates**: Regular dependency updates
- **Monitoring**: Vercel logs and Neon dashboard
- **Backups**: Automatic via Neon

---

## Contact & Support

For issues or questions:

1. Check [COMMON-PROBLEMS-FIX.md](./COMMON-PROBLEMS-FIX.md)
2. Review [SETUP.md](./SETUP.md)
3. Consult [API-GUIDE.md](./API-GUIDE.md)

---

## Version Information

- **Current Version**: 1.0
- **Last Updated**: December 2025
- **Node.js**: 18+
- **Next.js**: 14.x
- **PostgreSQL**: 14+
- **Hardhat**: Latest

---

**This document contains supplementary information about the system architecture, design decisions, and future plans.**

