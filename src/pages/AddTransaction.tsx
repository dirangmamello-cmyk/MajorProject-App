import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { addTransaction, EXPENSE_CATEGORIES, INCOME_CATEGORIES, type TransactionType } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function AddTransaction() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const isOther = category === "Other";

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    if (!category) { toast.error("Select a category"); return; }
    let finalCategory = category;
    if (category === "Other") {
      const trimmed = customCategory.trim();
      if (!trimmed) { toast.error("Please type your custom category"); return; }
      if (trimmed.length > 50) { toast.error("Category must be 50 characters or less"); return; }
      finalCategory = trimmed;
    }
    setLoading(true);
    try {
      await addTransaction({ amount: amt, type, category: finalCategory, date, notes });
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success("Transaction added!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to add transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 pt-2 pb-24 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center"><ArrowLeft className="w-4 h-4" /></button>
          <h1 className="text-lg font-heading font-bold">Add Transaction</h1>
        </div>

        <div className="flex bg-muted rounded-xl p-1 mb-6">
          {(["expense", "income"] as TransactionType[]).map(t => (
            <button key={t} onClick={() => { setType(t); setCategory(""); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${type === t ? t === "expense" ? "bg-destructive text-destructive-foreground" : "bg-success text-success-foreground" : "text-muted-foreground"}`}>
              {t === "expense" ? "Expense" : "Income"}
            </button>
          ))}
        </div>

        <div className="mb-5">
          <label className="text-sm text-muted-foreground mb-1.5 block">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">$</span>
            <Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="pl-8 text-2xl font-heading font-bold h-14 bg-card" />
          </div>
        </div>

        <div className="mb-5">
          <label className="text-sm text-muted-foreground mb-2 block">Category</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <button key={c} onClick={() => { setCategory(c); if (c !== "Other") setCustomCategory(""); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${category === c ? "bg-secondary text-secondary-foreground border-secondary" : "bg-card border-border text-muted-foreground hover:border-secondary"}`}>
                {c}
              </button>
            ))}
          </div>
          {isOther && (
            <Input
              autoFocus
              placeholder="Type your custom category"
              value={customCategory}
              onChange={e => setCustomCategory(e.target.value)}
              maxLength={50}
              className="bg-card mt-3"
            />
          )}
        </div>

        <div className="mb-5">
          <label className="text-sm text-muted-foreground mb-1.5 block">Date</label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-card" />
        </div>

        <div className="mb-6">
          <label className="text-sm text-muted-foreground mb-1.5 block">Notes (optional)</label>
          <Textarea placeholder="Add a brief description..." value={notes} onChange={e => setNotes(e.target.value)} className="bg-card resize-none" rows={3} />
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full h-12 text-base font-semibold bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-xl">
          <Check className="w-5 h-5 mr-2" /> {loading ? "Saving..." : "Save Transaction"}
        </Button>
      </motion.div>
    </div>
  );
}
