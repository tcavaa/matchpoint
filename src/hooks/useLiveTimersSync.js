import { useEffect, useRef } from "react";
import {
  fetchLiveTimers,
  upsertLiveTimers,
  subscribeToLiveTimerChanges,
} from "../services/supabaseData";

const LIVE_SYNC_FIELDS = [
  "name",
  "isAvailable",
  "timerStartTime",
  "elapsedTimeInSeconds",
  "isRunning",
  "timerMode",
  "initialCountdownSeconds",
  "sessionStartTime",
  "sessionEndTime",
  "fitPass",
  "gameType",
  "hourlyRate",
  "syncRevision",
];

function mergeRemoteTable(localTable, remoteTable) {
  if (!remoteTable) return localTable;
  const merged = { ...localTable };
  LIVE_SYNC_FIELDS.forEach((key) => {
    merged[key] = remoteTable[key];
  });
  return merged;
}

function areTablesEquivalentForSync(a, b) {
  if (!a || !b) return false;
  return LIVE_SYNC_FIELDS.every((key) => a[key] === b[key]);
}

function hasSyncRelevantDifference(a, b) {
  if (!a || !b) return true;
  return LIVE_SYNC_FIELDS.some((key) => key !== "syncRevision" && a[key] !== b[key]);
}

export default function useLiveTimersSync(tables, setTables) {
  const isApplyingRemoteSyncRef = useRef(false);
  const hasBootstrappedRemoteRef = useRef(false);
  const latestTablesRef = useRef(tables);
  const pendingLocalSyncRef = useRef(false);
  const tableRevisionRef = useRef({});
  const lastSentTablesRef = useRef(tables);

  useEffect(() => {
    latestTablesRef.current = tables;
  }, [tables]);

  useEffect(() => {
    let isCancelled = false;

    const bootstrapLiveTimers = async () => {
      try {
        const remoteTables = await fetchLiveTimers();
        if (isCancelled) return;

        if (remoteTables.length > 0) {
          isApplyingRemoteSyncRef.current = true;
          tableRevisionRef.current = remoteTables.reduce((acc, table) => {
            acc[table.id] = Number(table.syncRevision || 0);
            return acc;
          }, {});
          lastSentTablesRef.current = remoteTables;
          setTables((prevTables) =>
            prevTables.map((table) => {
              const remote = remoteTables.find((rt) => rt.id === table.id);
              return mergeRemoteTable(table, remote);
            })
          );
        } else {
          const revision = Date.now();
          tableRevisionRef.current = latestTablesRef.current.reduce((acc, table) => {
            acc[table.id] = revision;
            return acc;
          }, {});
          lastSentTablesRef.current = latestTablesRef.current;
          await upsertLiveTimers(latestTablesRef.current, revision);
        }
      } catch (error) {
        console.error("Failed to bootstrap live timers:", error);
      } finally {
        hasBootstrappedRemoteRef.current = true;
        if (pendingLocalSyncRef.current) {
          pendingLocalSyncRef.current = false;
          const revision = Date.now();
          tableRevisionRef.current = latestTablesRef.current.reduce((acc, table) => {
            acc[table.id] = revision;
            return acc;
          }, {});
          lastSentTablesRef.current = latestTablesRef.current;
          upsertLiveTimers(latestTablesRef.current, revision).catch((error) => {
            console.error("Failed to flush pending live timer sync:", error);
          });
        }
      }
    };

    bootstrapLiveTimers();

    const unsubscribe = subscribeToLiveTimerChanges((remoteTable) => {
      if (isCancelled) return;
      const remoteRevision = Number(remoteTable.syncRevision || 0);
      const localRevision = Number(tableRevisionRef.current[remoteTable.id] || 0);
      if (remoteRevision <= localRevision) return;
      tableRevisionRef.current[remoteTable.id] = remoteRevision;
      isApplyingRemoteSyncRef.current = true;
      lastSentTablesRef.current = lastSentTablesRef.current.map((table) =>
        table.id === remoteTable.id ? mergeRemoteTable(table, remoteTable) : table
      );
      setTables((prevTables) =>
        prevTables.map((table) => {
          if (table.id !== remoteTable.id) return table;
          const merged = mergeRemoteTable(table, remoteTable);
          return areTablesEquivalentForSync(table, merged) ? table : merged;
        })
      );
    });

    return () => {
      isCancelled = true;
      unsubscribe();
    };
  }, [setTables]);

  useEffect(() => {
    if (!hasBootstrappedRemoteRef.current) {
      pendingLocalSyncRef.current = true;
      return;
    }
    if (isApplyingRemoteSyncRef.current) {
      isApplyingRemoteSyncRef.current = false;
      lastSentTablesRef.current = tables;
      return;
    }

    const changedTables = tables.filter((table) => {
      const previous = lastSentTablesRef.current.find((t) => t.id === table.id);
      return hasSyncRelevantDifference(previous, table);
    });
    if (changedTables.length === 0) return;

    const revision = Date.now();
    tableRevisionRef.current = changedTables.reduce(
      (acc, table) => {
        acc[table.id] = revision;
        return acc;
      },
      { ...tableRevisionRef.current }
    );

    lastSentTablesRef.current = tables;
    upsertLiveTimers(changedTables, revision).catch((error) => {
      console.error("Failed to sync live timers:", error);
    });
  }, [tables]);
}

