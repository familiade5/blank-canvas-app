import { useState } from "react";
import { motion } from "framer-motion";
import { Link2, Loader2, Check, X, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useIsPremium } from "@/hooks/useUserData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AppIntegration {
  app: string;
  name: string;
  icon: string;
  connected: boolean;
  lastSync: string | null;
  description: string;
  color: string;
}

const defaultApps: AppIntegration[] = [
  { app: "uber", name: "Uber", icon: "🚗", connected: false, lastSync: null, description: "Sincronize corridas e ganhos do Uber", color: "bg-black" },
  { app: "99", name: "99", icon: "🚕", connected: false, lastSync: null, description: "Importe dados da 99", color: "bg-yellow-500" },
  { app: "ifood", name: "iFood", icon: "🍔", connected: false, lastSync: null, description: "Conecte entregas do iFood", color: "bg-red-500" },
  { app: "rappi", name: "Rappi", icon: "🛵", connected: false, lastSync: null, description: "Sincronize entregas do Rappi", color: "bg-orange-500" },
  { app: "uber_eats", name: "Uber Eats", icon: "🍕", connected: false, lastSync: null, description: "Entregas do Uber Eats", color: "bg-green-600" },
  { app: "loggi", name: "Loggi", icon: "📦", connected: false, lastSync: null, description: "Entregas da Loggi", color: "bg-blue-600" },
  { app: "lalamove", name: "Lalamove", icon: "📬", connected: false, lastSync: null, description: "Entregas do Lalamove", color: "bg-orange-600" },
];

const Integrations = () => {
  const isPremium = useIsPremium();
  const { toast } = useToast();
  const [apps, setApps] = useState<AppIntegration[]>(defaultApps);
  const [loading, setLoading] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  const handleConnect = async (app: string) => {
    setLoading(app);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ variant: "destructive", title: "Sessão expirada" });
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-integrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: "connect", app }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao conectar");
      }

      // Simulate successful connection
      setApps(prev => prev.map(a => 
        a.app === app ? { ...a, connected: true, lastSync: new Date().toISOString() } : a
      ));

      toast({ 
        title: `${data.message}`,
        description: "A integração foi simulada com sucesso.",
      });

    } catch (error) {
      console.error("Error:", error);
      toast({ variant: "destructive", title: "Erro ao conectar" });
    } finally {
      setLoading(null);
    }
  };

  const handleSync = async (app: string) => {
    setSyncing(app);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ variant: "destructive", title: "Sessão expirada" });
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-integrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: "sync", app }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao sincronizar");
      }

      setApps(prev => prev.map(a => 
        a.app === app ? { ...a, lastSync: new Date().toISOString() } : a
      ));

      toast({ 
        title: data.message,
        description: `${data.synced} registros sincronizados`,
      });

    } catch (error) {
      console.error("Error:", error);
      toast({ variant: "destructive", title: "Erro ao sincronizar" });
    } finally {
      setSyncing(null);
    }
  };

  const handleDisconnect = async (app: string) => {
    setLoading(app);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-integrations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: "disconnect", app }),
        }
      );

      setApps(prev => prev.map(a => 
        a.app === app ? { ...a, connected: false, lastSync: null } : a
      ));

      toast({ title: "App desconectado" });

    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(null);
    }
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
                A integração automática com apps está disponível apenas para assinantes Premium.
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

  const connectedApps = apps.filter(a => a.connected);
  const availableApps = apps.filter(a => !a.connected);

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Link2 className="w-6 h-6 text-primary" />
          Integrações com Apps
        </h1>
        <p className="text-muted-foreground">
          Conecte seus apps de trabalho e sincronize ganhos automaticamente
        </p>
      </div>

      {/* Connected Apps */}
      {connectedApps.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Check className="w-5 h-5 text-accent" />
            Apps Conectados ({connectedApps.length})
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {connectedApps.map((app, index) => (
              <motion.div
                key={app.app}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-accent/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{app.icon}</span>
                        <div>
                          <h3 className="font-semibold">{app.name}</h3>
                          <Badge variant="secondary" className="text-xs bg-accent/10 text-accent">
                            Conectado
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    {app.lastSync && (
                      <p className="text-xs text-muted-foreground mb-3">
                        Última sincronização: {new Date(app.lastSync).toLocaleString("pt-BR")}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleSync(app.app)}
                        disabled={syncing === app.app}
                      >
                        {syncing === app.app ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Sincronizar
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDisconnect(app.app)}
                        disabled={loading === app.app}
                      >
                        {loading === app.app ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Available Apps */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          Apps Disponíveis ({availableApps.length})
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableApps.map((app, index) => (
            <motion.div
              key={app.app}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{app.icon}</span>
                    <div>
                      <h3 className="font-semibold">{app.name}</h3>
                      <p className="text-xs text-muted-foreground">{app.description}</p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="w-full gradient-primary text-primary-foreground"
                    onClick={() => handleConnect(app.app)}
                    disabled={loading === app.app}
                  >
                    {loading === app.app ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Link2 className="w-4 h-4 mr-2" />
                        Conectar
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Info Card */}
      <Card className="mt-8 bg-muted/50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">ℹ️ Como funcionam as integrações?</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Conecte seus apps de transporte e entrega</li>
            <li>• Seus ganhos são sincronizados automaticamente</li>
            <li>• Dados de corridas, entregas e horas trabalhadas são importados</li>
            <li>• Você pode sincronizar manualmente a qualquer momento</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-4">
            Nota: Esta é uma versão de demonstração. APIs reais de Uber, 99 e iFood requerem parcerias comerciais.
          </p>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Integrations;
