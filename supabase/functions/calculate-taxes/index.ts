import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TaxCalculation {
  regime: "mei" | "simples" | "autonomo";
  grossIncome: number;
  deductibleExpenses: number;
  netIncome: number;
  taxes: {
    inss: number;
    irpf: number;
    das?: number;
    iss?: number;
    total: number;
  };
  monthlyProjection: number;
  annualProjection: number;
  recommendations: string[];
  alerts: string[];
}

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

    const { period, regime = "mei" } = await req.json();

    // Get financial data
    const startDate = period?.start || new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0];
    const endDate = period?.end || new Date().toISOString().split("T")[0];

    const [earningsRes, expensesRes] = await Promise.all([
      supabase
        .from("earnings")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startDate)
        .lte("date", endDate),
      supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startDate)
        .lte("date", endDate),
    ]);

    const earnings = earningsRes.data || [];
    const expenses = expensesRes.data || [];

    const grossIncome = earnings.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // Calculate deductible expenses (fuel, maintenance, phone for work)
    const deductibleCategories = ["fuel", "maintenance", "phone", "insurance"];
    const deductibleExpenses = expenses
      .filter(e => deductibleCategories.includes(e.category))
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const netIncome = grossIncome - deductibleExpenses;

    // Tax calculations based on regime
    const taxes = calculateTaxes(regime, grossIncome, netIncome, deductibleExpenses);
    
    // Calculate projections
    const daysDiff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) || 1;
    const monthsWorked = daysDiff / 30;
    const monthlyAvg = grossIncome / monthsWorked;
    const annualProjection = monthlyAvg * 12;

    // Generate recommendations and alerts
    const recommendations = generateRecommendations(regime, annualProjection, deductibleExpenses, totalExpenses);
    const alerts = generateAlerts(regime, annualProjection, netIncome);

    const result: TaxCalculation = {
      regime,
      grossIncome,
      deductibleExpenses,
      netIncome,
      taxes,
      monthlyProjection: monthlyAvg,
      annualProjection,
      recommendations,
      alerts,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in calculate-taxes:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function calculateTaxes(regime: string, grossIncome: number, netIncome: number, deductible: number) {
  // MEI 2024/2025 values
  const MEI_LIMIT = 81000; // Annual limit
  const MEI_DAS = 75.90; // Monthly DAS for services

  // INSS rates
  const INSS_MIN_WAGE = 1412; // 2024 minimum wage
  const INSS_CEILING = 7786.02;
  const INSS_RATE = 0.11; // 11% for individual contributor

  // IRPF table 2024
  const irpfTable = [
    { limit: 2259.20, rate: 0, deduction: 0 },
    { limit: 2826.65, rate: 0.075, deduction: 169.44 },
    { limit: 3751.05, rate: 0.15, deduction: 381.44 },
    { limit: 4664.68, rate: 0.225, deduction: 662.77 },
    { limit: Infinity, rate: 0.275, deduction: 896.00 },
  ];

  if (regime === "mei") {
    // MEI pays fixed DAS only
    return {
      das: MEI_DAS,
      inss: 0,
      irpf: 0,
      total: MEI_DAS,
    };
  }

  if (regime === "simples") {
    // Simplified calculation for Simples Nacional
    const monthlyIncome = netIncome / 12;
    const simplesRate = getSimplesRate(netIncome);
    const simplesTax = netIncome * simplesRate;

    return {
      inss: 0, // Included in Simples
      irpf: 0, // Included in Simples
      total: simplesTax,
    };
  }

  // Autônomo (self-employed)
  const monthlyNet = netIncome / 12;
  
  // INSS calculation
  let inssBase = Math.min(monthlyNet, INSS_CEILING);
  inssBase = Math.max(inssBase, INSS_MIN_WAGE);
  const monthlyInss = inssBase * INSS_RATE;
  const annualInss = monthlyInss * 12;

  // IRPF calculation on monthly net after INSS
  const irpfBase = monthlyNet - monthlyInss;
  let monthlyIrpf = 0;
  
  for (const bracket of irpfTable) {
    if (irpfBase <= bracket.limit) {
      monthlyIrpf = irpfBase * bracket.rate - bracket.deduction;
      break;
    }
  }
  monthlyIrpf = Math.max(0, monthlyIrpf);
  const annualIrpf = monthlyIrpf * 12;

  return {
    inss: annualInss,
    irpf: annualIrpf,
    total: annualInss + annualIrpf,
  };
}

function getSimplesRate(annualIncome: number): number {
  // Simplified Simples Nacional rates for services
  if (annualIncome <= 180000) return 0.06;
  if (annualIncome <= 360000) return 0.112;
  if (annualIncome <= 720000) return 0.135;
  if (annualIncome <= 1800000) return 0.16;
  return 0.19;
}

function generateRecommendations(regime: string, annualProjection: number, deductible: number, totalExpenses: number): string[] {
  const recommendations: string[] = [];

  if (regime === "mei" && annualProjection > 81000) {
    recommendations.push("⚠️ Sua projeção anual excede o limite do MEI (R$ 81.000). Considere migrar para o Simples Nacional.");
  }

  if (deductible < totalExpenses * 0.5) {
    recommendations.push("💡 Menos de 50% das suas despesas são dedutíveis. Considere registrar mais despesas de trabalho.");
  }

  recommendations.push("📱 Mantenha comprovantes de combustível e manutenção para dedução fiscal.");
  recommendations.push("💳 Use uma conta bancária separada para facilitar a contabilidade.");
  
  if (annualProjection > 30000) {
    recommendations.push("📊 Com sua renda, vale a pena consultar um contador para otimizar impostos.");
  }

  return recommendations;
}

function generateAlerts(regime: string, annualProjection: number, netIncome: number): string[] {
  const alerts: string[] = [];

  if (regime === "mei") {
    if (annualProjection > 97200) { // 20% acima do limite
      alerts.push("🚨 URGENTE: Você ultrapassou 20% do limite MEI. Desenquadramento automático será aplicado!");
    } else if (annualProjection > 81000) {
      alerts.push("⚠️ Projeção acima do limite MEI. Regularize sua situação antes do fim do ano.");
    }

    const meiMonthlyLimit = 81000 / 12;
    if (netIncome / 12 > meiMonthlyLimit) {
      alerts.push("📅 Sua média mensal está acima do permitido para MEI.");
    }
  }

  // IRPF declaration required above R$ 28.559,70 annually
  if (annualProjection > 28559.70) {
    alerts.push("📋 Com sua renda anual, você é obrigado a declarar Imposto de Renda.");
  }

  return alerts;
}
