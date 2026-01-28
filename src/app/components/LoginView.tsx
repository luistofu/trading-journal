import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Eye, EyeOff, CheckCircle2, XCircle, Loader2, Moon, Sun, Mail, Clock, X } from "lucide-react";
import { SkillXLogo } from "@/app/components/SkillXLogo";
import { supabase } from "@/app/utils/supabaseClient";

type AuthView = "login" | "request-activation" | "create-password";

interface LoginViewProps {
  onLoginSuccess: () => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
}

export function LoginView({ onLoginSuccess, darkMode, onDarkModeToggle }: LoginViewProps) {
  const [currentView, setCurrentView] = useState<AuthView>("login");
  const [showTestingMenu, setShowTestingMenu] = useState(false);
  const [showEmailSentModal, setShowEmailSentModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [signupError, setSignupError] = useState("");
  const [requestEmail, setRequestEmail] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Password validation
  const passwordValidations = {
    minLength: newPassword.length >= 8,
    hasUpperCase: /[A-Z]/.test(newPassword),
    hasNumber: /\d/.test(newPassword),
  };

  const isPasswordValid =
    passwordValidations.minLength &&
    passwordValidations.hasUpperCase &&
    passwordValidations.hasNumber;

  const doPasswordsMatch = newPassword === confirmPassword && newPassword !== "";

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoginError(error.message);
        return;
      }

      onLoginSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Request Activation Link
  const handleRequestActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setRequestEmail(email);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        setLoginError(error.message);
        return;
      }

      setShowEmailSentModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Resend Link
  const handleResendLink = () => {
    if (resendTimer > 0) return;

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setResendTimer(60); // 60 seconds cooldown
      
      // Start countdown
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 1000);
  };

  // Handle Create Password
  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");
    
    if (!isPasswordValid) {
      return;
    }

    if (!doPasswordsMatch) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password: newPassword,
      });

      if (error) {
        setSignupError(error.message);
        return;
      }

      setShowSuccessMessage(true);

      setTimeout(() => {
        setCurrentView("login");
        setShowSuccessMessage(false);
        setNewPassword("");
        setConfirmPassword("");
        setPassword("");
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  // Render Login View
  if (currentView === "login") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 relative">
        {/* Testing Menu Toggle */}
        <button
          onClick={() => setShowTestingMenu(!showTestingMenu)}
          className="absolute top-6 left-6 px-3 py-1.5 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded-md font-medium transition-colors shadow-md z-50"
        >
          {showTestingMenu ? "Ocultar Testing" : "Menú Testing"}
        </button>

        {/* Testing Menu */}
        {showTestingMenu && (
          <div className="absolute top-16 left-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-50">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Navegar Vistas:</p>
            <div className="space-y-1">
              <button
                onClick={() => setCurrentView("login")}
                className={`w-full text-left px-3 py-1.5 text-xs rounded ${
                  currentView === "login"
                    ? "bg-[#416E87] text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                1. Login
              </button>
              <button
                onClick={() => setCurrentView("request-activation")}
                className={`w-full text-left px-3 py-1.5 text-xs rounded ${
                  currentView === "request-activation"
                    ? "bg-[#416E87] text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                2. Solicitar Enlace
              </button>
              <button
                onClick={() => setCurrentView("create-password")}
                className={`w-full text-left px-3 py-1.5 text-xs rounded ${
                  currentView === "create-password"
                    ? "bg-[#416E87] text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                3. Crear Contraseña
              </button>
            </div>
          </div>
        )}

        {/* Dark Mode Toggle */}
        <button
          onClick={onDarkModeToggle}
          className="absolute top-6 right-6 p-2.5 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-all shadow-md"
          aria-label="Toggle dark mode"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-[#416E87] dark:text-[#5a8ca8]" />
          ) : (
            <Moon className="w-5 h-5 text-[#416E87]" />
          )}
        </button>

        {/* Main Login Container */}
        <div className="w-full max-w-5xl mx-auto grid md:grid-cols-2 gap-0 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Left Side - Branding */}
          <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-[#416E87] to-[#2d4d5f] p-12 text-white relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative z-10">
              {/* Logo */}
              <div className="mb-8">
                <SkillXLogo className="h-16 w-auto" />
              </div>
              
              <h1 className="text-4xl font-bold mb-4">
                Bienvenido a tu<br />Trading Journal
              </h1>
              <p className="text-[#b8d4e0] text-base leading-relaxed">
                Lleva un registro completo de tus operaciones, analiza tu rendimiento y mejora tu estrategia con herramientas profesionales.
              </p>
            </div>

            <div className="relative z-10 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Organización por trimestres</h3>
                  <p className="text-sm text-[#b8d4e0]">Sistema estructurado Q1-Q4 con seguimiento mensual completo</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Métricas automáticas</h3>
                  <p className="text-sm text-[#b8d4e0]">Análisis en tiempo real de tu rendimiento y gestión de riesgo</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Journal de notas</h3>
                  <p className="text-sm text-[#b8d4e0]">Registra confluencias, emociones y lecciones aprendidas</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Alertas de riesgo</h3>
                  <p className="text-sm text-[#b8d4e0]">Sistema de alertas cuando alcances el 6% de riesgo</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Historial completo</h3>
                  <p className="text-sm text-[#b8d4e0]">Navegación por años y comparación entre trimestres</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Dashboard de evolución</h3>
                  <p className="text-sm text-[#b8d4e0]">Promedios históricos y análisis de tu progreso</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            {/* Logo - Always visible */}
            <div className="flex justify-center mb-8">
              <SkillXLogo className="h-32 w-auto" />
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Iniciar sesión
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Ingresa tus credenciales para acceder a tu cuenta
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Correo electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setLoginError("");
                  }}
                  className="h-11 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-[#416E87] focus:border-transparent transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setLoginError("");
                    }}
                    className="h-11 border-gray-300 dark:border-gray-600 pr-10 focus:ring-2 focus:ring-[#416E87] focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-md p-4">
                  <p className="text-sm text-red-800 dark:text-red-400 font-medium">{loginError}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-[#416E87] hover:bg-[#355a6d] text-white font-medium shadow-lg hover:shadow-xl transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    ¿Necesitas ayuda?
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setCurrentView("request-activation")}
                  className="w-full text-center py-2 px-4 text-sm font-medium text-[#416E87] hover:text-[#355a6d] dark:text-[#5a8ca8] dark:hover:text-[#6fa3bf] hover:bg-[#416E87]/5 dark:hover:bg-[#416E87]/10 rounded-lg transition-all"
                >
                  ¿Olvidaste tu contraseña?
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentView("create-password")}
                  className="w-full text-center py-2 px-4 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-all"
                >
                  ¿Primera vez? Crea tu contraseña
                </button>
              </div>
            </form>

            {/* Demo Credentials */}
            <div className="mt-8 p-4 bg-[#416E87]/5 dark:bg-[#416E87]/10 border border-[#416E87]/20 rounded-lg">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Credenciales de prueba:</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Email: demo@skillx.com</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Contraseña: Demo123</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Request Activation Link View
  if (currentView === "request-activation") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 relative">
        {/* Testing Menu Toggle */}
        <button
          onClick={() => setShowTestingMenu(!showTestingMenu)}
          className="absolute top-6 left-6 px-3 py-1.5 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded-md font-medium transition-colors"
        >
          {showTestingMenu ? "Ocultar Testing" : "Menú Testing"}
        </button>

        {/* Testing Menu */}
        {showTestingMenu && (
          <div className="absolute top-16 left-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-50">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Navegar Vistas:</p>
            <div className="space-y-1">
              <button
                onClick={() => setCurrentView("login")}
                className={`w-full text-left px-3 py-1.5 text-xs rounded ${
                  currentView === "login"
                    ? "bg-[#416E87] text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                1. Login
              </button>
              <button
                onClick={() => setCurrentView("request-activation")}
                className={`w-full text-left px-3 py-1.5 text-xs rounded ${
                  currentView === "request-activation"
                    ? "bg-[#416E87] text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                2. Solicitar Enlace
              </button>
              <button
                onClick={() => setCurrentView("create-password")}
                className={`w-full text-left px-3 py-1.5 text-xs rounded ${
                  currentView === "create-password"
                    ? "bg-[#416E87] text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                3. Crear Contraseña
              </button>
              <button
                onClick={() => setShowEmailSentModal(true)}
                className="w-full text-left px-3 py-1.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Ver Modal "Revisa correo"
              </button>
            </div>
          </div>
        )}

        {/* Dark Mode Toggle */}
        <button
          onClick={onDarkModeToggle}
          className="absolute top-6 right-6 p-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle dark mode"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-[#416E87] dark:text-[#5a8ca8]" />
          ) : (
            <Moon className="w-5 h-5 text-[#416E87]" />
          )}
        </button>

        {/* Email Sent Modal */}
        {showEmailSentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md border-gray-200 dark:border-gray-700 relative">
              <button
                onClick={() => setShowEmailSentModal(false)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
              
              <CardHeader className="space-y-4 pt-6">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#416E87]/10 flex items-center justify-center">
                    <Mail className="w-8 h-8 text-[#416E87]" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white text-center">
                  Revisa tu correo
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Main Message */}
                <div className="bg-[#416E87]/10 border border-[#416E87]/20 rounded-md p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-medium text-center">
                    Si el correo existe en nuestro sistema, te hemos enviado un enlace para crear tu contraseña.
                  </p>
                </div>
                
                {/* Secondary Messages */}
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>• Revisa la carpeta de Spam.</p>
                  <p>• El enlace puede expirar.</p>
                </div>

                {/* Buttons */}
                <div className="space-y-3 pt-2">
                  <Button
                    onClick={() => {
                      setShowEmailSentModal(false);
                      setCurrentView("login");
                    }}
                    className="w-full bg-[#416E87] hover:bg-[#355a6d] text-white"
                  >
                    Volver a Login
                  </Button>
                  
                  <button
                    type="button"
                    onClick={handleResendLink}
                    className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={resendTimer > 0}
                  >
                    {resendTimer > 0 ? `Reenviar enlace (${resendTimer}s)` : "Reenviar enlace"}
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="w-full max-w-md border-gray-200 dark:border-gray-700">
          <CardHeader className="space-y-4">
            {/* Logo */}
            <div className="flex justify-center">
              <SkillXLogo className="w-32" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white text-center">
                Activar cuenta / Crear contraseña
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 text-center mt-2">
                Ingresa tu correo y te enviaremos un enlace para crear tu contraseña
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRequestActivation} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-gray-300 dark:border-gray-600"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#416E87] hover:bg-[#355a6d] text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar enlace"
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setCurrentView("login")}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:underline"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render Create Password View
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 relative">
      {/* Testing Menu Toggle */}
      <button
        onClick={() => setShowTestingMenu(!showTestingMenu)}
        className="absolute top-6 left-6 px-3 py-1.5 text-xs bg-yellow-500 hover:bg-yellow-600 text-white rounded-md font-medium transition-colors"
      >
        {showTestingMenu ? "Ocultar Testing" : "Menú Testing"}
      </button>

      {/* Testing Menu */}
      {showTestingMenu && (
        <div className="absolute top-16 left-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-50">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Navegar Vistas:</p>
          <div className="space-y-1">
            <button
              onClick={() => setCurrentView("login")}
              className={`w-full text-left px-3 py-1.5 text-xs rounded ${
                currentView === "login"
                  ? "bg-[#416E87] text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              1. Login
            </button>
            <button
              onClick={() => setCurrentView("request-activation")}
              className={`w-full text-left px-3 py-1.5 text-xs rounded ${
                currentView === "request-activation"
                  ? "bg-[#416E87] text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              2. Solicitar Enlace
            </button>
            <button
              onClick={() => setCurrentView("create-password")}
              className={`w-full text-left px-3 py-1.5 text-xs rounded ${
                currentView === "create-password"
                  ? "bg-[#416E87] text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              3. Crear Contraseña
            </button>
          </div>
        </div>
      )}

      {/* Dark Mode Toggle */}
      <button
        onClick={onDarkModeToggle}
        className="absolute top-6 right-6 p-2.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        aria-label="Toggle dark mode"
      >
        {darkMode ? (
          <Sun className="w-5 h-5 text-[#416E87] dark:text-[#5a8ca8]" />
        ) : (
          <Moon className="w-5 h-5 text-[#416E87]" />
        )}
      </button>

      <Card className="w-full max-w-md border-gray-200 dark:border-gray-700">
        <CardHeader className="space-y-4">
          {/* Logo */}
          <div className="flex justify-center">
            <SkillXLogo className="w-32" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white text-center">
              Crear contraseña
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400 text-center mt-2">
              Configura el acceso a tu cuenta
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-email" className="text-gray-700 dark:text-gray-300">
                Email
              </Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSignupError("");
                }}
                className="border-gray-300 dark:border-gray-600"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-gray-700 dark:text-gray-300">
                Nueva contraseña
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                  }}
                  className="border-gray-300 dark:border-gray-600 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-gray-700 dark:text-gray-300">
                Confirmar contraseña
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                  }}
                  className="border-gray-300 dark:border-gray-600 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Rules */}
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4 space-y-2">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                La contraseña debe cumplir:
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  {passwordValidations.minLength ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  )}
                  <span
                    className={
                      passwordValidations.minLength
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-600 dark:text-gray-400"
                    }
                  >
                    Mínimo 8 caracteres
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {passwordValidations.hasUpperCase ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  )}
                  <span
                    className={
                      passwordValidations.hasUpperCase
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-600 dark:text-gray-400"
                    }
                  >
                    Al menos 1 mayúscula
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {passwordValidations.hasNumber ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  )}
                  <span
                    className={
                      passwordValidations.hasNumber
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-600 dark:text-gray-400"
                    }
                  >
                    Al menos 1 número
                  </span>
                </div>
              </div>
            </div>

            {showSuccessMessage && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3">
                <p className="text-sm text-green-800 dark:text-green-400">Contraseña creada exitosamente</p>
              </div>
            )}

            {signupError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                <p className="text-sm text-red-800 dark:text-red-400">{signupError}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-[#416E87] hover:bg-[#355a6d] text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar contraseña"
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setCurrentView("login")}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:underline"
              >
                Volver al inicio de sesión
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}