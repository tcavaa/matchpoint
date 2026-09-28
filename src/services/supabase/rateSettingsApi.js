import { supabase, isSupabaseConfigured } from "../supabaseClient";
import { getActiveBranch } from "../../branches";

// One row per location, so every device at a location bills with the same prices.

export async function fetchRateSettings(branch = getActiveBranch()) {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase
    .from("rate_settings")
    .select("settings")
    .eq("branch", branch)
    .maybeSingle();

  if (error) throw error;
  return data?.settings ?? null;
}

// Resolves true once stored in Supabase, false when Supabase is not configured.
export async function saveRateSettingsRecord(settings, branch = getActiveBranch()) {
  if (!isSupabaseConfigured || !supabase) return false;
  const { error } = await supabase.from("rate_settings").upsert(
    {
      branch,
      settings,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "branch" }
  );

  if (error) throw error;
  return true;
}

export function subscribeToRateSettingsChanges(onChange, branch = getActiveBranch()) {
  if (!isSupabaseConfigured || !supabase) return () => {};

  const channel = supabase
    .channel(`rate-settings-sync-${branch}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "rate_settings",
        filter: `branch=eq.${branch}`,
      },
      (payload) => {
        const settings = payload.new?.settings;
        if (settings) onChange(settings);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
