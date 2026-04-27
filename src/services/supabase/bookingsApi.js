import { supabase, isSupabaseConfigured } from "../supabaseClient";
import { assertSupabase } from "./assertSupabase";

const FULL_COLUMNS =
  "id, customer_name, tables_count, hours_count, table_ids, booking_at, is_done, done_at, created_at";
const LEGACY_COLUMNS_NO_TABLE_IDS =
  "id, customer_name, tables_count, hours_count, booking_at, is_done, done_at, created_at";
const VERY_LEGACY_COLUMNS =
  "id, customer_name, tables_count, hours_count, created_at";

let hasWarnedMissingTableIds = false;

function emitBookingsChanged() {
  if (typeof window !== "undefined" && typeof CustomEvent === "function") {
    window.dispatchEvent(new CustomEvent("bookings:changed"));
  }
}

function normalizeTableIds(rawIds) {
  if (!Array.isArray(rawIds)) return [];
  return rawIds
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);
}

function normalizeBooking(row) {
  return {
    ...row,
    is_done: Boolean(row?.is_done),
    done_at: row?.done_at ?? null,
    booking_at: row?.booking_at ?? null,
    table_ids: normalizeTableIds(row?.table_ids),
  };
}

function isMissingTableIdsError(error) {
  if (!error) return false;
  const message = error.message || "";
  return (
    error.code === "42703" ||
    /table_ids/i.test(message) ||
    /column\s+\\?"?table_ids\\?"?/i.test(message)
  );
}

function warnMissingTableIdsOnce() {
  if (hasWarnedMissingTableIds) return;
  hasWarnedMissingTableIds = true;
  console.warn(
    "Supabase bookings table is missing the table_ids column. Falling back to legacy mode; run supabase/schema.sql to enable per-table booking assignments."
  );
}

export async function fetchBookings() {
  assertSupabase();

  const primary = await supabase
    .from("bookings")
    .select(FULL_COLUMNS)
    .or("is_done.is.false,is_done.is.null")
    .order("created_at", { ascending: false });

  if (!primary.error) return (primary.data || []).map(normalizeBooking);

  if (isMissingTableIdsError(primary.error)) {
    warnMissingTableIdsOnce();
    const noTableIds = await supabase
      .from("bookings")
      .select(LEGACY_COLUMNS_NO_TABLE_IDS)
      .or("is_done.is.false,is_done.is.null")
      .order("created_at", { ascending: false });
    if (!noTableIds.error) return (noTableIds.data || []).map(normalizeBooking);
  }

  const fallback = await supabase
    .from("bookings")
    .select(VERY_LEGACY_COLUMNS)
    .order("created_at", { ascending: false });

  if (fallback.error) throw fallback.error;
  return (fallback.data || []).map(normalizeBooking);
}

export async function createBooking({
  customerName,
  tablesCount,
  hoursCount,
  bookingAt,
  tableIds,
}) {
  assertSupabase();

  const normalizedHours =
    hoursCount === null || hoursCount === undefined || hoursCount === ""
      ? null
      : Number(hoursCount);
  const finalHoursCount =
    Number.isFinite(normalizedHours) && normalizedHours > 0 ? normalizedHours : null;

  const cleanedTableIds = normalizeTableIds(tableIds);
  const fallbackTablesCount = Number(tablesCount);
  const computedTablesCount =
    cleanedTableIds.length > 0
      ? cleanedTableIds.length
      : Number.isFinite(fallbackTablesCount) && fallbackTablesCount > 0
      ? fallbackTablesCount
      : 1;

  const fullPayload = {
    customer_name: customerName,
    tables_count: computedTablesCount,
    hours_count: finalHoursCount,
    booking_at: bookingAt || null,
    table_ids: cleanedTableIds,
  };

  const primary = await supabase
    .from("bookings")
    .insert(fullPayload)
    .select(FULL_COLUMNS)
    .single();

  if (!primary.error) {
    emitBookingsChanged();
    return normalizeBooking(primary.data);
  }

  if (isMissingTableIdsError(primary.error)) {
    warnMissingTableIdsOnce();
    const legacyPayload = {
      customer_name: customerName,
      tables_count: computedTablesCount,
      hours_count: finalHoursCount,
      booking_at: bookingAt || null,
    };
    const legacy = await supabase
      .from("bookings")
      .insert(legacyPayload)
      .select(LEGACY_COLUMNS_NO_TABLE_IDS)
      .single();
    if (!legacy.error) {
      emitBookingsChanged();
      return normalizeBooking({ ...legacy.data, table_ids: cleanedTableIds });
    }
  }

  const veryLegacyPayload = {
    customer_name: customerName,
    tables_count: computedTablesCount,
    hours_count: finalHoursCount,
  };
  const veryLegacy = await supabase
    .from("bookings")
    .insert(veryLegacyPayload)
    .select(VERY_LEGACY_COLUMNS)
    .single();

  if (veryLegacy.error) throw veryLegacy.error;
  emitBookingsChanged();
  return normalizeBooking({ ...veryLegacy.data, table_ids: cleanedTableIds });
}

