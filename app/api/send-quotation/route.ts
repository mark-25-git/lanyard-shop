import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import QuotationPDF, { QuotationData } from '@/components/QuotationPDF';
import { getResendClient, getFromEmail } from '@/lib/resend';
import { generateOrderNumber } from '@/lib/pricing';
import fs from 'fs';
import path from 'path';

// Helper: generate quotation number based on existing order number generator
function generateQuotationNumber(): string {
  // Reuse generateOrderNumber format but swap prefix to QUO-
  const orderNumber = generateOrderNumber(); // e.g. INV-YYMMDDXXXXXX
  return orderNumber.replace(/^INV-/, 'QUO-');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      contactName,
      email,
      companyName,
      quantity,
      unitPrice,
      totalPrice,
    } = body || {};

    if (!contactName || !email) {
      return NextResponse.json(
        { error: 'Contact name and email are required.' },
        { status: 400 }
      );
    }

    if (
      !quantity ||
      typeof quantity !== 'number' ||
      quantity < 50 ||
      quantity >= 600
    ) {
      return NextResponse.json(
        { error: 'Quotation is only available for quantities between 50 and 599.' },
        { status: 400 }
      );
    }

    if (
      typeof unitPrice !== 'number' ||
      typeof totalPrice !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Pricing information is missing or invalid.' },
        { status: 400 }
      );
    }

    const quotationNumber = generateQuotationNumber();
    const quotationDate = new Date().toISOString();

    const quotation: QuotationData = {
      quotationNumber,
      quotationDate,
      contactName,
      email,
      companyName,
      quantity,
      unitPrice,
      totalPrice,
    };

    // Bank account for PDF
    const bankAccount =
      process.env.NEXT_PUBLIC_BANK_ACCOUNT || '';

    // Load logo from public folder for PDF (best-effort)
    let logoDataUri = '';
    try {
      const logoPath = path.join(process.cwd(), 'public', 'images', 'teevent-logo.png');
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = logoBuffer.toString('base64');
      logoDataUri = `data:image/png;base64,${logoBase64}`;
    } catch (logoError) {
      console.warn('Failed to load logo for quotation PDF:', logoError);
    }

    // Generate PDF buffer
    const pdfBuffer = await renderToBuffer(
      React.createElement(QuotationPDF, {
        quotation,
        logoDataUri,
        bankAccount,
      }) as React.ReactElement
    );

    // Convert Buffer to base64 for email attachment
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

    const resend = getResendClient();
    const fromEmail = getFromEmail();

    const subject = `Your quotation from Teevent (${quotationNumber})`;

    const whatsappUrl =
      'https://wa.me/60137482481?text=' +
      encodeURIComponent('Hi Teevent! I have a question about my quotation.');

    const html = `
      <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: #111827;">
        <p>Hi ${contactName},</p>
        <p>Thank you for your interest in Teevent custom lanyards.</p>
        <p>We've attached your formal quotation PDF for:</p>
        <ul>
          <li>Quantity: <strong>${quantity}</strong></li>
          <li>Total: <strong>RM ${totalPrice.toFixed(2)}</strong></li>
        </ul>
        <p>If you have any questions or need adjustments, just reply to this email or <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer">contact us</a>.</p>
        <p style="margin-top: 16px;">Best regards,<br />Teevent Team</p>
      </div>
    `;

    const { error: emailError } = await resend.emails.send({
      from: `Teevent <${fromEmail}>`,
      to: email,
      subject,
      html,
      attachments: [
        {
          filename: `${quotationNumber}.pdf`,
          content: pdfBase64,
        },
      ],
      replyTo: 'team.teevent@gmail.com',
    });

    if (emailError) {
      console.error('Resend API error (quotation):', emailError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send quotation email.',
          details: emailError,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      quotationNumber,
    });
  } catch (error: any) {
    console.error('Error in send-quotation API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected error while sending quotation.',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

