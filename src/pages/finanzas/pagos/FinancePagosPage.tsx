import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  InvoiceIcon,
  Clock01Icon,
  Invoice02Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { useNavigate } from "react-router"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { FinanceResumen } from "./sections/FinanceResumen"

const NAV_LINKS = [
  {
    label: "Cuentas por cobrar",
    icon: InvoiceIcon,
    path: "/finanzas/pagos/cuentas",
    color: "oklch(0.5 0.15 240)",
  },
  {
    label: "Validación",
    icon: Clock01Icon,
    path: "/finanzas/pagos/validacion",
    color: "oklch(0.65 0.15 75)",
  },
  {
    label: "Historial",
    icon: Invoice02Icon,
    path: "/finanzas/pagos/historial",
    color: "oklch(0.55 0.15 150)",
  },
]

export function FinancePagosPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)
  const [cuentas, setCuentas] = useState<Record<string, unknown>[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const [resumenData, cuentasData] = await Promise.all([
          financeService.getResumen(),
          financeService.getCuentas({ per_page: 50 })
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

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      <header className="shrink-0 px-8 py-8 border-b bg-white/80 backdrop-blur-md sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-1">
            
            <h1 className="text-4xl font-bold tracking-tighter leading-none" style={{ color: COLORS.CHARCOAL }}>
              Pagos y Cobros
            </h1>
            
          </div>
        </div>
      </header>

      <nav className="shrink-0 px-8 pt-6 pb-2 flex gap-2">
        {NAV_LINKS.map((link) => (
          <motion.button
            key={link.path}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(link.path)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-white text-xs font-bold transition-all hover:shadow-sm"
            style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
          >
            <HugeiconsIcon icon={link.icon} size={16} style={{ color: link.color }} />
            {link.label}
          </motion.button>
        ))}
      </nav>

      <div className="flex-1 px-8 pb-8 pt-4 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-sm font-medium opacity-40" style={{ color: COLORS.CHARCOAL }}>Cargando resumen financiero...</div>
          </div>
        ) : (
          <motion.div
            key="resumen"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <FinanceResumen stats={stats} cuentas={cuentas} />
          </motion.div>
        )}
      </div>
    </div>
  )
}
