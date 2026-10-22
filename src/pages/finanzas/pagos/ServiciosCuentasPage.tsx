/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AiFolderIcon,
  Cancel01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import {
  Mic,
  School,
  Camera,
  Film,
  Radio,
  Tv,
  Clapperboard,
  GraduationCap,
  UserCheck,
  Layers,
  ArrowRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type PaginationState,
} from "@tanstack/react-table"
import { cn } from "@/lib/utils"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { useNavigate } from "react-router"
import { PaginationControls } from "@/components/table/PaginationControls"
import { MonthFilterPopover } from "@/components/finanzas/MonthFilterPopover"
import { CityFilterSelect, type CityOption } from "@/components/finanzas/CityFilterSelect"

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

const SERVICIO_FKS = Object.keys(FK_A_TIPO)

const TIPO_LABEL: Record<string, string> = {
  aula: "Aula",
  podcast: "Podcast",
  equipo: "Equipo",
  edicion: "Edición de Video",
  radio: "Radio",
  streaming: "Streaming",
  produccion: "Producción",
  clase_extra: "Clase Extra",
  asesoria: "Asesoría",
}

function getIniciales(nombre?: string | null) {
  if (!nombre || nombre === "—") return "—"
  const clean = nombre.trim()
  const parts = clean.split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return clean.slice(0, 2).toUpperCase()
}

const SERVICIO_CONFIG: Record<
  string,
  {
    bg: string
    iconBg: string
    iconColor: string
    icon: any
  }
> = {
  Podcast: {
    bg: "bg-blue-50 text-blue-700 border-blue-200/60",
    iconBg: "bg-blue-100/80 text-blue-600",
    iconColor: "text-blue-600",
    icon: Mic,
  },
  Aula: {
    bg: "bg-violet-50 text-violet-700 border-violet-200/60",
    iconBg: "bg-violet-100/80 text-violet-600",
    iconColor: "text-violet-600",
    icon: School,
  },
  Equipo: {
    bg: "bg-amber-50 text-amber-700 border-amber-200/60",
    iconBg: "bg-amber-100/80 text-amber-600",
    iconColor: "text-amber-600",
    icon: Camera,
  },
  "Edición de Video": {
    bg: "bg-orange-50 text-orange-700 border-orange-200/60",
    iconBg: "bg-orange-100/80 text-orange-600",
    iconColor: "text-orange-600",
    icon: Film,
  },
  Radio: {
    bg: "bg-pink-50 text-pink-700 border-pink-200/60",
    iconBg: "bg-pink-100/80 text-pink-600",
    iconColor: "text-pink-600",
    icon: Radio,
  },
  Streaming: {
    bg: "bg-teal-50 text-teal-700 border-teal-200/60",
    iconBg: "bg-teal-100/80 text-teal-600",
    iconColor: "text-teal-600",
    icon: Tv,
  },
  Producción: {
    bg: "bg-lime-50 text-lime-800 border-lime-200/60",
    iconBg: "bg-lime-100/80 text-lime-700",
    iconColor: "text-lime-700",
    icon: Clapperboard,
  },
  "Clase Extra": {
    bg: "bg-cyan-50 text-cyan-700 border-cyan-200/60",
    iconBg: "bg-cyan-100/80 text-cyan-600",
    iconColor: "text-cyan-600",
    icon: GraduationCap,
  },
  Asesoría: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    iconBg: "bg-emerald-100/80 text-emerald-600",
    iconColor: "text-emerald-600",
    icon: UserCheck,
  },
}

type EstadoServicio = "pendiente" | "en_progreso" | "completado"

const ESTADO_CONFIG: Record<
  EstadoServicio,
  { bg: string; dot: string; icon: any; label: string }
> = {
  completado: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    dot: "bg-emerald-600",
    icon: CheckCircle2,
    label: "Completado",
  },
  en_progreso: {
    bg: "bg-blue-50 text-blue-700 border-blue-200/80",
    dot: "bg-blue-600",
    icon: Clock,
    label: "En progreso",
  },
  pendiente: {
    bg: "bg-amber-50 text-amber-700 border-amber-200/80",
    dot: "bg-amber-600",
    icon: AlertCircle,
    label: "Pendiente",
  },
}

interface ServicioRow {
  key: string
  tipo: string
  name: string
  cliente: string
  total: number
  cobrado: number
  saldo: number
  estado: EstadoServicio
  fecha?: string | null
  fechaFin?: string | null
  ciudad?: string | null
  ciudadId?: string | number | null
  entry: any
}

