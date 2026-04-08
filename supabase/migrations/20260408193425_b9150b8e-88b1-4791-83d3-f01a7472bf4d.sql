
CREATE TABLE public.goal_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.goal_contributions ENABLE ROW LEVEL SECURITY;

-- Users can view contributions for their own goals
CREATE POLICY "Users can view own goal contributions"
ON public.goal_contributions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.goals WHERE goals.id = goal_contributions.goal_id AND goals.user_id = auth.uid()
  )
);

-- Users can add contributions to their own goals
CREATE POLICY "Users can insert own goal contributions"
ON public.goal_contributions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.goals WHERE goals.id = goal_contributions.goal_id AND goals.user_id = auth.uid()
  )
);

-- Users can delete contributions from their own goals
CREATE POLICY "Users can delete own goal contributions"
ON public.goal_contributions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.goals WHERE goals.id = goal_contributions.goal_id AND goals.user_id = auth.uid()
  )
);
