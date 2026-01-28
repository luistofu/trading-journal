import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { NotesData, MonthNotes, QuarterReflection } from "@/app/types";
import { MonthNotesSection } from "@/app/components/MonthNotesSection";
import { QuarterReflectionCard } from "@/app/components/QuarterReflectionCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { getDiaryQuarterBundle, upsertQuarterReflection } from "@/app/data/diaryRepo";

const MONTH_NAMES = [
  ["Enero", "Febrero", "Marzo"],
  ["Abril", "Mayo", "Junio"],
  ["Julio", "Agosto", "Septiembre"],
  ["Octubre", "Noviembre", "Diciembre"],
];

interface NotesViewProps {
  onClose?: () => void;
}

export function NotesView({ onClose }: NotesViewProps) {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedQuarter, setSelectedQuarter] = useState<1 | 2 | 3 | 4>(1);
  const [diaryQuarterId, setDiaryQuarterId] = useState<string | null>(null);
  const [currentQuarterData, setCurrentQuarterData] = useState<NotesData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Check if quarter is locked (simplified - you can add more complex logic)
  const isQuarterLocked = () => {
    // For now, only lock past years
    return selectedYear < new Date().getFullYear();
  };

  // Bootstrap + fetch from Supabase
  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setLoadError(null);

    getDiaryQuarterBundle({
      year: selectedYear,
      quarter: selectedQuarter,
      isLocked: isQuarterLocked(),
    })
      .then(({ diaryQuarterId, notesData }) => {
        if (cancelled) return;
        setDiaryQuarterId(diaryQuarterId);
        setCurrentQuarterData(notesData);
      })
      .catch((e) => {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedYear, selectedQuarter]);

  // Update month notes in local state (persistence happens inside MonthNotesSection)
  const handleMonthUpdate = (monthIndex: number, updatedMonth: MonthNotes) => {
    if (!currentQuarterData) return;
    const updatedQuarter = { ...currentQuarterData };
    updatedQuarter.monthlyNotes[monthIndex] = updatedMonth;
    setCurrentQuarterData(updatedQuarter);
  };

  // Persist quarter reflection
  const handleReflectionSave = async (reflection: Omit<QuarterReflection, 'createdAt'>) => {
    if (!currentQuarterData || !diaryQuarterId) return;
    if (isQuarterLocked()) return;

    try {
      const saved = await upsertQuarterReflection(diaryQuarterId, {
        emoji: reflection.emoji,
        content: reflection.content,
      });

      setCurrentQuarterData({
        ...currentQuarterData,
        quarterReflection: {
          year: selectedYear,
          quarter: selectedQuarter,
          emoji: (saved.emoji as QuarterReflection['emoji']) ?? undefined,
          content: saved.content,
          createdAt: saved.created_at,
          isLocked: isQuarterLocked(),
        },
      });
    } catch (e) {
      console.error(e);
    }
  };

  const availableYears = [2024, 2025, 2026, 2027];

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#F9F7F4] dark:bg-gray-900 -mx-4 sm:-mx-6 px-4 sm:px-6 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-300">
            {loadError}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !currentQuarterData || !diaryQuarterId) {
    return (
      <div className="min-h-screen bg-[#F9F7F4] dark:bg-gray-900 -mx-4 sm:-mx-6 px-4 sm:px-6 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-sm text-gray-600 dark:text-gray-400">
            Cargando...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F7F4] dark:bg-gray-900 -mx-4 sm:-mx-6 px-4 sm:px-6 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header with Year Selector */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light text-gray-900 dark:text-white mb-2">
              📝 Diario del Trader
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
              Un espacio personal para tus pensamientos, emociones y reflexiones
            </p>
          </div>

          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-32 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quarter Tabs */}
        <Tabs
          value={`q${selectedQuarter}`}
          onValueChange={(value) => setSelectedQuarter(parseInt(value.replace('q', '')) as 1 | 2 | 3 | 4)}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-sm">
            <TabsList className="bg-transparent grid grid-cols-2 sm:grid-cols-4 h-auto p-0 gap-4 sm:gap-6">
              <TabsTrigger 
                value="q1" 
                className="relative flex flex-col gap-1.5 py-6 px-6 data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#416E87] data-[state=active]:to-[#5a8ba3] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:hover:bg-gray-50 dark:data-[state=inactive]:hover:bg-gray-700/30 rounded-xl transition-all duration-300 border-2 border-transparent data-[state=active]:border-[#416E87] group"
              >
                <div className="absolute top-3 right-3 text-2xl opacity-30 group-data-[state=active]:opacity-70 transition-opacity">🌱</div>
                <span className="text-2xl font-bold tracking-tight">Q1</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide opacity-60 group-data-[state=active]:opacity-80">Trimestre</span>
                <span className="text-xs font-medium opacity-70 group-data-[state=active]:opacity-90 mt-1">Ene - Mar</span>
              </TabsTrigger>
              <TabsTrigger 
                value="q2" 
                className="relative flex flex-col gap-1.5 py-6 px-6 data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#416E87] data-[state=active]:to-[#5a8ba3] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:hover:bg-gray-50 dark:data-[state=inactive]:hover:bg-gray-700/30 rounded-xl transition-all duration-300 border-2 border-transparent data-[state=active]:border-[#416E87] group"
              >
                <div className="absolute top-3 right-3 text-2xl opacity-30 group-data-[state=active]:opacity-70 transition-opacity">☀️</div>
                <span className="text-2xl font-bold tracking-tight">Q2</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide opacity-60 group-data-[state=active]:opacity-80">Trimestre</span>
                <span className="text-xs font-medium opacity-70 group-data-[state=active]:opacity-90 mt-1">Abr - Jun</span>
              </TabsTrigger>
              <TabsTrigger 
                value="q3" 
                className="relative flex flex-col gap-1.5 py-6 px-6 data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#416E87] data-[state=active]:to-[#5a8ba3] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:hover:bg-gray-50 dark:data-[state=inactive]:hover:bg-gray-700/30 rounded-xl transition-all duration-300 border-2 border-transparent data-[state=active]:border-[#416E87] group"
              >
                <div className="absolute top-3 right-3 text-2xl opacity-30 group-data-[state=active]:opacity-70 transition-opacity">🍂</div>
                <span className="text-2xl font-bold tracking-tight">Q3</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide opacity-60 group-data-[state=active]:opacity-80">Trimestre</span>
                <span className="text-xs font-medium opacity-70 group-data-[state=active]:opacity-90 mt-1">Jul - Sep</span>
              </TabsTrigger>
              <TabsTrigger 
                value="q4" 
                className="relative flex flex-col gap-1.5 py-6 px-6 data-[state=active]:bg-gradient-to-br data-[state=active]:from-[#416E87] data-[state=active]:to-[#5a8ba3] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:hover:bg-gray-50 dark:data-[state=inactive]:hover:bg-gray-700/30 rounded-xl transition-all duration-300 border-2 border-transparent data-[state=active]:border-[#416E87] group"
              >
                <div className="absolute top-3 right-3 text-2xl opacity-30 group-data-[state=active]:opacity-70 transition-opacity">❄️</div>
                <span className="text-2xl font-bold tracking-tight">Q4</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide opacity-60 group-data-[state=active]:opacity-80">Trimestre</span>
                <span className="text-xs font-medium opacity-70 group-data-[state=active]:opacity-90 mt-1">Oct - Dic</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={`q${selectedQuarter}`} className="mt-6 space-y-8">
            {/* Monthly Notes Sections */}
            {currentQuarterData.monthlyNotes.map((monthData, index) => (
              <div
                key={monthData.month}
                className="bg-white/50 dark:bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm"
              >
                <MonthNotesSection
                  diaryQuarterId={diaryQuarterId}
                  monthData={monthData}
                  onUpdate={(updated) => handleMonthUpdate(index, updated)}
                  isLocked={isQuarterLocked()}
                />
              </div>
            ))}

            {/* Quarter Reflection */}
            <QuarterReflectionCard
              reflection={currentQuarterData.quarterReflection}
              onSave={handleReflectionSave}
              isLocked={isQuarterLocked()}
              year={selectedYear}
              quarter={selectedQuarter}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}