import { useState } from "react";
import { Plus, Target, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useGoals } from "@/hooks/useUserData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Goals = () => {
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const { data: goals = [], refetch } = useGoals();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleAdd = async () => {
    if (!user || !title || !target) return;
    setLoading(true);
    const { error } = await supabase.from("goals").insert({
      user_id: user.id, title, target_amount: parseFloat(target), current_amount: 0,
    });
    if (error) toast({ variant: "destructive", title: "Erro", description: error.message });
    else { toast({ title: "Meta criada!" }); setTitle(""); setTarget(""); setShowAdd(false); refetch(); }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("goals").delete().eq("id", id);
    refetch();
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Metas Financeiras</h1>
        <Button onClick={() => setShowAdd(true)} className="gradient-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" /> Nova Meta
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
          return (
            <Card key={goal.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{goal.title}</CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(goal.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium">{progress.toFixed(0)}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full gradient-primary" style={{ width: `${Math.min(progress, 100)}%` }} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">{formatCurrency(Number(goal.current_amount))}</span>
                    <span className="font-semibold">{formatCurrency(Number(goal.target_amount))}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {goals.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center text-muted-foreground">
              Nenhuma meta definida. Crie sua primeira meta!
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Meta</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Ganhar R$ 5.000 este mês" /></div>
            <div><Label>Valor Alvo (R$)</Label><Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="5000" /></div>
            <Button onClick={handleAdd} disabled={loading} className="w-full gradient-primary text-primary-foreground">
              {loading ? "Salvando..." : "Criar Meta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Goals;
