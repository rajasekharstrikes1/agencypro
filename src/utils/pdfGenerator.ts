// Path: digitalavenger/invoice/invoice-8778080b2e82e01b0e0b1db4cbffc77385999a44/src/utils/pdfGenerator.ts

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice, CompanySettings } from '../types';
import { format } from 'date-fns';

export const generatePDF = async (invoice: Invoice, companySettings: CompanySettings) => {
  // Create a temporary div element to render the invoice
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.width = '210mm'; // A4 width
  tempDiv.style.padding = '15mm 18mm'; // Overall padding for the document
  tempDiv.style.backgroundColor = 'white';
  tempDiv.style.fontFamily = 'Arial, Helvetica, sans-serif'; // Professional and widely available font
  tempDiv.style.boxSizing = 'border-box'; // Ensure padding is included in width/height
  tempDiv.style.fontSize = '10pt'; // Base font size for overall document

  // Define custom colors
  const primaryColor = '#0e2625'; // Your chosen Primary (Dark Charcoal)
  const secondaryColor = '#fcf223'; // Your chosen Secondary (Bright Yellow)
  const textColor = '#212121'; // Very dark grey for main text
  const lightTextColor = '#616161'; // Medium grey for secondary text
  const tableBorderColor = '#E0E0E0'; // Very light grey for table borders
  const subtleDivider = '#EEEEEE'; // Subtle divider line color
  const headerBg = '#F5F5F5'; // Lighter grey for table header background
  const notesBg = '#FAFAFA'; // Lighter grey for notes section background

  // HTML content for html2canvas
  tempDiv.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto; padding: 0; font-family: inherit; color: ${textColor};">
      
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 15px; border-bottom: 2px solid ${primaryColor};">
        <div>
          <h1 style="color: ${primaryColor}; font-size: 38px; margin: 0; font-weight: bold; letter-spacing: 1.5px;">INVOICE</h1>
          <p style="color: ${lightTextColor}; margin: 8px 0 0 0; font-size: 15px;">Invoice #${invoice.invoiceNumber}</p>
        </div>
        <div style="text-align: right; line-height: 1.6;">
          <h2 style="color: ${primaryColor}; margin: 0 0 5px 0; font-size: 26px; font-weight: bold;">${companySettings.name}</h2>
          <div style="color: ${lightTextColor}; font-size: 13px;">
            <div>${companySettings.address}</div>
            <div>Phone: ${companySettings.phone}</div>
            <div>Email: ${companySettings.email}</div>
            ${companySettings.website ? `<div>Website: ${companySettings.website}</div>` : ''}
            <div>GST: ${companySettings.gst}</div>
            <div>PAN: ${companySettings.pan}</div>
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div>
          <h3 style="color: ${textColor}; margin: 0 0 12px 0; font-size: 18px; font-weight: bold;">Bill To:</h3>
          <div style="color: ${textColor}; font-size: 14px; line-height: 1.8;">
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">${invoice.customer.name}</div>
            <div>${invoice.customer.address}</div>
            <div>Phone: ${invoice.customer.phone}</div>
            <div>Email: ${invoice.customer.email}</div>
            ${invoice.customer.gst ? `<div>GST: ${invoice.customer.gst}</div>` : ''}
          </div>
        </div>
        <div style="text-align: right; line-height: 1.8;">
          <div style="color: ${textColor}; font-size: 14px;">
            <div><strong>Invoice Date:</strong> ${format(new Date(invoice.date), 'MMM dd,yyyy')}</div>
            <div><strong>Due Date:</strong> ${format(new Date(invoice.dueDate), 'MMM dd,yyyy')}</div>
          </div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background-color: ${headerBg};">
            <th style="padding: 12px 10px; text-align: left; border: 1px solid ${tableBorderColor}; font-weight: bold; color: ${textColor}; font-size: 14px;">Description</th>
            <th style="padding: 12px 10px; text-align: center; border: 1px solid ${tableBorderColor}; font-weight: bold; color: ${textColor}; font-size: 14px;">Qty</th>
            <th style="padding: 12px 10px; text-align: right; border: 1px solid ${tableBorderColor}; font-weight: bold; color: ${textColor}; font-size: 14px;">Rate</th>
            <th style="padding: 12px 10px; text-align: center; border: 1px solid ${tableBorderColor}; font-weight: bold; color: ${textColor}; font-size: 14px;">GST%</th>
            <th style="padding: 12px 10px; text-align: right; border: 1px solid ${tableBorderColor}; font-weight: bold; color: ${textColor}; font-size: 14px;">GST Amount</th>
            <th style="padding: 12px 10px; text-align: right; border: 1px solid ${tableBorderColor}; font-weight: bold; color: ${textColor}; font-size: 14px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
            <tr>
              <td style="padding: 10px; border: 1px solid ${tableBorderColor}; color: ${textColor}; font-size: 13px;">${item.description}</td>
              <td style="padding: 10px; text-align: center; border: 1px solid ${tableBorderColor}; color: ${textColor}; font-size: 13px;">${item.quantity}</td>
              <td style="padding: 10px; text-align: right; border: 1px solid ${tableBorderColor}; color: ${textColor}; font-size: 13px;">₹${item.rate.toFixed(2)}</td>
              <td style="padding: 10px; text-align: center; border: 1px solid ${tableBorderColor}; color: ${textColor}; font-size: 13px;">${item.gstRate}%</td>
              <td style="padding: 10px; text-align: right; border: 1px solid ${tableBorderColor}; color: ${textColor}; font-size: 13px;">₹${item.gstAmount.toFixed(2)}</td>
              <td style="padding: 10px; text-align: right; border: 1px solid ${tableBorderColor}; color: ${textColor}; font-weight: bold; font-size: 13px;">₹${item.amount.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
        <div style="width: 280px; padding: 10px 15px; border: 1px solid ${tableBorderColor}; border-top: 2px solid ${primaryColor};">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1.5px solid ${subtleDivider};"> <span style="color: ${lightTextColor}; font-size: 14px;">Subtotal:</span>
            <span style="color: ${textColor}; font-weight: bold; font-size: 14px;">₹${invoice.subtotal.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1.5px solid ${subtleDivider};"> <span style="color: ${lightTextColor}; font-size: 14px;">Total GST:</span>
            <span style="color: ${textColor}; font-weight: bold; font-size: 14px;">₹${invoice.totalGst.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 12px 0;">
            <span style="color: ${textColor}; font-size: 18px; font-weight: bold;">Total:</span>
            <span style="color: ${primaryColor}; font-size: 18px; font-weight: bold;">₹${invoice.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      ${invoice.notes ? `
        <div style="margin-bottom: 25px;">
          <h3 style="color: ${textColor}; margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">Notes:</h3>
          <p style="color: ${lightTextColor}; font-size: 13px; line-height: 1.6; margin: 0; padding: 12px; background-color: ${notesBg}; border-left: 4px solid ${primaryColor}; border-radius: 4px;">${invoice.notes}</p>
        </div>
      ` : ''}

      ${companySettings.bankName || companySettings.accountNumber || companySettings.ifscCode || companySettings.branchName ? `
        <div style="margin-top: 30px; margin-bottom: 25px; padding-top: 20px; border-top: 1px dashed ${subtleDivider};">
          <h3 style="color: ${textColor}; margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">Bank Details:</h3>
          <div style="color: ${textColor}; font-size: 13px; line-height: 1.6;">
            ${companySettings.bankName ? `<div><strong>Bank Name:</strong> ${companySettings.bankName}</div>` : ''}
            ${companySettings.accountNumber ? `<div><strong>Account Number:</strong> ${companySettings.accountNumber}</div>` : ''}
            ${companySettings.ifscCode ? `<div><strong>IFSC Code:</strong> ${companySettings.ifscCode}</div>` : ''}
            ${companySettings.branchName ? `<div><strong>Branch Name:</strong> ${companySettings.branchName}</div>` : ''}
          </div>
        </div>
      ` : ''}

      <div style="text-align: center; padding-top: 30px; border-top: 1px solid ${subtleDivider}; color: ${lightTextColor}; font-size: 12px; line-height: 1.5; margin-top: auto;"> 
        <p style="margin: 0;">Thank you for your business!</p>
        <p style="margin: 5px 0 0 0;">This is a computer-generated invoice and does not require a signature.</p>
      </div>
    </div>
  `;

  document.body.appendChild(tempDiv);

  try {
    const canvas = await html2canvas(tempDiv, {
      scale: 2, // Compromise scale: Quality over 1, aims to keep size down
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // As per your decision, the logo image is NOT included here.
    // The company name is used as a text-based logo.

    const imgWidth = 210; 
    const pageHeight = 297; 
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`);
  } finally {
    document.body.removeChild(tempDiv);
  }
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'draft':
      return '#616161'; // Match lightTextColor for consistency
    case 'sent':
      return primaryColor; 
    case 'paid':
      return '#4CAF50'; // A standard green
    default:
      return '#616161';
  }
};