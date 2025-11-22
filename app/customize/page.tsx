import { getStats } from '@/lib/stats';
import CustomizePageClient from './CustomizePageClient';

export default async function CustomizePage() {
  // Fetch stats server-side before rendering
  const stats = await getStats();

  // Fallback to default values if stats fetch fails
  const initialStats = stats || {
    unique_events: 31,
    lanyards_delivered: 4246,
    complaints: 0,
  };

  return <CustomizePageClient initialStats={initialStats} />;
}
