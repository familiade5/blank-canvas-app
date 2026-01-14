import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  city: string | null;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "user" | "premium";
}

export interface Subscription {
  id: string;
  user_id: string;
  status: "free" | "pro" | "premium" | "cancelled";
  plan_name: string;
  price: number;
  started_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Earning {
  id: string;
  user_id: string;
  app: "uber" | "99" | "ifood" | "rappi" | "loggi" | "lalamove" | "uber_eats" | "outros";
  amount: number;
  date: string;
  trips_count: number | null;
  hours_worked: number | null;
  km_traveled: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  category: "fuel" | "maintenance" | "food" | "phone" | "insurance" | "taxes" | "other";
  amount: number;
  date: string;
  description: string | null;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  period: string;
  start_date: string;
  end_date: string | null;
  is_achieved: boolean;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user,
  });
};

export const useUserRoles = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["user_roles", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data as UserRole[];
    },
    enabled: !!user,
  });
};

export const useSubscription = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as Subscription | null;
    },
    enabled: !!user,
  });
};

export const useEarnings = (startDate?: string, endDate?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["earnings", user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from("earnings")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });
      
      if (startDate) {
        query = query.gte("date", startDate);
      }
      if (endDate) {
        query = query.lte("date", endDate);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Earning[];
    },
    enabled: !!user,
  });
};

export const useExpenses = (startDate?: string, endDate?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["expenses", user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });
      
      if (startDate) {
        query = query.gte("date", startDate);
      }
      if (endDate) {
        query = query.lte("date", endDate);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!user,
  });
};

export const useGoals = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["goals", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Goal[];
    },
    enabled: !!user,
  });
};

export const useIsAdmin = () => {
  const { data: roles } = useUserRoles();
  return roles?.some(r => r.role === "admin") ?? false;
};

export const useIsPremium = () => {
  const { data: subscription } = useSubscription();
  const { data: roles } = useUserRoles();
  const isAdmin = roles?.some(r => r.role === "admin");
  return isAdmin || subscription?.status === "premium" || subscription?.status === "pro";
};
