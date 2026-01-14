import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Target,
  Plus,
  Calendar,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useEarnings, useExpenses, useGoals, useProfile } from "@/hooks/useUserData";
import AddEarningDialog from "@/components/dashboard/AddEarningDialog";
import AddExpenseDialog from "@/components/dashboard/AddExpenseDialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const Dashboard = () => {
  const [showAddEarning, setShowAddEarning] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  
  const currentMonth = useMemo(() => {
    const start = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const end = format(endOfMonth(new Date()), "yyyy-MM-dd");
    return { start, end };
  }, []);

  const { data: profile } = useProfile();
  const { data: earnings = [], refetch: refetchEarnings } = useEarnings(currentMonth.start, currentMonth.end);
  const { data: expenses = [], refetch: refetchExpenses } = useExpenses(currentMonth.start, currentMonth.end);
  const { data: goals = [] } = useGoals();

  const stats = useMemo(() => {
    const totalEarnings = earnings.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const profit = totalEarnings - totalExpenses;
    const profitMargin = totalEarnings > 0 ? (profit / totalEarnings) * 100 : 0;
    const totalTrips = earnings.reduce((sum, e) => sum + (e.trips_count || 0), 0);
    
    return { totalEarnings, totalExpenses, profit, profitMargin, totalTrips };
  }, [earnings, expenses]);

  // Chart data - earnings by app
  const earningsByApp = useMemo(() => {
    const grouped = earnings.reduce((acc, e) => {
      const app = e.app.charAt(0).toUpperCase() + e.app.slice(1);
      acc[app] = (acc[app] || 0) + Number(e.amount);
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [earnings]);

  // Chart data - expenses by category
  const expensesByCategory = useMemo(() => {
    const categoryLabels: Record<string, string> = {
      fuel: "Combustível",
      maintenance: "Manutenção",
      food: "Alimentação",
      phone: "Celular",
      insurance: "Seguro",
      taxes: "Impostos",
      other: "Outros",
    };
    
    const grouped = expenses.reduce((acc, e) => {
      const category = categoryLabels[e.category] || e.category;
      acc[category] = (acc[category] || 0) + Number(e.amount);
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  // Chart data - last 7 days earnings
  const last7DaysEarnings = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = format(date, "dd/MM");
      days[key] = 0;
    }
    
    earnings.forEach(e => {
      const key = format(new Date(e.date), "dd/MM");
      if (days[key] !== undefined) {
        days[key] += Number(e.amount);
      }
    });
    
    return Object.entries(days).map(([name, ganhos]) => ({ name, ganhos }));
  }, [earnings]);

  const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Olá, {profile?.full_name?.split(" ")[0] || "Motorista"}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAddExpense(true)}
            className="gap-2"
          >
            <TrendingDown className="w-4 h-4" />
            <span className="hidden sm:inline">Despesa</span>
          </Button>
          <Button
            onClick={() => setShowAddEarning(true)}
            className="gap-2 gradient-accent text-accent-foreground"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Ganho</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-l-4 border-l-accent">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs lg:text-sm text-muted-foreground">Ganhos</p>
                  <p className="text-lg lg:text-2xl font-bold text-foreground">
                    {formatCurrency(stats.totalEarnings)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="border-l-4 border-l-destructive">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-xs lg:text-sm text-muted-foreground">Despesas</p>
                  <p className="text-lg lg:text-2xl font-bold text-foreground">
                    {formatCurrency(stats.totalExpenses)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs lg:text-sm text-muted-foreground">Lucro</p>
                  <p className={`text-lg lg:text-2xl font-bold ${stats.profit >= 0 ? "text-accent" : "text-destructive"}`}>
                    {formatCurrency(stats.profit)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="border-l-4 border-l-warning">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs lg:text-sm text-muted-foreground">Corridas</p>
                  <p className="text-lg lg:text-2xl font-bold text-foreground">
                    {stats.totalTrips}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Earnings Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Ganhos - Últimos 7 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7DaysEarnings}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [formatCurrency(value), "Ganhos"]}
                  />
                  <Bar dataKey="ganhos" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expenses by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-destructive" />
              Despesas por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {expensesByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [formatCurrency(value), ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Nenhuma despesa registrada este mês
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Goals */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Earnings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Últimos Ganhos</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <a href="/dashboard/earnings">Ver todos</a>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {earnings.slice(0, 5).map((earning) => (
                <div
                  key={earning.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground capitalize">
                        {earning.app}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(earning.date), "dd/MM/yyyy")}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-accent">
                    +{formatCurrency(Number(earning.amount))}
                  </span>
                </div>
              ))}
              {earnings.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum ganho registrado
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Goals */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Suas Metas</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <a href="/dashboard/goals">Ver todas</a>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {goals.slice(0, 3).map((goal) => {
                const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{goal.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(Number(goal.current_amount))} / {formatCurrency(Number(goal.target_amount))}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full gradient-primary transition-all duration-500"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {goals.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma meta definida
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <AddEarningDialog
        open={showAddEarning}
        onOpenChange={setShowAddEarning}
        onSuccess={() => refetchEarnings()}
      />
      <AddExpenseDialog
        open={showAddExpense}
        onOpenChange={setShowAddExpense}
        onSuccess={() => refetchExpenses()}
      />
    </DashboardLayout>
  );
};

export default Dashboard;
