/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Coins01Icon,
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  LibraryIcon,
  SchoolIcon,
  AiFolderIcon,
  ArrowDown01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { useNavigate } from "react-router"

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
  if (cuenta.reserva_aula_id || cuenta.reserva_podcast_id || cuenta.alquiler_equipo_id
      || cuenta.servicio_streaming_id || cuenta.servicio_produccion_id || cuenta.edicion_video_id
      || cuenta.clase_extra_id || cuenta.asesoria_id || cuenta.reserva_radio_id) return "servicios"
  if (cuenta.tipo === "aula" || cuenta.tipo === "podcast" || cuenta.tipo === "equipo" || cuenta.tipo === "streaming" || cuenta.tipo === "produccion" || cuenta.tipo === "edicion" || cuenta.tipo === "radio" || cuenta.tipo === "clase_extra" || cuenta.tipo === "asesoria") return "servicios"
  const categoria = cuenta.matricula?.curso_abierto?.catalogo?.categoria
    ?? cuenta.matricula?.curso_abierto?.tipo
    ?? cuenta.solicitud_inscripcion?.curso_abierto?.catalogo?.categoria
  if (categoria === "taller") return "talleres"
  if (categoria === "personalizado") return "servicios"
  return "cursos"
}

function getCuentaName(cuenta: any): string {
  if (cuenta.inscripcion_taller?.taller?.nombre) return cuenta.inscripcion_taller.taller.nombre
  if (cuenta.matricula?.curso_abierto?.nombre_instancia) return cuenta.matricula.curso_abierto.nombre_instancia
  if (cuenta.matricula?.curso_abierto?.catalogo?.nombre) return cuenta.matricula.curso_abierto.catalogo.nombre
  if (cuenta.curso_nombre) return cuenta.curso_nombre
  if (cuenta.inscripcion_taller_id) return "Taller"
  if (cuenta.nombre_servicio) return cuenta.nombre_servicio
  return cuenta.solicitud_inscripcion?.curso_abierto?.catalogo?.nombre || "Curso"
}

