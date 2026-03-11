import { supabase, isSupabaseConfigured } from "../supabaseClient";
import { assertSupabase } from "./assertSupabase";

function emitBookingsChanged() {
  if (typeof window !== "undefined" && typeof CustomEvent === "function") {
    window.dispatchEvent(new CustomEvent("bookings:changed"));
  }
}

function normalizeBooking(row) {
  return {
    ...row,
    is_done: Boolean(row?.is_done),
    done_at: row?.done_at ?? null,
  };
}

export async function fetchBookings() {
  assertSupabase();
  const baseQuery = supabase
    .from("bookings")
    .select("id, customer_name, tables_count, hours_count, is_done, done_at, created_at")
    .order("created_at", { ascending: false });

  // Main path: active bookings where done is false (or null for older rows)
  const { data, error } = await baseQuery.or("is_done.is.false,is_done.is.null");
  if (!error) return (data || []).map(normalizeBooking);

  // Fallback for legacy schema/data edge cases
  const fallback = await supabase
    .from("bookings")
    .select("id, customer_name, tables_count, hours_count, created_at")
    .order("created_at", { ascending: false });

  if (fallback.error) throw fallback.error;
  return (fallback.data || []).map(normalizeBooking);
}

export async function createBooking({ customerName, tablesCount, hoursCount }) {
  assertSupabase();
  const payload = {
    customer_name: customerName,
    tables_count: Number(tablesCount),
    hours_count: Number(hoursCount),
  };

  const primary = await supabase
    .from("bookings")
    .insert(payload)
    .select("id, customer_name, tables_count, hours_count, is_done, done_at, created_at")
    .single();

  if (!primary.error) {
    emitBookingsChanged();
    return normalizeBooking(primary.data);
  }

  // Fallback for old schema without is_done/done_at
  const fallback = await supabase
    .from("bookings")
    .insert(payload)
    .select("id, customer_name, tables_count, hours_count, created_at")
    .single();

  if (fallback.error) throw fallback.error;
  emitBookingsChanged();
  return normalizeBooking(fallback.data);
}

export async function markBookingAsDone(id) {
  assertSupabase();
  const primary = await supabase
    .from("bookings")
    .update({ is_done: true, done_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, customer_name, tables_count, hours_count, is_done, done_at, created_at")
    .single();

  if (!primary.error) {
    emitBookingsChanged();
    return normalizeBooking(primary.data);
  }

  // Fallback for old schema: treat "done" as remove from active list
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

  // Fallback for old schema
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
        onChange(payload);
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

