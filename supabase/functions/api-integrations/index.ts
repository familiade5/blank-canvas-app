import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// This is a simulation of app integrations since real Uber/99/iFood APIs require business partnerships
// In production, this would connect to actual OAuth flows and APIs

interface AppCredentials {
  app: string;
  accessToken?: string;
  refreshToken?: string;
  email?: string;
  connected: boolean;
  lastSync?: string;
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

    const { action, app, credentials } = await req.json();

    // In a real implementation, this would store credentials securely and sync data
    // For now, we simulate the integration flow

    const supportedApps = ["uber", "99", "ifood", "rappi", "loggi", "lalamove", "uber_eats"];

    if (action === "list") {
      // Return list of available integrations
      const integrations = supportedApps.map(appName => ({
        app: appName,
        name: getAppDisplayName(appName),
        icon: getAppIcon(appName),
        connected: false, // Would check database for actual connection status
        lastSync: null,
        description: getAppDescription(appName),
      }));

      return new Response(JSON.stringify({ integrations }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "connect") {
      if (!supportedApps.includes(app)) {
        return new Response(JSON.stringify({ error: "App não suportado" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Simulate OAuth flow - in production, this would redirect to app's OAuth page
      const oauthUrl = getOAuthUrl(app);
      
      return new Response(JSON.stringify({ 
        success: true,
        message: `Para conectar o ${getAppDisplayName(app)}, você precisa autorizar o acesso.`,
        oauthUrl,
        instructions: getConnectionInstructions(app),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "sync") {
      if (!supportedApps.includes(app)) {
        return new Response(JSON.stringify({ error: "App não suportado" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Simulate data sync - in production would fetch real data from app APIs
      const simulatedEarnings = generateSimulatedEarnings(app, user.id);
      
      // Insert simulated earnings
      for (const earning of simulatedEarnings) {
        await supabase.from("earnings").insert({
          user_id: user.id,
          app: app as any,
          amount: earning.amount,
          date: earning.date,
          trips_count: earning.trips,
          hours_worked: earning.hours,
          km_traveled: earning.km,
          notes: `Sincronizado automaticamente do ${getAppDisplayName(app)}`,
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Dados do ${getAppDisplayName(app)} sincronizados com sucesso!`,
        synced: simulatedEarnings.length,
        lastSync: new Date().toISOString(),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "disconnect") {
      // Remove stored credentials
      return new Response(JSON.stringify({
        success: true,
        message: `${getAppDisplayName(app)} desconectado com sucesso.`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação não reconhecida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in api-integrations:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getAppDisplayName(app: string): string {
  const names: Record<string, string> = {
    uber: "Uber",
    "99": "99",
    ifood: "iFood",
    rappi: "Rappi",
    loggi: "Loggi",
    lalamove: "Lalamove",
    uber_eats: "Uber Eats",
  };
  return names[app] || app;
}

function getAppIcon(app: string): string {
  return `https://api.iconify.design/simple-icons:${app}.svg`;
}

function getAppDescription(app: string): string {
  const descriptions: Record<string, string> = {
    uber: "Sincronize suas corridas e ganhos do Uber automaticamente",
    "99": "Importe dados de corridas e faturamento da 99",
    ifood: "Conecte entregas e ganhos do iFood",
    rappi: "Sincronize entregas e faturamento do Rappi",
    loggi: "Importe entregas e ganhos da Loggi",
    lalamove: "Conecte entregas e faturamento do Lalamove",
    uber_eats: "Sincronize entregas do Uber Eats",
  };
  return descriptions[app] || "Conecte e sincronize seus dados";
}

function getOAuthUrl(app: string): string {
  // In production, these would be real OAuth URLs
  return `https://auth.drivefinance.com.br/connect/${app}`;
}

function getConnectionInstructions(app: string): string[] {
  return [
    `1. Clique em "Conectar" para abrir a página de autorização do ${getAppDisplayName(app)}`,
    `2. Faça login com sua conta do ${getAppDisplayName(app)}`,
    "3. Autorize o DriveFinance a acessar seus dados de corridas/entregas",
    "4. Você será redirecionado de volta ao app",
    "5. Seus dados serão sincronizados automaticamente!",
  ];
}

function generateSimulatedEarnings(app: string, userId: string) {
  // Generate realistic simulated earnings for demo purposes
  const earnings = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Skip some days randomly
    if (Math.random() > 0.7) continue;
    
    const baseAmount = app === "uber" || app === "99" ? 150 : 80;
    const variance = baseAmount * 0.5;
    
    earnings.push({
      amount: baseAmount + Math.random() * variance,
      date: date.toISOString().split("T")[0],
      trips: Math.floor(5 + Math.random() * 15),
      hours: 4 + Math.random() * 6,
      km: 50 + Math.random() * 100,
    });
  }
  
  return earnings;
}
