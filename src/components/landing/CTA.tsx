import { motion } from "framer-motion";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  "Comece grátis, sem cartão de crédito",
  "Configure em menos de 2 minutos",
  "Suporte em português",
  "Cancele quando quiser",
];

const CTA = () => {
  return (
    <section className="py-20 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsla(217,91%,50%,0.3)_0%,_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsla(152,69%,45%,0.2)_0%,_transparent_50%)]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            Pronto para assumir o{" "}
            <span className="text-gradient-accent">controle</span> das suas
            finanças?
          </h2>
          <p className="text-xl text-primary-foreground/70 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de motoristas e entregadores que já estão
            ganhando mais e gastando menos.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20"
              >
                <CheckCircle className="w-4 h-4 text-accent" />
                <span className="text-sm text-primary-foreground">{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button
              size="lg"
              className="gradient-accent text-accent-foreground shadow-accent-glow hover:opacity-90 transition-opacity text-lg px-8 py-6"
            >
              Começar Agora — É Grátis
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
