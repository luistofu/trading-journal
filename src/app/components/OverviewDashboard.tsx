import { useMemo } from "react";
import { QuarterData, GrowthAccountData } from "@/app/types";
import { Card, CardContent } from "@/app/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface OverviewDashboardProps {
  quarterData: QuarterData[];
  growthAccounts: GrowthAccountData[];
  selectedYear: number;
  selectedQuarter: string;
  viewMode: "month" | "quarter" | "year";
  onNavigateToGrowth: () => void;
  onNavigateToJournal: () => void;
}

export function OverviewDashboard({
  quarterData,
  growthAccounts,
  selectedYear,
  selectedQuarter,
  viewMode,
  onNavigateToGrowth,
  onNavigateToJournal,
}: OverviewDashboardProps) {
  // Filter data based on selection
  const filteredQuarterData = useMemo(() => {
    let filtered = quarterData.filter((q) => q.year === selectedYear);
    if (selectedQuarter !== "all") {
      filtered = filtered.filter((q) => q.quarter === parseInt(selectedQuarter));
    }
    return filtered;
  }, [quarterData, selectedYear, selectedQuarter]);

  const filteredGrowthData = useMemo(() => {
    let filtered = growthAccounts.filter((acc) => acc.year === selectedYear);
    if (selectedQuarter !== "all") {
      filtered = filtered.filter(
        (acc) => acc.quarter === parseInt(selectedQuarter)
      );
    }
    return filtered;
  }, [growthAccounts, selectedYear, selectedQuarter]);

  // Calculate Growth Account metrics (Sección 1)
  const growthMetrics = useMemo(() => {
    if (filteredGrowthData.length === 0) {
      return {
        capitalInicial: 0,
        capitalActual: 0,
        crecimientoTotal: 0,
        gananciaNeta: 0,
      };
    }

    const capitalInicial = filteredGrowthData[0]?.initialCapital || 0;
    const totalGanancias = filteredGrowthData.reduce(
      (sum, acc) => sum + acc.gananciaMensual,
      0
    );
    const capitalActual = capitalInicial + totalGanancias;
    const crecimientoTotal =
      capitalInicial > 0 ? ((capitalActual - capitalInicial) / capitalInicial) * 100 : 0;

    return {
      capitalInicial,
      capitalActual,
      crecimientoTotal,
      gananciaNeta: totalGanancias,
    };
  }, [filteredGrowthData]);

  // Calculate Trading Journal metrics (Sección 2)
  const journalMetrics = useMemo(() => {
    const allTrades = filteredQuarterData.flatMap((q) =>
      q.months.flatMap((m) => m.trades)
    );

    if (allTrades.length === 0) {
      return {
        winRate: 0,
        avgRR: 0,
        avgRisk: 0,
        totalTrades: 0,
        wins: 0,
        losses: 0,
      };
    }

    const wins = allTrades.filter((t) => t.resultado === "Win").length;
    const losses = allTrades.filter((t) => t.resultado === "Loss").length;
    const winRate = allTrades.length > 0 ? (wins / allTrades.length) * 100 : 0;

    // Calculate average R:R from wins - extract from riesgoBeneficioFinal (format: "1:2")
    const winTrades = allTrades.filter((t) => t.resultado === "Win" && t.riesgoBeneficioFinal);
    const avgRR =
      winTrades.length > 0
        ? winTrades.reduce((sum, t) => {
            const parts = t.riesgoBeneficioFinal.split(":");
            if (parts.length === 2) {
              const reward = parseFloat(parts[1]);
              return sum + (isNaN(reward) ? 0 : reward);
            }
            return sum;
          }, 0) / winTrades.length
        : 0;

    // Calculate average risk - riesgoPorcentaje is string, convert to number
    const avgRisk =
      allTrades.length > 0
        ? allTrades.reduce((sum, t) => sum + (parseFloat(t.riesgoPorcentaje) || 0), 0) / allTrades.length
        : 0;

    return {
      winRate,
      avgRR,
      avgRisk,
      totalTrades: allTrades.length,
      wins,
      losses,
    };
  }, [filteredQuarterData]);

  // Calculate diagnostic metrics (Sección 3)
  const diagnostics = useMemo(() => {
    // Calculate expectation (R)
    const expectation = (journalMetrics.winRate / 100) * journalMetrics.avgRR - 
                       ((100 - journalMetrics.winRate) / 100);
    
    // Determine if period is complete
    const isPeriodComplete = filteredGrowthData.length > 0 && 
                             filteredGrowthData.every(acc => acc.estado === "Completado");

    // Calculate overall health status
    const isRiskControlled = journalMetrics.avgRisk <= 2; // Risk should be ≤ 2%
    const isExpectationPositive = expectation > 0;
    const isConsistent = journalMetrics.totalTrades >= 10; // At least 10 trades for consistency

    let statusColor: "green" | "yellow" | "red" = "yellow";
    let statusText = "En progreso";
    let statusIcon = "🟡";

    if (isRiskControlled && isExpectationPositive && isConsistent) {
      statusColor = "green";
      statusText = "Saludable";
      statusIcon = "🟢";
    } else if (!isRiskControlled || expectation < -0.5) {
      statusColor = "red";
      statusText = "Riesgo";
      statusIcon = "🔴";
    }

    return {
      expectation,
      isPeriodComplete,
      statusColor,
      statusText,
      statusIcon,
      isRiskControlled,
      isExpectationPositive,
      isConsistent,
    };
  }, [journalMetrics, filteredGrowthData]);

  // Dynamic subtitle
  const subtitle = useMemo(() => {
    if (viewMode === "month") return "Vista por Mes";
    if (viewMode === "quarter") return "Vista por Trimestre";
    return "Vista por Año";
  }, [viewMode]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Resumen General
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {subtitle} • {selectedQuarter === "all" ? "Todos los trimestres" : `Q${selectedQuarter}`} • {selectedYear}
        </p>
      </div>

      {/* Métricas principales en cards simples */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Capital Actual */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow border-gray-200 dark:border-gray-700"
          onClick={onNavigateToGrowth}
        >
          <CardContent className="pt-6">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Capital Actual</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${growthMetrics.capitalActual.toLocaleString()}
            </p>
            <p className={`text-xs mt-1 font-medium ${
              growthMetrics.crecimientoTotal >= 0 
                ? "text-green-600 dark:text-green-400" 
                : "text-red-600 dark:text-red-400"
            }`}>
              {growthMetrics.crecimientoTotal >= 0 ? "+" : ""}
              {growthMetrics.crecimientoTotal.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        {/* Win Rate */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow border-gray-200 dark:border-gray-700"
          onClick={onNavigateToJournal}
        >
          <CardContent className="pt-6">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Win Rate</p>
            <p className={`text-2xl font-bold ${
              journalMetrics.winRate >= 50 
                ? "text-green-600 dark:text-green-400" 
                : "text-red-600 dark:text-red-400"
            }`}>
              {journalMetrics.winRate.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {journalMetrics.wins}W • {journalMetrics.losses}L
            </p>
          </CardContent>
        </Card>

        {/* R:R Promedio */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow border-gray-200 dark:border-gray-700"
          onClick={onNavigateToJournal}
        >
          <CardContent className="pt-6">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">R:R Promedio</p>
            <p className={`text-2xl font-bold ${
              journalMetrics.avgRR >= 2 
                ? "text-green-600 dark:text-green-400" 
                : journalMetrics.avgRR >= 1.5 
                ? "text-yellow-600 dark:text-yellow-400" 
                : "text-red-600 dark:text-red-400"
            }`}>
              {journalMetrics.avgRR.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        {/* Trades Totales */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow border-gray-200 dark:border-gray-700"
          onClick={onNavigateToJournal}
        >
          <CardContent className="pt-6">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Trades</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {journalMetrics.totalTrades}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Riesgo: {journalMetrics.avgRisk.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Diagnóstico simplificado */}
      <Card className="border-gray-200 dark:border-gray-700">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Estado General
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xl">{diagnostics.statusIcon}</span>
                <span className={`text-lg font-semibold ${
                  diagnostics.statusColor === "green" 
                    ? "text-green-600 dark:text-green-400" 
                    : diagnostics.statusColor === "yellow" 
                    ? "text-yellow-600 dark:text-yellow-400" 
                    : "text-red-600 dark:text-red-400"
                }`}>
                  {diagnostics.statusText}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                {diagnostics.isRiskControlled ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                )}
                <span>Riesgo {diagnostics.isRiskControlled ? "OK" : "Alto"}</span>
              </div>
              <div className="flex items-center gap-2">
                {diagnostics.isExpectationPositive ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                )}
                <span>Expectativa {diagnostics.expectation >= 0 ? "+" : ""}{diagnostics.expectation.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}