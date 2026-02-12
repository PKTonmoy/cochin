/**
 * Receipt Service
 * Generates A4 PDF receipts using Puppeteer
 */

// const puppeteer = require('puppeteer'); // Removed as per request
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const GlobalSettings = require('../models/GlobalSettings');
const { uploadPDF } = require('../config/cloudinary');

// Ensure receipts directory exists
const receiptsDir = path.join(__dirname, '../../receipts');
if (!fs.existsSync(receiptsDir)) {
  fs.mkdirSync(receiptsDir, { recursive: true });
}

/**
 * Get site info and receipt template from GlobalSettings
 */
const getSettingsData = async () => {
  try {
    const settings = await GlobalSettings.getSettings();
    const siteInfo = settings.siteInfo || {};
    const contact = settings.contact || {};
    const receiptTemplate = settings.receiptTemplate || {};
    const addr = contact.address || {};

    // Build full address string
    const addressParts = [addr.street, addr.city, addr.state, addr.country].filter(Boolean);
    const fullAddress = addressParts.join(', ');

    return {
      logo: (receiptTemplate.showLogo !== false && siteInfo.logo?.url) ? siteInfo.logo.url : '',
      name: siteInfo.name || 'PARAGON Coaching Center',
      address: fullAddress,
      phone: contact.phones?.[0] || '',
      email: contact.email || '',
      primaryColor: receiptTemplate.primaryColor || '#1a365d',
      showQRCode: receiptTemplate.showQRCode !== false,
      showCredentialsOnFirst: receiptTemplate.showCredentialsOnFirst !== false,
      footerNote: receiptTemplate.footerNote || 'This is a computer-generated receipt. Please keep this for your records.',
      signatureLeftLabel: receiptTemplate.signatureLeftLabel || 'Student/Guardian',
      signatureRightLabel: receiptTemplate.signatureRightLabel || 'Authorized Signature',
    };
  } catch (err) {
    console.error('Error fetching global settings:', err);
    return {
      logo: '', name: 'Coaching Center', address: '', phone: '', email: '',
      primaryColor: '#1a365d', showQRCode: true, showCredentialsOnFirst: true,
      footerNote: 'This is a computer-generated receipt. Please keep this for your records.',
      signatureLeftLabel: 'Student/Guardian', signatureRightLabel: 'Authorized Signature',
    };
  }
};

/**
 * Generate receipt HTML template
 */
