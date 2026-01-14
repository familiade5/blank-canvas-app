import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Bot, Send, Sparkles, TrendingUp, Calculator, Target, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useIsPremium } from "@/hooks/useUserData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const AIAdvisor = () => {
  const isPremium = useIsPremium();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const streamChat = async (message: string, type: string = "chat") => {
    setIsLoading(true);
    
    const userMsg: Message = { role: "user", content: message };
    setMessages(prev => [...prev, userMsg]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ variant: "destructive", title: "Sessão expirada" });
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/financial-advisor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ message, type }),
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          toast({ variant: "destructive", title: "Funcionalidade exclusiva Premium" });
          return;
        }
        throw new Error("Erro na API");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Stream não disponível");

      const decoder = new TextDecoder();
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const json = JSON.parse(line.slice(6));
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) {
                assistantContent += delta;
                setMessages(prev => {
                  const last = prev[prev.length - 1];
                  if (last?.role === "assistant") {
                    return prev.map((m, i) => 
                      i === prev.length - 1 ? { ...m, content: assistantContent } : m
                    );
                  }
                  return [...prev, { role: "assistant", content: assistantContent }];
                });
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast({ variant: "destructive", title: "Erro ao processar solicitação" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    const message = input.trim();
    setInput("");
    streamChat(message, activeTab === "chat" ? "chat" : activeTab);
  };

  const quickActions = [
    { 
      icon: TrendingUp, 
      label: "Análise Completa", 
      type: "analysis",
      description: "Análise detalhada dos seus ganhos e despesas"
    },
    { 
      icon: Target, 
      label: "Plano Financeiro", 
      type: "planning",
      description: "Planejamento para maximizar seus ganhos"
    },
    { 
      icon: Calculator, 
      label: "Cálculo de Impostos", 
      type: "taxes",
      description: "Estimativa de impostos e obrigações fiscais"
    },
  ];

  if (!isPremium) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md text-center">
            <CardContent className="pt-6">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-warning" />
              <h2 className="text-2xl font-bold mb-2">Funcionalidade Premium</h2>
              <p className="text-muted-foreground mb-4">
                O Consultor Financeiro com IA está disponível apenas para assinantes Premium.
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
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bot className="w-6 h-6 text-primary" />
              Consultor Financeiro IA
            </h1>
            <p className="text-muted-foreground">
              Seu assistente pessoal para planejamento financeiro
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mb-4">
            <TabsTrigger value="chat">💬 Chat</TabsTrigger>
            <TabsTrigger value="analysis">📊 Análise</TabsTrigger>
            <TabsTrigger value="planning">🎯 Planejamento</TabsTrigger>
            <TabsTrigger value="taxes">🧾 Impostos</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col m-0">
            <Card className="flex-1 flex flex-col">
              <CardContent className="flex-1 flex flex-col p-4">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                      <Bot className="w-16 h-16 text-primary/50 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Olá! Como posso ajudar?</h3>
                      <p className="text-muted-foreground mb-6">
                        Pergunte sobre suas finanças, peça dicas ou solicite uma análise.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl">
                        {quickActions.map((action) => (
                          <Button
                            key={action.type}
                            variant="outline"
                            className="flex flex-col h-auto p-4 gap-2"
                            onClick={() => {
                              setActiveTab(action.type);
                              streamChat(action.description, action.type);
                            }}
                          >
                            <action.icon className="w-6 h-6 text-primary" />
                            <span className="font-medium">{action.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {action.description}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                              msg.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                          </div>
                        </motion.div>
                      ))}
                      {isLoading && messages[messages.length - 1]?.role === "user" && (
                        <div className="flex justify-start">
                          <div className="bg-muted rounded-2xl px-4 py-3">
                            <Loader2 className="w-5 h-5 animate-spin" />
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Digite sua pergunta..."
                    className="min-h-[50px] max-h-[120px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="gradient-primary text-primary-foreground"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="flex-1 m-0">
            <AnalysisContent onAnalyze={(msg) => streamChat(msg, "analysis")} messages={messages} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="planning" className="flex-1 m-0">
            <PlanningContent onPlan={(msg) => streamChat(msg, "planning")} messages={messages} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="taxes" className="flex-1 m-0">
            <TaxesContent onCalculate={(msg) => streamChat(msg, "taxes")} messages={messages} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

const AnalysisContent = ({ onAnalyze, messages, isLoading }: { onAnalyze: (msg: string) => void; messages: Message[]; isLoading: boolean }) => {
  const analysisMessages = messages.filter(m => m.role === "assistant");
  const lastAnalysis = analysisMessages[analysisMessages.length - 1]?.content;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          Análise Financeira Inteligente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          A IA analisa seus dados de ganhos e despesas para identificar padrões, 
          oportunidades de melhoria e fornecer insights personalizados.
        </p>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="h-auto p-4 flex flex-col gap-2"
            onClick={() => onAnalyze("Faça uma análise completa dos meus ganhos e despesas do último mês.")}
            disabled={isLoading}
          >
            <span className="font-medium">📊 Análise Mensal</span>
            <span className="text-xs text-muted-foreground">Visão geral do mês atual</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto p-4 flex flex-col gap-2"
            onClick={() => onAnalyze("Identifique qual app está sendo mais rentável para mim e porque.")}
            disabled={isLoading}
          >
            <span className="font-medium">🏆 Apps Rentáveis</span>
            <span className="text-xs text-muted-foreground">Compare rendimentos</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto p-4 flex flex-col gap-2"
            onClick={() => onAnalyze("Analise minhas despesas e identifique onde posso economizar.")}
            disabled={isLoading}
          >
            <span className="font-medium">💰 Economia</span>
            <span className="text-xs text-muted-foreground">Oportunidades de corte</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto p-4 flex flex-col gap-2"
            onClick={() => onAnalyze("Qual minha média de ganho por hora e por corrida? Como melhorar?")}
            disabled={isLoading}
          >
            <span className="font-medium">⏱️ Eficiência</span>
            <span className="text-xs text-muted-foreground">Ganho por hora/corrida</span>
          </Button>
        </div>

        {lastAnalysis && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Última Análise:</h4>
            <div className="whitespace-pre-wrap text-sm">{lastAnalysis}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const PlanningContent = ({ onPlan, messages, isLoading }: { onPlan: (msg: string) => void; messages: Message[]; isLoading: boolean }) => {
  const planMessages = messages.filter(m => m.role === "assistant");
  const lastPlan = planMessages[planMessages.length - 1]?.content;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Planejamento Financeiro IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Receba um plano personalizado para alcançar suas metas financeiras 
          e maximizar seus ganhos como motorista de aplicativo.
        </p>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="h-auto p-4 flex flex-col gap-2"
            onClick={() => onPlan("Crie um plano para eu ganhar R$ 5.000 líquidos no próximo mês.")}
            disabled={isLoading}
          >
            <span className="font-medium">🎯 Meta Mensal</span>
            <span className="text-xs text-muted-foreground">Plano para atingir R$ 5.000</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto p-4 flex flex-col gap-2"
            onClick={() => onPlan("Como posso otimizar meus horários de trabalho para ganhar mais?")}
            disabled={isLoading}
          >
            <span className="font-medium">🕐 Otimização de Horários</span>
            <span className="text-xs text-muted-foreground">Melhores horários</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto p-4 flex flex-col gap-2"
            onClick={() => onPlan("Crie uma estratégia para reduzir minhas despesas em 20%.")}
            disabled={isLoading}
          >
            <span className="font-medium">📉 Redução de Custos</span>
            <span className="text-xs text-muted-foreground">Estratégia de economia</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto p-4 flex flex-col gap-2"
            onClick={() => onPlan("Como posso criar uma reserva de emergência sendo motorista de app?")}
            disabled={isLoading}
          >
            <span className="font-medium">🏦 Reserva de Emergência</span>
            <span className="text-xs text-muted-foreground">Plano de poupança</span>
          </Button>
        </div>

        {lastPlan && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Seu Plano:</h4>
            <div className="whitespace-pre-wrap text-sm">{lastPlan}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const TaxesContent = ({ onCalculate, messages, isLoading }: { onCalculate: (msg: string) => void; messages: Message[]; isLoading: boolean }) => {
  const taxMessages = messages.filter(m => m.role === "assistant");
  const lastTax = taxMessages[taxMessages.length - 1]?.content;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-warning" />
          Cálculo de Impostos IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Calcule seus impostos, entenda suas obrigações fiscais como MEI ou autônomo, 
          e receba orientações para se manter em dia com a Receita Federal.
        </p>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="h-auto p-4 flex flex-col gap-2"
            onClick={() => onCalculate("Calcule meus impostos como MEI baseado nos meus ganhos.")}
            disabled={isLoading}
          >
            <span className="font-medium">📋 Cálculo MEI</span>
            <span className="text-xs text-muted-foreground">DAS mensal e limites</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto p-4 flex flex-col gap-2"
            onClick={() => onCalculate("Estou ultrapassando o limite do MEI? Preciso me desenquadrar?")}
            disabled={isLoading}
          >
            <span className="font-medium">⚠️ Limite MEI</span>
            <span className="text-xs text-muted-foreground">Verificar excesso</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto p-4 flex flex-col gap-2"
            onClick={() => onCalculate("Quais despesas posso deduzir do imposto de renda como motorista?")}
            disabled={isLoading}
          >
            <span className="font-medium">💵 Deduções</span>
            <span className="text-xs text-muted-foreground">Despesas dedutíveis</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto p-4 flex flex-col gap-2"
            onClick={() => onCalculate("Preciso declarar imposto de renda? Qual o prazo e como fazer?")}
            disabled={isLoading}
          >
            <span className="font-medium">📅 IRPF</span>
            <span className="text-xs text-muted-foreground">Obrigatoriedade e prazos</span>
          </Button>
        </div>

        {lastTax && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Resultado:</h4>
            <div className="whitespace-pre-wrap text-sm">{lastTax}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIAdvisor;