function extractServicioFecha(c: any): { fecha?: string | null; fechaFin?: string | null } {
  if (c.servicio_streaming?.fecha_evento) {
    return { fecha: c.servicio_streaming.fecha_evento }
  }
  if (c.reserva_podcast?.fecha_reserva) {
    return { fecha: c.reserva_podcast.fecha_reserva }
  }
  if (c.reserva_aula?.fecha_reserva) {
    return { fecha: c.reserva_aula.fecha_reserva }
  }
  if (c.alquiler_equipo) {
    return {
      fecha: c.alquiler_equipo.fecha_entrega || c.alquiler_equipo.fecha_inicio,
      fechaFin: c.alquiler_equipo.fecha_devolucion_esperada || c.alquiler_equipo.fecha_fin,
    }
  }
  if (c.reserva_radio?.fecha_reserva) {
    return { fecha: c.reserva_radio.fecha_reserva }
  }
  if (c.edicion_video) {
    return { fecha: c.edicion_video.fecha_entrega || c.edicion_video.fecha_recibo }
  }
  if (c.created_at) {
    return { fecha: c.created_at }
  }
  return {}
}

function extractServicioCiudad(c: any): { ciudad?: string | null; ciudadId?: string | number | null } {
  if (c.servicio_streaming?.ciudad) {
    return {
      ciudad: c.servicio_streaming.ciudad.nombre,
      ciudadId: c.servicio_streaming.ciudad_id || c.servicio_streaming.ciudad.id,
    }
  }
  if (c.reserva_aula?.aula?.ciudad) {
    return {
      ciudad: c.reserva_aula.aula.ciudad.nombre,
      ciudadId: c.reserva_aula.aula.ciudad.id,
    }
  }
  if (c.ciudad) {
    return {
      ciudad: typeof c.ciudad === "object" ? c.ciudad.nombre : c.ciudad,
      ciudadId: c.ciudad_id || (typeof c.ciudad === "object" ? c.ciudad.id : undefined),
    }
  }
  return {}
}

function getServicioTipo(entry: any): string {
  for (const fk of SERVICIO_FKS) if (entry[fk]) return FK_A_TIPO[fk]
  return "Servicio"
}

function getServicioInfo(c: any): { tipo: string; nombre: string } {
  const tipo = getServicioTipo(c)
  const nombre = c.reserva_podcast?.titulo
    || c.reserva_aula?.aula?.nombre
    || c.alquiler_equipo?.equipo?.nombre
    || c.edicion_video?.titulo
    || c.reserva_radio?.tarifa?.nombre
    || c.reserva_radio?.fecha_reserva
    || c.reserva_podcast?.paquete?.nombre
  return { tipo, nombre: nombre || "—" }
}

function getNombreCliente(c: any): string {
  if (c.persona_nombre) return c.persona_nombre

  const extractNombre = (entidad: any) =>
    entidad ? `${entidad.nombres || ""} ${entidad.apellidos || ""}`.trim() : ""

  return extractNombre(c.persona)
    || extractNombre(c.cliente_externo)
    || extractNombre(c.reserva_podcast?.persona)
    || extractNombre(c.reserva_podcast?.cliente_externo)
    || extractNombre(c.reserva_aula?.persona)
    || extractNombre(c.reserva_aula?.cliente_externo)
    || extractNombre(c.alquiler_equipo?.persona)
    || extractNombre(c.alquiler_equipo?.cliente_externo)
    || extractNombre(c.reserva_radio?.persona)
    || extractNombre(c.reserva_radio?.cliente_externo)
    || extractNombre(c.edicion_video?.cliente)
    || extractNombre(c.edicion_video?.cliente_externo)
    || "—"
}

function getEstado(total: number, cobrado: number, saldo: number): EstadoServicio {
  if (saldo <= 0) return "completado"
  const pct = total > 0 ? (cobrado / total) * 100 : 0
  return pct >= 50 ? "en_progreso" : "pendiente"
}

