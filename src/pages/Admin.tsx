import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, Users, Activity, Bell, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  isCurrentUserAdmin,
  adminGetAllTransactions,
  adminGetAllNotifications,
  adminGetAllSyncLogs,
} from "@/lib/extendedStore";
import { Skeleton } from "@/components/ui/skeleton";

export default function Admin() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    isCurrentUserAdmin().then((ok) => {
      setAllowed(ok);
      setChecking(false);
    });
  }, []);

  const { data: txs = [], isLoading: lt } = useQuery({ queryKey: ["admin-tx"], queryFn: adminGetAllTransactions, enabled: allowed });
  const { data: notifs = [], isLoading: ln } = useQuery({ queryKey: ["admin-notifs"], queryFn: adminGetAllNotifications, enabled: allowed });
  const { data: syncs = [], isLoading: ls } = useQuery({ queryKey: ["admin-syncs"], queryFn: adminGetAllSyncLogs, enabled: allowed });

  if (checking) {
    return (
      <div className="px-4 pt-6 pb-24 max-w-lg mx-auto">
        <Skeleton className="h-10 w-full mb-3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="px-4 pt-6 pb-24 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-heading font-bold">Admin</h1>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 text-center">
          <Shield className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-semibold mb-1">Access denied</p>
          <p className="text-xs text-muted-foreground">You need the admin role to view this page.</p>
        </div>
      </div>
    );
  }

  const totalUsers = new Set(txs.map((t: any) => t.user_id)).size;
  const totalIncome = txs.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + Number(t.amount), 0);
  const totalExpense = txs.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + Number(t.amount), 0);

  return (
    <div className="px-4 pt-2 pb-24 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-heading font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-secondary" /> Admin Dashboard
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatCard icon={Users} label="Active Users" value={totalUsers} />
          <StatCard icon={Activity} label="Transactions" value={txs.length} />
          <StatCard icon={Bell} label="Notifications" value={notifs.length} />
          <StatCard icon={RefreshCw} label="Sync events" value={syncs.length} />
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 mb-4">
          <h2 className="text-sm font-semibold mb-2">System totals</h2>
          <div className="grid grid-cols-2 text-xs gap-2">
            <div><span className="text-muted-foreground">Income:</span> <span className="font-semibold text-success">{totalIncome.toFixed(2)}</span></div>
            <div><span className="text-muted-foreground">Expenses:</span> <span className="font-semibold text-destructive">{totalExpense.toFixed(2)}</span></div>
          </div>
        </div>

        <Section title="Recent transactions (all users)" loading={lt}>
          {txs.slice(0, 10).map((t: any) => (
            <Row key={t.id} left={`${t.category} • ${t.type}`} right={`${Number(t.amount).toFixed(2)}`} sub={t.user_id.slice(0, 8) + '…'} />
          ))}
          {!lt && txs.length === 0 && <Empty />}
        </Section>

        <Section title="Notifications log" loading={ln}>
          {notifs.slice(0, 10).map((n: any) => (
            <Row key={n.id} left={`${n.type} (${n.channel})`} right={n.status} sub={n.user_id.slice(0, 8) + '…'} />
          ))}
          {!ln && notifs.length === 0 && <Empty />}
        </Section>

        <Section title="Sync logs" loading={ls}>
          {syncs.slice(0, 10).map((s: any) => (
            <Row key={s.id} left={s.sync_status} right={`↑${s.records_sent} ↓${s.records_received}`} sub={s.user_id.slice(0, 8) + '…'} />
          ))}
          {!ls && syncs.length === 0 && <Empty />}
        </Section>
      </motion.div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-3">
      <Icon className="w-4 h-4 text-secondary mb-1" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-heading font-bold">{value}</p>
    </div>
  );
}

function Section({ title, loading, children }: { title: string; loading: boolean; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{title}</h3>
      <div className="bg-card border border-border rounded-2xl divide-y divide-border">
        {loading ? <div className="p-4"><Skeleton className="h-4 w-full" /></div> : children}
      </div>
    </div>
  );
}

function Row({ left, right, sub }: { left: string; right: string; sub?: string }) {
  return (
    <div className="px-4 py-2 flex items-center justify-between text-sm">
      <div>
        <p>{left}</p>
        {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
      </div>
      <p className="font-mono text-xs">{right}</p>
    </div>
  );
}

function Empty() {
  return <p className="px-4 py-3 text-xs text-muted-foreground text-center">No data yet.</p>;
}
