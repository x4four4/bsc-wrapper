# Security Policy

## 🔒 Security Model

The X402 BSC Wrapper implements multiple layers of security:

### 1. **Signature Verification**

- EIP-712 typed data signatures
- Domain separation prevents cross-chain replay
- Signer recovery validates authorization

### 2. **Replay Protection**

- Unique nonces prevent transaction replay
- Nonce state tracked on-chain
- One-time use guarantee

### 3. **Time Windows**

- `validAfter` ensures not too early
- `validBefore` prevents expired authorizations
- Protects against delayed execution attacks

### 4. **Access Control**

- No admin functions or special privileges
- Immutable contract (no upgrades)
- Non-custodial (no fund custody)

## 🐛 Reporting Vulnerabilities

### Responsible Disclosure

We take security seriously and appreciate responsible disclosure of vulnerabilities.

**DO:**

- 🔒 Report privately first
- 📧 Email: security@x4four4.org
- 🔐 Use PGP if possible
- ⏰ Allow 90 days for fix

**DON'T:**

- ❌ Disclose publicly before fix
- ❌ Exploit on mainnet
- ❌ Harm users' funds

### Bug Bounty Program

| Severity     | Reward        | Example                          |
| ------------ | ------------- | -------------------------------- |
| **Critical** | Up to $10,000 | Fund loss, unauthorized transfer |
| **High**     | Up to $5,000  | Signature bypass, replay attack  |
| **Medium**   | Up to $1,000  | Gas griefing, DoS                |
| **Low**      | Up to $500    | Minor issues                     |

### Scope

**In Scope:**

- X402BSCWrapper.sol contract
- Signature verification logic
- Nonce management
- Time validation
- USD1 integration

**Out of Scope:**

- USD1 token itself
- Frontend applications
- Off-chain infrastructure
- Known BSC issues

## 🛡️ Security Checklist

### For Auditors

- [ ] Signature verification correctness
- [ ] Nonce uniqueness enforcement
- [ ] Time window validation
- [ ] Reentrancy protection
- [ ] Integer overflow/underflow
- [ ] Gas optimization vs security
- [ ] External call safety
- [ ] Error handling

### For Integrators

- [ ] Use correct chain ID
- [ ] Validate wrapper address
- [ ] Check time windows
- [ ] Generate unique nonces
- [ ] Verify signatures off-chain
- [ ] Handle errors gracefully
- [ ] Test on testnet first
- [ ] Monitor gas prices

## 🔍 Known Issues

### Gas Limitations

- Combined signatures (194 bytes) cost more gas
- Permit operations add ~50k gas overhead
- Consider gas price when setting fees

### USD1 Dependency

- Wrapper depends on USD1 token behavior
- USD1 must maintain ERC-20 compatibility
- Permit functionality requires EIP-2612

## 📚 Security Resources

### Standards

- [EIP-3009](https://eips.ethereum.org/EIPS/eip-3009) - Transfer With Authorization
- [EIP-2612](https://eips.ethereum.org/EIPS/eip-2612) - Permit
- [EIP-712](https://eips.ethereum.org/EIPS/eip-712) - Typed Data Signing

### Tools

- [Slither](https://github.com/crytic/slither) - Static analysis
- [Mythril](https://github.com/ConsenSys/mythril) - Security analysis
- [Echidna](https://github.com/crytic/echidna) - Fuzzing

### Best Practices

- [ConsenSys Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [OpenZeppelin Security](https://docs.openzeppelin.com/contracts/4.x/)
- [SWC Registry](https://swcregistry.io/)

## 🚨 Emergency Contacts

**Critical Issues:**

- Email: security@x4four4.org
- Telegram: @x4four4security
- Response Time: < 24 hours

**Non-Critical:**

- GitHub Issues: [Report Issue](https://github.com/x4four4/bsc-wrapper/issues)
- Discord: [Join Server](https://discord.gg/x4four4)

## 📋 Audit History

| Date    | Auditor | Report | Issues Found | Status            |
| ------- | ------- | ------ | ------------ | ----------------- |
| Pending | TBD     | -      | -            | Scheduled Q1 2024 |

## 🔄 Update Policy

Security updates are released as follows:

1. **Critical:** Immediate patch and disclosure
2. **High:** Patch within 7 days
3. **Medium:** Patch within 30 days
4. **Low:** Next regular update

## 📜 Disclosure Policy

After a vulnerability is fixed:

1. **Day 0:** Patch deployed
2. **Day 7:** Limited disclosure to partners
3. **Day 30:** Public disclosure with details
4. **Day 90:** Full technical writeup

---

**Last Updated:** December 2023

**Security Contact:** security@x4four4.org

**PGP Key:** [Download](https://x4four4.org/pgp.asc)
