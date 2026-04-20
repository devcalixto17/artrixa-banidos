import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");

export const BANS_TABLE = import.meta.env.VITE_SUPABASE_BANS_TABLE || "banidos";

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