import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is premium
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .single();

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some(r => r.role === "admin");
    const isPremium = subscription?.status === "premium" || isAdmin;

    if (!isPremium) {
      return new Response(JSON.stringify({ error: "Funcionalidade exclusiva do plano Premium" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { type, message, financialData } = await req.json();

    // Get user's financial data for context
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);

    const [earningsRes, expensesRes, goalsRes] = await Promise.all([
      supabase.from("earnings").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(100),
      supabase.from("expenses").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(100),
      supabase.from("goals").select("*").eq("user_id", user.id),
    ]);

    const earnings = earningsRes.data || [];
    const expenses = expensesRes.data || [];
    const goals = goalsRes.data || [];

    const totalEarnings = earnings.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const profit = totalEarnings - totalExpenses;

    // Analyze earnings by app
    const earningsByApp: Record<string, number> = {};
    earnings.forEach(e => {
      earningsByApp[e.app] = (earningsByApp[e.app] || 0) + Number(e.amount);
    });

    // Analyze expenses by category
    const expensesByCategory: Record<string, number> = {};
    expenses.forEach(e => {
      expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + Number(e.amount);
    });

    // Calculate average daily earnings
    const uniqueDates = new Set(earnings.map(e => e.date));
    const avgDailyEarnings = uniqueDates.size > 0 ? totalEarnings / uniqueDates.size : 0;

    const financialContext = `
Dados Financeiros do Motorista:
- Ganhos Totais: R$ ${totalEarnings.toFixed(2)}
- Despesas Totais: R$ ${totalExpenses.toFixed(2)}
- Lucro Líquido: R$ ${profit.toFixed(2)}
- Margem de Lucro: ${totalEarnings > 0 ? ((profit / totalEarnings) * 100).toFixed(1) : 0}%
- Média Diária de Ganhos: R$ ${avgDailyEarnings.toFixed(2)}
- Dias Trabalhados: ${uniqueDates.size}

Ganhos por App:
${Object.entries(earningsByApp).map(([app, value]) => `- ${app}: R$ ${value.toFixed(2)}`).join("\n")}

Despesas por Categoria:
${Object.entries(expensesByCategory).map(([cat, value]) => `- ${cat}: R$ ${value.toFixed(2)}`).join("\n")}

Metas Financeiras:
${goals.length > 0 ? goals.map(g => `- ${g.title}: R$ ${g.current_amount}/${g.target_amount} (${g.is_achieved ? "Alcançada" : "Em andamento"})`).join("\n") : "Nenhuma meta definida"}
`;

    let systemPrompt = "";
    
    if (type === "analysis") {
      systemPrompt = `Você é um consultor financeiro especialista em motoristas de aplicativo no Brasil. 
Analise os dados financeiros fornecidos e forneça insights valiosos, identificando:
1. Padrões de ganhos e despesas
2. Apps mais rentáveis
3. Categorias de despesas que podem ser otimizadas
4. Sugestões para aumentar a margem de lucro
5. Alertas sobre gastos excessivos

Seja direto, prático e use linguagem acessível. Formate com emojis para facilitar a leitura.`;
    } else if (type === "planning") {
      systemPrompt = `Você é um planejador financeiro especialista em motoristas de aplicativo.
Com base nos dados financeiros, crie um plano de ação personalizado para:
1. Maximizar ganhos nos próximos 30 dias
2. Reduzir despesas desnecessárias
3. Atingir as metas financeiras definidas
4. Melhorar o equilíbrio trabalho-renda

Forneça passos concretos e mensuráveis. Use tabelas markdown quando útil.`;
    } else if (type === "taxes") {
      systemPrompt = `Você é um contador especialista em impostos para motoristas de aplicativo no Brasil.
Analise os ganhos e despesas e calcule:
1. Estimativa de imposto devido (considerando MEI ou regime normal)
2. Despesas dedutíveis
3. Recomendações para regularização fiscal
4. Projeção anual de impostos

Forneça valores específicos baseados nos dados. Alerte sobre obrigações fiscais importantes.`;
    } else {
      systemPrompt = `Você é um consultor financeiro amigável especializado em motoristas de aplicativo no Brasil.
Responda às perguntas do usuário de forma clara, prática e personalizada baseado nos dados financeiros dele.
Use exemplos concretos e dê conselhos acionáveis. Seja empático e motivador.`;
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `${financialContext}\n\nPergunta/Solicitação: ${message || "Faça uma análise completa dos meus dados financeiros."}` },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error("Erro no serviço de IA");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Error in financial-advisor:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
