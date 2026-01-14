import { motion } from "framer-motion";
import { ArrowRight, Play, TrendingUp, Wallet, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="relative min-h-screen gradient-hero overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_hsla(217,91%,50%,0.3)_0%,_transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_hsla(152,69%,45%,0.2)_0%,_transparent_50%)]" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMwLTkuOTQtOC4wNi0xOC0xOC0xOFYwYzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2aC0xMnYxMmMwIDMuMzEtMi42OSA2LTYgNnMtNi0yLjY5LTYtNnYxMmgxMnYtMTJjMC0zLjMxIDIuNjktNiA2LTZzNiAyLjY5IDYgNmMwIDkuOTQgOC4wNiAxOCAxOCAxOHMxOC04LjA2IDE4LTE4LTguMDYtMTgtMTgtMTh6IiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvZz48L3N2Zz4=')] opacity-10" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-28 lg:pt-32 pb-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-sm font-medium text-primary-foreground/80">
                +10.000 motoristas já usam
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6"
            >
              Controle suas{" "}
              <span className="text-gradient-accent">finanças</span> e{" "}
              <span className="text-gradient">maximize seus lucros</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-primary-foreground/70 mb-8 max-w-lg mx-auto lg:mx-0"
            >
              A plataforma completa para motoristas e entregadores de app
              organizarem ganhos, despesas e calcularem o lucro real de cada
              corrida.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Button
                size="lg"
                className="gradient-accent text-accent-foreground shadow-accent-glow hover:opacity-90 transition-opacity"
              >
                Começar Grátis
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Play className="mr-2 w-5 h-5" />
                Ver Demonstração
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-primary-foreground/10"
            >
              {[
                { value: "R$ 2M+", label: "Ganhos rastreados" },
                { value: "10K+", label: "Motoristas ativos" },
                { value: "4.9★", label: "Avaliação média" },
              ].map((stat, index) => (
                <div key={index} className="text-center lg:text-left">
                  <div className="text-2xl sm:text-3xl font-bold text-primary-foreground">
                    {stat.value}
                  </div>
                  <div className="text-sm text-primary-foreground/60">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right Content - Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            {/* Main Dashboard Card */}
            <div className="relative rounded-2xl gradient-glass p-6 shadow-xl border border-primary-foreground/10 backdrop-blur-xl">
              {/* Dashboard Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Resumo do Mês
                  </h3>
                  <p className="text-sm text-muted-foreground">Janeiro 2024</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium">
                  <TrendingUp className="w-4 h-4" />
                  +23%
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-card/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-accent-foreground" />
                    </div>
                    <span className="text-sm text-muted-foreground">Ganhos</span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    R$ 4.850
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-card/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                      <PieChart className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Despesas
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    R$ 1.240
                  </div>
                </div>
              </div>

              {/* Chart Placeholder */}
              <div className="h-40 rounded-xl bg-card/30 border border-border/30 flex items-end justify-around p-4 gap-2">
                {[60, 80, 45, 90, 70, 85, 95].map((height, index) => (
                  <motion.div
                    key={index}
                    className="w-8 rounded-t-md gradient-primary"
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
                  />
                ))}
              </div>

              {/* Profit Summary */}
              <div className="mt-6 p-4 rounded-xl bg-accent/10 border border-accent/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Lucro Líquido
                  </span>
                  <span className="text-2xl font-bold text-accent">
                    R$ 3.610
                  </span>
                </div>
              </div>
            </div>

            {/* Floating Cards */}
            <motion.div
              className="absolute -left-8 top-1/4 p-4 rounded-xl gradient-glass shadow-lg border border-primary-foreground/10 hidden lg:block"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">
                    Meta Atingida!
                  </div>
                  <div className="text-xs text-muted-foreground">
                    R$ 5.000 este mês
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
