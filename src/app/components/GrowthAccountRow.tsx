import { GrowthAccountData } from "@/app/types";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";
import { Trash2, Edit2, Check, X } from "lucide-react";
import { useState } from "react";

interface GrowthAccountRowProps {
  account: GrowthAccountData;
  onDelete: () => void;
  onUpdate: (account: GrowthAccountData) => void;
}

export function GrowthAccountRow({ account, onDelete, onUpdate }: GrowthAccountRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  // Estados separados para valores numéricos como strings durante edición
  const [editValues, setEditValues] = useState({
    accountName: account.accountName,
    initialCapital: account.initialCapital.toString(),
    brokerPropfirm: account.brokerPropfirm,
    proposito: account.proposito,
    gananciaMensual: account.gananciaMensual.toString(),
    monthlyTarget: account.monthlyTarget.toString(),
    ciclo: account.ciclo,
    promedioMes: account.promedioMes.toString(),
    estado: account.estado,
  });

  const handleSave = () => {
    const updatedAccount: GrowthAccountData = {
      ...account,
      accountName: editValues.accountName,
      initialCapital: parseFloat(editValues.initialCapital) || 0,
      brokerPropfirm: editValues.brokerPropfirm,
      proposito: editValues.proposito,
      gananciaMensual: parseFloat(editValues.gananciaMensual) || 0,
      monthlyTarget: parseFloat(editValues.monthlyTarget) || 0,
      ciclo: editValues.ciclo,
      promedioMes: parseFloat(editValues.promedioMes) || 0,
      estado: editValues.estado,
    };
    onUpdate(updatedAccount);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValues({
      accountName: account.accountName,
      initialCapital: account.initialCapital.toString(),
      brokerPropfirm: account.brokerPropfirm,
      proposito: account.proposito,
      gananciaMensual: account.gananciaMensual.toString(),
      monthlyTarget: account.monthlyTarget.toString(),
      ciclo: account.ciclo,
      promedioMes: account.promedioMes.toString(),
      estado: account.estado,
    });
    setIsEditing(false);
  };

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

  const getPropositoEmoji = (proposito: string) => {
    switch (proposito) {
      case "Práctica":
        return "📚";
      case "Evaluación":
        return "🎯";
      case "Fondeada":
        return "💰";
      case "Real":
        return "💵";
      default:
        return "";
    }
  };

  const monthName = account.mes;

  if (isEditing) {
    return (
      <div className="grid grid-cols-10 gap-3 p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 bg-blue-50 dark:bg-blue-950/20 transition-colors text-sm items-center">
        {/* Account Name */}
        <div className="col-span-1">
          <Input
            value={editValues.accountName}
            onChange={(e) =>
              setEditValues({ ...editValues, accountName: e.target.value })
            }
            className="h-8 text-xs"
          />
        </div>

        {/* Initial Capital */}
        <div className="col-span-1">
          <Input
            type="text"
            inputMode="decimal"
            value={editValues.initialCapital}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              setEditValues({
                ...editValues,
                initialCapital: value,
              });
            }}
            onFocus={(e) => e.target.select()}
            className="h-8 text-xs"
          />
        </div>

        {/* Broker/Prop Firm */}
        <div className="col-span-1">
          <Input
            value={editValues.brokerPropfirm}
            onChange={(e) =>
              setEditValues({ ...editValues, brokerPropfirm: e.target.value })
            }
            className="h-8 text-xs"
          />
        </div>

        {/* Propósito */}
        <div className="col-span-1">
          <Select
            value={editValues.proposito}
            onValueChange={(value: "Práctica" | "Evaluación" | "Fondeada" | "Real") =>
              setEditValues({ ...editValues, proposito: value })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Práctica">📚 Práctica</SelectItem>
              <SelectItem value="Evaluación">🎯 Evaluación</SelectItem>
              <SelectItem value="Fondeada">💰 Fondeada</SelectItem>
              <SelectItem value="Real">💵 Real</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mes - No editable */}
        <div className="col-span-1">
          <span className="text-gray-500 dark:text-gray-400 text-xs">
            {monthName}
          </span>
        </div>

        {/* Ganancia Mensual */}
        <div className="col-span-1">
          <Input
            type="text"
            inputMode="decimal"
            value={editValues.gananciaMensual}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9.]/g, '');
              setEditValues({
                ...editValues,
                gananciaMensual: value,
              });
            }}
            onFocus={(e) => e.target.select()}
            className="h-8 text-xs"
          />
        </div>

        {/* Monthly Target */}
        <div className="col-span-1">
          <Input
            type="text"
            inputMode="decimal"
            value={editValues.monthlyTarget}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9.]/g, '');
              setEditValues({
                ...editValues,
                monthlyTarget: value,
              });
            }}
            onFocus={(e) => e.target.select()}
            className="h-8 text-xs"
          />
        </div>

        {/* Ciclo - Solo mostrar si propósito es Práctica o Evaluación */}
        <div className="col-span-1">
          {(editValues.proposito === "Práctica" || editValues.proposito === "Evaluación") ? (
            <Select
              value={editValues.ciclo || "Fase 1"}
              onValueChange={(value: "Fase 1" | "Fase 2" | "Fase 3") =>
                setEditValues({ ...editValues, ciclo: value })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fase 1">Fase 1</SelectItem>
                <SelectItem value="Fase 2">Fase 2</SelectItem>
                {editValues.proposito === "Práctica" && (
                  <SelectItem value="Fase 3">Fase 3</SelectItem>
                )}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-xs text-gray-400 italic">N/A</span>
          )}
        </div>

        {/* Promedio Mes - EDITABLE */}
        <div className="col-span-1">
          <Input
            type="text"
            inputMode="decimal"
            value={editValues.promedioMes}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9.]/g, '');
              setEditValues({
                ...editValues,
                promedioMes: value,
              });
            }}
            onFocus={(e) => e.target.select()}
            className="h-8 text-xs"
          />
        </div>

        {/* Estado - EDITABLE */}
        <div className="col-span-1 flex items-center gap-2">
          <Select
            value={editValues.estado}
            onValueChange={(
              value: "En progreso" | "Completado" | "En observación" | "Fallido"
            ) => setEditValues({ ...editValues, estado: value })}
          >
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="En progreso">🟡 En progreso</SelectItem>
              <SelectItem value="Completado">🟢 Completado</SelectItem>
              <SelectItem value="En observación">🟠 En observación</SelectItem>
              <SelectItem value="Fallido">🔴 Fallido</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Save/Cancel buttons */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSave}
              className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-10 gap-3 p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-sm items-center">
      {/* Account Name */}
      <div className="col-span-1">
        <span className="font-medium text-gray-900 dark:text-white">
          {account.accountName}
        </span>
      </div>

      {/* Initial Capital */}
      <div className="col-span-1">
        <span className="text-gray-700 dark:text-gray-300">
          ${account.initialCapital.toLocaleString()}
        </span>
      </div>

      {/* Broker/Prop Firm */}
      <div className="col-span-1">
        <span className="text-gray-700 dark:text-gray-300">
          {account.brokerPropfirm}
        </span>
      </div>

      {/* Propósito */}
      <div className="col-span-1">
        <Badge variant="outline" className="text-xs">
          {getPropositoEmoji(account.proposito)} {account.proposito}
        </Badge>
      </div>

      {/* Mes */}
      <div className="col-span-1">
        <span className="text-gray-700 dark:text-gray-300">
          {monthName}
        </span>
      </div>

      {/* Ganancia Mensual */}
      <div className="col-span-1">
        <span className="font-medium text-gray-900 dark:text-white">
          ${account.gananciaMensual.toFixed(2)}
        </span>
      </div>

      {/* Monthly Target */}
      <div className="col-span-1">
        <span className="text-gray-700 dark:text-gray-300">
          ${account.monthlyTarget.toLocaleString()}
        </span>
      </div>

      {/* Ciclo */}
      <div className="col-span-1">
        {account.ciclo ? (
          <Badge variant="outline" className="text-xs">
            {account.ciclo}
          </Badge>
        ) : (
          <span className="text-xs text-gray-400 italic">N/A</span>
        )}
      </div>

      {/* Promedio Mes */}
      <div className="col-span-1">
        <span
          className={`font-semibold ${
            account.promedioMes >= 60
              ? "text-green-600 dark:text-green-400"
              : account.promedioMes >= 40
              ? "text-orange-600 dark:text-orange-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {account.promedioMes.toFixed(1)}%
        </span>
      </div>

      {/* Estado */}
      <div className="col-span-1 flex items-center justify-between gap-2">
        <Badge className={getEstadoBadge(account.estado)}>
          {account.estado === "En progreso" && "🟡"}
          {account.estado === "Completado" && "🟢"}
          {account.estado === "En observación" && "🟠"}
          {account.estado === "Fallido" && "🔴"}
          <span className="ml-1 text-xs">{account.estado}</span>
        </Badge>

        {/* Edit */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsEditing(true)}
          className="h-7 w-7 text-blue-600 hover:text-blue-700"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </Button>

        {/* Delete */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar cuenta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. La cuenta "{account.accountName}"
                será eliminada permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}