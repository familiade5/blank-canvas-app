import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calculator, AlertTriangle, CheckCircle, Info, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useIsPremium } from "@/hooks/useUserData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TaxResult {
  regime: string;
  grossIncome: number;
  deductibleExpenses: number;
  netIncome: number;
  taxes: {
    inss: number;
    irpf: number;
    das?: number;
    total: number;
  };
  monthlyProjection: number;
  annualProjection: number;
  recommendations: string[];
  alerts: string[];
}

const TaxCalculator = () => {
  const isPremium = useIsPremium();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [regime, setRegime] = useState("mei");
  const [period, setPeriod] = useState("year");
  const [result, setResult] = useState<TaxResult | null>(null);

  const calculateTaxes = async () => {
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ variant: "destructive", title: "Sessão expirada" });
        return;
      }

      const now = new Date();
      let startDate: string;
      const endDate = now.toISOString().split("T")[0];

      if (period === "month") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      } else if (period === "quarter") {
        const quarterStart = Math.floor(now.getMonth() / 3) * 3;
        startDate = new Date(now.getFullYear(), quarterStart, 1).toISOString().split("T")[0];
      } else {
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calculate-taxes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            regime,
            period: { start: startDate, end: endDate }
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao calcular");
      }

      setResult(data);

    } catch (error) {
      console.error("Error:", error);
      toast({ variant: "destructive", title: "Erro ao calcular impostos" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPremium) {
      calculateTaxes();
    }
  }, [regime, period, isPremium]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (!isPremium) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md text-center">
            <CardContent className="pt-6">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-warning" />
              <h2 className="text-2xl font-bold mb-2">Funcionalidade Premium</h2>
              <p className="text-muted-foreground mb-4">
                O cálculo automático de impostos está disponível apenas para assinantes Premium.
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

  const meiLimit = 81000;
  const meiProgress = result ? (result.annualProjection / meiLimit) * 100 : 0;

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Calculator className="w-6 h-6 text-primary" />
          Calculadora de Impostos
        </h1>
        <p className="text-muted-foreground">
          Calcule seus impostos automaticamente baseado nos seus ganhos
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">Regime Tributário</label>
          <Select value={regime} onValueChange={setRegime}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mei">MEI (Microempreendedor Individual)</SelectItem>
              <SelectItem value="simples">Simples Nacional</SelectItem>
              <SelectItem value="autonomo">Autônomo (Carnê Leão)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">Período</label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mês Atual</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Ano Atual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button onClick={calculateTaxes} disabled={loading} className="gradient-primary text-primary-foreground">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Recalcular"}
          </Button>
        </div>
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Alerts */}
          {result.alerts.length > 0 && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="p-4">
                <h3 className="font-semibold text-destructive flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5" />
                  Alertas Importantes
                </h3>
                <ul className="space-y-1">
                  {result.alerts.map((alert, i) => (
                    <li key={i} className="text-sm">{alert}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Summary Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Ganhos Brutos</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(result.grossIncome)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Despesas Dedutíveis</p>
                <p className="text-2xl font-bold text-accent">{formatCurrency(result.deductibleExpenses)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Ganho Líquido</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(result.netIncome)}</p>
              </CardContent>
            </Card>

            <Card className="border-warning/50">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total de Impostos</p>
                <p className="text-2xl font-bold text-warning">{formatCurrency(result.taxes.total)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Tax Breakdown */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Detalhamento dos Impostos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {regime === "mei" && result.taxes.das !== undefined && (
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">DAS Mensal</p>
                      <p className="text-xs text-muted-foreground">Documento de Arrecadação do Simples</p>
                    </div>
                    <Badge variant="secondary">{formatCurrency(result.taxes.das)}</Badge>
                  </div>
                )}

                {regime !== "mei" && (
                  <>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">INSS</p>
                        <p className="text-xs text-muted-foreground">Contribuição Previdenciária</p>
                      </div>
                      <Badge variant="secondary">{formatCurrency(result.taxes.inss)}</Badge>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">IRPF</p>
                        <p className="text-xs text-muted-foreground">Imposto de Renda</p>
                      </div>
                      <Badge variant="secondary">{formatCurrency(result.taxes.irpf)}</Badge>
                    </div>
                  </>
                )}

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold">Total Anual Estimado</p>
                    <p className="text-xl font-bold text-warning">
                      {formatCurrency(regime === "mei" ? (result.taxes.das || 0) * 12 : result.taxes.total)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* MEI Progress */}
            {regime === "mei" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Limite MEI 2024</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Projeção Anual</span>
                      <span className={meiProgress > 100 ? "text-destructive font-semibold" : ""}>
                        {formatCurrency(result.annualProjection)} / {formatCurrency(meiLimit)}
                      </span>
                    </div>
                    <Progress 
                      value={Math.min(meiProgress, 100)} 
                      className={meiProgress > 80 ? "bg-warning/20" : ""}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {meiProgress.toFixed(1)}% do limite utilizado
                    </p>
                  </div>

                  {meiProgress > 100 && (
                    <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                      <p className="text-sm text-destructive font-medium flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Você está acima do limite MEI!
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Considere migrar para Simples Nacional ou regularizar sua situação.
                      </p>
                    </div>
                  )}

                  {meiProgress > 80 && meiProgress <= 100 && (
                    <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                      <p className="text-sm text-warning font-medium flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Atenção: Próximo do limite!
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Monitore seus ganhos para não ultrapassar o limite anual.
                      </p>
                    </div>
                  )}

                  {meiProgress <= 80 && (
                    <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                      <p className="text-sm text-accent font-medium flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Situação Regular
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Seus ganhos estão dentro do limite permitido para MEI.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  Recomendações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Projections */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Projeções</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Média Mensal</p>
                  <p className="text-2xl font-bold">{formatCurrency(result.monthlyProjection)}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Projeção Anual</p>
                  <p className="text-2xl font-bold">{formatCurrency(result.annualProjection)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </DashboardLayout>
  );
};

export default TaxCalculator;
