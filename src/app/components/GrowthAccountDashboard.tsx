import { useState, useMemo } from "react";
import { GrowthAccountData } from "@/app/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Button } from "@/app/components/ui/button";
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";
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
} from "recharts";
import { Badge } from "@/app/components/ui/badge";
import { getCurrentYear } from "@/app/utils/quarterHelpers";

interface GrowthAccountDashboardProps {
  accounts: GrowthAccountData[];
  onBack: () => void;
}

const MONTHS_MAP = {
  Enero: 1,
  Febrero: 2,
  Marzo: 3,
  Abril: 4,
  Mayo: 5,
  Junio: 6,
  Julio: 7,
  Agosto: 8,
  Septiembre: 9,
  Octubre: 10,
  Noviembre: 11,
  Diciembre: 12,
};

export function GrowthAccountDashboard({
  accounts,
  onBack,
}: GrowthAccountDashboardProps) {
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<number>(getCurrentYear());
  const [selectedQuarter, setSelectedQuarter] = useState<string>("all");
  const [showTarget, setShowTarget] = useState(true);

  // Get unique account names
  const accountNames = useMemo(() => {
    const names = Array.from(new Set(accounts.map((a) => a.accountName)));
    return names;
  }, [accounts]);

  // Get unique years
  const years = useMemo(() => {
    const yearSet = Array.from(new Set(accounts.map((a) => a.year)));
    return yearSet.sort((a, b) => b - a);
  }, [accounts]);

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    let filtered = accounts.filter((acc) => acc.year === selectedYear);

    if (selectedAccount !== "all") {
      filtered = filtered.filter((acc) => acc.accountName === selectedAccount);
    }

    if (selectedQuarter !== "all") {
      filtered = filtered.filter(
        (acc) => acc.quarter === parseInt(selectedQuarter)
      );
    }

    return filtered.sort((a, b) => {
      const monthA = MONTHS_MAP[a.mes as keyof typeof MONTHS_MAP] || 0;
      const monthB = MONTHS_MAP[b.mes as keyof typeof MONTHS_MAP] || 0;
      return monthA - monthB;
    });
  }, [accounts, selectedAccount, selectedYear, selectedQuarter]);

  // Calculate chart data
  const chartData = useMemo(() => {
    let cumulativeCapital = 0;
    const firstAccount = filteredAccounts[0];
    if (firstAccount) {
      cumulativeCapital = firstAccount.initialCapital;
    }

    return filteredAccounts.map((acc, index) => {
      if (index === 0) {
        cumulativeCapital = acc.initialCapital;
      }
      
      const capitalFinal = cumulativeCapital + acc.gananciaMensual;
      const rendimiento = acc.initialCapital > 0 
        ? (acc.gananciaMensual / acc.initialCapital) * 100 
        : 0;

      const data = {
        mes: acc.mes,
        capitalAcumulado: capitalFinal,
        ganancia: acc.gananciaMensual,
        rendimiento: rendimiento,
        objetivo: acc.monthlyTarget,
        capitalInicial: cumulativeCapital,
      };

      cumulativeCapital = capitalFinal;
      return data;
    });
  }, [filteredAccounts]);

  // Calculate summary metrics
  const metrics = useMemo(() => {
    if (filteredAccounts.length === 0) {
      return {
        capitalInicial: 0,
        capitalActual: 0,
        crecimientoTotal: 0,
        promedioMensual: 0,
      };
    }

    const capitalInicial = filteredAccounts[0]?.initialCapital || 0;
    const totalGanancias = filteredAccounts.reduce(
      (sum, acc) => sum + acc.gananciaMensual,
      0
    );
    const capitalActual = capitalInicial + totalGanancias;
    const crecimientoTotal =
      capitalInicial > 0 ? ((capitalActual - capitalInicial) / capitalInicial) * 100 : 0;
    const promedioMensual = filteredAccounts.length > 0
      ? filteredAccounts.reduce((sum, acc) => sum + acc.promedioMes, 0) / filteredAccounts.length
      : 0;

    return {
      capitalInicial,
      capitalActual,
      crecimientoTotal,
      promedioMensual,
    };
  }, [filteredAccounts]);

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "Completado":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      case "En progreso":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      case "En observación":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100";
      case "Fallido":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-[#416E87] hover:text-[#355a6d]"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Growth Account Overview
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 ml-12">
            Evolución mensual del capital y rendimiento
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Cuenta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las cuentas</SelectItem>
              {accountNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedQuarter}
            onValueChange={setSelectedQuarter}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Trimestre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="1">Q1</SelectItem>
              <SelectItem value="2">Q2</SelectItem>
              <SelectItem value="3">Q3</SelectItem>
              <SelectItem value="4">Q4</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Capital Inicial */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Capital Inicial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${metrics.capitalInicial.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Capital Actual */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Capital Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${metrics.capitalActual.toLocaleString()}
            </p>
            <p
              className={`text-sm mt-1 ${
                metrics.capitalActual >= metrics.capitalInicial
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {metrics.capitalActual >= metrics.capitalInicial ? "+" : ""}
              ${(metrics.capitalActual - metrics.capitalInicial).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        {/* Crecimiento Total */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Crecimiento Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                metrics.crecimientoTotal >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {metrics.crecimientoTotal >= 0 ? "+" : ""}
              {metrics.crecimientoTotal.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        {/* Promedio Mensual */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Promedio Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                metrics.promedioMensual >= 60
                  ? "text-green-600 dark:text-green-400"
                  : metrics.promedioMensual >= 40
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {metrics.promedioMensual.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Crecimiento del Capital</CardTitle>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTarget}
                  onChange={(e) => setShowTarget(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#416E87] focus:ring-[#416E87]"
                />
                Mostrar objetivo
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  tickFormatter={(value) => `${value.toFixed(0)}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === "Capital Acumulado" || name === "Objetivo Mensual") {
                      return `$${value.toLocaleString()}`;
                    }
                    if (name === "Ganancia Mensual") {
                      return `$${value.toFixed(2)}`;
                    }
                    return value;
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="ganancia"
                  fill="#416E87"
                  name="Ganancia Mensual"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="capitalAcumulado"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Capital Acumulado"
                  dot={{ fill: "#10b981", r: 4 }}
                />
                {showTarget && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="objetivo"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Objetivo Mensual"
                    dot={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-gray-500">
              No hay datos disponibles para mostrar
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Desglose Mensual</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAccounts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Mes
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Capital Inicial
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Ganancia Mensual
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Rendimiento
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Objetivo Mensual
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Ciclo / Fase
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map((account, index) => {
                    const rendimiento =
                      account.initialCapital > 0
                        ? (account.gananciaMensual / account.initialCapital) * 100
                        : 0;
                    return (
                      <tr
                        key={account.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                      >
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                          {account.mes}
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          ${account.initialCapital.toLocaleString()}
                        </td>
                        <td
                          className={`py-3 px-4 font-medium ${
                            account.gananciaMensual >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {account.gananciaMensual >= 0 ? "+" : ""}$
                          {account.gananciaMensual.toFixed(2)}
                        </td>
                        <td
                          className={`py-3 px-4 font-medium ${
                            rendimiento >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {rendimiento >= 0 ? "+" : ""}
                          {rendimiento.toFixed(2)}%
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          ${account.monthlyTarget.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          {account.ciclo ? (
                            <Badge variant="outline" className="text-xs">
                              {account.ciclo}
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-400 italic">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getEstadoBadge(account.estado)}>
                            {account.estado === "En progreso" && "🟡"}
                            {account.estado === "Completado" && "🟢"}
                            {account.estado === "En observación" && "🟠"}
                            {account.estado === "Fallido" && "🔴"}
                            <span className="ml-1">{account.estado}</span>
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No hay datos disponibles
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
