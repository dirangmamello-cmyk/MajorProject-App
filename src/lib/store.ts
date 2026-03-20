// ArkFinance data store using localStorage

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  notes: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  startDate: string;
  endDate: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
}

export interface Insight {
  id: string;
  message: string;
  level: 'positive' | 'warning' | 'tip';
  createdAt: string;
}

const STORAGE_KEYS = {
  transactions: 'ark_transactions',
  budgets: 'ark_budgets',
  goals: 'ark_goals',
  insights: 'ark_insights',
  currency: 'ark_currency',
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Transactions
export function getTransactions(): Transaction[] {
  return load<Transaction[]>(STORAGE_KEYS.transactions, []);
}

export function addTransaction(t: Omit<Transaction, 'id' | 'createdAt'>): Transaction {
  const transactions = getTransactions();
  const newT: Transaction = { ...t, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  transactions.unshift(newT);
  save(STORAGE_KEYS.transactions, transactions);
  generateInsights();
  return newT;
}

export function deleteTransaction(id: string) {
  const transactions = getTransactions().filter(t => t.id !== id);
  save(STORAGE_KEYS.transactions, transactions);
}

// Budgets
export function getBudgets(): Budget[] {
  return load<Budget[]>(STORAGE_KEYS.budgets, defaultBudgets());
}

export function setBudget(b: Budget) {
  const budgets = getBudgets();
  const idx = budgets.findIndex(x => x.id === b.id);
  if (idx >= 0) budgets[idx] = b;
  else budgets.push(b);
  save(STORAGE_KEYS.budgets, budgets);
}

function defaultBudgets(): Budget[] {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
  return [
    { id: '1', category: 'Food & Dining', limit: 500, startDate: start, endDate: end },
    { id: '2', category: 'Transport', limit: 250, startDate: start, endDate: end },
    { id: '3', category: 'Utilities', limit: 150, startDate: start, endDate: end },
    { id: '4', category: 'Entertainment', limit: 200, startDate: start, endDate: end },
    { id: '5', category: 'Shopping', limit: 300, startDate: start, endDate: end },
  ];
}

// Goals
export function getGoals(): Goal[] {
  return load<Goal[]>(STORAGE_KEYS.goals, []);
}

export function addGoal(g: Omit<Goal, 'id'>): Goal {
  const goals = getGoals();
  const newG: Goal = { ...g, id: crypto.randomUUID() };
  goals.push(newG);
  save(STORAGE_KEYS.goals, goals);
  return newG;
}

export function updateGoal(g: Goal) {
  const goals = getGoals();
  const idx = goals.findIndex(x => x.id === g.id);
  if (idx >= 0) { goals[idx] = g; save(STORAGE_KEYS.goals, goals); }
}

// Insights
export function getInsights(): Insight[] {
  return load<Insight[]>(STORAGE_KEYS.insights, []);
}

function generateInsights() {
  const transactions = getTransactions();
  const budgets = getBudgets();
  const insights: Insight[] = [];
  const now = new Date();

  // Check budget usage
  const thisMonthExpenses = transactions.filter(
    t => t.type === 'expense' && new Date(t.date).getMonth() === now.getMonth()
  );

  for (const budget of budgets) {
    const spent = thisMonthExpenses.filter(t => t.category === budget.category).reduce((s, t) => s + t.amount, 0);
    const pct = (spent / budget.limit) * 100;
    if (pct >= 90) {
      insights.push({ id: crypto.randomUUID(), message: `⚠️ You've used ${pct.toFixed(0)}% of your ${budget.category} budget ($${spent.toFixed(2)}/$${budget.limit})`, level: 'warning', createdAt: now.toISOString() });
    } else if (pct >= 70) {
      insights.push({ id: crypto.randomUUID(), message: `📊 ${budget.category} spending is at ${pct.toFixed(0)}%. Consider slowing down.`, level: 'tip', createdAt: now.toISOString() });
    }
  }

  // Total spending insight
  const totalExpenses = thisMonthExpenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome = transactions.filter(t => t.type === 'income' && new Date(t.date).getMonth() === now.getMonth()).reduce((s, t) => s + t.amount, 0);
  
  if (totalIncome > 0 && totalExpenses / totalIncome > 0.8) {
    insights.push({ id: crypto.randomUUID(), message: `🔴 You've spent ${((totalExpenses / totalIncome) * 100).toFixed(0)}% of your income this month. Try to save more!`, level: 'warning', createdAt: now.toISOString() });
  } else if (totalIncome > 0 && totalExpenses / totalIncome < 0.5) {
    insights.push({ id: crypto.randomUUID(), message: `🎉 Great saving! You've only used ${((totalExpenses / totalIncome) * 100).toFixed(0)}% of your income.`, level: 'positive', createdAt: now.toISOString() });
  }

  if (insights.length === 0) {
    insights.push({ id: crypto.randomUUID(), message: '💡 Start tracking your expenses to get personalized AI insights!', level: 'tip', createdAt: now.toISOString() });
  }

  save(STORAGE_KEYS.insights, insights);
}

// Currency
export function getCurrency(): string {
  return localStorage.getItem(STORAGE_KEYS.currency) || 'USD';
}

export function setCurrency(c: string) {
  localStorage.setItem(STORAGE_KEYS.currency, c);
}

// Categories
export const EXPENSE_CATEGORIES = ['Food & Dining', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Education', 'Other'];
export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];

// Summary helpers
export function getMonthSummary() {
  const transactions = getTransactions();
  const now = new Date();
  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const income = thisMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = thisMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  return { income, expenses, balance: income - expenses };
}

export function getCategorySpending(): Record<string, number> {
  const transactions = getTransactions();
  const now = new Date();
  const result: Record<string, number> = {};
  transactions
    .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === now.getMonth())
    .forEach(t => { result[t.category] = (result[t.category] || 0) + t.amount; });
  return result;
}

export function getMonthlyTrends(): { month: string; income: number; expenses: number }[] {
  const transactions = getTransactions();
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
      if (t.type === 'income') months[key].income += t.amount;
      else months[key].expenses += t.amount;
    }
  });

  return Object.entries(months).map(([month, data]) => ({ month, ...data }));
}
