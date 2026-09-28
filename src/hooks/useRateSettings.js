import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchRateSettings,
  saveRateSettingsRecord,
  subscribeToRateSettingsChanges,
} from "../services/supabaseData";
import {
  cacheRateSettings,
  loadCachedRateSettings,
  normalizeRateSettings,
} from "../utils/rateSettings";
import { getActiveBranch } from "../branches";

export default function useRateSettings(branch = getActiveBranch()) {
  const [rateSettings, setRateSettings] = useState(() => loadCachedRateSettings(branch));
  const hasSavedLocallyRef = useRef(false);

  const applyRateSettings = useCallback(
    (nextSettings) => {
      const normalized = normalizeRateSettings(nextSettings);
      setRateSettings(normalized);
      cacheRateSettings(normalized, branch);
      return normalized;
    },
    [branch]
  );

  useEffect(() => {
    let isCancelled = false;

    fetchRateSettings(branch)
      .then((remoteSettings) => {
        // A save made while this request was in flight is newer than its result
        if (isCancelled || !remoteSettings || hasSavedLocallyRef.current) return;
        applyRateSettings(remoteSettings);
      })
      .catch((error) => {
        console.error("Failed to load rate settings:", error);
      });

    const unsubscribe = subscribeToRateSettingsChanges((remoteSettings) => {
      if (!isCancelled) applyRateSettings(remoteSettings);
    }, branch);

    return () => {
      isCancelled = true;
      unsubscribe();
    };
  }, [applyRateSettings, branch]);

  // Applies on this device right away, then syncs to Supabase.
  // Resolves true when synced, false when Supabase is not configured; rejects if the sync fails.
  const saveRateSettings = useCallback(
    (nextSettings) => {
      hasSavedLocallyRef.current = true;
      return saveRateSettingsRecord(applyRateSettings(nextSettings), branch);
    },
    [applyRateSettings, branch]
  );

  return { rateSettings, saveRateSettings };
}