export function ServiciosCuentasPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [cuentas, setCuentas] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [filter, setFilter] = useState("todos")
  const [ciudadId, setCiudadId] = useState<string>("")
  const [mes, setMes] = useState<string>("")
  const [anio, setAnio] = useState<string>("")
  const [rangoFechas, setRangoFechas] = useState<{ fecha_desde?: string; fecha_hasta?: string }>({})
  const [ciudadesDisponibles, setCiudadesDisponibles] = useState<CityOption[]>([])
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [tipo, setTipo] = useState("todos")
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 })

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setPagination(p => ({ ...p, pageIndex: 0 }))
  }, [filter, search, tipo, ciudadId, rangoFechas])

  useEffect(() => {
    const params: Record<string, string | number | undefined> = {
      per_page: 500,
      origen: "servicio",
      search: search || undefined,
      ciudad_id: ciudadId || undefined,
      fecha_desde: rangoFechas.fecha_desde,
      fecha_hasta: rangoFechas.fecha_hasta,
    }
    Promise.all([
      financeService.getCuentas(params),
      financeService.getResumen(),
    ])
      .then(([cuentasData, resumenData]) => {
        const items = cuentasData.data ?? []
        setCuentas(items)
        setStats(resumenData)

        // Registrar ciudades de los servicios que cuentan con ciudad registrada
        const mapCiudades = new Map<string, CityOption>()
        items.forEach((c: any) => {
          const { ciudad, ciudadId: cid } = extractServicioCiudad(c)
          if (ciudad) {
            const key = String(cid ?? ciudad)
            if (!mapCiudades.has(key)) {
              mapCiudades.set(key, { id: cid ?? key, nombre: ciudad })
            }
          }
        })
        if (mapCiudades.size > 0) {
          setCiudadesDisponibles((prev) => {
            const combined = new Map<string, CityOption>()
            prev.forEach((p) => combined.set(String(p.id), p))
            mapCiudades.forEach((v, k) => combined.set(k, v))
            return Array.from(combined.values()).sort((a, b) => a.nombre.localeCompare(b.nombre))
          })
        }
      })
      .catch(() => toast.error("Error al cargar cuentas de servicios"))
      .finally(() => setLoading(false))
  }, [search, ciudadId, rangoFechas])

  const rows = useMemo(() => {
    const list: ServicioRow[] = []

    cuentas.forEach((c: any) => {
      if (!c) return
      const { tipo, nombre } = getServicioInfo(c)
      if (tipo === "Servicio") return
      const total = Number(c.monto_total || 0)
      const cobrado = Number(c.monto_abonado || 0)
      const saldo = Number(c.saldo_pendiente || 0)
      const { fecha, fechaFin } = extractServicioFecha(c)
      const { ciudad, ciudadId: cid } = extractServicioCiudad(c)
      list.push({
        key: c.cuenta_cobrar_id || c.id,
        tipo,
        name: nombre,
        cliente: getNombreCliente(c),
        total,
        cobrado,
        saldo,
        estado: getEstado(total, cobrado, saldo),
        fecha,
        fechaFin,
        ciudad,
        ciudadId: cid,
        entry: c,
      })
    })

    if (Array.isArray(stats?.sin_cuenta?.servicios?.items)) {
      stats.sin_cuenta.servicios.items.forEach((item: any) => {
        if (!item) return
        const label = item.tipo ? (TIPO_LABEL[item.tipo] ?? item.tipo) : "Servicio"
        const total = Number(item.monto_total || 0)
        const cobrado = Number(item.monto_abonado || 0)
        const saldo = Number(item.saldo_pendiente || 0)
        const { fecha, fechaFin } = extractServicioFecha(item)
        const { ciudad, ciudadId: cid } = extractServicioCiudad(item)
        list.push({
          key: `sc-${item.tipo || "x"}-${item.id}`,
          tipo: label,
          name: item.nombre_servicio && item.nombre_servicio !== label ? item.nombre_servicio : "—",
          cliente: item.persona_nombre || "—",
          total,
          cobrado,
          saldo,
          estado: getEstado(total, cobrado, saldo),
          fecha,
          fechaFin,
          ciudad,
          ciudadId: cid,
          entry: { ...item, _sin_cuenta: true },
        })
      })
    }

    return list
  }, [cuentas, stats])

  const filtered = useMemo(() => {
    if (filter === "todos") return rows
    return rows.filter((r) => r.estado === filter)
  }, [rows, filter])

  const searchFiltered = useMemo(() => {
    let list = filtered
    if (tipo !== "todos") list = list.filter((r) => r.tipo === tipo)

    // Filtro Ciudad
    if (ciudadId) {
      list = list.filter((r) => r.ciudadId && String(r.ciudadId) === String(ciudadId))
    }

    // Filtro Rango de Fechas / Mes:
    // Aparecen todos los que se encuentren entre esas fechas no importan si acabaron, empezaron o estan por comenzar
    if (rangoFechas.fecha_desde && rangoFechas.fecha_hasta) {
      list = list.filter((r) => {
        const inicio = r.fecha ? r.fecha.split("T")[0] : null
        const fin = r.fechaFin ? r.fechaFin.split("T")[0] : null
        if (inicio && inicio > rangoFechas.fecha_hasta!) return false
        if (fin && fin < rangoFechas.fecha_desde!) return false
        if (!fin && inicio && inicio < rangoFechas.fecha_desde!) return false
        return true
      })
    }

    if (search) {
      const q = search.toLowerCase().trim()
      list = list.filter((r) =>
        r.name.toLowerCase().includes(q)
        || r.tipo.toLowerCase().includes(q)
        || r.cliente.toLowerCase().includes(q)
      )
    }
    return list
  }, [filtered, search, tipo, ciudadId, rangoFechas])

  const hayFiltrosActivos = Boolean(
    filter !== "todos" || tipo !== "todos" || searchInput || ciudadId || mes || anio
  )

  const limpiarTodosLosFiltros = () => {
    setFilter("todos")
    setTipo("todos")
    setSearchInput("")
    setSearch("")
    setCiudadId("")
    setMes("")
    setAnio("")
    setRangoFechas({})
  }

  const tipoOptions = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.tipo))).sort()
  }, [rows])

  const columns = useMemo<ColumnDef<ServicioRow>[]>(() => [
    {
      id: "servicio",
      accessorFn: (r) => r.name.toLowerCase(),
      header: "Servicio",
      cell: ({ row }) => {
        const r = row.original
        const cfg = SERVICIO_CONFIG[r.tipo] || {
          bg: "bg-slate-50 text-slate-700 border-slate-200/80",
          iconBg: "bg-slate-100 text-slate-600",
          iconColor: "text-slate-600",
          icon: Layers,
        }
        const ServiceIcon = cfg.icon

        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs", cfg.iconBg)}>
              <ServiceIcon className={cn("w-4 h-4", cfg.iconColor)} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-900 truncate">
                {r.name && r.name !== "—" ? r.name : r.tipo}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border", cfg.bg)}>
                  {r.tipo}
                </span>
              </div>
            </div>
          </div>
        )
      },
      enableSorting: true,
    },
    {
      id: "cliente",
      accessorFn: (r) => r.cliente.toLowerCase(),
      header: "Cliente",
      cell: ({ row }) => {
        const r = row.original
        const iniciales = getIniciales(r.cliente)
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60 font-bold text-[10px] flex items-center justify-center shrink-0">
              {iniciales}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-800 truncate max-w-[200px]" title={r.cliente}>
                {r.cliente}
              </span>
              <span className="text-[10px] text-slate-400">Titular</span>
            </div>
          </div>
        )
      },
      enableSorting: true,
    },
    {
      id: "total",
      accessorFn: (r) => r.total,
      header: "Total",
      cell: ({ row }) => (
        <div className="text-right">
          <span className="text-xs font-bold text-slate-900 block">
            ${Number(row.original.total || 0).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">USD</span>
        </div>
      ),
      enableSorting: true,
    },
    {
      id: "saldo",
      accessorFn: (r) => r.saldo,
      header: "Saldo",
      cell: ({ row }) => {
        const r = row.original
        const isCompletado = r.estado === "completado" || r.saldo <= 0
        const pct = r.total > 0 ? Math.min(100, Math.round((r.cobrado / r.total) * 100)) : 0
        return (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-baseline gap-1">
              <span
                className={cn(
                  "text-xs font-extrabold",
                  isCompletado ? "text-emerald-600" : "text-rose-600"
                )}
              >
                ${Number(r.saldo || 0).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">USD</span>
            </div>
            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden flex" title={`${pct}% cobrado ($${Number(r.cobrado).toFixed(2)})`}>
              <div
                className={cn("h-full rounded-full transition-all", isCompletado ? "bg-emerald-500" : "bg-[#fd761a]")}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      },
      enableSorting: true,
    },
    {
      id: "estado",
      accessorFn: (r) => r.estado,
      header: "Estado",
      cell: ({ row }) => {
        const est = row.original.estado
        const cfg = ESTADO_CONFIG[est] || {
          bg: "bg-slate-100 text-slate-700 border-slate-200",
          dot: "bg-slate-500",
          icon: Clock,
          label: est,
        }
        const IconComponent = cfg.icon
        return (
          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap", cfg.bg)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
            <IconComponent className="w-3 h-3" />
            {cfg.label}
          </span>
        )
      },
      enableSorting: false,
    },
    {
      id: "acciones",
      header: "",
      cell: ({ row }) => {
        const r = row.original
        const label = r.name && r.name !== "—" ? `${r.tipo} - ${r.name}` : r.tipo
        return (
          <button
            onClick={() =>
              navigate(`/finanzas/pagos/cuentas/servicios/${encodeURIComponent(label)}`, {
                state: { tipo: r.tipo, name: r.name, cliente: r.cliente, total: r.total, cobrado: r.cobrado, saldo: r.saldo, entry: r.entry },
              })
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#fd761a] bg-orange-50 hover:bg-[#fd761a] hover:text-white transition-all shadow-2xs active:scale-95 whitespace-nowrap cursor-pointer group"
          >
            <span>Ver detalle</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )
      },
      enableSorting: false,
    },
  ], [navigate])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: searchFiltered,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getRowId: (row) => row.key,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="space-y-3 w-full max-w-lg px-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Cuentas de Servicios
            </h2>
            <p className="text-xs text-slate-500">
              {searchFiltered.length} registro{searchFiltered.length !== 1 ? "s" : ""} de servicios con cuentas por cobrar
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Estado Tabs */}
            <div className="flex items-center p-0.5 bg-slate-100/80 rounded-xl border border-slate-200/60">
              {[
                { key: "todos", label: "Todos" },
                { key: "pendiente", label: "Pendiente" },
                { key: "en_progreso", label: "En progreso" },
                { key: "completado", label: "Completado" },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                    filter === f.key
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Selector de Tipo */}
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="h-9 px-3 rounded-xl border border-slate-200/90 bg-white text-xs font-semibold text-slate-700 outline-none focus:border-[#fd761a] transition-colors cursor-pointer"
            >
              <option value="todos">Todos los tipos</option>
              {tipoOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {/* Ciudad Selector (solo si hay servicios con ciudad registrada) */}
            {ciudadesDisponibles.length > 0 && (
              <CityFilterSelect
                ciudades={ciudadesDisponibles}
                value={ciudadId}
                onChange={setCiudadId}
              />
            )}

            {/* Mes y Año Popover */}
            <MonthFilterPopover
              mes={mes}
              anio={anio}
              onChange={(m, y, rango) => {
                setMes(m)
                setAnio(y)
                setRangoFechas(rango)
              }}
            />

            {/* Input de Búsqueda */}
            <div className="relative flex-1 sm:w-60">
              <HugeiconsIcon
                icon={Search01Icon}
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Buscar servicio o cliente..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full h-9 pl-9 pr-8 text-xs rounded-xl border border-slate-200/90 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("")
                    setSearch("")
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={14} />
                </button>
              )}
            </div>

            {/* Botón limpiar filtros */}
            {hayFiltrosActivos && (
              <button
                type="button"
                onClick={limpiarTodosLosFiltros}
                className="h-9 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
                title="Limpiar todos los filtros"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {searchFiltered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#fd761a] mx-auto mb-3">
            <HugeiconsIcon icon={AiFolderIcon} size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            No hay servicios registrados
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Los servicios con pagos pendientes o cobrados aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="bg-slate-50/80 border-b border-slate-200/80">
                    {hg.headers.map((header) => {
                      const canSort = header.column.getCanSort()
                      const sorted = header.column.getIsSorted()
                      const alignRight = header.id === "total" || header.id === "saldo"
                      const isCenter = header.id === "estado" || header.id === "acciones"
                      return (
                        <th
                          key={header.id}
                          onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                          className={cn(
                            "px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500",
                            canSort && "cursor-pointer hover:text-slate-800 select-none transition-colors"
                          )}
                          style={{ textAlign: alignRight ? "right" : isCenter ? "center" : "left" }}
                        >
                          <div
                            className={cn(
                              "flex items-center gap-1.5",
                              alignRight ? "justify-end" : isCenter ? "justify-center" : "justify-start"
                            )}
                          >
                            <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                            {canSort && (
                              <span className="inline-flex items-center text-slate-400">
                                {sorted === "asc" ? (
                                  <ArrowUp className="w-3 h-3 text-[#fd761a]" />
                                ) : sorted === "desc" ? (
                                  <ArrowDown className="w-3 h-3 text-[#fd761a]" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                                )}
                              </span>
                            )}
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-100">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {row.getVisibleCells().map((cell) => {
                      const alignRight = cell.column.id === "total" || cell.column.id === "saldo"
                      const isCenter = cell.column.id === "estado" || cell.column.id === "acciones"
                      return (
                        <td
                          key={cell.id}
                          className={cn(
                            "px-4 py-3.5",
                            alignRight && "text-right",
                            isCenter && "text-center"
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-100 bg-white">
            <PaginationControls table={table} pageSizes={[10, 25, 50]} />
          </div>
        </div>
        )}
    </div>
  )
}
