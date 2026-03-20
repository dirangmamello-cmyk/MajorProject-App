import { motion } from "framer-motion";
import { ArrowLeft, Lightbulb, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getTransactions, getBudgets, generateInsights, type Insight } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

const iconMap = {
  positive: { icon: CheckCircle2, bg: "bg-success/10", color: "text-success" },
  warning: { icon: AlertTriangle, bg: "bg-warning/10", color: "text-warning" },
  tip: { icon: Lightbulb, bg: "bg-info/10", color: "text-info" },
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } };

export default function Insights() {
  const navigate = useNavigate();
  const { data: transactions = [] } = useQuery({ queryKey: ['transactions'], queryFn: getTransactions });
  const { data: budgets = [] } = useQuery({ queryKey: ['budgets'], queryFn: getBudgets });

  const insights = useMemo(() => generateInsights(transactions, budgets), [transactions, budgets]);

  return (
    <div className="px-4 pt-2 pb-24 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center"><ArrowLeft className="w-4 h-4" /></button>
          <h1 className="text-lg font-heading font-bold">AI Insights</h1>
          <span className="ml-auto text-lg">🤖</span>
        </div>

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {insights.map((insight) => {
            const style = iconMap[insight.level];
            const Icon = style.icon;
            return (
              <motion.div key={insight.id} variants={item} className="bg-card rounded-2xl p-4 border border-border flex gap-3" style={{ boxShadow: 'var(--shadow-card)' }}>
                <div className={`w-10 h-10 rounded-full ${style.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${style.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm leading-relaxed">{insight.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1.5">{timeAgo(insight.createdAt)}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
