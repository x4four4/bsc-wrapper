// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/**
 * @title IERC20Permit
 * @notice Interface for EIP-2612 Permit functionality
 * @dev Allows approvals via signatures for gasless transactions
 */
interface IERC20Permit {
    /**
     * @notice Sets approval via signature
     * @param owner Token owner
     * @param spender Address to approve
     * @param value Amount to approve
     * @param deadline Expiration timestamp
     * @param v Signature component
     * @param r Signature component  
     * @param s Signature component
     */
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
    
    /**
     * @notice Returns current nonce for an address
     * @param owner Address to query
     * @return Current nonce
     */
    function nonces(address owner) external view returns (uint256);
    
    /**
     * @notice Returns domain separator for EIP-712
     * @return Domain separator hash
     */
    function DOMAIN_SEPARATOR() external view returns (bytes32);
}
