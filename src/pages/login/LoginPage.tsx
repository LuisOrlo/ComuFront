import { useState } from "react"
import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  EyeIcon,
  EyeClosedIcon,
  UserIcon,
  LockPasswordIcon,
  ArrowRight01Icon,
  Alert02Icon,
} from "@hugeicons/core-free-icons"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"

const ACCENT_TOMATO = "oklch(0.65 0.2 45)"
const ACCENT_HOVER = "oklch(0.55 0.2 45)"
const CHARCOAL = "oklch(0.15 0 0)"
const TEXT_MUTED = "oklch(0.65 0 0)"
const BORDER_SUBTLE = "oklch(0.85 0 0)"

export function LoginPage() {
  const { login } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await login(username, password)
    } catch (err: unknown) {
      let msg = "Usuario o contraseña incorrectos"
      if (typeof err === "object" && err !== null && "response" in err) {
        const axiosError = err as { response?: { data?: { mensaje?: string } } }
        if (axiosError.response?.data?.mensaje) {
          msg = axiosError.response.data.mensaje
        }
      }
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="relative flex min-h-[100dvh] w-full overflow-hidden"
      style={{
        fontFamily: "'Figtree Variable', system-ui, sans-serif",
      }}
    >
      {/* Left Panel - Visual */}
      <div
        className="hidden lg:flex flex-col justify-between relative w-1/2 overflow-hidden"
        style={{ backgroundColor: CHARCOAL }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.07]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Decorative gradient overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 30% 20%, ${ACCENT_TOMATO}15 0%, transparent 50%),
                        radial-gradient(ellipse at 80% 80%, ${ACCENT_TOMATO}10 0%, transparent 40%)`,
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-12 lg:p-16">
          {/* Logo area */}
          <div className="flex items-center gap-4">
            <img
              src="/Logo.png"
              alt="Comunikate Academy"
              className="h-40 w-auto object-contain"
              style={{ filter: "brightness(0) invert(1)" }}
            />
            <div>
              <h1
                className="text-2xl font-semibold tracking-tight text-white"
                style={{ letterSpacing: "-0.02em" }}
              >
                Comunikate Academy
              </h1>
              <p
                className="text-sm text-white/50"
                style={{ letterSpacing: "0.02em" }}
              >
                Academia de Comunicación
              </p>
            </div>
          </div>

          

          {/* Footer tagline */}
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-[2px] rounded-full"
              style={{ backgroundColor: ACCENT_TOMATO }}
            />
            <p className="text-sm text-white/30 tracking-wide">
              Comunikate Academy
            </p>
          </div>
        </div>

        {/* Film reel decoration */}
        <div
          className="absolute -right-16 top-1/4 w-64 h-64 rounded-full opacity-[0.04] border-8 border-white"
          style={{ borderColor: "rgba(255,255,255,0.3)" }}
        />
        <div
          className="absolute -right-16 top-1/4 w-64 h-64 rounded-full opacity-[0.06]"
          style={{
            background: `repeating-conic-gradient(from 0deg, transparent 0deg 10deg, rgba(255,255,255,0.1) 10deg 20deg)`,
          }}
        />
      </div>

      {/* Right Panel - Form */}
      <div
        className="flex flex-col justify-center w-full lg:w-1/2 min-h-svh"
        style={{ backgroundColor: "oklch(0.99 0 0)" }}
      >
        <div className="w-full max-w-md mx-auto px-6 py-12 lg:px-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <img
              src="/Logo.png"
              alt="Comunikate Academy"
              className="h-10 w-auto object-contain"
            />
            <div>
              <h1 className="text-xl font-semibold tracking-tight" style={{ color: CHARCOAL }}>
                Comunikate Academy
              </h1>
              <p className="text-xs text-[--muted-foreground]">Academia de Comunicación</p>
            </div>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <h2
              className="text-3xl font-semibold tracking-tight mb-2"
              style={{
                color: CHARCOAL,
                letterSpacing: "-0.025em",
              }}
            >
              Bienvenido
            </h2>
            <p className="text-base" style={{ color: TEXT_MUTED }}>
              Ingresa tus credenciales para acceder a la plataforma
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username field */}
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="text-sm font-medium text-[--foreground]"
                style={{ color: CHARCOAL }}
              >
                Usuario
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <HugeiconsIcon
                    icon={UserIcon}
                    size={18}
                    className="text-[--muted-foreground]"
                  />
                </div>
                <Input
                  id="username"
                  type="text"
                  placeholder="tu-usuario"
                  value={username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  className="pl-10 h-12 rounded-xl border-[--border] bg-transparent"
                  style={
                    {
                      "--input-border": BORDER_SUBTLE,
                    } as React.CSSProperties
                  }
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium"
                style={{ color: CHARCOAL }}
              >
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <HugeiconsIcon
                    icon={LockPasswordIcon}
                    size={18}
                    className="text-[--muted-foreground]"
                  />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pl-10 pr-10 h-12 rounded-xl border-[--border] bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[--muted-foreground] hover:text-[--foreground] transition-colors cursor-pointer"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  <HugeiconsIcon
                    icon={showPassword ? EyeClosedIcon : EyeIcon}
                    size={18}
                  />
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label
                htmlFor="remember"
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(checked: boolean | "indeterminate") => setRemember(checked === true)}
                  className="data-[state=checked]:bg-[--accent] data-[state=checked]:border-[--accent]"
                />
                <span className="text-sm" style={{ color: TEXT_MUTED }}>
                  Recordarme
                </span>
              </label>
              <a
                href="#"
                className="text-sm transition-colors hover:underline"
                style={{ color: ACCENT_TOMATO }}
                onClick={(e) => e.preventDefault()}
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm leading-snug">
                <HugeiconsIcon
                  icon={Alert02Icon}
                  size={18}
                  className="text-red-500 shrink-0 mt-0.5"
                />
                <span>{error}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "relative w-full h-12 rounded-xl font-medium text-base transition-all duration-200",
                "bg-[--accent] text-white",
                "hover:bg-[--accent]/90",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                "disabled:opacity-60 disabled:cursor-not-allowed",
                "active:scale-[0.98]"
              )}
              style={
                {
                  backgroundColor: ACCENT_TOMATO,
                  "--accent-hover": ACCENT_HOVER,
                } as React.CSSProperties
              }
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Iniciando sesión...
                </span>
              ) : (
                "Iniciar sesión"
              )}
            </button>
          </form>

          {/* New Enrollment Link */}
          <div className="mt-8 pt-8 border-t" style={{ borderColor: BORDER_SUBTLE }}>
            <div className="text-center space-y-4">
              <p className="text-sm" style={{ color: TEXT_MUTED }}>
                ¿Eres un nuevo estudiante?
              </p>
              <Link
                to="/matricula/nueva"
                className="group inline-flex items-center gap-2 text-sm font-semibold transition-all hover:opacity-80 active:scale-95"
                style={{ color: ACCENT_TOMATO }}
              >
                Comenzar nueva matrícula
                <HugeiconsIcon 
                  icon={ArrowRight01Icon} 
                  size={18} 
                  className="transition-transform group-hover:translate-x-1" 
                />
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 pt-6 text-center">
            <p className="text-xs" style={{ color: TEXT_MUTED }}>
              © 2026 Comunikate Academy. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}