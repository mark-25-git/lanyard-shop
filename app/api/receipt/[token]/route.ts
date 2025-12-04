import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import { handleCorsPreflight, addCorsHeaders } from '@/lib/cors';
import {
  createUserError,
  createServerError,
  createNotFoundError,
} from '@/lib/error-handler';
import { sanitizeText } from '@/lib/sanitize';
import { Order } from '@/types/order';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { renderToBuffer } from '@react-pdf/renderer';
import ReceiptPDF from '@/components/ReceiptPDF';
import React from 'react';

// Convert image to base64 data URI
async function imageToDataUri(imagePath: string): Promise<string> {
  try {
    const imageBuffer = await readFile(imagePath);
    const base64 = imageBuffer.toString('base64');
    const ext = imagePath.split('.').pop()?.toLowerCase();
    const mimeType = ext === 'png' ? 'image/png' : ext === 'svg' ? 'image/svg+xml' : 'image/jpeg';
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Error converting image to data URI:', error);
    return ''; // Return empty string if image can't be loaded
  }
}


export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreflight(request);
  if (preflightResponse) {
    return preflightResponse;
  }

  // Rate limiting - public API
  const rateLimitResponse = rateLimit(request, 'public');
  if (rateLimitResponse) {
    return addCorsHeaders(request, rateLimitResponse);
  }

  try {
    const { token } = params;
    
    if (!token || typeof token !== 'string') {
      return createUserError(
        'Download token is required.',
        400,
        request
      );
    }

    // Sanitize token
    const sanitizedToken = sanitizeText(token, 100);
    if (!sanitizedToken) {
      return createUserError(
        'Invalid download token format.',
        400,
        request
      );
    }

    let supabase;
    try {
      supabase = createServerClient();
    } catch (clientError: any) {
      console.error('Failed to create Supabase client:', clientError.message);
      return createServerError(
        request,
        new Error('Database connection error. Please check server configuration.')
      );
    }

    // Use invoice token (one-time use, validates and marks as used)
    // Reuse the same token system for receipts
    const { data: tokenData, error: tokenError } = await supabase.rpc('use_invoice_token', {
      p_token: sanitizedToken
    });

    if (tokenError || !tokenData || tokenData.length === 0 || !tokenData[0] || !tokenData[0].order_number) {
      return createNotFoundError(
        'This download link has expired or is invalid. This link can only be used once.',
        request
      );
    }

    const orderNumber = tokenData[0].order_number as string;

    // Fetch order from Supabase
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single();

    if (error || !order) {
      return createNotFoundError('Order not found.', request);
    }

    // Verify order is paid
    if (!order.payment_confirmed_at) {
      return createUserError(
        'Receipt is only available for paid orders.',
        400,
        request
      );
    }

    // Convert logo to base64 data URI
    const logoPath = join(process.cwd(), 'public', 'images', 'teevent-logo.png');
    const logoDataUri = await imageToDataUri(logoPath);

    // Generate PDF using React-PDF
    try {
      const pdfBuffer = await renderToBuffer(
        React.createElement(ReceiptPDF, {
          order: order as Order,
          logoDataUri: logoDataUri,
        }) as React.ReactElement
      );

      // Return PDF as download
      // Convert Buffer to Uint8Array for NextResponse
      const pdfArray = new Uint8Array(pdfBuffer);
      const response = new NextResponse(pdfArray, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="receipt-${orderNumber}.pdf"`,
        },
      });

      return addCorsHeaders(request, response);
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      return createServerError(request, pdfError);
    }
  } catch (error) {
    console.error('Receipt generation error:', error);
    return createServerError(request, error);
  }
}

