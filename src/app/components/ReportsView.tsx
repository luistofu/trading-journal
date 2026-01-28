import { useState, useMemo, useEffect } from "react";
import { QuarterData, GrowthAccountData } from "@/app/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
import { TrendingUp, TrendingDown, Target, BarChart3, Calendar, DollarSign, Percent, AlertTriangle, PieChart as PieChartIcon } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from "recharts";
import { Badge } from "@/app/components/ui/badge";
import { GrowthDashboardContent } from "@/app/components/GrowthDashboardContent";
import { OverviewDashboard } from "@/app/components/OverviewDashboard";
import { getTradingQuarterBundle } from "@/app/data/tradingRepo";

interface ReportsViewProps {
  quarterData: QuarterData[];
  growthAccounts: GrowthAccountData[];
}

export function ReportsView({ quarterData, growthAccounts }: ReportsViewProps) {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("all");
  const [showTarget, setShowTarget] = useState(true);
  const [viewMode, setViewMode] = useState<"month" | "quarter" | "year">("year");
  const [activeTab, setActiveTab] = useState("overview");

  const [reportQuarterData, setReportQuarterData] = useState<QuarterData[]>([]);
  const [isLoadingQuarters, setIsLoadingQuarters] = useState(false);
  const [loadQuartersError, setLoadQuartersError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setIsLoadingQuarters(true);
    setLoadQuartersError(null);

    const load = async () => {
      if (selectedQuarter === "all") {
        const bundles = await Promise.all([
          getTradingQuarterBundle(selectedYear, 1),
          getTradingQuarterBundle(selectedYear, 2),
          getTradingQuarterBundle(selectedYear, 3),
          getTradingQuarterBundle(selectedYear, 4),
        ]);
        return bundles;
      }

      const q = parseInt(selectedQuarter);
      if (q !== 1 && q !== 2 && q !== 3 && q !== 4) return [];
      return [await getTradingQuarterBundle(selectedYear, q as 1 | 2 | 3 | 4)];
    };

    load()
      .then((bundles) => {
        if (cancelled) return;
        setReportQuarterData(bundles);
      })
      .catch((e) => {
        if (cancelled) return;
        setLoadQuartersError(e instanceof Error ? e.message : String(e));
        setReportQuarterData([]);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoadingQuarters(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedYear, selectedQuarter]);

  // Available years
  const availableYears = Array.from(
    new Set([
      ...quarterData.map((q) => q.year),
      ...reportQuarterData.map((q) => q.year),
      ...growthAccounts.map((a) => a.year),
      2025,
      2026,
      2027,
    ])
  ).sort((a, b) => b - a);

  // Filter data by selected year
  const yearQuarters = reportQuarterData.filter((q) => q.year === selectedYear);
  const yearAccounts = growthAccounts.filter((a) => a.year === selectedYear);

  // Calculate Trading Journal Metrics
  const tradingMetrics = useMemo(() => {
    const allTrades = yearQuarters.flatMap((q) =>
      q.months.flatMap((m) => m.trades)
    );

    const totalTrades = allTrades.length;
    const wins = allTrades.filter((t) => t.resultado === "Win").length;
    const losses = allTrades.filter((t) => t.resultado === "Loss").length;
    const breakEven = allTrades.filter((t) => t.resultado === "Break Even").length;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

    // Percentages for pie chart
    const winPercentage = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const lossPercentage = totalTrades > 0 ? (losses / totalTrades) * 100 : 0;
    const breakEvenPercentage = totalTrades > 0 ? (breakEven / totalTrades) * 100 : 0;

    // Sesiones
    const sessionStats = {
      London: allTrades.filter((t) => t.sesion === "London").length,
      "New York": allTrades.filter((t) => t.sesion === "New York").length,
      Asian: allTrades.filter((t) => t.sesion === "Asian").length,
      Sydney: allTrades.filter((t) => t.sesion === "Sydney").length,
    };

    const bestSession =
      Object.entries(sessionStats).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    // Buy vs Sell
    const buyTrades = allTrades.filter((t) => t.buySell === "Buy").length;
    const sellTrades = allTrades.filter((t) => t.buySell === "Sell").length;

    // Riesgo Total
    const totalRisk = allTrades.reduce((sum, t) => sum + (Number(t.riesgoPorcentaje) || 0), 0);
    const avgRisk = totalTrades > 0 ? totalRisk / totalTrades : 0;
    const maxRisk = 6;
    const remainingRisk = Math.max(0, maxRisk - totalRisk);
    const riskPercentage = (totalRisk / maxRisk) * 100;

    // R:R Average
    const tradesWithRR = allTrades.filter(t => t.riesgoBeneficioFinal && t.riesgoBeneficioFinal.includes(":"));
    const avgRR = tradesWithRR.length > 0 
      ? tradesWithRR.reduce((sum, t) => {
          const parts = t.riesgoBeneficioFinal.split(":");
          if (parts.length === 2) {
            const reward = parseFloat(parts[1]);
            return sum + (isNaN(reward) ? 0 : reward);
          }
          return sum;
        }, 0) / tradesWithRR.length 
      : 0;

    // Pares más operados
    const pairCounts: Record<string, number> = {};
    allTrades.forEach((t) => {
      if (t.par) {
        pairCounts[t.par] = (pairCounts[t.par] || 0) + 1;
      }
    });
    const topPair = Object.entries(pairCounts).sort((a, b) => b[1] - a[1])[0];

    // Por trimestre
    const quarterlyStats = yearQuarters.map((q) => {
      const qTrades = q.months.flatMap((m) => m.trades);
      const qWins = qTrades.filter((t) => t.resultado === "Win").length;
      const qTotal = qTrades.length;
      const qWinRate = qTotal > 0 ? (qWins / qTotal) * 100 : 0;

      return {
        quarter: `Q${q.quarter}`,
        trades: qTotal,
        winRate: qWinRate,
      };
    });

    return {
      totalTrades,
      wins,
      losses,
      breakEven,
      winRate,
      winPercentage,
      lossPercentage,
      breakEvenPercentage,
      sessionStats,
      bestSession,
      buyTrades,
      sellTrades,
      totalRisk,
      avgRisk,
      maxRisk,
      remainingRisk,
      riskPercentage,
      avgRR,
      topPair,
      quarterlyStats,
    };
  }, [yearQuarters]);

  // Pie chart data
  const pieData = [
    { name: "Win", value: tradingMetrics.winPercentage, count: tradingMetrics.wins, color: "#10b981" },
    { name: "Loss", value: tradingMetrics.lossPercentage, count: tradingMetrics.losses, color: "#ef4444" },
    { name: "Break Even", value: tradingMetrics.breakEvenPercentage, count: tradingMetrics.breakEven, color: "#6b7280" },
  ].filter(item => item.value > 0);

  // Risk status
  const getRiskColor = () => {
    if (tradingMetrics.riskPercentage >= 100) return "bg-red-500";
    if (tradingMetrics.riskPercentage >= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getRiskStatus = () => {
    if (tradingMetrics.riskPercentage >= 100) return { label: "EXCEDIDO", color: "text-red-500" };
    if (tradingMetrics.riskPercentage >= 80) return { label: "ALERTA", color: "text-yellow-500" };
    return { label: "NORMAL", color: "text-green-500" };
  };

  const riskStatus = getRiskStatus();

  // Calculate Growth Account Metrics
  const growthMetrics = useMemo(() => {
    const totalAccounts = yearAccounts.length;
    const completedAccounts = yearAccounts.filter(
      (a) => a.estado === "Completado"
    ).length;
    const failedAccounts = yearAccounts.filter(
      (a) => a.estado === "Fallido"
    ).length;

    const totalCapital = yearAccounts.reduce(
      (sum, a) => sum + a.initialCapital,
      0
    );
    const totalGains = yearAccounts.reduce(
      (sum, a) => sum + a.gananciaMensual,
      0
    );
    const totalTargets = yearAccounts.reduce(
      (sum, a) => sum + a.monthlyTarget,
      0
    );

    const avgWinRate =
      totalAccounts > 0
        ? yearAccounts.reduce((sum, a) => sum + a.promedioMes, 0) / totalAccounts
        : 0;

    // Por propósito
    const purposeStats = {
      Práctica: yearAccounts.filter((a) => a.proposito === "Práctica").length,
      Evaluación: yearAccounts.filter((a) => a.proposito === "Evaluación")
        .length,
      Fondeada: yearAccounts.filter((a) => a.proposito === "Fondeada").length,
    };

    return {
      totalAccounts,
      completedAccounts,
      failedAccounts,
      totalCapital,
      totalGains,
      totalTargets,
      avgWinRate,
      successRate:
        totalAccounts > 0 ? (completedAccounts / totalAccounts) * 100 : 0,
      purposeStats,
    };
  }, [yearAccounts]);

  return (
    <div className="space-y-6">
      {loadQuartersError && (
        <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-300">
          {loadQuartersError}
        </div>
      )}

      {isLoadingQuarters && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm text-gray-600 dark:text-gray-400">
          Cargando reportes...
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-[#416E87]/10 via-transparent to-transparent border-l-4 border-[#416E87] rounded-xl p-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[#416E87]/10">
              <BarChart3 className="w-6 h-6 text-[#416E87]" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Reportes y Análisis
            </h1>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Métricas detalladas de tu desempeño como trader profesional
          </p>
        </div>

        <Select
          value={selectedYear.toString()}
          onValueChange={(value) => setSelectedYear(parseInt(value))}
        >
          <SelectTrigger className="w-40 h-12 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-[#416E87] transition-colors font-semibold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 border-2 border-gray-200 dark:border-gray-700 p-1.5 rounded-xl shadow-sm">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#416E87] data-[state=active]:to-[#2d4e5e] data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold px-6"
          >
            Resumen General
          </TabsTrigger>
          <TabsTrigger 
            value="trading"
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#416E87] data-[state=active]:to-[#2d4e5e] data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold px-6"
          >
            Trading Journal
          </TabsTrigger>
          <TabsTrigger 
            value="growth"
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#416E87] data-[state=active]:to-[#2d4e5e] data-[state=active]:text-white data-[state=active]:shadow-lg font-semibold px-6"
          >
            Growth Account
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <OverviewDashboard
            quarterData={quarterData}
            growthAccounts={growthAccounts}
            selectedYear={selectedYear}
            selectedQuarter={selectedQuarter}
            viewMode={viewMode}
            onNavigateToGrowth={() => setActiveTab("growth")}
            onNavigateToJournal={() => setActiveTab("trading")}
          />
        </TabsContent>

        {/* Trading Journal Tab */}
        <TabsContent value="trading" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Par Más Operado */}
            <Card className="border-2 border-[#416E87]/30 hover:border-[#416E87] hover:shadow-xl transition-all duration-300 group overflow-hidden rounded-xl bg-gradient-to-br from-[#416E87]/5 to-white dark:from-[#416E87]/10 dark:to-gray-800/50">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#416E87]/10 rounded-full blur-2xl group-hover:bg-[#416E87]/20 transition-colors" />
              <CardHeader className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-md bg-[#416E87]/10">
                    <Target className="w-4 h-4 text-[#416E87]" />
                  </div>
                  <CardTitle className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Par Más Operado
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-[#416E87] mb-1">
                  {tradingMetrics.topPair?.[0] || "N/A"}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {tradingMetrics.topPair?.[1] || 0} trades realizados
                </p>
              </CardContent>
            </Card>

            {/* Mejor Sesión */}
            <Card className="border-2 border-green-200 dark:border-green-800/30 hover:border-green-400 hover:shadow-xl transition-all duration-300 group overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-white dark:from-green-900/10 dark:to-gray-800/50">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-colors" />
              <CardHeader className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-md bg-green-500/10">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </div>
                  <CardTitle className="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">
                    Mejor Sesión
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {tradingMetrics.bestSession}
                </div>
                <p className="text-sm text-green-600/70 dark:text-green-400/70 font-medium">
                  {tradingMetrics.sessionStats[
                    tradingMetrics.bestSession as keyof typeof tradingMetrics.sessionStats
                  ] || 0}{" "}
                  trades ejecutados
                </p>
              </CardContent>
            </Card>

            {/* Riesgo Promedio */}
            <Card className="border-2 border-orange-200 dark:border-orange-800/30 hover:border-orange-400 hover:shadow-xl transition-all duration-300 group overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/10 dark:to-gray-800/50">
              <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-colors" />
              <CardHeader className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-md bg-orange-500/10">
                    <Percent className="w-4 h-4 text-orange-500" />
                  </div>
                  <CardTitle className="text-sm font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                    Riesgo Promedio
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div
                  className={`text-3xl font-bold mb-1 ${
                    tradingMetrics.avgRisk <= 1
                      ? "text-green-600 dark:text-green-400"
                      : tradingMetrics.avgRisk <= 2
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {tradingMetrics.avgRisk.toFixed(2)}%
                </div>
                <p className="text-sm text-orange-600/70 dark:text-orange-400/70 font-medium">
                  Por trade individual
                </p>
              </CardContent>
            </Card>

            {/* Buy vs Sell */}
            <Card className="border-2 border-gray-200 dark:border-gray-700 hover:border-[#416E87] hover:shadow-xl transition-all duration-300 group overflow-hidden rounded-xl">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gray-200/30 dark:bg-gray-700/30 rounded-full blur-2xl group-hover:bg-[#416E87]/10 transition-colors" />
              <CardHeader className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-800">
                    <BarChart3 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <CardTitle className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Buy vs Sell
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-900/10">
                    <span className="text-green-600 dark:text-green-400 font-bold text-sm">
                      Buy
                    </span>
                    <span className="text-green-600 dark:text-green-400 font-bold text-lg">
                      {tradingMetrics.buyTrades}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-900/10">
                    <span className="text-red-600 dark:text-red-400 font-bold text-sm">
                      Sell
                    </span>
                    <span className="text-red-600 dark:text-red-400 font-bold text-lg">
                      {tradingMetrics.sellTrades}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Riesgo Total */}
            <Card className="border-2 border-red-200 dark:border-red-800/30 hover:border-red-400 hover:shadow-xl transition-all duration-300 group overflow-hidden rounded-xl bg-gradient-to-br from-red-50 to-white dark:from-red-900/10 dark:to-gray-800/50">
              <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-colors" />
              <CardHeader className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-md bg-red-500/10">
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  </div>
                  <CardTitle className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                    Riesgo Total Usado
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {tradingMetrics.totalRisk.toFixed(2)}%
                </div>
                <p className="text-sm text-red-600/70 dark:text-red-400/70 font-medium">
                  Acumulado en {selectedYear}
                </p>
              </CardContent>
            </Card>

            {/* Win/Loss Ratio */}
            <Card className="border-2 border-blue-200 dark:border-blue-800/30 hover:border-blue-400 hover:shadow-xl transition-all duration-300 group overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/10 dark:to-gray-800/50">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors" />
              <CardHeader className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-md bg-blue-500/10">
                    <Target className="w-4 h-4 text-blue-500" />
                  </div>
                  <CardTitle className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Win/Loss Ratio
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-3xl font-bold text-[#416E87] mb-1">
                  {tradingMetrics.losses > 0
                    ? (tradingMetrics.wins / tradingMetrics.losses).toFixed(2)
                    : tradingMetrics.wins > 0
                    ? "∞"
                    : "0"}
                </div>
                <p className="text-sm text-blue-600/70 dark:text-blue-400/70 font-medium">
                  {tradingMetrics.wins} wins / {tradingMetrics.losses} losses
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pie Chart - Distribution */}
            <Card className="lg:col-span-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800/50 dark:to-transparent border-b border-gray-200 dark:border-gray-700">
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <div className="p-2 rounded-lg bg-[#416E87]/10">
                    <PieChartIcon className="w-5 h-5 text-[#416E87]" />
                  </div>
                  Distribución de Resultados
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {tradingMetrics.totalTrades > 0 ? (
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-full md:w-1/2" style={{ height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg border border-gray-700">
                                    <p className="font-bold text-sm">{data.name}</p>
                                    <p className="text-xs">Porcentaje: {data.value.toFixed(1)}%</p>
                                    <p className="text-xs">Trades: {data.count}</p>
                                    <p className="text-xs mt-1 text-gray-400">Año {selectedYear}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="w-full md:w-1/2 space-y-4">
                      <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/10 border-2 border-green-200 dark:border-green-800/30">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Win</span>
                          <span className="text-2xl font-bold text-green-600 dark:text-green-400">{tradingMetrics.winPercentage.toFixed(1)}%</span>
                        </div>
                        <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">{tradingMetrics.wins} trades ganadores</p>
                      </div>

                      <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border-2 border-red-200 dark:border-red-800/30">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">Loss</span>
                          <span className="text-2xl font-bold text-red-600 dark:text-red-400">{tradingMetrics.lossPercentage.toFixed(1)}%</span>
                        </div>
                        <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">{tradingMetrics.losses} trades perdedores</p>
                      </div>

                      {tradingMetrics.breakEven > 0 && (
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Break Even</span>
                            <span className="text-2xl font-bold text-gray-600 dark:text-gray-400">{tradingMetrics.breakEvenPercentage.toFixed(1)}%</span>
                          </div>
                          <p className="text-xs text-gray-600/70 dark:text-gray-400/70 mt-1">{tradingMetrics.breakEven} trades en punto muerto</p>
                        </div>
                      )}

                      <div className="pt-4 border-t-2 border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-2">Total</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{tradingMetrics.totalTrades}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">trades registrados</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="inline-block p-4 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                      <PieChartIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      No hay trades registrados para este período
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Risk and R:R Column */}
            <div className="space-y-6">
              {/* Risk Progress */}
              <Card className="border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-900/10 dark:to-transparent border-b border-orange-200 dark:border-orange-800/30">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-orange-700 dark:text-orange-400">
                    <div className="p-2 rounded-lg bg-orange-500/10">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                    </div>
                    Riesgo Mensual
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Riesgo Utilizado</span>
                      <span className={`text-2xl font-bold ${riskStatus.color}`}>
                        {tradingMetrics.totalRisk.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>de {tradingMetrics.maxRisk}% máximo</span>
                      <span className={`font-bold ${riskStatus.color}`}>{riskStatus.label}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden shadow-inner">
                      <div
                        className={`h-6 rounded-full transition-all duration-500 ${getRiskColor()} flex items-center justify-end pr-2`}
                        style={{ width: `${Math.min(tradingMetrics.riskPercentage, 100)}%` }}
                      >
                        <span className="text-xs font-bold text-white">
                          {tradingMetrics.riskPercentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                      Restante: <span className="font-bold text-green-600 dark:text-green-400">{tradingMetrics.remainingRisk.toFixed(2)}%</span>
                    </p>
                  </div>

                  <div className="pt-4 border-t-2 border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Usado</p>
                        <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{tradingMetrics.totalRisk.toFixed(1)}%</p>
                      </div>
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">Límite</p>
                        <p className="text-lg font-bold text-gray-600 dark:text-gray-400">{tradingMetrics.maxRisk}%</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* R:R Average */}
              <Card className="border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/10 dark:to-transparent border-b border-blue-200 dark:border-blue-800/30">
                  <CardTitle className="flex items-center gap-2 text-lg font-bold text-blue-700 dark:text-blue-400">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Target className="w-5 h-5 text-blue-500" />
                    </div>
                    R:R Promedio
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-[#416E87] mb-2">
                      1:{tradingMetrics.avgRR.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      Risk:Reward ejecutado
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Calidad de ejecución</span>
                      <span className={`font-bold ${
                        tradingMetrics.avgRR >= 2 ? "text-green-500" : 
                        tradingMetrics.avgRR >= 1.5 ? "text-yellow-500" : 
                        "text-red-500"
                      }`}>
                        {tradingMetrics.avgRR >= 2 ? "EXCELENTE" : 
                         tradingMetrics.avgRR >= 1.5 ? "BUENO" : 
                         "MEJORAR"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Growth Account Tab */}
        <TabsContent value="growth" className="space-y-6 mt-6">
          <GrowthDashboardContent
            accounts={growthAccounts}
            selectedYear={selectedYear}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}