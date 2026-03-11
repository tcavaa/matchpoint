import { supabase } from "../supabaseClient";
import { assertSupabase } from "./assertSupabase";

export async function createSessionHistoryRecord(session) {
  assertSupabase();
  const { error } = await supabase.from("session_history").insert({
    id: session.id,
    table_id: session.tableId,
    table_name: session.tableName,
    end_time: session.endTime,
    duration_played: Number(session.durationPlayed),
    amount_paid: Number(session.amountPaid),
    session_type: session.sessionType,
  });
  if (error) throw error;
}

export async function fetchSessionHistoryForAnalytics() {
  assertSupabase();
  const { data, error } = await supabase
    .from("session_history")
    .select("id, table_name, end_time, duration_played, amount_paid, session_type")
    .order("end_time", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createBarSaleRecord(sale) {
  assertSupabase();
  const { error } = await supabase.from("bar_sales").insert({
    id: sale.id,
    timestamp: sale.timestamp,
    items: sale.items,
    total_amount: Number(sale.totalAmount),
  });
  if (error) throw error;
}

