import { motion } from "framer-motion";
import { ArrowLeft, Bell, Globe, Database, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCurrency, setCurrency } from "@/lib/store";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function AppSettings() {
  const navigate = useNavigate();
  const [cur, setCur] = useState(getCurrency());
  const [whatsapp, setWhatsapp] = useState(true);
  const [email, setEmail] = useState(false);

  const handleCurrency = (val: string) => {
    setCur(val);
    setCurrency(val);
    toast.success(`Currency set to ${val}`);
  };

  return (
    <div className="px-4 pt-2 pb-24 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-heading font-bold">Settings</h1>
        </div>

        {/* Notifications */}
        <div className="bg-card rounded-2xl p-4 border border-border mb-4" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-secondary" />
            <h2 className="text-sm font-heading font-semibold">Alerts & Notifications</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">WhatsApp Alerts</p>
                <p className="text-[10px] text-muted-foreground">Receive transaction updates</p>
              </div>
              <Switch checked={whatsapp} onCheckedChange={setWhatsapp} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Email Alerts</p>
                <p className="text-[10px] text-muted-foreground">Monthly statements & announcements</p>
              </div>
              <Switch checked={email} onCheckedChange={setEmail} />
            </div>
          </div>
        </div>

        {/* Currency */}
        <div className="bg-card rounded-2xl p-4 border border-border mb-4" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-secondary" />
            <h2 className="text-sm font-heading font-semibold">Currency Preferences</h2>
          </div>
          <Select value={cur} onValueChange={handleCurrency}>
            <SelectTrigger className="bg-muted">
              <SelectValue />
            </SelectTrigger>
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

        {/* Backup */}
        <div className="bg-card rounded-2xl p-4 border border-border mb-4" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-4 h-4 text-secondary" />
            <h2 className="text-sm font-heading font-semibold">Backup Data</h2>
          </div>
          <button
            onClick={() => toast.success("Data synced successfully!")}
            className="w-full py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-semibold"
          >
            Sync Now
          </button>
        </div>

        {/* About */}
        <div className="bg-card rounded-2xl p-4 border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-secondary" />
            <h2 className="text-sm font-heading font-semibold">About</h2>
          </div>
          <p className="text-xs text-muted-foreground">ArkFinance v1.0 — Budget Tracking with AI Insights</p>
          <p className="text-[10px] text-muted-foreground mt-1">Your financial data is stored locally on your device.</p>
        </div>
      </motion.div>
    </div>
  );
}
