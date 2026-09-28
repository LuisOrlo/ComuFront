import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Edit01Icon,
  Delete01Icon,
  ViewIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  CalendarIcon,
  VideoIcon,
  TaskEdit01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Clock04Icon,
  RefreshIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { cn, parseLocalDate } from "@/lib/utils"
import { tareasService, type TareaStaff } from "@/services/tareas.service"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

interface Column {
  key: string
  label: string
  sortable?: boolean
}

const COLUMNS: Column[] = [
  { key: "titulo", label: "Tarea", sortable: true },
  { key: "persona", label: "Asignado a" },
  { key: "fecha_inicio", label: "Fecha Inicio", sortable: true },
  { key: "fecha_fin", label: "Fecha Límite", sortable: true },
  { key: "estado", label: "Estado", sortable: true },
  { key: "acciones", label: "Acciones" },
]

interface EstadoConfig {
  label: string
  bg: string
  text: string
  border: string
  dot: string
  icon: typeof Clock04Icon
}

const ESTADOS_CONFIG: Record<string, EstadoConfig> = {
  pendiente: {
    label: "Pendiente",
    bg: "bg-amber-50 hover:bg-amber-100/70",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
    icon: Clock04Icon,
  },
  en_progreso: {
    label: "En progreso",
    bg: "bg-blue-50 hover:bg-blue-100/70",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
    icon: RefreshIcon,
  },
  completada: {
    label: "Completada",
    bg: "bg-emerald-50 hover:bg-emerald-100/70",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    icon: CheckmarkCircle02Icon,
  },
  cancelada: {
    label: "Cancelada",
    bg: "bg-rose-50 hover:bg-rose-100/70",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
    icon: Cancel01Icon,
  },
}

const ESTADOS_LIST = ["pendiente", "en_progreso", "completada", "cancelada"]

interface TareaTableProps {
  tareas: TareaStaff[]
  loading: boolean
  sortField: string
  sortDir: string
  onSort: (field: string) => void
  onEdit: (tarea: TareaStaff) => void
  onDelete: (id: string) => void
  currentPage: number
  lastPage: number
  onPageChange: (page: number) => void
  onTareaUpdate: () => void
}

function SortIcon({ field, sortField, sortDir }: { field: string; sortField: string; sortDir: string }) {
  if (field !== sortField) return null
  return (
    <HugeiconsIcon
      icon={sortDir === "asc" ? ArrowUp01Icon : ArrowDown01Icon}
      size={13}
      className="inline ml-1 text-[#fd761a]"
    />
  )
}

function StatusBadge({
  estado,
  tareaId,
  onTareaUpdate,
}: {
  estado: string
  tareaId: string
  onTareaUpdate: () => void
}) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    return () => { setOpen(false) }
  }, [])

  async function handleChange(nuevoEstado: string) {
    try {
      await tareasService.cambiarEstado(tareaId, nuevoEstado)
      toast.success("Estado actualizado")
      setOpen(false)
      onTareaUpdate()
    } catch {
      toast.error("Error al cambiar estado")
    }
  }

  const conf = ESTADOS_CONFIG[estado] || {
    label: estado,
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-400",
    icon: Clock04Icon,
  }

  return (
    <div className="relative inline-flex">
      <button
        ref={btnRef}
        type="button"
        onClick={() => {
          if (open) {
            setOpen(false)
            return
          }
          const rect = btnRef.current!.getBoundingClientRect()
          setMenuPos({ top: rect.bottom + 6, left: rect.left })
          setOpen(true)
        }}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold cursor-pointer border transition-all shadow-2xs active:scale-95",
          conf.bg,
          conf.text,
          conf.border
        )}
        title="Clic para cambiar estado"
      >
        <span className={cn("size-1.5 rounded-full shrink-0", conf.dot)} />
        {conf.label}
        <svg width="8" height="5" viewBox="0 0 8 5" fill="none" className="shrink-0 opacity-60">
          <path d="M1 1l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div
              className="fixed z-50 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 min-w-[160px] animate-in fade-in zoom-in-95 duration-100"
              style={{ top: menuPos.top, left: menuPos.left }}
            >
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                Cambiar estado
              </div>
              {ESTADOS_LIST.filter((e) => e !== estado).map((e) => {
                const itemConf = ESTADOS_CONFIG[e]
                return (
                  <button
                    key={e}
                    type="button"
                    onClick={() => handleChange(e)}
                    className="w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-slate-50 flex items-center gap-2 transition-colors"
                  >
                    <span className={cn("size-2 rounded-full", itemConf.dot)} />
                    <span className={itemConf.text}>{itemConf.label}</span>
                  </button>
                )
              })}
            </div>
          </>,
          document.body
        )}
    </div>
  )
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—"
  const d = dateStr.includes("T") ? new Date(dateStr) : parseLocalDate(dateStr)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
}

