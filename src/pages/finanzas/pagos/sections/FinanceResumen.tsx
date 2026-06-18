/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Coins01Icon,
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  InvoiceIcon,
  LibraryIcon,
  SchoolIcon,
  AiFolderIcon,
  ArrowDown01Icon,
  UserIcon,
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

function getNombrePersona(cuenta: any): string {
  const s = cuenta.solicitud_inscripcion
  const m = cuenta.matricula
  const it = cuenta.inscripcion_taller
  if (m?.estudiante) return `${m.estudiante.nombres || ""} ${m.estudiante.apellidos || ""}`.trim()
  if (s?.estudiante) return `${s.estudiante.nombres || ""} ${s.estudiante.apellidos || ""}`.trim()
  if (s?.participante_externo) return `${s.participante_externo.nombres || ""} ${s.participante_externo.apellidos || ""}`.trim()
  if (it?.participante) return `${it.participante.nombres || ""} ${it.participante.apellidos || ""}`.trim()
  if (cuenta.persona_nombre) return cuenta.persona_nombre
  return "—"
}

function getCuentaType(cuenta: any): string {
  if (cuenta.inscripcion_taller || cuenta.inscripcion_taller_id) return "talleres"
  if (cuenta.reserva_aula_id || cuenta.reserva_podcast_id || cuenta.alquiler_equipo_id) return "servicios"
  const cat = cuenta.matricula?.curso_abierto?.catalogo?.categoria
    ?? cuenta.matricula?.curso_abierto?.tipo
    ?? cuenta.solicitud_inscripcion?.curso_abierto?.catalogo?.categoria
  if (cat === "taller") return "talleres"
  if (cat === "personalizado") return "servicios"
  return "cursos"
}

function getCuentaName(cuenta: any): string {
  if (cuenta.inscripcion_taller?.taller?.nombre) return cuenta.inscripcion_taller.taller.nombre
  if (cuenta.matricula?.curso_abierto?.nombre_instancia) return cuenta.matricula.curso_abierto.nombre_instancia
  if (cuenta.matricula?.curso_abierto?.catalogo?.nombre) return cuenta.matricula.curso_abierto.catalogo.nombre
  if (cuenta.inscripcion_taller_id) return "Taller"
  if (cuenta.nombre_servicio) return cuenta.nombre_servicio
  return cuenta.solicitud_inscripcion?.curso_abierto?.catalogo?.nombre || "Curso"
}

