// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title IX402
 * @notice Interface for x402 protocol (EIP-3009 compatible)
 * @dev Defines the transferWithAuthorization standard
 */
interface IX402 {
    /**
     * @notice Execute a transfer with a signed authorization
     * @param from Payer address
     * @param to Payee address
     * @param value Amount in smallest unit
     * @param validAfter Unix timestamp after which valid
     * @param validBefore Unix timestamp before which valid
     * @param nonce Unique nonce for replay protection
     * @param signature EIP-712 signature
     */
    function transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        bytes calldata signature
    ) external;
    
    /**
     * @notice Returns authorization state for a nonce
     * @param authorizer Address that signed
     * @param nonce Nonce to check
     * @return True if nonce has been used
     */
    function authorizationState(
        address authorizer,
        bytes32 nonce
    ) external view returns (bool);
    
    event AuthorizationUsed(address indexed authorizer, bytes32 indexed nonce);
}
