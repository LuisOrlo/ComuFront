import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ChartBarLineIcon, Invoice02Icon, InvoiceIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { NavLink, Outlet, useLocation } from "react-router"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { FinanceResumen } from "./sections/FinanceResumen"

const TABS = [
  {
    label: "Resumen",
    icon: ChartBarLineIcon,
    path: "/finanzas/pagos/resumen",
  },
  {
    label: "Historial",
    icon: Invoice02Icon,
    path: "/finanzas/pagos/historial",
  },
  {
    label: "Cuentas por Cobrar",
    icon: InvoiceIcon,
    path: "/finanzas/pagos/cuentas/cursos",
  },
]

export function FinancePagosPage() {
  const location = useLocation()

  const hideTabs = !TABS.some(tab => location.pathname === tab.path)

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

      {!hideTabs && (
        <nav
          className="shrink-0 px-8 pt-4 pb-0 flex gap-1"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          {TABS.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className="flex items-center gap-2 px-5 py-3 rounded-t-xl text-xs font-bold transition-all"
              style={({ isActive }) => ({
                color: isActive ? "#fff" : COLORS.CHARCOAL,
                backgroundColor: isActive ? COLORS.ACCENT : "transparent",
                opacity: isActive ? 1 : 0.5,
              })}
            >
              <HugeiconsIcon icon={tab.icon} size={16} />
              {tab.label}
            </NavLink>
          ))}
        </nav>
      )}

      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}

export function FinanceResumenWrapper() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)
  const [cuentas, setCuentas] = useState<Record<string, unknown>[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const [resumenData, cuentasData] = await Promise.all([
          financeService.getResumen(),
          financeService.getCuentas({ per_page: 200, recientes: 0 }),
        ])
        setStats(resumenData)
        setCuentas(cuentasData.data)
      } catch {
        toast.error("Error al sincronizar datos financieros")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div
          className="text-sm font-medium opacity-40"
          style={{ color: COLORS.CHARCOAL }}
        >
          Cargando resumen financiero...
        </div>
      </div>
    )
  }

  return (
    <motion.div
      key="resumen"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="px-8 py-6"
    >
      <FinanceResumen stats={stats} cuentas={cuentas} />
    </motion.div>
  )
}
