import { useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2, Edit, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useEarnings } from "@/hooks/useUserData";
import AddEarningDialog from "@/components/dashboard/AddEarningDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Earnings = () => {
  const [showAdd, setShowAdd] = useState(false);
  const { data: earnings = [], refetch } = useEarnings();
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("earnings").delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } else {
      toast({ title: "Ganho excluído" });
      refetch();
    }
  };

  const total = earnings.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Ganhos</h1>
        <Button onClick={() => setShowAdd(true)} className="gradient-accent text-accent-foreground">
          <Plus className="w-4 h-4 mr-2" /> Novo Ganho
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Ganhos</p>
              <p className="text-3xl font-bold text-accent">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(total)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Ganhos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {earnings.map((earning) => (
              <div key={earning.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium capitalize">{earning.app}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(earning.date), "dd/MM/yyyy")} • {earning.trips_count || 0} corridas
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-accent">
                    +{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(earning.amount))}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(earning.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {earnings.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhum ganho registrado</p>
            )}
          </div>
        </CardContent>
      </Card>

      <AddEarningDialog open={showAdd} onOpenChange={setShowAdd} onSuccess={refetch} />
    </DashboardLayout>
  );
};

export default Earnings;
