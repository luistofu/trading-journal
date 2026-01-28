import { supabase } from "@/app/utils/supabaseClient";
import type { QuarterData, Trade } from "@/app/types";
import { getQuarterMonths } from "@/app/utils/quarterHelpers";

type TradingQuarterRow = {
  id: string;
  year: number;
  quarter: number;
  completado: boolean;
};

type TradingMonthRow = {
  id: string;
  quarter_id: string;
  month_name: string;
  year: number;
  notas_mes: string;
  completado: boolean;
};

type TradeRow = {
  id: string;
  month_id: string;
  trade_number: number;
  fecha: string | null;
  par: string;
  buy_sell: "Buy" | "Sell";
  sesion: "London" | "New York" | "Asian" | "Sydney";
  riesgo_porcentaje: number | null;
  resultado: "Win" | "Loss" | "Break Even";
  riesgo_beneficio_final: string;
  tiempo_duracion: string;
  confluencias: string;
  notas: string;
  imagen_url: string;
  link_tradingview_antes: string;
  link_tradingview_despues: string;
};

export class TradingRepoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TradingRepoError";
  }
}

const TRADE_IMAGES_BUCKET = "trade-images";

function assertAuthenticated(userId: string | undefined): asserts userId {
  if (!userId) throw new TradingRepoError("Not authenticated");
}

async function getUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new TradingRepoError(error.message);
  assertAuthenticated(data.user?.id);
  return data.user.id;
}

function normalizeResultado(value: Trade["resultado"]): Trade["resultado"] {
  return value === "Break Even" ? "Break Even" : value;
}

