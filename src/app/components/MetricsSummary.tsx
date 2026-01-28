import { TrendingUp, AlertCircle, CheckCircle, XCircle, Activity } from "lucide-react";

interface SummaryMetrics {
  totalTrades: number;
  riesgoAcumulado: number;
  limiteMaximo: number;
  riesgoRestante: number;
  porcentajeWins: number;
  porcentajeLoss: number;
  estado: "Normal" | "Alerta" | "Crítico";
}

interface MetricsSummaryProps {
  metrics: SummaryMetrics;
}

export function MetricsSummary({ metrics }: MetricsSummaryProps) {
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Normal":
        return "bg-green-100 text-green-800 border-green-200";
      case "Alerta":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Crítico":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
      {/* Total Trades */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <span className="text-sm font-bold text-gray-800 dark:text-gray-200 block mb-2">Total Trades</span>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[#416E87]" />
          <p className="text-2xl font-bold dark:text-white">{metrics.totalTrades}</p>
        </div>
      </div>

      {/* Riesgo Acumulado */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <span className="text-sm font-bold text-gray-800 dark:text-gray-200 block mb-2">Riesgo Acumulado</span>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-500" />
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {metrics.riesgoAcumulado.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* % Wins */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <span className="text-sm font-bold text-gray-800 dark:text-gray-200 block mb-2">% Wins</span>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {metrics.porcentajeWins.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* % Loss */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <span className="text-sm font-bold text-gray-800 dark:text-gray-200 block mb-2">% Loss</span>
        <div className="flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-500" />
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {metrics.porcentajeLoss.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Riesgo Restante */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <span className="text-sm font-bold text-gray-800 dark:text-gray-200 block mb-2">Riesgo Restante</span>
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {metrics.riesgoRestante.toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
}