import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Crown,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useIsAdmin, useIsPremium, useSubscription } from "@/hooks/useUserData";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: TrendingUp, label: "Ganhos", path: "/dashboard/earnings" },
  { icon: TrendingDown, label: "Despesas", path: "/dashboard/expenses" },
  { icon: Target, label: "Metas", path: "/dashboard/goals" },
  { icon: BarChart3, label: "Relatórios", path: "/dashboard/reports" },
  { icon: Settings, label: "Configurações", path: "/dashboard/settings" },
];

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: subscription } = useSubscription();
  const isAdmin = useIsAdmin();
  const isPremium = useIsPremium();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getPlanBadge = () => {
    if (isAdmin) {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
          <Shield className="w-3 h-3" />
          Admin
        </span>
      );
    }
    if (subscription?.status === "premium") {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/10 text-warning text-xs font-medium">
          <Crown className="w-3 h-3" />
          Premium
        </span>
      );
    }
    if (subscription?.status === "pro") {
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
          <Crown className="w-3 h-3" />
          Pro
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
        Grátis
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50 flex items-center justify-between px-4">
        <button onClick={() => setSidebarOpen(true)} className="p-2">
          <Menu className="w-6 h-6 text-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Wallet className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-heading font-bold text-foreground">DriveFinance</span>
        </div>
        <div className="w-10" />
      </header>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-foreground/50 z-50"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-50 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 flex items-center justify-between border-b border-border">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                <Wallet className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-heading text-xl font-bold text-foreground">
                DriveFinance
              </span>
            </Link>
            <button
              className="lg:hidden p-1 text-muted-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">
                  {profile?.full_name || "Usuário"}
                </div>
                <div className="mt-1">{getPlanBadge()}</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-glow"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}

            {/* Admin Menu */}
            {isAdmin && (
              <Link
                to="/dashboard/admin"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  location.pathname === "/dashboard/admin"
                    ? "bg-destructive text-destructive-foreground"
                    : "text-destructive hover:bg-destructive/10"
                }`}
              >
                <Shield className="w-5 h-5" />
                <span className="font-medium">Admin</span>
              </Link>
            )}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
