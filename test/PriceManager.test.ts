import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import {
  AssetNexaCompliance,
  AssetNexaRWA,
  AssetNexaPriceManager,
  MockUSDC,
} from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("AssetNexaPriceManager Contract", function () {
  let compliance: AssetNexaCompliance;
  let rwa: AssetNexaRWA;
  let priceManager: AssetNexaPriceManager;
  let paymentToken: MockUSDC;
  let admin: HardhatEthersSigner;
  let issuer: HardhatEthersSigner;
  let proposer: HardhatEthersSigner;
  let complianceOfficer: HardhatEthersSigner;
  let executor: HardhatEthersSigner;

  const testAssetId = ethers.keccak256(ethers.toUtf8Bytes("ASSET_CHENNAI_TECH_CAMPUS"));

  beforeEach(async function () {
    [admin, issuer, proposer, complianceOfficer, executor] = await ethers.getSigners();

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
      totalValuation: ethers.parseUnits("10000000", 6),
      totalSupplyCap: 10_000_000n,
      initialPrice: ethers.parseUnits("1", 6),
      paymentToken: await paymentToken.getAddress(),
      issuer: issuer.address,
    };

    const RWAFactory = await ethers.getContractFactory("AssetNexaRWA");
    rwa = await RWAFactory.deploy(params, await compliance.getAddress(), admin.address);
    await rwa.waitForDeployment();

    // Deploy PriceManager (constructor takes admin and timelockDuration e.g. 1 hour = 3600 seconds)
    const PriceManagerFactory = await ethers.getContractFactory("AssetNexaPriceManager");
    priceManager = await PriceManagerFactory.deploy(admin.address, 3600);
    await priceManager.waitForDeployment();

    // Setup roles
    const PRICE_PROPOSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PRICE_PROPOSER_ROLE"));
    const COMPLIANCE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("COMPLIANCE_ROLE"));
    const PRICE_EXECUTOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PRICE_EXECUTOR_ROLE"));

    await priceManager.grantRole(PRICE_PROPOSER_ROLE, proposer.address);
    await priceManager.grantRole(COMPLIANCE_ROLE, complianceOfficer.address);
    await priceManager.grantRole(PRICE_EXECUTOR_ROLE, executor.address);

    // Grant PRICE_MANAGER_ROLE on RWA to PriceManager contract
    const PRICE_MANAGER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PRICE_MANAGER_ROLE"));
    await rwa.grantRole(PRICE_MANAGER_ROLE, await priceManager.getAddress());
  });

  describe("Price Governance Workflow", function () {
    it("should propose, approve by compliance, wait for timelock, and execute price change", async function () {
      const newPrice = ethers.parseUnits("1.25", 6); // 1.25 USDC

      // 1. Propose price change
      const tx = await priceManager.connect(proposer).proposePriceChange(
        await rwa.getAddress(),
        newPrice
      );

      const proposalId = 1n;
      const proposal = await priceManager.getProposal(proposalId);
      expect(proposal.newPrice).to.equal(newPrice);
      expect(proposal.status).to.equal(0); // PROPOSED

      // 2. Compliance officer approves
      await priceManager.connect(complianceOfficer).approvePriceChange(proposalId);
      const approvedProposal = await priceManager.getProposal(proposalId);
      expect(approvedProposal.status).to.equal(1); // APPROVED

      // 3. Fast-forward time past 1 hour timelock
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine", []);

      // 4. Execute price change
      await priceManager.connect(executor).executePriceChange(proposalId);

      const executedProposal = await priceManager.getProposal(proposalId);
      expect(executedProposal.status).to.equal(2); // EXECUTED

      // Verify RWA unit price is updated
      expect(await rwa.primaryPrice()).to.equal(newPrice);
    });

    it("should reject execution before timelock expiry", async function () {
      const newPrice = ethers.parseUnits("1.50", 6);
      await priceManager.connect(proposer).proposePriceChange(
        await rwa.getAddress(),
        newPrice
      );

      await priceManager.connect(complianceOfficer).approvePriceChange(1n);

      // Attempt to execute immediately without waiting
      await expect(
        priceManager.connect(executor).executePriceChange(1n)
      ).to.be.reverted;
    });
  });
});
