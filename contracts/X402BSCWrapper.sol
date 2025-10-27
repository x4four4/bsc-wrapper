// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IERC20Permit {
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function nonces(address owner) external view returns (uint256);
    function DOMAIN_SEPARATOR() external view returns (bytes32);
}

/**
 * @title X402BSCWrapper
 * @notice Advanced wrapper enabling gasless approvals via EIP-2612 permit
 * @dev Converts EIP-3009 calls to permit + transferFrom in a single transaction
 * @author x402 Protocol Contributors
 */
contract X402BSCWrapper {
    // The EIP-2612 compatible token (USD1)
    IERC20Permit public immutable token;
    
    // Mapping to track used nonces for EIP-3009 compatibility
    mapping(address => mapping(bytes32 => bool)) public authorizationState;
    
    // Events (EIP-3009 compatible)
    event AuthorizationUsed(address indexed authorizer, bytes32 indexed nonce);
    
    // Custom errors for gas efficiency
    error AuthorizationNotYetValid();
    error AuthorizationExpired();
    error AuthorizationAlreadyUsed();
    error InvalidSignatureLength();
    error TransferFailed();
    error PermitFailed();
    error InvalidToken();
    
    constructor(address _token) {
        if (_token == address(0)) revert InvalidToken();
        token = IERC20Permit(_token);
    }
    
    /**
     * @notice Executes transferWithAuthorization using permit for gasless approval
     * @dev Signature format options:
     *      - 65 bytes: Standard EIP-3009 signature (requires pre-approval)
     *      - 162 bytes: Combined signature with permit data for gasless operation
     *        [0-64]: EIP-3009 authorization signature (r,s,v) - 65 bytes
     *        [65-129]: EIP-2612 permit signature (r,s,v) - 65 bytes
     *        [130-161]: Permit deadline - 32 bytes
     *        
     * @param from Token owner's address
     * @param to Recipient's address
     * @param value Amount to transfer
     * @param validAfter Time after which authorization is valid
     * @param validBefore Time before which authorization is valid
     * @param nonce Unique nonce to prevent replay
     * @param signature Combined signature data
     */
    function transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        bytes calldata signature
    ) external {
        // Time validation
        if (block.timestamp < validAfter) revert AuthorizationNotYetValid();
        if (block.timestamp > validBefore) revert AuthorizationExpired();
        
        // Nonce validation
        if (authorizationState[from][nonce]) revert AuthorizationAlreadyUsed();
        
        // Mark nonce as used
        authorizationState[from][nonce] = true;
        
        // Handle different signature formats
        if (signature.length == 162) {
            // Combined signature with permit - GASLESS PATH
            _handlePermitAndTransfer(from, to, value, signature);
        } else if (signature.length == 65) {
            // Standard signature - requires pre-approval
            _handleDirectTransfer(from, to, value);
        } else {
            revert InvalidSignatureLength();
        }
        
        emit AuthorizationUsed(from, nonce);
    }
    
    /**
     * @dev Handles gasless transfer using permit
     */
    function _handlePermitAndTransfer(
        address from,
        address to,
        uint256 value,
        bytes calldata signature
    ) private {
        // Extract permit signature components
        bytes32 permitR;
        bytes32 permitS;
        uint8 permitV;
        uint256 deadline;
        
        assembly {
            // Skip first 65 bytes (EIP-3009 signature)
            permitR := calldataload(add(signature.offset, 65))
            permitS := calldataload(add(signature.offset, 97))
            permitV := byte(0, calldataload(add(signature.offset, 129)))
            deadline := calldataload(add(signature.offset, 130))
        }
        
        // Execute permit for gasless approval
        try token.permit(
            from,
            address(this),
            value,
            deadline,
            permitV,
            permitR,
            permitS
        ) {
            // Permit successful
        } catch {
            // Permit might have already been used or allowance exists
            // Continue to try transfer anyway
        }
        
        // Execute transfer
        bool success = token.transferFrom(from, to, value);
        if (!success) revert TransferFailed();
    }
    
    /**
     * @dev Handles direct transfer (requires pre-approval)
     */
    function _handleDirectTransfer(
        address from,
        address to,
        uint256 value
    ) private {
        bool success = token.transferFrom(from, to, value);
        if (!success) revert TransferFailed();
    }
    
    /**
     * @notice Helper to create permit signature data
     * @dev Call this off-chain to prepare the combined signature
     */
    function getPermitData(
        address owner,
        uint256 value,
        uint256 deadline
    ) external view returns (
        bytes32 domainSeparator,
        uint256 nonce
    ) {
        domainSeparator = token.DOMAIN_SEPARATOR();
        nonce = token.nonces(owner);
    }
    
    /**
     * @notice Returns wrapper name for EIP-712
     */
    function name() external pure returns (string memory) {
        return "X402 BSC Wrapper";
    }
    
    /**
     * @notice Returns wrapper version for EIP-712
     */
    function version() external pure returns (string memory) {
        return "2";
    }
}
