import { useState, useRef } from "react"
import { createPortal } from "react-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { Edit01Icon, Delete01Icon, ArrowUp01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { tareasService, type TareaStaff } from "@/services/tareas.service"
import { toast } from "sonner"

const ESTADO_COLORS: Record<string, string> = {
  pendiente: "oklch(0.55 0.01 0)",
  en_progreso: "oklch(0.55 0.14 250)",
  completada: "oklch(0.55 0.14 145)",
  cancelada: "oklch(0.42 0.04 20)",
}

const ESTADO_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completada: "Completada",
  cancelada: "Cancelada",
}

const ESTADOS = ["pendiente", "en_progreso", "completada", "cancelada"]

interface Column {
  key: string
  label: string
  sortable?: boolean
}

const COLUMNS: Column[] = [
  { key: "titulo", label: "Título", sortable: true },
  { key: "persona", label: "Asignado a" },
  { key: "fecha_inicio", label: "Inicio", sortable: true },
  { key: "fecha_fin", label: "Fin", sortable: true },
  { key: "estado", label: "Estado", sortable: true },
  { key: "acciones", label: "" },
]

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
      size={12}
      className="inline ml-1"
    />
  )
}

function StatusBadge({ estado, tareaId, onTareaUpdate }: { estado: string; tareaId: string; onTareaUpdate: () => void }) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

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

  const color = ESTADO_COLORS[estado] || COLORS.TEXT_MUTED

  return (
    <div className="relative inline-flex">
      <button ref={btnRef}
        onClick={() => {
          if (open) { setOpen(false); return }
          const rect = btnRef.current!.getBoundingClientRect()
          setMenuPos({ top: rect.bottom + 4, left: rect.left })
          setOpen(true)
        }}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-all hover:opacity-80"
        style={{
          backgroundColor: `${color}18`,
          color,
          border: `1px solid ${color}30`,
        }}
      >
        {ESTADO_LABELS[estado] || estado}
        <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
          <path d="M1 1l3 3 3-3" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed z-50 bg-white rounded-lg border shadow-lg py-1 min-w-[140px]"
            style={{ top: menuPos.top, left: menuPos.left, borderColor: COLORS.BORDER_SUBTLE }}>
            {ESTADOS.filter((e) => e !== estado).map((e) => (
              <button key={e}
                onClick={() => handleChange(e)}
                className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-gray-50 transition-colors"
                style={{ color: ESTADO_COLORS[e] }}>
                {ESTADO_LABELS[e]}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—"
  const d = dateStr.includes("T") ? new Date(dateStr) : new Date(dateStr + "T12:00:00")
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
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
      <div className="bg-white rounded-xl border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="p-8 text-center text-sm" style={{ color: COLORS.TEXT_MUTED }}>
          Cargando tareas...
        </div>
      </div>
    )
  }

  if (tareas.length === 0) {
    return (
      <div className="bg-white rounded-xl border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="p-10 text-center">
          <p className="text-sm font-medium" style={{ color: COLORS.CHARCOAL }}>No se encontraron tareas</p>
          <p className="text-xs mt-1" style={{ color: COLORS.TEXT_MUTED }}>Crea una nueva tarea para comenzar</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "oklch(0.96 0 0)" }}>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-3 ${col.sortable ? "cursor-pointer select-none hover:bg-black/[0.02]" : ""}`}
                  style={{ color: COLORS.TEXT_MUTED }}
                  onClick={() => col.sortable && onSort(col.key)}
                >
                  {col.label}
                  {col.sortable && <SortIcon field={col.key} sortField={sortField} sortDir={sortDir} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tareas.map((t) => (
              <tr
                key={t.id}
                className="border-t hover:bg-gray-50/40 transition-colors"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
              >
                <td className="px-4 py-3">
                  <p className="text-sm font-medium break-words" style={{ color: COLORS.CHARCOAL }}>{t.titulo}</p>
                  {t.descripcion && (
                    <p className="text-xs mt-0.5 break-words" style={{ color: COLORS.TEXT_MUTED }}>{t.descripcion}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  {t.persona ? (
                    <div className="flex items-center gap-2">
                      <div
                        className="flex items-center justify-center size-7 rounded-full shrink-0 text-[10px] font-semibold"
                        style={{ backgroundColor: COLORS.ACCENT, color: "white" }}
                      >
                        {(t.persona.nombres?.charAt(0) || "") + (t.persona.apellidos?.charAt(0) || "")}
                      </div>
                      <span className="text-sm" style={{ color: COLORS.CHARCOAL }}>
                        {t.persona.nombres} {t.persona.apellidos}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>Sin asignar</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: COLORS.CHARCOAL }}>
                  {formatDate(t.fecha_inicio)}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: COLORS.CHARCOAL }}>
                  {formatDate(t.fecha_fin)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge estado={t.estado} tareaId={t.id} onTareaUpdate={onTareaUpdate} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(t)}
                      className="size-8 flex items-center justify-center rounded-lg transition-colors"
                      style={{ color: COLORS.TEXT_MUTED }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "oklch(0.50 0.12 250)"
                        e.currentTarget.style.backgroundColor = "oklch(0.50 0.12 250 / 0.10)"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = COLORS.TEXT_MUTED
                        e.currentTarget.style.backgroundColor = "transparent"
                      }}
                    >
                      <HugeiconsIcon icon={Edit01Icon} size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(t.id)}
                      className="size-8 flex items-center justify-center rounded-lg transition-colors"
                      style={{ color: COLORS.TEXT_MUTED }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "oklch(0.50 0.12 10)"
                        e.currentTarget.style.backgroundColor = "oklch(0.50 0.12 10 / 0.10)"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = COLORS.TEXT_MUTED
                        e.currentTarget.style.backgroundColor = "transparent"
                      }}
                    >
                      <HugeiconsIcon icon={Delete01Icon} size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {lastPage > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <span className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
            Página {currentPage} de {lastPage}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30"
              style={{ color: COLORS.CHARCOAL }}
            >
              Anterior
            </button>
            <button
              disabled={currentPage >= lastPage}
              onClick={() => onPageChange(currentPage + 1)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30"
              style={{ color: COLORS.CHARCOAL }}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
