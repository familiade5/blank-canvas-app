import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Gratuito",
    description: "Perfeito para começar a organizar suas finanças",
    price: "R$ 0",
    period: "/mês",
    features: [
      "Registro ilimitado de ganhos",
      "Até 50 despesas por mês",
      "Relatório mensal básico",
      "Suporte por email",
      "1 app conectado",
    ],
    cta: "Começar Grátis",
    popular: false,
  },
  {
    name: "Pro",
    description: "Para motoristas que querem maximizar seus ganhos",
    price: "R$ 19,90",
    period: "/mês",
    features: [
      "Tudo do plano Gratuito",
      "Despesas ilimitadas",
      "Relatórios avançados e gráficos",
      "Análise de horários rentáveis",
      "Apps ilimitados conectados",
      "Metas financeiras",
      "Exportação de dados",
      "Suporte prioritário",
    ],
    cta: "Assinar Pro",
    popular: true,
  },
  {
    name: "Premium",
    description: "Controle total com recursos exclusivos",
    price: "R$ 39,90",
    period: "/mês",
    features: [
      "Tudo do plano Pro",
      "Integração automática com apps",
      "Cálculo automático de impostos",
      "Planejamento financeiro IA",
      "Relatórios personalizados",
      "API para integrações",
      "Consultoria financeira",
      "Suporte 24/7 WhatsApp",
    ],
    cta: "Assinar Premium",
    popular: false,
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-20 lg:py-32 bg-secondary/30 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Planos
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Escolha o plano ideal para{" "}
            <span className="text-gradient-accent">você</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Comece gratuitamente e evolua conforme suas necessidades. Sem
            surpresas, cancele quando quiser.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative p-8 rounded-2xl ${
                plan.popular
                  ? "bg-card border-2 border-primary shadow-xl shadow-primary/10 scale-105"
                  : "bg-card border border-border"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="px-4 py-1.5 rounded-full gradient-primary text-primary-foreground text-sm font-medium flex items-center gap-2 shadow-glow">
                    <Sparkles className="w-4 h-4" />
                    Mais Popular
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-foreground"
                  >
                    <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                className={`w-full ${
                  plan.popular
                    ? "gradient-primary text-primary-foreground shadow-glow"
                    : "variant-outline"
                }`}
                variant={plan.popular ? "default" : "outline"}
                size="lg"
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Bottom Note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center text-sm text-muted-foreground mt-12"
        >
          Todos os planos incluem 14 dias de teste grátis. Sem cartão de crédito
          para começar.
        </motion.p>
      </div>
    </section>
  );
};

export default Pricing;
