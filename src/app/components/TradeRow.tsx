import { Trade } from "@/app/types";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Trash2, Link as LinkIcon, ExternalLink, Copy, Check, Image, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { deleteTradeImage, getTradeImageSignedUrl, uploadTradeImage } from "@/app/data/tradingRepo";
import { CloseTradeModal } from "@/app/components/CloseTradeModal";

interface TradeRowProps {
  trade: Trade;
  onUpdate: (trade: Trade) => void;
  onDelete: () => void;
  isReadOnly: boolean;
}

export function TradeRow({ trade, onUpdate, onDelete, isReadOnly }: TradeRowProps) {
  const [copiedBefore, setCopiedBefore] = useState(false);
  const [copiedAfter, setCopiedAfter] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const estado = trade.estado ?? "Borrador";
  const isDraft = estado === "Borrador";

  const isTradeComplete =
    trade.par.trim() !== "" &&
    trade.confluencias.trim() !== "" &&
    trade.linkTradingViewAntes.trim() !== "" &&
    trade.imagenURL.trim() !== "";

  const handleTradeUpdate = (updatedTrade: Trade) => {
    onUpdate(updatedTrade);
  };

  const handleSaveTrade = () => {
    const now = new Date();
    const horaApertura = now.toTimeString().slice(0, 5);
    const fechaBase = trade.fecha.split(" ")[0];
    const fechaConHora = `${fechaBase} ${horaApertura}`;

    handleTradeUpdate({
      ...trade,
      fecha: trade.fecha.includes(":") ? trade.fecha : fechaConHora,
      estado: "Abierto",
    });
    setShowSaveConfirmation(false);
  };

  const handleCopyLink = (link: string, type: "before" | "after") => {
    navigator.clipboard.writeText(link);
    if (type === "before") {
      setCopiedBefore(true);
      setTimeout(() => setCopiedBefore(false), 2000);
    } else {
      setCopiedAfter(true);
      setTimeout(() => setCopiedAfter(false), 2000);
    }
  };

  useEffect(() => {
    let cancelled = false;

    if (!trade.imagenURL) {
      setImagePreviewUrl("");
      return;
    }

    if (trade.imagenURL.startsWith("data:")) {
      setImagePreviewUrl(trade.imagenURL);
      return;
    }

    getTradeImageSignedUrl(trade.imagenURL)
      .then(({ signedUrl }) => {
        if (cancelled) return;
        setImagePreviewUrl(signedUrl);
      })
      .catch((e) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.toLowerCase().includes("aborted") || msg.toLowerCase().includes("abort")) {
          return;
        }
        console.error(e);
        setImagePreviewUrl("");
      });

    return () => {
      cancelled = true;
    };
  }, [trade.imagenURL]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona un archivo de imagen válido");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("La imagen es demasiado grande. Máximo 2MB");
      return;
    }

    if (isReadOnly) return;

    try {
      setIsUploadingImage(true);
      const { path } = await uploadTradeImage(trade.id, file);
      onUpdate({ ...trade, imagenURL: path });
      const { signedUrl } = await getTradeImageSignedUrl(path);
      setImagePreviewUrl(signedUrl);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleRemoveImage = async () => {
    if (isReadOnly) return;
    const currentPath = trade.imagenURL;
    onUpdate({ ...trade, imagenURL: "" });

    try {
      if (currentPath && !currentPath.startsWith("data:")) {
        await deleteTradeImage(currentPath);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-16 gap-2 p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-sm" style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}>
      {/* Trade # */}
      <div className="col-span-1 flex items-center">
        <span className="font-medium text-gray-900 dark:text-white">
          #{trade.tradeNumber}
        </span>
      </div>

      {/* Fecha */}
      <div className="col-span-1 flex items-center">
        <Input
          type="text"
          value={trade.fecha}
          onChange={(e) => onUpdate({ ...trade, fecha: e.target.value })}
          disabled={isReadOnly || estado === "Cerrado"}
          className="h-8 text-xs"
          placeholder="DD/MM/YYYY"
        />
      </div>

      {/* Estado */}
      <div className="col-span-1 flex items-center">
        <Badge
          className={
            estado === "Cerrado"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs"
              : estado === "Abierto"
              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 text-xs"
              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 text-xs"
          }
        >
          {estado}
        </Badge>
      </div>

      {/* Par */}
      <div className="col-span-1 flex items-center">
        <Input
          type="text"
          value={trade.par}
          onChange={(e) => onUpdate({ ...trade, par: e.target.value })}
          disabled={isReadOnly}
          className="h-8 text-xs"
          placeholder="EUR/USD"
        />
      </div>

      {/* Buy/Sell */}
      <div className="col-span-1 flex items-center">
        <Select
          value={trade.buySell}
          onValueChange={(value: "Buy" | "Sell") =>
            onUpdate({ ...trade, buySell: value })
          }
          disabled={isReadOnly || estado === "Cerrado"}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Buy">Buy</SelectItem>
            <SelectItem value="Sell">Sell</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sesión */}
      <div className="col-span-1 flex items-center">
        <Select
          value={trade.sesion}
          onValueChange={(value: "London" | "New York" | "Asian" | "Sydney") =>
            onUpdate({ ...trade, sesion: value })
          }
          disabled={isReadOnly}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="London">London</SelectItem>
            <SelectItem value="New York">New York</SelectItem>
            <SelectItem value="Asian">Asian</SelectItem>
            <SelectItem value="Sydney">Sydney</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Riesgo % */}
      <div className="col-span-1 flex items-center">
        <Select
          value={trade.riesgoPorcentaje || ""}
          onValueChange={(value: string) =>
            onUpdate({ ...trade, riesgoPorcentaje: value })
          }
          disabled={isReadOnly}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="0%" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0.25">0.25%</SelectItem>
            <SelectItem value="0.35">0.35%</SelectItem>
            <SelectItem value="0.50">0.50%</SelectItem>
            <SelectItem value="1">1%</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Confluencias */}
      <div className="col-span-2 flex items-center">
        <Input
          type="text"
          value={trade.confluencias}
          onChange={(e) => onUpdate({ ...trade, confluencias: e.target.value })}
          disabled={isReadOnly}
          className="h-8 text-xs"
          placeholder="Soporte, EMA..."
        />
      </div>

      {/* Resultado */}
      <div className="col-span-1 flex items-center">
        {estado === "Cerrado" ? (
          <Badge
            className={
              trade.resultado === "Win"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs"
                : trade.resultado === "Loss"
                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 text-xs"
                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 text-xs"
            }
          >
            {trade.resultado === "Break Even" ? "BE" : trade.resultado}
          </Badge>
        ) : (
          <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
        )}
      </div>

      {/* R:R Final - NUEVO */}
      <div className="col-span-1 flex items-center">
        {estado === "Cerrado" ? (
          <span className="text-xs font-medium text-gray-900 dark:text-white">
            {trade.riesgoBeneficioFinal || "—"}
          </span>
        ) : (
          <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
        )}
      </div>

      {/* Duración - NUEVO */}
      <div className="col-span-1 flex items-center">
        {estado === "Cerrado" ? (
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {trade.tiempoDuracion || "—"}
          </span>
        ) : estado === "Abierto" ? (
          <span className="text-xs text-orange-600 dark:text-orange-400 italic">
            En curso
          </span>
        ) : (
          <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
        )}
      </div>

      {/* Imagen */}
      <div className="col-span-1 flex items-center justify-center">
        {trade.imagenURL ? (
          <Image className="h-4 w-4 text-green-600 dark:text-green-400" />
        ) : (
          <Image className="h-4 w-4 text-gray-300 dark:text-gray-600" />
        )}
      </div>

      {/* Link Antes */}
      <div className="col-span-1 flex items-center justify-center">
        {trade.linkTradingViewAntes ? (
          <LinkIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        ) : (
          <LinkIcon className="h-4 w-4 text-gray-300 dark:text-gray-600" />
        )}
      </div>

      {/* Acciones */}
      <div className="col-span-2 flex items-center gap-1">
        {/* Guardar - solo borrador completo */}
        {!isReadOnly && estado === "Borrador" && isTradeComplete && (
          <AlertDialog open={showSaveConfirmation} onOpenChange={setShowSaveConfirmation}>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white border-green-600"
              >
                Guardar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Guardar trade?</AlertDialogTitle>
                <AlertDialogDescription>
                  El trade pasará a estado "Abierto".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleSaveTrade}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Guardar Trade
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Cerrar - solo abierto */}
        {!isReadOnly && estado === "Abierto" && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs bg-[#416E87] hover:bg-[#355a6d] text-white border-[#416E87]"
              onClick={() => setShowCloseModal(true)}
            >
              Cerrar Trade
            </Button>

            <CloseTradeModal
              trade={trade}
              onTradeClose={(updated) => handleTradeUpdate(updated)}
              onClose={() => setShowCloseModal(false)}
              open={showCloseModal}
              onOpenChange={setShowCloseModal}
            />
          </>
        )}

        {/* Cerrado - solo lectura */}
        {estado === "Cerrado" && (
          <span className="text-xs text-gray-500 dark:text-gray-400 italic">Cerrado</span>
        )}

        {/* TradingView Links Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={isReadOnly}
            >
              <LinkIcon className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Media del Trade</h4>

              {/* Imagen Upload */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Imagen del Trade
                </label>
                
                {trade.imagenURL ? (
                  <div className="space-y-2">
                    <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                      <img
                        src={imagePreviewUrl}
                        alt="Trade screenshot"
                        className="w-full h-auto"
                        onError={(e) => {
                          e.currentTarget.src = "";
                          e.currentTarget.alt = "Error al cargar imagen";
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => document.getElementById(`imageUpload-${trade.id}`)?.click()}
                        disabled={isReadOnly || isUploadingImage}
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        {isUploadingImage ? "Subiendo..." : "Cambiar"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-red-600 hover:text-red-700"
                        onClick={handleRemoveImage}
                        disabled={isReadOnly || isUploadingImage}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => document.getElementById(`imageUpload-${trade.id}`)?.click()}
                    className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-[#416E87] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    disabled={isReadOnly || isUploadingImage}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-gray-400" />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {isUploadingImage ? "Subiendo..." : "Subir imagen"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG o GIF (max 2MB)
                      </p>
                    </div>
                  </button>
                )}
                
                <input
                  type="file"
                  id={`imageUpload-${trade.id}`}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <h4 className="font-medium text-sm mb-3">Notas</h4>
                <Input
                  type="text"
                  value={trade.notas}
                  onChange={(e) => onUpdate({ ...trade, notas: e.target.value })}
                  disabled={isReadOnly}
                  placeholder="Notas del trade..."
                  className="h-8 text-xs"
                />
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <h4 className="font-medium text-sm mb-3">Links TradingView</h4>

                {/* Link Antes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Link Antes
                  </label>
                  <div className="flex gap-1">
                    <Input
                      type="text"
                      value={trade.linkTradingViewAntes}
                      onChange={(e) =>
                        onUpdate({ ...trade, linkTradingViewAntes: e.target.value })
                      }
                      placeholder="https://www.tradingview.com/..."
                      className="h-8 text-xs flex-1"
                    />
                    {trade.linkTradingViewAntes && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            window.open(trade.linkTradingViewAntes, "_blank")
                          }
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            handleCopyLink(trade.linkTradingViewAntes, "before")
                          }
                        >
                          {copiedBefore ? (
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Link Después */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Link Después
                  </label>
                  <div className="flex gap-1">
                    <Input
                      type="text"
                      value={trade.linkTradingViewDespues}
                      onChange={(e) =>
                        onUpdate({ ...trade, linkTradingViewDespues: e.target.value })
                      }
                      placeholder="https://www.tradingview.com/..."
                      className="h-8 text-xs flex-1"
                    />
                    {trade.linkTradingViewDespues && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            window.open(trade.linkTradingViewDespues, "_blank")
                          }
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            handleCopyLink(trade.linkTradingViewDespues, "after")
                          }
                        >
                          {copiedAfter ? (
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Delete */}
        {!isReadOnly && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar trade?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. El trade será eliminado
                  permanentemente.
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
        )}
      </div>
    </div>
  );
}