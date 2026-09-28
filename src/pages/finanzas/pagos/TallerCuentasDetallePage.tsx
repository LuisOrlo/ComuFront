/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, Fragment } from "react"
import { usePermission } from "@/hooks/usePermission"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  UserIcon,
  Calendar02Icon,
  Money02Icon,
  Download01Icon,
  CheckmarkCircle04Icon,
  MapsLocation01Icon,
  SchoolIcon,
  Search01Icon,
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
import { cn } from "@/lib/utils"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { useParams, useNavigate } from "react-router"
import { generarCuentaTallerPDF } from "@/lib/generarPagosCuentaPDF"
import { PaginationControls } from "@/components/table/PaginationControls"
import { Skeleton } from "@/components/ui/skeleton"

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
        toast.error("Error al cargar los datos financieros del taller")
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

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
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
        header: "Participante",
        enableSorting: true,
        cell: ({ row }) => {
          const nombre = getNombre(row.original)
          return (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-full bg-orange-100 text-[#fd761a] flex items-center justify-center shrink-0 text-xs font-bold shadow-2xs">
                {getInitials(nombre)}
              </div>
              <span className="font-semibold text-slate-900 truncate max-w-[200px]" title={nombre}>
                {nombre}
              </span>
            </div>
          );
        },
      },
      {
        id: "cedula",
        accessorFn: (p: any) => String(p.cedula || ""),
        header: "Cédula",
        enableSorting: false,
        cell: ({ row }) => <span className="text-slate-600">{getCedula(row.original)}</span>,
      },
      {
        id: "telefono",
        accessorFn: (p: any) => String(p.telefono || ""),
        header: "Teléfono",
        enableSorting: false,
        cell: ({ row }) => <span className="text-slate-600">{getTelefono(row.original)}</span>,
      },
      {
        id: "abonado",
        accessorFn: (p: any) => Number(p.monto_abonado || 0),
        header: "Abonado",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="font-bold text-emerald-600">
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
            <span className={cn("font-bold", saldoM > 0 ? "text-rose-600" : "text-emerald-600")}>
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
            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
              {pagadoCompleto ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <HugeiconsIcon icon={CheckmarkCircle04Icon} size={12} />
                  Pagado
                </span>
              ) : isAdmin ? (
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/finanzas/pagos/cuentas/talleres/${id}/participante/${participanteId}`)
                  }
                  className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-semibold text-white bg-[#fd761a] hover:bg-[#e06513] shadow-2xs transition-all active:scale-[0.98]"
                >
                  <HugeiconsIcon icon={CheckmarkCircle04Icon} size={13} />
                  Registrar cobro
                </button>
              ) : null}
              {p.motivo_ajuste && (
                <button
                  type="button"
                  onClick={() => setExpandedParticipant(isExpanded ? null : participanteId)}
                  className={cn(
                    "size-7 rounded-lg flex items-center justify-center text-xs font-bold border transition-colors",
                    isExpanded
                      ? "bg-slate-200 text-slate-800 border-slate-300"
                      : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                  )}
                  title={isExpanded ? "Ocultar ajuste" : "Ver ajuste"}
                >
                  {isExpanded ? "▲" : "▼"}
                </button>
              )}
            </div>
          )
        },
      },
    ],
    [isAdmin, navigate, id, expandedParticipant]
  )

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
      toast.success("PDF exportado correctamente")
    } catch {
      toast.error("Error al exportar el PDF")
    } finally {
      setExportando(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        <Skeleton className="h-8 w-36 rounded-xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h3 className="text-base font-bold text-slate-800">Taller no encontrado</h3>
        <p className="text-xs text-slate-500 mt-1">No se encontró información financiera para este taller.</p>
      </div>
    )
  }

  const pctRecaudado =
    (totales.esperado || 0) > 0 ? ((totales.recaudado || 0) / totales.esperado) * 100 : 0
  const totalSaldo = Math.max(0, (totales.esperado || 0) - (totales.recaudado || 0))

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
      {/* Botón Volver */}
      <div>
        <button
          type="button"
          onClick={() => navigate("/finanzas/pagos/cuentas/talleres")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white shadow-2xs transition-all active:scale-[0.98]"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={15} />
          <span>Volver a Talleres</span>
        </button>
      </div>

      {/* Tarjeta de Encabezado del Taller */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#fd761a] shrink-0 shadow-2xs">
              <HugeiconsIcon icon={SchoolIcon} size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                {taller.nombre || "Taller"}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>{totales.inscritos || 0} participante{totales.inscritos !== 1 ? "s" : ""}</span>
                <span>•</span>
                <span>Capacidad: {taller.capacidad || "Ilimitada"}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportPDF}
            disabled={exportando}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-semibold text-[#fd761a] bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <HugeiconsIcon icon={Download01Icon} size={15} />
            <span>{exportando ? "Exportando..." : "Exportar PDF"}</span>
          </button>
        </div>

        {/* Metadatos en Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-100 text-xs">
          <InfoItem icon={UserIcon} label="Instructor" value={taller.instructor_nombre || taller.instructor || "—"} />
          <InfoItem
            icon={Calendar02Icon}
            label="Fecha"
            value={taller.fecha ? new Date(taller.fecha).toLocaleDateString("es-ES") : "—"}
          />
          <InfoItem icon={Money02Icon} label="Precio Taller" value={`$${Number(taller.precio || 0).toLocaleString()}`} />
          <InfoItem icon={MapsLocation01Icon} label="Modalidad" value={taller.modalidad || "—"} />
          <InfoItem icon={UserIcon} label="Inscritos" value={`${totales.inscritos || 0} / ${taller.capacidad || "∞"}`} />
        </div>

        {/* Progreso de Recaudación */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-semibold">Recaudación Total del Taller</span>
            <div className="flex items-center gap-3">
              <span className="text-emerald-700 font-bold">Cobrado: ${(totales.recaudado || 0).toLocaleString()}</span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-800 font-bold">Total: ${(totales.esperado || 0).toLocaleString()}</span>
              {totalSaldo > 0 && (
                <>
                  <span className="text-slate-400">/</span>
                  <span className="text-rose-600 font-bold">Saldo: ${totalSaldo.toLocaleString()}</span>
                </>
              )}
              <span className="font-extrabold text-[#fd761a]">({Math.round(pctRecaudado)}%)</span>
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                pctRecaudado >= 80 ? "bg-emerald-500" : pctRecaudado >= 40 ? "bg-amber-500" : "bg-[#fd761a]"
              )}
              style={{ width: `${Math.min(pctRecaudado, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabla de Participantes */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {/* Controles de la Tabla */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
          <h3 className="text-sm font-bold text-slate-900">
            Lista de Participantes ({filtered.length})
          </h3>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filtros de pago */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200/60">
              {[
                { key: "todos", label: "Todos" },
                { key: "con_saldo", label: "Con saldo" },
                { key: "pagado", label: "Pagado" },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFiltroPago(f.key)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-semibold transition-all",
                    filtroPago === f.key
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Búsqueda */}
            <div className="relative">
              <HugeiconsIcon
                icon={Search01Icon}
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Buscar participante..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-44 sm:w-52 h-8 pl-8 pr-7 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:bg-white focus:border-[#fd761a] transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {hg.headers.map((header) => {
                    const isAcciones = header.id === "acciones"
                    return (
                      <th
                        key={header.id}
                        className={cn(
                          "px-4 py-3",
                          isAcciones ? "text-right" : "text-left"
                        )}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    No se encontraron participantes con los filtros actuales.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => {
                  const p = row.original
                  const isExpanded = expandedParticipant === (p.id || p.participante_id)

                  return (
                    <Fragment key={row.id}>
                      <tr className="hover:bg-slate-50/60 transition-colors">
                        {row.getVisibleCells().map((cell) => {
                          const isAcciones = cell.column.id === "acciones"
                          return (
                            <td
                              key={cell.id}
                              className={cn(
                                "px-4 py-3",
                                isAcciones ? "text-right" : "text-left"
                              )}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          )
                        })}
                      </tr>

                      {isExpanded && p.motivo_ajuste && (
                        <tr className="bg-orange-50/30">
                          <td colSpan={7} className="px-6 py-2.5 border-t border-slate-100">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-bold text-slate-800">Ajuste / Descuento:</span>
                              <span className="text-slate-700 italic">"{p.motivo_ajuste}"</span>
                              {p.monto_original && (
                                <span className="text-slate-400">
                                  (Original: ${Number(p.monto_original).toLocaleString()} → Cobrado: ${Number(p.monto_ajustado || p.monto_total || 0).toLocaleString()})
                                </span>
                              )}
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

        {/* Footer con Paginación Integrada */}
        <div className="px-4 py-3 border-t border-slate-100 bg-white">
          <PaginationControls table={table} pageSizes={[10, 25, 50]} />
        </div>
      </div>
    </div>
  )
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="size-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
        <HugeiconsIcon icon={Icon} size={14} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-xs font-semibold text-slate-800 truncate">{value}</p>
      </div>
    </div>
  )
}
