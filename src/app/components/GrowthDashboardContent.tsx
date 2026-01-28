import { useMemo, useState } from "react";
import { GrowthAccountData } from "@/app/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { TrendingUp, TrendingDown, DollarSign, Percent, Target } from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
} from "recharts";
import { Badge } from "@/app/components/ui/badge";

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

interface GrowthDashboardContentProps {
  accounts: GrowthAccountData[];
  selectedYear: number;
}

export function GrowthDashboardContent({ accounts, selectedYear }: GrowthDashboardContentProps) {
  const [selectedAccount, setSelectedAccount] = useState<string>("all");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("all");
  const [showTarget, setShowTarget] = useState(true);

  // Get unique account names
  const accountNames = useMemo(() => {
    const names = Array.from(new Set(accounts.map((a) => a.accountName)));
    return names;
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
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Capital Inicial */}
        <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 border-blue-100 dark:border-blue-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              Capital Inicial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ${metrics.capitalInicial.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        {/* Capital Actual */}
        <Card className="bg-gradient-to-br from-green-50 to-white dark:from-gray-800 dark:to-gray-900 border-green-100 dark:border-green-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              Capital Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ${metrics.capitalActual.toLocaleString()}
            </p>
            <p
              className={`text-sm mt-2 font-medium ${
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
        <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-gray-800 dark:to-gray-900 border-purple-100 dark:border-purple-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Percent className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              Crecimiento Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-3xl font-bold ${
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
        <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-gray-800 dark:to-gray-900 border-amber-100 dark:border-amber-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                <Target className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              Promedio Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-3xl font-bold ${
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
                  {filteredAccounts.map((account) => {
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
