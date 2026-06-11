import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { 
  Coins01Icon, 
  AlertCircleIcon, 
  CheckmarkCircle02Icon,
  LibraryIcon,
  InvoiceIcon,
  SchoolIcon,
  AiFolderIcon,
  ArrowDown01Icon
} from "@hugeicons/core-free-icons"

interface FinanceResumenProps {
  stats: any
  cuentas: any[]
}

const ORIGEN_CONFIG: Record<string, { label: string; desc: string; icon: any; color: string }> = {
  cursos:     { label: "Cursos",     desc: "Matrículas e inscripciones",        icon: LibraryIcon,    color: "#4f46e5" },
  talleres:   { label: "Talleres",   desc: "Talleres y workshops",             icon: SchoolIcon,     color: "#0891b2" },
  servicios:  { label: "Servicios",  desc: "Aulas, podcast, equipos",          icon: AiFolderIcon,   color: "#7c3aed" },
}

export function FinanceResumen({ stats, cuentas }: FinanceResumenProps) {
  const [filter, setFilter] = useState<string>("todos")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Calcular total cobrado localmente basado en las cuentas
  const totalCobradoLocal = useMemo(() => {
    return cuentas.reduce((sum, cuenta) => sum + Number(cuenta.monto_abonado || 0), 0);
  }, [cuentas]);

  const cards = [
    {
      title: "Total Pendiente",
      value: `$${Number(stats?.total_pendiente || 0).toLocaleString()}`,
      icon: AlertCircleIcon,
      color: "oklch(0.5 0.15 20)",
      bg: "bg-red-50"
    },
    {
      title: "Total Cobrado",
      value: `$${totalCobradoLocal.toLocaleString()}`,
      icon: CheckmarkCircle02Icon,
      color: "oklch(0.55 0.15 150)",
      bg: "bg-green-50"
    },
    {
      title: "Pendientes Verificación",
      value: stats?.pendientes_verificacion || 0,
      icon: InvoiceIcon,
      color: "oklch(0.65 0.15 75)",
      bg: "bg-amber-50"
    },
    {
      title: "Cuentas con Deuda",
      value: stats?.cuentas_con_deuda || 0,
      icon: Coins01Icon,
      color: "oklch(0.5 0.1 240)",
      bg: "bg-blue-50"
    }
  ]

  const processedData = useMemo(() => {
    if (!cuentas || cuentas.length === 0) return { cursos: { label: "Cursos", items: {} }, talleres: { label: "Talleres", items: {} }, servicios: { label: "Servicios", items: {} } };
    
    const groups: Record<string, any> = {
      cursos: { label: "Cursos", items: {} },
      talleres: { label: "Talleres", items: {} },
      servicios: { label: "Servicios", items: {} },
    }

    cuentas.forEach((cuenta) => {
      if (!cuenta) return;
      
      let type = ""
      let name = "Desconocido"

      if (cuenta.matricula) {
        type = "cursos"
        // Acceder usando snake_case según la estructura real del objeto
        name = cuenta.matricula.curso_abierto?.nombre_instancia || 
               cuenta.matricula.curso_abierto?.catalogo?.nombre || "Curso"
      } else if (cuenta.inscripcionTaller) {
        type = "talleres"
        name = cuenta.inscripcionTaller.taller?.nombre || "Taller"
      } else if (cuenta.reserva_aula_id || cuenta.reserva_podcast_id || cuenta.alquiler_equipo_id) {
        type = "servicios"
        name = "Servicio"
      }

      if (type && groups[type]) {
        if (!groups[type].items[name]) {
          groups[type].items[name] = {
            total: 0,
            saldo: 0,
            cobrado: 0, // Nuevo campo
            personas: 0,
            deudores: 0,
          }
        }
        const item = groups[type].items[name]
        item.total += Number(cuenta.monto_total || 0)
        item.saldo += Number(cuenta.saldo_pendiente || 0)
        item.cobrado += Number(cuenta.monto_abonado || 0) // Sumar abonado
        item.personas += 1
        if (Number(cuenta.saldo_pendiente || 0) > 0) item.deudores += 1
      }
    })

    return groups
  }, [cuentas])

  const filteredData = useMemo(() => {
    if (filter === "todos") return processedData
    return { [filter]: processedData[filter] }
  }, [filter, processedData])

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all"
          >
            <div className={`size-12 rounded-2xl ${card.bg} flex items-center justify-center mb-4`}>
              <HugeiconsIcon icon={card.icon} size={24} style={{ color: card.color }} />
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{card.title}</p>
            <h3 className="text-2xl font-black text-gray-900">{card.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-gray-900">Distribución Detallada</h3>
          <div className="flex gap-2">
            {["todos", "cursos", "talleres", "servicios"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase ${filter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(filteredData).map(([type, group]) => (
            <div key={type} className="space-y-2">
              <h4 className="font-bold text-gray-500 uppercase text-xs tracking-widest">{group.label}</h4>
              {Object.entries(group.items).map(([name, item]: [string, any]) => {
                const id = `${type}-${name}`
                const hasDebtors = item.deudores > 0
                return (
                  <div key={id} className="border border-gray-100 rounded-2xl overflow-hidden">
                    <button 
                      onClick={() => setExpandedId(expandedId === id ? null : id)}
                      className={`w-full p-4 flex items-center justify-between ${hasDebtors ? "bg-red-50" : "bg-white"}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`size-8 rounded-lg flex items-center justify-center ${hasDebtors ? "bg-red-100" : "bg-blue-100"}`}>
                          <HugeiconsIcon icon={ORIGEN_CONFIG[type].icon} size={16} color={hasDebtors ? "#ef4444" : ORIGEN_CONFIG[type].color} />
                        </div>
                        <span className="font-bold text-gray-900">{name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <p className="text-xs text-gray-400">Total Acumulado</p>
                          <p className="font-black">${item.total.toLocaleString()}</p>
                        </div>
                        <HugeiconsIcon icon={ArrowDown01Icon} size={16} className={`transition-transform ${expandedId === id ? "rotate-180" : ""}`} />
                      </div>
                    </button>
                    <AnimatePresence>
                      {expandedId === id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="bg-gray-50 p-4 border-t border-gray-100 text-xs text-gray-600"
                        >
                          <div className="grid grid-cols-4 gap-4">
                            <p>Personas: <span className="font-bold text-gray-900">{item.personas}</span></p>
                            <p>Deudores: <span className={`font-bold ${hasDebtors ? "text-red-600" : "text-gray-900"}`}>{item.deudores}</span></p>
                            <p>Cobrado: <span className="font-bold text-green-600">${item.cobrado.toLocaleString()}</span></p>
                            <p>Pendiente: <span className="font-bold text-red-600">${item.saldo.toLocaleString()}</span></p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
