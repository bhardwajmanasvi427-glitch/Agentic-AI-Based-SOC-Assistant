import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || "https://configuration-required.invalid",
  supabaseAnonKey || "configuration-required",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export type ProfileRecord = {
  id: string;
  display_name: string;
  role: "SOC Analyst" | "Cybersecurity Engineer" | "Incident Response Team" | "IT Administrator";
  account_status: "active" | "suspended" | "pending";
};

export type AlertRecord = {
  id: string;
  title: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  confidence: number;
  source: string;
  status: string;
  assigned_analyst: string | null;
  created_at: string;
  updated_at: string;
  assignee?: { display_name: string } | null;
};
