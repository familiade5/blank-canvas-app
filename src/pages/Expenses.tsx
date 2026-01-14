import { useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useExpenses } from "@/hooks/useUserData";
import AddExpenseDialog from "@/components/dashboard/AddExpenseDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const categoryLabels: Record<string, string> = {
  fuel: "🛢️ Combustível", maintenance: "🔧 Manutenção", food: "🍔 Alimentação",
  phone: "📱 Celular", insurance: "🛡️ Seguro", taxes: "📋 Impostos", other: "📦 Outros",
};

const Expenses = () => {
  const [showAdd, setShowAdd] = useState(false);
  const { data: expenses = [], refetch } = useExpenses();
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } else {
      toast({ title: "Despesa excluída" });
      refetch();
    }
  };

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Despesas</h1>
        <Button onClick={() => setShowAdd(true)} className="gradient-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" /> Nova Despesa
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Despesas</p>
              <p className="text-3xl font-bold text-destructive">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(total)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Histórico de Despesas</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium">{categoryLabels[expense.category]}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(expense.date), "dd/MM/yyyy")}
                      {expense.description && ` • ${expense.description}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-destructive">
                    -{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(expense.amount))}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {expenses.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhuma despesa registrada</p>}
          </div>
        </CardContent>
      </Card>

      <AddExpenseDialog open={showAdd} onOpenChange={setShowAdd} onSuccess={refetch} />
    </DashboardLayout>
  );
};

export default Expenses;
