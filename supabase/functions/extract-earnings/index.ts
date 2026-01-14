import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExtractedEarning {
  app: string;
  amount: number;
  date: string;
  trips_count?: number;
  hours_worked?: number;
  km_traveled?: number;
  notes?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header missing");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error("Usuário não autenticado");

    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("multipart/form-data")) {
      // Handle image upload for OCR
      const formData = await req.formData();
      const file = formData.get("file") as File;
      const fileType = formData.get("type") as string; // "image" or "csv"
      
      if (!file) throw new Error("Arquivo não encontrado");

      if (fileType === "csv") {
        // Parse CSV file
        const text = await file.text();
        const earnings = parseCSV(text);
        
        // Insert earnings into database
        const insertedEarnings = [];
        for (const earning of earnings) {
          const { data, error } = await supabase
            .from("earnings")
            .insert({
              user_id: user.id,
              app: earning.app,
              amount: earning.amount,
              date: earning.date,
              trips_count: earning.trips_count,
              hours_worked: earning.hours_worked,
              km_traveled: earning.km_traveled,
              notes: earning.notes || "Importado via CSV",
            })
            .select()
            .single();
          
          if (!error && data) {
            insertedEarnings.push(data);
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: `${insertedEarnings.length} ganhos importados do CSV`,
            earnings: insertedEarnings,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // Handle image with OCR using Gemini
        const arrayBuffer = await file.arrayBuffer();
        const base64Image = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
        );
        
        const mimeType = file.type || "image/jpeg";
        
        // Call Lovable AI Gateway with Gemini for OCR
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (!LOVABLE_API_KEY) {
          throw new Error("LOVABLE_API_KEY not configured");
        }

        const aiResponse = await fetch("https://ai.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `Analise esta imagem de tela de um aplicativo de motorista/entregador (Uber, 99, iFood, Rappi, etc) e extraia os dados de ganhos.

Retorne APENAS um JSON válido no seguinte formato, sem texto adicional:
{
  "app": "uber" | "99" | "ifood" | "rappi" | "loggi" | "lalamove" | "uber_eats" | "outros",
  "entries": [
    {
      "amount": número (valor em reais, sem R$),
      "date": "YYYY-MM-DD",
      "trips_count": número ou null,
      "hours_worked": número ou null,
      "km_traveled": número ou null
    }
  ]
}

Se não conseguir identificar algum campo, use null.
Se houver múltiplos dias/entradas visíveis, inclua todas.
Identifique o app pela interface/logo. Se não conseguir identificar, use "outros".
Use a data atual se não houver data visível.`,
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:${mimeType};base64,${base64Image}`,
                    },
                  },
                ],
              },
            ],
            max_tokens: 2000,
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error("AI API error:", errorText);
          throw new Error("Erro ao processar imagem com IA");
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || "";
        
        console.log("AI Response:", content);

        // Parse AI response
        let extractedData;
        try {
          // Try to extract JSON from the response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            extractedData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error("No JSON found in response");
          }
        } catch (parseError) {
          console.error("Parse error:", parseError);
          throw new Error("Não foi possível extrair dados da imagem. Tente uma foto mais clara.");
        }

        // Insert extracted earnings
        const insertedEarnings = [];
        const app = extractedData.app || "outros";
        
        for (const entry of extractedData.entries || []) {
          if (!entry.amount || entry.amount <= 0) continue;
          
          const { data, error } = await supabase
            .from("earnings")
            .insert({
              user_id: user.id,
              app: app,
              amount: entry.amount,
              date: entry.date || new Date().toISOString().split("T")[0],
              trips_count: entry.trips_count,
              hours_worked: entry.hours_worked,
              km_traveled: entry.km_traveled,
              notes: "Importado via foto (OCR)",
            })
            .select()
            .single();
          
          if (!error && data) {
            insertedEarnings.push(data);
          } else {
            console.error("Insert error:", error);
          }
        }

        if (insertedEarnings.length === 0) {
          throw new Error("Não foi possível identificar ganhos na imagem. Tente uma foto mais clara da tela de ganhos.");
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: `${insertedEarnings.length} ganho(s) extraído(s) da imagem`,
            app: app,
            earnings: insertedEarnings,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    throw new Error("Formato de requisição inválido");

  } catch (error: unknown) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});

function parseCSV(text: string): ExtractedEarning[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].toLowerCase().split(/[,;]/).map(h => h.trim());
  const earnings: ExtractedEarning[] = [];

  // Map common header variations
  const headerMap: Record<string, string[]> = {
    app: ["app", "aplicativo", "plataforma", "fonte"],
    amount: ["amount", "valor", "ganho", "total", "receita", "earnings"],
    date: ["date", "data", "dia"],
    trips_count: ["trips", "viagens", "corridas", "entregas", "trips_count"],
    hours_worked: ["hours", "horas", "tempo", "hours_worked"],
    km_traveled: ["km", "quilometros", "distancia", "km_traveled"],
  };

  const findHeaderIndex = (field: string): number => {
    const variations = headerMap[field] || [field];
    return headers.findIndex(h => variations.some(v => h.includes(v)));
  };

  const appIdx = findHeaderIndex("app");
  const amountIdx = findHeaderIndex("amount");
  const dateIdx = findHeaderIndex("date");
  const tripsIdx = findHeaderIndex("trips_count");
  const hoursIdx = findHeaderIndex("hours_worked");
  const kmIdx = findHeaderIndex("km_traveled");

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(/[,;]/).map(v => v.trim().replace(/^["']|["']$/g, ""));
    
    if (values.length < 2) continue;

    const amountStr = amountIdx >= 0 ? values[amountIdx] : values[1];
    const amount = parseFloat(amountStr.replace(/[R$\s]/g, "").replace(",", "."));
    
    if (isNaN(amount) || amount <= 0) continue;

    let app = appIdx >= 0 ? values[appIdx].toLowerCase() : "outros";
    const validApps = ["uber", "99", "ifood", "rappi", "loggi", "lalamove", "uber_eats", "outros"];
    if (!validApps.includes(app)) app = "outros";

    let date = dateIdx >= 0 ? values[dateIdx] : new Date().toISOString().split("T")[0];
    // Try to parse common date formats
    if (date.includes("/")) {
      const parts = date.split("/");
      if (parts.length === 3) {
        if (parts[2].length === 4) {
          date = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
        } else if (parts[0].length === 4) {
          date = `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
        }
      }
    }

    earnings.push({
      app: app as any,
      amount,
      date,
      trips_count: tripsIdx >= 0 ? parseInt(values[tripsIdx]) || undefined : undefined,
      hours_worked: hoursIdx >= 0 ? parseFloat(values[hoursIdx]) || undefined : undefined,
      km_traveled: kmIdx >= 0 ? parseFloat(values[kmIdx]) || undefined : undefined,
      notes: "Importado via CSV",
    });
  }

  return earnings;
}
