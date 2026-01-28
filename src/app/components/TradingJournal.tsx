import { useState, useEffect } from "react";
import { QuarterData, MonthData } from "@/app/types";
import { MonthSection } from "@/app/components/MonthSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import {
  getCurrentYear,
  getCurrentQuarter,
  getQuarterMonths,
  isQuarterComplete,
} from "@/app/utils/quarterHelpers";
import { getTradingQuarterBundle } from "@/app/data/tradingRepo";

interface TradingJournalProps {
  quarterData: QuarterData[];
  onQuarterDataChange: (data: QuarterData[]) => void;
}

export function TradingJournal({
  quarterData,
  onQuarterDataChange,
}: TradingJournalProps) {
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [selectedQuarter, setSelectedQuarter] = useState<1 | 2 | 3 | 4>(
    getCurrentQuarter()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Current quarter bundle from state
  const currentQuarterData = quarterData.find(
    (q) => q.year === selectedYear && q.quarter === selectedQuarter
  );

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    setLoadError(null);

    getTradingQuarterBundle(selectedYear, selectedQuarter)
      .then((bundle) => {
        if (cancelled) return;

        // Keep only the current bundle in memory for now.
        onQuarterDataChange([bundle]);
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedYear, selectedQuarter]);

  const handleMonthUpdate = (monthIndex: number, updatedMonth: MonthData) => {
    const updatedQuarters = quarterData.map((q) => {
      if (q.year === selectedYear && q.quarter === selectedQuarter) {
        const newMonths = [...q.months];
        newMonths[monthIndex] = updatedMonth;
        
        // Check if quarter is complete
        const complete = isQuarterComplete(newMonths);
        
        return {
          ...q,
          months: newMonths,
          completado: complete,
        };
      }
      return q;
    });
    onQuarterDataChange(updatedQuarters);
  };

  // Available years
  const availableYears = Array.from(
    new Set([
      ...quarterData.map((q) => q.year),
      getCurrentYear(),
      getCurrentYear() - 1,
      getCurrentYear() + 1,
    ])
  ).sort((a, b) => b - a);

  const quarterStatus = currentQuarterData?.completado ? "Completado" : "En progreso";
  const isReadOnly = currentQuarterData?.completado || false;

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-[120px]">
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

        <Badge
          className={
            quarterStatus === "Completado"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
          }
        >
          {quarterStatus}
        </Badge>
      </div>

      {/* Quarter Tabs */}
      <Tabs
        value={selectedQuarter.toString()}
        onValueChange={(value) => setSelectedQuarter(parseInt(value) as 1 | 2 | 3 | 4)}
      >
        <TabsList className="w-full grid grid-cols-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <TabsTrigger
            value="1"
            className="data-[state=active]:bg-[#416E87] data-[state=active]:text-white"
          >
            Q1
          </TabsTrigger>
          <TabsTrigger
            value="2"
            className="data-[state=active]:bg-[#416E87] data-[state=active]:text-white"
          >
            Q2
          </TabsTrigger>
          <TabsTrigger
            value="3"
            className="data-[state=active]:bg-[#416E87] data-[state=active]:text-white"
          >
            Q3
          </TabsTrigger>
          <TabsTrigger
            value="4"
            className="data-[state=active]:bg-[#416E87] data-[state=active]:text-white"
          >
            Q4
          </TabsTrigger>
        </TabsList>

        {/* Quarter Indicator - Shows selected quarter months */}
        <div className="mt-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4 text-[#416E87]" />
            <span className="font-medium text-gray-900 dark:text-white">
              Q{selectedQuarter} {selectedYear}:
            </span>
            <span>
              {getQuarterMonths(selectedQuarter).join(" • ")}
            </span>
          </div>
        </div>

        {loadError && (
          <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-300">
            {loadError}
          </div>
        )}

        {isLoading && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm text-gray-600 dark:text-gray-400">
            Cargando...
          </div>
        )}

        {[1, 2, 3, 4].map((q) => (
          <TabsContent key={q} value={q.toString()} className="mt-6">
            <Card className="border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-xl">
                  Trading Journal — Q{q} {selectedYear}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {q === selectedQuarter && currentQuarterData?.months.map((month, index) => (
                  <MonthSection
                    key={`${month.month}-${month.year}`}
                    quarterId={currentQuarterData.id}
                    monthData={month}
                    onUpdate={(updated) => handleMonthUpdate(index, updated)}
                    isReadOnly={isReadOnly}
                  />
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}