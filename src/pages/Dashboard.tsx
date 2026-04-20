import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, ArrowRight, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getMonthSummary, getBudgets, getCategorySpending, getTransactions, getUserSettings, deleteTransaction } from "@/lib/store";
import { Progress } from "@/components/ui/progress";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: transactions = [] } = useQuery({ queryKey: ['transactions'], queryFn: getTransactions, refetchOnMount: 'always', refetchOnWindowFocus: true });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success("Transaction deleted");
    },
    onError: () => toast.error("Failed to delete transaction"),
  });
  const { data: budgets = [] } = useQuery({ queryKey: ['budgets'], queryFn: getBudgets, refetchOnMount: 'always' });
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getUserSettings });

  const currency = settings?.currency || 'USD';
  const currencySymbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', ZAR: 'R', NGN: '₦', KES: 'KSh ', BWP: 'P' };
  const sym = currencySymbols[currency] || currency + ' ';
  const summary = getMonthSummary(transactions);
  const spending = getCategorySpending(transactions);
  const recentTx = transactions.slice(0, 5);

  const quickActions = [
    { label: "Add Transaction", action: () => navigate("/add"), icon: "💳" },
    { label: "Reports", action: () => navigate("/reports"), icon: "📊" },
    { label: "AI Tips", action: () => navigate("/insights"), icon: "🤖" },
    { label: "Settings", action: () => navigate("/settings"), icon: "⚙️" },
  ];

  return (
    <div className="px-4 pt-2 pb-24 max-w-lg mx-auto">
      <motion.div variants={container} initial="hidden" animate="show">
        <motion.div variants={item} className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm text-muted-foreground">Good {getGreeting()}</p>
            <h1 className="text-xl font-heading font-bold">ArkFinance</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-lg">💰</div>
        </motion.div>

        <motion.div variants={item} className="rounded-2xl p-5 mb-5 text-primary-foreground" style={{ background: 'var(--gradient-primary)' }}>
          <p className="text-sm opacity-80 mb-1">Current Balance</p>
          <p className="text-3xl font-heading font-bold">{sym}{summary.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <div className="flex gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-success" /></div>
              <div>
                <p className="text-[10px] opacity-70">Income</p>
                <p className="text-sm font-semibold">{sym}{summary.income.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center"><TrendingDown className="w-4 h-4 text-destructive" /></div>
              <div>
                <p className="text-[10px] opacity-70">Expenses</p>
                <p className="text-sm font-semibold">{sym}{summary.expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-4 gap-3 mb-5">
          {quickActions.map(qa => (
            <button key={qa.label} onClick={qa.action} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card border border-border hover:border-secondary transition-colors" style={{ boxShadow: 'var(--shadow-card)' }}>
              <span className="text-xl">{qa.icon}</span>
              <span className="text-[10px] font-medium text-muted-foreground">{qa.label}</span>
            </button>
          ))}
        </motion.div>

        <motion.div variants={item} className="mb-5">
          <h2 className="text-sm font-heading font-semibold mb-3">Budget Categories</h2>
          <div className="space-y-3">
            {budgets.map(b => {
              const spent = spending[b.category] || 0;
              const pct = Math.min((spent / Number(b.limit_amount)) * 100, 100);
              return (
                <div key={b.id} className="bg-card rounded-xl p-3 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium">{b.category}</span>
                    <span className="text-muted-foreground">{sym}{spent.toFixed(2)} / {sym}{Number(b.limit_amount).toFixed(2)}</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              );
            })}
            {budgets.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No budgets set yet. Go to Settings to add some!</p>
            )}
          </div>
        </motion.div>

        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-heading font-semibold">Recent Transactions</h2>
            <button onClick={() => navigate("/reports")} className="text-xs text-secondary flex items-center gap-1">See all <ArrowRight className="w-3 h-3" /></button>
          </div>
          {recentTx.length === 0 ? (
            <div className="bg-card rounded-xl p-6 border border-border text-center text-muted-foreground text-sm">No transactions yet. Tap + to add one!</div>
          ) : (
            <div className="space-y-2">
              {recentTx.map(tx => (
                <div key={tx.id} className="flex items-center justify-between bg-card rounded-xl p-3 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 ${tx.type === 'income' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                      {tx.type === 'income' ? <TrendingUp className="w-4 h-4 text-success" /> : <TrendingDown className="w-4 h-4 text-destructive" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{tx.category}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                      {tx.type === 'income' ? '+' : '-'}{sym}{Number(tx.amount).toFixed(2)}
                    </span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="w-7 h-7 rounded-full hover:bg-destructive/10 flex items-center justify-center text-destructive transition-colors" aria-label="Delete transaction">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this transaction?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will reverse "{tx.category}" ({tx.type === 'income' ? '+' : '-'}{sym}{Number(tx.amount).toFixed(2)}). This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(tx.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
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
