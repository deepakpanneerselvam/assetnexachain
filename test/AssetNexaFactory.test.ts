import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { AssetNexaFactory, AssetNexaCompliance, MockUSDC } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("AssetNexaFactory Contract", function () {
  let factory: AssetNexaFactory;
  let compliance: AssetNexaCompliance;
  let paymentToken: MockUSDC;
  let admin: HardhatEthersSigner;
  let issuer: HardhatEthersSigner;
  let investor: HardhatEthersSigner;

  const testAssetId = ethers.keccak256(ethers.toUtf8Bytes("ASSET_CHENNAI_TECH_CAMPUS"));

  beforeEach(async function () {
    [admin, issuer, investor] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    paymentToken = await MockUSDCFactory.deploy();
    await paymentToken.waitForDeployment();

    // Deploy Compliance Registry
    const ComplianceFactory = await ethers.getContractFactory("AssetNexaCompliance");
    compliance = await ComplianceFactory.deploy(admin.address);
    await compliance.waitForDeployment();

    // Deploy Factory
    const Factory = await ethers.getContractFactory("AssetNexaFactory");
    factory = await Factory.deploy(admin.address, await compliance.getAddress());
    await factory.waitForDeployment();
  });

  describe("Asset Creation and Registry", function () {
    it("should deploy a new RWA token and index it in registry", async function () {
      const tx = await factory.createAsset(
        testAssetId,
        "Chennai Tech Campus",
        "CTC",
        "ipfs://QmAssetNexaMetadataHash",
        0, // COMMERCIAL_REAL_ESTATE
        ethers.parseUnits("10000000", 6),
        10_000_000n,
        ethers.parseUnits("1", 6),
        await paymentToken.getAddress(),
        issuer.address
      );

      const receipt = await tx.wait();
      const deployedAddress = await factory.getAssetAddress(testAssetId);
      expect(deployedAddress).to.not.equal(ethers.ZeroAddress);

      expect(await factory.isRegisteredAsset(deployedAddress)).to.be.true;
      expect(await factory.totalAssetsCount()).to.equal(1n);
      expect(await factory.getAssetByIndex(0)).to.equal(deployedAddress);
    });

    it("should prevent creating an asset with duplicate assetId", async function () {
      await factory.createAsset(
        testAssetId,
        "Chennai Tech Campus",
        "CTC",
        "ipfs://QmMetadata1",
        0,
        ethers.parseUnits("10000000", 6),
        10_000_000n,
        ethers.parseUnits("1", 6),
        await paymentToken.getAddress(),
        issuer.address
      );

      await expect(
        factory.createAsset(
          testAssetId,
          "Duplicate Campus",
          "DUP",
          "ipfs://QmMetadata2",
          0,
          ethers.parseUnits("5000000", 6),
          5_000_000n,
          ethers.parseUnits("1", 6),
          await paymentToken.getAddress(),
          issuer.address
        )
      ).to.be.reverted;
    });

    it("should reject asset creation with invalid zero parameters", async function () {
      const newAssetId = ethers.keccak256(ethers.toUtf8Bytes("NEW_ASSET"));
      await expect(
        factory.createAsset(
          newAssetId,
          "Invalid Asset",
          "INV",
          "",
          0,
          1000,
          0n, // Zero supply cap
          ethers.parseUnits("1", 6),
          await paymentToken.getAddress(),
          issuer.address
        )
      ).to.be.reverted;
    });
  });
});
