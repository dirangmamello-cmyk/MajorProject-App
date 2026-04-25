// Extended store for ERD entities: accounts, categories, ai_insights, notifications, sync_logs, user_roles
import { supabase } from "@/integrations/supabase/client";
 
// ─── Types ───────────────────────────────────────────────────
export interface Account {
  id: string;
  user_id: string;
  provider: string;
  account_name: string;
  account_number: string | null;
  last_balance: number;
  created_at: string;
}
 
export interface Category {
  id: string;
  user_id: string;
  name: string;
  parent_category_id: string | null;
  is_custom: boolean;
}
 
export interface AIInsightRow {
  id: string;
  user_id: string;
  tx_id: string | null;
  insight_type: string;
  message: string;
  severity: string;
  rule_id: string | null;
  created_at: string;
}
 
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  channel: 'whatsapp' | 'email' | 'inapp' | 'sms';
  content: string;
  status: 'pending' | 'sent' | 'failed';
  sent_at: string | null;
  created_at: string;
}
 
export interface SyncLog {
  id: string;
  user_id: string;
  last_sync_at: string;
  sync_status: string;
  records_sent: number;
  records_received: number;
  created_at: string;
}
 
// ─── Accounts ────────────────────────────────────────────────
export async function getAccounts(): Promise<Account[]> {
  const { data, error } = await supabase.from('accounts').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Account[];
}
 
export async function addAccount(a: Omit<Account, 'id' | 'user_id' | 'created_at'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from('accounts').insert({ ...a, user_id: user.id });
  if (error) throw error;
}
 
export async function deleteAccount(id: string) {
  const { error } = await supabase.from('accounts').delete().eq('id', id);
  if (error) throw error;
}
 
// ─── Categories ──────────────────────────────────────────────
export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) throw error;
  return (data || []) as Category[];
}
 
export async function addCategory(c: { name: string; parent_category_id?: string | null }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from('categories').insert({
    user_id: user.id,
    name: c.name,
    parent_category_id: c.parent_category_id || null,
    is_custom: true,
  });
  if (error) throw error;
}
 
export async function deleteCategory(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}
 
// ─── AI Insights (persisted) ─────────────────────────────────
export async function getInsightHistory(): Promise<AIInsightRow[]> {
  const { data, error } = await supabase.from('ai_insights').select('*').order('created_at', { ascending: false }).limit(50);
  if (error) throw error;
  return (data || []) as AIInsightRow[];
}
 
export async function saveInsight(i: { insight_type: string; message: string; severity: string; rule_id?: string; tx_id?: string }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("[saveInsight] No user found — not authenticated");
    return;
  }
  const payload = {
    user_id: user.id,
    insight_type: i.insight_type,
    message: i.message,
    severity: i.severity,
    rule_id: i.rule_id || null,
    tx_id: i.tx_id || null,
  };
  console.log("[saveInsight] Inserting:", payload);
  const { data, error } = await supabase.from('ai_insights').insert(payload);
  if (error) {
    console.error("[saveInsight] Supabase error:", error);
  } else {
    console.log("[saveInsight] Success:", data);
  }
}
 
// ─── Notifications ───────────────────────────────────────────
export async function getNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);
  if (error) throw error;
  return (data || []) as Notification[];
}
 
export async function logNotification(n: { type: string; channel: Notification['channel']; content: string; status?: Notification['status'] }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('notifications').insert({
    user_id: user.id,
    type: n.type,
    channel: n.channel,
    content: n.content,
    status: n.status || 'pending',
  });
}
 
// ─── Sync Logs ───────────────────────────────────────────────
export async function getSyncLogs(): Promise<SyncLog[]> {
  const { data, error } = await supabase.from('sync_logs').select('*').order('created_at', { ascending: false }).limit(50);
  if (error) throw error;
  return (data || []) as SyncLog[];
}
 
export async function logSync(s: { sync_status: string; records_sent: number; records_received: number }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('sync_logs').insert({
    user_id: user.id,
    sync_status: s.sync_status,
    records_sent: s.records_sent,
    records_received: s.records_received,
  });
}
 
// ─── Roles / Admin ───────────────────────────────────────────
export async function isCurrentUserAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .maybeSingle();
  if (error) return false;
  return !!data;
}
 
// Admin-only queries (RLS will block non-admins)
export async function adminGetAllTransactions() {
  const { data, error } = await supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(200);
  if (error) throw error;
  return data || [];
}
 
export async function adminGetAllNotifications() {
  const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(200);
  if (error) throw error;
  return data || [];
}
 
export async function adminGetAllSyncLogs() {
  const { data, error } = await supabase.from('sync_logs').select('*').order('created_at', { ascending: false }).limit(200);
  if (error) throw error;
  return data || [];
}