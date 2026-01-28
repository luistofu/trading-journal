// Quarter configuration
export const QUARTERS = {
  1: ["Enero", "Febrero", "Marzo"],
  2: ["Abril", "Mayo", "Junio"],
  3: ["Julio", "Agosto", "Septiembre"],
  4: ["Octubre", "Noviembre", "Diciembre"],
} as const;

export const QUARTER_LABELS = {
  1: "Q1",
  2: "Q2",
  3: "Q3",
  4: "Q4",
} as const;

export const RISK_MAX_MONTHLY = 6;

export function getQuarterLabel(quarter: 1 | 2 | 3 | 4): string {
  return QUARTER_LABELS[quarter];
}

export function getQuarterMonths(quarter: 1 | 2 | 3 | 4): readonly string[] {
  return QUARTERS[quarter];
}

export function getCurrentQuarter(): 1 | 2 | 3 | 4 {
  const month = new Date().getMonth(); // 0-11
  return (Math.floor(month / 3) + 1) as 1 | 2 | 3 | 4;
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export function isQuarterComplete(months: any[]): boolean {
  return months.every((month) => month.completado);
}

export function calculateMonthlyRisk(trades: any[]): number {
  return trades.reduce((sum, trade) => {
    const riesgo = typeof trade.riesgoPorcentaje === 'string' 
      ? parseFloat(trade.riesgoPorcentaje) || 0 
      : trade.riesgoPorcentaje || 0;
    return sum + riesgo;
  }, 0);
}

export function getRiskStatus(risk: number): {
  label: string;
  color: string;
  alert: boolean;
} {
  if (risk >= RISK_MAX_MONTHLY) {
    return { label: "Límite alcanzado", color: "red", alert: true };
  }
  if (risk >= 5) {
    return { label: "Cerca del límite", color: "orange", alert: true };
  }
  return { label: "Normal", color: "green", alert: false };
}