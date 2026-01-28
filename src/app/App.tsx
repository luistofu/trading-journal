import { useState, useEffect, useMemo } from "react";
import { Header } from "@/app/components/Header";
import { WelcomeBanner } from "@/app/components/WelcomeBanner";
import { RiskAlertBanner } from "@/app/components/RiskAlertBanner";
import { MetricsSummary } from "@/app/components/MetricsSummary";
import { MainNavigation } from "@/app/components/MainNavigation";
import { TradingJournal } from "@/app/components/TradingJournal";
import { GrowthAccountView } from "@/app/components/GrowthAccountView";
import { NotesView } from "@/app/components/NotesView";
import { ReportsView } from "@/app/components/ReportsView";
import { Onboarding } from "@/app/components/Onboarding";
import { LoginView } from "@/app/components/LoginView";
import { QuarterData, GrowthAccountData } from "@/app/types";
import { getCurrentYear, getCurrentQuarter } from "@/app/utils/quarterHelpers";
import { supabase } from "@/app/utils/supabaseClient";
import { listGrowthAccounts } from "@/app/data/growthRepo";

export default function App() {
  const [studentName, setStudentName] = useState("Eric");
  const [darkMode, setDarkMode] = useState(true); // Dark mode by default
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [activeView, setActiveView] = useState<"journal" | "growth" | "notes" | "reports">("journal");

  // Main data states
  const [quarterData, setQuarterData] = useState<QuarterData[]>([]);
  const [growthAccounts, setGrowthAccounts] = useState<GrowthAccountData[]>([]);

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Check onboarding
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem("skillx-onboarding-completed");
    if (hasCompletedOnboarding === "true") {
      setShowOnboarding(false);
    }
  }, []);

  // Check authentication
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setIsAuthenticated(!!data.session);
      setStudentName(data.session?.user?.email ?? "Eric");
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setStudentName(session?.user?.email ?? "Eric");
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    supabase.auth.signOut().finally(() => {
      setIsAuthenticated(false);
      setStudentName("Eric");
    });
  };

  // Load Growth Accounts from Supabase (Modo A)
  useEffect(() => {
    let mounted = true;

    if (!isAuthenticated) {
      setGrowthAccounts([]);
      return;
    }

    listGrowthAccounts()
      .then((rows) => {
        if (!mounted) return;
        setGrowthAccounts(rows);
      })
      .catch((e) => {
        console.error(e);
        if (!mounted) return;
        setGrowthAccounts([]);
      });

    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  const handleOnboardingComplete = () => {
    localStorage.setItem("skillx-onboarding-completed", "true");
    setShowOnboarding(false);
  };

  // Calculate global metrics from all quarters
  const metrics = useMemo(() => {
    const currentYear = getCurrentYear();
    const currentQ = getCurrentQuarter();
    
    // Get current quarter data
    const currentQuarter = quarterData.find(
      (q) => q.year === currentYear && q.quarter === currentQ
    );

    if (!currentQuarter) {
      return {
        totalTrades: 0,
        riesgoAcumulado: 0,
        limiteMaximo: 6,
        riesgoRestante: 6,
        porcentajeWins: 0,
        porcentajeLoss: 0,
        estado: "Normal" as "Normal" | "Alerta" | "Crítico",
      };
    }

    // Calculate from current quarter's current month
    const currentMonthIndex = new Date().getMonth() % 3; // 0, 1, or 2 within quarter
    const currentMonth = currentQuarter.months[currentMonthIndex];

    if (!currentMonth) {
      return {
        totalTrades: 0,
        riesgoAcumulado: 0,
        limiteMaximo: 6,
        riesgoRestante: 6,
        porcentajeWins: 0,
        porcentajeLoss: 0,
        estado: "Normal" as "Normal" | "Alerta" | "Crítico",
      };
    }

    const totalTrades = currentMonth.trades.length;
    const riesgoAcumulado = currentMonth.trades.reduce(
      (sum, trade) => {
        const riesgo = typeof trade.riesgoPorcentaje === 'string' 
          ? parseFloat(trade.riesgoPorcentaje) || 0 
          : trade.riesgoPorcentaje || 0;
        return sum + riesgo;
      },
      0
    );

    const limiteMaximo = 6;
    const riesgoRestante = Math.max(0, limiteMaximo - riesgoAcumulado);

    const wins = currentMonth.trades.filter((t) => t.resultado === "Win").length;
    const losses = currentMonth.trades.filter((t) => t.resultado === "Loss").length;
    const porcentajeWins = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const porcentajeLoss = totalTrades > 0 ? (losses / totalTrades) * 100 : 0;

    let estado: "Normal" | "Alerta" | "Crítico" = "Normal";
    if (riesgoAcumulado > 5) {
      estado = "Crítico";
    } else if (riesgoAcumulado > 3) {
      estado = "Alerta";
    }

    return {
      totalTrades,
      riesgoAcumulado,
      limiteMaximo,
      riesgoRestante,
      porcentajeWins,
      porcentajeLoss,
      estado,
    };
  }, [quarterData]);

  // Calculate Growth Account metrics from Trading Journal
  const calculatedGrowthAccounts = useMemo(() => {
    return growthAccounts.map((account) => {
      // Simply return the account as-is, without overwriting user-editable fields
      // User has full control over: gananciaMensual, promedioMes, estado
      return account;
    });
  }, [growthAccounts]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Show Login if not authenticated */}
      {!isAuthenticated && (
        <LoginView 
          onLoginSuccess={handleLoginSuccess} 
          darkMode={darkMode}
          onDarkModeToggle={() => setDarkMode(!darkMode)}
        />
      )}

      {/* Show main app only if authenticated */}
      {isAuthenticated && (
        <>
          {/* Onboarding */}
          {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}

          {/* Risk Alert Banner */}
          <RiskAlertBanner riskPercentage={metrics.riesgoAcumulado} />

          {/* Header */}
          <Header
            studentName={studentName}
            darkMode={darkMode}
            onDarkModeToggle={() => setDarkMode(!darkMode)}
            riskPercentage={metrics.riesgoAcumulado}
            onLogout={handleLogout}
          />

          {/* Main content */}
          <main className="pt-48 sm:pt-44 px-4 sm:px-6 pb-20 max-w-[1800px] mx-auto">
            {/* Welcome Banner */}
            <WelcomeBanner studentName={studentName} />
            
            {/* Metrics Summary */}
            <div className="mb-6 sm:mb-8">
              <MetricsSummary metrics={metrics} />
            </div>

            <MainNavigation
              activeView={activeView}
              onViewChange={setActiveView}
            />

            <div className="mt-6">
              {activeView === "journal" && (
                <TradingJournal
                  quarterData={quarterData}
                  onQuarterDataChange={setQuarterData}
                />
              )}
              {activeView === "growth" && (
                <GrowthAccountView
                  accounts={calculatedGrowthAccounts}
                  onAccountsChange={setGrowthAccounts}
                  quarterData={quarterData}
                />
              )}
              {activeView === "notes" && (
                <NotesView />
              )}
              {activeView === "reports" && (
                <ReportsView 
                  quarterData={quarterData}
                  growthAccounts={calculatedGrowthAccounts}
                />
              )}
            </div>
          </main>
        </>
      )}
    </div>
  );
}