function parseRiskPercentage(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

function dbRiskToUi(value: number | null): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function uiDateToDbDate(value: string): string | null {
  const v = value.trim();
  if (!v) return null;

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

  // Accept DD/MM/YYYY (current UI placeholder)
  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;

  const dd = m[1].padStart(2, "0");
  const mm = m[2].padStart(2, "0");
  const yyyy = m[3];
  return `${yyyy}-${mm}-${dd}`;
}

function dbDateToUiDate(value: string | null): string {
  // Keep UI stable with DD/MM/YYYY
  if (!value) return "";
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return value;
  const yyyy = m[1];
  const mm = m[2];
  const dd = m[3];
  return `${dd}/${mm}/${yyyy}`;
}

function mapTradeRowToUi(row: TradeRow): Trade {
  return {
    id: row.id,
    tradeNumber: String(row.trade_number),
    fecha: dbDateToUiDate(row.fecha),
    par: row.par ?? "",
    buySell: row.buy_sell,
    sesion: row.sesion,
    riesgoPorcentaje: dbRiskToUi(row.riesgo_porcentaje),
    resultado: row.resultado,
    riesgoBeneficioFinal: row.riesgo_beneficio_final ?? "",
    tiempoDuracion: row.tiempo_duracion ?? "",
    confluencias: row.confluencias ?? "",
    notas: row.notas ?? "",
    imagenURL: row.imagen_url ?? "",
    linkTradingViewAntes: row.link_tradingview_antes ?? "",
    linkTradingViewDespues: row.link_tradingview_despues ?? "",
  };
}

export async function ensureTradingQuarter(year: number, quarter: 1 | 2 | 3 | 4): Promise<{ quarterId: string }> {
  const userId = await getUserId();

  const { data: existing, error: selectError } = await supabase
    .from("trading_quarters")
    .select("id")
    .eq("year", year)
    .eq("quarter", quarter)
    .maybeSingle();

  if (selectError) throw new TradingRepoError(selectError.message);
  if (existing?.id) return { quarterId: existing.id };

  const { data: inserted, error: insertError } = await supabase
    .from("trading_quarters")
    .insert({ user_id: userId, year, quarter, completado: false })
    .select("id")
    .single();

  if (insertError) throw new TradingRepoError(insertError.message);
  return { quarterId: inserted.id };
}

export async function ensureTradingMonths(
  quarterId: string,
  year: number,
  quarter: 1 | 2 | 3 | 4
): Promise<TradingMonthRow[]> {
  await getUserId();

  const monthNames = getQuarterMonths(quarter);

  const { data: existing, error: existingError } = await supabase
    .from("trading_months")
    .select("id, quarter_id, month_name, year, notas_mes, completado")
    .eq("quarter_id", quarterId);

  if (existingError) throw new TradingRepoError(existingError.message);

  const existingByName = new Map((existing ?? []).map((m) => [m.month_name, m]));
  const missing = monthNames.filter((name) => !existingByName.has(name));

  if (missing.length > 0) {
    const payload = missing.map((month_name) => ({
      quarter_id: quarterId,
      month_name,
      year,
      notas_mes: "",
      completado: false,
    }));

    const { error: insertError } = await supabase.from("trading_months").insert(payload);
    if (insertError) throw new TradingRepoError(insertError.message);

    const { data: reread, error: rereadError } = await supabase
      .from("trading_months")
      .select("id, quarter_id, month_name, year, notas_mes, completado")
      .eq("quarter_id", quarterId);

    if (rereadError) throw new TradingRepoError(rereadError.message);
    return (reread ?? []) as TradingMonthRow[];
  }

  return (existing ?? []) as TradingMonthRow[];
}

export async function getTradingQuarterBundle(year: number, quarter: 1 | 2 | 3 | 4): Promise<QuarterData> {
  const { quarterId } = await ensureTradingQuarter(year, quarter);
  const months = await ensureTradingMonths(quarterId, year, quarter);

  const { data: quarterRow, error: quarterError } = await supabase
    .from("trading_quarters")
    .select("id, year, quarter, completado")
    .eq("id", quarterId)
    .single();

  if (quarterError) throw new TradingRepoError(quarterError.message);

  const monthIds = months.map((m) => m.id);

  const { data: trades, error: tradesError } = await supabase
    .from("trades")
    .select(
      "id, month_id, trade_number, fecha, par, buy_sell, sesion, riesgo_porcentaje, resultado, riesgo_beneficio_final, tiempo_duracion, confluencias, notas, imagen_url, link_tradingview_antes, link_tradingview_despues"
    )
    .in("month_id", monthIds)
    .order("trade_number", { ascending: true });

  if (tradesError) throw new TradingRepoError(tradesError.message);

  const tradesByMonth = new Map<string, TradeRow[]>();
  for (const t of (trades ?? []) as TradeRow[]) {
    const arr = tradesByMonth.get(t.month_id) ?? [];
    arr.push(t);
    tradesByMonth.set(t.month_id, arr);
  }

  const monthNameOrder = getQuarterMonths(quarter);
  const monthsSorted = [...months].sort(
    (a, b) => monthNameOrder.indexOf(a.month_name) - monthNameOrder.indexOf(b.month_name)
  );

  return {
    id: quarterRow.id,
    year: quarterRow.year,
    quarter: quarterRow.quarter as 1 | 2 | 3 | 4,
    completado: quarterRow.completado,
    months: monthsSorted.map((m) => ({
      month: m.month_name,
      year: m.year,
      notasMes: m.notas_mes ?? "",
      completado: m.completado,
      trades: (tradesByMonth.get(m.id) ?? []).map(mapTradeRowToUi),
    })),
  };
}

export async function updateTradingMonth(
  params: { quarterId: string; monthName: string },
  patch: { notasMes?: string; completado?: boolean }
): Promise<void> {
  await getUserId();

  const update: Record<string, unknown> = {};
  if (patch.notasMes !== undefined) update.notas_mes = patch.notasMes;
  if (patch.completado !== undefined) update.completado = patch.completado;

  if (Object.keys(update).length === 0) return;

  const { error } = await supabase
    .from("trading_months")
    .update(update)
    .eq("quarter_id", params.quarterId)
    .eq("month_name", params.monthName);

  if (error) throw new TradingRepoError(error.message);
}

export async function createTrade(monthId: string): Promise<Trade> {
  await getUserId();

  const { data: maxRow, error: maxError } = await supabase
    .from("trades")
    .select("trade_number")
    .eq("month_id", monthId)
    .order("trade_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (maxError) throw new TradingRepoError(maxError.message);

  const nextTradeNumber = (maxRow?.trade_number ?? 0) + 1;

  const { data: inserted, error: insertError } = await supabase
    .from("trades")
    .insert({
      month_id: monthId,
      trade_number: nextTradeNumber,
      fecha: null,
      par: "",
      buy_sell: "Buy",
      sesion: "London",
      riesgo_porcentaje: null,
      resultado: "Win",
      riesgo_beneficio_final: "",
      tiempo_duracion: "",
      confluencias: "",
      notas: "",
      imagen_url: "",
      link_tradingview_antes: "",
      link_tradingview_despues: "",
    })
    .select(
      "id, month_id, trade_number, fecha, par, buy_sell, sesion, riesgo_porcentaje, resultado, riesgo_beneficio_final, tiempo_duracion, confluencias, notas, imagen_url, link_tradingview_antes, link_tradingview_despues"
    )
    .single();

  if (insertError) throw new TradingRepoError(insertError.message);

  return mapTradeRowToUi(inserted as TradeRow);
}

export async function updateTrade(tradeId: string, patch: Partial<Trade>): Promise<Trade> {
  await getUserId();

  const update: Record<string, unknown> = {};

  if (patch.fecha !== undefined) update.fecha = uiDateToDbDate(patch.fecha);
  if (patch.par !== undefined) update.par = patch.par;
  if (patch.buySell !== undefined) update.buy_sell = patch.buySell;
  if (patch.sesion !== undefined) update.sesion = patch.sesion;
  if (patch.riesgoPorcentaje !== undefined) update.riesgo_porcentaje = parseRiskPercentage(patch.riesgoPorcentaje);
  if (patch.resultado !== undefined) update.resultado = normalizeResultado(patch.resultado);
  if (patch.riesgoBeneficioFinal !== undefined) update.riesgo_beneficio_final = patch.riesgoBeneficioFinal;
  if (patch.tiempoDuracion !== undefined) update.tiempo_duracion = patch.tiempoDuracion;
  if (patch.confluencias !== undefined) update.confluencias = patch.confluencias;
  if (patch.notas !== undefined) update.notas = patch.notas;
  if (patch.imagenURL !== undefined) update.imagen_url = patch.imagenURL;
  if (patch.linkTradingViewAntes !== undefined) update.link_tradingview_antes = patch.linkTradingViewAntes;
  if (patch.linkTradingViewDespues !== undefined) update.link_tradingview_despues = patch.linkTradingViewDespues;

  const { data: updated, error } = await supabase
    .from("trades")
    .update(update)
    .eq("id", tradeId)
    .select(
      "id, month_id, trade_number, fecha, par, buy_sell, sesion, riesgo_porcentaje, resultado, riesgo_beneficio_final, tiempo_duracion, confluencias, notas, imagen_url, link_tradingview_antes, link_tradingview_despues"
    )
    .single();

  if (error) throw new TradingRepoError(error.message);
  return mapTradeRowToUi(updated as TradeRow);
}

export async function deleteTrade(tradeId: string): Promise<void> {
  await getUserId();

  const { error } = await supabase.from("trades").delete().eq("id", tradeId);
  if (error) throw new TradingRepoError(error.message);
}

export async function uploadTradeImage(tradeId: string, file: File): Promise<{ path: string }> {
  const userId = await getUserId();

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userId}/trades/${tradeId}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage
    .from(TRADE_IMAGES_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw new TradingRepoError(error.message);
  return { path };
}

export async function getTradeImageSignedUrl(
  path: string,
  expiresInSeconds: number = 60 * 60
): Promise<{ signedUrl: string }> {
  await getUserId();

  const { data, error } = await supabase.storage
    .from(TRADE_IMAGES_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error) throw new TradingRepoError(error.message);
  if (!data?.signedUrl) throw new TradingRepoError("Failed to create signed URL");
  return { signedUrl: data.signedUrl };
}

export async function deleteTradeImage(path: string): Promise<void> {
  await getUserId();

  const { error } = await supabase.storage.from(TRADE_IMAGES_BUCKET).remove([path]);
  if (error) throw new TradingRepoError(error.message);
}

export async function getMonthIdByQuarterAndName(quarterId: string, monthName: string): Promise<string> {
  await getUserId();

  const { data, error } = await supabase
    .from("trading_months")
    .select("id")
    .eq("quarter_id", quarterId)
    .eq("month_name", monthName)
    .single();

  if (error) throw new TradingRepoError(error.message);
  return data.id;
}
