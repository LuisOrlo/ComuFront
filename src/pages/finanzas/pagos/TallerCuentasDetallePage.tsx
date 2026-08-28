/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, Fragment } from "react"
import { usePermission } from "@/hooks/usePermission"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  UserIcon,
  Calendar02Icon,
  Money02Icon,
  Download01Icon,
  CheckmarkCircle04Icon,
  MapsLocation01Icon,
  GroupIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  Cancel01Icon,
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
import { useParams, useNavigate } from "react-router"
import { generarCuentaTallerPDF } from "@/lib/generarPagosCuentaPDF"
import { PaginationControls } from "@/components/table/PaginationControls"
import { HealthBar } from "./sections/HealthBar"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

function getNombre(p: any) {
  return p.estudiante_nombre || `${p.nombres || ""} ${p.apellidos || ""}`.trim() || "—"
}

function getCedula(p: any) {
  return p.cedula || "—"
}

function getTelefono(p: any) {
  return p.telefono || "—"
}

function getInitials(nombre: string) {
  const parts = nombre.split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] || "?"
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : ""
  return (first + last).toUpperCase()
}

export function TallerCuentasDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAdmin } = usePermission()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [exportando, setExportando] = useState(false)
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [filtroPago, setFiltroPago] = useState("todos")
  const [sorting, setSorting] = useState<SortingState>([{ id: "saldo", desc: true }])
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

  useEffect(() => {
    const load = async () => {
      if (!id) return
      try {
        const res = await financeService.getTallerFinanciero(id)
        setData(res.datos || res.data || res)
      } catch {
        toast.error("Error al cargar datos financieros del taller")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }, [search, filtroPago])

  const taller: any = useMemo(() => data?.taller || data || {}, [data])
  const participantes: any[] = useMemo(() => data?.participantes || [], [data])
  const totales: any = useMemo(() => data?.totales || {}, [data])

  const filtered = useMemo(() => {
    let list = participantes
    if (filtroPago === "con_saldo") list = list.filter((p: any) => Number(p.saldo_pendiente || 0) > 0)
    if (filtroPago === "pagado") list = list.filter((p: any) => Number(p.saldo_pendiente || 0) <= 0)
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter((p: any) => {
        const nombre = getNombre(p).toLowerCase()
        const cedula = String(p.cedula || "").toLowerCase()
        return nombre.includes(q) || cedula.includes(q)
      })
    }
    return list
  }, [participantes, search, filtroPago])

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      id: "index",
      header: "#",
      enableSorting: false,
      cell: ({ row, table }) => {
        const pageIndex = table.getState().pagination.pageIndex
        const pageSize = table.getState().pagination.pageSize
        return pageIndex * pageSize + row.index + 1
      },
    },
    {
      id: "nombre",
      accessorFn: (p: any) => getNombre(p).toLowerCase(),
      header: "Nombre",
      enableSorting: true,
      cell: ({ row }) => {
        const nombre = getNombre(row.original)
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="size-9 rounded-full flex items-center justify-center shrink-0 text-[11px] font-black"
              style={{ backgroundColor: "oklch(0.95 0.01 45)", color: ACCENT }}
            >
              {getInitials(nombre)}
            </div>
            <span className="text-xs font-bold truncate max-w-[200px]" style={{ color: CHARCOAL }}>{nombre}</span>
          </div>
        )
      },
    },
    {
      id: "cedula",
      accessorFn: (p: any) => String(p.cedula || ""),
      header: "Cédula",
      enableSorting: false,
      cell: ({ row }) => <span className="text-xs opacity-60" style={{ color: CHARCOAL }}>{getCedula(row.original)}</span>,
    },
    {
      id: "telefono",
      accessorFn: (p: any) => String(p.telefono || ""),
      header: "Teléfono",
      enableSorting: false,
      cell: ({ row }) => <span className="text-xs opacity-60" style={{ color: CHARCOAL }}>{getTelefono(row.original)}</span>,
    },
    {
      id: "abonado",
      accessorFn: (p: any) => Number(p.monto_abonado || 0),
      header: "Abonado",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-xs font-bold text-green-600">
          ${Number(row.original.monto_abonado || 0).toLocaleString()}
        </span>
      ),
    },
    {
      id: "saldo",
      accessorFn: (p: any) => Number(p.saldo_pendiente || 0),
      header: "Saldo",
      enableSorting: true,
      cell: ({ row }) => {
        const saldoM = Number(row.original.saldo_pendiente || 0)
        return (
          <span className={cn("text-xs font-bold", saldoM > 0 ? "text-red-600" : "text-green-600")}>
            ${saldoM.toLocaleString()}
          </span>
        )
      },
    },
    {
      id: "acciones",
      header: "Acciones",
      enableSorting: false,
      cell: ({ row }) => {
        const p = row.original
        const pagadoCompleto = Number(p.saldo_pendiente || 0) <= 0
        const participanteId = p.id || p.participante_id
        const isExpanded = expandedParticipant === participanteId
        return (
          <div className="flex items-center gap-1">
            {pagadoCompleto ? (
              <span className="inline-flex gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-green-100 text-green-700 whitespace-nowrap">
                <HugeiconsIcon icon={CheckmarkCircle04Icon} size={12} />
                Pagado
              </span>
            ) : isAdmin ? (
              <button
                onClick={() => navigate(`/finanzas/pagos/cuentas/talleres/${id}/participante/${participanteId}`)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all hover:opacity-90 active:scale-95 whitespace-nowrap"
                style={{ backgroundColor: ACCENT }}
              >
                <HugeiconsIcon icon={CheckmarkCircle04Icon} size={12} />
                Registrar cobro
              </button>
            ) : null}
            {p.motivo_ajuste && (
              <button
                onClick={() => setExpandedParticipant(isExpanded ? null : participanteId)}
                className="size-6 rounded flex items-center justify-center text-[10px] font-bold hover:bg-gray-100 transition-colors"
                style={{ color: MUTED }}
                title="Ver ajustes"
              >
                {isExpanded ? "▲" : "▼"}
              </button>
            )}
          </div>
        )
      },
    },
  ], [isAdmin, navigate, id, expandedParticipant])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getRowId: (row) => String(row.id || row.participante_id || row.nombres || row.names),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const handleExportPDF = () => {
    setExportando(true)
    try {
      generarCuentaTallerPDF(data)
      toast.success("PDF exportado")
    } catch { toast.error("Error al exportar PDF") }
    finally { setExportando(false) }
  }

  if (loading) {
    return (
      <div className="px-8 py-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-sm font-medium opacity-40" style={{ color: CHARCOAL }}>
            Cargando datos del taller...
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="px-8 py-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-sm font-medium opacity-40" style={{ color: CHARCOAL }}>
            Taller no encontrado
          </div>
        </div>
      </div>
    )
  }

  const pctRecaudado = (totales.esperado || 0) > 0 ? ((totales.recaudado || 0) / totales.esperado) * 100 : 0
  const pctColor = pctRecaudado >= 80 ? "oklch(0.55 0.15 150)" : pctRecaudado >= 50 ? "oklch(0.65 0.15 75)" : "oklch(0.5 0.15 20)"

  return (
    <div className="px-8 py-6">

      <button
        onClick={() => navigate("/finanzas/pagos/cuentas/talleres")}
        className="flex items-center gap-2 text-sm font-bold opacity-40 hover:opacity-100 transition-all mb-4"
        style={{ color: CHARCOAL }}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        Volver a Talleres
      </button>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div
          className="rounded-2xl border bg-white p-6"
          style={{ borderColor: BORDER }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black" style={{ color: CHARCOAL }}>
              {taller.nombre || "Taller"}
            </h2>
            <button
              onClick={handleExportPDF}
              disabled={exportando}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              style={{ color: ACCENT, backgroundColor: `${ACCENT}15` }}
            >
              <HugeiconsIcon icon={Download01Icon} size={14} />
              {exportando ? "Exportando..." : "Exportar PDF"}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <InfoBadge icon={UserIcon} label="Instructor" value={taller.instructor_nombre || taller.instructor || "—"} />
            <InfoBadge icon={Calendar02Icon} label="Fecha" value={taller.fecha ? new Date(taller.fecha).toLocaleDateString("es-ES") : "—"} />
            <InfoBadge icon={Money02Icon} label="Precio" value={`$${Number(taller.precio || 0).toLocaleString()}`} />
            <InfoBadge icon={MapsLocation01Icon} label="Modalidad" value={taller.modalidad || "—"} />
            <InfoBadge icon={GroupIcon} label="Inscritos" value={`${totales.inscritos || 0} / ${taller.capacidad || "∞"}`} />
          </div>
        </div>

        <div
          className="rounded-2xl border bg-white overflow-hidden"
          style={{ borderColor: BORDER }}
        >
          <div className="p-6 border-b" style={{ borderColor: BORDER }}>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-black" style={{ color: CHARCOAL }}>
                  Participantes
                </h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold"
                    style={{ color: ACCENT, backgroundColor: `${ACCENT}12` }}
                  >
                    <HugeiconsIcon icon={GroupIcon} size={12} />
                    {totales.inscritos || 0} de {taller.capacidad || "∞"} inscritos
                  </span>
                  {taller.capacidad && Number(taller.capacidad) > 0 && (
                    <span className="text-[10px] opacity-40" style={{ color: CHARCOAL }}>
                      quedan {Math.max(0, Number(taller.capacidad) - (totales.inscritos || 0))} cupos
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>
                  Recaudado del taller
                </p>
                <div className="flex items-center justify-end gap-2 mt-0.5">
                  <p className="text-xs font-black" style={{ color: CHARCOAL }}>
                    ${(totales.recaudado || 0).toLocaleString()}
                    <span className="opacity-40 font-medium"> de ${(totales.esperado || 0).toLocaleString()}</span>
                  </p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: pctColor, backgroundColor: `${pctColor}1a` }}>
                    {Math.round(pctRecaudado)}%
                  </span>
                </div>
              </div>
            </div>
            <HealthBar recaudado={Number(totales.recaudado || 0)} total={Number(totales.esperado || 0)} />
          </div>

          <div className="px-6 py-3 border-b flex flex-wrap items-center gap-3" style={{ borderColor: BORDER }}>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre o cédula..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-56 pl-3 pr-8 py-2 rounded-xl border text-xs font-medium outline-none transition-all focus:w-64"
                style={{ borderColor: BORDER, color: CHARCOAL }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={14} style={{ color: MUTED }} />
                </button>
              )}
            </div>
            <select
              value={filtroPago}
              onChange={e => setFiltroPago(e.target.value)}
              className="px-3 py-2 rounded-xl border text-xs font-medium outline-none bg-white"
              style={{ borderColor: BORDER, color: CHARCOAL }}
            >
              <option value="todos">Todos</option>
              <option value="con_saldo">Con saldo</option>
              <option value="pagado">Pagado completo</option>
            </select>
            <span className="text-[10px] opacity-40 ml-auto" style={{ color: CHARCOAL }}>
              {filtered.length} participante{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[700px] [&_td]:border [&_th]:border [&_td]:border-[oklch(0.85_0_0)] [&_th]:border-[oklch(0.85_0_0)]">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} style={{ backgroundColor: "oklch(0.97 0 0)" }}>
                    {hg.headers.map((header) => {
                      const canSort = header.column.getCanSort()
                      const sorted = header.column.getIsSorted()
                      const stickyIndex = header.id === "index"
                      const stickyNombre = header.id === "nombre"
                      const alignRight = header.id === "abonado" || header.id === "saldo"
                      return (
                        <th
                          key={header.id}
                          onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                          className={cn(
                            "px-3 py-3 text-[10px] font-black uppercase tracking-widest opacity-40",
                            canSort && "cursor-pointer hover:opacity-70 select-none",
                            stickyIndex && "sticky left-0 z-10 w-[36px] min-w-[36px] text-center px-2",
                            stickyNombre && "sticky z-10"
                          )}
                          style={{
                            color: CHARCOAL,
                            backgroundColor: "oklch(0.97 0 0)",
                            ...(stickyIndex ? { left: 0 } : {}),
                            ...(stickyNombre ? { left: 36 } : {}),
                          }}
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
                {participantes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center opacity-40 text-sm" style={{ color: CHARCOAL }}>
                      No hay participantes registrados
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center opacity-40 text-sm" style={{ color: CHARCOAL }}>
                      No se encontraron participantes
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => {
                    const p = row.original
                    const isExpanded = expandedParticipant === (p.id || p.participante_id)
                    return (
                      <Fragment key={row.id}>
                        <tr
                          className="transition-colors"
                          style={{ backgroundColor: row.index % 2 === 0 ? "transparent" : "oklch(0.97 0 0 / 0.5)" }}
                        >
                          {row.getVisibleCells().map((cell) => {
                            const stickyIndex = cell.column.id === "index"
                            const stickyNombre = cell.column.id === "nombre"
                            const alignRight = cell.column.id === "abonado" || cell.column.id === "saldo"
                            return (
                              <td
                                key={cell.id}
                                className={cn(
                                  "px-3 py-3",
                                  stickyIndex && "sticky left-0 z-10 w-[36px] min-w-[36px] text-center px-2",
                                  stickyNombre && "sticky z-10",
                                  alignRight && "text-right"
                                )}
                                style={{
                                  color: CHARCOAL,
                                  ...((stickyIndex || stickyNombre) ? {
                                    backgroundColor: row.index % 2 === 0 ? "#fff" : "oklch(0.97 0 0 / 0.5)",
                                    left: stickyIndex ? 0 : 36,
                                  } : {}),
                                }}
                              >
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            )
                          })}
                        </tr>
                        {isExpanded && p.motivo_ajuste && (
                          <tr style={{ backgroundColor: "oklch(0.64 0.2 150 / 0.06)" }}>
                            <td colSpan={7} className="px-5 py-3">
                              <div className="flex items-center gap-2 text-[11px]" style={{ color: CHARCOAL }}>
                                <span className="font-bold">Ajuste:</span>
                                {Number(p.precio_taller || 0) > 0 && Number(p.precio_taller) !== Number(p.monto_total || 0) && (
                                  <span className="line-through opacity-40">${Number(p.precio_taller).toLocaleString()}</span>
                                )}
                                <span className="text-green-700 font-bold">→ ${Number(p.monto_total || taller.precio || 0).toLocaleString()}</span>
                                <span className="opacity-50 italic">— {p.motivo_ajuste}</span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="px-4 py-3 border-t" style={{ borderColor: BORDER }}>
              <PaginationControls table={table} pageSizes={[10, 25, 50]} />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function InfoBadge({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2" style={{ color: CHARCOAL }}>
      <HugeiconsIcon icon={Icon} size={14} style={{ color: MUTED }} />
      <div>
        <p className="text-[9px] font-bold uppercase opacity-40">{label}</p>
        <p className="text-xs font-bold">{value}</p>
      </div>
    </div>
  )
}
