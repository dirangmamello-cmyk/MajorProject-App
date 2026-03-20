import { motion } from "framer-motion";
import { ArrowLeft, Lightbulb, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getTransactions, getBudgets, getUserSettings, type Insight } from "@/lib/store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const iconMap = {
  positive: { icon: CheckCircle2, bg: "bg-success/10", color: "text-success" },
  warning: { icon: AlertTriangle, bg: "bg-warning/10", color: "text-warning" },
  tip: { icon: Lightbulb, bg: "bg-info/10", color: "text-info" },
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } };

async function fetchAIInsights(transactions: any[], budgets: any[], currency: string): Promise<Insight[]> {
  const { data, error } = await supabase.functions.invoke("ai-insights", {
    body: { transactions, budgets, currency },
  });

  if (error) throw error;

  if (data?.insights) {
    return data.insights.map((i: any) => ({
      id: crypto.randomUUID(),
      message: i.message,
      level: i.level || "tip",
      createdAt: new Date().toISOString(),
    }));
  }

  return [{ id: crypto.randomUUID(), message: "💡 No insights available right now.", level: "tip" as const, createdAt: new Date().toISOString() }];
}

export default function Insights() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: transactions = [] } = useQuery({ queryKey: ["transactions"], queryFn: getTransactions });
  const { data: budgets = [] } = useQuery({ queryKey: ["budgets"], queryFn: getBudgets });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: getUserSettings });

  const currency = settings?.currency || "USD";

  const { data: insights = [], isLoading, isFetching } = useQuery({
    queryKey: ["ai-insights", transactions.length, budgets.length],
    queryFn: () => fetchAIInsights(transactions, budgets, currency),
    enabled: transactions.length > 0 || budgets.length > 0,
    staleTime: 5 * 60 * 1000, // cache for 5 min
    retry: 1,
    meta: {
      onError: (err: any) => toast.error("Failed to load AI insights"),
    },
  });

  const noData = transactions.length === 0 && budgets.length === 0;

  return (
    <div className="px-4 pt-2 pb-24 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-heading font-bold">AI Insights</h1>
          <div className="ml-auto flex items-center gap-2">
            {!noData && (
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ["ai-insights"] })}
                disabled={isFetching}
                className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
              </button>
            )}
            <span className="text-lg">🤖</span>
          </div>
        </div>

        {noData ? (
          <div className="bg-card rounded-2xl p-6 border border-border text-center">
            <p className="text-3xl mb-3">📊</p>
            <p className="text-sm text-muted-foreground">Add some transactions to get personalized AI insights!</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl p-4 border border-border flex gap-3">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground text-center mt-2">AI is analyzing your finances...</p>
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
            {insights.map((insight) => {
              const style = iconMap[insight.level] || iconMap.tip;
              const Icon = style.icon;
              return (
                <motion.div key={insight.id} variants={item} className="bg-card rounded-2xl p-4 border border-border flex gap-3" style={{ boxShadow: "var(--shadow-card)" }}>
                  <div className={`w-10 h-10 rounded-full ${style.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${style.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed">{insight.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1.5">Just now</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
