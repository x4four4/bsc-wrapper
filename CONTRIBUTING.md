# Contributing to X402 BSC Wrapper

Thank you for your interest in contributing to X402 BSC Wrapper! We welcome contributions from the community.

## 📋 Code of Conduct

By participating in this project, you agree to:

- Be respectful and inclusive
- Welcome newcomers and help them
- Focus on what's best for the community
- Show empathy towards others

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git
- Basic knowledge of Solidity and Hardhat

### Setup

1. Fork the repository
2. Clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/bsc-wrapper.git
cd bsc-wrapper
```

3. Install dependencies:

```bash
npm install
```

4. Create a branch:

```bash
git checkout -b feature/your-feature-name
```

## 💻 Development Process

### 1. Make Changes

- Write clean, readable code
- Follow existing patterns
- Add comments for complex logic
- Update tests for new features

### 2. Test Your Changes

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Check gas usage
npm run test:gas
```

### 3. Lint Your Code

```bash
# Solidity linting
npx solhint 'contracts/**/*.sol'

# JavaScript linting
npx eslint '**/*.js'

# Format code
npx prettier --write '**/*.{js,sol,json,md}'
```

### 4. Commit Your Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Features
git commit -m "feat: add permit support for gasless approvals"

# Bug fixes
git commit -m "fix: correct nonce validation logic"

# Documentation
git commit -m "docs: update integration guide"

# Tests
git commit -m "test: add edge cases for time validation"

# Refactoring
git commit -m "refactor: optimize signature parsing"
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## 📝 Pull Request Guidelines

### PR Title

Follow the same convention as commits:

- `feat: description` for features
- `fix: description` for bug fixes
- `docs: description` for documentation
- `test: description` for tests

### PR Description

Include:

- **What**: Brief description of changes
- **Why**: Motivation and context
- **How**: Technical approach
- **Testing**: How you tested
- **Screenshots**: If applicable

### Example PR Description

```markdown
## What

Adds EIP-2612 permit support to enable gasless approvals.

## Why

Users currently need 2 transactions (approve + transfer).
With permit, this reduces to 1 transaction, improving UX.

## How

- Added permit signature parsing in `transferWithAuthorization`
- Extended signature length check (65 vs 194 bytes)
- Integrated permit call before transferFrom

## Testing

- Added unit tests for permit flow
- Tested on BSC testnet
- Gas costs: ~200k (vs 150k standard)

## Checklist

- [x] Tests pass
- [x] Coverage maintained
- [x] Documentation updated
```

## 🐛 Reporting Issues

### Before Reporting

1. Check existing issues
2. Try latest version
3. Verify your setup

### Issue Template

```markdown
**Description**
Clear description of the issue

**Steps to Reproduce**

1. Step one
2. Step two
3. ...

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**

- Network: BSC Mainnet/Testnet
- Node version:
- Wrapper version:

**Additional Context**
Error messages, logs, screenshots
```

## 🏗️ Project Structure

```
contracts/
├── contracts/           # Solidity contracts
│   ├── X402BSCWrapper.sol
│   └── interfaces/      # Contract interfaces
├── scripts/             # Deployment/utility scripts
├── test/                # Test files
├── docs/                # Documentation
└── examples/            # Integration examples
```

## 🧪 Testing Guidelines

### Test Coverage

Maintain minimum 90% coverage:

- Unit tests for all functions
- Edge cases and error conditions
- Gas optimization tests
- Integration tests

### Writing Tests

```javascript
describe("Feature", function () {
  it("should do something specific", async function () {
    // Arrange
    const setup = await loadFixture(deployFixture);

    // Act
    const result = await contract.method();

    // Assert
    expect(result).to.equal(expected);
  });
});
```

## 📚 Documentation

### Code Comments

```solidity
/**
 * @notice Executes a transfer with authorization
 * @dev Validates signature and time windows
 * @param from Token owner address
 * @param to Recipient address
 * @param value Amount to transfer
 */
function transferWithAuthorization(...) external {
    // Implementation
}
```

### README Updates

Update README.md when:

- Adding new features
- Changing deployment addresses
- Modifying integration process

## 🔐 Security

### Security Checklist

- [ ] No reentrancy vulnerabilities
- [ ] Proper access control
- [ ] Input validation
- [ ] Gas optimization without sacrificing security
- [ ] Comprehensive test coverage

### Reporting Security Issues

**DO NOT** create public issues for security vulnerabilities.

Email: security@x4four4.org

## 🎯 Areas to Contribute

### Good First Issues

- Documentation improvements
- Test coverage increase
- Gas optimizations
- Example integrations

### Feature Ideas

- Multi-token support
- Batch transfers
- Meta-transaction relayer
- Cross-chain compatibility

### Current Priorities

1. Security audit preparation
2. Gas optimization
3. Integration examples
4. Documentation expansion

## 📞 Getting Help

- **Discord**: [Join our server](https://discord.gg/x4four4)
- **Discussions**: Use GitHub Discussions
- **Email**: dev@x4four4.org

## 🙏 Recognition

Contributors will be:

- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Invited to private Discord channel
- Eligible for bounties (if applicable)

## 📜 License

By contributing, you agree that your contributions will be licensed under MIT License.

---

**Thank you for contributing to X402 BSC Wrapper!** 🚀
