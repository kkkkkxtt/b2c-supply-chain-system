-- Database Schema Update: Create blockchain_proofs table

-- If the table doesn't exist, create it
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_blockchain_proofs_tx_hash ON blockchain_proofs(blockchain_tx_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_proofs_entity_id ON blockchain_proofs(entity_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_proofs_sender_address ON blockchain_proofs(sender_address);
CREATE INDEX IF NOT EXISTS idx_blockchain_proofs_data_hash ON blockchain_proofs(data_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_proofs_entity_type ON blockchain_proofs(entity_type);
CREATE INDEX IF NOT EXISTS idx_blockchain_proofs_event_type ON blockchain_proofs(event_type);
CREATE INDEX IF NOT EXISTS idx_blockchain_proofs_created_at ON blockchain_proofs(created_at DESC);

-- Grant privileges to spc_user
GRANT SELECT, INSERT, UPDATE, DELETE ON blockchain_proofs TO spc_user;

-- Optional: Add comment to table
COMMENT ON TABLE blockchain_proofs IS 'Stores all blockchain transaction proofs and hashes for verification and audit trail purposes';
COMMENT ON COLUMN blockchain_proofs.entity_id IS 'The ID of the entity (user, item, order, shipment) recorded on blockchain';
COMMENT ON COLUMN blockchain_proofs.entity_type IS 'Type of entity: USER, ITEM, ORDER, or SHIPMENT';
COMMENT ON COLUMN blockchain_proofs.event_type IS 'Event type code (0=ORDER_CREATED, 1=STATUS_UPDATE, 2=DELIVERY_CONFIRMED, 3=PAYMENT_RELEASED, 4=ITEM_METADATA_HASHED, 5=USER_IDENTITY_HASHED)';
COMMENT ON COLUMN blockchain_proofs.blockchain_tx_hash IS 'The actual blockchain transaction hash from Hardhat/Ethereum';
COMMENT ON COLUMN blockchain_proofs.sender_address IS 'The wallet address of the entity that initiated the transaction';
COMMENT ON COLUMN blockchain_proofs.data_hash IS 'SHA-256 hash of the entity data';
COMMENT ON COLUMN blockchain_proofs.metadata IS 'Additional metadata stored as JSON (e.g., item details, order info)';
