import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCategorySpending, getMonthlyTrends, getTransactions, getUserSettings } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const COLORS = ['#2a9d8f', '#e9c46a', '#e76f51', '#264653', '#f4a261', '#606c38', '#bc6c25'];

export default function Reports() {
  const navigate = useNavigate();
  const { data: transactions = [] } = useQuery({ queryKey: ['transactions'], queryFn: getTransactions });
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getUserSettings });

  const currency = settings?.currency || 'USD';
  const sym = currency === 'USD' ? '$' : currency + ' ';

  const categoryData = Object.entries(getCategorySpending(transactions)).map(([name, value]) => ({ name, value }));
  const trendData = getMonthlyTrends(transactions);

  const exportCSV = () => {
    const header = "Date,Type,Category,Amount,Notes\n";
    const rows = transactions.map(t => `${t.date},${t.type},${t.category},${t.amount},"${t.notes || ''}"`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "arkfinance_report.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-4 pt-2 pb-24 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center"><ArrowLeft className="w-4 h-4" /></button>
          <h1 className="text-lg font-heading font-bold">Reports</h1>
        </div>

        <div className="bg-card rounded-2xl p-4 border border-border mb-5" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h2 className="text-sm font-heading font-semibold mb-3">Spending Categories</h2>
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(val: number) => `${sym}${val.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-3">
                {categoryData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-[10px]">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-sm text-muted-foreground text-center py-8">No expense data yet</p>}
        </div>

        <div className="bg-card rounded-2xl p-4 border border-border mb-5" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h2 className="text-sm font-heading font-semibold mb-3">Monthly Trends</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" fontSize={10} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis fontSize={10} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip formatter={(val: number) => `${sym}${val.toFixed(2)}`} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="income" fill="#2a9d8f" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#e76f51" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex gap-3">
          <button onClick={exportCSV} className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold">Export CSV</button>
        </div>

        <div className="mt-5">
          <h2 className="text-sm font-heading font-semibold mb-3">All Transactions</h2>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between bg-card rounded-xl p-3 border border-border">
                  <div>
                    <p className="text-sm font-medium">{tx.category}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(tx.date).toLocaleDateString()}{tx.notes ? ` · ${tx.notes}` : ''}</p>
                  </div>
                  <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                    {tx.type === 'income' ? '+' : '-'}{sym}{Number(tx.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
