import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Trash2, Wallet } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAccounts, addAccount, deleteAccount } from "@/lib/extendedStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Accounts() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: accounts = [], isLoading } = useQuery({ queryKey: ["accounts"], queryFn: getAccounts });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ provider: "", account_name: "", account_number: "", last_balance: "0" });

  const onSave = async () => {
    if (!form.provider || !form.account_name) {
      toast.error("Provider and account name are required");
      return;
    }
    try {
      await addAccount({
        provider: form.provider,
        account_name: form.account_name,
        account_number: form.account_number || null,
        last_balance: Number(form.last_balance) || 0,
      });
      toast.success("Account added");
      setForm({ provider: "", account_name: "", account_number: "", last_balance: "0" });
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["accounts"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to add");
    }
  };

  const onDelete = async (id: string) => {
    await deleteAccount(id);
    toast.success("Account removed");
    qc.invalidateQueries({ queryKey: ["accounts"] });
  };

  return (
    <div className="px-4 pt-2 pb-24 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-heading font-bold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-secondary" /> My Accounts
          </h1>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="ml-auto w-9 h-9 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {showForm && (
          <div className="bg-card border border-border rounded-2xl p-4 mb-4 space-y-3">
            <Input placeholder="Provider (e.g. ABSA, M-Pesa)" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} />
            <Input placeholder="Account name" value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} />
            <Input placeholder="Account number (optional)" value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} />
            <Input type="number" placeholder="Starting balance" value={form.last_balance} onChange={(e) => setForm({ ...form, last_balance: e.target.value })} />
            <Button onClick={onSave} className="w-full">Save account</Button>
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : accounts.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <Wallet className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm">No accounts yet. Add your first one.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {accounts.map((a) => (
              <div key={a.id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{a.account_name}</p>
                  <p className="text-xs text-muted-foreground">{a.provider}{a.account_number ? ` • ${a.account_number}` : ""}</p>
                  <p className="text-sm font-mono mt-1">{Number(a.last_balance).toFixed(2)}</p>
                </div>
                <button onClick={() => onDelete(a.id)} className="w-9 h-9 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
