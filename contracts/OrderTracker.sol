// /contracts/OrderTracker.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title OrderTracker
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
        ESCROW_STATE_CHANGED,  // 6 (proposal: escrow state changes)
        ITEM_UPDATED,          // 7 (item information edited)
        USER_PROFILE_UPDATED   // 8 (user profile information edited)
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
