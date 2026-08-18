import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import {
  AssetNexaCompliance,
  AssetNexaRWA,
  AssetNexaMarketplace,
  MockUSDC,
} from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("AssetNexaMarketplace Contract", function () {
  let compliance: AssetNexaCompliance;
  let rwa: AssetNexaRWA;
  let marketplace: AssetNexaMarketplace;
  let paymentToken: MockUSDC;
  let admin: HardhatEthersSigner;
  let issuer: HardhatEthersSigner;
  let treasury: HardhatEthersSigner;
  let seller: HardhatEthersSigner;
  let buyer: HardhatEthersSigner;

  const testAssetId = ethers.keccak256(ethers.toUtf8Bytes("ASSET_CHENNAI_TECH_CAMPUS"));
  const totalSupplyCap = 100_000n;
  const initialPrice = ethers.parseUnits("1", 6);
  const totalValuation = ethers.parseUnits("100000", 6);

  beforeEach(async function () {
    [admin, issuer, treasury, seller, buyer] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDCFactory = await ethers.getContractFactory("MockUSDC");
    paymentToken = await MockUSDCFactory.deploy();
    await paymentToken.waitForDeployment();

    // Deploy Compliance
    const ComplianceFactory = await ethers.getContractFactory("AssetNexaCompliance");
    compliance = await ComplianceFactory.deploy(admin.address);
    await compliance.waitForDeployment();

    // Whitelist seller and buyer
    await compliance.setKYCStatus(seller.address, true);
    await compliance.setKYCStatus(buyer.address, true);

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

    // Deploy Marketplace (admin, complianceAddress, feeRecipient, feeBps)
    const MarketplaceFactory = await ethers.getContractFactory("AssetNexaMarketplace");
    marketplace = await MarketplaceFactory.deploy(
      admin.address,
      await compliance.getAddress(),
      treasury.address,
      100 // 1.0% fee
    );
    await marketplace.waitForDeployment();

    // Authorize Marketplace in Compliance
    await compliance.setAuthorizedContract(await marketplace.getAddress(), true);

    // Mint tokens to seller
    await rwa.setStatus(1);
    await rwa.setStatus(2);
    await rwa.setStatus(3);

    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    await rwa.grantRole(MINTER_ROLE, admin.address);
    await rwa.mint(seller.address, 5000n);

    // Fund buyer with USDC
    await paymentToken.mint(buyer.address, ethers.parseUnits("10000", 6));
  });

  describe("Order Creation and Fulfillment", function () {
    it("should list tokens, fulfill order, and transfer custody safely with fee split", async function () {
      const amountToList = 1000n;
      const pricePerUnit = ethers.parseUnits("2", 6); // 2 USDC per unit

      // Approve marketplace to escrow RWA tokens
      await rwa.connect(seller).approve(await marketplace.getAddress(), amountToList);

      // Create listing
      await marketplace.connect(seller).createListing(
        await rwa.getAddress(),
        amountToList,
        pricePerUnit
      );

      const listingId = 1n;
      const listing = await marketplace.getListing(listingId);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.quantity).to.equal(amountToList);
      expect(listing.pricePerUnit).to.equal(pricePerUnit);

      // Buyer approves USDC and fulfills order
      const totalCost = amountToList * pricePerUnit; // 2000 USDC
      const fee = (totalCost * 100n) / 10000n; // 20 USDC
      const sellerProceeds = totalCost - fee; // 1980 USDC

      await paymentToken.connect(buyer).approve(await marketplace.getAddress(), totalCost);

      await marketplace.connect(buyer).buyListing(listingId, amountToList);

      // Verify balances
      expect(await rwa.balanceOf(buyer.address)).to.equal(amountToList);
      expect(await paymentToken.balanceOf(treasury.address)).to.equal(fee);
      expect(await paymentToken.balanceOf(seller.address)).to.equal(sellerProceeds);
    });

    it("should allow seller to cancel order and reclaim escrowed tokens", async function () {
      const amountToList = 500n;
      const pricePerUnit = ethers.parseUnits("1", 6);

      await rwa.connect(seller).approve(await marketplace.getAddress(), amountToList);
      await marketplace.connect(seller).createListing(
        await rwa.getAddress(),
        amountToList,
        pricePerUnit
      );

      expect(await rwa.balanceOf(seller.address)).to.equal(4500n);

      await marketplace.connect(seller).cancelListing(1n);
      expect(await rwa.balanceOf(seller.address)).to.equal(5000n);
    });
  });
});