function isOverdue(dateStr?: string, estado?: string) {
  if (!dateStr || estado === "completada" || estado === "cancelada") return false
  const d = dateStr.includes("T") ? new Date(dateStr) : parseLocalDate(dateStr)
  if (isNaN(d.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return d < today
}

export function TareaTable({
  tareas,
  loading,
  sortField,
  sortDir,
  onSort,
  onEdit,
  onDelete,
  currentPage,
  lastPage,
  onPageChange,
  onTareaUpdate,
}: TareaTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <Skeleton className="h-6 w-36 rounded-lg" />
          <Skeleton className="h-6 w-20 rounded-lg" />
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0">
            <Skeleton className="size-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  if (tareas.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#fd761a] mx-auto mb-4">
          <HugeiconsIcon icon={TaskEdit01Icon} size={28} />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">
          No se encontraron tareas
        </h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          No hay tareas que coincidan con los filtros aplicados o aún no se han registrado tareas para el staff.
        </p>
      </div>
    )
  }

  // Generar páginas para paginación
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    if (lastPage <= 5) {
      for (let i = 1; i <= lastPage; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push("...")
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(lastPage - 1, currentPage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (currentPage < lastPage - 2) pages.push("...")
      pages.push(lastPage)
    }
    return pages
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3.5 transition-colors",
                    col.sortable ? "cursor-pointer select-none hover:bg-slate-100/70 hover:text-slate-800" : "",
                    col.key === "acciones" ? "text-right" : ""
                  )}
                  onClick={() => col.sortable && onSort(col.key)}
                >
                  <div className={cn("flex items-center gap-1", col.key === "acciones" ? "justify-end" : "")}>
                    <span>{col.label}</span>
                    {col.sortable && <SortIcon field={col.key} sortField={sortField} sortDir={sortDir} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {tareas.map((t) => {
              const overdue = isOverdue(t.fecha_fin, t.estado)

              return (
                <tr
                  key={t.id}
                  className="hover:bg-slate-50/60 transition-colors group"
                >
                  {/* Columna Título & Descripción */}
                  <td className="px-4 py-3.5 max-w-[280px] sm:max-w-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 group-hover:text-[#fd761a] transition-colors break-words">
                          {t.titulo}
                        </span>
                        {t.origen === "edicion_video" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/70 shrink-0">
                            <HugeiconsIcon icon={VideoIcon} size={11} />
                            Edición de Video
                          </span>
                        )}
                      </div>
                      {t.descripcion && (
                        <p className="text-xs text-slate-500 line-clamp-2 break-words">
                          {t.descripcion}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Columna Asignado a */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {t.persona ? (
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full bg-gradient-to-tr from-orange-400 to-[#fd761a] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                          {(t.persona.nombres?.charAt(0) || "") + (t.persona.apellidos?.charAt(0) || "")}
                        </div>
                        <div className="leading-tight">
                          <p className="font-medium text-slate-800 text-xs sm:text-sm">
                            {t.persona.nombres} {t.persona.apellidos}
                          </p>
                          <span className="text-[11px] text-slate-400">
                            {t.persona.tipo || "Staff"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-500">
                        Sin asignar
                      </span>
                    )}
                  </td>

                  {/* Columna Fecha Inicio */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <HugeiconsIcon icon={CalendarIcon} size={14} className="text-slate-400 shrink-0" />
                      <span>{formatDate(t.fecha_inicio)}</span>
                    </div>
                  </td>

                  {/* Columna Fecha Fin / Límite */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                    <div className="flex items-center gap-1.5">
                      <HugeiconsIcon
                        icon={CalendarIcon}
                        size={14}
                        className={cn("shrink-0", overdue ? "text-rose-500" : "text-slate-400")}
                      />
                      <span className={cn(overdue ? "text-rose-600 font-semibold" : "text-slate-600")}>
                        {formatDate(t.fecha_fin)}
                      </span>
                      {overdue && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Vencida
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Columna Estado */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {t.origen === "edicion_video" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        <span className="size-1.5 rounded-full bg-blue-500" />
                        {ESTADOS_CONFIG[t.estado]?.label || t.estado}
                      </span>
                    ) : (
                      <StatusBadge estado={t.estado} tareaId={t.id} onTareaUpdate={onTareaUpdate} />
                    )}
                  </td>

                  {/* Columna Acciones */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-right">
                    {t.origen === "edicion_video" ? (
                      <div className="flex items-center justify-end gap-1">
                        {t.trabajo_id ? (
                          <>
                            <Link
                              to={`/servicios/edicion-video/${t.trabajo_id}/editar`}
                              className="size-8 rounded-lg flex items-center justify-center text-purple-600 hover:bg-purple-50 transition-colors"
                              title="Editar trabajo en módulo Edición de Video"
                            >
                              <HugeiconsIcon icon={Edit01Icon} size={15} />
                            </Link>
                            <Link
                              to={`/servicios/edicion-video/${t.trabajo_id}`}
                              className="size-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                              title="Ver detalle del trabajo en Edición de Video"
                            >
                              <HugeiconsIcon icon={ViewIcon} size={15} />
                            </Link>
                          </>
                        ) : (
                          <Link
                            to="/servicios/edicion-video"
                            className="size-8 rounded-lg flex items-center justify-center text-purple-600 hover:bg-purple-50 transition-colors"
                            title="Ir a módulo Edición de Video"
                          >
                            <HugeiconsIcon icon={ViewIcon} size={15} />
                          </Link>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(t)}
                          className="size-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-[#fd761a] hover:bg-orange-50 transition-colors"
                          title="Editar tarea"
                        >
                          <HugeiconsIcon icon={Edit01Icon} size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(t.id)}
                          className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Eliminar tarea"
                        >
                          <HugeiconsIcon icon={Delete01Icon} size={15} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación Integrada */}
      {lastPage > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <p className="text-xs font-medium text-slate-500">
            Página <span className="font-semibold text-slate-700">{currentPage}</span> de{" "}
            <span className="font-semibold text-slate-700">{lastPage}</span>
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
              Anterior
            </button>

            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, idx) =>
                typeof page === "number" ? (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onPageChange(page)}
                    className={cn(
                      "size-8 rounded-lg text-xs font-semibold transition-all",
                      currentPage === page
                        ? "bg-[#fd761a] text-white shadow-xs"
                        : "text-slate-600 bg-white border border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {page}
                  </button>
                ) : (
                  <span key={idx} className="px-1 text-xs text-slate-400">
                    {page}
                  </span>
                )
              )}
            </div>

            <button
              type="button"
              disabled={currentPage >= lastPage}
              onClick={() => onPageChange(currentPage + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Siguiente
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
