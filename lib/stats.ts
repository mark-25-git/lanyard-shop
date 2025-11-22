import { createServerClient } from './supabase';

/**
 * Increment a stat value in the stats table
 */
export async function incrementStat(statKey: string, amount: number = 1): Promise<void> {
  const supabase = createServerClient();
  
  // Try RPC function first (if it exists)
  const { error: rpcError } = await supabase.rpc('increment_stat', {
    stat_key: statKey,
    increment_amount: amount
  });

  // If RPC function doesn't exist (PGRST202) or fails, use manual update
  // PGRST202 = function not found, which is expected if migration wasn't run
  if (rpcError && (rpcError.code === 'PGRST202' || rpcError.message?.includes('Could not find the function'))) {
    // Fallback: Get current value and update manually
    const { data: currentStat, error: fetchError } = await supabase
      .from('stats')
      .select('base_value')
      .eq('stat_key', statKey)
      .single();

    if (fetchError) {
      // If stat doesn't exist (PGRST116 = no rows returned), create it
      if (fetchError.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('stats')
          .insert({
            stat_key: statKey,
            base_value: amount,
            last_updated: new Date().toISOString()
          });

        if (insertError) {
          console.error(`Error creating stat ${statKey}:`, insertError);
          throw insertError;
        }
        return;
      }
      console.error(`Error fetching stat ${statKey}:`, fetchError);
      throw fetchError;
    }

    const newValue = (currentStat?.base_value || 0) + amount;

    const { error: updateError } = await supabase
      .from('stats')
      .update({ 
        base_value: newValue,
        last_updated: new Date().toISOString()
      })
      .eq('stat_key', statKey);

    if (updateError) {
      console.error(`Error updating stat ${statKey}:`, updateError);
      throw updateError;
    }
  } else if (rpcError) {
    // Other RPC error (not function not found)
    console.error(`Unexpected RPC error for ${statKey}:`, rpcError);
    throw rpcError;
  }
}

/**
 * Get all stats values
 */
export async function getStats(): Promise<{
  unique_events: number;
  lanyards_delivered: number;
  complaints: number;
} | null> {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('stats')
    .select('stat_key, base_value');

  if (error) {
    console.error('Error fetching stats:', error);
    return null;
  }

  const stats = {
    unique_events: 0,
    lanyards_delivered: 0,
    complaints: 0,
  };

  data?.forEach((stat) => {
    if (stat.stat_key === 'unique_events') {
      stats.unique_events = stat.base_value;
    } else if (stat.stat_key === 'lanyards_delivered') {
      stats.lanyards_delivered = stat.base_value;
    } else if (stat.stat_key === 'complaints') {
      stats.complaints = stat.base_value;
    }
  });

  return stats;
}

