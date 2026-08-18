import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { AssetNexaRWA, AssetNexaCompliance, MockUSDC } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { AssetTypes } from "../typechain-types/contracts/AssetNexaRWA";

describe("AssetNexaRWA Contract", function () {
  let rwa: AssetNexaRWA;
  let compliance: AssetNexaCompliance;
  let paymentToken: MockUSDC;
  let admin: HardhatEthersSigner;
  let issuer: HardhatEthersSigner;
  let minter: HardhatEthersSigner;
  let priceManager: HardhatEthersSigner;
  let investor1: HardhatEthersSigner;
  let investor2: HardhatEthersSigner;

  const testAssetId = ethers.keccak256(ethers.toUtf8Bytes("ASSET_CHENNAI_TECH_CAMPUS"));
  const totalSupplyCap = 10_000_000n; // 10 Million units
  const initialPrice = ethers.parseUnits("1", 6); // 1 USDC per unit
  const totalValuation = ethers.parseUnits("10000000", 6); // 10,000,000 USDC

  beforeEach(async function () {
    [admin, issuer, minter, priceManager, investor1, investor2] = await ethers.getSigners();

    // Deploy Mock USDC
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    paymentToken = await MockUSDCFactory.deploy();
    await paymentToken.waitForDeployment();

    // Deploy Compliance Registry
    const ComplianceFactory = await ethers.getContractFactory("AssetNexaCompliance");
    compliance = await ComplianceFactory.deploy(admin.address);
    await compliance.waitForDeployment();

    // Whitelist investors in compliance
    await compliance.setKYCStatus(investor1.address, true);
    await compliance.setKYCStatus(investor2.address, true);

    // Deploy AssetNexaRWA
    const params = {
      assetId: testAssetId,
      name: "Chennai Tech Campus",
      symbol: "CTC",
      metadataURI: "ipfs://QmAssetNexaChennaiTechCampusProspectus",
      category: 0, // COMMERCIAL_REAL_ESTATE
      totalValuation: totalValuation,
      totalSupplyCap: totalSupplyCap,
      initialPrice: initialPrice,
      paymentToken: await paymentToken.getAddress(),
      issuer: issuer.address,
    };

    const RWAFactory = await ethers.getContractFactory("AssetNexaRWA");
    rwa = await RWAFactory.deploy(params, await compliance.getAddress(), admin.address);
    await rwa.waitForDeployment();

    // Grant roles
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    const PRICE_MANAGER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PRICE_MANAGER_ROLE"));
    await rwa.grantRole(MINTER_ROLE, minter.address);
    await rwa.grantRole(PRICE_MANAGER_ROLE, priceManager.address);
  });

  describe("Initialization & Immutable Supply Cap", function () {
    it("should initialize with correct metadata and 0 initial supply", async function () {
      expect(await rwa.name()).to.equal("Chennai Tech Campus");
      expect(await rwa.symbol()).to.equal("CTC");
      expect(await rwa.decimals()).to.equal(0);
      expect(await rwa.totalSupply()).to.equal(0n);
      expect(await rwa.totalSupplyCap()).to.equal(totalSupplyCap);
      expect(await rwa.remainingUnits()).to.equal(totalSupplyCap);
      expect(await rwa.status()).to.equal(0); // DRAFT
    });
  });

  describe("Lifecycle State Transitions", function () {
    it("should allow valid state transitions from DRAFT to PENDING_APPROVAL to PUBLISHED to FUNDING", async function () {
      // DRAFT -> PENDING_APPROVAL
      await rwa.setStatus(1); // PENDING_APPROVAL
      expect(await rwa.status()).to.equal(1);

      // PENDING_APPROVAL -> PUBLISHED
      await rwa.setStatus(2); // PUBLISHED
      expect(await rwa.status()).to.equal(2);

      // PUBLISHED -> FUNDING
      await rwa.setStatus(3); // FUNDING
      expect(await rwa.status()).to.equal(3);
    });

    it("should reject invalid direct transitions", async function () {
      // Cannot jump from DRAFT (0) directly to CLOSED (5)
      await expect(rwa.setStatus(5)).to.be.reverted;
    });
  });

  describe("Minting and Supply Controls", function () {
    beforeEach(async function () {
      await rwa.setStatus(1); // PENDING_APPROVAL
      await rwa.setStatus(2); // PUBLISHED
      await rwa.setStatus(3); // FUNDING
    });

    it("should mint units up to cap when in FUNDING status", async function () {
      await rwa.connect(minter).mint(investor1.address, 1000n);
      expect(await rwa.balanceOf(investor1.address)).to.equal(1000n);
      expect(await rwa.totalSupply()).to.equal(1000n);
      expect(await rwa.remainingUnits()).to.equal(totalSupplyCap - 1000n);
    });

    it("should revert if minting exceeds maximum supply cap", async function () {
      await expect(
        rwa.connect(minter).mint(investor1.address, totalSupplyCap + 1n)
      ).to.be.reverted;
    });

    it("should automatically transition to FUNDED when cap is reached", async function () {
      await rwa.connect(minter).mint(investor1.address, totalSupplyCap);
      expect(await rwa.totalSupply()).to.equal(totalSupplyCap);
      expect(await rwa.status()).to.equal(4); // FUNDED
    });
  });

  describe("Compliance-Gated Transfers", function () {
    beforeEach(async function () {
      await rwa.setStatus(1);
      await rwa.setStatus(2);
      await rwa.setStatus(3);
      await rwa.connect(minter).mint(investor1.address, 5000n);
    });

    it("should allow transfer between two KYC-approved investors", async function () {
      await rwa.connect(investor1).transfer(investor2.address, 2000n);
      expect(await rwa.balanceOf(investor1.address)).to.equal(3000n);
      expect(await rwa.balanceOf(investor2.address)).to.equal(2000n);
    });

    it("should block transfer to unapproved/non-KYC recipient", async function () {
      const [, , , , , , nonKYCUser] = await ethers.getSigners();
      await expect(
        rwa.connect(investor1).transfer(nonKYCUser.address, 1000n)
      ).to.be.reverted;
    });
  });

  describe("Record Date Snapshots", function () {
    beforeEach(async function () {
      await rwa.setStatus(1);
      await rwa.setStatus(2);
      await rwa.setStatus(3);
      await rwa.connect(minter).mint(investor1.address, 5000n);
      await rwa.connect(minter).mint(investor2.address, 3000n);
    });

    it("should record snapshot and maintain historical balances", async function () {
      const tx = await rwa.snapshot();
      const snapId = await rwa.currentSnapshotId();
      expect(snapId).to.equal(1n);

      expect(await rwa.balanceOfAt(investor1.address, snapId)).to.equal(5000n);
      expect(await rwa.balanceOfAt(investor2.address, snapId)).to.equal(3000n);
      expect(await rwa.totalSupplyAt(snapId)).to.equal(8000n);

      // Perform transfer after snapshot
      await rwa.connect(investor1).transfer(investor2.address, 2000n);
      expect(await rwa.balanceOf(investor1.address)).to.equal(3000n);

      // Snapshot balance remains intact
      expect(await rwa.balanceOfAt(investor1.address, snapId)).to.equal(5000n);
    });
  });
});
