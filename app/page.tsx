import { getStats } from '@/lib/stats';
import LandingPageClient from '@/components/landing/LandingPageClient';

// Force dynamic rendering - stats are fetched server-side
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Fetch stats server-side before rendering
  const stats = await getStats();

  // Fallback to default value if stats fetch fails
  const lanyardsDelivered = stats?.lanyards_delivered || 4246;

  return <LandingPageClient lanyardsDelivered={lanyardsDelivered} />;
}
