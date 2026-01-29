/**
 * Receipt Service
 * Generates A4 PDF receipts using Puppeteer
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const SiteContent = require('../models/SiteContent');
const { uploadPDF } = require('../config/cloudinary');

// Ensure receipts directory exists
const receiptsDir = path.join(__dirname, '../../receipts');
if (!fs.existsSync(receiptsDir)) {
    fs.mkdirSync(receiptsDir, { recursive: true });
}

/**
 * Generate receipt HTML template
 */
const generateReceiptHTML = async (payment, student, showCredentials, siteInfo) => {
    // Generate QR code for student portal login
    let qrCodeDataUrl = '';
    try {
        const portalUrl = `${process.env.CLIENT_URL}/login?roll=${student.roll}`;
        qrCodeDataUrl = await QRCode.toDataURL(portalUrl, { width: 80, margin: 1 });
    } catch (err) {
        console.error('QR Code generation error:', err);
    }

    const logo = siteInfo?.logo || '';
    const coachingName = siteInfo?.name || 'PARAGON Coaching Center';
    const address = siteInfo?.address || '';
    const phone = siteInfo?.phone || '';

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
          margin: 15mm;
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
        }
        
        .receipt {
          width: 180mm;
          min-height: 267mm;
          padding: 10mm;
          margin: 0 auto;
          border: 2px solid #1a365d;
          position: relative;
        }
        
        .header {
          text-align: center;
          border-bottom: 2px solid #1a365d;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        
        .logo {
          max-height: 60px;
          margin-bottom: 10px;
        }
        
        .coaching-name {
          font-size: 24pt;
          font-weight: bold;
          color: #1a365d;
          margin-bottom: 5px;
        }
        
        .coaching-address {
          font-size: 10pt;
          color: #666;
        }
        
        .receipt-title {
          background: #1a365d;
          color: white;
          padding: 8px 20px;
          font-size: 14pt;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
        }
        
        .receipt-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          padding: 10px;
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
          color: #1a365d;
        }
        
        .section {
          margin-bottom: 20px;
        }
        
        .section-title {
          font-size: 11pt;
          font-weight: bold;
          color: #1a365d;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 5px;
          margin-bottom: 10px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px dotted #e2e8f0;
        }
        
        .info-label {
          color: #666;
        }
        
        .info-value {
          font-weight: 500;
        }
        
        .payment-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        
        .payment-table th,
        .payment-table td {
          padding: 10px;
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
          background: #1a365d;
          color: white;
        }
        
        .total-row td {
          font-weight: bold;
          font-size: 13pt;
        }
        
        .due-warning {
          background: #fff5f5;
          border: 1px solid #fc8181;
          color: #c53030;
          padding: 10px;
          border-radius: 5px;
          margin: 15px 0;
          text-align: center;
        }
        
        .credentials-box {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }
        
        .credentials-title {
          font-size: 11pt;
          font-weight: bold;
          margin-bottom: 10px;
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
          font-size: 9pt;
          opacity: 0.9;
        }
        
        .credential-value {
          font-size: 14pt;
          font-weight: bold;
          font-family: 'Courier New', monospace;
          background: rgba(255,255,255,0.2);
          padding: 5px 15px;
          border-radius: 4px;
          margin-top: 5px;
        }
        
        .qr-section {
          text-align: center;
        }
        
        .qr-section img {
          width: 70px;
          height: 70px;
        }
        
        .qr-label {
          font-size: 8pt;
          margin-top: 5px;
        }
        
        .footer {
          position: absolute;
          bottom: 10mm;
          left: 10mm;
          right: 10mm;
        }
        
        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
          padding-top: 20px;
        }
        
        .signature-line {
          width: 150px;
          border-top: 1px solid #333;
          text-align: center;
          padding-top: 5px;
          font-size: 10pt;
        }
        
        .note {
          font-size: 9pt;
          color: #666;
          text-align: center;
          margin-top: 20px;
          font-style: italic;
        }
        
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 80pt;
          color: rgba(26, 54, 93, 0.05);
          font-weight: bold;
          pointer-events: none;
          z-index: -1;
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
        <div class="watermark">PARAGON</div>
        
        <!-- Header -->
        <div class="header">
          ${logo ? `<img src="${logo}" alt="Logo" class="logo">` : ''}
          <div class="coaching-name">${coachingName}</div>
          ${address ? `<div class="coaching-address">${address}</div>` : ''}
          ${phone ? `<div class="coaching-address">Phone: ${phone}</div>` : ''}
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
          
          <div style="margin-top: 10px; font-size: 10pt;">
            <strong>Payment Method:</strong> ${payment.paymentMethod?.toUpperCase() || 'CASH'}
            ${payment.transactionId ? ` | <strong>Transaction ID:</strong> ${payment.transactionId}` : ''}
          </div>
        </div>
        
        ${payment.dueAmount > 0 ? `
        <div class="due-warning">
          ⚠️ Outstanding Balance: ৳${payment.dueAmount.toLocaleString()} - Please clear the due amount at your earliest convenience.
        </div>
        ` : ''}
        
        ${showCredentials ? `
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
          <div style="text-align: center; margin-top: 10px; font-size: 9pt; opacity: 0.9;">
            Please change your password after first login for security.
          </div>
        </div>
        ` : ''}
        
        <!-- Signatures -->
        <div class="signatures">
          <div class="signature-line">Student/Guardian</div>
          <div class="signature-line">Authorized Signature</div>
        </div>
        
        <!-- Note -->
        <div class="note">
          This is a computer-generated receipt. Please keep this for your records.
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
    let browser;

    try {
        const payment = await Payment.findById(paymentId).setOptions({ skipPopulate: true });
        if (!payment) {
            throw new Error('Payment not found');
        }

        const student = await Student.findById(payment.studentId);
        if (!student) {
            throw new Error('Student not found');
        }

        // Get site info for header
        let siteInfo = {};
        try {
            const content = await SiteContent.findOne({ sectionKey: 'header' });
            if (content) {
                siteInfo = content.content || {};
            }
        } catch (err) {
            console.error('Error fetching site content:', err);
        }

        // Generate HTML
        const html = await generateReceiptHTML(payment, student, showCredentials, siteInfo);

        // Launch Puppeteer
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '10mm',
                bottom: '10mm',
                left: '10mm',
                right: '10mm'
            }
        });

        // Save PDF locally
        const filename = `receipt-${payment.receiptId}.pdf`;
        const filepath = path.join(receiptsDir, filename);
        fs.writeFileSync(filepath, pdfBuffer);

        // Try to upload to Cloudinary
        let pdfUrl = `/receipts/${filename}`;
        try {
            const uploadResult = await uploadPDF(filepath);
            if (uploadResult.success) {
                pdfUrl = uploadResult.url;
            }
        } catch (uploadErr) {
            console.error('Cloudinary upload error:', uploadErr);
            // Fall back to local URL
        }

        return pdfUrl;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
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

    let siteInfo = {};
    try {
        const content = await SiteContent.findOne({ sectionKey: 'header' });
        if (content) {
            siteInfo = content.content || {};
        }
    } catch (err) {
        console.error('Error fetching site content:', err);
    }

    // Don't show credentials on subsequent views
    return generateReceiptHTML(payment, student, false, siteInfo);
};
