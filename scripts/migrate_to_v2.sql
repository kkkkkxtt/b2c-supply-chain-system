-- =============================================================================
-- MIGRATION SCRIPT: From Old Schema to New Schema with Wallet Support
-- =============================================================================
-- This script is for migrating an EXISTING database to the new schema.
-- WARNING: Make a backup before running!
-- USAGE: psql -U scm_user -d supply_chain_db -f scripts/migrate_to_v2.sql
-- =============================================================================

-- Step 1: Add new columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(42) UNIQUE,
ADD COLUMN IF NOT EXISTS contact_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Step 2: Add new columns to items table
ALTER TABLE items
ADD COLUMN IF NOT EXISTS seller_wallet_address VARCHAR(42),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Step 3: Add new columns to orders table
ALTER TABLE orders
-- Rename current_status to order_status (if exists)
ADD COLUMN IF NOT EXISTS order_status order_status,
ADD COLUMN IF NOT EXISTS buyer_wallet_address VARCHAR(42),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Step 4: Migrate data from current_status to order_status (if both exist)
UPDATE orders 
SET order_status = current_status 
WHERE order_status IS NULL AND current_status IS NOT NULL;

-- Step 5: Add new columns to shipments table
ALTER TABLE shipments
ADD COLUMN IF NOT EXISTS current_status VARCHAR(255) DEFAULT 'Awaiting Seller Acceptance',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Step 6: Create or replace update_timestamp_column function
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create triggers for updated_at columns
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

-- Step 8: Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_items_seller_id ON items(seller_id);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_seller_wallet ON items(seller_wallet_address);

CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_item_id ON orders(item_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_wallet ON orders(buyer_wallet_address);
CREATE INDEX IF NOT EXISTS idx_orders_timestamp ON orders(order_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_logistics_id ON shipments(logistics_id);
CREATE INDEX IF NOT EXISTS idx_shipments_last_update ON shipments(last_update DESC);

-- Step 9: Create blockchain_proofs table if it doesn't exist
CREATE TABLE IF NOT EXISTS blockchain_proofs (
    id SERIAL PRIMARY KEY,
    entity_id VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    data_hash VARCHAR(255) NOT NULL,
    blockchain_tx_hash VARCHAR(255),
    sender_address VARCHAR(42),
    proof_timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blockchain_proofs_entity ON blockchain_proofs(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_blockchain_proofs_tx_hash ON blockchain_proofs(blockchain_tx_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_proofs_created_at ON blockchain_proofs(created_at DESC);

-- Step 10: Verify the migration
-- Uncomment to run verification queries:

-- SELECT 'Users' as table_name, COUNT(*) as count, COUNT(wallet_address) as with_wallet FROM users
-- UNION ALL
-- SELECT 'Items', COUNT(*), COUNT(seller_wallet_address) FROM items
-- UNION ALL
-- SELECT 'Orders', COUNT(*), COUNT(buyer_wallet_address) FROM orders
-- UNION ALL
-- SELECT 'Shipments', COUNT(*), COUNT(current_status) FROM shipments;

-- \d users
-- \d items
-- \d orders
-- \d shipments

-- ✅ Migration complete!
