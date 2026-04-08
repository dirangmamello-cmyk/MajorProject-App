import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, ChevronDown, Target, Loader2, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function Goals() {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [contributionInputs, setContributionInputs] = useState<Record<string, string>>({});
  const [showContribution, setShowContribution] = useState<Record<string, boolean>>({});

  // Fetch goals
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch all contributions
  const { data: contributions = [] } = useQuery({
    queryKey: ["goal_contributions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goal_contributions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Create goal
  const createGoal = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("goals").insert({
        user_id: user.id,
        name: newName.trim(),
        target_amount: newTarget ? parseFloat(newTarget) : 0,
        current_amount: 0,
        target_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setNewName("");
      setNewTarget("");
      toast({ title: "Goal created!" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // Delete goal
  const deleteGoal = useMutation({
    mutationFn: async (goalId: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", goalId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal_contributions"] });
      toast({ title: "Goal deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // Add contribution
  const addContribution = useMutation({
    mutationFn: async ({ goalId, amount }: { goalId: string; amount: number }) => {
      const { error: contribError } = await supabase
        .from("goal_contributions")
        .insert({ goal_id: goalId, amount });
      if (contribError) throw contribError;

      // Update current_amount on the goal
      const goal = goals.find((g) => g.id === goalId);
      if (goal) {
        const { error: updateError } = await supabase
          .from("goals")
          .update({ current_amount: Number(goal.current_amount) + amount })
          .eq("id", goalId);
        if (updateError) throw updateError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal_contributions"] });
      setContributionInputs({});
      setShowContribution({});
      toast({ title: "Contribution added!" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleAddContribution = (goalId: string) => {
    const val = parseFloat(contributionInputs[goalId] || "");
    if (!val || val <= 0) return;
    addContribution.mutate({ goalId, amount: val });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
          <Target className="w-6 h-6 text-primary" /> Savings Goals
        </h1>
        <p className="text-sm text-muted-foreground mb-6">Track your financial goals and contributions</p>

        {/* Create Goal */}
        <Card className="mb-6 border-dashed border-2 border-primary/30">
          <CardContent className="pt-4 pb-4 space-y-3">
            <Input
              placeholder="Goal name (e.g. Emergency Fund)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Target amount (optional)"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
            />
            <Button
              className="w-full"
              disabled={!newName.trim() || createGoal.isPending}
              onClick={() => createGoal.mutate()}
            >
              {createGoal.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Goal
            </Button>
          </CardContent>
        </Card>

        {/* Goals List */}
        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground">Loading goals...</div>
        ) : goals.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">No goals yet. Create one above!</div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {goals.map((goal) => {
                const saved = Number(goal.current_amount);
                const target = Number(goal.target_amount);
                const pct = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
                const goalContributions = contributions.filter((c) => c.goal_id === goal.id);

                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <Collapsible>
                      <Card>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base font-semibold">{goal.name}</CardTitle>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete goal?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete "{goal.name}" and all its contributions.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteGoal.mutate(goal.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                          <div className="flex justify-between text-sm text-muted-foreground mt-1">
                            <span>Saved: <span className="text-foreground font-medium">${saved.toFixed(2)}</span></span>
                            {target > 0 && <span>Target: ${target.toFixed(2)}</span>}
                          </div>
                          {target > 0 && (
                            <div className="mt-2">
                              <Progress value={pct} className="h-2" />
                              <p className="text-xs text-muted-foreground mt-1 text-right">{pct.toFixed(0)}%</p>
                            </div>
                          )}
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                          {/* Add Contribution Toggle */}
                          {showContribution[goal.id] ? (
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                placeholder="Amount"
                                className="flex-1"
                                value={contributionInputs[goal.id] || ""}
                                onChange={(e) =>
                                  setContributionInputs((p) => ({ ...p, [goal.id]: e.target.value }))
                                }
                                onKeyDown={(e) => e.key === "Enter" && handleAddContribution(goal.id)}
                              />
                              <Button
                                size="sm"
                                disabled={addContribution.isPending}
                                onClick={() => handleAddContribution(goal.id)}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowContribution((p) => ({ ...p, [goal.id]: false }))}
                              >
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => setShowContribution((p) => ({ ...p, [goal.id]: true }))}
                            >
                              <Plus className="w-3 h-3 mr-1" /> Add Contribution
                            </Button>
                          )}

                          {/* Expandable Contributions History */}
                          {goalContributions.length > 0 && (
                            <>
                              <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full">
                                <ChevronDown className="w-3 h-3" />
                                {goalContributions.length} contribution{goalContributions.length !== 1 ? "s" : ""}
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="space-y-1 mt-1 max-h-40 overflow-y-auto">
                                  {goalContributions.map((c) => (
                                    <div key={c.id} className="flex justify-between text-xs px-2 py-1 rounded bg-muted/50">
                                      <span className="text-foreground font-medium">+${Number(c.amount).toFixed(2)}</span>
                                      <span className="text-muted-foreground">
                                        {new Date(c.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </CollapsibleContent>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </Collapsible>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
