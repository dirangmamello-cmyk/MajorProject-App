import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Trash2, Tag } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCategories, addCategory, deleteCategory } from "@/lib/extendedStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Categories() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: cats = [], isLoading } = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const [name, setName] = useState("");

  const onAdd = async () => {
    if (!name.trim()) return;
    try {
      await addCategory({ name: name.trim() });
      toast.success("Category added");
      setName("");
      qc.invalidateQueries({ queryKey: ["categories"] });
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
  };

  const onDelete = async (id: string) => {
    await deleteCategory(id);
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  return (
    <div className="px-4 pt-2 pb-24 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-heading font-bold flex items-center gap-2">
            <Tag className="w-5 h-5 text-secondary" /> Categories
          </h1>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 mb-4 flex gap-2">
          <Input placeholder="New category name" value={name} onChange={(e) => setName(e.target.value)} />
          <Button onClick={onAdd}><Plus className="w-4 h-4" /></Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : cats.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center">No custom categories yet.</p>
        ) : (
          <div className="space-y-2">
            {cats.map((c) => (
              <div key={c.id} className="bg-card border border-border rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{c.name}</p>
                  {c.is_custom && <p className="text-[10px] text-muted-foreground">Custom</p>}
                </div>
                <button onClick={() => onDelete(c.id)} className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
