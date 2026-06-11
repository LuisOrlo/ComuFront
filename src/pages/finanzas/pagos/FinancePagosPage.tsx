import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { 
  InvoiceIcon, 
  Invoice02Icon,
  Clock01Icon,
  ChartBarLineIcon
} from "@hugeicons/core-free-icons"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"

// Sub-secciones
import { FinanceResumen } from "./sections/FinanceResumen"
import { FinanceCuentas } from "./sections/FinanceCuentas"
import { FinancePagoRegistro } from "./sections/FinancePagoRegistro"
import { FinanceValidacion } from "./sections/FinanceValidacion"
import { FinanceHistorial } from "./sections/FinanceHistorial"

type FinanceTab = "resumen" | "cuentas" | "validacion" | "historial"

export function FinancePagosPage() {
  const [activeTab, setActiveTab] = useState<FinanceTab>("resumen")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [cuentas, setCuentas] = useState<any[]>([])
  
  // Para flujo de registro de pago
  const [selectedCuentaId, setSelectedCuentaId] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
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

  const tabs = [
    { id: "resumen", label: "Resumen", icon: ChartBarLineIcon },
    { id: "cuentas", label: "Cuentas por Cobrar", icon: InvoiceIcon },
    { id: "validacion", label: "Validación", icon: Clock01Icon },
    { id: "historial", label: "Historial", icon: Invoice02Icon },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          
          <h1 className="text-3xl font-black text-gray-900 mt-1">Pagos y Cobros</h1>
         
        </div>
        
        <div className="bg-gray-100 p-1.5 rounded-2xl flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as FinanceTab)
                setSelectedCuentaId(null)
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <HugeiconsIcon icon={tab.icon} size={16} />
              <span className="hidden md:block">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {selectedCuentaId ? (
          <motion.div
            key="pago-registro"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <FinancePagoRegistro 
              cuentaId={selectedCuentaId} 
              onBack={() => setSelectedCuentaId(null)}
              onSuccess={() => {
                loadData()
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "resumen" && <FinanceResumen stats={stats} cuentas={cuentas} />}
            {activeTab === "cuentas" && (
              <FinanceCuentas 
                cuentas={cuentas} 
                loading={loading} 
                onSelect={(id) => setSelectedCuentaId(id)} 
              />
            )}
            {activeTab === "validacion" && <FinanceValidacion />}
            {activeTab === "historial" && <FinanceHistorial />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
