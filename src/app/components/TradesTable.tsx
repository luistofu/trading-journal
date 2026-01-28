import { useState, useRef, KeyboardEvent } from "react";
import { Plus, Image as ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";

export interface Trade {
  id: string;
  tradeNumber: string;
  fecha: string;
  par: string;
  buySell: "Buy" | "Sell" | "";
  sesion: "London" | "New York" | "Asian" | "Sydney" | "";
  riesgoPorcentaje: string;
  resultado: "Win" | "Loss" | "BE" | "";
  riesgoBeneficioFinal: string;
  tiempoDuracion: string;
  confluencias: string;
  notas: string;
  imagenAntes: string;
  imagenDespues: string;
}

interface TradesTableProps {
  trades: Trade[];
  onTradesChange: (trades: Trade[]) => void;
}

export function TradesTable({ trades, onTradesChange }: TradesTableProps) {
  const [editingCell, setEditingCell] = useState<{
    tradeId: string;
    field: keyof Trade;
  } | null>(null);

  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleCellChange = (
    tradeId: string,
    field: keyof Trade,
    value: string
  ) => {
    const updatedTrades = trades.map((trade) =>
      trade.id === tradeId ? { ...trade, [field]: value } : trade
    );
    onTradesChange(updatedTrades);
  };

  const handleAddTrade = () => {
    const newTrade: Trade = {
      id: Date.now().toString(),
      tradeNumber: (trades.length + 1).toString(),
      fecha: "",
      par: "",
      buySell: "",
      sesion: "",
      riesgoPorcentaje: "",
      resultado: "",
      riesgoBeneficioFinal: "",
      tiempoDuracion: "",
      confluencias: "",
      notas: "",
      imagenAntes: "",
      imagenDespues: "",
    };
    onTradesChange([...trades, newTrade]);
  };

  const handleDeleteTrade = (tradeId: string) => {
    onTradesChange(trades.filter((trade) => trade.id !== tradeId));
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    tradeId: string,
    field: keyof Trade
  ) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const fields: (keyof Trade)[] = [
        "tradeNumber",
        "fecha",
        "par",
        "buySell",
        "sesion",
        "riesgoPorcentaje",
        "resultado",
        "riesgoBeneficioFinal",
        "tiempoDuracion",
        "confluencias",
        "notas",
      ];
      const currentIndex = fields.indexOf(field);
      const nextField = fields[currentIndex + 1];

      if (nextField) {
        const nextKey = `${tradeId}-${nextField}`;
        inputRefs.current[nextKey]?.focus();
      } else {
        // Move to next row
        const currentTradeIndex = trades.findIndex((t) => t.id === tradeId);
        if (currentTradeIndex < trades.length - 1) {
          const nextTrade = trades[currentTradeIndex + 1];
          const nextKey = `${nextTrade.id}-${fields[0]}`;
          inputRefs.current[nextKey]?.focus();
        }
      }
    }
  };

  const getResultadoColor = (resultado: string) => {
    switch (resultado) {
      case "Win":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "Loss":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "BE":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-white dark:bg-gray-800";
    }
  };

  const renderEditableCell = (
    trade: Trade,
    field: keyof Trade,
    placeholder: string,
    type: "text" | "date" | "number" = "text"
  ) => {
    const isEditing =
      editingCell?.tradeId === trade.id && editingCell?.field === field;
    const cellKey = `${trade.id}-${field}`;

    // Aplicar color al texto si es el campo riesgoBeneficioFinal
    const isRiskRewardField = field === "riesgoBeneficioFinal";
    const textColorClass = isRiskRewardField
      ? trade.resultado === "Win"
        ? "text-green-600 dark:text-green-400 font-medium"
        : trade.resultado === "Loss"
        ? "text-red-600 dark:text-red-400 font-medium"
        : "text-gray-900 dark:text-gray-100"
      : "text-gray-900 dark:text-gray-100";

    return (
      <td className="border border-gray-200 dark:border-gray-700 p-0 min-w-[120px]">
        <input
          ref={(el) => (inputRefs.current[cellKey] = el)}
          type={type}
          value={trade[field] as string}
          onChange={(e) => handleCellChange(trade.id, field, e.target.value)}
          onFocus={() => setEditingCell({ tradeId: trade.id, field })}
          onBlur={() => setEditingCell(null)}
          onKeyDown={(e) => handleKeyDown(e, trade.id, field)}
          placeholder={placeholder}
          className={`w-full h-full px-3 py-2 outline-none transition-colors ${textColorClass} ${
            isEditing
              ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-[#416E87]"
              : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        />
      </td>
    );
  };

  const renderDropdownCell = (
    trade: Trade,
    field: keyof Trade,
    options: string[]
  ) => {
    const isEditing =
      editingCell?.tradeId === trade.id && editingCell?.field === field;

    // Solo aplicar color de fondo si es campo "resultado" y tiene valor
    const shouldApplyColor = field === "resultado" && trade[field];
    const colorClass = shouldApplyColor ? getResultadoColor(trade[field] as string) : "";

    // Determinar si debemos agregar el símbolo %
    const isPercentageField = field === "riesgoPorcentaje";

    return (
      <td
        className={`border border-gray-200 dark:border-gray-700 p-0 min-w-[120px] ${colorClass}`}
      >
        <select
          value={trade[field] as string}
          onChange={(e) => handleCellChange(trade.id, field, e.target.value)}
          onFocus={() => setEditingCell({ tradeId: trade.id, field })}
          onBlur={() => setEditingCell(null)}
          className={`w-full h-full px-3 py-2 outline-none transition-colors cursor-pointer ${
            isEditing
              ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-[#416E87] text-gray-900 dark:text-gray-100"
              : shouldApplyColor
                ? "bg-transparent text-inherit"
                : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
          }`}
        >
          <option value="" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">Seleccionar</option>
          {options.map((option) => (
            <option key={option} value={option} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              {isPercentageField ? `${option}%` : option}
            </option>
          ))}
        </select>
      </td>
    );
  };

  const renderImageCell = (trade: Trade, field: "imagenAntes" | "imagenDespues") => {
    return (
      <td className="border border-gray-200 dark:border-gray-700 p-2 text-center min-w-[100px] bg-white dark:bg-gray-800">
        <button className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400 hover:text-[#416E87] dark:hover:text-[#5a9bc4] transition-colors mx-auto">
          <ImageIcon className="w-4 h-4" />
          <span className="text-xs">Subir</span>
        </button>
      </td>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Trading Journal</h2>
        <button
          onClick={handleAddTrade}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#416E87] text-white rounded-lg hover:bg-[#355a6e] transition-colors text-sm sm:text-base w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Trade</span>
        </button>
      </div>

      {/* Table container with horizontal scroll on mobile */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] border-collapse">
          <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900 z-10">
            <tr>
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase min-w-[80px]">
                Trade #
              </th>
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase min-w-[120px]">
                Fecha
              </th>
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase min-w-[100px]">
                Par
              </th>
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase min-w-[120px]">
                Buy / Sell
              </th>
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase min-w-[120px]">
                Sesión
              </th>
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase min-w-[100px]">
                Riesgo %
              </th>
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase min-w-[120px]">
                Resultado
              </th>
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase min-w-[150px]">
                R:R / Beneficio
              </th>
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase min-w-[120px]">
                Duración
              </th>
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase min-w-[200px]">
                Confluencias
              </th>
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase min-w-[200px]">
                Notas
              </th>
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase min-w-[100px]">
                Imagen Antes
              </th>
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase min-w-[100px]">
                Imagen Después
              </th>
              <th className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase min-w-[80px]">
                Acción
              </th>
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 ? (
              <tr>
                <td
                  colSpan={14}
                  className="border border-gray-200 dark:border-gray-700 px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  No hay trades registrados. Haz clic en "Nuevo Trade" para comenzar.
                </td>
              </tr>
            ) : (
              <>
                {trades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    {renderEditableCell(trade, "tradeNumber", "#", "text")}
                    {renderEditableCell(trade, "fecha", "YYYY-MM-DD", "date")}
                    {renderEditableCell(trade, "par", "EUR/USD", "text")}
                    {renderDropdownCell(trade, "buySell", ["Buy", "Sell"])}
                    {renderDropdownCell(trade, "sesion", [
                      "Asian",
                      "London",
                      "New York",
                      "Sydney",
                    ])}
                    {renderDropdownCell(trade, "riesgoPorcentaje", ["0.25", "0.35", "0.50", "1"])}
                    {renderDropdownCell(trade, "resultado", ["Win", "Loss", "BE"])}
                    {renderEditableCell(trade, "riesgoBeneficioFinal", "1:2", "text")}
                    {renderEditableCell(trade, "tiempoDuracion", "2h 30m", "text")}
                    {renderEditableCell(trade, "confluencias", "Confluencias...")}
                    {renderEditableCell(trade, "notas", "Notas...")}
                    {renderImageCell(trade, "imagenAntes")}
                    {renderImageCell(trade, "imagenDespues")}
                    <td className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center">
                      <button
                        onClick={() => handleDeleteTrade(trade.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Eliminar trade"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {/* Empty row for quick add */}
                <tr className="bg-gray-50 dark:bg-gray-900">
                  <td
                    colSpan={14}
                    className="border border-gray-200 dark:border-gray-700 px-4 py-3 text-center text-gray-400 dark:text-gray-500 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={handleAddTrade}
                  >
                    + Agregar nuevo trade
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}