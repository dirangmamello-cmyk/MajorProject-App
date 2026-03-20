import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { addTransaction, EXPENSE_CATEGORIES, INCOME_CATEGORIES, type TransactionType } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function AddTransaction() {
  const navigate = useNavigate();
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleSubmit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    if (!category) { toast.error("Select a category"); return; }
    addTransaction({ amount: amt, type, category, date, notes });
    toast.success("Transaction added!");
    navigate("/");
  };

  return (
    <div className="px-4 pt-2 pb-24 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-heading font-bold">Add Transaction</h1>
        </div>

        {/* Type Toggle */}
        <div className="flex bg-muted rounded-xl p-1 mb-6">
          {(["expense", "income"] as TransactionType[]).map(t => (
            <button
              key={t}
              onClick={() => { setType(t); setCategory(""); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                type === t
                  ? t === "expense" ? "bg-destructive text-destructive-foreground" : "bg-success text-success-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {t === "expense" ? "Expense" : "Income"}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div className="mb-5">
          <label className="text-sm text-muted-foreground mb-1.5 block">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">$</span>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="pl-8 text-2xl font-heading font-bold h-14 bg-card"
            />
          </div>
        </div>

        {/* Category */}
        <div className="mb-5">
          <label className="text-sm text-muted-foreground mb-2 block">Category</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  category === c
                    ? "bg-secondary text-secondary-foreground border-secondary"
                    : "bg-card border-border text-muted-foreground hover:border-secondary"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div className="mb-5">
          <label className="text-sm text-muted-foreground mb-1.5 block">Date</label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-card" />
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="text-sm text-muted-foreground mb-1.5 block">Notes (optional)</label>
          <Textarea placeholder="Add a brief description..." value={notes} onChange={e => setNotes(e.target.value)} className="bg-card resize-none" rows={3} />
        </div>

        {/* Submit */}
        <Button onClick={handleSubmit} className="w-full h-12 text-base font-semibold bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-xl">
          <Check className="w-5 h-5 mr-2" /> Save Transaction
        </Button>
      </motion.div>
    </div>
  );
}
