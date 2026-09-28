import { Outlet } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Wallet01Icon } from "@hugeicons/core-free-icons"

export function FinancePagosPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#f8f9ff]">
      <header className="shrink-0 border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#fd761a] shrink-0 shadow-2xs">
              <HugeiconsIcon icon={Wallet01Icon} size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Pagos y Cobros
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Gestión de cuentas por cobrar, control de abonos y saldos pendientes
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}
