import { BookOpen, TrendingUp, FileText, BarChart3 } from "lucide-react";

interface MainNavigationProps {
  activeView: "journal" | "growth" | "notes" | "reports";
  onViewChange: (view: "journal" | "growth" | "notes" | "reports") => void;
}

export function MainNavigation({ activeView, onViewChange }: MainNavigationProps) {
  const navItems = [
    {
      id: "journal" as const,
      label: "Trading Journal",
      icon: BookOpen,
      description: "Registro de trades",
    },
    {
      id: "growth" as const,
      label: "Growth Account",
      icon: TrendingUp,
      description: "Cuentas y evolución",
    },
    {
      id: "notes" as const,
      label: "Notas",
      icon: FileText,
      description: "Diario personal",
    },
    {
      id: "reports" as const,
      label: "Reportes",
      icon: BarChart3,
      description: "Análisis y métricas",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`
              relative p-6 rounded-xl border-2 transition-all duration-200
              text-left hover:scale-[1.02] active:scale-[0.98]
              ${
                isActive
                  ? "bg-[#416E87] border-[#416E87] text-white shadow-lg"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-[#416E87] hover:shadow-md"
              }
            `}
          >
            <div className="flex items-start gap-4">
              <div
                className={`
                  p-3 rounded-lg transition-colors
                  ${
                    isActive
                      ? "bg-white/20"
                      : "bg-[#416E87]/10 dark:bg-[#416E87]/20"
                  }
                `}
              >
                <Icon
                  className={`
                    w-6 h-6
                    ${isActive ? "text-white" : "text-[#416E87]"}
                  `}
                />
              </div>

              <div className="flex-1 min-w-0">
                <h3
                  className={`
                    font-semibold text-lg mb-1
                    ${
                      isActive
                        ? "text-white"
                        : "text-gray-900 dark:text-white"
                    }
                  `}
                >
                  {item.label}
                </h3>
                <p
                  className={`
                    text-sm
                    ${
                      isActive
                        ? "text-white/80"
                        : "text-gray-500 dark:text-gray-400"
                    }
                  `}
                >
                  {item.description}
                </p>
              </div>

              {/* Active Indicator */}
              {isActive && (
                <div className="absolute top-4 right-4">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}