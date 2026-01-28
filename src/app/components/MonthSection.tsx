import { useRef, useState } from "react";
import { MonthData, Trade } from "@/app/types";
import { TradeRow } from "@/app/components/TradeRow";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import { Progress } from "@/app/components/ui/progress";
import {
  createTrade,
  deleteTrade,
  getMonthIdByQuarterAndName,
  updateTrade,
  updateTradingMonth,
} from "@/app/data/tradingRepo";
import {
  RISK_MAX_MONTHLY,
  calculateMonthlyRisk,
  getRiskStatus,
} from "@/app/utils/quarterHelpers";

interface MonthSectionProps {
  quarterId: string;
  monthData: MonthData;
  onUpdate: (data: MonthData) => void;
  isReadOnly: boolean;
}

export function MonthSection({
  quarterId,
  monthData,
  onUpdate,
  isReadOnly,
}: MonthSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const tradeUpdateTimers = useRef<Record<string, number>>({});
  const notasTimer = useRef<number | null>(null);

  const resolveMonthId = async () => {
    return getMonthIdByQuarterAndName(quarterId, monthData.month);
  };

  const handleAddTrade = async () => {
    try {
      const monthId = await resolveMonthId();
      const created = await createTrade(monthId);
      onUpdate({
        ...monthData,
        trades: [...monthData.trades, created],
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateTrade = (index: number, updatedTrade: Trade) => {
    const newTrades = [...monthData.trades];
    newTrades[index] = updatedTrade;
    onUpdate({
      ...monthData,
      trades: newTrades,
    });

    if (isReadOnly) return;

    const tradeId = updatedTrade.id;
    const existingTimer = tradeUpdateTimers.current[tradeId];
    if (existingTimer) {
      window.clearTimeout(existingTimer);
    }

    tradeUpdateTimers.current[tradeId] = window.setTimeout(() => {
      updateTrade(tradeId, updatedTrade).catch((e) => console.error(e));
    }, 400);
  };

  const handleDeleteTrade = async (index: number) => {
    const trade = monthData.trades[index];
    if (!trade) return;

    onUpdate({
      ...monthData,
      trades: monthData.trades.filter((_, i) => i !== index),
    });

    if (isReadOnly) return;

    try {
      await deleteTrade(trade.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleComplete = async () => {
    const next = !monthData.completado;
    onUpdate({
      ...monthData,
      completado: next,
    });

    if (isReadOnly) return;

    try {
      await updateTradingMonth({ quarterId, monthName: monthData.month }, { completado: next });
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotasChange = (notas: string) => {
    onUpdate({
      ...monthData,
      notasMes: notas,
    });

    if (isReadOnly) return;

    if (notasTimer.current) {
      window.clearTimeout(notasTimer.current);
    }

    notasTimer.current = window.setTimeout(() => {
      updateTradingMonth({ quarterId, monthName: monthData.month }, { notasMes: notas }).catch((e) =>
        console.error(e)
      );
    }, 500);
  };

  // Calculate risk
  const monthlyRisk = calculateMonthlyRisk(monthData.trades);
  const riskPercentage = (monthlyRisk / RISK_MAX_MONTHLY) * 100;
  const riskRemaining = Math.max(0, RISK_MAX_MONTHLY - monthlyRisk);
  const riskStatus = getRiskStatus(monthlyRisk);

  return (
    <div className="space-y-4">
      {/* Month Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {monthData.month} {monthData.year}
          </h3>
          <Badge
            className={
              monthData.completado
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            }
          >
            {monthData.completado ? (
              <>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Completo
              </>
            ) : (
              "Pendiente"
            )}
          </Badge>
        </div>

        {!isReadOnly && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleComplete}
            className="text-xs"
          >
            {monthData.completado ? "Marcar Pendiente" : "Marcar Completo"}
          </Button>
        )}
      </div>

      {/* Risk Summary */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Riesgo Mensual</Label>
            <span className="text-xs text-gray-500">Máximo: {RISK_MAX_MONTHLY}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{monthlyRisk.toFixed(1)}</span>
            <span className="text-sm text-gray-500">/ {RISK_MAX_MONTHLY}</span>
          </div>
        </div>

        <Progress value={riskPercentage} className="h-2 mb-2" />

        <div className="flex items-center justify-between text-xs">
          <span
            className={`font-medium ${
              riskStatus.color === "red"
                ? "text-red-600 dark:text-red-400"
                : riskStatus.color === "orange"
                ? "text-orange-600 dark:text-orange-400"
                : "text-green-600 dark:text-green-400"
            }`}
          >
            {riskStatus.label}
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            Restante: {riskRemaining.toFixed(1)}
          </span>
        </div>

        {riskStatus.alert && (
          <div
            className={`mt-2 flex items-center gap-2 text-xs ${
              riskStatus.color === "red"
                ? "text-red-600 dark:text-red-400"
                : "text-orange-600 dark:text-orange-400"
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            <span>
              {riskStatus.color === "red"
                ? "⛔ No operar más este mes"
                : "⚠️ Operar con precaución"}
            </span>
          </div>
        )}
      </div>

      {/* Add Trade Button */}
      {!isReadOnly && (
        <Button
          onClick={handleAddTrade}
          className="w-full bg-[#416E87] hover:bg-[#355a6d]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Trade
        </Button>
      )}

      {/* Trades Table */}
      {monthData.trades.length > 0 ? (
        <div className="overflow-x-auto">
          <div className="min-w-[1400px]">
            {/* Table Header */}
            <div className="grid gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-t-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300 sticky top-0" style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}>
              <div className="col-span-1">Trade #</div>
              <div className="col-span-1">Fecha</div>
              <div className="col-span-1">Par</div>
              <div className="col-span-1">Buy/Sell</div>
              <div className="col-span-1">Sesión</div>
              <div className="col-span-1">Riesgo %</div>
              <div className="col-span-1">Resultado</div>
              <div className="col-span-1">R:R / Beneficio</div>
              <div className="col-span-1">Duración</div>
              <div className="col-span-2">Confluencias</div>
              <div className="col-span-2">Notas</div>
              <div className="col-span-1">Acciones</div>
            </div>

            {/* Table Rows */}
            <div className="border-x border-b border-gray-200 dark:border-gray-700 rounded-b-lg">
              {monthData.trades.map((trade, index) => (
                <TradeRow
                  key={trade.id}
                  trade={trade}
                  onUpdate={(updated) => handleUpdateTrade(index, updated)}
                  onDelete={() => handleDeleteTrade(index)}
                  isReadOnly={isReadOnly}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No hay trades registrados en este mes
          </p>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Notas del Mes</Label>
        <Textarea
          placeholder="Aprendizajes, emociones, errores, reflexiones..."
          value={monthData.notasMes}
          onChange={(e) => handleNotasChange(e.target.value)}
          disabled={isReadOnly}
          className="min-h-[100px]"
        />
      </div>
    </div>
  );
}