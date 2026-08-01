/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  LibraryIcon,
  SchoolIcon,
  AiFolderIcon,
  ArrowDown01Icon,
  UserIcon,
  SearchIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
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

  const extractNombre = (entidad: any) =>
    entidad ? `${entidad.nombres || ""} ${entidad.apellidos || ""}`.trim() : ""

  return extractNombre(cuenta.matricula?.estudiante)
    || extractNombre(cuenta.solicitud_inscripcion?.estudiante)
    || extractNombre(cuenta.solicitud_inscripcion?.participante_externo)
    || extractNombre(cuenta.inscripcion_taller)
    || extractNombre(cuenta.reserva_podcast?.persona)
    || extractNombre(cuenta.reserva_podcast?.cliente_externo)
    || extractNombre(cuenta.reserva_aula?.persona)
    || extractNombre(cuenta.reserva_aula?.cliente_externo)
    || extractNombre(cuenta.alquiler_equipo?.persona)
    || extractNombre(cuenta.alquiler_equipo?.cliente_externo)
    || extractNombre(cuenta.reserva_radio?.persona)
    || extractNombre(cuenta.reserva_radio?.cliente_externo)
    || extractNombre(cuenta.edicion_video?.cliente)
    || extractNombre(cuenta.edicion_video?.cliente_externo)
    || "—"
}

const SERVICIO_FKS = [
  "reserva_aula_id", "reserva_podcast_id", "alquiler_equipo_id",
  "servicio_streaming_id", "servicio_produccion_id", "edicion_video_id",
  "clase_extra_id", "asesoria_id", "reserva_radio_id",
] as const

const SERVICIO_TIPOS = [
  "servicio", "aula", "podcast", "equipo", "streaming", "produccion",
  "edicion", "radio", "clase_extra", "asesoria",
] as const

function getCuentaType(cuenta: any): string {
  if (cuenta.inscripcion_taller || cuenta.inscripcion_taller_id) return "talleres"
  if (SERVICIO_FKS.some(fk => cuenta[fk])) return "servicios"
  if (SERVICIO_TIPOS.some(t => cuenta.tipo === t)) return "servicios"
  if (cuenta.tipo === "taller" || cuenta.tipo === "talleres") return "talleres"
  const cat = cuenta.matricula?.curso_abierto?.catalogo?.categoria
    ?? cuenta.matricula?.curso_abierto?.tipo
    ?? cuenta.solicitud_inscripcion?.curso_abierto?.catalogo?.categoria
    ?? cuenta.categoria
  if (cat === "taller" || cat === "talleres") return "talleres"
  if (cat === "personalizado") return "servicios"
  return "cursos"
}

const FK_A_TIPO: Record<string, string> = {
  reserva_podcast_id: "Podcast",
  reserva_aula_id: "Aula",
  alquiler_equipo_id: "Equipo",
  edicion_video_id: "Edición de Video",
  reserva_radio_id: "Radio",
  servicio_streaming_id: "Streaming",
  servicio_produccion_id: "Producción",
  clase_extra_id: "Clase Extra",
  asesoria_id: "Asesoría",
}

function getServicioTipo(cuenta: any): string {
  for (const fk of SERVICIO_FKS) if (cuenta[fk]) return FK_A_TIPO[fk] || "Servicio"
  return "Servicio"
}

function getCuentaName(cuenta: any): string {
  const curso = cuenta.matricula?.curso_abierto || cuenta.solicitud_inscripcion?.curso_abierto || null

  if (cuenta.inscripcion_taller?.taller?.nombre) return cuenta.inscripcion_taller.taller.nombre

  if (cuenta.nombre_servicio) return cuenta.nombre_servicio

  const tipo = getServicioTipo(cuenta)
  const titulo = cuenta.reserva_podcast?.titulo
    || cuenta.reserva_aula?.aula?.nombre
    || cuenta.alquiler_equipo?.equipo?.nombre
    || cuenta.edicion_video?.titulo
    || cuenta.reserva_radio?.tarifa?.nombre
    || cuenta.reserva_radio?.fecha_reserva

  if (titulo) return `${tipo} - ${titulo}`

  const paquete = cuenta.reserva_podcast?.paquete?.nombre
  if (paquete) return `${tipo} - ${paquete}`

  for (const fk of SERVICIO_FKS) if (cuenta[fk]) return tipo

  if (cuenta.curso_nombre) return cuenta.curso_nombre

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

  if (cuenta.inscripcion_taller_id) return "Taller"
  for (const fk of SERVICIO_FKS) if (cuenta[fk]) return tipo
  for (const t of SERVICIO_TIPOS) if (cuenta.tipo === t) return getServicioTipo(cuenta)
  return "Curso"
}



