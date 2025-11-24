import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import { handleCorsPreflight, addCorsHeaders } from '@/lib/cors';
import {
  createUserError,
  createServerError,
  createNotFoundError,
  isNotFoundError,
} from '@/lib/error-handler';
import { sanitizeText } from '@/lib/sanitize';
import { Order } from '@/types/order';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { renderToBuffer } from '@react-pdf/renderer';
import InvoicePDF from '@/components/InvoicePDF';
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
  { params }: { params: { orderNumber: string } }
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
    const { orderNumber } = params;
    
    if (!orderNumber) {
      return createUserError(
        'Order number is required.',
        400,
        request
      );
    }

    // Sanitize order number
    const sanitizedOrderNumber = sanitizeText(orderNumber, 50);
    if (!sanitizedOrderNumber) {
      return createUserError(
        'Invalid order number provided.',
        400,
        request
      );
    }

    // Fetch order from Supabase
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
    
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', sanitizedOrderNumber)
      .single();

    if (error || !order) {
      if (isNotFoundError(error)) {
        return createNotFoundError('Order not found.', request);
      }
      return createServerError(request, error);
    }

    // Convert logo to base64 data URI
    const logoPath = join(process.cwd(), 'public', 'images', 'teevent-logo.png');
    const logoDataUri = await imageToDataUri(logoPath);

    // Get bank account from environment
    const bankAccount = process.env.NEXT_PUBLIC_BANK_ACCOUNT || '';

    // Generate PDF using React-PDF
    try {
      const pdfBuffer = await renderToBuffer(
        React.createElement(InvoicePDF, {
          order: order as Order,
          logoDataUri: logoDataUri,
          bankAccount: bankAccount,
        }) as React.ReactElement
      );

      // Return PDF as download
      // Convert Buffer to Uint8Array for NextResponse
      const pdfArray = new Uint8Array(pdfBuffer);
      const response = new NextResponse(pdfArray, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="invoice-${sanitizedOrderNumber}.pdf"`,
        },
      });

      return addCorsHeaders(request, response);
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      return createServerError(request, pdfError);
    }
  } catch (error) {
    console.error('Invoice generation error:', error);
    return createServerError(request, error);
  }
}