export function ResumenPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [cuentas, setCuentas] = useState<any[]>([])
  const [filter, setFilter] = useState("todos")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [resumenData, cuentasData] = await Promise.all([
          financeService.getResumen(),
          financeService.getCuentas({ per_page: 200, recientes: false })
        ])
        setStats(resumenData)
        setCuentas(cuentasData.data)
      } catch {
        toast.error("Error al cargar resumen financiero")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalPendiente = Number(stats?.total_pendiente || 0)
  const totalConDeuda = Number(stats?.cuentas_con_deuda || 0)

  const totalCobradoLocal = useMemo(() => {
    return cuentas.reduce((sum, cuenta) => sum + Number(cuenta.monto_abonado || 0), 0)
  }, [cuentas])

  const kpiCards = [
    {
      title: "Pendiente",
      value: `$${totalPendiente.toLocaleString()}`,
      icon: AlertCircleIcon,
      color: "oklch(0.5 0.15 20)",
      bg: "oklch(0.5 0.15 20 / 0.12)",
    },
    {
      title: "Cobrado",
      value: `$${totalCobradoLocal.toLocaleString()}`,
      icon: CheckmarkCircle02Icon,
      color: "oklch(0.55 0.15 150)",
      bg: "oklch(0.55 0.15 150 / 0.12)",
    },
    {
      title: "Con Deuda",
      value: totalConDeuda,
      icon: Coins01Icon,
      color: "oklch(0.5 0.1 240)",
      bg: "oklch(0.5 0.1 240 / 0.12)",
    },
  ]

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
          total: 0, saldo: 0, cobrado: 0, personas: 0, deudores: 0, entries: [],
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
    // Merge talleres sin cuenta
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
    // Merge cursos sin cuenta (lineas_pago_modulo sin cuenta por cobrar)
    if (Array.isArray(stats?.sin_cuenta?.cursos?.items)) {
      stats.sin_cuenta.cursos.items.forEach((item: any) => {
        const name = item.curso_nombre || "Curso"
        if (!groups.cursos.items[name]) {
          groups.cursos.items[name] = { total: 0, saldo: 0, cobrado: 0, personas: 0, deudores: 0, entries: [] }
        }
        const g = groups.cursos.items[name]
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

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-gray-50/30">
        <header className="shrink-0 px-8 py-8 border-b bg-white/80 backdrop-blur-md sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40" style={{ color: COLORS.CHARCOAL }}>
              Finanzas
            </div>
            <h1 className="text-4xl font-bold tracking-tighter leading-none" style={{ color: COLORS.CHARCOAL }}>Resumen Financiero</h1>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center text-sm opacity-40 py-20">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      <header className="shrink-0 px-8 py-8 border-b bg-white/80 backdrop-blur-md sticky top-0 z-20" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] opacity-40" style={{ color: COLORS.CHARCOAL }}>
              <button onClick={() => navigate("/finanzas/pagos")} className="hover:underline">Finanzas</button>
              <span className="size-1 rounded-full bg-current opacity-50" />
              Resumen
            </div>
            <h1 className="text-4xl font-bold tracking-tighter leading-none" style={{ color: COLORS.CHARCOAL }}>
              Resumen Financiero
            </h1>
            <p className="text-xs opacity-40 mt-1">Panorama general de ingresos y cuentas por cobrar</p>
          </div>
        </div>
      </header>

      <div className="flex-1 px-8 pb-8 pt-6 overflow-auto space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpiCards.map((card, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06, type: "spring", stiffness: 400, damping: 30 }}
              className="relative rounded-2xl border bg-white p-5 overflow-hidden"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}
            >
              <motion.div
                className="absolute -top-6 -right-6 size-20 rounded-full blur-3xl pointer-events-none"
                style={{ backgroundColor: card.bg }}
              />
              <div className="relative z-10 flex items-center gap-3">
                <div className="size-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: card.bg }}>
                  <HugeiconsIcon icon={card.icon} size={18} style={{ color: card.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-40" style={{ color: COLORS.CHARCOAL }}>{card.title}</p>
                  <p className="text-lg font-black truncate" style={{ color: COLORS.CHARCOAL }}>{card.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="rounded-2xl border bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="flex items-center justify-between p-6 pb-4">
            <div>
              <h3 className="text-base font-bold" style={{ color: COLORS.CHARCOAL }}>Distribución Detallada</h3>
              <p className="text-[11px] opacity-40 mt-0.5">{(cuentas?.length || 0) + (stats?.sin_cuenta?.talleres?.items?.length || 0) + (stats?.sin_cuenta?.servicios?.items?.length || 0) + (stats?.sin_cuenta?.cursos?.items?.length || 0)} cuenta{((cuentas?.length || 0) + (stats?.sin_cuenta?.talleres?.items?.length || 0) + (stats?.sin_cuenta?.servicios?.items?.length || 0) + (stats?.sin_cuenta?.cursos?.items?.length || 0)) !== 1 ? "s" : ""} registradas</p>
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
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                    filter === f.key
                      ? "text-white shadow-sm"
                      : "hover:opacity-60"
                  )}
                  style={filter === f.key ? { backgroundColor: COLORS.ACCENT } : { color: COLORS.TEXT_MUTED, backgroundColor: "oklch(0.95 0 0)" }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-6 pb-6 space-y-2">
            {Object.entries(filteredData).map(([type, group]: [string, any]) => (
              <div key={type}>
                <h4 className="font-bold uppercase text-[10px] tracking-widest mb-1.5 ml-1" style={{ color: COLORS.TEXT_MUTED }}>
                  {group.label}
                </h4>
                {Object.entries(group.items).map(([name, item]: [string, any]) => {
                  const id = `${type}-${name}`
                  const hasDebtors = item.deudores > 0
                  const isExpanded = expandedId === id
                  return (
                    <div key={id} className="border rounded-xl overflow-hidden mb-1.5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : id)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left transition-colors hover:bg-black/[0.02]"
                        style={{ backgroundColor: hasDebtors ? "oklch(0.5 0.15 20 / 0.04)" : "transparent" }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: hasDebtors ? "oklch(0.5 0.15 20 / 0.1)" : "oklch(0.5 0.1 240 / 0.1)" }}
                          >
                            <HugeiconsIcon
                              icon={ORIGEN_CONFIG[type]?.icon || LibraryIcon}
                              size={14}
                              color={hasDebtors ? "#ef4444" : (ORIGEN_CONFIG[type]?.color || "#4f46e5")}
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="text-sm font-bold truncate block" style={{ color: COLORS.CHARCOAL }}>{name}</span>
                            <span className="text-[10px] opacity-40">{item.personas} persona{item.personas !== 1 ? "s" : ""}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-right shrink-0">
                          <div className="hidden sm:block">
                            <p className="text-[10px] opacity-40">Total</p>
                            <p className="text-sm font-black" style={{ color: COLORS.CHARCOAL }}>${item.total.toLocaleString()}</p>
                          </div>
                          <div className="hidden sm:block">
                            <p className="text-[10px] opacity-40">Pendiente</p>
                            <p className={cn("text-sm font-black", hasDebtors ? "text-red-600" : "")} style={{ color: hasDebtors ? undefined : COLORS.CHARCOAL }}>
                              ${item.saldo.toLocaleString()}
                            </p>
                          </div>
                          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                            <HugeiconsIcon icon={ArrowDown01Icon} size={14} className="opacity-40" />
                          </motion.div>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                          <div className="px-4 py-3 border-b" style={{ backgroundColor: "oklch(0.97 0 0)", borderColor: COLORS.BORDER_SUBTLE }}>
                            <div className="grid grid-cols-4 gap-3 text-xs">
                              <div><p className="text-[10px] opacity-40">Valor Total</p><p className="font-bold" style={{ color: COLORS.CHARCOAL }}>${item.total.toLocaleString()}</p></div>
                              <div><p className="text-[10px] opacity-40">Cobrado</p><p className="font-bold text-green-600">${item.cobrado.toLocaleString()}</p></div>
                              <div><p className="text-[10px] opacity-40">Pendiente</p><p className="font-bold text-red-600">${item.saldo.toLocaleString()}</p></div>
                              <div><p className="text-[10px] opacity-40">{hasDebtors ? "Deudores" : "Pagado"}</p><p className={cn("font-bold", hasDebtors ? "text-red-600" : "text-green-600")}>{item.deudores}/{item.personas}</p></div>
                            </div>
                          </div>
                          <div className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                            {item.entries.map((cuenta: any) => {
                              const nombre = getNombrePersona(cuenta)
                              const pendiente = Number(cuenta.saldo_pendiente || 0)
                              const abonado = Number(cuenta.monto_abonado || 0)
                              const total = Number(cuenta.monto_total || 0)
                              return (
                                <div key={cuenta.id} className="px-4 py-2.5 flex items-center justify-between gap-3 transition-colors">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="size-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "oklch(0.9 0 0)" }}>
                                      <HugeiconsIcon icon={UserIcon} size={12} style={{ color: COLORS.TEXT_MUTED }} />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold truncate" style={{ color: COLORS.CHARCOAL }}>{nombre}</p>
                                      <p className="text-[10px] opacity-40">Total: <span className="font-medium">${total.toLocaleString()}</span></p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0">
                                    <div className="text-right">
                                      <p className="text-[10px] opacity-40">Abonado</p>
                                      <p className="text-xs font-bold text-green-600">${abonado.toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[10px] opacity-40">Saldo</p>
                                      <p className={cn("text-xs font-bold", pendiente > 0 ? "text-red-600" : "")} style={{ color: pendiente > 0 ? undefined : COLORS.CHARCOAL }}>
                                        ${pendiente.toLocaleString()}
                                      </p>
                                    </div>
                                    <span className={cn(
                                      "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full",
                                      pendiente === 0 ? "bg-green-100 text-green-700" : abonado > 0 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                                    )}>
                                      {pendiente === 0 ? "Pagado" : abonado > 0 ? "Parcial" : "Deuda"}
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
