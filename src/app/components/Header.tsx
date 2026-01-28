import { User, Moon, Sun, LogOut } from "lucide-react";
import { SkillXLogo } from "@/app/components/SkillXLogo";
import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

interface HeaderProps {
  studentName: string;
  darkMode: boolean;
  onDarkModeToggle: () => void;
  riskPercentage: number;
  onLogout: () => void;
}

export function Header({ studentName, darkMode, onDarkModeToggle, riskPercentage, onLogout }: HeaderProps) {
  const getRiskStatus = (risk: number) => {
    if (risk >= 6) return { label: "CRÍTICO", color: "bg-red-500" };
    if (risk >= 4) return { label: "ALERTA", color: "bg-orange-500" };
    return { label: "NORMAL", color: "bg-green-500" };
  };

  const riskStatus = getRiskStatus(riskPercentage);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-50">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 max-w-[1800px] mx-auto">
        {/* Logo */}
        <div className="flex items-center">
          <SkillXLogo className="w-24 sm:w-32" />
        </div>

        {/* Center - Risk Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              Riesgo Mensual
            </span>
            <div className="flex items-center gap-2">
              <span className="font-semibold dark:text-white">
                {riskPercentage.toFixed(2)}%
              </span>
              <span
                className={`px-1.5 py-0.5 text-[10px] font-medium text-white rounded ${riskStatus.color}`}
              >
                {riskStatus.label}
              </span>
            </div>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Student profile with dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                <div className="w-7 h-7 rounded-full bg-[#416E87] flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium dark:text-white hidden sm:inline">
                  {studentName}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{studentName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    Cuenta de Trading Educativo
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-red-600 dark:text-red-400"
                onClick={onLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dark mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onDarkModeToggle}
            className="h-9 w-9"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  );
}