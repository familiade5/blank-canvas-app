import { useState } from "react";
import { motion } from "framer-motion";
import { Code2, Copy, Check, Key, Sparkles, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useIsPremium } from "@/hooks/useUserData";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const APIDocumentation = () => {
  const isPremium = useIsPremium();
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  const apiKey = user ? `${user.id}:${btoa(user.id).slice(0, 16)}` : "YOUR_API_KEY";
  const baseUrl = import.meta.env.VITE_SUPABASE_URL + "/functions/v1/external-api";

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast({ title: "Copiado!" });
    setTimeout(() => setCopied(null), 2000);
  };

  const CodeBlock = ({ code, language = "bash" }: { code: string; language?: string }) => (
    <div className="relative">
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-2 right-2"
        onClick={() => copyToClipboard(code, code.slice(0, 20))}
      >
        {copied === code.slice(0, 20) ? (
          <Check className="w-4 h-4" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </Button>
    </div>
  );

  if (!isPremium) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md text-center">
            <CardContent className="pt-6">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-warning" />
              <h2 className="text-2xl font-bold mb-2">Funcionalidade Premium</h2>
              <p className="text-muted-foreground mb-4">
                A API de integrações está disponível apenas para assinantes Premium.
              </p>
              <Button className="gradient-accent text-accent-foreground">
                Fazer Upgrade
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Code2 className="w-6 h-6 text-primary" />
          API para Integrações
        </h1>
        <p className="text-muted-foreground">
          Integre seus dados financeiros com sistemas externos
        </p>
      </div>

      {/* API Key */}
      <Card className="mb-8 border-primary/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Key className="w-5 h-5 text-warning" />
            Sua Chave de API
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <code className="flex-1 text-sm font-mono truncate">{apiKey}</code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(apiKey, "apikey")}
            >
              {copied === "apikey" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Use esta chave no header <code>x-api-key</code> de suas requisições.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="earnings">Ganhos</TabsTrigger>
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
          <TabsTrigger value="summary">Resumo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Base URL</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CodeBlock code={baseUrl} />

              <h4 className="font-semibold mt-6">Autenticação</h4>
              <p className="text-sm text-muted-foreground">
                Todas as requisições precisam incluir o header de autenticação:
              </p>
              <CodeBlock code={`x-api-key: ${apiKey}`} />

              <h4 className="font-semibold mt-6">Endpoints Disponíveis</h4>
              <div className="grid gap-2">
                {[
                  { method: "GET", path: "/earnings", desc: "Lista ganhos" },
                  { method: "POST", path: "/earnings", desc: "Cria ganho" },
                  { method: "GET", path: "/expenses", desc: "Lista despesas" },
                  { method: "POST", path: "/expenses", desc: "Cria despesa" },
                  { method: "GET", path: "/summary", desc: "Resumo financeiro" },
                  { method: "GET", path: "/goals", desc: "Lista metas" },
                ].map((ep, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 bg-muted rounded">
                    <Badge variant={ep.method === "GET" ? "secondary" : "default"}>
                      {ep.method}
                    </Badge>
                    <code className="text-sm">{ep.path}</code>
                    <span className="text-sm text-muted-foreground ml-auto">{ep.desc}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings">
          <Card>
            <CardHeader>
              <CardTitle>Endpoints de Ganhos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <Badge>GET</Badge> /earnings
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Lista todos os ganhos do usuário com filtros opcionais.
                </p>
                <p className="text-sm font-medium mb-2">Parâmetros:</p>
                <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                  <li>• <code>start_date</code> - Data inicial (YYYY-MM-DD)</li>
                  <li>• <code>end_date</code> - Data final (YYYY-MM-DD)</li>
                  <li>• <code>app</code> - Filtrar por app (uber, 99, ifood, etc)</li>
                  <li>• <code>limit</code> - Limite de resultados (padrão: 100)</li>
                  <li>• <code>offset</code> - Offset para paginação</li>
                </ul>
                <CodeBlock code={`curl -X GET "${baseUrl}/earnings?start_date=2024-01-01&app=uber" \\
  -H "x-api-key: ${apiKey}"`} />
              </div>

              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <Badge variant="default">POST</Badge> /earnings
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Cria um novo registro de ganho.
                </p>
                <CodeBlock code={`curl -X POST "${baseUrl}/earnings" \\
  -H "x-api-key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "app": "uber",
    "amount": 150.00,
    "date": "2024-01-15",
    "trips_count": 10,
    "hours_worked": 6.5,
    "km_traveled": 120,
    "notes": "Dia de chuva, muita demanda"
  }'`} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Endpoints de Despesas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <Badge>GET</Badge> /expenses
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Lista todas as despesas com filtros opcionais.
                </p>
                <CodeBlock code={`curl -X GET "${baseUrl}/expenses?category=fuel" \\
  -H "x-api-key: ${apiKey}"`} />
              </div>

              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <Badge variant="default">POST</Badge> /expenses
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Cria um novo registro de despesa.
                </p>
                <p className="text-sm font-medium mb-2">Categorias disponíveis:</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {["fuel", "maintenance", "food", "phone", "insurance", "taxes", "other"].map(cat => (
                    <Badge key={cat} variant="outline">{cat}</Badge>
                  ))}
                </div>
                <CodeBlock code={`curl -X POST "${baseUrl}/expenses" \\
  -H "x-api-key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "category": "fuel",
    "amount": 150.00,
    "date": "2024-01-15",
    "description": "Gasolina - Posto Shell"
  }'`} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Endpoint de Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-2">
                  <Badge>GET</Badge> /summary
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Retorna um resumo financeiro completo do período.
                </p>
                <CodeBlock code={`curl -X GET "${baseUrl}/summary?start_date=2024-01-01&end_date=2024-01-31" \\
  -H "x-api-key: ${apiKey}"`} />

                <h4 className="font-semibold mt-6 mb-2">Resposta de Exemplo:</h4>
                <CodeBlock code={`{
  "period": {
    "start_date": "2024-01-01",
    "end_date": "2024-01-31"
  },
  "totals": {
    "earnings": 4500.00,
    "expenses": 1200.00,
    "profit": 3300.00,
    "profit_margin": "73.33",
    "trips": 150,
    "hours": "180.5",
    "km": "2500.0"
  },
  "earnings_by_app": {
    "uber": 2500.00,
    "99": 1500.00,
    "ifood": 500.00
  },
  "expenses_by_category": {
    "fuel": 800.00,
    "food": 300.00,
    "phone": 100.00
  },
  "averages": {
    "per_trip": "30.00",
    "per_hour": "24.93",
    "per_km": "1.80"
  }
}`} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* SDKs Info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Integrações Populares</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: "Zapier", desc: "Automatize fluxos" },
              { name: "Google Sheets", desc: "Planilhas automáticas" },
              { name: "Power BI", desc: "Dashboards" },
              { name: "n8n", desc: "Automação open-source" },
            ].map((int) => (
              <div key={int.name} className="p-4 bg-muted rounded-lg text-center">
                <p className="font-medium">{int.name}</p>
                <p className="text-xs text-muted-foreground">{int.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default APIDocumentation;
