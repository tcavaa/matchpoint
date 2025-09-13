import { LOCAL_STORAGE_MENU_ORDER_KEY } from "../config";

export function getMenuOrder() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MENU_ORDER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("getMenuOrder: failed to parse order", e);
    return [];
  }
}

export function setMenuOrder(orderIds) {
  try {
    localStorage.setItem(LOCAL_STORAGE_MENU_ORDER_KEY, JSON.stringify(orderIds));
  } catch (e) {
    console.error("setMenuOrder: failed to save order", e);
  }
}

export function applyOrder(items) {
  if (!Array.isArray(items) || items.length === 0) return items || [];
  const order = getMenuOrder();
  // Append any new ids at the end of existing order (do not remove unknowns here)
  const knownIds = new Set(order);
  const newIds = items.map((i) => i.id).filter((id) => !knownIds.has(id));
  const mergedOrder = [...order, ...newIds];
  // Persist merged order so future loads are stable
  setMenuOrder(mergedOrder);

  const idToIndex = new Map(mergedOrder.map((id, idx) => [id, idx]));
  return [...items].sort((a, b) => {
    const ia = idToIndex.has(a.id) ? idToIndex.get(a.id) : Number.MAX_SAFE_INTEGER;
    const ib = idToIndex.has(b.id) ? idToIndex.get(b.id) : Number.MAX_SAFE_INTEGER;
    return ia - ib;
  });
}

export function removeFromOrder(id) {
  const order = getMenuOrder();
  const filtered = order.filter((oid) => oid !== id);
  setMenuOrder(filtered);
}

