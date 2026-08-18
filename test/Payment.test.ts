import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import {
  AssetNexaCompliance,
  AssetNexaRWA,
  AssetNexaPayment,
  MockUSDC,
} from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("AssetNexaPayment Contract", function () {
  let compliance: AssetNexaCompliance;
  let rwa: AssetNexaRWA;
  let payment: AssetNexaPayment;
  let paymentToken: MockUSDC;
  let admin: HardhatEthersSigner;
  let issuer: HardhatEthersSigner;
  let treasury: HardhatEthersSigner;
  let investor1: HardhatEthersSigner;
  let investor2: HardhatEthersSigner;

  const testAssetId = ethers.keccak256(ethers.toUtf8Bytes("ASSET_CHENNAI_TECH_CAMPUS"));
  const totalSupplyCap = 100_000n; // 100k units
  const initialPrice = ethers.parseUnits("1", 6); // 1 USDC per unit
  const totalValuation = ethers.parseUnits("100000", 6); // 100,000 USDC

  beforeEach(async function () {
    [admin, issuer, treasury, investor1, investor2] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    paymentToken = await MockUSDCFactory.deploy();
    await paymentToken.waitForDeployment();

    // Deploy Compliance
    const ComplianceFactory = await ethers.getContractFactory("AssetNexaCompliance");
    compliance = await ComplianceFactory.deploy(admin.address);
    await compliance.waitForDeployment();

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

    // Deploy Payment (admin, complianceAddress, feeRecipient, feeBps)
    const PaymentFactory = await ethers.getContractFactory("AssetNexaPayment");
    payment = await PaymentFactory.deploy(
      admin.address,
      await compliance.getAddress(),
      treasury.address,
      50 // 0.5% fee (50 basis points)
    );
    await payment.waitForDeployment();

    // Grant MINTER_ROLE on RWA to Payment contract
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    await rwa.grantRole(MINTER_ROLE, await payment.getAddress());

    // Authorize Payment contract in Compliance
    await compliance.setAuthorizedContract(await payment.getAddress(), true);

    // Setup compliance whitelist
    await compliance.setKYCStatus(investor1.address, true);
    await compliance.setKYCStatus(investor2.address, true);

    // Fund investors with USDC
    await paymentToken.mint(investor1.address, ethers.parseUnits("50000", 6));
    await paymentToken.mint(investor2.address, ethers.parseUnits("50000", 6));

    // Transition RWA to FUNDING status
    await rwa.setStatus(1); // PENDING_APPROVAL
    await rwa.setStatus(2); // PUBLISHED
    await rwa.setStatus(3); // FUNDING
  });

  describe("Primary Purchase & Minting", function () {
    it("should process primary investment and distribute funds correctly", async function () {
      const unitsToBuy = 1000n;
      const cost = unitsToBuy * initialPrice; // 1000 USDC
      const platformFee = (cost * 50n) / 10000n; // 5 USDC
      const issuerAmount = cost - platformFee; // 995 USDC

      // Approve Payment contract to spend USDC
      await paymentToken.connect(investor1).approve(await payment.getAddress(), cost);

      await payment.connect(investor1).buyUnits(
        await rwa.getAddress(),
        unitsToBuy
      );

      // Verify token minting
      expect(await rwa.balanceOf(investor1.address)).to.equal(unitsToBuy);
      expect(await rwa.totalSupply()).to.equal(unitsToBuy);

      // Verify payment split
      expect(await paymentToken.balanceOf(treasury.address)).to.equal(platformFee);
      expect(await paymentToken.balanceOf(issuer.address)).to.equal(issuerAmount);
    });

    it("should reject purchase when investor is not KYC approved", async function () {
      const [, , , , , nonKYC] = await ethers.getSigners();
      await paymentToken.mint(nonKYC.address, ethers.parseUnits("1000", 6));
      await paymentToken.connect(nonKYC).approve(await payment.getAddress(), ethers.parseUnits("1000", 6));

      await expect(
        payment.connect(nonKYC).buyUnits(await rwa.getAddress(), 100n)
      ).to.be.reverted;
    });

    it("should reject purchase exceeding remaining cap", async function () {
      await paymentToken.mint(investor1.address, ethers.parseUnits("200000", 6));
      await paymentToken.connect(investor1).approve(await payment.getAddress(), ethers.parseUnits("200000", 6));

      await expect(
        payment.connect(investor1).buyUnits(await rwa.getAddress(), totalSupplyCap + 1n)
      ).to.be.reverted;
    });
  });
});
