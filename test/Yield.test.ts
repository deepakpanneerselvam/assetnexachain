import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import {
  AssetNexaCompliance,
  AssetNexaRWA,
  AssetNexaYield,
  MockUSDC,
} from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("AssetNexaYield Contract", function () {
  let compliance: AssetNexaCompliance;
  let rwa: AssetNexaRWA;
  let yieldContract: AssetNexaYield;
  let paymentToken: MockUSDC;
  let admin: HardhatEthersSigner;
  let issuer: HardhatEthersSigner;
  let investor1: HardhatEthersSigner;
  let investor2: HardhatEthersSigner;

  const testAssetId = ethers.keccak256(ethers.toUtf8Bytes("ASSET_CHENNAI_TECH_CAMPUS"));
  const totalSupplyCap = 10_000n;
  const initialPrice = ethers.parseUnits("1", 6);
  const totalValuation = ethers.parseUnits("10000", 6);

  beforeEach(async function () {
    [admin, issuer, investor1, investor2] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    paymentToken = await MockUSDCFactory.deploy();
    await paymentToken.waitForDeployment();

    // Deploy Compliance
    const ComplianceFactory = await ethers.getContractFactory("AssetNexaCompliance");
    compliance = await ComplianceFactory.deploy(admin.address);
    await compliance.waitForDeployment();

    // Whitelist investors
    await compliance.setKYCStatus(investor1.address, true);
    await compliance.setKYCStatus(investor2.address, true);

    // Deploy RWA
    const params = {
      assetId: testAssetId,
      name: "Chennai Tech Campus",
      symbol: "CTC",
      metadataURI: "ipfs://QmProspectusHash",
      category: 0,
      totalValuation: totalValuation,
      totalSupplyCap: totalSupplyCap,
      initialPrice: initialPrice,
      paymentToken: await paymentToken.getAddress(),
      issuer: issuer.address,
    };

    const RWAFactory = await ethers.getContractFactory("AssetNexaRWA");
    rwa = await RWAFactory.deploy(params, await compliance.getAddress(), admin.address);
    await rwa.waitForDeployment();

    // Set to FUNDING & mint tokens to investors
    await rwa.setStatus(1);
    await rwa.setStatus(2);
    await rwa.setStatus(3);

    // Admin has default admin role and can grant MINTER_ROLE
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    await rwa.grantRole(MINTER_ROLE, admin.address);

    // Mint 6,000 units to investor1 (60%), 4,000 units to investor2 (40%)
    await rwa.mint(investor1.address, 6000n);
    await rwa.mint(investor2.address, 4000n);

    // Deploy Yield Contract (constructor takes only admin)
    const YieldFactory = await ethers.getContractFactory("AssetNexaYield");
    yieldContract = await YieldFactory.deploy(admin.address);
    await yieldContract.waitForDeployment();

    // Grant SNAPSHOT_ROLE to Yield contract on RWA
    const SNAPSHOT_ROLE = ethers.keccak256(ethers.toUtf8Bytes("SNAPSHOT_ROLE"));
    await rwa.grantRole(SNAPSHOT_ROLE, await yieldContract.getAddress());

    // Grant DISTRIBUTOR_ROLE to issuer
    const DISTRIBUTOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("DISTRIBUTOR_ROLE"));
    await yieldContract.grantRole(DISTRIBUTOR_ROLE, issuer.address);

    // Fund issuer with 1,000 USDC for distribution
    await paymentToken.mint(issuer.address, ethers.parseUnits("1000", 6));
  });

  describe("Yield Distribution and Pro-Rata Claiming", function () {
    it("should distribute yield and allow investors to claim their exact share", async function () {
      const distributionAmount = ethers.parseUnits("1000", 6); // 1,000 USDC

      // Approve yield contract
      await paymentToken.connect(issuer).approve(await yieldContract.getAddress(), distributionAmount);

      // Create distribution
      await yieldContract.connect(issuer).createDistribution(
        await rwa.getAddress(),
        distributionAmount
      );

      const distributionId = 1n;

      // Check investor1 claimable (60% of 1000 = 600 USDC)
      const claimable1 = await yieldContract.getClaimableAmount(distributionId, investor1.address);
      expect(claimable1).to.equal(ethers.parseUnits("600", 6));

      // Check investor2 claimable (40% of 1000 = 400 USDC)
      const claimable2 = await yieldContract.getClaimableAmount(distributionId, investor2.address);
      expect(claimable2).to.equal(ethers.parseUnits("400", 6));

      // Investor 1 claims
      await yieldContract.connect(investor1).claimDistribution(distributionId);
      expect(await paymentToken.balanceOf(investor1.address)).to.equal(ethers.parseUnits("600", 6));

      // Investor 2 claims
      await yieldContract.connect(investor2).claimDistribution(distributionId);
      expect(await paymentToken.balanceOf(investor2.address)).to.equal(ethers.parseUnits("400", 6));
    });

    it("should prevent double claiming", async function () {
      const distributionAmount = ethers.parseUnits("1000", 6);
      await paymentToken.connect(issuer).approve(await yieldContract.getAddress(), distributionAmount);
      await yieldContract.connect(issuer).createDistribution(
        await rwa.getAddress(),
        distributionAmount
      );

      await yieldContract.connect(investor1).claimDistribution(1n);
      await expect(yieldContract.connect(investor1).claimDistribution(1n)).to.be.reverted;
    });
  });
});
