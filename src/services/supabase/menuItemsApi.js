import { supabase } from "../supabaseClient";
import { assertSupabase } from "./assertSupabase";

export async function fetchMenuItems() {
  assertSupabase();
  const { data, error } = await supabase
    .from("menu_items")
    .select("id, name, price, image, created_at")
    .order("id", { ascending: true });

  if (error) throw error;
  return (data || []).map((item) => ({
    ...item,
    price: Number(item.price),
  }));
}

export async function createMenuItem(item) {
  assertSupabase();
  const { data, error } = await supabase
    .from("menu_items")
    .insert({
      name: item.name,
      price: Number(item.price),
      image: item.image,
    })
    .select("id, name, price, image")
    .single();

  if (error) throw error;
  return { ...data, price: Number(data.price) };
}

export async function updateMenuItem(id, item) {
  assertSupabase();
  const { data, error } = await supabase
    .from("menu_items")
    .update({
      name: item.name,
      price: Number(item.price),
      image: item.image,
    })
    .eq("id", id)
    .select("id, name, price, image")
    .single();

  if (error) throw error;
  return { ...data, price: Number(data.price) };
}

export async function deleteMenuItem(id) {
  assertSupabase();
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) throw error;
}

