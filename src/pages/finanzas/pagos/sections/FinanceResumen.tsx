/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
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

interface FinanceResumenProps {
  stats: any
  cuentas: any[]
}

const ORIGEN_CONFIG: Record<string, { label: string; desc: string; icon: any; color: string }> = {
  cursos:    { label: "Cursos",     desc: "Matrículas e inscripciones",        icon: LibraryIcon,    color: "#4f46e5" },
  talleres:  { label: "Talleres",   desc: "Talleres y workshops",             icon: SchoolIcon,     color: "#0891b2" },
  servicios: { label: "Servicios",  desc: "Aulas, podcast, equipos",          icon: AiFolderIcon,   color: "#7c3aed" },
}

function getNombrePersona(cuenta: any): string {
  if (cuenta.persona_nombre) return cuenta.persona_nombre
  const m = cuenta.matricula
  const s = cuenta.solicitud_inscripcion
  const it = cuenta.inscripcion_taller
  if (m?.estudiante) return `${m.estudiante.nombres || ""} ${m.estudiante.apellidos || ""}`.trim()
  if (s?.estudiante) return `${s.estudiante.nombres || ""} ${s.estudiante.apellidos || ""}`.trim()
  if (s?.participante_externo) return `${s.participante_externo.nombres || ""} ${s.participante_externo.apellidos || ""}`.trim()
  if (it?.participante) return `${it.participante.nombres || ""} ${it.participante.apellidos || ""}`.trim()
  return "—"
}

function getCuentaType(cuenta: any): string {
  if (cuenta.inscripcion_taller || cuenta.inscripcion_taller_id) return "talleres"
  if (cuenta.reserva_aula_id || cuenta.reserva_podcast_id || cuenta.alquiler_equipo_id
      || cuenta.servicio_streaming_id || cuenta.servicio_produccion_id || cuenta.edicion_video_id
      || cuenta.clase_extra_id || cuenta.asesoria_id || cuenta.reserva_radio_id) return "servicios"
  if (cuenta.tipo === "aula" || cuenta.tipo === "podcast" || cuenta.tipo === "equipo" || cuenta.tipo === "streaming" || cuenta.tipo === "produccion" || cuenta.tipo === "edicion" || cuenta.tipo === "radio" || cuenta.tipo === "clase_extra" || cuenta.tipo === "asesoria") return "servicios"
  if (cuenta.tipo === "taller" || cuenta.tipo === "talleres") return "talleres"
  const cat = cuenta.matricula?.curso_abierto?.catalogo?.categoria
    ?? cuenta.matricula?.curso_abierto?.tipo
    ?? cuenta.solicitud_inscripcion?.curso_abierto?.catalogo?.categoria
    ?? cuenta.categoria
  if (cat === "taller" || cat === "talleres") return "talleres"
  if (cat === "personalizado") return "servicios"

  return "cursos"
}

function getCuentaName(cuenta: any): string {
  if (cuenta.inscripcion_taller?.taller?.nombre) return cuenta.inscripcion_taller.taller.nombre

  const curso =
    cuenta.matricula?.curso_abierto ||
    cuenta.solicitud_inscripcion?.curso_abierto ||
    null

  if (curso) {
    if (curso.nombre_instancia) return curso.nombre_instancia
    const partes: string[] = []
    if (curso.catalogo?.nombre) partes.push(curso.catalogo.nombre)
    if (curso.ciudad?.nombre) partes.push(curso.ciudad.nombre)
    if (curso.fecha_inicio) {
      const d = new Date(curso.fecha_inicio)
      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      partes.push(`${meses[d.getMonth()]} ${d.getFullYear()}`)
    }
    if (curso.modalidad) partes.push(curso.modalidad.charAt(0).toUpperCase() + curso.modalidad.slice(1))
    if (partes.length > 0) return partes.join(' — ')
  }

  if (cuenta.curso_nombre) return cuenta.curso_nombre
  if (cuenta.inscripcion_taller_id) return "Taller"
  if (cuenta.nombre_servicio) return cuenta.nombre_servicio
  return "Curso"
}

