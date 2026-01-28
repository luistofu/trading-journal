// Trading Journal Types
export interface Trade {
  id: string;
  tradeNumber: string;
  fecha: string; // DD/MM/YYYY
  par: string; // EUR/USD, etc
  buySell: "Buy" | "Sell";
  sesion: "London" | "New York" | "Asian" | "Sydney";
  riesgoPorcentaje: string; // Cambiado a string para soportar select con valores predefinidos
  resultado: "Win" | "Loss" | "Break Even";
  riesgoBeneficioFinal: string; // Ratio riesgo:beneficio final (ej: "1:2", "1:3")
  tiempoDuracion: string; // Duración del trade (ej: "2h 30m", "1d 2h")
  confluencias: string;
  notas: string;
  imagenURL: string; // URL de la imagen del trade
  linkTradingViewAntes: string;
  linkTradingViewDespues: string;
}

export interface MonthData {
  month: string; // "Enero", "Febrero", etc
  year: number;
  trades: Trade[];
  notasMes: string;
  completado: boolean;
}

export interface QuarterData {
  id: string;
  year: number;
  quarter: 1 | 2 | 3 | 4;
  months: MonthData[];
  completado: boolean;
}

// Growth Account Types
export interface GrowthAccountData {
  id: string;
  accountName: string;
  initialCapital: number;
  brokerPropfirm: string;
  proposito: "Práctica" | "Evaluación" | "Fondeada" | "Real";
  year: number;
  quarter: 1 | 2 | 3 | 4;
  mes: string; // "Enero", "Febrero", etc - UN REGISTRO POR MES
  gananciaMensual: number; // Ganancia del mes específico
  monthlyTarget: number;
  ciclo?: "Fase 1" | "Fase 2" | "Fase 3"; // Opcional ahora
  promedioMes: number; // % promedio del mes - EDITABLE
  estado: "En progreso" | "Completado" | "En observación" | "Fallido";
}

// Notes/Diary Types
export interface Note {
  id: string;
  date: string; // fecha automática de creación
  emoji?: '😟' | '😐' | '😌' | '😤' | '💪';
  tags: Array<'Pensamiento' | 'Emoción' | 'Error' | 'Acierto' | 'Aprendizaje' | 'Libre'>;
  content: string;
}

export interface MonthNotes {
  month: string; // "Enero", "Febrero", etc.
  notes: Note[];
}

export interface QuarterReflection {
  year: number;
  quarter: 1 | 2 | 3 | 4;
  emoji?: '😟' | '😐' | '😌' | '😤' | '💪';
  content: string;
  createdAt: string;
  isLocked: boolean;
}

export interface NotesData {
  id: string;
  year: number;
  quarter: 1 | 2 | 3 | 4;
  monthlyNotes: [MonthNotes, MonthNotes, MonthNotes]; // 3 meses exactos
  quarterReflection?: QuarterReflection;
}