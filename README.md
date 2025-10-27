# X402 BSC Wrapper

![License](https://img.shields.io/badge/license-MIT-blue)
![Solidity](https://img.shields.io/badge/solidity-0.8.19-orange)
![BSC](https://img.shields.io/badge/BSC-Mainnet%20%26%20Testnet-yellow)
[![Tests](https://img.shields.io/badge/tests-passing-green)](./test)
[![Audit](https://img.shields.io/badge/audit-pending-yellow)](./audits)

## Overview

X402 BSC Wrapper is a smart contract that provides EIP-3009 (`transferWithAuthorization`) compatibility for USD1 tokens on BNB Smart Chain. It enables gasless transactions and seamless integration with the x402 payment protocol.

## 🎯 Problem & Solution

**Problem:** USD1 on BSC doesn't implement EIP-3009, which x402 protocol requires.

**Solution:** This wrapper acts as a compatibility layer, accepting EIP-3009 calls and converting them to EIP-2612 permit + ERC-20 transfers.

## ✨ Features

- ✅ **EIP-3009 Compatible** - Full `transferWithAuthorization` support
- ✅ **Gasless Transactions** - Users can sign, facilitators pay gas (Mainnet only)
- ✅ **EIP-2612 Integration** - Supports permit for gasless approvals
- ✅ **Security First** - Nonce management, time windows, replay protection
- ✅ **Gas Optimized** - Efficient implementation (~150k gas per transfer)
- ✅ **Fully Auditable** - Open source, verified contracts

## 📍 Deployed Contracts

### Active Deployments

| Network         | Address                                      | Status      | Gasless Support | Explorer                                                                                       |
| --------------- | -------------------------------------------- | ----------- | --------------- | ---------------------------------------------------------------------------------------------- |
| **BSC Mainnet** | `0x39228EB6452e6880Dee82e55d49468ce6697fB46` | ✅ Verified | ✅ Full Permit  | [BscScan](https://bscscan.com/address/0x39228EB6452e6880Dee82e55d49468ce6697fB46#code)         |
| **BSC Testnet** | `0xb73727c185fc8444a3c31dc5a25556d76f5d8c42` | ✅ Verified | ❌ No Permit    | [BscScan](https://testnet.bscscan.com/address/0xb73727c185fc8444a3c31dc5a25556d76f5d8c42#code) |

### Contract Links

#### 🌐 **BSC Mainnet**

- **Contract:** [`0x39228EB6452e6880Dee82e55d49468ce6697fB46`](https://bscscan.com/address/0x39228EB6452e6880Dee82e55d49468ce6697fB46)
- **Verified Code:** [View Source](https://bscscan.com/address/0x39228EB6452e6880Dee82e55d49468ce6697fB46#code)
- **Read Contract:** [Query Functions](https://bscscan.com/address/0x39228EB6452e6880Dee82e55d49468ce6697fB46#readContract)
- **Write Contract:** [Interact](https://bscscan.com/address/0x39228EB6452e6880Dee82e55d49468ce6697fB46#writeContract)
- **USD1 Token:** [`0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d`](https://bscscan.com/token/0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d)

#### 🧪 **BSC Testnet**

- **Contract:** [`0xb73727c185fc8444a3c31dc5a25556d76f5d8c42`](https://testnet.bscscan.com/address/0xb73727c185fc8444a3c31dc5a25556d76f5d8c42)
- **Verified Code:** [View Source](https://testnet.bscscan.com/address/0xb73727c185fc8444a3c31dc5a25556d76f5d8c42#code)
- **Read Contract:** [Query Functions](https://testnet.bscscan.com/address/0xb73727c185fc8444a3c31dc5a25556d76f5d8c42#readContract)
- **Write Contract:** [Interact](https://testnet.bscscan.com/address/0xb73727c185fc8444a3c31dc5a25556d76f5d8c42#writeContract)
- **USD1 Token:** [`0x004ba8e73b41750084b01edacc08c39662e262af`](https://testnet.bscscan.com/token/0x004ba8e73b41750084b01edacc08c39662e262af)

### 📊 Contract Features

| Feature                 | BSC Mainnet      | BSC Testnet              |
| ----------------------- | ---------------- | ------------------------ |
| **EIP-3009 Support**    | ✅ Full          | ✅ Full                  |
| **EIP-2612 Permit**     | ✅ USD1 Supports | ❌ USD1 Doesn't Support  |
| **Gasless Transfers**   | ✅ Available     | ❌ Pre-approval Required |
| **Verification Status** | ✅ Verified      | ✅ Verified              |
| **Deployment Date**     | October 2024     | October 2024             |

## 🚀 Quick Start

### Installation

```bash
# Clone repository
git clone https://github.com/x4four4/bsc-wrapper
cd bsc-wrapper

# Install dependencies
npm install

# Copy environment variables
cp .env.template .env
# Edit .env with your private key and API keys
```

### Testing

```bash
# Run all tests
npm test

# Run with gas reporting
npm run test:gas

# Run with coverage
npm run test:coverage
```

### Deployment

```bash
# Deploy to testnet
npm run deploy:testnet

# Deploy to mainnet
npm run deploy:mainnet

# Verify on BscScan
npm run verify:testnet
npm run verify:mainnet
```

## 💻 Integration

### JavaScript/TypeScript

```javascript
const { ethers } = require("ethers");

// Contract addresses (BSC Mainnet)
const WRAPPER = "0x39228EB6452e6880Dee82e55d49468ce6697fB46";
const USD1 = "0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d";

// For Testnet:
// const WRAPPER = "0xb73727c185fc8444a3c31dc5a25556d76f5d8c42";
// const USD1 = "0x004ba8e73b41750084b01edacc08c39662e262af";

// Create signature
async function createPayment(signer, to, amount) {
  const domain = {
    name: "X402 BSC Wrapper",
    version: "2",
    chainId: 56,
    verifyingContract: WRAPPER,
  };

  const types = {
    TransferWithAuthorization: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
    ],
  };

  const nonce = ethers.randomBytes(32);
  const value = ethers.parseUnits(amount.toString(), 18);
  const validAfter = Math.floor(Date.now() / 1000) - 60;
  const validBefore = Math.floor(Date.now() / 1000) + 3600;

  const message = {
    from: signer.address,
    to,
    value,
    validAfter,
    validBefore,
    nonce: ethers.hexlify(nonce),
  };

  const signature = await signer.signTypedData(domain, types, message);

  return { ...message, signature };
}
```

### Solidity

```solidity
interface IX402BSCWrapper {
    function transferWithAuthorization(
        address from,
        address to,
        uint256 value,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        bytes calldata signature
    ) external;
}
```

## 🔒 Security

- **Audits:** Pending professional audit (Q1 2024)
- **Bug Bounty:** Report issues via [security@x4four4.org](mailto:security@x4four4.org)
- **Verified:** Contracts verified on BscScan
- **Immutable:** No admin functions, upgrades, or pausability

## 📊 Gas Costs

| Operation         | Gas Units | Cost (3 gwei) | Cost (USD @ $700/BNB) |
| ----------------- | --------- | ------------- | --------------------- |
| Standard Transfer | ~150,000  | 0.00045 BNB   | ~$0.31                |
| With Permit       | ~200,000  | 0.0006 BNB    | ~$0.42                |

## 🛠️ Architecture

```
User → Signs Message → Facilitator → Wrapper → USD1 Token
         (No gas)       (Pays gas)
```

## 📁 Repository Structure

```
├── contracts/          # Solidity contracts
├── scripts/            # Deployment scripts
├── test/               # Test suite
├── deployments/        # Deployment artifacts
├── docs/               # Documentation
├── examples/           # Integration examples
└── audits/             # Security audits
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -am 'Add feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- **x402 Protocol:** [https://x402.org](https://x402.org)
- **USD1 Token:** [BscScan](https://bscscan.com/token/0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d)
- **Documentation:** [GitBook](https://x402.gitbook.io)
- **Twitter:** [@x4four4](https://twitter.com/x4four4)

## ⚠️ Disclaimer

This software is provided "as is", without warranty of any kind. Use at your own risk. Always audit and test thoroughly before mainnet deployment.

---

**Built with ❤️ for the x402 ecosystem**