export async function updateBooking(id, { customerName, hoursCount, bookingAt, tableIds }) {
  assertSupabase();

  const cleanedTableIds = normalizeTableIds(tableIds);
  const normalizedHours =
    hoursCount === null || hoursCount === undefined || hoursCount === ""
      ? null
      : Number(hoursCount);
  const finalHoursCount =
    Number.isFinite(normalizedHours) && normalizedHours > 0 ? normalizedHours : null;

  const fullPayload = {
    customer_name: customerName,
    tables_count: cleanedTableIds.length || 1,
    hours_count: finalHoursCount,
    booking_at: bookingAt || null,
    table_ids: cleanedTableIds,
  };

  const primary = await supabase
    .from("bookings")
    .update(fullPayload)
    .eq("id", id)
    .select(FULL_COLUMNS)
    .single();

  if (!primary.error) {
    emitBookingsChanged();
    return normalizeBooking(primary.data);
  }

  if (isMissingTableIdsError(primary.error)) {
    warnMissingTableIdsOnce();
    const legacyPayload = {
      customer_name: customerName,
      tables_count: cleanedTableIds.length || 1,
      hours_count: finalHoursCount,
      booking_at: bookingAt || null,
    };
    const legacy = await supabase
      .from("bookings")
      .update(legacyPayload)
      .eq("id", id)
      .select(LEGACY_COLUMNS_NO_TABLE_IDS)
      .single();
    if (!legacy.error) {
      emitBookingsChanged();
      return normalizeBooking({ ...legacy.data, table_ids: cleanedTableIds });
    }
    throw legacy.error;
  }

  throw primary.error;
}

export async function markBookingAsDone(id) {
  assertSupabase();

  const primary = await supabase
    .from("bookings")
    .update({ is_done: true, done_at: new Date().toISOString() })
    .eq("id", id)
    .select(FULL_COLUMNS)
    .single();

  if (!primary.error) {
    emitBookingsChanged();
    return normalizeBooking(primary.data);
  }

  if (isMissingTableIdsError(primary.error)) {
    warnMissingTableIdsOnce();
    const legacy = await supabase
      .from("bookings")
      .update({ is_done: true, done_at: new Date().toISOString() })
      .eq("id", id)
      .select(LEGACY_COLUMNS_NO_TABLE_IDS)
      .single();
    if (!legacy.error) {
      emitBookingsChanged();
      return normalizeBooking(legacy.data);
    }
  }

  const fallback = await supabase.from("bookings").delete().eq("id", id);
  if (fallback.error) throw fallback.error;
  emitBookingsChanged();
  return { id, is_done: true, done_at: new Date().toISOString() };
}

export async function deleteBooking(id) {
  assertSupabase();
  const { error } = await supabase.from("bookings").delete().eq("id", id);
  if (error) throw error;
  emitBookingsChanged();
}

export async function fetchActiveBookingsCount() {
  assertSupabase();
  const primary = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .or("is_done.is.false,is_done.is.null");

  if (!primary.error) return primary.count || 0;

  const fallback = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true });
  if (fallback.error) throw fallback.error;
  return fallback.count || 0;
}

export function subscribeToBookingsChanges(onChange) {
  if (!isSupabaseConfigured || !supabase) return () => {};
  const channel = supabase
    .channel("bookings-change-notifications")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "bookings" },
      (payload) => {
        const { new: newRow, old: oldRow } = payload || {};
        const normalizedPayload = {
          ...payload,
          new: newRow ? normalizeBooking(newRow) : newRow,
          old: oldRow ? normalizeBooking(oldRow) : oldRow,
        };
        onChange(normalizedPayload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToBookingInserts(onInsert) {
  return subscribeToBookingsChanges((payload) => {
    if (payload.eventType === "INSERT" && payload?.new) {
      onInsert(payload.new);
    }
  });
}
