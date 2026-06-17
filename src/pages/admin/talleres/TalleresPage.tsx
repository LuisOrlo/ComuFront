/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BookOpenIcon, Add01Icon, Search01Icon,
  ArrowRight01Icon, Edit01Icon, Delete01Icon,
  UserGroupIcon, CalendarIcon, CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { tallerService, type Taller, type TallerStats } from "@/services/taller.service"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const TEXT_MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

const ESTADO_BADGE: Record<string, { bg: string; text: string }> = {
  pendiente: { bg: "oklch(0.92 0.05 80)", text: "oklch(0.55 0.12 70)" },
  confirmado: { bg: "oklch(0.92 0.08 140)", text: "oklch(0.45 0.12 140)" },
  completado: { bg: "oklch(0.95 0 0)", text: "oklch(0.45 0 0)" },
  cancelado: { bg: "oklch(0.93 0.06 20)", text: "oklch(0.55 0.15 20)" },
}

export function TalleresPage() {
  const navigate = useNavigate()
  const [talleres, setTalleres] = useState<Taller[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<"proximos" | "pasados" | "todos">("proximos")
  const [modalidadFilter, setModalidadFilter] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Taller | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const params: Record<string, unknown> = { per_page: 100 }
    if (tab !== "todos") params.tab = tab
    if (modalidadFilter) params.modalidad = modalidadFilter
    if (estadoFilter) params.estado = estadoFilter
    tallerService.listar(params)
      .then(res => setTalleres((res as any).data || []))
      .catch(() => toast.error("Error al cargar talleres"))
      .finally(() => setLoading(false))
  }, [tab, modalidadFilter, estadoFilter, refreshKey])

  useEffect(() => {
    if (!search) return
    const params: Record<string, unknown> = { per_page: 100, search }
    if (tab !== "todos") params.tab = tab
    if (modalidadFilter) params.modalidad = modalidadFilter
    if (estadoFilter) params.estado = estadoFilter
    const t = setTimeout(() => {
      tallerService.listar(params)
        .then(res => setTalleres((res as any).data || []))
        .catch(() => toast.error("Error al cargar talleres"))
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const stats: TallerStats = useMemo(() => {
    const all = talleres
    const proximos = all.filter(t => t.fecha && new Date(t.fecha) >= new Date(new Date().toDateString()) && t.estado !== "cancelado")
    const completados = all.filter(t => t.estado === "completado")
    return {
      total_inscritos: all.reduce((s, t) => s + (t.inscripciones_count || 0), 0),
      ingreso_total: 0,
      pagos_verificados: 0,
      pagos_pendientes: 0,
      capacidad_disponible: 0,
      tasa_ocupacion: 0,
      id: "",
      nombre: "",
      estado: "",
      permite_inscripcion: false,
      proximos: proximos.length,
      completados: completados.length,
      total: all.length,
    } as any
  }, [talleres])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await tallerService.eliminar(deleteTarget.id)
      toast.success("Taller eliminado")
      setDeleteTarget(null)
      setRefreshKey(k => k + 1)
    } catch {
      toast.error("Error al eliminar taller")
    } finally {
      setDeleting(false)
    }
  }

  const formatFecha = (f: string) => {
    try {
      const d = new Date(f)
      const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
      return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`
    } catch { return f }
  }

  const formatHora = (h?: string) => h ? h.substring(0, 5) : "—"

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50/50">
      <div className="bg-white border-b shrink-0" style={{ borderColor: BORDER }}>
        <div className="max-w-[1200px] mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold" style={{ color: CHARCOAL }}>Talleres</h1>
              <p className="text-sm mt-0.5" style={{ color: TEXT_MUTED }}>Gestiona los talleres presenciales y virtuales</p>
            </div>
            <button onClick={() => navigate("/talleres/nuevo")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-white transition-all active:scale-[0.97]"
              style={{ backgroundColor: ACCENT }}>
              <HugeiconsIcon icon={Add01Icon} size={14} />Nuevo Taller
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-6 py-6 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Próximos", value: (stats as any).proximos ?? 0, icon: CalendarIcon, color: "oklch(0.55 0.18 72)" },
            { label: "Completados", value: (stats as any).completados ?? 0, icon: CheckmarkCircle01Icon, color: "oklch(0.45 0.12 140)" },
            { label: "Inscritos", value: stats.total_inscritos, icon: UserGroupIcon, color: "oklch(0.55 0.18 250)" },
            { label: "Total", value: (stats as any).total ?? 0, icon: BookOpenIcon, color: CHARCOAL },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border p-4" style={{ borderColor: BORDER }}>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${s.color} 12%, transparent)` }}>
                  <HugeiconsIcon icon={s.icon} size={18} style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: CHARCOAL }}>{s.value}</p>
                  <p className="text-[11px] font-medium" style={{ color: TEXT_MUTED }}>{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border" style={{ borderColor: BORDER }}>
          <div className="px-5 py-4 border-b flex flex-wrap items-center justify-between gap-3" style={{ borderColor: BORDER }}>
            <div className="flex gap-1 rounded-lg border p-0.5 bg-gray-50" style={{ borderColor: BORDER }}>
              {[
                { key: "proximos", label: "Próximos" },
                { key: "pasados", label: "Pasados" },
                { key: "todos", label: "Todos" },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key as any)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                  style={{
                    backgroundColor: tab === t.key ? "#fff" : "transparent",
                    color: tab === t.key ? CHARCOAL : TEXT_MUTED,
                    boxShadow: tab === t.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  }}>{t.label}</button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <HugeiconsIcon icon={Search01Icon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: TEXT_MUTED }} />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar taller..."
                  className="w-56 pl-9 pr-3 py-2 rounded-lg text-xs border outline-none" style={{ borderColor: BORDER }} />
              </div>
              <select value={modalidadFilter} onChange={e => setModalidadFilter(e.target.value)}
                className="px-3 py-2 rounded-lg text-xs border bg-white outline-none" style={{ borderColor: BORDER }}>
                <option value="">Todas</option>
                <option value="presencial">Presencial</option>
                <option value="virtual">Virtual</option>
              </select>
              <select value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)}
                className="px-3 py-2 rounded-lg text-xs border bg-white outline-none" style={{ borderColor: BORDER }}>
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="confirmado">Confirmado</option>
                <option value="completado">Completado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-16 text-center text-sm" style={{ color: TEXT_MUTED }}>Cargando...</div>
            ) : talleres.length === 0 ? (
              <div className="p-16 text-center">
                <p className="text-sm font-medium" style={{ color: CHARCOAL }}>No hay talleres</p>
                <p className="text-xs mt-1" style={{ color: TEXT_MUTED }}>Crea un nuevo taller para comenzar</p>
              </div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b" style={{ borderColor: BORDER }}>
                    <th className="text-left font-semibold px-5 py-3" style={{ color: TEXT_MUTED }}>Taller</th>
                    <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Instructor</th>
                    <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Fecha</th>
                    <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Horario</th>
                    <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Precio</th>
                    <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Inscritos</th>
                    <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Estado</th>
                    <th className="text-right font-semibold px-5 py-3" style={{ color: TEXT_MUTED }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {talleres.map(t => (
                    <tr key={t.id} className="border-b hover:bg-gray-50/50 transition-colors cursor-pointer" style={{ borderColor: BORDER }}
                      onClick={() => navigate(`/talleres/${t.id}`)}>
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="font-semibold" style={{ color: CHARCOAL }}>{t.nombre}</p>
                          {t.descripcion && <p className="text-[11px] truncate max-w-[200px]" style={{ color: TEXT_MUTED }}>{t.descripcion}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3.5" style={{ color: CHARCOAL }}>
                        {t.instructor ? `${t.instructor.nombres} ${t.instructor.apellidos}` : "—"}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap" style={{ color: CHARCOAL }}>
                        {t.fecha ? formatFecha(t.fecha) : "—"}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap" style={{ color: CHARCOAL }}>
                        {formatHora(t.hora_inicio)} - {formatHora(t.hora_fin)}
                      </td>
                      <td className="px-4 py-3.5 font-semibold" style={{ color: CHARCOAL }}>
                        ${Number(t.precio || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5" style={{ color: CHARCOAL }}>
                        <span className={cn(
                          (t.inscripciones_count || 0) >= (t.capacidad_maxima || 0) ? "text-red-500 font-bold" : ""
                        )}>
                          {t.inscripciones_count || 0}/{t.capacidad_maxima || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{
                            backgroundColor: ESTADO_BADGE[t.estado]?.bg || "oklch(0.95 0 0)",
                            color: ESTADO_BADGE[t.estado]?.text || TEXT_MUTED,
                          }}>
                          {t.estado}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => navigate(`/talleres/${t.id}/editar`)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: TEXT_MUTED }}>
                            <HugeiconsIcon icon={Edit01Icon} size={14} />
                          </button>
                          <button onClick={() => setDeleteTarget(t)}
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" style={{ color: TEXT_MUTED }}>
                            <HugeiconsIcon icon={Delete01Icon} size={14} />
                          </button>
                          <button onClick={() => navigate(`/talleres/${t.id}`)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: ACCENT }}>
                            <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      <ConfirmationModal
        isOpen={!!deleteTarget}
        title="Eliminar Taller"
        message={`¿Estás seguro de eliminar "${deleteTarget?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isLoading={deleting}
        icon="trash"
        isDangerous
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
