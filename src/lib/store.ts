import { supabase } from "@/integrations/supabase/client";
import { enqueue } from "@/lib/syncQueue";

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  category: string;
  date: string;
  notes: string;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  limit_amount: number;
  start_date: string;
  end_date: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
}

export interface Insight {
  id: string;
  message: string;
  level: 'positive' | 'warning' | 'tip';
  createdAt: string;
}

// Categories
export const EXPENSE_CATEGORIES = ['Food & Dining', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Education', 'Other'];
export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];

// Transactions
export async function getTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return (data || []) as Transaction[];
}

export async function addTransaction(t: { amount: number; type: string; category: string; date: string; notes: string }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const payload = {
    id: crypto.randomUUID(),
    user_id: user.id,
    amount: t.amount,
    type: t.type,
    category: t.category,
    date: t.date,
    notes: t.notes,
  };

  if (!navigator.onLine) {
    enqueue({ table: 'transactions', operation: 'insert', payload });
    return payload;
  }

  const { data, error } = await supabase.from('transactions').insert(payload).select().single();
  if (error) {
    // Queue for later if network fails
    enqueue({ table: 'transactions', operation: 'insert', payload });
    return payload;
  }
  return data;
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}

// Budgets
export async function getBudgets(): Promise<Budget[]> {
  const { data, error } = await supabase.from('budgets').select('*');
  if (error) throw error;
  return (data || []) as Budget[];
}

export async function upsertBudget(b: { category: string; limit_amount: number; start_date: string; end_date: string; id?: string }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (b.id) {
    const { error } = await supabase.from('budgets').update({
      category: b.category,
      limit_amount: b.limit_amount,
      start_date: b.start_date,
      end_date: b.end_date,
    }).eq('id', b.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('budgets').insert({
      user_id: user.id,
      category: b.category,
      limit_amount: b.limit_amount,
      start_date: b.start_date,
      end_date: b.end_date,
    });
    if (error) throw error;
  }
}

// Goals
export async function getGoals(): Promise<Goal[]> {
  const { data, error } = await supabase.from('goals').select('*');
  if (error) throw error;
  return (data || []) as Goal[];
}

export async function addGoal(g: { name: string; target_amount: number; current_amount: number; target_date: string }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from('goals').insert({ user_id: user.id, ...g });
  if (error) throw error;
}

export async function updateGoal(g: { id: string; current_amount: number }) {
  const { error } = await supabase.from('goals').update({ current_amount: g.current_amount }).eq('id', g.id);
  if (error) throw error;
}

// Settings
export async function getUserSettings() {
  const { data, error } = await supabase.from('user_settings').select('*').maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateUserSettings(settings: { currency?: string; whatsapp_alerts?: boolean; email_alerts?: boolean }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from('user_settings').update(settings).eq('user_id', user.id);
  if (error) throw error;
}

// AI Insights (computed client-side from transaction data)
export function generateInsights(transactions: Transaction[], budgets: Budget[]): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();

  const thisMonthExpenses = transactions.filter(
    t => t.type === 'expense' && new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear()
  );
  const thisMonthIncome = transactions.filter(
    t => t.type === 'income' && new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear()
  );

  for (const budget of budgets) {
    const spent = thisMonthExpenses.filter(t => t.category === budget.category).reduce((s, t) => s + Number(t.amount), 0);
    const pct = (spent / Number(budget.limit_amount)) * 100;
    if (pct >= 90) {
      insights.push({ id: crypto.randomUUID(), message: `⚠️ You've used ${pct.toFixed(0)}% of your ${budget.category} budget ($${spent.toFixed(2)}/$${budget.limit_amount})`, level: 'warning', createdAt: now.toISOString() });
    } else if (pct >= 70) {
      insights.push({ id: crypto.randomUUID(), message: `📊 ${budget.category} spending is at ${pct.toFixed(0)}%. Consider slowing down.`, level: 'tip', createdAt: now.toISOString() });
    }
  }

  const totalExpenses = thisMonthExpenses.reduce((s, t) => s + Number(t.amount), 0);
  const totalIncome = thisMonthIncome.reduce((s, t) => s + Number(t.amount), 0);

  if (totalIncome > 0 && totalExpenses / totalIncome > 0.8) {
    insights.push({ id: crypto.randomUUID(), message: `🔴 You've spent ${((totalExpenses / totalIncome) * 100).toFixed(0)}% of your income this month. Try to save more!`, level: 'warning', createdAt: now.toISOString() });
  } else if (totalIncome > 0 && totalExpenses / totalIncome < 0.5) {
    insights.push({ id: crypto.randomUUID(), message: `🎉 Great saving! You've only used ${((totalExpenses / totalIncome) * 100).toFixed(0)}% of your income.`, level: 'positive', createdAt: now.toISOString() });
  }

  if (insights.length === 0) {
    insights.push({ id: crypto.randomUUID(), message: '💡 Start tracking your expenses to get personalized AI insights!', level: 'tip', createdAt: now.toISOString() });
  }

  return insights;
}

// Summary helpers
export function getMonthSummary(transactions: Transaction[]) {
  const now = new Date();
  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const income = thisMonth.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expenses = thisMonth.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  return { income, expenses, balance: income - expenses };
}

export function getCategorySpending(transactions: Transaction[]): Record<string, number> {
  const now = new Date();
  const result: Record<string, number> = {};
  transactions
    .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear())
    .forEach(t => { result[t.category] = (result[t.category] || 0) + Number(t.amount); });
  return result;
}

export function getMonthlyTrends(transactions: Transaction[]): { month: string; income: number; expenses: number }[] {
  const months: Record<string, { income: number; expenses: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    months[key] = { income: 0, expenses: 0 };
  }
  transactions.forEach(t => {
    const d = new Date(t.date);
    const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    if (months[key]) {
      if (t.type === 'income') months[key].income += Number(t.amount);
      else months[key].expenses += Number(t.amount);
    }
  });
  return Object.entries(months).map(([month, data]) => ({ month, ...data }));
}
