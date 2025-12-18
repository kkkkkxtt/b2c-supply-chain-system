// /contracts/OrderTracker.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title OrderTracker
<<<<<<< HEAD
 * @dev Manages the immutable audit trail for the B2C Supply Chain DApp.
 * All critical status and transaction events are logged here.
 */
contract OrderTracker {

    // --- ENUM (Matches OrderStatus in TypeScript/PostgreSQL for clarity) ---
    enum EventType {
        ORDER_CREATED,
        STATUS_UPDATE,
        DELIVERY_CONFIRMED,
        PAYMENT_RELEASED
    }

    // --- EVENT (The immutable ledger entry read by the BlockchainViewer) ---
    // The event is indexed to allow for efficient filtering by the off-chain application.
    event OrderEvent(
        string indexed uniqueId,      // e.g., Order ID, Shipment ID (for easy search)
        EventType indexed eventType,  // Type of transaction/status update
        bytes32 dataHash,             // SHA-256 hash of the off-chain data (proof of integrity)
        address indexed sender,       // Address of the role executing the update (Buyer, Seller, Logistics)
        uint256 timestamp             // Block timestamp
    );

    // --- FUNCTIONS ---

    /**
     * @dev Records a critical event, such as a status change or order confirmation.
     * @param _uniqueId The ID of the affected entity (Order ID or Shipment ID).
     * @param _eventType The type of event occurring.
     * @param _dataHash Cryptographic hash of the off-chain data payload (e.g., status, location, amount).
     */
    function recordEvent(
        string memory _uniqueId,
        EventType _eventType,
        bytes32 _dataHash
    ) public {
        // The transaction sender is automatically recorded by 'msg.sender'.
        
        // Emit the event to the immutable ledger
        emit OrderEvent(
            _uniqueId,
            _eventType,
            _dataHash,
            msg.sender,
            block.timestamp
        );
    }
}
=======
 * @dev On-chain ledger stores ONLY verification proofs (hashes) + timestamps + minimal state.
 * Full business data stays off-chain (PostgreSQL), per proposal.
 */
contract OrderTracker {
    // Keep existing indices stable: 0..3 unchanged
    enum EventType {
        ORDER_CREATED,         // 0
        STATUS_UPDATE,         // 1 (shipment milestones)
        DELIVERY_CONFIRMED,    // 2
        PAYMENT_RELEASED,      // 3
        ITEM_METADATA_HASHED,  // 4 (proposal: hash of item metadata)
        USER_IDENTITY_HASHED,  // 5 (proposal: hash of buyer/seller identities)
        ESCROW_STATE_CHANGED   // 6 (proposal: escrow state changes)
    }

    struct LatestProof {
        EventType eventType;
        bytes32 dataHash;
        address actor;
        uint256 timestamp;
    }

    // Track latest checkpoint via state variables (proposal requirement)
    mapping(bytes32 => LatestProof) public latestProofByKey;

    // Use an indexed bytes32 key for filtering, keep uniqueId as NON-indexed so it is readable.
    event OrderEvent(
        bytes32 indexed entityKey,    // keccak256(uniqueId)
        EventType indexed eventType,
        string uniqueId,              // readable ID (orderId / itemId / userId)
        bytes32 dataHash,
        address indexed sender,
        uint256 timestamp
    );

    function getEntityKey(string calldata uniqueId) public pure returns (bytes32) {
        return keccak256(bytes(uniqueId));
    }

    function recordEvent(
        string calldata uniqueId,
        EventType eventType,
        bytes32 dataHash
    ) external {
        require(bytes(uniqueId).length > 0, "Invalid uniqueId");
        require(dataHash != bytes32(0), "Invalid dataHash");

        bytes32 key = keccak256(bytes(uniqueId));

        latestProofByKey[key] = LatestProof({
            eventType: eventType,
            dataHash: dataHash,
            actor: msg.sender,
            timestamp: block.timestamp
        });

        emit OrderEvent(key, eventType, uniqueId, dataHash, msg.sender, block.timestamp);
    }
}
>>>>>>> seller-buyer-improvement
