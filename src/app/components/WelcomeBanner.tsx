import { useState, useEffect } from "react";

interface WelcomeBannerProps {
  studentName: string;
}

export function WelcomeBanner({ studentName }: WelcomeBannerProps) {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const months = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${dayName}, ${day} de ${month} de ${year}`;
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const getTimeZone = (date: Date) => {
    // Get timezone offset in hours
    const offset = -date.getTimezoneOffset() / 60;
    const sign = offset >= 0 ? "+" : "-";
    const absoluteOffset = Math.abs(offset);
    
    // Format as GMT±X
    return `GMT${sign}${absoluteOffset}`;
  };

  return (
    <div className="bg-gradient-to-r from-[#416E87]/10 to-transparent border-l-4 border-[#416E87] rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            👋 Hola, {studentName}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {formatDate(currentDateTime)} • {formatTime(currentDateTime)} {getTimeZone(currentDateTime)}
          </p>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Empieza a registrar tus trades
          </p>
          <p className="text-xs text-[#416E87] font-medium">
            SkillX Trading Journal
          </p>
        </div>
      </div>
    </div>
  );
}