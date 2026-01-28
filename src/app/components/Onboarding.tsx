import { useState, useEffect } from "react";
import { X, CheckCircle, ArrowRight, TrendingUp, Target, Shield, BookOpen } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { motion, AnimatePresence } from "motion/react";

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "¡Bienvenido a SkillX Trading Journal!",
      description: "Tu herramienta educativa para registrar y analizar trades de manera profesional. Vamos a hacer un recorrido rápido.",
      icon: "👋",
      color: "#416E87",
      feature: "Comienza tu journey como trader profesional",
      IconComponent: BookOpen,
    },
    {
      title: "Trading Journal",
      description: "Registra tus trades diarios con detalles completos: par, dirección, sesión, riesgo, resultado y más. La navegación con teclado hace que sea súper rápido.",
      icon: "📊",
      color: "#10b981",
      feature: "Sistema de registro organizado por trimestres",
      IconComponent: TrendingUp,
    },
    {
      title: "Growth Account",
      description: "Gestiona múltiples cuentas de trading, establece metas mensuales y monitorea tu progreso en cada ciclo de evaluación.",
      icon: "📈",
      color: "#8b5cf6",
      feature: "Monitorea el crecimiento de todas tus cuentas",
      IconComponent: Target,
    },
    {
      title: "Sistema de Alertas",
      description: "Recibe alertas cuando alcances el límite de riesgo del 6%. El sistema te avisará automáticamente para proteger tu capital.",
      icon: "⚠️",
      color: "#f59e0b",
      feature: "Gestión de riesgo inteligente y automática",
      IconComponent: Shield,
    },
    {
      title: "¡Todo listo!",
      description: "Ahora estás preparado para comenzar tu journey como trader. Recuerda: la consistencia es clave. ¡Éxito!",
      icon: "🚀",
      color: "#416E87",
      feature: "Empieza a registrar tus trades ahora",
      IconComponent: CheckCircle,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "Escape") {
        handleSkip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep]);

  const step = steps[currentStep];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-3xl w-full relative overflow-hidden"
      >
        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0 opacity-10"
          animate={{
            background: [
              `radial-gradient(circle at 20% 50%, ${step.color} 0%, transparent 50%)`,
              `radial-gradient(circle at 80% 50%, ${step.color} 0%, transparent 50%)`,
              `radial-gradient(circle at 20% 50%, ${step.color} 0%, transparent 50%)`,
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              backgroundColor: step.color,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut",
            }}
          />
        ))}

        <div className="relative p-8 sm:p-12">
          {/* Close button */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSkip}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </motion.button>

          {/* Progress indicator */}
          <div className="flex gap-2 mb-10">
            {steps.map((_, index) => (
              <motion.div
                key={index}
                className="h-2 flex-1 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700"
                initial={false}
              >
                <motion.div
                  className="h-full"
                  style={{ backgroundColor: step.color }}
                  initial={{ width: "0%" }}
                  animate={{
                    width: index <= currentStep ? "100%" : "0%",
                  }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </motion.div>
            ))}
          </div>

          {/* Content with AnimatePresence for smooth transitions */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center mb-10"
            >
              {/* Animated icon with bounce */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  damping: 15,
                  stiffness: 200,
                  delay: 0.1,
                }}
                className="inline-block mb-6"
              >
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="text-7xl sm:text-8xl"
                >
                  {step.icon}
                </motion.div>
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-white mb-4"
              >
                {step.title}
              </motion.h2>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-6 max-w-xl mx-auto"
              >
                {step.description}
              </motion.p>

              {/* Feature highlight with icon */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#416E87]/10 to-[#416E87]/5 border border-[#416E87]/20"
              >
                <step.IconComponent className="w-5 h-5 text-[#416E87]" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {step.feature}
                </span>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  <Button
                    onClick={handlePrev}
                    variant="outline"
                    className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                    Anterior
                  </Button>
                </motion.div>
              )}
              <Button
                onClick={handleSkip}
                variant="ghost"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Saltar tutorial
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <motion.span
                key={currentStep}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm font-medium text-gray-500 dark:text-gray-400"
              >
                {currentStep + 1} de {steps.length}
              </motion.span>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleNext}
                  className="bg-[#416E87] hover:bg-[#345566] text-white shadow-lg"
                  style={{ backgroundColor: step.color }}
                >
                  {currentStep < steps.length - 1 ? (
                    <>
                      Siguiente
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Comenzar
                      <CheckCircle className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Keyboard navigation hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mt-6"
          >
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Usa las teclas ← → para navegar
            </p>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}