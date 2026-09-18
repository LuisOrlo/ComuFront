/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AiFolderIcon,
  Cancel01Icon,
  LayersIcon,
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
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { useNavigate } from "react-router"
import { PaginationControls } from "@/components/table/PaginationControls"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

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
  entry: any
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
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [tipo, setTipo] = useState("todos")
  const [dense, setDense] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 })

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setPagination(p => ({ ...p, pageIndex: 0 }))
  }, [filter, search, tipo])

  useEffect(() => {
    Promise.all([
      financeService.getCuentas({ per_page: 100, origen: "servicio", search }),
      financeService.getResumen(),
    ])
      .then(([cuentasData, resumenData]) => {
        setCuentas(cuentasData.data ?? [])
        setStats(resumenData)
      })
      .catch(() => toast.error("Error al cargar cuentas de servicios"))
      .finally(() => setLoading(false))
  }, [search])

  const rows = useMemo(() => {
    const list: ServicioRow[] = []

    cuentas.forEach((c: any) => {
      if (!c) return
      const { tipo, nombre } = getServicioInfo(c)
      if (tipo === "Servicio") return
      const total = Number(c.monto_total || 0)
      const cobrado = Number(c.monto_abonado || 0)
      const saldo = Number(c.saldo_pendiente || 0)
      list.push({
        key: c.cuenta_cobrar_id || c.id,
        tipo,
        name: nombre,
        cliente: getNombreCliente(c),
        total,
        cobrado,
        saldo,
        estado: getEstado(total, cobrado, saldo),
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
        list.push({
          key: `sc-${item.tipo || "x"}-${item.id}`,
          tipo: label,
          name: item.nombre_servicio && item.nombre_servicio !== label ? item.nombre_servicio : "—",
          cliente: item.persona_nombre || "—",
          total,
          cobrado,
          saldo,
          estado: getEstado(total, cobrado, saldo),
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
    if (search) {
      const q = search.toLowerCase().trim()
      list = list.filter((r) =>
        r.name.toLowerCase().includes(q)
        || r.tipo.toLowerCase().includes(q)
        || r.cliente.toLowerCase().includes(q)
      )
    }
    return list
  }, [filtered, search, tipo])

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
    <div className="px-8 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black" style={{ color: CHARCOAL }}>
            Servicios
          </h2>
          <p className="text-xs opacity-40 mt-1">
            {searchFiltered.length} registro{searchFiltered.length !== 1 ? "s" : ""} de servicios con cuentas por cobrar
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={tipo}
            onChange={e => setTipo(e.target.value)}
            className="px-3 py-2 rounded-xl border text-xs font-medium outline-none bg-white"
            style={{ borderColor: BORDER, color: CHARCOAL }}
          >
            <option value="todos">Todos los tipos</option>
            {tipoOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar servicio o cliente..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-48 pl-3 pr-8 py-2 rounded-xl border text-xs font-medium outline-none transition-all focus:w-64"
              style={{ borderColor: BORDER, color: CHARCOAL }}
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(""); setSearch("") }}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={14} style={{ color: MUTED }} />
              </button>
            )}
          </div>
          <button
            onClick={() => setDense(d => !d)}
            title={dense ? "Vista cómoda" : "Vista compacta"}
            className="size-9 rounded-xl border flex items-center justify-center transition-all hover:bg-gray-50"
            style={{ borderColor: BORDER }}
          >
            <HugeiconsIcon icon={LayersIcon} size={16} style={{ color: dense ? ACCENT : MUTED }} />
          </button>
        </div>
      </div>

      <div className="flex gap-1.5">
        {[
          { key: "todos", label: "Todos" },
          { key: "pendiente", label: "Pendiente" },
          { key: "en_progreso", label: "En Progreso" },
          { key: "completado", label: "Completado" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
              filter === f.key ? "text-white shadow-sm" : "hover:opacity-60"
            )}
            style={filter === f.key ? { backgroundColor: ACCENT } : { color: MUTED, backgroundColor: "oklch(0.95 0 0)" }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {searchFiltered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-16 rounded-[1.5rem] flex items-center justify-center mb-4" style={{ backgroundColor: "oklch(0.95 0.01 45)" }}>
            <HugeiconsIcon icon={AiFolderIcon} size={28} style={{ color: ACCENT }} />
          </div>
          <p className="text-sm font-bold" style={{ color: CHARCOAL }}>No hay servicios registrados</p>
          <p className="text-xs opacity-40 mt-1">Los servicios con pagos aparecerán aquí</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden"
        >
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
                            "px-4",
                            dense ? "py-2" : "py-3.5",
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
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
            <PaginationControls table={table} pageSizes={[10, 25, 50]} />
          </div>
        </motion.div>
        )}
    </div>
  )
}
