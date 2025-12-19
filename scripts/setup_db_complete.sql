-- =============================================================================
-- Complete Database Setup Script for B2C Supply Chain System
-- Database: supply-chain-test (user: spc_user)
-- Password: 123456
-- Purpose: Complete schema with wallet_address support, timestamps, and blockchain proofs
-- =============================================================================

--run command before running the scripts: psql -U postgres -c "CREATE DATABASE \"supply-chain-test\" OWNER spc_user;"
--get into database: psql -U spc_user -d "supply-chain-test"

-- 1. Create User Role (if not exists)
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'spc_user') THEN
      CREATE ROLE spc_user LOGIN PASSWORD '123456';
   END IF;
END
$do$;

-- 2. Create Database (Note: This may need to be run separately as superuser)
-- Use a DO block to prevent error if DB exists, then create with spc_user as owner
-- Note: Re-run this part as superuser if you dropped the DB
-- CREATE DATABASE "supply-chain-test" OWNER spc_user;

-- 3. Connect to the test database (Run this manually in psql)
 \c "supply-chain-test";

-- 4. Ensure user has proper permissions
ALTER ROLE spc_user WITH CREATEROLE CREATEDB;

-- 5. Create ENUM types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('BUYER', 'SELLER', 'LOGISTICS');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM ('PENDING', 'ACCEPTED', 'SHIPPED', 'DELIVERED', 'CONFIRMED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Change the owner of types so spc_user can use them freely
ALTER TYPE user_role OWNER TO spc_user;
ALTER TYPE order_status OWNER TO spc_user;

-- =============================================================================
-- USERS TABLE
-- Stores user profile and blockchain wallet information
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    role user_role NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    wallet_address VARCHAR(42) UNIQUE,  -- Removed NOT NULL to prevent crashes if not provided
    wallet_balance NUMERIC(20, 2) DEFAULT 0.00,
    contact_number VARCHAR(20),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transfer ownership of table to spc_user
ALTER TABLE users OWNER TO spc_user;

-- Create index on email for faster login queries
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =============================================================================
-- ITEMS TABLE
-- Stores product/item information with seller reference and timestamps
-- =============================================================================
CREATE TABLE IF NOT EXISTS items (
    id VARCHAR(255) PRIMARY KEY,
    seller_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_wallet_address VARCHAR(42),  -- Removed NOT NULL for easier system testing
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transfer ownership of table to spc_user
ALTER TABLE items OWNER TO spc_user;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_items_seller_id ON items(seller_id);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_seller_wallet ON items(seller_wallet_address);

-- =============================================================================
-- ORDERS TABLE
-- Stores order information with buyer wallet and blockchain references
-- =============================================================================
CREATE TABLE IF NOT EXISTS orders (
    order_id VARCHAR(255) PRIMARY KEY,
    buyer_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    buyer_wallet_address VARCHAR(42),  -- Removed NOT NULL
    item_id VARCHAR(255) NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_amount NUMERIC(20, 2) NOT NULL,
    order_status order_status NOT NULL DEFAULT 'PENDING',
    blockchain_tx_hash VARCHAR(255),  -- Hash of the transaction recording this order on-chain
    order_timestamp TIMESTAMPTZ DEFAULT NOW(),
    payment_collected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transfer ownership of table to spc_user
ALTER TABLE orders OWNER TO spc_user;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_item_id ON orders(item_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_wallet ON orders(buyer_wallet_address);
CREATE INDEX IF NOT EXISTS idx_orders_timestamp ON orders(order_timestamp DESC);

-- =============================================================================
-- SHIPMENTS TABLE
-- Stores shipment tracking information for orders
-- =============================================================================
CREATE TABLE IF NOT EXISTS shipments (
    shipment_id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE UNIQUE,
    logistics_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    current_status VARCHAR(255) NOT NULL DEFAULT 'Awaiting Seller Acceptance',
    last_update TIMESTAMPTZ DEFAULT NOW(),
    estimated_arrival VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transfer ownership of table to spc_user
ALTER TABLE shipments OWNER TO spc_user;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_logistics_id ON shipments(logistics_id);
CREATE INDEX IF NOT EXISTS idx_shipments_last_update ON shipments(last_update DESC);

-- =============================================================================
-- BLOCKCHAIN PROOFS TABLE
-- Tracks all blockchain transaction references and proofs for audit trail
-- =============================================================================
CREATE TABLE IF NOT EXISTS blockchain_proofs (
    id VARCHAR(255) PRIMARY KEY,
    entity_id VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    event_type INTEGER NOT NULL,
    data_hash VARCHAR(255) NOT NULL,
    blockchain_tx_hash VARCHAR(255) NOT NULL UNIQUE,
    sender_address VARCHAR(255) NOT NULL,
    proof_timestamp TIMESTAMPTZ NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transfer ownership of table to spc_user
ALTER TABLE blockchain_proofs OWNER TO spc_user;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_blockchain_proofs_tx_hash ON blockchain_proofs(blockchain_tx_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_proofs_entity_id ON blockchain_proofs(entity_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_proofs_sender_address ON blockchain_proofs(sender_address);
CREATE INDEX IF NOT EXISTS idx_blockchain_proofs_data_hash ON blockchain_proofs(data_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_proofs_entity_type ON blockchain_proofs(entity_type);
CREATE INDEX IF NOT EXISTS idx_blockchain_proofs_event_type ON blockchain_proofs(event_type);
CREATE INDEX IF NOT EXISTS idx_blockchain_proofs_created_at ON blockchain_proofs(created_at DESC);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Set function owner
ALTER FUNCTION update_timestamp_column OWNER TO spc_user;

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS update_items_updated_at ON items;
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

DROP TRIGGER IF EXISTS update_shipments_updated_at ON shipments;
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments
    FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- =============================================================================
-- GRANT PRIVILEGES
-- =============================================================================
-- Apply recursive ownership and permissions
GRANT ALL PRIVILEGES ON DATABASE "supply-chain-test" TO spc_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO spc_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO spc_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO spc_user;

-- Set Default Privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO spc_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO spc_user;

-- Optional: Add comments to table
COMMENT ON TABLE blockchain_proofs IS 'Stores all blockchain transaction proofs and hashes for verification and audit trail purposes';
COMMENT ON COLUMN blockchain_proofs.entity_id IS 'The ID of the entity (user, item, order, shipment) recorded on blockchain';
COMMENT ON COLUMN blockchain_proofs.entity_type IS 'Type of entity: USER, ITEM, ORDER, or SHIPMENT';
COMMENT ON COLUMN blockchain_proofs.event_type IS 'Event type code (0=ORDER_CREATED, 1=STATUS_UPDATE, 2=DELIVERY_CONFIRMED, 3=PAYMENT_RELEASED, 4=ITEM_METADATA_HASHED, 5=USER_IDENTITY_HASHED)';
COMMENT ON COLUMN blockchain_proofs.blockchain_tx_hash IS 'The actual blockchain transaction hash from Hardhat/Ethereum';
COMMENT ON COLUMN blockchain_proofs.sender_address IS 'The wallet address of the entity that initiated the transaction';
COMMENT ON COLUMN blockchain_proofs.data_hash IS 'SHA-256 hash of the entity data';
COMMENT ON COLUMN blockchain_proofs.metadata IS 'Additional metadata stored as JSON (e.g., item details, order info)';

-- =============================================================================
-- VERIFY SCHEMA
-- =============================================================================
-- Setup complete!