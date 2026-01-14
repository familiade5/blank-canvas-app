import { motion } from "framer-motion";
import { UserPlus, Receipt, BarChart2, Target } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Crie sua conta grátis",
    description:
      "Cadastre-se em menos de 1 minuto. Sem cartão de crédito, sem compromisso.",
  },
  {
    icon: Receipt,
    step: "02",
    title: "Registre suas atividades",
    description:
      "Adicione ganhos e despesas facilmente. Interface simples e rápida para seu dia a dia.",
  },
  {
    icon: BarChart2,
    step: "03",
    title: "Acompanhe seus resultados",
    description:
      "Visualize relatórios claros e entenda exatamente quanto você está ganhando.",
  },
  {
    icon: Target,
    step: "04",
    title: "Alcance suas metas",
    description:
      "Defina objetivos financeiros e acompanhe seu progresso em tempo real.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 lg:py-32 bg-secondary/30 relative">
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
            Como Funciona
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Simples como <span className="text-gradient-accent">dirigir</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Em apenas 4 passos você terá controle total das suas finanças.
            Comece agora mesmo!
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-y-1/2" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative text-center"
              >
                {/* Step Number Background */}
                <div className="relative mx-auto w-24 h-24 mb-6">
                  <div className="absolute inset-0 rounded-full bg-card border-2 border-border" />
                  <div className="absolute inset-2 rounded-full gradient-primary flex items-center justify-center shadow-glow">
                    <step.icon className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-sm font-bold shadow-accent-glow">
                    {step.step}
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
