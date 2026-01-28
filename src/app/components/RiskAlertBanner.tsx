import { AlertTriangle, XCircle, Bell, X } from "lucide-react";
import { useState, useEffect } from "react";

interface RiskAlertBannerProps {
  riskPercentage: number;
}

export function RiskAlertBanner({ riskPercentage }: RiskAlertBannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Abrir automáticamente cuando se alcanza o supera el 6%
  useEffect(() => {
    if (riskPercentage >= 6) {
      setIsOpen(true);
    }
  }, [riskPercentage]);
  
  // Solo mostrar si el riesgo es 6% o mayor
  if (riskPercentage < 6) {
    return null;
  }

  const isCritical = riskPercentage >= 6;

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 rounded-full p-3 sm:p-3 shadow-2xl transition-all hover:scale-110 ${
          isCritical
            ? "bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            : "bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700"
        }`}
      >
        <Bell className="w-5 h-5 text-white animate-pulse" />
        
        {/* Badge de notificación */}
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center text-xs font-bold text-red-600 border-2 border-red-600">
          1
        </span>
      </button>

      {/* Modal de alerta */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Contenido de la alerta */}
          <div className="fixed bottom-4 sm:bottom-24 left-4 right-4 sm:left-auto sm:right-6 z-50 sm:w-96">
            <div
              className={`rounded-xl border-2 p-4 sm:p-6 shadow-2xl animate-in slide-in-from-bottom ${
                isCritical
                  ? "bg-red-50 dark:bg-red-950/95 border-red-600 dark:border-red-500"
                  : "bg-orange-50 dark:bg-orange-950/95 border-orange-600 dark:border-orange-500"
              }`}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0">
                  {isCritical ? (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-600 dark:bg-red-600 flex items-center justify-center">
                      <XCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-600 dark:bg-orange-600 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3
                      className={`font-bold text-base sm:text-lg ${
                        isCritical
                          ? "text-red-800 dark:text-red-200"
                          : "text-orange-800 dark:text-orange-200"
                      }`}
                    >
                      {isCritical ? "🚨 RIESGO CRÍTICO" : "⚠️ ALERTA DE RIESGO"}
                    </h3>
                    
                    <button
                      onClick={() => setIsOpen(false)}
                      className={`flex-shrink-0 p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${
                        isCritical
                          ? "text-red-700 dark:text-red-300"
                          : "text-orange-700 dark:text-orange-300"
                      }`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <p
                    className={`text-xs sm:text-sm leading-relaxed mb-2 sm:mb-3 ${
                      isCritical
                        ? "text-red-700 dark:text-red-300"
                        : "text-orange-700 dark:text-orange-300"
                    }`}
                  >
                    {isCritical
                      ? `Has alcanzado el límite máximo de riesgo mensual (${riskPercentage.toFixed(2)}% de 6%).`
                      : `Has alcanzado el límite de riesgo mensual (${riskPercentage.toFixed(2)}% de 6%).`}
                  </p>
                  
                  <p
                    className={`text-xs sm:text-sm font-semibold ${
                      isCritical
                        ? "text-red-800 dark:text-red-200"
                        : "text-orange-800 dark:text-orange-200"
                    }`}
                  >
                    {isCritical
                      ? "⛔ NO realizar más trades este mes para proteger tu capital."
                      : "💡 Considera reducir el riesgo en tus próximos trades."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}