import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { AssetNexaCompliance } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("AssetNexaCompliance Contract", function () {
  let compliance: AssetNexaCompliance;
  let admin: HardhatEthersSigner;
  let complianceOfficer: HardhatEthersSigner;
  let operator: HardhatEthersSigner;
  let investor1: HardhatEthersSigner;
  let investor2: HardhatEthersSigner;

  const COMPLIANCE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("COMPLIANCE_ROLE"));
  const OPERATOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("OPERATOR_ROLE"));
  const PAUSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PAUSER_ROLE"));

  beforeEach(async function () {
    [admin, complianceOfficer, operator, investor1, investor2] = await ethers.getSigners();

    const ComplianceFactory = await ethers.getContractFactory("AssetNexaCompliance");
    compliance = await ComplianceFactory.deploy(admin.address);
    await compliance.waitForDeployment();

    // Grant roles
    await compliance.grantRole(COMPLIANCE_ROLE, complianceOfficer.address);
    await compliance.grantRole(OPERATOR_ROLE, operator.address);
  });

  describe("Initialization and Role Setup", function () {
    it("should set up admin roles correctly", async function () {
      expect(await compliance.hasRole(await compliance.DEFAULT_ADMIN_ROLE(), admin.address)).to.be.true;
      expect(await compliance.hasRole(COMPLIANCE_ROLE, complianceOfficer.address)).to.be.true;
      expect(await compliance.hasRole(OPERATOR_ROLE, operator.address)).to.be.true;
    });

    it("should reject zero address admin", async function () {
      const ComplianceFactory = await ethers.getContractFactory("AssetNexaCompliance");
      await expect(ComplianceFactory.deploy(ethers.ZeroAddress)).to.be.reverted;
    });
  });

  describe("KYC and Eligibility Management", function () {
    it("should approve KYC and automatically set active/eligible", async function () {
      await expect(compliance.connect(complianceOfficer).setKYCStatus(investor1.address, true))
        .to.emit(compliance, "KYCStatusChanged")
        .withArgs(investor1.address, true, complianceOfficer.address);

      expect(await compliance.isKYCApproved(investor1.address)).to.be.true;
      expect(await compliance.isEligible(investor1.address)).to.be.true;
    });

    it("should reject unauthorized KYC modification", async function () {
      await expect(
        compliance.connect(investor1).setKYCStatus(investor2.address, true)
      ).to.be.reverted;
    });

    it("should set investor accreditation status", async function () {
      await compliance.connect(complianceOfficer).setAccreditationStatus(investor1.address, true);
      expect(await compliance.isAccredited(investor1.address)).to.be.true;
    });

    it("should set jurisdiction code and investment limit", async function () {
      const jurisdictionIN = ethers.encodeBytes32String("IN").slice(0, 10);
      await compliance.connect(complianceOfficer).setJurisdiction(investor1.address, jurisdictionIN);
      await compliance.connect(complianceOfficer).setInvestmentLimit(investor1.address, ethers.parseUnits("50000", 6));

      const profile = await compliance.getInvestorProfile(investor1.address);
      expect(profile.investmentLimit).to.equal(ethers.parseUnits("50000", 6));
    });

    it("should freeze/deactivate an investor account", async function () {
      await compliance.connect(complianceOfficer).setKYCStatus(investor1.address, true);
      expect(await compliance.isEligible(investor1.address)).to.be.true;

      await compliance.connect(complianceOfficer).setInvestorActive(investor1.address, false);
      expect(await compliance.isEligible(investor1.address)).to.be.false;
    });
  });

  describe("Compliance Validation Logic (canInvest & canTransfer)", function () {
    beforeEach(async function () {
      await compliance.connect(complianceOfficer).setFullInvestorProfile(
        investor1.address,
        true, // KYC
        true, // Eligible
        true, // Accredited
        ethers.parseUnits("100000", 6),
        ethers.encodeBytes32String("US").slice(0, 10)
      );
    });

    it("should allow investment within limit for approved investor", async function () {
      const [canInvest, reason] = await compliance.canInvest(investor1.address, ethers.parseUnits("50000", 6));
      expect(canInvest).to.be.true;
      expect(reason).to.equal("");
    });

    it("should reject investment exceeding limit", async function () {
      const [canInvest, reason] = await compliance.canInvest(investor1.address, ethers.parseUnits("150000", 6));
      expect(canInvest).to.be.false;
      expect(reason).to.equal("Investment limit exceeded");
    });

    it("should reject investment for unapproved investor", async function () {
      const [canInvest, reason] = await compliance.canInvest(investor2.address, ethers.parseUnits("1000", 6));
      expect(canInvest).to.be.false;
      expect(reason).to.equal("Investor account inactive or frozen");
    });

    it("should validate transfer between two KYC-approved investors", async function () {
      await compliance.connect(complianceOfficer).setKYCStatus(investor2.address, true);

      const [canTransfer, reason] = await compliance.canTransfer(investor1.address, investor2.address, 100);
      expect(canTransfer).to.be.true;
      expect(reason).to.equal("");
    });

    it("should block transfer to unapproved recipient", async function () {
      const [canTransfer, reason] = await compliance.canTransfer(investor1.address, investor2.address, 100);
      expect(canTransfer).to.be.false;
      expect(reason).to.equal("Recipient account inactive");
    });
  });

  describe("Pausable Controls", function () {
    it("should pause and unpause correctly", async function () {
      await compliance.connect(admin).pause();
      const [canInvest, reason] = await compliance.canInvest(investor1.address, 1000);
      expect(canInvest).to.be.false;
      expect(reason).to.equal("Compliance paused");

      await compliance.connect(admin).unpause();
    });
  });
});
