import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import InvoicePDF from '@/components/InvoicePDF';
import { Order } from '@/types/order';
import React from 'react';

export async function POST(request: NextRequest) {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const { order, logoDataUri, bankAccount } = body;

    if (!order) {
      return NextResponse.json(
        { error: 'Order data is required' },
        { status: 400 }
      );
    }

    // Generate PDF buffer
    const pdfBuffer = await renderToBuffer(
      React.createElement(InvoicePDF, {
        order: order as Order,
        logoDataUri: logoDataUri || '',
        bankAccount: bankAccount || '',
      }) as React.ReactElement
    );

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="test-invoice.pdf"',
      },
    });
  } catch (error) {
    console.error('Error generating test PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