function HealthBar({ recaudado, total }: { recaudado: number; total: number }) {
  const pct = total > 0 ? (recaudado / total) * 100 : 0
  const barColor =
    pct >= 80 ? "oklch(0.55 0.15 150)" :
    pct >= 50 ? "oklch(0.65 0.15 75)" :
    "oklch(0.5 0.15 20)"

  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "oklch(0.93 0 0)" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(pct, 100)}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ backgroundColor: barColor }}
      />
    </div>
  )
}

export function FinanceResumen({ stats, cuentas }: FinanceResumenProps) {
  const [filter, setFilter] = useState<string>("todos")
  const [modalidadFilter, setModalidadFilter] = useState<string>("todos")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [modulosExpandidos, setModulosExpandidos] = useState<Set<string>>(new Set())

  const toggleModulos = (id: string) => {
    setModulosExpandidos(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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

  const getModalidad = (cuenta: any): string | null => {
    return cuenta.matricula?.curso_abierto?.modalidad
      || cuenta.solicitud_inscripcion?.curso_abierto?.modalidad
      || cuenta.inscripcion_taller?.taller?.modalidad
      || cuenta.modalidad
      || null
  }

  const cuentasFiltradas = useMemo(() => {
    if (modalidadFilter === "todos") return cuentas
    return cuentas.filter(c => getModalidad(c) === modalidadFilter)
  }, [cuentas, modalidadFilter])

  const processedData = useMemo(() => {
    const groups: Record<string, any> = {
      cursos:    { label: "Cursos",    items: {} },
      talleres:  { label: "Talleres",  items: {} },
      servicios: { label: "Servicios", items: {} },
    }

    cuentasFiltradas.forEach((cuenta) => {
      if (!cuenta) return
      const type = getCuentaType(cuenta)
      const name = getCuentaName(cuenta)
      if (!groups[type]?.items) return

      if (!groups[type].items[name]) {
        groups[type].items[name] = {
          total: 0,
          cobrado: 0,
          saldo: 0,
          personas: 0,
          deudores: 0,
          entries: [],
        }
      }
      const item = groups[type].items[name]
      item.total += Number(cuenta.monto_total || 0)
      item.cobrado += Number(cuenta.monto_abonado || 0)
      item.saldo += Number(cuenta.saldo_pendiente || 0)
      item.personas += 1
      if (Number(cuenta.saldo_pendiente || 0) > 0) item.deudores += 1
      item.entries.push(cuenta)
    })

    if (Array.isArray(stats?.sin_cuenta?.talleres?.items)) {
      stats.sin_cuenta.talleres.items.forEach((item: any) => {
        const name = item.inscripcion_taller?.taller?.nombre || "Taller"
        if (!groups.talleres.items[name]) {
          groups.talleres.items[name] = { total: 0, cobrado: 0, saldo: 0, personas: 0, deudores: 0, entries: [] }
        }
        const g = groups.talleres.items[name]
        g.total += Number(item.monto_total || 0)
        g.cobrado += Number(item.monto_abonado || 0)
        g.saldo += Number(item.saldo_pendiente || 0)
        g.personas += 1
        if (Number(item.saldo_pendiente || 0) > 0) g.deudores += 1
        g.entries.push(item)
      })
    }

    if (Array.isArray(stats?.sin_cuenta?.servicios?.items)) {
      stats.sin_cuenta.servicios.items.forEach((item: any) => {
        const name = item.nombre_servicio || "Servicio"
        if (!groups.servicios.items[name]) {
          groups.servicios.items[name] = { total: 0, cobrado: 0, saldo: 0, personas: 0, deudores: 0, entries: [] }
        }
        const g = groups.servicios.items[name]
        g.total += Number(item.monto_total || 0)
        g.cobrado += Number(item.monto_abonado || 0)
        g.saldo += Number(item.saldo_pendiente || 0)
        g.personas += 1
        if (Number(item.saldo_pendiente || 0) > 0) g.deudores += 1
        g.entries.push(item)
      })
    }

    if (Array.isArray(stats?.sin_cuenta?.cursos?.items)) {
      const idsEnCuentas = new Set(
        cuentasFiltradas
          .filter((c: any) => c._origen === "lineas_pago" || c.matricula_id)
          .map((c: any) => c.matricula_id)
          .filter(Boolean)
      )

      stats.sin_cuenta.cursos.items.forEach((item: any) => {
        if (item.matricula_id && idsEnCuentas.has(item.matricula_id)) return
        const name = item.curso_nombre || "Curso"
        if (!groups.cursos.items[name]) {
          groups.cursos.items[name] = { total: 0, cobrado: 0, saldo: 0, personas: 0, deudores: 0, entries: [] }
        }
        const g = groups.cursos.items[name]
        g.total += Number(item.monto_total || 0)
        g.cobrado += Number(item.monto_abonado || 0)
        g.saldo += Number(item.saldo_pendiente || 0)
        g.personas += 1
        if (Number(item.saldo_pendiente || 0) > 0) g.deudores += 1
        g.entries.push(item)
      })
    }

    return groups
  }, [cuentasFiltradas, stats])

  const filteredData = useMemo(() => {
    if (filter === "todos") return processedData
    return { [filter]: processedData[filter] }
  }, [filter, processedData])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
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
            <span className="mx-2 w-px self-stretch bg-gray-200" />
            {[
              { key: "todos", label: "Ambas" },
              { key: "presencial", label: "Presencial" },
              { key: "virtual", label: "Virtual" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setModalidadFilter(f.key === "todos" ? "todos" : f.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                  modalidadFilter === f.key
                    ? "text-white shadow-sm"
                    : "hover:opacity-60"
                )}
                style={modalidadFilter === f.key ? { backgroundColor: COLORS.CHARCOAL } : { color: COLORS.TEXT_MUTED, backgroundColor: "oklch(0.95 0 0)" }}
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
                const recaudadoPct = item.total > 0 ? (item.cobrado / item.total) * 100 : 0
                return (
                  <div key={id} className="border rounded-xl overflow-hidden mb-1.5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : id)}
                      className="w-full px-4 py-3 flex items-center justify-between text-left transition-colors hover:bg-black/[0.02]"
                      style={{ backgroundColor: hasDebtors ? "oklch(0.5 0.15 20 / 0.04)" : "transparent" }}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="size-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: hasDebtors ? "oklch(0.5 0.15 20 / 0.1)" : "oklch(0.5 0.1 240 / 0.1)" }}
                        >
                          <HugeiconsIcon
                            icon={ORIGEN_CONFIG[type]?.icon || LibraryIcon}
                            size={14}
                            color={hasDebtors ? "#ef4444" : (ORIGEN_CONFIG[type]?.color || "#4f46e5")}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold truncate block" style={{ color: COLORS.CHARCOAL }}>{name}</span>
                            <span className="text-[10px] opacity-40 shrink-0">{item.personas} persona{item.personas !== 1 ? "s" : ""}</span>
                          </div>
                          <div className="mt-1.5 pr-2">
                            <div className="flex items-center gap-2">
                              <HealthBar recaudado={item.cobrado} total={item.total} />
                              <span className="text-[10px] font-bold shrink-0" style={{ color: recaudadoPct >= 80 ? "oklch(0.55 0.15 150)" : recaudadoPct >= 50 ? "oklch(0.65 0.15 75)" : "oklch(0.5 0.15 20)" }}>
                                {Math.round(recaudadoPct)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right shrink-0 ml-4">
                        <div className="hidden sm:block">
                          <p className="text-[10px] opacity-40">Total</p>
                          <p className="text-sm font-black" style={{ color: COLORS.CHARCOAL }}>${item.total.toLocaleString()}</p>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-[10px] opacity-40">Recaudado</p>
                          <p className="text-sm font-black text-green-600">${item.cobrado.toLocaleString()}</p>
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

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t overflow-hidden"
                          style={{ borderColor: COLORS.BORDER_SUBTLE }}
                        >
                          <div className="px-4 py-3 border-b" style={{ backgroundColor: "oklch(0.97 0 0)", borderColor: COLORS.BORDER_SUBTLE }}>
                            <div className="grid grid-cols-4 gap-3 text-xs">
                              <div><p className="text-[10px] opacity-40">Valor Total</p><p className="font-bold" style={{ color: COLORS.CHARCOAL }}>${item.total.toLocaleString()}</p></div>
                              <div><p className="text-[10px] opacity-40">Cobrado</p><p className="font-bold text-green-600">${item.cobrado.toLocaleString()}</p></div>
                              <div><p className="text-[10px] opacity-40">Pendiente</p><p className="font-bold text-red-600">${item.saldo.toLocaleString()}</p></div>
                              <div><p className="text-[10px] opacity-40">{hasDebtors ? "Deudores" : "Pagado"}</p><p className={cn("font-bold", hasDebtors ? "text-red-600" : "text-green-600")}>{item.deudores}/{item.personas}</p></div>
                            </div>
                          </div>
                          <div className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                            {item.entries.length === 0 ? (
                              <div className="p-4 text-xs opacity-40 text-center">Sin registros</div>
                            ) : (
                              item.entries.map((cuenta: any) => {
                                const nombre = getNombrePersona(cuenta)
                                const pendiente = Number(cuenta.saldo_pendiente || 0)
                                const abonado = Number(cuenta.monto_abonado || 0)
                                const lineasPago = cuenta.lineas_pago || []
                                const instructor = cuenta.instructor_nombre || null

                                return (
                                     <div key={cuenta.id || Math.random()} className="px-4 py-3 transition-colors hover:bg-white/50">
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                        <div className="size-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "oklch(0.9 0 0)" }}>
                                          <HugeiconsIcon icon={UserIcon} size={12} style={{ color: COLORS.TEXT_MUTED }} />
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs font-semibold truncate" style={{ color: COLORS.CHARCOAL }}>{nombre}</p>
                                          <p className="text-[10px] opacity-40">
                                            Total: ${(Number(cuenta.monto_total) || 0).toLocaleString()}
                                            {instructor && ` · Instructor: ${instructor}`}
                                          </p>
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
                                          {pendiente === 0 ? "Al día" : abonado > 0 ? "Parcial" : "Deuda"}
                                        </span>
                                        {lineasPago.length > 0 && (
                                          <button
                                            onClick={() => toggleModulos(cuenta.id || cuenta.matricula_id)}
                                            className="text-[10px] font-medium hover:underline shrink-0"
                                            style={{ color: COLORS.TEXT_MUTED }}
                                          >
                                            {modulosExpandidos.has(cuenta.id || cuenta.matricula_id) ? "Ocultar módulos" : "Ver módulos"}
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {lineasPago.length > 0 && modulosExpandidos.has(cuenta.id || cuenta.matricula_id) && (
                                      <div className="mt-2 overflow-x-auto border-t pt-2" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                                        <table className="w-full text-[10px]">
                                          <thead>
                                            <tr className="border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                                              <th className="text-left py-1 pr-2 font-bold uppercase opacity-40">Módulo</th>
                                              <th className="text-right py-1 px-2 font-bold uppercase opacity-40">Precio</th>
                                              <th className="text-right py-1 px-2 font-bold uppercase opacity-40">Abonado</th>
                                              <th className="text-right py-1 px-2 font-bold uppercase opacity-40">Saldo</th>
                                              <th className="text-center py-1 pl-2 font-bold uppercase opacity-40">Estado</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {lineasPago.map((lp: any) => {
                                              const lpPrecio = Number(lp.monto_ajustado || 0)
                                              const lpAbonado = Number(lp.monto_abonado || 0)
                                              const lpSaldo = Math.max(0, lpPrecio - lpAbonado)
                                              return (
                                                <tr key={lp.id || lp.modulo_id} className="border-b border-gray-50">
                                                  <td className="py-1 pr-2 text-left font-medium" style={{ color: COLORS.CHARCOAL }}>
                                                    {lp.nombre_modulo || `Módulo ${lp.numero_orden || '—'}`}
                                                  </td>
                                                  <td className="py-1 px-2 text-right">${lpPrecio.toLocaleString()}</td>
                                                  <td className="py-1 px-2 text-right text-green-600 font-medium">${lpAbonado.toLocaleString()}</td>
                                                  <td className="py-1 px-2 text-right" style={{ color: lpSaldo > 0 ? '#dc2626' : COLORS.CHARCOAL }}>
                                                    ${lpSaldo.toLocaleString()}
                                                  </td>
                                                  <td className="py-1 pl-2 text-center">
                                                    <span className={cn(
                                                      "text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full",
                                                      lpSaldo === 0 ? "bg-green-100 text-green-700" : lpAbonado > 0 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                                                    )}>
                                                      {lpSaldo === 0 ? "Pagado" : lpAbonado > 0 ? "Parcial" : "Pendiente"}
                                                    </span>
                                                  </td>
                                                </tr>
                                              )
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
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
