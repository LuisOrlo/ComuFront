import { COLORS } from "@/lib/constants"
import { Outlet } from "react-router"

export function FinancePagosPage() {
  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      <header
        className="shrink-0 px-8 py-8 border-b bg-white/80 backdrop-blur-md sticky top-0 z-20"
        style={{ borderColor: COLORS.BORDER_SUBTLE }}
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1
              className="text-2xl font-bold tracking-tighter leading-none"
              style={{ color: COLORS.CHARCOAL }}
            >
              Pagos y Cobros
            </h1>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}
