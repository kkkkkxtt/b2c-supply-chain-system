-- =============================================================================
-- Supply Chain Test Database Setup Script
-- Database: supply_chain_test
-- User: spc_user
-- Password: 123456
-- Purpose: New schema with wallet_address support and timestamp tracking
-- =============================================================================

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

-- 2. Create Database
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'supply_chain_test') THEN
        PERFORM dblink_exec('dbname=' || current_database(), 'CREATE DATABASE supply_chain_test');
    END IF;
END $$;

-- 3. Connect to the test database
\c supply_chain_test;

-- 4. Ensure user has proper permissions
ALTER ROLE spc_user WITH CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE supply_chain_test TO spc_user;

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
    wallet_address VARCHAR(42) UNIQUE NOT NULL,  -- Ethereum address (0x + 40 hex chars)
    wallet_balance NUMERIC(20, 2) DEFAULT 0.00,
    contact_number VARCHAR(20),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
    seller_wallet_address VARCHAR(42) NOT NULL,  -- Cached seller wallet for blockchain proof
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    image_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
    buyer_wallet_address VARCHAR(42) NOT NULL,  -- Cached buyer wallet for blockchain proof
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_logistics_id ON shipments(logistics_id);
CREATE INDEX IF NOT EXISTS idx_shipments_last_update ON shipments(last_update DESC);

-- =============================================================================
-- AUDIT LOG TABLE (Optional but recommended)
-- Tracks all blockchain transaction references and proofs
-- =============================================================================
CREATE TABLE IF NOT EXISTS blockchain_proofs (
    id SERIAL PRIMARY KEY,
    entity_id VARCHAR(255) NOT NULL,  -- orderId, itemId, userId, shipmentId
    entity_type VARCHAR(50) NOT NULL, -- 'ORDER', 'ITEM', 'USER', 'SHIPMENT'
    event_type VARCHAR(50) NOT NULL,  -- 'ORDER_CREATED', 'STATUS_UPDATE', 'ITEM_METADATA_HASHED', etc.
    data_hash VARCHAR(255) NOT NULL,  -- SHA-256 hash of the data (0x + 64 hex chars)
    blockchain_tx_hash VARCHAR(255),  -- Ethereum transaction hash
    sender_address VARCHAR(42),        -- Address that recorded the transaction
    proof_timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_blockchain_proofs_entity ON blockchain_proofs(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_blockchain_proofs_tx_hash ON blockchain_proofs(blockchain_tx_hash);
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
-- SAMPLE DATA (Optional - for testing)
-- =============================================================================

-- Uncomment below to insert sample test data

-- INSERT INTO users (id, role, name, email, password_hash, wallet_address, wallet_balance, contact_number, address, created_at, updated_at)
-- VALUES
--   ('buyer_001', 'BUYER', 'Alice Buyer', 'alice@example.com', '$2b$10$...', '0x1234567890123456789012345678901234567890', 5000.00, '555-1001', '123 Buyer Lane', NOW(), NOW()),
--   ('seller_001', 'SELLER', 'Bob Seller', 'bob@example.com', '$2b$10$...', '0x0987654321098765432109876543210987654321', 2000.00, '555-2001', '456 Seller Road', NOW(), NOW()),
--   ('logistics_001', 'LOGISTICS', 'Charlie Logistics', 'charlie@example.com', '$2b$10$...', '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', 1000.00, '555-3001', '789 Logistics Ave', NOW(), NOW());

-- =============================================================================
-- VERIFY SCHEMA
-- =============================================================================
-- Run these queries to verify the setup:
-- \dt                          -- List all tables
-- \d users                    -- Describe users table
-- \d items                    -- Describe items table
-- \d orders                   -- Describe orders table
-- \d shipments                -- Describe shipments table
-- SELECT * FROM pg_indexes WHERE tablename IN ('users', 'items', 'orders', 'shipments');
