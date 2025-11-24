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

// Invoice number is the same as order number (already formatted correctly)

// Format date for invoice
function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

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

// Replace template placeholders with order data
function replaceTemplatePlaceholders(template: string, order: Order, logoDataUri: string, bankAccount: string): string {
  // Invoice number is the same as order number (already formatted correctly)
  const invoiceNumber = order.order_number;
  const issueDate = formatDate(order.created_at);
  
  // Format prices with 2 decimal places
  const unitPrice = order.unit_price.toFixed(2);
  const totalPrice = order.total_price.toFixed(2);
  
  // Get payment status text
  const paymentStatusMap: Record<string, string> = {
    'pending': 'Pending',
    'payment_pending': 'Payment Pending',
    'payment_pending_verification': 'Payment Pending Verification',
    'paid': 'Paid',
    'design_file_pending': 'Design File Pending',
    'design_file_received': 'Design File Received',
    'in_production': 'In Production',
    'order_shipped': 'Order Shipped',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  };
  const paymentStatus = paymentStatusMap[order.status] || order.status;

  // Simple template replacement (Handlebars-style but using simple replace)
  let html = template;
  
  // Replace all placeholders
  // Replace logo_path placeholder and also any hardcoded logo paths in template
  html = html.replace(/\{\{logo_path\}\}/g, logoDataUri);
  html = html.replace(/src="\.\.\/public\/images\/teevent-logo\.png"/g, `src="${logoDataUri}"`);
  html = html.replace(/src="\/images\/teevent-logo\.png"/g, `src="${logoDataUri}"`);
  html = html.replace(/\{\{order_number\}\}/g, order.order_number);
  html = html.replace(/\{\{invoice_number\}\}/g, invoiceNumber);
  html = html.replace(/\{\{issue_date\}\}/g, issueDate);
  html = html.replace(/\{\{order_date\}\}/g, issueDate);
  html = html.replace(/\{\{customer_name\}\}/g, order.customer_name || '');
  html = html.replace(/\{\{customer_email\}\}/g, order.customer_email || '');
  html = html.replace(/\{\{customer_phone\}\}/g, order.customer_phone || '');
  html = html.replace(/\{\{event_or_organization_name\}\}/g, order.event_or_organization_name || '');
  html = html.replace(/\{\{billing_address_line1\}\}/g, order.billing_address_line1 || '');
  html = html.replace(/\{\{billing_address_line2\}\}/g, order.billing_address_line2 || '');
  html = html.replace(/\{\{billing_city\}\}/g, order.billing_city || '');
  html = html.replace(/\{\{billing_state\}\}/g, order.billing_state || '');
  html = html.replace(/\{\{billing_postal_code\}\}/g, order.billing_postal_code || '');
  html = html.replace(/\{\{billing_country\}\}/g, order.billing_country || '');
  html = html.replace(/\{\{quantity\}\}/g, order.quantity.toString());
  html = html.replace(/\{\{unit_price\}\}/g, unitPrice);
  html = html.replace(/\{\{total_price\}\}/g, totalPrice);
  html = html.replace(/\{\{payment_method\}\}/g, order.payment_method || 'Bank Transfer');
  html = html.replace(/\{\{payment_reference\}\}/g, order.payment_reference || '');
  html = html.replace(/\{\{payment_status\}\}/g, paymentStatus);
  html = html.replace(/\{\{bank_account\}\}/g, bankAccount);
  
  // Handle conditional blocks (simple implementation)
  // Remove blocks if condition is false, otherwise remove the if tags
  const conditionals = [
    { key: 'event_or_organization_name', value: order.event_or_organization_name },
    { key: 'billing_address_line2', value: order.billing_address_line2 },
    { key: 'payment_reference', value: order.payment_reference },
    { key: 'adjustments', value: false }, // Adjustments not used, always remove
  ];

  conditionals.forEach(({ key, value }) => {
    if (!value) {
      // Remove entire block including if/endif tags
      // Use non-greedy match with multiline support
      const blockPattern = new RegExp(`\\{\\{#if ${key}\\}\\}[\\s\\S]*?\\{\\{\\/if\\}\\}`, 'g');
      html = html.replace(blockPattern, '');
    } else {
      // Remove just the if/endif tags, keep content
      const ifPattern = new RegExp(`\\{\\{#if ${key}\\}\\}`, 'g');
      const endIfPattern = /\{\{\/if\}\}/g;
      html = html.replace(ifPattern, '');
      html = html.replace(endIfPattern, '');
    }
  });
  
  // Clean up any remaining conditional tags and placeholders that might have been missed
  html = html.replace(/\{\{#if [^}]+\}\}/g, '');
  html = html.replace(/\{\{\/if\}\}/g, '');
  html = html.replace(/\{\{adjustments\}\}/g, ''); // Remove adjustments placeholder if still present

  return html;
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

    // Load HTML template
    // In Next.js, process.cwd() is the project root (lanyard-shop directory)
    const templatePath = join(process.cwd(), 'templates', 'invoice.html');
    const template = await readFile(templatePath, 'utf-8');

    // Convert logo to base64 data URI
    const logoPath = join(process.cwd(), 'public', 'images', 'teevent-logo.png');
    const logoDataUri = await imageToDataUri(logoPath);

    // Get bank account from environment
    const bankAccount = process.env.NEXT_PUBLIC_BANK_ACCOUNT || '';

    // Replace placeholders in template
    const html = replaceTemplatePlaceholders(template, order as Order, logoDataUri, bankAccount);

    // Generate PDF using Puppeteer
    // Use dynamic import to avoid loading Puppeteer at module initialization
    // This prevents conflicts with other dependencies like Supabase
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
    
    let puppeteer: any;
    let chromium: any;
    
    if (isProduction) {
      // In production (Vercel), use puppeteer-core with @sparticuz/chromium
      const puppeteerModule = await import('puppeteer-core');
      const chromiumModule = await import('@sparticuz/chromium');
      puppeteer = puppeteerModule.default;
      chromium = chromiumModule.default;
    } else {
      // In development, use regular puppeteer
      const puppeteerModule = await import('puppeteer');
      puppeteer = puppeteerModule.default;
    }
    
    const browser = await puppeteer.launch({
      headless: true,
      args: isProduction ? chromium.args : [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      executablePath: isProduction 
        ? await chromium.executablePath() 
        : undefined,
    });

    try {
      const page = await browser.newPage();
      
      // Set content with a simpler wait condition
      // Use 'domcontentloaded' instead of 'networkidle0' since we're using data URIs for images
      await page.setContent(html, { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 // 10 second timeout
      });
      
      // Small delay to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
      });

      await browser.close();

      // Return PDF as download
      const response = new NextResponse(pdf as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="invoice-${sanitizedOrderNumber}.pdf"`,
        },
      });

      return addCorsHeaders(request, response);
    } catch (pdfError) {
      await browser.close();
      console.error('PDF generation error:', pdfError);
      return createServerError(request, pdfError);
    }
  } catch (error) {
    console.error('Invoice generation error:', error);
    return createServerError(request, error);
  }
}

