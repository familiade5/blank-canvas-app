import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  PieChart,
  Clock,
  Smartphone,
  Shield,
  Zap,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: Wallet,
    title: "Registro de Ganhos",
    description:
      "Registre automaticamente seus ganhos de cada corrida ou entrega, integrado com os principais apps.",
    color: "accent",
  },
  {
    icon: PieChart,
    title: "Controle de Despesas",
    description:
      "Categorize combustível, manutenção, alimentação e todas as despesas do seu trabalho.",
    color: "primary",
  },
  {
    icon: TrendingUp,
    title: "Lucro Real",
    description:
      "Calcule automaticamente seu lucro líquido descontando todas as despesas e impostos.",
    color: "accent",
  },
  {
    icon: BarChart3,
    title: "Relatórios Detalhados",
    description:
      "Visualize gráficos e relatórios completos por dia, semana, mês ou período personalizado.",
    color: "primary",
  },
  {
    icon: Clock,
    title: "Análise de Tempo",
    description:
      "Descubra seus horários mais rentáveis e otimize sua jornada de trabalho.",
    color: "accent",
  },
  {
    icon: Smartphone,
    title: "100% Mobile",
    description:
      "Acesse de qualquer lugar pelo celular, tablet ou computador com sincronização em tempo real.",
    color: "primary",
  },
  {
    icon: Zap,
    title: "Registro Rápido",
    description:
      "Interface simples e intuitiva para registrar ganhos e despesas em segundos.",
    color: "accent",
  },
  {
    icon: Shield,
    title: "Dados Seguros",
    description:
      "Seus dados financeiros protegidos com criptografia de nível bancário.",
    color: "primary",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-20 lg:py-32 bg-background relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsla(217,91%,50%,0.05)_0%,_transparent_70%)]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Funcionalidades
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Tudo que você precisa para{" "}
            <span className="text-gradient">controlar suas finanças</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Ferramentas poderosas e fáceis de usar, desenvolvidas especialmente
            para motoristas e entregadores de aplicativos.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div
                className={`w-12 h-12 rounded-xl ${
                  feature.color === "accent"
                    ? "gradient-accent"
                    : "gradient-primary"
                } flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon
                  className={`w-6 h-6 ${
                    feature.color === "accent"
                      ? "text-accent-foreground"
                      : "text-primary-foreground"
                  }`}
                />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
