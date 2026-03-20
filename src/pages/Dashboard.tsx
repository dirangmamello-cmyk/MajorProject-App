import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getMonthSummary, getBudgets, getCategorySpending, getTransactions, getCurrency } from "@/lib/store";
import { Progress } from "@/components/ui/progress";
import { useMemo, useState, useEffect } from "react";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function Dashboard() {
  const navigate = useNavigate();
  const [, setTick] = useState(0);
  useEffect(() => { setTick(t => t + 1); }, []);

  const currency = getCurrency();
  const sym = currency === 'USD' ? '$' : currency;
  const summary = useMemo(() => getMonthSummary(), []);
  const budgets = useMemo(() => getBudgets(), []);
  const spending = useMemo(() => getCategorySpending(), []);
  const recentTx = useMemo(() => getTransactions().slice(0, 5), []);

  const quickActions = [
    { label: "Add Transaction", action: () => navigate("/add"), icon: "💳" },
    { label: "Reports", action: () => navigate("/reports"), icon: "📊" },
    { label: "AI Tips", action: () => navigate("/insights"), icon: "🤖" },
    { label: "Settings", action: () => navigate("/settings"), icon: "⚙️" },
  ];

  return (
    <div className="px-4 pt-2 pb-24 max-w-lg mx-auto">
      <motion.div variants={container} initial="hidden" animate="show">
        {/* Header */}
        <motion.div variants={item} className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm text-muted-foreground">Good {getGreeting()}</p>
            <h1 className="text-xl font-heading font-bold">ArkFinance</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-lg">💰</div>
        </motion.div>

        {/* Balance Card */}
        <motion.div
          variants={item}
          className="rounded-2xl p-5 mb-5 text-primary-foreground"
          style={{ background: 'var(--gradient-primary)' }}
        >
          <p className="text-sm opacity-80 mb-1">Current Balance</p>
          <p className="text-3xl font-heading font-bold">{sym}{summary.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <div className="flex gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-[10px] opacity-70">Income</p>
                <p className="text-sm font-semibold">{sym}{summary.income.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-destructive" />
              </div>
              <div>
                <p className="text-[10px] opacity-70">Expenses</p>
                <p className="text-sm font-semibold">{sym}{summary.expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={item} className="grid grid-cols-4 gap-3 mb-5">
          {quickActions.map(qa => (
            <button key={qa.label} onClick={qa.action} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card border border-border hover:border-secondary transition-colors" style={{ boxShadow: 'var(--shadow-card)' }}>
              <span className="text-xl">{qa.icon}</span>
              <span className="text-[10px] font-medium text-muted-foreground">{qa.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Budget Categories */}
        <motion.div variants={item} className="mb-5">
          <h2 className="text-sm font-heading font-semibold mb-3">Budget Categories</h2>
          <div className="space-y-3">
            {budgets.map(b => {
              const spent = spending[b.category] || 0;
              const pct = Math.min((spent / b.limit) * 100, 100);
              return (
                <div key={b.id} className="bg-card rounded-xl p-3 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium">{b.category}</span>
                    <span className="text-muted-foreground">{sym}{spent.toFixed(2)} / {sym}{b.limit.toFixed(2)}</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-heading font-semibold">Recent Transactions</h2>
            <button onClick={() => navigate("/reports")} className="text-xs text-secondary flex items-center gap-1">
              See all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {recentTx.length === 0 ? (
            <div className="bg-card rounded-xl p-6 border border-border text-center text-muted-foreground text-sm">
              No transactions yet. Tap + to add one!
            </div>
          ) : (
            <div className="space-y-2">
              {recentTx.map(tx => (
                <div key={tx.id} className="flex items-center justify-between bg-card rounded-xl p-3 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm ${tx.type === 'income' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                      {tx.type === 'income' ? <TrendingUp className="w-4 h-4 text-success" /> : <TrendingDown className="w-4 h-4 text-destructive" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tx.category}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                    {tx.type === 'income' ? '+' : '-'}{sym}{tx.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning 🌅";
  if (h < 17) return "afternoon ☀️";
  return "evening 🌙";
}
