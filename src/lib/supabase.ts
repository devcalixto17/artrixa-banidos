import { createClient } from "@supabase/supabase-js";

const STORAGE_KEYS = {
  url: "supabase_url",
  anon: "supabase_anon_key",
  table: "supabase_bans_table",
} as const;

let cachedClient: ReturnType<typeof createClient> | null = null;
let cachedSignature = "";

export function getSupabaseConfig() {
  const browserUrl = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.url) : null;
  const browserAnon = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.anon) : null;
  const browserTable = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.table) : null;

  const url = import.meta.env.VITE_SUPABASE_URL || browserUrl || "";
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || browserAnon || "";
  const table = import.meta.env.VITE_SUPABASE_BANS_TABLE || browserTable || "banidos";

  return {
    url,
    anonKey,
    table,
    isConfigured: Boolean(url && anonKey),
  };
}

export function getSupabaseClient() {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    return null;
  }

  const signature = `${config.url}|${config.anonKey}`;
  if (!cachedClient || cachedSignature !== signature) {
    cachedClient = createClient(config.url, config.anonKey);
    cachedSignature = signature;
  }

  return cachedClient;
}

export function saveSupabaseConfig(url: string, anonKey: string, table: string) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(STORAGE_KEYS.url, url.trim());
  localStorage.setItem(STORAGE_KEYS.anon, anonKey.trim());
  localStorage.setItem(STORAGE_KEYS.table, table.trim() || "banidos");
  window.dispatchEvent(new Event("supabase-config-updated"));
}

export function clearSupabaseConfig() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(STORAGE_KEYS.url);
  localStorage.removeItem(STORAGE_KEYS.anon);
  localStorage.removeItem(STORAGE_KEYS.table);
  cachedClient = null;
  cachedSignature = "";
  window.dispatchEvent(new Event("supabase-config-updated"));
}

export type BanRecord = {
  id: number;
  player_name: string;
  steam_id: string;
  server: string;
  reason: string | null;
  banned_by: string | null;
  ban_date: string | null;
  ban_duration: string | null;
};