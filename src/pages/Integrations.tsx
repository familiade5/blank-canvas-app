import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Link2, 
  Loader2, 
  Check, 
  Camera, 
  FileSpreadsheet, 
  Upload,
  Sparkles,
  ImageIcon,
  FileText,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useIsPremium } from "@/hooks/useUserData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const appInfo = [
  { app: "uber", name: "Uber", icon: "🚗", color: "bg-black" },
  { app: "99", name: "99", icon: "🚕", color: "bg-yellow-500" },
  { app: "ifood", name: "iFood", icon: "🍔", color: "bg-red-500" },
  { app: "rappi", name: "Rappi", icon: "🛵", color: "bg-orange-500" },
  { app: "uber_eats", name: "Uber Eats", icon: "🍕", color: "bg-green-600" },
  { app: "loggi", name: "Loggi", icon: "📦", color: "bg-blue-600" },
  { app: "lalamove", name: "Lalamove", icon: "📬", color: "bg-orange-600" },
];

const Integrations = () => {
  const isPremium = useIsPremium();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    count?: number;
    app?: string;
  } | null>(null);
  const [recentImports, setRecentImports] = useState<{
    type: "image" | "csv";
    app: string;
    count: number;
    date: string;
  }[]>([]);

  const handleFileUpload = async (file: File, type: "image" | "csv") => {
    setUploading(true);
    setUploadResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ variant: "destructive", title: "Sessão expirada", description: "Faça login novamente" });
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-earnings`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar arquivo");
      }

      setUploadResult({
        success: true,
        message: data.message,
        count: data.earnings?.length,
        app: data.app,
      });

      setRecentImports(prev => [
        {
          type,
          app: data.app || "outros",
          count: data.earnings?.length || 0,
          date: new Date().toISOString(),
        },
        ...prev.slice(0, 9),
      ]);

      // Invalidate earnings query to refresh data
      queryClient.invalidateQueries({ queryKey: ["earnings"] });

      toast({
        title: "Sucesso!",
        description: data.message,
      });

    } catch (error: any) {
      console.error("Upload error:", error);
      setUploadResult({
        success: false,
        message: error.message || "Erro ao processar arquivo",
      });
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({ variant: "destructive", title: "Selecione uma imagem válida" });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ variant: "destructive", title: "Imagem muito grande (máx 10MB)" });
        return;
      }
      handleFileUpload(file, "image");
    }
    e.target.value = "";
  };

  const handleCSVSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".csv") && !file.type.includes("csv")) {
        toast({ variant: "destructive", title: "Selecione um arquivo CSV válido" });
        return;
      }
      handleFileUpload(file, "csv");
    }
    e.target.value = "";
  };

  const getAppInfo = (appName: string) => {
    return appInfo.find(a => a.app === appName) || { name: appName, icon: "📱", color: "bg-gray-500" };
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
                A importação automática de dados está disponível apenas para assinantes Premium.
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
          <Link2 className="w-6 h-6 text-primary" />
          Importar Dados
        </h1>
        <p className="text-muted-foreground">
          Importe seus ganhos automaticamente via foto ou arquivo CSV
        </p>
      </div>

      <Tabs defaultValue="photo" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="photo" className="gap-2">
            <Camera className="w-4 h-4" />
            Foto da Tela
          </TabsTrigger>
          <TabsTrigger value="csv" className="gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Arquivo CSV
          </TabsTrigger>
        </TabsList>

        {/* Photo Upload Tab */}
        <TabsContent value="photo">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-2 border-dashed border-primary/30 hover:border-primary/50 transition-colors">
              <CardContent className="p-8">
                <div 
                  className="flex flex-col items-center justify-center text-center cursor-pointer"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleImageSelect}
                    disabled={uploading}
                  />
                  
                  {uploading ? (
                    <div className="space-y-4">
                      <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin" />
                      <div>
                        <p className="font-semibold">Processando imagem...</p>
                        <p className="text-sm text-muted-foreground">
                          A IA está extraindo os dados de ganhos
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Camera className="w-10 h-10 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">
                        Tire uma foto ou selecione da galeria
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Capture a tela de ganhos do app (Uber, 99, iFood, etc)
                      </p>
                      <Button className="gradient-primary text-primary-foreground">
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Selecionar Imagem
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Como funciona?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Abra o app de transporte/entrega</p>
                    <p className="text-sm text-muted-foreground">
                      Vá até a tela de ganhos ou histórico
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Tire uma foto da tela</p>
                    <p className="text-sm text-muted-foreground">
                      Capture toda a informação de ganhos visível
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium">IA extrai automaticamente</p>
                    <p className="text-sm text-muted-foreground">
                      O app identifica valores, datas e o aplicativo
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex flex-wrap gap-2">
                  <p className="w-full text-sm font-medium text-muted-foreground mb-1">
                    Apps suportados:
                  </p>
                  {appInfo.map(app => (
                    <Badge key={app.app} variant="secondary" className="gap-1">
                      {app.icon} {app.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CSV Upload Tab */}
        <TabsContent value="csv">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-2 border-dashed border-primary/30 hover:border-primary/50 transition-colors">
              <CardContent className="p-8">
                <div 
                  className="flex flex-col items-center justify-center text-center cursor-pointer"
                  onClick={() => csvInputRef.current?.click()}
                >
                  <input
                    ref={csvInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={handleCSVSelect}
                    disabled={uploading}
                  />
                  
                  {uploading ? (
                    <div className="space-y-4">
                      <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin" />
                      <div>
                        <p className="font-semibold">Processando CSV...</p>
                        <p className="text-sm text-muted-foreground">
                          Importando dados para o sistema
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <FileSpreadsheet className="w-10 h-10 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">
                        Importar arquivo CSV
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Exporte dados do app e importe aqui
                      </p>
                      <Button className="gradient-primary text-primary-foreground">
                        <Upload className="w-4 h-4 mr-2" />
                        Selecionar CSV
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Formato do CSV</CardTitle>
                <CardDescription>
                  O arquivo deve ter as seguintes colunas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg font-mono text-xs overflow-x-auto">
                  <p className="text-muted-foreground">app,valor,data,viagens,horas</p>
                  <p>uber,150.50,2026-01-14,10,5</p>
                  <p>99,85.00,2026-01-14,6,3</p>
                  <p>ifood,120.00,2026-01-13,15,4</p>
                </div>

                <div className="space-y-2 text-sm">
                  <p className="font-medium">Colunas aceitas:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li><code className="bg-muted px-1 rounded">app</code> - uber, 99, ifood, rappi, etc</li>
                    <li><code className="bg-muted px-1 rounded">valor</code> - Valor em reais</li>
                    <li><code className="bg-muted px-1 rounded">data</code> - Data (DD/MM/YYYY ou YYYY-MM-DD)</li>
                    <li><code className="bg-muted px-1 rounded">viagens</code> - Número de corridas (opcional)</li>
                    <li><code className="bg-muted px-1 rounded">horas</code> - Horas trabalhadas (opcional)</li>
                    <li><code className="bg-muted px-1 rounded">km</code> - Quilômetros (opcional)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Upload Result */}
      {uploadResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <Alert variant={uploadResult.success ? "default" : "destructive"}>
            {uploadResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {uploadResult.success ? "Importação concluída!" : "Erro na importação"}
            </AlertTitle>
            <AlertDescription>
              {uploadResult.message}
              {uploadResult.app && (
                <span className="ml-2">
                  <Badge variant="secondary" className="ml-2">
                    {getAppInfo(uploadResult.app).icon} {getAppInfo(uploadResult.app).name}
                  </Badge>
                </span>
              )}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Recent Imports */}
      {recentImports.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Check className="w-5 h-5 text-accent" />
              Importações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentImports.map((item, index) => {
                const app = getAppInfo(item.app);
                return (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{app.icon}</span>
                      <div>
                        <p className="font-medium">{app.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.type === "image" ? "Via foto" : "Via CSV"} • {" "}
                          {new Date(item.date).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {item.count} {item.count === 1 ? "registro" : "registros"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="mt-6 bg-muted/50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">💡 Dicas para melhor resultado</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Para fotos: capture a tela com boa iluminação e sem cortes</li>
            <li>• Certifique-se que os valores e datas estão visíveis</li>
            <li>• A IA identifica automaticamente o app pela interface</li>
            <li>• Para CSV: use o formato indicado para melhor compatibilidade</li>
          </ul>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Integrations;
