export type BlockchainEventType =
  | 'ORDER_CREATED'
  | 'STATUS_UPDATE'
  | 'DELIVERY_CONFIRMED'
  | 'PAYMENT_RELEASED'
  | 'ITEM_METADATA_HASHED'
  | 'USER_IDENTITY_HASHED'
  | 'ESCROW_STATE_CHANGED'
  | 'UNKNOWN';

export interface BlockchainRecord {
  tx_hash: `0x${string}`;
  block_timestamp: number;
  event_type: BlockchainEventType;
  data_hash: `0x${string}`;
  sender_address: `0x${string}`;
}
