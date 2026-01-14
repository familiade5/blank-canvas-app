-- Create admin RLS policies for reading all data (missing tables)
CREATE POLICY "Admins can view all earnings" 
ON public.earnings 
FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all expenses" 
ON public.expenses 
FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all goals" 
ON public.goals 
FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all subscriptions" 
ON public.subscriptions 
FOR SELECT 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'));