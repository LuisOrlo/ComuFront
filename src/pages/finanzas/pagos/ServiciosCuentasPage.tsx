/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AiFolderIcon,
  Cancel01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  LayersIcon,
} from "@hugeicons/core-free-icons"
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

const TIPO_BADGE: Record<string, string> = {
  "Podcast": "bg-blue-50 text-blue-700",
  "Aula": "bg-violet-50 text-violet-700",
  "Equipo": "bg-amber-50 text-amber-700",
  "Edición de Video": "bg-orange-50 text-orange-700",
  "Radio": "bg-pink-50 text-pink-700",
  "Streaming": "bg-teal-50 text-teal-700",
  "Producción": "bg-lime-50 text-lime-700",
  "Clase Extra": "bg-cyan-50 text-cyan-700",
  "Asesoría": "bg-yellow-50 text-yellow-700",
}

const TIPO_BADGE_FALLBACK = "bg-gray-50 text-gray-700"

type EstadoServicio = "pendiente" | "en_progreso" | "completado"

const ESTADO_BADGE: Record<EstadoServicio, string> = {
  pendiente: "bg-amber-50 text-amber-700",
  en_progreso: "bg-blue-50 text-blue-700",
  completado: "bg-green-50 text-green-700",
}

const ESTADO_LABEL: Record<EstadoServicio, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completado: "Completado",
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
      financeService.getCuentas({ per_page: 200, origen: "servicio" }),
      financeService.getResumen(),
    ])
      .then(([cuentasData, resumenData]) => {
        setCuentas(cuentasData.data ?? [])
        setStats(resumenData)
      })
      .catch(() => toast.error("Error al cargar cuentas de servicios"))
      .finally(() => setLoading(false))
  }, [])

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
        return (
          <div className="flex items-center gap-2 min-w-0">
            <span className={cn("inline-block text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap shrink-0", TIPO_BADGE[r.tipo] || TIPO_BADGE_FALLBACK)}>
              {r.tipo}
            </span>
            <span className="text-xs font-medium truncate">{r.name}</span>
          </div>
        )
      },
      enableSorting: true,
    },
    {
      id: "cliente",
      accessorFn: (r) => r.cliente.toLowerCase(),
      header: "Cliente",
      cell: ({ row }) => (
        <span className="text-xs font-medium truncate block max-w-[180px]">{row.original.cliente}</span>
      ),
      enableSorting: true,
    },
    {
      id: "total",
      accessorFn: (r) => r.total,
      header: "Total",
      cell: ({ row }) => <span className="text-xs font-bold block text-right">${row.original.total.toLocaleString()}</span>,
      enableSorting: true,
    },
    {
      id: "saldo",
      accessorFn: (r) => r.saldo,
      header: "Saldo",
      cell: ({ row }) => {
        const r = row.original
        return (
          <span
            className="text-xs font-bold block text-right"
            style={{ color: r.estado === "completado" ? CHARCOAL : "#dc2626" }}
          >
            ${r.saldo.toLocaleString()}
          </span>
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
        return (
          <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold", ESTADO_BADGE[est])}>
            <span className="size-1.5 rounded-full bg-current" />
            {ESTADO_LABEL[est]}
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all hover:opacity-90 active:scale-95 whitespace-nowrap"
            style={{ color: ACCENT, backgroundColor: `${ACCENT}12` }}
          >
            Ver detalle
            <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
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
          className="rounded-2xl border bg-white overflow-hidden"
          style={{ borderColor: BORDER }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left [&_td]:border [&_th]:border [&_td]:border-[oklch(0.85_0_0)] [&_th]:border-[oklch(0.85_0_0)]">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} style={{ backgroundColor: "oklch(0.97 0 0)" }}>
                    {hg.headers.map((header) => {
                      const canSort = header.column.getCanSort()
                      const sorted = header.column.getIsSorted()
                      const alignRight = header.id === "total" || header.id === "saldo"
                      return (
                        <th
                          key={header.id}
                          onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                          className={cn(
                            "px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-40",
                            canSort && "cursor-pointer hover:opacity-70 select-none"
                          )}
                          style={{ color: CHARCOAL, textAlign: alignRight ? "right" : "left" }}
                        >
                          <div className={cn("flex items-center gap-1", alignRight && "justify-end")}>
                            <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                            {canSort && (
                              <span className="inline-flex flex-col leading-none">
                                <HugeiconsIcon icon={ArrowUp01Icon} size={9} className={sorted === "asc" ? "" : "opacity-40"} />
                                <HugeiconsIcon icon={ArrowDown01Icon} size={9} className={sorted === "desc" ? "" : "opacity-40"} />
                              </span>
                            )}
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y" style={{ borderColor: BORDER }}>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-gray-50"
                    style={{ backgroundColor: row.index % 2 === 0 ? "transparent" : "oklch(0.97 0 0 / 0.5)" }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={cn(
                          "px-3",
                          dense ? "py-1.5" : "py-3",
                          (cell.column.id === "total" || cell.column.id === "saldo") && "text-right"
                        )}
                        style={{ color: CHARCOAL }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t" style={{ borderColor: BORDER }}>
            <PaginationControls table={table} pageSizes={[10, 25, 50]} />
          </div>
        </motion.div>
        )}
    </div>
  )
}
