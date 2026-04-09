import { motion } from "framer-motion";
import { ArrowLeft, Bell, Globe, Shield, LogOut, RefreshCw, Wifi, WifiOff, Cloud, CloudOff, Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getUserSettings, updateUserSettings } from "@/lib/store";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getQueue, type SyncStatus } from "@/lib/syncQueue";
import { useState } from "react";

function SyncStatusIcon({ status }: { status: SyncStatus }) {
  switch (status) {
    case 'pending': return <Clock className="w-3.5 h-3.5 text-amber-500" />;
    case 'syncing': return <Loader2 className="w-3.5 h-3.5 text-secondary animate-spin" />;
    case 'synced': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    case 'failed': return <AlertCircle className="w-3.5 h-3.5 text-destructive" />;
  }
}

function SyncStatusLabel({ status }: { status: SyncStatus }) {
  const labels: Record<SyncStatus, string> = { pending: 'Pending', syncing: 'Syncing…', synced: 'Synced', failed: 'Failed' };
  const colors: Record<SyncStatus, string> = {
    pending: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
    syncing: 'bg-secondary/15 text-secondary border-secondary/30',
    synced: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
    failed: 'bg-destructive/15 text-destructive border-destructive/30',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${colors[status]}`}>
      <SyncStatusIcon status={status} />
      {labels[status]}
    </span>
  );
}

export default function AppSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, signOut } = useAuth();
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getUserSettings });
  const { isOnline, isSyncing, summary, triggerSync, wifiOnly, toggleWifiOnly } = useOfflineSync();
  const [showQueue, setShowQueue] = useState(false);

  const handleCurrency = async (val: string) => {
    try {
      await updateUserSettings({ currency: val });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success(`Currency set to ${val}`);
    } catch { toast.error("Failed to update currency"); }
  };

  const handleWhatsapp = async (val: boolean) => {
    try {
      await updateUserSettings({ whatsapp_alerts: val });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    } catch { toast.error("Failed to update setting"); }
  };

  const handleEmail = async (val: boolean) => {
    try {
      await updateUserSettings({ email_alerts: val });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    } catch { toast.error("Failed to update setting"); }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleSyncNow = async () => {
    if (!isOnline) {
      toast.error("You're offline. Connect to the internet to sync.");
      return;
    }
    toast.info("Syncing...");
    const result = await triggerSync();
    if (result.synced > 0) toast.success(`${result.synced} item(s) synced successfully!`);
    if (result.failed > 0) toast.error(`${result.failed} item(s) failed to sync.`);
    if (result.synced === 0 && result.failed === 0) toast.info("Nothing to sync.");
  };

  const queue = getQueue().filter(q => q.status !== 'synced');

  return (
    <div className="px-4 pt-2 pb-24 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center"><ArrowLeft className="w-4 h-4" /></button>
          <h1 className="text-lg font-heading font-bold">Settings</h1>
        </div>

        {/* User info */}
        <div className="bg-card rounded-2xl p-4 border border-border mb-4" style={{ boxShadow: 'var(--shadow-card)' }}>
          <p className="text-sm font-medium">{user?.email}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Signed in</p>
        </div>

        {/* ─── Offline Sync Section ─── */}
        <div className="bg-card rounded-2xl p-4 border border-border mb-4" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-2 mb-4">
            {isOnline ? <Cloud className="w-4 h-4 text-secondary" /> : <CloudOff className="w-4 h-4 text-destructive" />}
            <h2 className="text-sm font-heading font-semibold">Data Sync</h2>
            <Badge variant={isOnline ? "secondary" : "destructive"} className="ml-auto text-[10px]">
              {isOnline ? <><Wifi className="w-3 h-3 mr-1" />Online</> : <><WifiOff className="w-3 h-3 mr-1" />Offline</>}
            </Badge>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { label: 'Pending', count: summary.pending, color: 'text-amber-500' },
              { label: 'Syncing', count: summary.syncing, color: 'text-secondary' },
              { label: 'Failed', count: summary.failed, color: 'text-destructive' },
              { label: 'Total', count: summary.total, color: 'text-foreground' },
            ].map(s => (
              <div key={s.label} className="bg-muted rounded-xl p-2 text-center">
                <p className={`text-base font-bold ${s.color}`}>{s.count}</p>
                <p className="text-[9px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Sync Now button */}
          <Button onClick={handleSyncNow} disabled={isSyncing || !isOnline} className="w-full mb-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground">
            {isSyncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            {isSyncing ? "Syncing..." : "Sync Now"}
          </Button>

          {/* Wi-Fi only toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Sync on Wi-Fi only</p>
              <p className="text-[10px] text-muted-foreground">Save mobile data by syncing only on Wi-Fi</p>
            </div>
            <Switch checked={wifiOnly} onCheckedChange={toggleWifiOnly} />
          </div>

          {/* Queue details toggle */}
          {queue.length > 0 && (
            <button onClick={() => setShowQueue(!showQueue)} className="text-xs text-secondary font-medium mt-2 underline">
              {showQueue ? "Hide" : "Show"} pending items ({queue.length})
            </button>
          )}

          {showQueue && queue.length > 0 && (
            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
              {queue.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-muted rounded-lg p-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate capitalize">{item.operation} → {item.table}</p>
                    {item.lastError && <p className="text-[10px] text-destructive truncate">{item.lastError}</p>}
                  </div>
                  <SyncStatusLabel status={item.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alerts & Notifications */}
        <div className="bg-card rounded-2xl p-4 border border-border mb-4" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-2 mb-4"><Bell className="w-4 h-4 text-secondary" /><h2 className="text-sm font-heading font-semibold">Alerts & Notifications</h2></div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">WhatsApp Alerts</p><p className="text-[10px] text-muted-foreground">Receive transaction updates</p></div>
              <Switch checked={settings?.whatsapp_alerts ?? true} onCheckedChange={handleWhatsapp} />
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Email Alerts</p><p className="text-[10px] text-muted-foreground">Monthly statements & announcements</p></div>
              <Switch checked={settings?.email_alerts ?? false} onCheckedChange={handleEmail} />
            </div>
          </div>
        </div>

        {/* Currency */}
        <div className="bg-card rounded-2xl p-4 border border-border mb-4" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-2 mb-4"><Globe className="w-4 h-4 text-secondary" /><h2 className="text-sm font-heading font-semibold">Currency Preferences</h2></div>
          <Select value={settings?.currency || 'USD'} onValueChange={handleCurrency}>
            <SelectTrigger className="bg-muted"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD - US Dollar</SelectItem>
              <SelectItem value="EUR">EUR - Euro</SelectItem>
              <SelectItem value="GBP">GBP - British Pound</SelectItem>
              <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
              <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
              <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* About */}
        <div className="bg-card rounded-2xl p-4 border border-border mb-4" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-2 mb-2"><Shield className="w-4 h-4 text-secondary" /><h2 className="text-sm font-heading font-semibold">About</h2></div>
          <p className="text-xs text-muted-foreground">ArkFinance v1.0 — Budget Tracking with AI Insights</p>
        </div>

        <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </motion.div>
    </div>
  );
}
