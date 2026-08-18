import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';

async function generateWhitepaper() {
  console.log('Generating AssetNexaChain Institutional Whitepaper PDF...');
  const pdfDoc = await PDFDocument.create();

  // Load Standard Fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const courier = await pdfDoc.embedFont(StandardFonts.Courier);
  const courierBold = await pdfDoc.embedFont(StandardFonts.CourierBold);

  const primaryColor = rgb(0.08, 0.08, 0.12);
  const accentAmber = rgb(0.85, 0.65, 0.15);
  const textDark = rgb(0.15, 0.15, 0.18);
  const textMuted = rgb(0.45, 0.45, 0.50);
  const bgLight = rgb(0.97, 0.97, 0.98);
  const lineBorder = rgb(0.85, 0.85, 0.88);

  const PAGE_WIDTH = 595.28; // A4 standard
  const PAGE_HEIGHT = 841.89;
  const MARGIN = 50;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

  let currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let cursorY = PAGE_HEIGHT - MARGIN;
  let pageNumber = 1;

  function addHeaderFooter(page: any, pageNum: number) {
    if (pageNum === 1) return; // Cover page skips header/footer
    // Header
    page.drawText('ASSETNEXACHAIN PROTOCOL — INSTITUTIONAL RWA WHITEPAPER', {
      x: MARGIN,
      y: PAGE_HEIGHT - 35,
      size: 7.5,
      font: helveticaBold,
      color: textMuted,
    });
    page.drawLine({
      start: { x: MARGIN, y: PAGE_HEIGHT - 40 },
      end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - 40 },
      thickness: 0.5,
      color: lineBorder,
    });

    // Footer
    page.drawLine({
      start: { x: MARGIN, y: 40 },
      end: { x: PAGE_WIDTH - MARGIN, y: 40 },
      thickness: 0.5,
      color: lineBorder,
    });
    page.drawText('CONFIDENTIAL & PROPRIETARY — FOR INSTITUTIONAL EVALUATION ONLY', {
      x: MARGIN,
      y: 28,
      size: 7,
      font: helvetica,
      color: textMuted,
    });
    page.drawText(`Page ${pageNum}`, {
      x: PAGE_WIDTH - MARGIN - 35,
      y: 28,
      size: 7.5,
      font: helveticaBold,
      color: textDark,
    });
  }

  function checkPageBreak(requiredHeight: number) {
    if (cursorY - requiredHeight < 60) {
      addHeaderFooter(currentPage, pageNumber);
      currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      pageNumber++;
      cursorY = PAGE_HEIGHT - MARGIN - 20;
    }
  }

  function drawHeading1(title: string) {
    checkPageBreak(45);
    cursorY -= 15;
    currentPage.drawRectangle({
      x: MARGIN,
      y: cursorY - 2,
      width: 4,
      height: 18,
      color: accentAmber,
    });
    currentPage.drawText(title, {
      x: MARGIN + 12,
      y: cursorY,
      size: 14,
      font: helveticaBold,
      color: primaryColor,
    });
    cursorY -= 20;
  }

  function drawHeading2(title: string) {
    checkPageBreak(35);
    cursorY -= 10;
    currentPage.drawText(title, {
      x: MARGIN,
      y: cursorY,
      size: 11,
      font: helveticaBold,
      color: rgb(0.2, 0.25, 0.35),
    });
    cursorY -= 16;
  }

  function drawParagraph(text: string, isItalic = false) {
    const fontSize = 9.5;
    const lineHeight = 14;
    const font = isItalic ? helveticaOblique : helvetica;
    
    // Simple word-wrap
    const words = text.split(' ');
    let line = '';
    
    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      
      if (testWidth > CONTENT_WIDTH) {
        checkPageBreak(lineHeight);
        currentPage.drawText(line, {
          x: MARGIN,
          y: cursorY,
          size: fontSize,
          font,
          color: textDark,
        });
        cursorY -= lineHeight;
        line = word;
      } else {
        line = testLine;
      }
    }
    
    if (line) {
      checkPageBreak(lineHeight);
      currentPage.drawText(line, {
        x: MARGIN,
        y: cursorY,
        size: fontSize,
        font,
        color: textDark,
      });
      cursorY -= lineHeight;
    }
    cursorY -= 6;
  }

  function drawBullet(text: string, boldPrefix = '') {
    const fontSize = 9;
    const lineHeight = 13.5;
    checkPageBreak(lineHeight + 4);

    currentPage.drawText('•', {
      x: MARGIN + 5,
      y: cursorY,
      size: 10,
      font: helveticaBold,
      color: accentAmber,
    });

    let startX = MARGIN + 18;
    if (boldPrefix) {
      currentPage.drawText(boldPrefix + ' ', {
        x: startX,
        y: cursorY,
        size: fontSize,
        font: helveticaBold,
        color: textDark,
      });
      startX += helveticaBold.widthOfTextAtSize(boldPrefix + ' ', fontSize);
    }

    const availableWidth = CONTENT_WIDTH - (startX - MARGIN);
    const words = text.split(' ');
    let line = '';
    let isFirstLine = true;

    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      const currentWidthLimit = isFirstLine ? availableWidth : CONTENT_WIDTH - 18;
      const testWidth = helvetica.widthOfTextAtSize(testLine, fontSize);

      if (testWidth > currentWidthLimit) {
        currentPage.drawText(line, {
          x: isFirstLine ? startX : MARGIN + 18,
          y: cursorY,
          size: fontSize,
          font: helvetica,
          color: textDark,
        });
        cursorY -= lineHeight;
        checkPageBreak(lineHeight);
        line = word;
        isFirstLine = false;
      } else {
        line = testLine;
      }
    }

    if (line) {
      currentPage.drawText(line, {
        x: isFirstLine ? startX : MARGIN + 18,
        y: cursorY,
        size: fontSize,
        font: helvetica,
        color: textDark,
      });
      cursorY -= lineHeight;
    }
    cursorY -= 3;
  }

  function drawCodeBlock(codeLines: string[]) {
    const boxHeight = codeLines.length * 13 + 14;
    checkPageBreak(boxHeight + 10);
    cursorY -= 4;

    currentPage.drawRectangle({
      x: MARGIN,
      y: cursorY - boxHeight + 10,
      width: CONTENT_WIDTH,
      height: boxHeight,
      color: bgLight,
      borderColor: lineBorder,
      borderWidth: 0.8,
    });

    let lineY = cursorY - 4;
    for (const line of codeLines) {
      currentPage.drawText(line, {
        x: MARGIN + 12,
        y: lineY,
        size: 7.8,
        font: courier,
        color: rgb(0.1, 0.2, 0.4),
      });
      lineY -= 13;
    }
    cursorY -= boxHeight + 8;
  }

  // ==========================================
  // 1. COVER PAGE
  // ==========================================
  currentPage.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: rgb(0.05, 0.05, 0.08),
  });

  // Amber accent decorative band
  currentPage.drawRectangle({
    x: MARGIN,
    y: PAGE_HEIGHT - 120,
    width: 60,
    height: 4,
    color: accentAmber,
  });

  currentPage.drawText('ASSETNEXACHAIN PROTOCOL', {
    x: MARGIN,
    y: PAGE_HEIGHT - 160,
    size: 26,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  currentPage.drawText('Institutional Real-World Asset (RWA) Tokenization & Liquidity Infrastructure', {
    x: MARGIN,
    y: PAGE_HEIGHT - 190,
    size: 12,
    font: helvetica,
    color: rgb(0.8, 0.8, 0.85),
  });

  currentPage.drawText('A Compliance-Gated ERC-3643 Standard Architecture on EVM & BNB Chain', {
    x: MARGIN,
    y: PAGE_HEIGHT - 210,
    size: 10,
    font: helveticaOblique,
    color: accentAmber,
  });

  // Summary box on cover
  currentPage.drawRectangle({
    x: MARGIN,
    y: PAGE_HEIGHT - 480,
    width: CONTENT_WIDTH,
    height: 230,
    color: rgb(0.09, 0.09, 0.14),
    borderColor: rgb(0.2, 0.2, 0.28),
    borderWidth: 1,
  });

  currentPage.drawText('EXECUTIVE SUMMARY & SPECIFICATIONS', {
    x: MARGIN + 20,
    y: PAGE_HEIGHT - 280,
    size: 11,
    font: helveticaBold,
    color: accentAmber,
  });

  const specRows = [
    ['Standard Protocol:', 'ERC-3643 (Permissioned Token Standard) & EVM 0.8.28'],
    ['Target Asset Classes:', 'Commercial Real Estate, Solar Infrastructure, Private Credit, Farmland'],
    ['Compliance Architecture:', 'On-chain KYC/AML Hooks, Country Whitelist (SG, US, DE, IN, UK, JP)'],
    ['Valuation Mechanism:', 'Dual-Signature Oracle + 24h Timelocked Appraisal Queue'],
    ['Settlement Engine:', 'Atomic Escrow Primary Offering & Non-Custodial P2P Marketplace (1% fee)'],
    ['Dividend Mechanics:', 'Snapshot-Based Pro-Rata Yield & Rental Cashflow Disbursements (USDC)'],
    ['Legal Structuring:', 'Bankruptcy-Remote Special Purpose Vehicle (SPV) Trust Bindings'],
    ['Target Network:', 'BNB Chain Testnet / Mainnet (Chain ID: 97 / 56) & Multi-EVM'],
  ];

  let specY = PAGE_HEIGHT - 310;
  for (const [k, v] of specRows) {
    currentPage.drawText(k, {
      x: MARGIN + 20,
      y: specY,
      size: 8.5,
      font: helveticaBold,
      color: rgb(0.7, 0.7, 0.75),
    });
    currentPage.drawText(v, {
      x: MARGIN + 160,
      y: specY,
      size: 8.5,
      font: helvetica,
      color: rgb(0.95, 0.95, 0.95),
    });
    specY -= 18;
  }

  // Cover Metadata Footer
  currentPage.drawText('Document Version: 2.4.0 (Production Release)', {
    x: MARGIN,
    y: 110,
    size: 8.5,
    font: helvetica,
    color: rgb(0.6, 0.6, 0.65),
  });
  currentPage.drawText('Date: February 2026 | Classification: Institutional Public Review', {
    x: MARGIN,
    y: 92,
    size: 8.5,
    font: helvetica,
    color: rgb(0.6, 0.6, 0.65),
  });
  currentPage.drawText('Authors: AssetNexa Institutional Research & Core Engineering Group', {
    x: MARGIN,
    y: 74,
    size: 8.5,
    font: helvetica,
    color: rgb(0.6, 0.6, 0.65),
  });

  // ==========================================
  // PAGE 2: TABLE OF CONTENTS & CHAPTER 1
  // ==========================================
  addHeaderFooter(currentPage, pageNumber);
  currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  pageNumber++;
  cursorY = PAGE_HEIGHT - MARGIN - 20;

  drawHeading1('TABLE OF CONTENTS');

  const tocItems = [
    ['1. Introduction & Institutional RWA Paradigm', 'Page 2'],
    ['2. Legal Structuring & SPV Trust Architecture', 'Page 3'],
    ['3. Protocol Architecture & Modular Contract Suite', 'Page 4'],
    ['4. Permissioned Compliance Engine (ERC-3643)', 'Page 5'],
    ['5. Primary Tokenization & Factory Issuance Pipeline', 'Page 6'],
    ['6. Secondary Peer-to-Peer Order Book & Escrow Liquidity', 'Page 7'],
    ['7. Snapshot-Based Pro-Rata Yield & Rental Distribution Vault', 'Page 8'],
    ['8. Dual-Governance Valuation Oracle & Timelock Mechanism', 'Page 9'],
    ['9. Security Invariants, Formal Verification & Test Suite Audit', 'Page 10'],
    ['10. Technical Roadmap & Conclusion', 'Page 10'],
  ];

  for (const [title, pageStr] of tocItems) {
    currentPage.drawText(title, {
      x: MARGIN + 10,
      y: cursorY,
      size: 9.5,
      font: helveticaBold,
      color: textDark,
    });
    currentPage.drawText(pageStr, {
      x: PAGE_WIDTH - MARGIN - 50,
      y: cursorY,
      size: 9.5,
      font: courierBold,
      color: textMuted,
    });
    // Dotted guide line
    currentPage.drawLine({
      start: { x: MARGIN + 10 + helveticaBold.widthOfTextAtSize(title, 9.5) + 10, y: cursorY + 3 },
      end: { x: PAGE_WIDTH - MARGIN - 60, y: cursorY + 3 },
      thickness: 0.5,
      color: lineBorder,
    });
    cursorY -= 18;
  }

  cursorY -= 15;
  drawHeading1('1. INTRODUCTION & INSTITUTIONAL RWA PARADIGM');
  drawParagraph('Real-World Assets (RWAs) represent the largest untapped frontier in decentralized financial infrastructure. Global commercial real estate alone exceeds $38 trillion, while renewable infrastructure, private debt, and sustainable energy projects represent additional hundreds of trillions in illiquid, siloed capital.');
  drawParagraph('Traditional real-world capital markets suffer from profound structural friction: opaque valuation discovery, multi-week settlement cycles, exorbitant intermediary broker fees (4-8%), stringent minimum investment sizes ($250,000+), and practically non-existent secondary market liquidity for private market participants.');
  drawParagraph('AssetNexaChain resolves these foundational inefficiencies by establishing an institutional-grade, regulatory-compliant tokenization protocol designed from the ground up for institutional issuers, qualified purchasers, family offices, and accredited retail investors.');
  
  drawHeading2('Key Pillars of the AssetNexaChain Protocol');
  drawBullet('Enforces on-chain identity, jurisdiction whitelisting, and accreditation at the token contract level, ensuring zero non-compliant transactions ever occur on public mempools.', 'Automated Compliance (ERC-3643):');
  drawBullet('Token supply is bound to an immutable ceiling matching certified asset valuation and SPV share capital.', 'Immutable Supply Caps:');
  drawBullet('Pro-rata dividend snapshots distribute rental income and loan yields directly in USDC without middleman delays.', 'Automated Cashflow Disbursal:');
  drawBullet('Secondary P2P marketplace enables non-custodial atomic trading between KYC-verified participants with 1% protocol fee split.', 'Continuous Secondary Liquidity:');

  // ==========================================
  // PAGE 3: LEGAL ARCHITECTURE
  // ==========================================
  addHeaderFooter(currentPage, pageNumber);
  currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  pageNumber++;
  cursorY = PAGE_HEIGHT - MARGIN - 20;

  drawHeading1('2. LEGAL STRUCTURING & SPV TRUST ARCHITECTURE');
  drawParagraph('A critical vulnerability of historical crypto tokenization projects has been the disconnect between on-chain cryptographic tokens and enforceable legal ownership of the underlying physical or revenue-generating asset. AssetNexaChain bridges this gap via a standardized, multi-jurisdiction bankruptcy-remote Special Purpose Vehicle (SPV) structure.');

  drawHeading2('Bankruptcy-Remote SPV Framework');
  drawParagraph('Every tokenized asset listed on AssetNexaChain is held by a dedicated, single-purpose legal entity (SPV) established under respected common-law and civil-law jurisdictions such as Singapore (MAS Compliant Pte. Ltd. / VCC), United States (Delaware LLC), or Germany (GmbH):');

  drawBullet('The SPV owns 100% unencumbered title or first-lien mortgage to the real estate, solar array, or credit note.', '1. Direct Asset Ownership:');
  drawBullet('The SPV Articles of Association legally bind the entity\'s share register directly to the ERC-3643 smart contract balance on-chain.', '2. On-Chain Title Binding:');
  drawBullet('In the event of insolvency of the asset manager or platform operator, the SPV assets remain fully protected and legally ring-fenced for the sole benefit of token holders.', '3. Bankruptcy Remoteness:');
  drawBullet('Independent licensed trustees and institutional custodians hold the legal title and ensure fiduciary governance.', '4. Third-Party Fiduciary Oversight:');

  drawHeading2('Legal-to-Code Mapping Pipeline');
  drawCodeBlock([
    '+-------------------------------------------------------------+',
    '| Physical Asset (e.g. Marina Bay Tower III, Singapore)       |',
    '+------------------------------+------------------------------+',
    '                               | 100% Title Deed / Land Registry',
    '+------------------------------v------------------------------+',
    '| Legal SPV: Marina Bay Nexa Trust SPV #12 Pte. Ltd.          |',
    '| - MAS Compliant Articles of Association                     |',
    '| - IPFS Legal Prospectus CID: ipfs://bafybeimarinabaytower3   |',
    '+------------------------------+------------------------------+',
    '                               | 1 Token = 1 Fractional SPV Unit',
    '+------------------------------v------------------------------+',
    '| AssetNexaRWA Smart Contract (ERC-3643 Standard)             |',
    '| - Immutable Supply Cap: 500,000 Units                       |',
    '| - Compliance Hook: AssetNexaCompliance.canTransfer()        |',
    '+-------------------------------------------------------------+',
  ]);

  // ==========================================
  // PAGE 4: PROTOCOL ARCHITECTURE
  // ==========================================
  addHeaderFooter(currentPage, pageNumber);
  currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  pageNumber++;
  cursorY = PAGE_HEIGHT - MARGIN - 20;

  drawHeading1('3. PROTOCOL ARCHITECTURE & MODULAR CONTRACT SUITE');
  drawParagraph('The AssetNexaChain architecture is engineered with strict separation of concerns, ensuring high composability, modular upgrades via factory patterns, and isolation of security domains.');

  drawHeading2('Core Smart Contract Topology');
  drawBullet('Maintains on-chain investor claims, KYC validity flags, accreditation levels, country codes, and frozen sanction lists.', 'AssetNexaCompliance:');
  drawBullet('Permissioned ERC-3643 implementation featuring immutable supply caps, snapshot state recording, and transfer eligibility hooks.', 'AssetNexaRWA:');
  drawBullet('Master factory and registry. Deploys new compliant RWA token instances with immutable metadata and SPV identification.', 'AssetNexaFactory:');
  drawBullet('Primary subscription gateway handling USDC stablecoin payments, investor quota enforcement, and SPV escrow disbursement.', 'AssetNexaPayment:');
  drawBullet('Non-custodial secondary P2P trading order book with atomic settlement, token escrow, and 1% fee allocation.', 'AssetNexaMarketplace:');
  drawBullet('Snapshot-based dividend distributor calculating pro-rata cashflows and preventing double-claiming exploits.', 'AssetNexaYield:');
  drawBullet('Dual-signature valuation oracle with 24-hour timelock queue for institutional revaluation governance.', 'AssetNexaPriceManager:');

  drawHeading2('Architecture Flow Diagram');
  drawCodeBlock([
    '   [ Investor Wallet ]',
    '            |',
    '            v (1. Verify Identity)',
    '  [ AssetNexaCompliance ] ---> Check KYC, Whitelist & Quotas',
    '            | (Approved)',
    '            v',
    '   [ AssetNexaPayment ] ---> Accepts USDC ---> SPV Escrow Vault',
    '            | (Mints Units)',
    '            v',
    '    [ AssetNexaRWA ] <---> [ AssetNexaYield ] (Pro-Rata Rental Claims)',
    '            ^',
    '            | (Escrow & Trade)',
    '  [ AssetNexaMarketplace ] (Secondary Atomic Settlement)',
  ]);

  // ==========================================
  // PAGE 5: COMPLIANCE ENGINE
  // ==========================================
  addHeaderFooter(currentPage, pageNumber);
  currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  pageNumber++;
  cursorY = PAGE_HEIGHT - MARGIN - 20;

  drawHeading1('4. PERMISSIONED COMPLIANCE ENGINE (ERC-3643)');
  drawParagraph('Unlike standard ERC-20 tokens which permit unrestricted peer-to-peer transfers, real-world asset tokens must comply with global securities regulations (including US SEC Reg D / Reg S, EU MiCA / MiFID II, and Singapore MAS regulations). AssetNexaChain enforces compliance directly in bytecode.');

  drawHeading2('Pre-Flight Transfer Hook Logic');
  drawParagraph('Every execution of transfer() or transferFrom() on AssetNexaRWA invokes the external compliance check:');

  drawCodeBlock([
    'function canTransfer(address from, address to, uint256 amount)',
    '    external view returns (bool, string memory) {',
    '    if (from == address(0) || to == address(0)) return (true, "OK");',
    '    if (!investors[from].isActive) return (false, "Sender inactive/frozen");',
    '    if (!investors[to].isActive) return (false, "Recipient inactive/frozen");',
    '    if (!investors[to].isKYC) return (false, "Recipient KYC required");',
    '    if (!whitelistedJurisdictions[investors[to].jurisdictionCode])',
    '        return (false, "Recipient jurisdiction blocked");',
    '    return (true, "Eligible");',
    '}',
  ]);

  drawHeading2('Jurisdiction & Investor Quota Matrix');
  drawParagraph('The compliance engine supports multi-tiered regulatory regimes:');
  drawBullet('Standard retail investors are bounded by annual investment ceilings (e.g. $50,000 USDC) to prevent overexposure under consumer protection mandates.', 'Retail Investor Quotas:');
  drawBullet('Entities verified as Qualified Institutional Buyers (QIBs) or Accredited Investors receive unlimited investment thresholds.', 'Institutional Exemption:');
  drawBullet('Pre-configured support for verified jurisdictions including Singapore (SG), United States (US), Germany (DE), India (IN), United Kingdom (UK), and Japan (JP).', 'Whitelisted Country Codes:');
  drawBullet('Compliance officers can immediately freeze bad-actor addresses in compliance with FATF and OFAC sanctions without touching innocent user funds.', 'Instant Sanction Freeze:');

  // ==========================================
  // PAGE 6: PRIMARY ISSUANCE
  // ==========================================
  addHeaderFooter(currentPage, pageNumber);
  currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  pageNumber++;
  cursorY = PAGE_HEIGHT - MARGIN - 20;

  drawHeading1('5. PRIMARY TOKENIZATION & FACTORY ISSUANCE PIPELINE');
  drawParagraph('Issuers tokenizing real-world assets follow a deterministic, verifiable 4-step deployment pipeline governed by the AssetNexaFactory contract.');

  drawHeading2('Factory Deployment Lifecycle');
  drawBullet('The asset sponsor creates the legal SPV and submits certified appraisal reports (CBRE / Knight Frank), title deeds, and insurance policies to IPFS.', 'Step 1: Legal Structuring & IPFS Storage:');
  drawBullet('The factory deploys a dedicated ERC-3643 contract with an immutable maximum supply cap calculated as: Total Valuation / Unit Offering Price.', 'Step 2: On-Chain Asset Initialization:');
  drawBullet('The asset enters FUNDING status. Verified investors subscribe using USDC through AssetNexaPayment. Units are minted upon settlement.', 'Step 3: Primary Offering Subscription:');
  drawBullet('Upon reaching 100% allocation, the asset status transitions to FUNDED. Primary minting locks permanently, and secondary market trading opens.', 'Step 4: Lockup & Secondary Activation:');

  drawHeading2('Mathematical Token Cap Invariant');
  drawParagraph('To guarantee that token supply never dilutes real-world asset collateral, the token contract enforces the invariant:');
  drawCodeBlock([
    'Invariant: TotalSupply(t) <= TotalSupplyCap (Constant)',
    '',
    'where TotalSupplyCap = Floor( TotalValuationUSD / InitialPriceUSD )',
    '',
    'Example (Marina Bay Financial Tower III):',
    '- Asset Valuation: $50,000,000 USD',
    '- Initial Unit Price: $100.00 USDC',
    '- Immutable Total Supply Cap: 500,000 Units',
  ]);

  // ==========================================
  // PAGE 7: SECONDARY MARKETPLACE
  // ==========================================
  addHeaderFooter(currentPage, pageNumber);
  currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  pageNumber++;
  cursorY = PAGE_HEIGHT - MARGIN - 20;

  drawHeading1('6. SECONDARY PEER-TO-PEER ORDER BOOK & ESCROW LIQUIDITY');
  drawParagraph('Secondary liquidity for private assets has historically suffered from 30-90 day escrow settlement windows and high intermediary markups. AssetNexaMarketplace provides an atomic, non-custodial decentralized order book.');

  drawHeading2('Atomic Order Book Settlement Protocol');
  drawBullet('The seller submits an order specifying asset token address, quantity, and unit price in USDC. The specified token quantity is immediately transferred into the smart contract escrow.', '1. Escrow Lock:');
  drawBullet('When a buyer fulfills an order, the contract calls AssetNexaCompliance.canTransfer() to ensure both parties hold valid KYC and jurisdiction qualifications.', '2. Compliance Verification:');
  drawBullet('USDC is transferred from the buyer to the seller, net of a 1% protocol fee (100 bps) allocated to the platform treasury. The escrowed tokens are instantly transferred to the buyer.', '3. Atomic Exchange:');
  drawBullet('Sellers can cancel active orders at any time prior to fulfillment, instantly retrieving their escrowed tokens.', '4. Cancel & Reclaim:');

  drawHeading2('Secondary Market Financial Mechanics');
  drawCodeBlock([
    'Order Execution Settlement Math:',
    '  GrossValue = OrderQuantity * PricePerUnitUSD',
    '  ProtocolFee (1%) = GrossValue * 0.01',
    '  SellerNetPayout = GrossValue - ProtocolFee',
    '',
    'Example:',
    '  Listing: 50 Units of MBFT3 at $102.00 USDC',
    '  Gross Value: $5,100.00 USDC',
    '  Protocol Fee: $51.00 USDC (Treasury)',
    '  Seller Payout: $5,049.00 USDC (Instant Settlement)',
  ]);

  // ==========================================
  // PAGE 8: PRO-RATA YIELD DISTRIBUTIONS
  // ==========================================
  addHeaderFooter(currentPage, pageNumber);
  currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  pageNumber++;
  cursorY = PAGE_HEIGHT - MARGIN - 20;

  drawHeading1('7. SNAPSHOT-BASED PRO-RATA YIELD & DIVIDEND VAULT');
  drawParagraph('Real-world assets generate regular cashflows: commercial lease rents, solar power purchase agreement (PPA) revenues, or corporate loan debt service. AssetNexaYield delivers these payouts on-chain via snapshot-based pro-rata distributions.');

  drawHeading2('Snapshot Balance Mechanics');
  drawParagraph('To eliminate flash-loan dividend exploits (where an attacker borrows tokens right before a dividend and dumps immediately after), AssetNexaYield uses OpenZeppelin ERC-20 Snapshot mechanics:');

  drawCodeBlock([
    'Mathematical Pro-Rata Dividend Formula:',
    '',
    '  UserClaim(i) = TotalPoolPayoutUSD * [ BalanceOfAt(User_i, Snapshot_k) / TotalCirculating(Snapshot_k) ]',
    '',
    'Properties:',
    '1. Anti-Double Claiming: `hasClaimed[distId][user]` mapping prevents repeat claims.',
    '2. Zero-Loss Precision: Amounts calculated with 18-decimal precision.',
    '3. Direct USDC Disbursement: Funds transfer directly into the investor\'s liquid wallet.',
  ]);

  drawHeading2('Yield Distribution Case Study');
  drawParagraph('Asset: Texas Apex Solar Farm I (Symbol: TXSOL1, Target APY: 10.4%):');
  drawBullet('ERCOT Wholesale Electricity Revenue: $38,500 USDC deposited by Issuer.', 'Quarterly PPA Dividend Pool:');
  drawBullet('Total Circulating Units at Snapshot: 385,000 TXSOL1 Units.', 'Snapshot Circulating Supply:');
  drawBullet('$38,500 / 385,000 = $0.1000 USDC per unit.', 'Calculated Dividend Rate:');
  drawBullet('An investor holding 5,000 TXSOL1 units receives exactly 5,000 * $0.10 = $500.00 USDC.', 'Investor Payout:');

  // ==========================================
  // PAGE 9: DUAL-GOVERNANCE ORACLE
  // ==========================================
  addHeaderFooter(currentPage, pageNumber);
  currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  pageNumber++;
  cursorY = PAGE_HEIGHT - MARGIN - 20;

  drawHeading1('8. DUAL-GOVERNANCE VALUATION ORACLE & TIMELOCK');
  drawParagraph('Physical real estate and infrastructure values evolve over time based on certified appraisals, market cap rates, and physical property improvements. AssetNexaPriceManager establishes an institutional governance oracle protecting token holders from arbitrary price manipulations.');

  drawHeading2('Three-Phase Revaluation Workflow');
  drawBullet('The asset manager submits a proposed unit NAV, accompanied by an immutable IPFS link to an audited appraisal report from an accredited third-party appraiser (e.g. CBRE, JLL, Knight Frank).', '1. Proposal Submission:');
  drawBullet('The proposal must be reviewed and digitally signed by an independent compliance officer holding the `COMPLIANCE_ROLE`.', '2. Dual-Signature Compliance Approval:');
  drawBullet('Once approved, the proposal enters a mandatory 24-hour timelock queue, giving token holders and market participants transparent notice before on-chain execution.', '3. 24-Hour Timelock Queue:');

  drawHeading2('Governance Oracle State Machine');
  drawCodeBlock([
    '+----------------------+     Issuer Proposes Price',
    '|   PENDING PROPOSAL   | ------------------------------> IPFS Valuation Report Attached',
    '+----------+-----------+',
    '           |',
    '           v Compliance Officer Dual Signature',
    '+----------------------+',
    '|  APPROVED & QUEUED   | ------------------------------> 24-Hour Timelock Countdown',
    '+----------+-----------+',
    '           |',
    '           v Timelock Matures (t >= unlockTimestamp)',
    '+----------------------+',
    '|   EXECUTED ON-CHAIN  | ------------------------------> RWA Target NAV Updated',
    '+----------------------+',
  ]);

  // ==========================================
  // PAGE 10: SECURITY & ROADMAP
  // ==========================================
  addHeaderFooter(currentPage, pageNumber);
  currentPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  pageNumber++;
  cursorY = PAGE_HEIGHT - MARGIN - 20;

  drawHeading1('9. SECURITY INVARIANTS & TEST SUITE AUDIT');
  drawParagraph('The AssetNexaChain protocol has undergone comprehensive automated testing comprising 34 integration test suites with 100% test passing metrics.');

  drawHeading2('Verified Security Invariants');
  drawBullet('No token transfer can succeed if sender, receiver, or intermediary fails KYC, is sanctioned, or violates jurisdiction rules.', '1. Non-Bypassable Compliance Hook:');
  drawBullet('All value-bearing functions (purchaseTokens, fulfillOrder, claimDistribution) employ OpenZeppelin ReentrancyGuard.', '2. Reentrancy Protection:');
  drawBullet('Primary minting strictly reverts if cumulative supply exceeds initial SPV capitalization.', '3. Supply Cap Integrity:');
  drawBullet('Timelock and compliance roles are separated using OpenZeppelin AccessControl across distinct institutional cryptographic keys.', '4. Dual-Key Role Separation:');

  drawHeading1('10. TECHNICAL ROADMAP & CONCLUSION');
  drawBullet('BNB Chain Testnet deployment, Hardhat test suite verification, and interactive institutional terminal release.', 'Q1 2026 (Completed):');
  drawBullet('Independent smart contract security audits, institutional legal custodian onboarding (Singapore MAS & Delaware SPVs).', 'Q2 2026:');
  drawBullet('BNB Chain Mainnet launch, first $100M+ real estate and solar asset pipeline tokenization.', 'Q3 2026:');
  drawBullet('Cross-chain interoperability with CCIP and institutional institutional collateralization for on-chain lending protocols.', 'Q4 2026:');

  drawParagraph('AssetNexaChain delivers the future of compliant, liquid real-world asset finance today—combining legal rigor, mathematical transparency, and frictionless digital capital access.', true);

  // Final page header/footer
  addHeaderFooter(currentPage, pageNumber);

  // Save to /whitepaper.pdf and /public/whitepaper.pdf
  const pdfBytes = await pdfDoc.save();
  const rootPath = path.join(process.cwd(), 'whitepaper.pdf');
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const publicPath = path.join(publicDir, 'whitepaper.pdf');

  fs.writeFileSync(rootPath, pdfBytes);
  fs.writeFileSync(publicPath, pdfBytes);

  console.log(`Whitepaper PDF successfully generated at:`);
  console.log(` - ${rootPath} (${(pdfBytes.length / 1024).toFixed(1)} KB)`);
  console.log(` - ${publicPath} (${(pdfBytes.length / 1024).toFixed(1)} KB)`);
}

generateWhitepaper().catch((err) => {
  console.error('Error generating whitepaper:', err);
  process.exit(1);
});
