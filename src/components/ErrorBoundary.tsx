import { Component, type ReactNode } from "react"
import { COLORS } from "@/lib/constants"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error): void {
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught:", error)
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 gap-6 px-6">
            <div className="text-center space-y-2">
              <p className="text-7xl font-bold" style={{ color: COLORS.ACCENT }}>
                500
              </p>
              <h1 className="text-xl font-semibold" style={{ color: COLORS.CHARCOAL }}>
                Algo salió mal
              </h1>
              <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>
                {import.meta.env.DEV
                  ? this.state.error?.message || "Ocurrió un error inesperado"
                  : "Ocurrió un error inesperado. Por favor, intenta recargar la página."}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { window.location.href = "/" }}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-150 active:scale-95"
                style={{ backgroundColor: COLORS.ACCENT }}
              >
                Volver al inicio
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150"
                style={{ backgroundColor: "white", color: COLORS.TEXT_MUTED, border: `1px solid ${COLORS.BORDER_SUBTLE}` }}
              >
                Recargar página
              </button>
            </div>
          </div>
        )
      )
    }
    return this.props.children
  }
}
