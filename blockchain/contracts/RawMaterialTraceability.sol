// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title RawMaterialTraceability
 * @notice Transparent, tamper-evident smart contract for anchoring raw material supply chain event hashes.
 * @dev Distinguishes between off-chain business/document data and on-chain cryptographic proof.
 */
contract RawMaterialTraceability is AccessControl {
    bytes32 public constant RECORDER_ROLE = keccak256("RECORDER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");

    struct BatchRecord {
        string batchId;
        string materialCategory;
        string materialName;
        address supplier;
        address currentCustodian;
        uint256 quantity;
        string unit;
        bytes32 initialEventHash;
        uint256 registeredAt;
        bool exists;
    }

    struct TraceabilityEvent {
        string eventId;
        string batchId;
        string eventType;
        bytes32 eventHash;
        bytes32 prevEventHash;
        address recorder;
        uint256 timestamp;
    }

    struct GenealogyLink {
        string parentBatchId;
        string childBatchId;
        string operationType; // "SPLIT" or "MERGE"
        uint256 timestamp;
    }

    // Mapping: batchId => BatchRecord
    mapping(string => BatchRecord) private _batches;

    // Mapping: batchId => array of TraceabilityEvent
    mapping(string => TraceabilityEvent[]) private _batchEvents;

    // Mapping: batchId => array of document hashes (SHA-256 / keccak256)
    mapping(string => bytes32[]) private _batchDocumentHashes;

    // Genealogy records
    GenealogyLink[] private _genealogyLinks;

    // Events
    event BatchRegistered(
        string indexed batchId,
        string materialCategory,
        string materialName,
        address indexed supplier,
        uint256 quantity,
        string unit,
        bytes32 initialEventHash,
        uint256 timestamp
    );

    event TraceabilityEventRecorded(
        string indexed batchId,
        string indexed eventId,
        string eventType,
        bytes32 eventHash,
        bytes32 prevEventHash,
        address indexed recorder,
        uint256 timestamp
    );

    event CustodyTransferred(
        string indexed batchId,
        address indexed from,
        address indexed to,
        uint256 timestamp
    );

    event DocumentHashAnchored(
        string indexed batchId,
        bytes32 documentHash,
        string docDescription,
        uint256 timestamp
    );

    event GenealogyRecorded(
        string parentBatchId,
        string childBatchId,
        string operationType,
        uint256 timestamp
    );

    constructor(address defaultAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(RECORDER_ROLE, defaultAdmin);
        _grantRole(AUDITOR_ROLE, defaultAdmin);
    }

    /**
     * @notice Register a newly extracted or collected raw material batch.
     */
    function registerBatch(
        string calldata batchId,
        string calldata materialCategory,
        string calldata materialName,
        address supplier,
        uint256 quantity,
        string calldata unit,
        bytes32 initialEventHash
    ) external onlyRole(RECORDER_ROLE) {
        require(bytes(batchId).length > 0, "Batch ID cannot be empty");
        require(!_batches[batchId].exists, "Batch ID already registered");
        require(quantity > 0, "Quantity must be greater than zero");

        _batches[batchId] = BatchRecord({
            batchId: batchId,
            materialCategory: materialCategory,
            materialName: materialName,
            supplier: supplier,
            currentCustodian: supplier,
            quantity: quantity,
            unit: unit,
            initialEventHash: initialEventHash,
            registeredAt: block.timestamp,
            exists: true
        });

        // Record the initial registration event
        _batchEvents[batchId].push(TraceabilityEvent({
            eventId: string(abi.encodePacked(batchId, "-REG")),
            batchId: batchId,
            eventType: "EXTRACTION_REGISTRATION",
            eventHash: initialEventHash,
            prevEventHash: bytes32(0),
            recorder: msg.sender,
            timestamp: block.timestamp
        }));

        emit BatchRegistered(
            batchId,
            materialCategory,
            materialName,
            supplier,
            quantity,
            unit,
            initialEventHash,
            block.timestamp
        );
    }

    /**
     * @notice Append a verified traceability event hash to an existing batch.
     */
    function recordEvent(
        string calldata batchId,
        string calldata eventId,
        string calldata eventType,
        bytes32 eventHash,
        bytes32 prevEventHash
    ) external onlyRole(RECORDER_ROLE) {
        require(_batches[batchId].exists, "Batch does not exist");
        require(bytes(eventId).length > 0, "Event ID cannot be empty");
        require(eventHash != bytes32(0), "Event hash cannot be zero");

        uint256 len = _batchEvents[batchId].length;
        if (len > 0) {
            bytes32 actualPrevHash = _batchEvents[batchId][len - 1].eventHash;
            require(prevEventHash == actualPrevHash, "Invalid previous event hash linkage");
        }

        _batchEvents[batchId].push(TraceabilityEvent({
            eventId: eventId,
            batchId: batchId,
            eventType: eventType,
            eventHash: eventHash,
            prevEventHash: prevEventHash,
            recorder: msg.sender,
            timestamp: block.timestamp
        }));

        emit TraceabilityEventRecorded(
            batchId,
            eventId,
            eventType,
            eventHash,
            prevEventHash,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Anchor a sustainability or compliance document hash on-chain.
     */
    function anchorDocumentHash(
        string calldata batchId,
        bytes32 documentHash,
        string calldata docDescription
    ) external onlyRole(RECORDER_ROLE) {
        require(_batches[batchId].exists, "Batch does not exist");
        require(documentHash != bytes32(0), "Document hash cannot be zero");

        _batchDocumentHashes[batchId].push(documentHash);

        emit DocumentHashAnchored(batchId, documentHash, docDescription, block.timestamp);
    }

    /**
     * @notice Record a custody transfer between supply chain participants.
     */
    function transferCustody(
        string calldata batchId,
        address newCustodian
    ) external {
        require(_batches[batchId].exists, "Batch does not exist");
        require(newCustodian != address(0), "Invalid new custodian address");
        require(
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender) ||
            msg.sender == _batches[batchId].currentCustodian,
            "Only admin or current custodian can transfer custody"
        );

        address prevCustodian = _batches[batchId].currentCustodian;
        _batches[batchId].currentCustodian = newCustodian;

        emit CustodyTransferred(batchId, prevCustodian, newCustodian, block.timestamp);
    }

    /**
     * @notice Record genealogy link for split or merge operations.
     */
    function recordGenealogy(
        string calldata parentBatchId,
        string calldata childBatchId,
        string calldata operationType
    ) external onlyRole(RECORDER_ROLE) {
        require(bytes(parentBatchId).length > 0, "Parent batch cannot be empty");
        require(bytes(childBatchId).length > 0, "Child batch cannot be empty");

        _genealogyLinks.push(GenealogyLink({
            parentBatchId: parentBatchId,
            childBatchId: childBatchId,
            operationType: operationType,
            timestamp: block.timestamp
        }));

        emit GenealogyRecorded(parentBatchId, childBatchId, operationType, block.timestamp);
    }

    /**
     * @notice Verify whether a given event hash matches the on-chain recorded hash for a batch at a specific event index.
     */
    function verifyEventHash(
        string calldata batchId,
        uint256 eventIndex,
        bytes32 expectedHash
    ) external view returns (bool isValid, bytes32 onChainHash, address recorder, uint256 timestamp) {
        if (!_batches[batchId].exists || eventIndex >= _batchEvents[batchId].length) {
            return (false, bytes32(0), address(0), 0);
        }

        TraceabilityEvent memory evt = _batchEvents[batchId][eventIndex];
        return (
            evt.eventHash == expectedHash,
            evt.eventHash,
            evt.recorder,
            evt.timestamp
        );
    }

    /**
     * @notice Get total event count for a given batch.
     */
    function getBatchEventsCount(string calldata batchId) external view returns (uint256) {
        require(_batches[batchId].exists, "Batch does not exist");
        return _batchEvents[batchId].length;
    }

    /**
     * @notice Get specific event by batch ID and index.
     */
    function getTraceabilityEvent(
        string calldata batchId,
        uint256 index
    ) external view returns (
        string memory eventId,
        string memory eventType,
        bytes32 eventHash,
        bytes32 prevEventHash,
        address recorder,
        uint256 timestamp
    ) {
        require(_batches[batchId].exists, "Batch does not exist");
        require(index < _batchEvents[batchId].length, "Index out of bounds");

        TraceabilityEvent memory evt = _batchEvents[batchId][index];
        return (
            evt.eventId,
            evt.eventType,
            evt.eventHash,
            evt.prevEventHash,
            evt.recorder,
            evt.timestamp
        );
    }

    /**
     * @notice Get basic batch metadata.
     */
    function getBatch(
        string calldata batchId
    ) external view returns (BatchRecord memory) {
        require(_batches[batchId].exists, "Batch does not exist");
        return _batches[batchId];
    }

    /**
     * @notice Get document hashes anchored for a batch.
     */
    function getBatchDocumentHashes(string calldata batchId) external view returns (bytes32[] memory) {
        require(_batches[batchId].exists, "Batch does not exist");
        return _batchDocumentHashes[batchId];
    }
}
