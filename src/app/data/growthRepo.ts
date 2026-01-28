import { supabase } from "@/app/utils/supabaseClient";
import type { GrowthAccountData } from "@/app/types";

type GrowthAccountRow = {
  id: string;
  user_id: string;
  year: number;
  quarter: number;
  mes: string;
  account_name: string;
  initial_capital: number;
  broker_propfirm: string;
  proposito: "Práctica" | "Evaluación" | "Fondeada" | "Real";
  ganancia_mensual: number;
  monthly_target: number;
  ciclo: "Fase 1" | "Fase 2" | "Fase 3" | null;
  promedio_mes: number;
  estado: "En progreso" | "Completado" | "En observación" | "Fallido";
};

export class GrowthRepoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GrowthRepoError";
  }
}

function assertAuthenticated(userId: string | undefined): asserts userId {
  if (!userId) throw new GrowthRepoError("Not authenticated");
}

async function getUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new GrowthRepoError(error.message);
  assertAuthenticated(data.user?.id);
  return data.user.id;
}

function mapRowToUi(row: GrowthAccountRow): GrowthAccountData {
  return {
    id: row.id,
    accountName: row.account_name,
    initialCapital: row.initial_capital,
    brokerPropfirm: row.broker_propfirm,
    proposito: row.proposito,
    year: row.year,
    quarter: row.quarter as 1 | 2 | 3 | 4,
    mes: row.mes,
    gananciaMensual: row.ganancia_mensual,
    monthlyTarget: row.monthly_target,
    ciclo: row.ciclo ?? undefined,
    promedioMes: row.promedio_mes,
    estado: row.estado,
  };
}

export async function listGrowthAccounts(params?: {
  year?: number;
  quarter?: 1 | 2 | 3 | 4;
}): Promise<GrowthAccountData[]> {
  await getUserId();

  let query = supabase
    .from("growth_accounts")
    .select(
      "id, user_id, year, quarter, mes, account_name, initial_capital, broker_propfirm, proposito, ganancia_mensual, monthly_target, ciclo, promedio_mes, estado"
    );

  if (params?.year !== undefined) query = query.eq("year", params.year);
  if (params?.quarter !== undefined) query = query.eq("quarter", params.quarter);

  const { data, error } = await query
    .order("year", { ascending: false })
    .order("quarter", { ascending: true })
    .order("mes", { ascending: true });

  if (error) throw new GrowthRepoError(error.message);
  return ((data ?? []) as GrowthAccountRow[]).map(mapRowToUi);
}

export async function createGrowthAccount(payload: Omit<GrowthAccountData, "id">): Promise<GrowthAccountData> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from("growth_accounts")
    .insert({
      user_id: userId,
      year: payload.year,
      quarter: payload.quarter,
      mes: payload.mes,
      account_name: payload.accountName,
      initial_capital: payload.initialCapital,
      broker_propfirm: payload.brokerPropfirm,
      proposito: payload.proposito,
      ganancia_mensual: payload.gananciaMensual,
      monthly_target: payload.monthlyTarget,
      ciclo: payload.ciclo ?? null,
      promedio_mes: payload.promedioMes,
      estado: payload.estado,
    })
    .select(
      "id, user_id, year, quarter, mes, account_name, initial_capital, broker_propfirm, proposito, ganancia_mensual, monthly_target, ciclo, promedio_mes, estado"
    )
    .single();

  if (error) throw new GrowthRepoError(error.message);
  return mapRowToUi(data as GrowthAccountRow);
}

export async function updateGrowthAccount(id: string, patch: Partial<GrowthAccountData>): Promise<GrowthAccountData> {
  await getUserId();

  const update: Record<string, unknown> = {};

  if (patch.accountName !== undefined) update.account_name = patch.accountName;
  if (patch.initialCapital !== undefined) update.initial_capital = patch.initialCapital;
  if (patch.brokerPropfirm !== undefined) update.broker_propfirm = patch.brokerPropfirm;
  if (patch.proposito !== undefined) update.proposito = patch.proposito;
  if (patch.gananciaMensual !== undefined) update.ganancia_mensual = patch.gananciaMensual;
  if (patch.monthlyTarget !== undefined) update.monthly_target = patch.monthlyTarget;
  if (patch.ciclo !== undefined) update.ciclo = patch.ciclo ?? null;
  if (patch.promedioMes !== undefined) update.promedio_mes = patch.promedioMes;
  if (patch.estado !== undefined) update.estado = patch.estado;

  const { data, error } = await supabase
    .from("growth_accounts")
    .update(update)
    .eq("id", id)
    .select(
      "id, user_id, year, quarter, mes, account_name, initial_capital, broker_propfirm, proposito, ganancia_mensual, monthly_target, ciclo, promedio_mes, estado"
    )
    .single();

  if (error) throw new GrowthRepoError(error.message);
  return mapRowToUi(data as GrowthAccountRow);
}

export async function deleteGrowthAccount(id: string): Promise<void> {
  await getUserId();

  const { error } = await supabase.from("growth_accounts").delete().eq("id", id);
  if (error) throw new GrowthRepoError(error.message);
}
