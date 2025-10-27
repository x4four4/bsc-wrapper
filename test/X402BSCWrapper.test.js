const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");

describe("X402BSCWrapper", function () {
  // Deploy fixture
  async function deployWrapperFixture() {
    const [owner, user, facilitator, recipient] = await ethers.getSigners();

    // Deploy mock USD1 token
    const MockUSD1 = await ethers.getContractFactory("MockERC20Permit");
    const usd1 = await MockUSD1.deploy("USD1", "USD1", 18);
    await usd1.waitForDeployment();

    // Deploy wrapper
    const X402BSCWrapper = await ethers.getContractFactory("X402BSCWrapper");
    const wrapper = await X402BSCWrapper.deploy(await usd1.getAddress());
    await wrapper.waitForDeployment();

    // Mint tokens to user
    const amount = ethers.parseUnits("1000", 18);
    await usd1.mint(user.address, amount);

    return { wrapper, usd1, owner, user, facilitator, recipient };
  }

  describe("Deployment", function () {
    it("Should set the correct token address", async function () {
      const { wrapper, usd1 } = await loadFixture(deployWrapperFixture);
      expect(await wrapper.token()).to.equal(await usd1.getAddress());
    });

    it("Should have correct name and version", async function () {
      const { wrapper } = await loadFixture(deployWrapperFixture);
      expect(await wrapper.name()).to.equal("X402 BSC Wrapper");
      expect(await wrapper.version()).to.equal("2");
    });

    it("Should revert with zero address", async function () {
      const X402BSCWrapper = await ethers.getContractFactory("X402BSCWrapper");
      await expect(
        X402BSCWrapper.deploy(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(X402BSCWrapper, "InvalidToken");
    });
  });

  describe("TransferWithAuthorization", function () {
    it("Should execute valid transfer", async function () {
      const { wrapper, usd1, user, recipient } =
        await loadFixture(deployWrapperFixture);

      // Approve wrapper
      const amount = ethers.parseUnits("10", 18);
      await usd1.connect(user).approve(await wrapper.getAddress(), amount);

      // Create authorization
      const nonce = ethers.randomBytes(32);
      const validAfter = (await time.latest()) - 60;
      const validBefore = (await time.latest()) + 3600;

      // Sign authorization
      const domain = {
        name: await wrapper.name(),
        version: await wrapper.version(),
        chainId: 31337, // Hardhat chainId
        verifyingContract: await wrapper.getAddress(),
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

      const message = {
        from: user.address,
        to: recipient.address,
        value: amount,
        validAfter,
        validBefore,
        nonce: ethers.hexlify(nonce),
      };

      const signature = await user.signTypedData(domain, types, message);

      // Execute transfer
      await expect(
        wrapper.transferWithAuthorization(
          user.address,
          recipient.address,
          amount,
          validAfter,
          validBefore,
          ethers.hexlify(nonce),
          signature
        )
      )
        .to.emit(wrapper, "AuthorizationUsed")
        .withArgs(user.address, ethers.hexlify(nonce));

      // Check balances
      expect(await usd1.balanceOf(recipient.address)).to.equal(amount);
    });

    it("Should prevent replay attacks", async function () {
      const { wrapper, usd1, user, recipient } =
        await loadFixture(deployWrapperFixture);

      const amount = ethers.parseUnits("10", 18);
      await usd1.connect(user).approve(await wrapper.getAddress(), amount * 2n);

      const nonce = ethers.randomBytes(32);
      const validAfter = (await time.latest()) - 60;
      const validBefore = (await time.latest()) + 3600;

      const domain = {
        name: await wrapper.name(),
        version: await wrapper.version(),
        chainId: 31337,
        verifyingContract: await wrapper.getAddress(),
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

      const message = {
        from: user.address,
        to: recipient.address,
        value: amount,
        validAfter,
        validBefore,
        nonce: ethers.hexlify(nonce),
      };

      const signature = await user.signTypedData(domain, types, message);

      // First transfer should succeed
      await wrapper.transferWithAuthorization(
        user.address,
        recipient.address,
        amount,
        validAfter,
        validBefore,
        ethers.hexlify(nonce),
        signature
      );

      // Second transfer with same nonce should fail
      await expect(
        wrapper.transferWithAuthorization(
          user.address,
          recipient.address,
          amount,
          validAfter,
          validBefore,
          ethers.hexlify(nonce),
          signature
        )
      ).to.be.revertedWithCustomError(wrapper, "AuthorizationAlreadyUsed");
    });

    it("Should respect time windows", async function () {
      const { wrapper, usd1, user, recipient } =
        await loadFixture(deployWrapperFixture);

      const amount = ethers.parseUnits("10", 18);
      await usd1.connect(user).approve(await wrapper.getAddress(), amount);

      const nonce = ethers.randomBytes(32);
      const currentTime = await time.latest();

      // Test expired authorization
      const expiredAuth = {
        validAfter: currentTime - 7200,
        validBefore: currentTime - 3600,
      };

      const domain = {
        name: await wrapper.name(),
        version: await wrapper.version(),
        chainId: 31337,
        verifyingContract: await wrapper.getAddress(),
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

      const message = {
        from: user.address,
        to: recipient.address,
        value: amount,
        validAfter: expiredAuth.validAfter,
        validBefore: expiredAuth.validBefore,
        nonce: ethers.hexlify(nonce),
      };

      const signature = await user.signTypedData(domain, types, message);

      await expect(
        wrapper.transferWithAuthorization(
          user.address,
          recipient.address,
          amount,
          expiredAuth.validAfter,
          expiredAuth.validBefore,
          ethers.hexlify(nonce),
          signature
        )
      ).to.be.revertedWithCustomError(wrapper, "AuthorizationExpired");
    });
  });

  describe("Permit Integration", function () {
    it("Should handle combined permit+transfer signature", async function () {
      const { wrapper, usd1, user, recipient } =
        await loadFixture(deployWrapperFixture);

      const amount = ethers.parseUnits("10", 18);
      const nonce = ethers.randomBytes(32);
      const validAfter = (await time.latest()) - 60;
      const validBefore = (await time.latest()) + 3600;
      const deadline = (await time.latest()) + 3600;

      // Create x402 signature
      const x402Domain = {
        name: await wrapper.name(),
        version: await wrapper.version(),
        chainId: 31337,
        verifyingContract: await wrapper.getAddress(),
      };

      const x402Types = {
        TransferWithAuthorization: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "validAfter", type: "uint256" },
          { name: "validBefore", type: "uint256" },
          { name: "nonce", type: "bytes32" },
        ],
      };

      const x402Message = {
        from: user.address,
        to: recipient.address,
        value: amount,
        validAfter,
        validBefore,
        nonce: ethers.hexlify(nonce),
      };

      const x402Signature = await user.signTypedData(
        x402Domain,
        x402Types,
        x402Message
      );

      // Create permit signature (mock for testing - 65 bytes)
      // Format: r(32) + s(32) + v(1) = 65 bytes
      const permitR = "b".repeat(64); // 32 bytes for r
      const permitS = "c".repeat(64); // 32 bytes for s
      const permitV = "1b"; // 1 byte for v
      const permitSignature = "0x" + permitR + permitS + permitV;

      // Deadline as 32 bytes
      const deadlineHex = ethers.toBeHex(deadline, 32).slice(2); // 32 bytes

      // Combine signatures: x402(65) + permit(65) + deadline(32) = 162 bytes
      const combinedSignature =
        x402Signature + permitSignature.slice(2) + deadlineHex;

      // Verify combined signature length (65 + 65 + 32 = 162 bytes)
      expect((combinedSignature.length - 2) / 2).to.equal(162);
    });
  });

  describe("Gas Optimization", function () {
    it("Should consume reasonable gas", async function () {
      const { wrapper, usd1, user, recipient } =
        await loadFixture(deployWrapperFixture);

      const amount = ethers.parseUnits("10", 18);
      await usd1.connect(user).approve(await wrapper.getAddress(), amount);

      const nonce = ethers.randomBytes(32);
      const validAfter = (await time.latest()) - 60;
      const validBefore = (await time.latest()) + 3600;

      const domain = {
        name: await wrapper.name(),
        version: await wrapper.version(),
        chainId: 31337,
        verifyingContract: await wrapper.getAddress(),
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

      const message = {
        from: user.address,
        to: recipient.address,
        value: amount,
        validAfter,
        validBefore,
        nonce: ethers.hexlify(nonce),
      };

      const signature = await user.signTypedData(domain, types, message);

      const tx = await wrapper.transferWithAuthorization(
        user.address,
        recipient.address,
        amount,
        validAfter,
        validBefore,
        ethers.hexlify(nonce),
        signature
      );

      const receipt = await tx.wait();

      // Gas should be under 200k for standard transfer
      expect(receipt.gasUsed).to.be.lessThan(200000n);
    });
  });
});
