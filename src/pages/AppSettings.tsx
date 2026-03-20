import { motion } from "framer-motion";
import { ArrowLeft, Bell, Globe, Database, Shield, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getUserSettings, updateUserSettings } from "@/lib/store";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

export default function AppSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, signOut } = useAuth();
  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: getUserSettings });

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
