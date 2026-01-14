import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

// Public API endpoints for Premium users to integrate with external systems

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace("/external-api", "");

    // Check for API key authentication
    const apiKey = req.headers.get("x-api-key");
    const authHeader = req.headers.get("Authorization");

    if (!apiKey && !authHeader) {
      return new Response(JSON.stringify({ 
        error: "Autenticação necessária",
        message: "Use x-api-key no header ou Bearer token"
      }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let userId: string;

    if (apiKey) {
      // Validate API key (in production, store API keys in a table)
      // For now, we'll use a simple format: user_id:secret
      const [keyUserId] = apiKey.split(":");
      if (!keyUserId) {
        return new Response(JSON.stringify({ error: "API key inválida" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = keyUserId;
    } else {
      const token = authHeader!.replace("Bearer ", "");
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) {
        return new Response(JSON.stringify({ error: "Token inválido" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = user.id;
    }

    // Check if user is premium
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", userId)
      .single();

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const isAdmin = roles?.some(r => r.role === "admin");
    const isPremium = subscription?.status === "premium" || isAdmin;

    if (!isPremium) {
      return new Response(JSON.stringify({ 
        error: "API disponível apenas para assinantes Premium",
        upgrade_url: "https://drivefinance.com.br/#pricing"
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // API Routes
    if (req.method === "GET") {
      if (path === "/earnings" || path === "/earnings/") {
        return await getEarnings(supabase, userId, url.searchParams);
      }
      if (path === "/expenses" || path === "/expenses/") {
        return await getExpenses(supabase, userId, url.searchParams);
      }
      if (path === "/summary" || path === "/summary/") {
        return await getSummary(supabase, userId, url.searchParams);
      }
      if (path === "/goals" || path === "/goals/") {
        return await getGoals(supabase, userId);
      }
      if (path === "/" || path === "") {
        return getApiDocs();
      }
    }

    if (req.method === "POST") {
      const body = await req.json();
      
      if (path === "/earnings" || path === "/earnings/") {
        return await createEarning(supabase, userId, body);
      }
      if (path === "/expenses" || path === "/expenses/") {
        return await createExpense(supabase, userId, body);
      }
    }

    return new Response(JSON.stringify({ error: "Endpoint não encontrado" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in external-api:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function getEarnings(supabase: any, userId: string, params: URLSearchParams) {
  const startDate = params.get("start_date");
  const endDate = params.get("end_date");
  const app = params.get("app");
  const limit = parseInt(params.get("limit") || "100");
  const offset = parseInt(params.get("offset") || "0");

  let query = supabase
    .from("earnings")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (startDate) query = query.gte("date", startDate);
  if (endDate) query = query.lte("date", endDate);
  if (app) query = query.eq("app", app);

  const { data, error, count } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({
    data,
    pagination: { total: count, limit, offset },
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getExpenses(supabase: any, userId: string, params: URLSearchParams) {
  const startDate = params.get("start_date");
  const endDate = params.get("end_date");
  const category = params.get("category");
  const limit = parseInt(params.get("limit") || "100");
  const offset = parseInt(params.get("offset") || "0");

  let query = supabase
    .from("expenses")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (startDate) query = query.gte("date", startDate);
  if (endDate) query = query.lte("date", endDate);
  if (category) query = query.eq("category", category);

  const { data, error, count } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({
    data,
    pagination: { total: count, limit, offset },
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getSummary(supabase: any, userId: string, params: URLSearchParams) {
  const startDate = params.get("start_date") || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];
  const endDate = params.get("end_date") || new Date().toISOString().split("T")[0];

  const [earningsRes, expensesRes] = await Promise.all([
    supabase
      .from("earnings")
      .select("amount, app, trips_count, hours_worked, km_traveled")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate),
    supabase
      .from("expenses")
      .select("amount, category")
      .eq("user_id", userId)
      .gte("date", startDate)
      .lte("date", endDate),
  ]);

  const earnings = earningsRes.data || [];
  const expenses = expensesRes.data || [];

  const totalEarnings = earnings.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
  const totalExpenses = expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
  const totalTrips = earnings.reduce((sum: number, e: any) => sum + (e.trips_count || 0), 0);
  const totalHours = earnings.reduce((sum: number, e: any) => sum + (e.hours_worked || 0), 0);
  const totalKm = earnings.reduce((sum: number, e: any) => sum + (e.km_traveled || 0), 0);

  // Group by app
  const byApp: Record<string, number> = {};
  earnings.forEach((e: any) => {
    byApp[e.app] = (byApp[e.app] || 0) + Number(e.amount);
  });

  // Group by category
  const byCategory: Record<string, number> = {};
  expenses.forEach((e: any) => {
    byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
  });

  return new Response(JSON.stringify({
    period: { start_date: startDate, end_date: endDate },
    totals: {
      earnings: totalEarnings,
      expenses: totalExpenses,
      profit: totalEarnings - totalExpenses,
      profit_margin: totalEarnings > 0 ? ((totalEarnings - totalExpenses) / totalEarnings * 100).toFixed(2) : 0,
      trips: totalTrips,
      hours: totalHours.toFixed(1),
      km: totalKm.toFixed(1),
    },
    earnings_by_app: byApp,
    expenses_by_category: byCategory,
    averages: {
      per_trip: totalTrips > 0 ? (totalEarnings / totalTrips).toFixed(2) : 0,
      per_hour: totalHours > 0 ? (totalEarnings / totalHours).toFixed(2) : 0,
      per_km: totalKm > 0 ? (totalEarnings / totalKm).toFixed(2) : 0,
    },
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getGoals(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ data }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function createEarning(supabase: any, userId: string, body: any) {
  const { app, amount, date, trips_count, hours_worked, km_traveled, notes } = body;

  if (!app || !amount) {
    return new Response(JSON.stringify({ error: "app e amount são obrigatórios" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data, error } = await supabase
    .from("earnings")
    .insert({
      user_id: userId,
      app,
      amount,
      date: date || new Date().toISOString().split("T")[0],
      trips_count,
      hours_worked,
      km_traveled,
      notes,
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ data, message: "Ganho criado com sucesso" }), {
    status: 201,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function createExpense(supabase: any, userId: string, body: any) {
  const { category, amount, date, description } = body;

  if (!category || !amount) {
    return new Response(JSON.stringify({ error: "category e amount são obrigatórios" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      user_id: userId,
      category,
      amount,
      date: date || new Date().toISOString().split("T")[0],
      description,
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ data, message: "Despesa criada com sucesso" }), {
    status: 201,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getApiDocs() {
  const docs = {
    name: "DriveFinance API",
    version: "1.0.0",
    description: "API para integrar seus dados financeiros com sistemas externos",
    authentication: {
      methods: ["x-api-key header", "Bearer token"],
      example: "curl -H 'x-api-key: YOUR_API_KEY' https://api.drivefinance.com.br/v1/earnings",
    },
    endpoints: {
      "GET /earnings": {
        description: "Lista ganhos",
        params: ["start_date", "end_date", "app", "limit", "offset"],
      },
      "POST /earnings": {
        description: "Cria novo ganho",
        body: { app: "uber", amount: 150.00, date: "2024-01-15", trips_count: 10 },
      },
      "GET /expenses": {
        description: "Lista despesas",
        params: ["start_date", "end_date", "category", "limit", "offset"],
      },
      "POST /expenses": {
        description: "Cria nova despesa",
        body: { category: "fuel", amount: 50.00, date: "2024-01-15", description: "Gasolina" },
      },
      "GET /summary": {
        description: "Resumo financeiro do período",
        params: ["start_date", "end_date"],
      },
      "GET /goals": {
        description: "Lista metas financeiras",
      },
    },
    apps: ["uber", "99", "ifood", "rappi", "loggi", "lalamove", "uber_eats", "outros"],
    categories: ["fuel", "maintenance", "food", "phone", "insurance", "taxes", "other"],
  };

  return new Response(JSON.stringify(docs), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