const generateReceiptHTML = async (payment, student, showCredentials, cfg) => {
  // Generate QR code for student portal login
  let qrCodeDataUrl = '';
  if (cfg.showQRCode) {
    try {
      const portalUrl = `${process.env.CLIENT_URL}/login?roll=${student.roll}`;
      qrCodeDataUrl = await QRCode.toDataURL(portalUrl, { width: 80, margin: 1 });
    } catch (err) {
      console.error('QR Code generation error:', err);
    }
  }

  const pc = cfg.primaryColor;

  // Contact line under address
  const contactParts = [];
  if (cfg.phone) contactParts.push(`Phone: ${cfg.phone}`);
  if (cfg.email) contactParts.push(`Email: ${cfg.email}`);
  const contactLine = contactParts.join('  |  ');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Receipt - ${payment.receiptId}</title>
      <style>
        @page {
          size: A4;
          margin: 0; /* Hide browser default headers/footers */
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 12pt;
          line-height: 1.5;
          color: #333;
          background: white;
          padding: 15mm; /* Restore visual margin */
        }
        
        .receipt {
          width: 100%;
          max-width: 190mm; /* A4 width minus padding */
          min-height: 260mm;
          margin: 0 auto;
          border: 2px solid ${pc};
          position: relative;
          overflow: hidden;
          padding: 10mm;
        }

        .print-footer {
            position: absolute;
            bottom: 5px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 9pt;
            color: #888;
            padding-top: 10px;
            display: none; /* Hidden by default, shown in print/pdf */
        }

        @media print {
            .print-footer {
                display: block;
            }
        }
        
        .header {
          text-align: center;
          border-bottom: 2px solid ${pc};
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        
        .logo {
          max-height: 80px;
          margin-bottom: 12px;
          border-radius: 12px;
        }
        
        .coaching-name {
          font-size: 22pt;
          font-weight: bold;
          color: ${pc};
          margin-bottom: 3px;
        }
        
        .coaching-address {
          font-size: 10pt;
          color: #666;
          margin-bottom: 2px;
        }
        
        .receipt-title {
          background: ${pc};
          color: white;
          padding: 6px 20px;
          font-size: 13pt;
          font-weight: bold;
          text-align: center;
          margin: 14px 0;
        }
        
        .receipt-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 16px;
          padding: 8px 10px;
          background: #f7fafc;
          border-radius: 5px;
        }
        
        .meta-item {
          text-align: center;
        }
        
        .meta-label {
          font-size: 9pt;
          color: #666;
          text-transform: uppercase;
        }
        
        .meta-value {
          font-size: 11pt;
          font-weight: bold;
          color: ${pc};
        }
        
        .section {
          margin-bottom: 16px;
        }
        
        .section-title {
          font-size: 11pt;
          font-weight: bold;
          color: ${pc};
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 4px;
          margin-bottom: 8px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        
        .info-row {
          display: flex;
          align-items: center;
          padding: 4px 0;
          border-bottom: 1px dotted #e2e8f0;
        }
        
        .info-label {
          color: #666;
          white-space: nowrap;
          margin-right: 10px;
        }
        
        .info-value {
            flex: 1;
            text-align: center;
            font-weight: 600;
        }
        
        .payment-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
        }
        
        .payment-table th,
        .payment-table td {
          padding: 8px 10px;
          text-align: left;
          border: 1px solid #e2e8f0;
        }
        
        .payment-table th {
          background: #f7fafc;
          font-weight: 600;
        }
        
        .payment-table .amount {
          text-align: right;
          font-family: 'Courier New', monospace;
        }
        
        .total-row {
          background: ${pc};
          color: white;
        }
        
        .total-row td {
          font-weight: bold;
          font-size: 12pt;
          border-color: ${pc};
        }
        
        .due-warning {
          background: #fff5f5;
          border: 1px solid #fc8181;
          color: #c53030;
          padding: 8px;
          border-radius: 5px;
          margin: 12px 0;
          text-align: center;
          font-size: 10pt;
        }
        
        .credentials-box {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px;
          border-radius: 8px;
          margin: 14px 0;
        }
        
        .credentials-title {
          font-size: 10pt;
          font-weight: bold;
          margin-bottom: 8px;
          text-align: center;
        }
        
        .credentials-content {
          display: flex;
          justify-content: space-around;
          align-items: center;
        }
        
        .credential-item {
          text-align: center;
        }
        
        .credential-label {
          font-size: 8pt;
          opacity: 0.9;
        }
        
        .credential-value {
          font-size: 13pt;
          font-weight: bold;
          font-family: 'Courier New', monospace;
          background: rgba(255,255,255,0.2);
          padding: 4px 12px;
          border-radius: 4px;
          margin-top: 4px;
        }
        
        .qr-section {
          text-align: center;
        }
        
        .qr-section img {
          width: 60px;
          height: 60px;
        }
        
        .qr-label {
          font-size: 7pt;
          margin-top: 3px;
        }
        
        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 30px;
          padding-top: 15px;
        }
        
        .signature-line {
          width: 150px;
          border-top: 1px solid #333;
          text-align: center;
          padding-top: 4px;
          font-size: 9pt;
        }
        
        .note {
          font-size: 8pt;
          color: #666;
          text-align: center;
          margin-top: 14px;
          font-style: italic;
        }
        
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 72pt;
          color: rgba(0, 0, 0, 0.04);
          font-weight: bold;
          pointer-events: none;
          z-index: 0;
          white-space: nowrap;
        }
        
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .receipt {
            border: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="watermark">${cfg.name}</div>
        
        <!-- Header -->
        <div class="header">
          ${cfg.logo ? `<img src="${cfg.logo}" alt="Logo" class="logo">` : ''}
          <div class="coaching-name">${cfg.name}</div>
          ${cfg.address ? `<div class="coaching-address">${cfg.address}</div>` : ''}
          ${contactLine ? `<div class="coaching-address">${contactLine}</div>` : ''}
        </div>
        
        <!-- Receipt Title -->
        <div class="receipt-title">PAYMENT RECEIPT</div>
        
        <!-- Receipt Meta -->
        <div class="receipt-meta">
          <div class="meta-item">
            <div class="meta-label">Receipt No.</div>
            <div class="meta-value">${payment.receiptId}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Date</div>
            <div class="meta-value">${new Date(payment.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Payment Type</div>
            <div class="meta-value">${payment.paymentType?.toUpperCase() || 'MONTHLY'}</div>
          </div>
        </div>
        
        <!-- Student Information -->
        <div class="section">
          <div class="section-title">Student Information</div>
          <div class="info-grid">
            <div class="info-row">
              <span class="info-label">Roll No:</span>
              <span class="info-value">${student.roll}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Class:</span>
              <span class="info-value">${student.class}${student.section ? ` - ${student.section}` : ''}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Name:</span>
              <span class="info-value">${student.name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Phone:</span>
              <span class="info-value">${student.phone}</span>
            </div>
          </div>
        </div>
        
        <!-- Payment Details -->
        <div class="section">
          <div class="section-title">Payment Details</div>
          <table class="payment-table">
            <tr>
              <th>Description</th>
              <th class="amount">Amount (৳)</th>
            </tr>
            <tr>
              <td>Total Fee</td>
              <td class="amount">${payment.totalFee.toLocaleString()}</td>
            </tr>
            ${payment.previousDue > 0 ? `
            <tr>
              <td>Previous Due</td>
              <td class="amount">${payment.previousDue.toLocaleString()}</td>
            </tr>
            ` : ''}
            <tr>
              <td>Amount Paid${payment.month ? ` (${payment.month})` : ''}</td>
              <td class="amount" style="color: #38a169; font-weight: bold;">
                ${payment.amountPaid.toLocaleString()}
              </td>
            </tr>
            <tr class="total-row">
              <td>Balance Due</td>
              <td class="amount">${payment.dueAmount.toLocaleString()}</td>
            </tr>
          </table>
          
          <div style="margin-top: 8px; font-size: 10pt;">
            <strong>Payment Method:</strong> ${payment.paymentMethod?.toUpperCase() || 'CASH'}
            ${payment.transactionId ? ` | <strong>Transaction ID:</strong> ${payment.transactionId}` : ''}
          </div>
        </div>
        
        ${payment.dueAmount > 0 ? `
        <div class="due-warning">
          ⚠️ Outstanding Balance: ৳${payment.dueAmount.toLocaleString()} - Please clear the due amount at your earliest convenience.
        </div>
        ` : ''}
        
        ${showCredentials && cfg.showCredentialsOnFirst ? `
        <!-- Login Credentials (only shown on first receipt) -->
        <div class="credentials-box">
          <div class="credentials-title">🎓 Student Portal Login Credentials</div>
          <div class="credentials-content">
            <div class="credential-item">
              <div class="credential-label">Roll Number (Username)</div>
              <div class="credential-value">${student.roll}</div>
            </div>
            <div class="credential-item">
              <div class="credential-label">Password</div>
              <div class="credential-value">${student.phone}</div>
            </div>
            ${qrCodeDataUrl ? `
            <div class="qr-section">
              <img src="${qrCodeDataUrl}" alt="QR Code">
              <div class="qr-label">Scan to Login</div>
            </div>
            ` : ''}
          </div>
          <div style="text-align: center; margin-top: 8px; font-size: 8pt; opacity: 0.9;">
            Please change your password after first login for security.
          </div>
        </div>
        ` : ''}
        
        <!-- Signatures -->
        <div class="signatures">
          <div class="signature-line">${cfg.signatureLeftLabel}</div>
          <div class="signature-line">${cfg.signatureRightLabel}</div>
        </div>
        
        <!-- Note -->
        <div class="note">
          ${cfg.footerNote}
        </div>

        <div class="print-footer">
            ${new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  })} Payment Receipt - ${payment.receiptId}
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate PDF receipt
 * @param {string} paymentId - Payment ID
 * @param {boolean} showCredentials - Whether to show login credentials
 * @returns {Promise<string>} PDF file URL
 */
exports.generateReceipt = async (paymentId, showCredentials = false) => {
  // Disabled as per request to remove Puppeteer dependency
  console.warn('PDF generation is disabled. Returning null.'); // Log warning
  return null;
};

/**
 * Get receipt HTML for viewing/printing in browser
 */
exports.getReceiptHTML = async (receiptId) => {
  const payment = await Payment.findOne({ receiptId }).setOptions({ skipPopulate: true });
  if (!payment) {
    throw new Error('Payment not found');
  }

  const student = await Student.findById(payment.studentId);
  if (!student) {
    throw new Error('Student not found');
  }

  // Get settings from GlobalSettings
  const cfg = await getSettingsData();

  // Don't show credentials on subsequent views
  return generateReceiptHTML(payment, student, false, cfg);
};
