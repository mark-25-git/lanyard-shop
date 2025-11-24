import { createServerClient } from './supabase';
import { PricingTier, PriceCalculation } from '@/types/order';

/**
 * Get pricing tier for a given quantity
 * Returns null if quantity is less than MOQ (50) or >= 600 (enterprise pricing)
 */
export async function getPricingTier(quantity: number): Promise<PricingTier | null> {
  // MOQ is 50
  if (quantity < 50) {
    return null;
  }

  // For quantities >= 600, contact us for enterprise pricing
  if (quantity >= 600) {
    return null;
  }

  try {
    // Use server client (same as other working API routes)
    let supabase;
    try {
      supabase = createServerClient();
    } catch (clientError: any) {
      console.error('Failed to create Supabase client:', clientError.message);
      // Re-throw as a more descriptive error
      throw new Error('Database connection error. Please check server configuration.');
    }
    
    const { data, error } = await supabase
      .from('pricing_tiers')
      .select('*')
      .eq('is_active', true)
      .lte('min_quantity', quantity)
      .order('min_quantity', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('Pricing tier query error:', error);
      // If it's a connection/auth error, log it but don't expose to user
      if (error.message?.includes('JWT') || error.message?.includes('Invalid API key')) {
        console.error('Supabase authentication error - check environment variables');
        throw new Error('Database authentication error. Please check server configuration.');
      }
      return null;
    }

    if (!data) {
      return null;
    }

    // Check if quantity is within max_quantity (if set)
    if (data.max_quantity !== null && quantity > data.max_quantity) {
      return null;
    }

    return data as PricingTier;
  } catch (error) {
    console.error('Error getting pricing tier:', error);
    return null;
  }
}

/**
 * Calculate price for a given quantity
 */
export async function calculatePrice(quantity: number): Promise<PriceCalculation | null> {
  const tier = await getPricingTier(quantity);
  
  if (!tier) {
    return null;
  }

  return {
    quantity,
    unit_price: tier.unit_price,
    total_price: tier.unit_price * quantity,
    tier,
  };
}

/**
 * Generate unique order number
 * Format: INV-YYMMDD{6 unique characters} (e.g., INV-250121A3B9C2)
 * 6 characters: capital letters (A-Z) and numbers (0-9)
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 01-12
  const day = now.getDate().toString().padStart(2, '0'); // 01-31
  
  // Generate 6 random characters (A-Z, 0-9)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `INV-${year}${month}${day}${randomPart}`;
}

