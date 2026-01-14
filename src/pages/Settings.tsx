import { useState } from "react";
import { User, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useProfile, useSubscription, useIsAdmin } from "@/hooks/useUserData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { user } = useAuth();
  const { data: profile, refetch } = useProfile();
  const { data: subscription } = useSubscription();
  const isAdmin = useIsAdmin();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [city, setCity] = useState(profile?.city || "");

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName, phone, city }).eq("user_id", user.id);
    if (error) toast({ variant: "destructive", title: "Erro", description: error.message });
    else { toast({ title: "Perfil atualizado!" }); refetch(); }
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Configurações</h1>
      
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-5 h-5" /> Perfil</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Nome Completo</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
            <div><Label>Email</Label><Input value={profile?.email} disabled /></div>
            <div><Label>Telefone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" /></div>
            <div><Label>Cidade</Label><Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="São Paulo" /></div>
            <Button onClick={handleSave} disabled={loading} className="w-full gradient-primary text-primary-foreground">
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Crown className="w-5 h-5" /> Seu Plano</CardTitle></CardHeader>
          <CardContent>
            <div className="p-6 rounded-xl bg-muted/50 text-center">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-bold mb-4 ${
                isAdmin ? "bg-destructive/10 text-destructive" : 
                subscription?.status === "premium" ? "bg-warning/10 text-warning" : 
                subscription?.status === "pro" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                {isAdmin ? "👑 Admin Premium" : subscription?.plan_name || "Gratuito"}
              </div>
              <p className="text-muted-foreground mb-4">
                {isAdmin ? "Você tem acesso total a todas as funcionalidades!" : 
                 subscription?.status === "free" ? "Faça upgrade para desbloquear mais recursos" : "Obrigado por ser assinante!"}
              </p>
              {!isAdmin && subscription?.status === "free" && (
                <Button className="gradient-accent text-accent-foreground">Fazer Upgrade</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
