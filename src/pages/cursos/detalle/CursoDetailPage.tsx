import { useState, useEffect } from "react"
import { usePermission } from "@/hooks/usePermission"
import { useParams, useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  LocationIcon,
  NoteIcon,
  CapIcon,
  Download01Icon,
  UserGroupIcon,
  CheckmarkCircle01Icon,
  Money01Icon,
} from "@hugeicons/core-free-icons"
import { Trash2 } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { generarListadoAsistenciaPDF, generarListadoParticipantesCursoPDF } from "@/lib/generarAsistenciaPDF"
import { CursoAsistenciaSection } from "./CursoAsistenciaSection"
import { CursoEstudiantesTable } from "./CursoEstudiantesTable"
import { CursoPagosSection } from "./CursoPagosSection"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { cursosService, type Curso, type MatriculaDetallada } from "@/services/cursos.service"
import { toast } from "sonner"

type Tab = "info" | "modulos" | "estudiantes" | "asistencia" | "pagos"

interface ModuloData {
  id: string
  nombre_modulo: string
  fecha_inicio: string
  fecha_fin: string
  numero_orden?: number
  horas_academicas?: number
  cupo?: number
  precio_base?: number | null
}
interface DiaHorario {
  id?: string
  dia_semana: number
}

const estadoConfig: Record<string, { bg: string; text: string; label: string }> = {
  pendiente: { bg: "oklch(0.55 0.12 90 / 0.12)", text: "oklch(0.55 0.12 90)", label: "Pendiente" },
  en_progreso: { bg: "oklch(0.50 0.10 240 / 0.12)", text: "oklch(0.50 0.12 240)", label: "En progreso" },
  completado: { bg: "oklch(0.50 0.10 140 / 0.12)", text: "oklch(0.50 0.12 140)", label: "Completado" },
}

