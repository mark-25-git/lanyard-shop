import { getStats } from '@/lib/stats';
import LandingPageClient from '@/components/landing/LandingPageClient';
import { unstable_noStore as noStore } from 'next/cache';

// Force dynamic rendering - stats are fetched server-side
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Never cache this page

export default async function Home() {
  // Explicitly prevent caching
  noStore();
  
  // Fetch stats server-side before rendering
  const stats = await getStats();

  // Fallback to default value only if stats fetch fails (null)
  // If stats exists but lanyards_delivered is 0, use 0 (don't fallback)
  const lanyardsDelivered = stats !== null ? stats.lanyards_delivered : 4246;

  return <LandingPageClient lanyardsDelivered={lanyardsDelivered} />;
}
