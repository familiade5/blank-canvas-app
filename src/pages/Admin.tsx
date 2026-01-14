import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Eye,
  Search,
  Filter,
  MoreHorizontal,
  Crown,
  Shield,
  UserCheck,
  Clock,
  BarChart3,
  PieChart,
  Calendar,
  Mail,
  Phone,
  Car,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useIsAdmin } from "@/hooks/useUserData";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UserWithDetails {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  vehicle_type: string | null;
  vehicle_plate: string | null;
  created_at: string;
  subscription_status: string;
  subscription_plan: string;
  is_admin: boolean;
  total_earnings: number;
  total_expenses: number;
  goals_count: number;
  last_activity: string | null;
}

interface RealtimeActivity {
  id: string;
  user_name: string;
  user_email: string;
  action: string;
  details: string;
  timestamp: string;
}

const Admin = () => {
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [activities, setActivities] = useState<RealtimeActivity[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    proUsers: 0,
    freeUsers: 0,
    totalEarnings: 0,
    totalExpenses: 0,
    activeToday: 0,
  });

  useEffect(() => {
    if (!isAdmin && !loading) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta área.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [isAdmin, loading, navigate, toast]);

  useEffect(() => {
    fetchUsers();
    fetchStats();

    // Set up realtime subscription for activities
    const channel = supabase
      .channel("admin-activities")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "earnings" },
        (payload) => {
          addActivity("earnings", payload);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses" },
        (payload) => {
          addActivity("expenses", payload);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "goals" },
        (payload) => {
          addActivity("goals", payload);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          addActivity("profiles", payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addActivity = async (table: string, payload: any) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", payload.new?.user_id || payload.old?.user_id)
      .single();

    const actionMap: Record<string, Record<string, string>> = {
      earnings: {
        INSERT: "adicionou um ganho",
        UPDATE: "atualizou um ganho",
        DELETE: "removeu um ganho",
      },
      expenses: {
        INSERT: "adicionou uma despesa",
        UPDATE: "atualizou uma despesa",
        DELETE: "removeu uma despesa",
      },
      goals: {
        INSERT: "criou uma meta",
        UPDATE: "atualizou uma meta",
        DELETE: "removeu uma meta",
      },
      profiles: {
        UPDATE: "atualizou seu perfil",
      },
    };

    const newActivity: RealtimeActivity = {
      id: crypto.randomUUID(),
      user_name: profile?.full_name || "Usuário",
      user_email: profile?.email || "",
      action: actionMap[table]?.[payload.eventType] || payload.eventType,
      details:
        payload.new?.amount !== undefined
          ? `R$ ${Number(payload.new.amount).toFixed(2)}`
          : "",
      timestamp: new Date().toISOString(),
    };

    setActivities((prev) => [newActivity, ...prev.slice(0, 49)]);
  };

  const fetchUsers = async () => {
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all subscriptions
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("*");

      // Fetch all user roles
      const { data: roles } = await supabase.from("user_roles").select("*");

      // Fetch all earnings
      const { data: earnings } = await supabase.from("earnings").select("*");

      // Fetch all expenses
      const { data: expenses } = await supabase.from("expenses").select("*");

      // Fetch all goals
      const { data: goals } = await supabase.from("goals").select("*");

      // Combine data
      const usersWithDetails: UserWithDetails[] = (profiles || []).map(
        (profile) => {
          const subscription = subscriptions?.find(
            (s) => s.user_id === profile.user_id
          );
          const userRoles = roles?.filter((r) => r.user_id === profile.user_id);
          const userEarnings = earnings?.filter(
            (e) => e.user_id === profile.user_id
          );
          const userExpenses = expenses?.filter(
            (e) => e.user_id === profile.user_id
          );
          const userGoals = goals?.filter((g) => g.user_id === profile.user_id);

          const totalEarnings =
            userEarnings?.reduce((sum, e) => sum + e.amount, 0) || 0;
          const totalExpenses =
            userExpenses?.reduce((sum, e) => sum + e.amount, 0) || 0;

          // Get last activity date
          const allDates = [
            ...(userEarnings?.map((e) => e.created_at) || []),
            ...(userExpenses?.map((e) => e.created_at) || []),
            ...(userGoals?.map((g) => g.created_at) || []),
          ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

          return {
            id: profile.id,
            user_id: profile.user_id,
            full_name: profile.full_name,
            email: profile.email,
            phone: profile.phone,
            city: profile.city,
            vehicle_type: profile.vehicle_type,
            vehicle_plate: profile.vehicle_plate,
            created_at: profile.created_at,
            subscription_status: subscription?.status || "free",
            subscription_plan: subscription?.plan_name || "Gratuito",
            is_admin: userRoles?.some((r) => r.role === "admin") || false,
            total_earnings: totalEarnings,
            total_expenses: totalExpenses,
            goals_count: userGoals?.length || 0,
            last_activity: allDates[0] || null,
          };
        }
      );

      setUsers(usersWithDetails);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: profiles } = await supabase.from("profiles").select("*");
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("*");
      const { data: earnings } = await supabase.from("earnings").select("*");
      const { data: expenses } = await supabase.from("expenses").select("*");

      const today = new Date().toISOString().split("T")[0];
      const { data: todayEarnings } = await supabase
        .from("earnings")
        .select("user_id")
        .gte("created_at", today);

      const uniqueActiveUsers = new Set(todayEarnings?.map((e) => e.user_id))
        .size;

      setStats({
        totalUsers: profiles?.length || 0,
        premiumUsers:
          subscriptions?.filter((s) => s.status === "premium").length || 0,
        proUsers:
          subscriptions?.filter((s) => s.status === "pro").length || 0,
        freeUsers:
          subscriptions?.filter((s) => s.status === "free").length || 0,
        totalEarnings: earnings?.reduce((sum, e) => sum + e.amount, 0) || 0,
        totalExpenses: expenses?.reduce((sum, e) => sum + e.amount, 0) || 0,
        activeToday: uniqueActiveUsers,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string, isAdmin: boolean) => {
    if (isAdmin) {
      return (
        <Badge variant="destructive" className="gap-1">
          <Shield className="w-3 h-3" />
          Admin
        </Badge>
      );
    }
    switch (status) {
      case "premium":
        return (
          <Badge className="gap-1 bg-warning text-warning-foreground">
            <Crown className="w-3 h-3" />
            Premium
          </Badge>
        );
      case "pro":
        return (
          <Badge className="gap-1 bg-primary text-primary-foreground">
            <Crown className="w-3 h-3" />
            Pro
          </Badge>
        );
      default:
        return <Badge variant="secondary">Grátis</Badge>;
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold font-heading text-foreground">
            Painel Administrativo
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie usuários e monitore a plataforma em tempo real
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="gradient-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Usuários
                </CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {stats.totalUsers}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.activeToday} ativos hoje
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="gradient-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Usuários Premium
                </CardTitle>
                <Crown className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {stats.premiumUsers}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.proUsers} usuários Pro
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="gradient-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ganhos na Plataforma
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">
                  R$ {stats.totalEarnings.toLocaleString("pt-BR")}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total registrado
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="gradient-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Despesas na Plataforma
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  R$ {stats.totalExpenses.toLocaleString("pt-BR")}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total registrado
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="bg-muted">
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="w-4 h-4" />
              Atividade em Tempo Real
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                  <CardTitle>Gerenciar Usuários</CardTitle>
                  <div className="flex gap-2">
                    <div className="relative flex-1 md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar usuário..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Button variant="outline" size="icon">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Ganhos
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          Despesas
                        </TableHead>
                        <TableHead className="hidden lg:table-cell">
                          Última Atividade
                        </TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                              Carregando...
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-8 text-muted-foreground"
                          >
                            Nenhum usuário encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                  {user.full_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium text-foreground">
                                    {user.full_name}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(
                                user.subscription_status,
                                user.is_admin
                              )}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <span className="text-accent font-medium">
                                R$ {user.total_earnings.toLocaleString("pt-BR")}
                              </span>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <span className="text-destructive font-medium">
                                R$ {user.total_expenses.toLocaleString("pt-BR")}
                              </span>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-muted-foreground">
                              {user.last_activity
                                ? format(
                                    new Date(user.last_activity),
                                    "dd/MM/yyyy HH:mm",
                                    { locale: ptBR }
                                  )
                                : "Sem atividade"}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => setSelectedUser(user)}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Ver detalhes
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-accent animate-pulse" />
                  Atividade em Tempo Real
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {activities.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Aguardando atividades...</p>
                      <p className="text-sm mt-1">
                        As ações dos usuários aparecerão aqui em tempo real
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activities.map((activity) => (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            {activity.user_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">
                                {activity.user_name}
                              </span>
                              <span className="text-muted-foreground">
                                {activity.action}
                              </span>
                              {activity.details && (
                                <Badge variant="outline">
                                  {activity.details}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {format(
                                new Date(activity.timestamp),
                                "dd/MM/yyyy HH:mm:ss",
                                { locale: ptBR }
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Distribuição de Planos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-warning" />
                        <span>Premium</span>
                      </div>
                      <span className="font-bold">{stats.premiumUsers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <span>Pro</span>
                      </div>
                      <span className="font-bold">{stats.proUsers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                        <span>Gratuito</span>
                      </div>
                      <span className="font-bold">{stats.freeUsers}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Resumo Financeiro
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total de Ganhos
                      </p>
                      <p className="text-2xl font-bold text-accent">
                        R$ {stats.totalEarnings.toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total de Despesas
                      </p>
                      <p className="text-2xl font-bold text-destructive">
                        R$ {stats.totalExpenses.toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Lucro Líquido
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        R${" "}
                        {(
                          stats.totalEarnings - stats.totalExpenses
                        ).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* User Details Dialog */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalhes do Usuário</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                    {selectedUser.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedUser.full_name}
                    </h3>
                    {getStatusBadge(
                      selectedUser.subscription_status,
                      selectedUser.is_admin
                    )}
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedUser.email}</span>
                  </div>
                  {selectedUser.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedUser.phone}</span>
                    </div>
                  )}
                  {selectedUser.city && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedUser.city}</span>
                    </div>
                  )}
                  {selectedUser.vehicle_type && (
                    <div className="flex items-center gap-2 text-sm">
                      <Car className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {selectedUser.vehicle_type}{" "}
                        {selectedUser.vehicle_plate &&
                          `- ${selectedUser.vehicle_plate}`}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>
                      Cadastrado em{" "}
                      {format(new Date(selectedUser.created_at), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-accent">
                      R$ {selectedUser.total_earnings.toLocaleString("pt-BR")}
                    </p>
                    <p className="text-xs text-muted-foreground">Ganhos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-destructive">
                      R$ {selectedUser.total_expenses.toLocaleString("pt-BR")}
                    </p>
                    <p className="text-xs text-muted-foreground">Despesas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {selectedUser.goals_count}
                    </p>
                    <p className="text-xs text-muted-foreground">Metas</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Admin;
