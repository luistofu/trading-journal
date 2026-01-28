import { useEffect, useState } from "react";
import { Trade } from "@/app/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

interface CloseTradeModalProps {
  trade: Trade;
  onUpdate?: (trade: Trade) => void;
  onTradeClose?: (trade: Trade) => void;
  onClose: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CloseTradeModal({
  trade,
  onUpdate,
  onTradeClose,
  onClose,
  open,
  onOpenChange,
}: CloseTradeModalProps) {
  const [resultado, setResultado] = useState<"Win" | "Loss" | "BE">("Win");
  const [rrFinal, setRrFinal] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const dialogOpen = open !== undefined ? open : isOpen;

  useEffect(() => {
    if (!dialogOpen) return;

    const currentResultado =
      trade.resultado === "Break Even" ? "BE" : (trade.resultado as "Win" | "Loss" | "" | "Break Even");

    setResultado(
      currentResultado === "Win" || currentResultado === "Loss" || currentResultado === "BE"
        ? currentResultado
        : "Win"
    );
    setRrFinal(trade.riesgoBeneficioFinal || "");
  }, [dialogOpen, trade.resultado, trade.riesgoBeneficioFinal]);

  const parseUiDateTime = (value: string): Date | null => {
    const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?$/);
    if (!m) return null;
    const dd = Number(m[1]);
    const mm = Number(m[2]);
    const yyyy = Number(m[3]);
    const hh = m[4] ? Number(m[4]) : 0;
    const min = m[5] ? Number(m[5]) : 0;
    const d = new Date(yyyy, mm - 1, dd, hh, min, 0, 0);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const formatDuration = (start: Date, end: Date): string => {
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return "—";

    const diffMinutos = Math.floor(diffMs / (1000 * 60));
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffSemanas = Math.floor(diffDias / 7);
    const diffMeses = Math.floor(diffDias / 30);

    if (diffMeses >= 1) return `${diffMeses} ${diffMeses === 1 ? "mes" : "meses"}`;
    if (diffSemanas >= 1) return `${diffSemanas} ${diffSemanas === 1 ? "semana" : "semanas"}`;
    if (diffDias >= 1) return `${diffDias} ${diffDias === 1 ? "día" : "días"}`;
    if (diffHoras >= 1) {
      const minutos = diffMinutos % 60;
      return minutos > 0 ? `${diffHoras}h ${minutos}m` : `${diffHoras}h`;
    }
    return `${diffMinutos}m`;
  };

  const handleConfirm = () => {
    const resultadoDb: Trade["resultado"] = resultado === "BE" ? "Break Even" : resultado;

    const now = new Date();
    const openedAt = parseUiDateTime(trade.fecha);
    const duracion = openedAt ? formatDuration(openedAt, now) : "—";

    const updatedTrade: Trade = {
      ...trade,
      estado: "Cerrado",
      resultado: resultadoDb,
      riesgoBeneficioFinal: rrFinal,
      tiempoDuracion: duracion,
    };

    if (onTradeClose) {
      onTradeClose(updatedTrade);
    } else if (onUpdate) {
      onUpdate(updatedTrade);
    }

    setResultado("Win");
    setRrFinal("");

    if (onOpenChange) onOpenChange(false);
    onClose();
    setIsOpen(false);
  };

  const handleCancel = () => {
    if (onOpenChange) onOpenChange(false);
    onClose();
    setIsOpen(false);
    setResultado("Win");
    setRrFinal("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setIsOpen(newOpen);
    }
  };

  return (
    <>
      {onUpdate && !open && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs bg-[#416E87] hover:bg-[#355a6d] text-white border-[#416E87]"
          onClick={() => handleOpenChange(true)}
        >
          Cerrar Trade
        </Button>
      )}

      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cerrar Trade #{trade.tradeNumber}</DialogTitle>
            <DialogDescription>
              Completa la información final del trade <strong>{trade.par}</strong> antes de cerrarlo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resultado">Resultado del Trade *</Label>
              <Select value={resultado} onValueChange={(value: "Win" | "Loss" | "BE") => setResultado(value)}>
                <SelectTrigger id="resultado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Win">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span>Win</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Loss">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span>Loss</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="BE">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-500" />
                      <span>Break Even</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rrFinal">R:R / Beneficio Final *</Label>
              <Input
                id="rrFinal"
                type="text"
                placeholder="Ej: 1:2, +150 USD, 2.5R"
                value={rrFinal}
                onChange={(e) => setRrFinal(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Ingresa el ratio riesgo/beneficio o la ganancia/pérdida real
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} className="bg-[#416E87] hover:bg-[#355a6d]">
              Confirmar Cierre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