function RowProgressBar({ pct }: { pct: number }) {
  const barColor =
    pct >= 80 ? "bg-green-500" :
    pct >= 40 ? "bg-amber-500" :
    "bg-red-500"
  return (
    <div className="w-[80px] h-1.5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
      <div className={cn("h-full rounded-full transition-all duration-300", barColor)} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  )
}

export function FinanceResumen({ stats, cuentas }: FinanceResumenProps) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<string>("todos") // 'todos', 'cursos', 'talleres', 'servicios'
  const [modalidadFilter, setModalidadFilter] = useState<string>("todos")
  const [sortBy, setSortBy] = useState<"deuda" | "nombre" | "porcentaje">("deuda")
  
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({})
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const [modulosExpandidos, setModulosExpandidos] = useState<Set<string>>(new Set())
  const [categoryPages, setCategoryPages] = useState<Record<string, number>>({
    cursos: 1,
    talleres: 1,
    servicios: 1,
  })

  const toggleModulos = (id: string) => {
    setModulosExpandidos(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Reset pages and expanded row when filters change
  useEffect(() => {
    setCategoryPages({ cursos: 1, talleres: 1, servicios: 1 })
    setExpandedRowId(null)
  }, [search, filter, modalidadFilter, sortBy])

  const totalConDeuda = Number(stats?.cuentas_con_deuda || 0)
  const totalCobrado = Number(stats?.total_cobrado || 0)
  const totalPendiente = Number(stats?.total_pendiente || 0)

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



  // Filter and sort items per category
  const filteredAndSortedGroups = useMemo(() => {
    const result: Record<string, { label: string; items: any[] }> = {}
    const categories = filter === "todos" ? ["cursos", "talleres", "servicios"] : [filter]

    categories.forEach(cat => {
      const group = processedData[cat]
      if (!group) return

      // Convert items map to array
      let itemsArray = Object.entries(group.items).map(([name, item]: [string, any]) => ({
        name,
        ...item
      }))

      // Apply search filter (match name or student names)
      if (search.trim()) {
        const query = search.toLowerCase()
        itemsArray = itemsArray.filter(item => {
          const matchName = item.name.toLowerCase().includes(query)
          const matchStudent = item.entries.some((entry: any) => {
            const studentName = getNombrePersona(entry)
            return studentName.toLowerCase().includes(query)
          })
          return matchName || matchStudent
        })
      }

      // Apply sorting
      itemsArray.sort((a, b) => {
        if (sortBy === "deuda") {
          return b.saldo - a.saldo
        }
        if (sortBy === "nombre") {
          return a.name.localeCompare(b.name)
        }
        if (sortBy === "porcentaje") {
          const pctA = a.total > 0 ? (a.cobrado / a.total) * 100 : 0
          const pctB = b.total > 0 ? (b.cobrado / b.total) * 100 : 0
          return pctA - pctB // lower percentage (more pending work) first
        }
        return 0
      })

      if (itemsArray.length > 0) {
        result[cat] = {
          label: group.label,
          items: itemsArray
        }
      }
    })

    return result
  }, [processedData, filter, search, sortBy])

  return (
    <div className="space-y-6">
      {/* 1. KPIs Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Cobrado */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">Cobrado</p>
          <p className="text-2xl font-black text-gray-900 dark:text-white">${totalCobrado.toLocaleString()}</p>
        </div>
        {/* Con Deuda */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-1">Con Deuda</p>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{totalConDeuda}</p>
        </div>
        {/* Total Pendiente */}
        <div className="bg-red-50 dark:bg-red-950/40 rounded-xl p-4 border border-red-100 dark:border-red-900/30">
          <p className="text-xs text-red-700 dark:text-red-300 font-bold uppercase tracking-wider mb-1">Total Pendiente</p>
          <p className="text-2xl font-black text-red-700 dark:text-red-300">${totalPendiente.toLocaleString()}</p>
        </div>
      </div>

      {/* 2. Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por curso o estudiante..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-xs font-semibold outline-none focus:ring-2 focus:ring-violet-500/10 dark:text-white"
          />
          <HugeiconsIcon icon={SearchIcon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 dark:text-white" />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 opacity-35 hover:opacity-100 dark:text-white"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={13} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Categoria select */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold outline-none cursor-pointer dark:text-white"
          >
            <option value="todos">Todas las categorías</option>
            <option value="cursos">Cursos</option>
            <option value="talleres">Talleres</option>
            <option value="servicios">Servicios</option>
          </select>

          {/* Modalidad Filter */}
          <select
            value={modalidadFilter}
            onChange={(e) => setModalidadFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold outline-none cursor-pointer dark:text-white"
          >
            <option value="todos">Todas las modalidades</option>
            <option value="presencial">Presencial</option>
            <option value="virtual">Virtual</option>
          </select>

          {/* Sorting select */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-bold outline-none cursor-pointer dark:text-white"
          >
            <option value="deuda">Mayor deuda primero</option>
            <option value="nombre">Nombre A-Z</option>
            <option value="porcentaje">% cobrado</option>
          </select>
        </div>
      </div>

      {/* 3. Accordions Container */}
      <div className="space-y-4">
        {Object.entries(filteredAndSortedGroups).map(([type, group]) => {
          const isOpen = !!openCategories[type]
          
          // Calculate Aggregated totals
          const catCobrado = group.items.reduce((sum, item) => sum + item.cobrado, 0)
          const catSaldo = group.items.reduce((sum, item) => sum + item.saldo, 0)

          // Paginate items inside this category
          const currentPage = categoryPages[type] || 1
          const PAGE_SIZE = 15
          const totalPages = Math.ceil(group.items.length / PAGE_SIZE)
          const paginatedItems = group.items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

          return (
            <div
              key={type}
              className="border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900/30 overflow-hidden"
            >
              {/* Category Header */}
              <div
                onClick={() => setOpenCategories(prev => ({ ...prev, [type]: !prev[type] }))}
                className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 cursor-pointer hover:bg-black/[0.01] dark:hover:bg-white/[0.01] select-none transition-colors border-b border-transparent [&:not(:last-child)]:border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <motion.div animate={{ rotate: isOpen ? 0 : -90 }} transition={{ duration: 0.15 }}>
                    <HugeiconsIcon icon={ArrowDown01Icon} size={16} className="text-gray-400 dark:text-gray-500" />
                  </motion.div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-gray-800 dark:text-gray-200 uppercase tracking-wider">{group.label}</span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full font-bold">
                      {group.items.length}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs mt-2 sm:mt-0 font-bold ml-7 sm:ml-0">
                  <span className="text-gray-500 dark:text-gray-400">Recaudado: <span className="text-gray-800 dark:text-gray-200">${catCobrado.toLocaleString()}</span></span>
                  <span className={cn("text-gray-500 dark:text-gray-400")}>
                    Pendiente:{" "}
                    <span className={cn(catSaldo > 0 ? "text-red-500 dark:text-red-400 font-extrabold" : "text-gray-800 dark:text-gray-200")}>
                      ${catSaldo.toLocaleString()}
                    </span>
                  </span>
                </div>
              </div>

              {/* Rows inside Category */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden bg-white dark:bg-transparent"
                  >
                    <div className="divide-y divide-gray-100 dark:divide-gray-800/80">
                      {paginatedItems.map((item) => {
                        const itemPct = item.total > 0 ? (item.cobrado / item.total) * 100 : 0
                        const rowId = `${type}-${item.name}`
                        const isExpanded = expandedRowId === rowId

                        return (
                          <div key={item.name} className="transition-colors hover:bg-black/[0.005] dark:hover:bg-white/[0.005]">
                            {/* Row Header clickable to toggle details */}
                            <div
                              onClick={() => setExpandedRowId(isExpanded ? null : rowId)}
                              className="flex items-center justify-between px-5 py-3 cursor-pointer select-none"
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div
                                  className="size-7 rounded-lg flex items-center justify-center shrink-0"
                                  style={{
                                    backgroundColor: item.saldo > 0 ? "oklch(0.5 0.15 20 / 0.08)" : "oklch(0.55 0.15 150 / 0.08)"
                                  }}
                                >
                                  <HugeiconsIcon
                                    icon={ORIGEN_CONFIG[type]?.icon || LibraryIcon}
                                    size={14}
                                    color={item.saldo > 0 ? "#ef4444" : (ORIGEN_CONFIG[type]?.color || "#4f46e5")}
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200 truncate max-w-[200px] sm:max-w-md">
                                      {item.name}
                                    </span>
                                    <span className="hidden sm:inline text-[10px] text-gray-400 dark:text-gray-500 font-bold shrink-0">
                                      {item.personas} persona{item.personas !== 1 ? "s" : ""}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 shrink-0 ml-4">
                                {/* Row Progress Bar (hidden on mobile) */}
                                <div className="hidden sm:block">
                                  <RowProgressBar pct={itemPct} />
                                </div>

                                {/* Percentage */}
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold w-10 text-right shrink-0">
                                  {Math.round(itemPct)}%
                                </span>

                                {/* Pendiente */}
                                <span className={cn(
                                  "text-xs font-bold w-20 text-right shrink-0",
                                  item.saldo > 0 ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-gray-500"
                                )}>
                                  ${item.saldo.toLocaleString()}
                                </span>

                                <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.15 }}>
                                  <HugeiconsIcon icon={ArrowDown01Icon} size={12} className="opacity-45 text-gray-500 dark:text-gray-400" />
                                </motion.div>
                              </div>
                            </div>

                            {/* Row Expanded Details (Inline) */}
                            <AnimatePresence initial={false}>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="border-t border-gray-100 dark:border-gray-800 overflow-hidden"
                                >
                                  {/* Consolidated Summary */}
                                  <div className="px-5 py-3 bg-gray-50/50 dark:bg-gray-800/20 border-b border-gray-100 dark:border-gray-800">
                                    <div className="grid grid-cols-4 gap-3 text-[10px] sm:text-xs">
                                      <div>
                                        <p className="opacity-50 dark:text-gray-400 font-bold uppercase tracking-wider text-[8px] sm:text-[9px]">Valor Total</p>
                                        <p className="font-extrabold text-gray-800 dark:text-gray-200">${item.total.toLocaleString()}</p>
                                      </div>
                                      <div>
                                        <p className="opacity-50 dark:text-gray-400 font-bold uppercase tracking-wider text-[8px] sm:text-[9px]">Recaudado</p>
                                        <p className="font-extrabold text-green-600 dark:text-green-400">${item.cobrado.toLocaleString()}</p>
                                      </div>
                                      <div>
                                        <p className="opacity-50 dark:text-gray-400 font-bold uppercase tracking-wider text-[8px] sm:text-[9px]">Pendiente</p>
                                        <p className="font-extrabold text-red-500 dark:text-red-400">${item.saldo.toLocaleString()}</p>
                                      </div>
                                      <div>
                                        <p className="opacity-50 dark:text-gray-400 font-bold uppercase tracking-wider text-[8px] sm:text-[9px]">{item.deudores > 0 ? "Deudores" : "Pagado"}</p>
                                        <p className={cn("font-extrabold", item.deudores > 0 ? "text-red-500 dark:text-red-400" : "text-green-600 dark:text-green-400")}>
                                          {item.deudores}/{item.personas}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* List of accounts entries */}
                                  <div className="divide-y divide-gray-100 dark:divide-gray-800/60 bg-white/40 dark:bg-transparent">
                                    {item.entries.length === 0 ? (
                                      <div className="p-4 text-xs opacity-40 text-center dark:text-white">Sin registros</div>
                                    ) : (
                                      item.entries.map((cuenta: any) => {
                                        const nombre = getNombrePersona(cuenta)
                                        const pendiente = Number(cuenta.saldo_pendiente || 0)
                                        const abonado = Number(cuenta.monto_abonado || 0)
                                        const lineasPago = cuenta.lineas_pago || []

                                        return (
                                          <div key={cuenta.id || Math.random()} className="px-5 py-3 transition-colors hover:bg-black/[0.01] dark:hover:bg-white/[0.01]">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                <div className="size-6 rounded-full flex items-center justify-center shrink-0 bg-gray-100 dark:bg-gray-800">
                                                  <HugeiconsIcon icon={UserIcon} size={11} className="text-gray-400 dark:text-gray-500" />
                                                </div>
                                                <div className="min-w-0">
                                                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{nombre}</p>
                                                  <p className="text-[10px] opacity-40 dark:text-gray-400 font-bold">
                                                    Total: ${(Number(cuenta.monto_total) || 0).toLocaleString()}
                                                  </p>
                                                </div>
                                              </div>

                                              <div className="flex items-center gap-3 shrink-0 ml-8 sm:ml-0">
                                                <div className="text-right">
                                                  <p className="text-[9px] opacity-45 dark:text-gray-400 font-bold">Abonado</p>
                                                  <p className="text-xs font-extrabold text-green-600 dark:text-green-400">${abonado.toLocaleString()}</p>
                                                </div>
                                                <div className="text-right">
                                                  <p className="text-[9px] opacity-45 dark:text-gray-400 font-bold">Saldo</p>
                                                  <p className={cn("text-xs font-extrabold", pendiente > 0 ? "text-red-500 dark:text-red-400" : "text-gray-800 dark:text-gray-200")}>
                                                    ${pendiente.toLocaleString()}
                                                  </p>
                                                </div>
                                                <span className={cn(
                                                  "text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full",
                                                  pendiente === 0 ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300" : abonado > 0 ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300" : "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300"
                                                )}>
                                                  {pendiente === 0 ? "Al día" : abonado > 0 ? "Parcial" : "Deuda"}
                                                </span>
                                                {lineasPago.length > 0 && (
                                                  <button
                                                    onClick={() => toggleModulos(cuenta.id || cuenta.matricula_id)}
                                                    className="text-[10px] font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 shrink-0 ml-2"
                                                  >
                                                    {modulosExpandidos.has(cuenta.id || cuenta.matricula_id) ? "Ocultar módulos" : "Ver módulos"}
                                                  </button>
                                                )}
                                              </div>
                                            </div>

                                            {lineasPago.length > 0 && modulosExpandidos.has(cuenta.id || cuenta.matricula_id) && (
                                              <div className="mt-3 overflow-x-auto border-t border-gray-100 dark:border-gray-800 pt-3">
                                                <table className="w-full text-[10px]">
                                                  <thead>
                                                    <tr className="border-b border-gray-100 dark:border-gray-850">
                                                      <th className="text-left py-1 pr-2 font-extrabold uppercase opacity-45 dark:text-gray-400">Módulo</th>
                                                      <th className="text-right py-1 px-2 font-extrabold uppercase opacity-45 dark:text-gray-400">Precio</th>
                                                      <th className="text-right py-1 px-2 font-extrabold uppercase opacity-45 dark:text-gray-400">Abonado</th>
                                                      <th className="text-right py-1 px-2 font-extrabold uppercase opacity-45 dark:text-gray-400">Saldo</th>
                                                      <th className="text-center py-1 pl-2 font-extrabold uppercase opacity-45 dark:text-gray-400">Estado</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody className="divide-y divide-gray-50 dark:divide-gray-850">
                                                    {lineasPago.map((lp: any) => {
                                                      const lpPrecio = Number(lp.monto_ajustado || 0)
                                                      const lpAbonado = Number(lp.monto_abonado || 0)
                                                      const lpSaldo = Math.max(0, lpPrecio - lpAbonado)
                                                      return (
                                                        <tr key={lp.id || lp.modulo_id} className="text-gray-650 dark:text-gray-300">
                                                          <td className="py-1.5 pr-2 text-left font-bold text-gray-700 dark:text-gray-200">
                                                            {(lp as any).tipo === 'inscripcion' ? 'Inscripción / Matrícula' : (lp.nombre_modulo || `Módulo ${lp.numero_orden || '—'}`)}
                                                          </td>
                                                          <td className="py-1.5 px-2 text-right">${lpPrecio.toLocaleString()}</td>
                                                          <td className="py-1.5 px-2 text-right text-green-600 dark:text-green-400 font-bold">${lpAbonado.toLocaleString()}</td>
                                                          <td className="py-1.5 px-2 text-right font-bold" style={{ color: lpSaldo > 0 ? '#ef4444' : undefined }}>
                                                            ${lpSaldo.toLocaleString()}
                                                          </td>
                                                          <td className="py-1.5 pl-2 text-center">
                                                            <span className={cn(
                                                              "text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-full",
                                                              lpSaldo === 0 ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300" : lpAbonado > 0 ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300" : "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300"
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

                    {/* 4. Internal Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/20">
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 font-bold">
                          Página {currentPage} de {totalPages} ({group.items.length} registros)
                        </span>
                        <div className="flex gap-2">
                          <button
                            disabled={currentPage <= 1}
                            onClick={() => setCategoryPages(prev => ({ ...prev, [type]: currentPage - 1 }))}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-white transition-colors"
                          >
                            Anterior
                          </button>
                          <button
                            disabled={currentPage >= totalPages}
                            onClick={() => setCategoryPages(prev => ({ ...prev, [type]: currentPage + 1 }))}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-white transition-colors"
                          >
                            Siguiente
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}

        {Object.keys(filteredAndSortedGroups).length === 0 && (
          <div className="text-center py-16 border border-dashed border-gray-250 dark:border-gray-850 rounded-2xl bg-white dark:bg-transparent">
            <p className="text-sm font-semibold opacity-40 dark:text-white">
              No se encontraron cuentas o cobros pendientes con los filtros seleccionados
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