export function CursoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAdmin } = usePermission()
  const [curso, setCurso] = useState<Curso | null>(null)
  const [modulos, setModulos] = useState<ModuloData[]>([])
  const [matriculas, setMatriculas] = useState<MatriculaDetallada[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("info")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const cargarTodo = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [c, mods, mats] = await Promise.all([
        cursosService.getCursoById(id),
        cursosService.getModulosCurso(id),
        cursosService.getMatriculasCurso(id),
      ])
      setCurso(c)
      setModulos(mods as unknown as ModuloData[])
      setMatriculas(mats)
    } catch {
      toast.error("Error al cargar curso")
    } finally { setLoading(false) }
  }

  useEffect(() => { // eslint-disable-next-line react-hooks/set-state-in-effect
    if (id) cargarTodo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const updateModulo = async (moduloId: string, data: Record<string, unknown>) => {
    try {
      await cursosService.actualizarModulo(moduloId, data)
      toast.success("Actualizado")
      cargarTodo()
    } catch { toast.error("Error al actualizar") }
  }

  const confirmDeleteCurso = async () => {
    if (!id || !curso) return
    setDeleting(true)
    try {
      await cursosService.eliminarCursoAbierto(id)
      toast.success("Curso eliminado exitosamente")
      setShowDeleteConfirm(false)
      navigate("/cursos")
    } catch {
      toast.error("Error al eliminar el curso")
    } finally { setDeleting(false) }
  }

  if (loading) return (
    <div className="flex justify-center py-32">
      <div className="size-10 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: COLORS.ACCENT, borderRightColor: COLORS.ACCENT }} />
    </div>
  )
  if (!curso) return <div className="p-10 text-center" style={{ color: COLORS.TEXT_MUTED }}>Curso no encontrado</div>

  const est = estadoConfig[curso.estado] || estadoConfig.pendiente

  // Calcular progreso
  const progreso = curso.capacidad > 0 ? Math.round((curso.estudiantes / curso.capacidad) * 100) : 0

  const tabs = [
    { key: "info" as Tab, label: "Información", icon: CalendarIcon },
    { key: "modulos" as Tab, label: "Módulos", icon: NoteIcon },
    { key: "estudiantes" as Tab, label: `Estudiantes (${matriculas.length})`, icon: UserGroupIcon },
    { key: "asistencia" as Tab, label: "Asistencia", icon: CheckmarkCircle01Icon },
    { key: "pagos" as Tab, label: "Pagos", icon: Money01Icon },
  ]

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <main className="flex-1">
        {/* Header con gradient */}
        <div style={{ background: `linear-gradient(to bottom, ${COLORS.ACCENT}04, transparent)`, borderBottom: `1px solid ${COLORS.BORDER_SUBTLE}` }}>
          <div className="max-w-[1100px] mx-auto px-6 py-8 relative">
            <button onClick={() => navigate("/cursos")}
              className="inline-flex items-center gap-1.5 text-xs font-medium mb-6 opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: COLORS.TEXT_MUTED }}>
              <HugeiconsIcon icon={ArrowLeftIcon} size={14} />Volver a cursos
            </button>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider" style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 12%, transparent)`, color: COLORS.ACCENT }}>
                    {curso.tipo}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider" style={{ backgroundColor: "rgba(0,0,0,0.05)", color: COLORS.TEXT_MUTED }}>
                    {curso.modalidad}
                  </span>
                </div>
                <h1 className="text-3xl font-bold" style={{ color: COLORS.CHARCOAL }}>{curso.nombre}</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: COLORS.TEXT_MUTED }}>
                  <span className="inline-flex items-center gap-1">
                    <HugeiconsIcon icon={UserIcon} size={14} />
                    {curso.instructor}
                  </span>
                  <span className="opacity-40">·</span>
                  <span className="inline-flex items-center gap-1">
                    <HugeiconsIcon icon={LocationIcon} size={14} />
                    {curso.ciudad}
                  </span>
                  <span className="opacity-40">·</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: est.bg, color: est.text }}>
                    {est.label}
                  </span>
                </div>
              </div>
              {isAdmin && (<button onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-black/5 text-charcoal/60 hover:bg-red-50 hover:text-red-600 active:scale-95">
                <Trash2 size={14} />Eliminar
              </button>)}
            </div>
          </div>
        </div>

        <div className="max-w-[1100px] mx-auto px-6 py-6 space-y-6">
          {/* Tabs */}
          <div className="flex gap-1 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all"
                style={{
                  borderColor: tab === t.key ? COLORS.ACCENT : "transparent",
                  color: tab === t.key ? COLORS.CHARCOAL : COLORS.TEXT_MUTED,
                }}>
                <HugeiconsIcon icon={t.icon} size={14} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab: Info */}
          {tab === "info" && (
            <div className="space-y-6">
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <StatCard icon={<HugeiconsIcon icon={CapIcon} size={18} />} label="Capacidad" value={`${curso.estudiantes}/${curso.capacidad}`} subtitle={progreso > 0 ? `${progreso}% ocupado` : undefined} />
                <StatCard icon={<HugeiconsIcon icon={CalendarIcon} size={18} />} label="Inicio" value={curso.fechaInicio ? new Date(curso.fechaInicio + "T12:00:00").toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" }) : "—"} />
                <StatCard icon={<HugeiconsIcon icon={CalendarIcon} size={18} />} label="Fin" value={curso.fechaFin ? new Date(curso.fechaFin + "T12:00:00").toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" }) : "—"} />
                <StatCard icon={<HugeiconsIcon icon={ClockIcon} size={18} />} label="Horario" value={curso.horaInicio && curso.horaFin ? `${curso.horaInicio} - ${curso.horaFin}` : "—"} />
              </div>

               {/* Módulos progreso */}
               <div className="p-5 rounded-xl border" style={{ borderColor: COLORS.BORDER_SUBTLE, borderLeftColor: COLORS.ACCENT, borderLeftWidth: 3 }}>
                  <h3 className="text-sm font-semibold mb-1" style={{ color: COLORS.CHARCOAL }}>Progreso de módulos</h3>
                 <div className="flex items-center gap-3 mt-3">
                   <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                     <div className="h-full rounded-full transition-all duration-500" style={{ width: `${curso.totalModulos > 0 ? (curso.moduloActual / curso.totalModulos) * 100 : 0}%`, backgroundColor: COLORS.ACCENT }} />
                   </div>
                   <span className="text-xs font-semibold" style={{ color: COLORS.ACCENT }}>{curso.moduloActual}/{curso.totalModulos}</span>
               </div>
                </div>

               {/* Precios de módulos */}
               <div className="p-5 rounded-xl border" style={{ borderColor: COLORS.BORDER_SUBTLE, borderLeftColor: COLORS.ACCENT, borderLeftWidth: 3 }}>
                 <h3 className="text-sm font-semibold mb-3" style={{ color: COLORS.CHARCOAL }}>Precios de módulos por persona</h3>
                 {modulos.length === 0 ? (
                   <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>Sin módulos asignados</p>
                 ) : (
                   <div className="space-y-2">
                      {[...modulos].sort((a, b) => (a.numero_orden ?? 999) - (b.numero_orden ?? 999)).map((mod, idx) => (
                        <div key={mod.id} className="flex items-center justify-between py-1">
                         <span className="text-sm" style={{ color: COLORS.CHARCOAL }}>
                           {mod.numero_orden || idx + 1}. {mod.nombre_modulo || "Sin definir"}
                         </span>
                         <span className="text-sm font-semibold" style={{ color: COLORS.ACCENT }}>
                           {mod.precio_base != null ? `$${Number(mod.precio_base).toFixed(2)}` : "—"}
                         </span>
                       </div>
                     ))}
                     <div className="border-t pt-2 mt-2 flex items-center justify-between" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                       <span className="text-xs font-semibold" style={{ color: COLORS.TEXT_MUTED }}>Total</span>
                       <span className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>
                         ${modulos.reduce((sum, m) => sum + (Number(m.precio_base) || 0), 0).toFixed(2)}
                       </span>
                     </div>
                   </div>
                 )}
               </div>

               {/* Horarios y días */}
               {curso.horario && (
                  <div className="p-5 rounded-xl border" style={{ borderColor: COLORS.BORDER_SUBTLE, borderLeftColor: COLORS.ACCENT, borderLeftWidth: 3 }}>
                   <h3 className="text-sm font-semibold mb-3" style={{ color: COLORS.CHARCOAL }}>Horarios</h3>
                   <div className="space-y-2">
                     <div className="flex items-center gap-2">
                       <span className="text-xs font-medium" style={{ color: COLORS.TEXT_MUTED }}>Horas:</span>
                       <span className="text-sm" style={{ color: COLORS.CHARCOAL }}>{curso.horario.hora_inicio} - {curso.horario.hora_fin}</span>
                     </div>
                     {curso.horario.diasSemana && curso.horario.diasSemana.length > 0 && (
                       <div className="flex items-start gap-2">
                         <span className="text-xs font-medium" style={{ color: COLORS.TEXT_MUTED }}>Días:</span>
                         <div className="flex flex-wrap gap-1.5">
                              {curso.horario.diasSemana.map((dia: DiaHorario) => (
                               <span key={dia.id} className="text-xs px-2 py-1 rounded-full font-medium" 
                                 style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 10%, transparent)`, color: COLORS.ACCENT }}>
                                {getDiaNombre(dia.dia_semana)}
                              </span>
                            ))}
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
               )}

              {/* Observaciones */}
              {curso.observaciones && (
                <div className="p-5 rounded-xl border" style={{ borderColor: COLORS.BORDER_SUBTLE, borderLeftColor: COLORS.ACCENT, borderLeftWidth: 3 }}>
                  <div className="flex items-center gap-2 mb-2">
                    <HugeiconsIcon icon={NoteIcon} size={16} style={{ color: COLORS.TEXT_MUTED }} />
                    <h3 className="text-sm font-semibold" style={{ color: COLORS.CHARCOAL }}>Observaciones</h3>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: COLORS.TEXT_MUTED }}>{curso.observaciones}</p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Módulos */}
          {tab === "modulos" && (
            <div className="space-y-3">
              {modulos.length === 0 ? (
                <div className="p-12 text-center border rounded-xl border-dashed" style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}>
                  <HugeiconsIcon icon={NoteIcon} size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">Sin módulos asignados</p>
                </div>
               ) : (
                   [...modulos].sort((a, b) => (a.numero_orden ?? 999) - (b.numero_orden ?? 999)).map((mod, idx: number) => {
                    const estado = calcularEstadoModulo(mod.fecha_inicio, mod.fecha_fin)
                   return (
                      <div key={mod.id} className="p-5 rounded-xl border hover:shadow-sm transition-shadow" style={{ borderColor: COLORS.BORDER_SUBTLE, borderLeftColor: COLORS.ACCENT, borderLeftWidth: 3 }}>
                        <div className="flex items-center gap-3 mb-4">
                          <div className="size-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: COLORS.ACCENT, color: "white" }}>
                           {mod.numero_orden || idx + 1}
                         </div>
                        <div className="flex-1">
                            <span className="text-xs font-medium" style={{ color: COLORS.TEXT_MUTED }}>Nombre</span>
                            <p className="text-sm font-semibold mt-0.5" style={{ color: COLORS.CHARCOAL }}>{mod.nombre_modulo || "Sin definir"}</p>
                          </div>
                         <span className="text-xs px-2.5 py-1 rounded-full font-medium" 
                           style={{ 
                             backgroundColor: `color-mix(in srgb, ${estadoConfig[estado].text} 12%, transparent)`,
                             color: estadoConfig[estado].text
                           }}>
                           {estadoConfig[estado].label}
                         </span>
                       </div>
                        <div className="grid grid-cols-3 gap-4 ml-11">
                          <ModuleField label="Fecha inicio" value={mod.fecha_inicio} modId={mod.id} field="fecha_inicio" type="date" onUpdate={updateModulo} />
                          <ModuleField label="Fecha fin" value={mod.fecha_fin} modId={mod.id} field="fecha_fin" type="date" onUpdate={updateModulo} />
                          <ModuleField label="Precio" value={mod.precio_base != null ? String(mod.precio_base) : undefined} modId={mod.id} field="precio_base" type="number" onUpdate={updateModulo} />
                        </div>
                     </div>
                   )
                 })
              )}
            </div>
          )}

          {/* Tab: Asistencia */}
          {tab === "asistencia" && (
            <CursoAsistenciaSection
              cursoId={id!}
              cursoNombre={curso.nombre}
              modulos={modulos}
            />
          )}

          {/* Tab: Estudiantes */}
          {tab === "estudiantes" && (
            <div className="space-y-4">
              {matriculas.length > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>{matriculas.length} estudiante{matriculas.length !== 1 ? "s" : ""}</p>
                  <div className="flex gap-2">
                    <button onClick={async () => {
                      try {
                        const participantes = matriculas.map((m) => {
                          const e = m.estudiante
                          const ext = m.solicitud_inscripcion?.participante_externo
                          const sol = m.solicitud_inscripcion?.estudiante
                          return {
                            nombres: e?.nombres || ext?.nombres || sol?.nombres || "",
                            apellidos: e?.apellidos || ext?.apellidos || sol?.apellidos || "",
                            ciudad: e?.ciudad || sol?.ciudad || ext?.ciudad || "—",
                            ocupacion: e?.perfil_estudiante?.ocupacion || sol?.perfil_estudiante?.ocupacion || "—",
                            fechaInscripcion: m.fecha_inscripcion ? new Date(m.fecha_inscripcion).toLocaleDateString("es-ES") : "—",
                          }
                        })
                        await generarListadoParticipantesCursoPDF(curso.nombre, participantes, id!)
                        toast.success("PDF descargado")
    } catch (e) { console.error(e); toast.error("Error al generar PDF") }
                    }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border hover:bg-gray-50 transition-colors"
                      style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}>
                      <HugeiconsIcon icon={Download01Icon} size={14} />PDF
                    </button>
                    <button
  onClick={async () => {
    if (!curso) return;
    try {
      const data = await cursosService.getAsistenciaPDFData(id!)
      await generarListadoAsistenciaPDF(data)
      toast.success("Listado de asistencia descargado");
    } catch { toast.error("Error al generar PDF") }
  }}
  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold
             bg-emerald-600 text-white
             border border-emerald-600
             transition-all duration-200
             hover:bg-emerald-700
             hover:border-emerald-700
             hover:shadow-lg
             hover:-translate-y-0.5
             active:scale-[0.98]"
>
  <HugeiconsIcon icon={Download01Icon} size={14} />
  Listado Asistencia
</button>
                  </div>
                </div>
              )}
              {matriculas.length === 0 ? (
                <div className="p-12 text-center border rounded-xl border-dashed" style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}>
                  <HugeiconsIcon icon={UserIcon} size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">Sin estudiantes matriculados</p>
                </div>
              ) : (
                <CursoEstudiantesTable matriculas={matriculas} />
              )}
            </div>
          )}

          {/* Tab: Pagos */}
          {tab === "pagos" && (
            <CursoPagosSection
              cursoId={id!}
            />
          )}
        </div>
      </main>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Eliminar Curso"
        message={`¿Estás seguro de que deseas eliminar el curso "${curso.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="No, cancelar"
        isDangerous={true}
        isLoading={deleting}
        icon="trash"
        onConfirm={confirmDeleteCurso}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}

function getDiaNombre(numero: number): string {
  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
  return dias[numero - 1] || `Día ${numero}`
}

function calcularEstadoModulo(fechaInicio?: string, fechaFin?: string): string {
  if (!fechaInicio || !fechaFin) return "pendiente"
  
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  
  const inicio = new Date(fechaInicio + "T00:00:00")
  const fin = new Date(fechaFin + "T23:59:59")
  
  if (hoy < inicio) return "pendiente"
  if (hoy > fin) return "completado"
  return "en_progreso"
}

function StatCard({ icon, label, value, subtitle }: { icon: React.ReactNode; label: string; value: string; subtitle?: string }) {
  return (
    <div className="p-4 rounded-xl border" style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: "white" }}>
      <div className="flex items-center gap-2 mb-2" style={{ color: COLORS.ACCENT }}>{icon}</div>
      <p className="text-xs mb-0.5" style={{ color: COLORS.TEXT_MUTED }}>{label}</p>
      <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>{value}</p>
      {subtitle && <p className="text-[10px] mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>{subtitle}</p>}
      <div className="mt-3 h-0.5 w-8 rounded-full" style={{ backgroundColor: COLORS.ACCENT }} />
    </div>
  )
}

function ModuleField({ label, value, modId, field, type = "text", onUpdate }: {
  label: string; value?: string; modId: string; field: string; type?: string; onUpdate: (id: string, data: Record<string, unknown>) => void
}) {
  const { isAdmin } = usePermission()
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value || "")
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium" style={{ color: COLORS.TEXT_MUTED }}>{label}</span>
        {!editing && isAdmin && <button type="button" onClick={() => setEditing(true)} className="text-xs font-medium hover:underline" style={{ color: COLORS.ACCENT }}>Editar</button>}
      </div>
      {editing ? (
        <div className="flex gap-2">
          <input type={type} value={val} onChange={e => setVal(e.target.value)}
            className="flex-1 px-2.5 py-2 border rounded-lg text-sm outline-none focus:ring-2" style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL, backgroundColor: "white", colorScheme: "light" }} />
          <button type="button" onClick={() => { onUpdate(modId, { [field]: val || null }); setEditing(false) }}
            className="px-3 py-2 rounded-lg text-xs font-medium text-black" style={{ backgroundColor: COLORS.ACCENT }}>Guardar</button>
          <button type="button" onClick={() => { setEditing(false); setVal(value || "") }}
            className="px-3 py-2 rounded-lg text-xs font-medium hover:bg-gray-100" style={{ color: COLORS.TEXT_MUTED }}>Cancelar</button>
        </div>
      ) : (
        <p className="text-sm font-medium" style={{ color: value ? COLORS.CHARCOAL : COLORS.TEXT_MUTED }}>{value || "Sin definir"}</p>
      )}
    </div>
  )
}