export function FinanceResumen({ stats, cuentas }: FinanceResumenProps) {
  const [filter, setFilter] = useState<string>("todos")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const sinCuentaTalleres = stats?.sin_cuenta?.talleres
  const sinCuentaServicios = stats?.sin_cuenta?.servicios
  const sinCuentaTotal = (sinCuentaTalleres?.total || 0) + (sinCuentaServicios?.total || 0)
  const sinCuentaCount = (sinCuentaTalleres?.count || 0) + (sinCuentaServicios?.count || 0)

  const totalPendiente = Number(stats?.total_pendiente || 0) + sinCuentaTotal
  const totalConDeuda = Number(stats?.cuentas_con_deuda || 0) + sinCuentaCount

  const totalCobradoLocal = useMemo(() => {
    return cuentas.reduce((sum, cuenta) => sum + Number(cuenta.monto_abonado || 0), 0)
  }, [cuentas])

  const cards = [
    {
      title: "Pendiente",
      value: `$${totalPendiente.toLocaleString()}`,
      icon: AlertCircleIcon,
      color: "oklch(0.5 0.15 20)",
      bg: "bg-red-50",
    },
    {
      title: "Cobrado",
      value: `$${totalCobradoLocal.toLocaleString()}`,
      icon: CheckmarkCircle02Icon,
      color: "oklch(0.55 0.15 150)",
      bg: "bg-green-50",
    },
    {
      title: "Por Verificar",
      value: stats?.pendientes_verificacion || 0,
      icon: InvoiceIcon,
      color: "oklch(0.65 0.15 75)",
      bg: "bg-amber-50",
    },
    {
      title: "Con Deuda",
      value: totalConDeuda,
      icon: Coins01Icon,
      color: "oklch(0.5 0.1 240)",
      bg: "bg-blue-50",
    },
  ]

  // Build groups with individual entries, merging sin_cuenta items from stats
  const processedData = useMemo(() => {
    const groups: Record<string, any> = {
      cursos:    { label: "Cursos",    items: {} },
      talleres:  { label: "Talleres",  items: {} },
      servicios: { label: "Servicios", items: {} },
    }

    cuentas.forEach((cuenta) => {
      if (!cuenta) return
      const type = getCuentaType(cuenta)
      const name = getCuentaName(cuenta)
      if (!groups[type]?.items) return

      if (!groups[type].items[name]) {
        groups[type].items[name] = {
          total: 0,
          saldo: 0,
          cobrado: 0,
          personas: 0,
          deudores: 0,
          entries: [],
        }
      }
      const item = groups[type].items[name]
      item.total += Number(cuenta.monto_total || 0)
      item.saldo += Number(cuenta.saldo_pendiente || 0)
      item.cobrado += Number(cuenta.monto_abonado || 0)
      item.personas += 1
      if (Number(cuenta.saldo_pendiente || 0) > 0) item.deudores += 1
      item.entries.push(cuenta)
    })

    // Merge talleres sin cuenta (inscripciones sin cuenta_por_cobrar)
    if (Array.isArray(stats?.sin_cuenta?.talleres?.items)) {
      stats.sin_cuenta.talleres.items.forEach((item: any) => {
        const name = item.inscripcion_taller?.taller?.nombre || "Taller"
        if (!groups.talleres.items[name]) {
          groups.talleres.items[name] = { total: 0, saldo: 0, cobrado: 0, personas: 0, deudores: 0, entries: [] }
        }
        const g = groups.talleres.items[name]
        g.total += Number(item.monto_total || 0)
        g.saldo += Number(item.saldo_pendiente || 0)
        g.cobrado += Number(item.monto_abonado || 0)
        g.personas += 1
        if (Number(item.saldo_pendiente || 0) > 0) g.deudores += 1
        g.entries.push(item)
      })
    }

    // Merge servicios sin cuenta
    if (Array.isArray(stats?.sin_cuenta?.servicios?.items)) {
      stats.sin_cuenta.servicios.items.forEach((item: any) => {
        const name = item.nombre_servicio || "Servicio"
        if (!groups.servicios.items[name]) {
          groups.servicios.items[name] = { total: 0, saldo: 0, cobrado: 0, personas: 0, deudores: 0, entries: [] }
        }
        const g = groups.servicios.items[name]
        g.total += Number(item.monto_total || 0)
        g.saldo += Number(item.saldo_pendiente || 0)
        g.cobrado += Number(item.monto_abonado || 0)
        g.personas += 1
        if (Number(item.saldo_pendiente || 0) > 0) g.deudores += 1
        g.entries.push(item)
      })
    }

    return groups
  }, [cuentas, stats])

  const filteredData = useMemo(() => {
    if (filter === "todos") return processedData
    return { [filter]: processedData[filter] }
  }, [filter, processedData])

  return (
    <div className="space-y-6">
      {/* Compact summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className={`size-8 rounded-lg ${card.bg} flex items-center justify-center shrink-0`}>
                <HugeiconsIcon icon={card.icon} size={16} style={{ color: card.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{card.title}</p>
                <p className="text-sm font-black text-gray-900 truncate">{card.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Distribution detail — primary section */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-gray-900">Distribución Detallada</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">{cuentas.length + (stats?.sin_cuenta?.talleres?.items?.length || 0) + (stats?.sin_cuenta?.servicios?.items?.length || 0)} cuenta{(cuentas.length + (stats?.sin_cuenta?.talleres?.items?.length || 0) + (stats?.sin_cuenta?.servicios?.items?.length || 0)) !== 1 ? "s" : ""} registradas</p>
          </div>
          <div className="flex gap-1.5">
            {[
              { key: "todos", label: "Todo" },
              { key: "cursos", label: "Cursos" },
              { key: "talleres", label: "Talleres" },
              { key: "servicios", label: "Servicios" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                  filter === f.key ? "bg-gray-900 text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {Object.entries(filteredData).map(([type, group]) => (
            <div key={type}>
              <h4 className="font-bold text-gray-400 uppercase text-[10px] tracking-widest mb-1.5 ml-1">
                {group.label}
              </h4>
              {Object.entries(group.items).map(([name, item]: [string, any]) => {
                const id = `${type}-${name}`
                const hasDebtors = item.deudores > 0
                const isExpanded = expandedId === id
                return (
                  <div key={id} className="border border-gray-100 rounded-xl overflow-hidden mb-1.5">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : id)}
                      className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
                        hasDebtors ? "bg-red-50/50" : "bg-white hover:bg-gray-50/50"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`size-7 rounded-lg flex items-center justify-center shrink-0 ${
                          hasDebtors ? "bg-red-100" : "bg-blue-100"
                        }`}>
                          <HugeiconsIcon
                            icon={ORIGEN_CONFIG[type]?.icon || LibraryIcon}
                            size={14}
                            color={hasDebtors ? "#ef4444" : (ORIGEN_CONFIG[type]?.color || "#4f46e5")}
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-bold text-gray-900 truncate block">{name}</span>
                          <span className="text-[10px] text-gray-400">{item.personas} persona{item.personas !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right shrink-0">
                        <div className="hidden sm:block">
                          <p className="text-[10px] text-gray-400">Total</p>
                          <p className="text-sm font-black">${item.total.toLocaleString()}</p>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-[10px] text-gray-400">Pendiente</p>
                          <p className={`text-sm font-black ${hasDebtors ? "text-red-600" : "text-gray-900"}`}>
                            ${item.saldo.toLocaleString()}
                          </p>
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <HugeiconsIcon icon={ArrowDown01Icon} size={14} className="text-gray-400" />
                        </motion.div>
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-gray-100 overflow-hidden"
                        >
                          <div className="bg-gray-50/70 px-4 py-3 border-b border-gray-100">
                            <div className="grid grid-cols-4 gap-3 text-xs">
                              <div>
                                <p className="text-[10px] text-gray-400">Valor Total</p>
                                <p className="font-bold text-gray-900">${item.total.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-400">Cobrado</p>
                                <p className="font-bold text-green-600">${item.cobrado.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-400">Pendiente</p>
                                <p className="font-bold text-red-600">${item.saldo.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-gray-400">{hasDebtors ? "Deudores" : "Pagado"}</p>
                                <p className={`font-bold ${hasDebtors ? "text-red-600" : "text-green-600"}`}>
                                  {item.deudores}/{item.personas}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Individual entries */}
                          <div className="divide-y divide-gray-100">
                            {item.entries.length === 0 ? (
                              <div className="p-4 text-xs text-gray-400 text-center">Sin registros</div>
                            ) : (
                              item.entries.map((cuenta: any) => {
                                const nombre = getNombrePersona(cuenta)
                                const pendiente = Number(cuenta.saldo_pendiente || 0)
                                const abonado = Number(cuenta.monto_abonado || 0)
                                const total = Number(cuenta.monto_total || 0)
                                return (
                                  <div key={cuenta.id} className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-white/50 transition-colors">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="size-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                                        <HugeiconsIcon icon={UserIcon} size={12} className="text-gray-500" />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-xs font-semibold text-gray-900 truncate">{nombre}</p>
                                        <p className="text-[10px] text-gray-400">
                                          Total: <span className="font-medium">${total.toLocaleString()}</span>
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                      <div className="text-right">
                                        <p className="text-[10px] text-gray-400">Abonado</p>
                                        <p className="text-xs font-bold text-green-600">${abonado.toLocaleString()}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-[10px] text-gray-400">Saldo</p>
                                        <p className={`text-xs font-bold ${pendiente > 0 ? "text-red-600" : "text-gray-900"}`}>
                                          ${pendiente.toLocaleString()}
                                        </p>
                                      </div>
                                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                                        pendiente === 0
                                          ? "bg-green-100 text-green-700"
                                          : abonado > 0
                                            ? "bg-amber-100 text-amber-700"
                                            : "bg-red-100 text-red-700"
                                      }`}>
                                        {pendiente === 0 ? "Pagado" : abonado > 0 ? "Parcial" : "Deuda"}
                                      </span>
                                    </div>
                                  </div>
                                )
                              })
                            )}
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