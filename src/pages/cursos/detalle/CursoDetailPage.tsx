import { useState, useEffect, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { usePermission } from "@/hooks/usePermission"
import { useParams, useNavigate, Link, useSearchParams } from "react-router"
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
  Search01Icon,
  UserGroupIcon,
  CheckmarkCircle01Icon,
  Money01Icon,
  Edit01Icon,
} from "@hugeicons/core-free-icons"
import { Trash2 } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { parseLocalDate } from "@/lib/utils"
import { generarListadoAsistenciaPDF } from "@/lib/generarAsistenciaPDF"
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
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { isAdmin, isSecretaria } = usePermission()
  const [curso, setCurso] = useState<Curso | null>(null)
  const [modulos, setModulos] = useState<ModuloData[]>([])
  const [matriculas, setMatriculas] = useState<MatriculaDetallada[]>([])
  const [matriculasMeta, setMatriculasMeta] = useState({ total: 0, per_page: 15, current_page: 1, last_page: 1 })
  const [matriculasSearch, setMatriculasSearch] = useState("")
  const [loadingMatriculas, setLoadingMatriculas] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [tab, setTab] = useState<Tab>(() => {
    const requestedTab = searchParams.get("tab")
    return requestedTab === "modulos" || requestedTab === "estudiantes" || requestedTab === "asistencia" || requestedTab === "pagos"
      ? requestedTab
      : "info"
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const cargarTodo = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [c, mods] = await Promise.all([
        cursosService.getCursoById(id),
        cursosService.getModulosCurso(id),
      ])
      setCurso(c)
      setModulos(mods as unknown as ModuloData[])
      setLoadError(false)
    } catch {
      setLoadError(true)
      toast.error("Error al cargar curso")
    } finally { setLoading(false) }
  }

  useEffect(() => {  
    if (id) cargarTodo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const cargarMatriculas = useCallback(async (page = 1, buscar = matriculasSearch) => {
    if (!id) return
    setLoadingMatriculas(true)
    try {
      const response = await cursosService.getMatriculasCursoPaginadas(id, page, buscar)
      setMatriculas(response.data)
      setMatriculasMeta(response.meta)
    } catch {
      toast.error("Error al cargar estudiantes del curso")
    } finally { setLoadingMatriculas(false) }
  }, [id, matriculasSearch])

  useEffect(() => {
    if (tab !== "estudiantes" && tab !== "pagos") return
    const timer = window.setTimeout(() => { void cargarMatriculas(1) }, matriculasSearch ? 300 : 0)
    return () => window.clearTimeout(timer)
  }, [tab, matriculasSearch, cargarMatriculas])

  const confirmDeleteCurso = async () => {
    if (!id || !curso) return
    setDeleting(true)
    try {
      await cursosService.eliminarCursoAbierto(id)
      toast.success("Curso eliminado exitosamente")
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cursos"] }),
        queryClient.invalidateQueries({ queryKey: ["cursos-abiertos"] }),
      ])
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
  if (!curso) return <div className="p-10 text-center" style={{ color: COLORS.TEXT_MUTED }}>
    <p>{loadError ? "No se pudo cargar el curso." : "Curso no encontrado"}</p>
    {loadError && <button type="button" onClick={cargarTodo} className="mt-3 text-sm font-semibold underline" style={{ color: COLORS.ACCENT }}>Reintentar</button>}
  </div>

  const est = estadoConfig[curso.estado] || estadoConfig.pendiente

  // Calcular progreso
  const progreso = curso.capacidad > 0 ? Math.round((curso.estudiantes / curso.capacidad) * 100) : 0

  const tabs = [
    { key: "info" as Tab, label: "Información", icon: CalendarIcon },
    { key: "modulos" as Tab, label: "Módulos", icon: NoteIcon },
    { key: "estudiantes" as Tab, label: `Estudiantes (${matriculasMeta.total || curso.estudiantes})`, icon: UserGroupIcon },
    { key: "asistencia" as Tab, label: "Asistencia", icon: CheckmarkCircle01Icon },
    { key: "pagos" as Tab, label: "Pagos", icon: Money01Icon },
  ]

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#f8f9ff] text-[#0b1c30]">
      <main className="flex-1">
        {/* Header con gradient */}
        <div className="bg-white border-b border-[#e5eeff]">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-6 relative">
            <button onClick={() => navigate("/cursos")}
              className="inline-flex items-center gap-1.5 text-xs font-medium mb-6 transition-all duration-200"
              style={{ color: COLORS.TEXT_MUTED }}
              onMouseEnter={(e) => { e.currentTarget.style.color = COLORS.ACCENT }}
              onMouseLeave={(e) => { e.currentTarget.style.color = COLORS.TEXT_MUTED }}>
              <HugeiconsIcon icon={ArrowLeftIcon} size={14} />Volver a cursos
            </button>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide bg-[#d3e4fe] text-[#0b1c30]">
                    {curso.modalidad}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold bg-white text-[#009668] shadow-sm">
                    <span className="size-1.5 rounded-full bg-[#009668]" />{est.label}
                  </span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight" style={{ color: "#0b1c30" }}>{curso.nombre}</h1>
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
                </div>
              </div>
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate(`/cursos/${id}/editar`)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-white active:scale-95"
                    style={{ backgroundColor: COLORS.ACCENT, boxShadow: `0 0 15px ${COLORS.ACCENT}25` }}>
                    <HugeiconsIcon icon={Edit01Icon} size={14} />Editar
                  </button>
                  <button onClick={() => setShowDeleteConfirm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-black/5 text-charcoal/60 hover:bg-red-50 hover:text-red-600 active:scale-95">
                    <Trash2 size={14} />Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-[1280px] mx-auto w-full px-6 lg:px-8 py-6 space-y-6">
          {/* Tabs */}
          <div role="tablist" aria-label="Secciones del curso" className="flex gap-1 border-b overflow-x-auto bg-[#f8f9ff] -mx-6 lg:-mx-8 px-6 lg:px-8" style={{ borderColor: "#e5eeff" }}>
            {tabs.map(t => (
              <button key={t.key} id={`curso-tab-${t.key}`} role="tab" aria-selected={tab === t.key} aria-controls={`curso-panel-${t.key}`} onClick={() => setTab(t.key)}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-3.5 text-xs font-semibold border-b-2 transition-all shrink-0 whitespace-nowrap"
                style={{
                  borderColor: tab === t.key ? "#fd761a" : "transparent",
                  color: tab === t.key ? "#9d4300" : "#45464d",
                }}>
                <HugeiconsIcon icon={t.icon} size={14} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab: Info */}
          {tab === "info" && (
            <div id="curso-panel-info" role="tabpanel" aria-labelledby="curso-tab-info" className="space-y-6">
              {/* Stats row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard icon={<HugeiconsIcon icon={CapIcon} size={16} />} label="Capacidad" value={`${curso.estudiantes} / ${curso.capacidad}`} subtitle={progreso > 0 ? `${progreso}% ocupado` : "Sin estudiantes inscritos"} progress={progreso} />
                <StatCard icon={<HugeiconsIcon icon={CalendarIcon} size={16} />} label="Fecha de inicio" value={curso.fechaInicio ? parseLocalDate(curso.fechaInicio).toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" }) : "—"} subtitle="Inicio del curso" />
                <StatCard icon={<HugeiconsIcon icon={CalendarIcon} size={16} />} label="Fecha de fin" value={curso.fechaFin ? parseLocalDate(curso.fechaFin).toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" }) : "—"} subtitle="Cierre del curso" />
                <StatCard icon={<HugeiconsIcon icon={ClockIcon} size={16} />} label="Horario sincrónico" value={curso.horaInicio && curso.horaFin ? `${curso.horaInicio} – ${curso.horaFin}` : "—"} subtitle={curso.horasTotales ? `${curso.horasTotales} horas académicas` : "Zona horaria local"} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 flex flex-col gap-6">
                  <section className="p-5 sm:p-6 rounded-xl bg-white shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
                      <div><h2 className="text-lg font-semibold tracking-tight text-[#0b1c30]">Progreso</h2></div>
                      <span className="px-2.5 py-1 rounded-full bg-[#ffdbca] text-[#5c2400] text-[11px] font-semibold">{curso.moduloActual} / {curso.totalModulos} módulos completados</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-[#e5eeff] overflow-hidden my-3"><div className="h-full rounded-full bg-[#fd761a] transition-all" style={{ width: `${curso.totalModulos > 0 ? Math.min(100, curso.moduloActual / curso.totalModulos * 100) : 0}%` }} /></div>
                    {modulos.length ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">{[...modulos].sort((a,b) => (a.numero_orden ?? 999)-(b.numero_orden ?? 999)).slice(0, 4).map((mod, idx) => { const estadoModulo = calcularEstadoModulo(mod.fecha_inicio, mod.fecha_fin); return <div key={mod.id} className="rounded-lg bg-[#eff4ff] p-3"><span className="text-[10px] uppercase tracking-wide font-semibold text-[#45464d]">Módulo {mod.numero_orden || idx + 1}</span><p className="text-sm font-medium text-[#0b1c30] truncate mt-1">{mod.nombre_modulo || "Sin definir"}</p><div className="flex items-center gap-1.5 mt-2 text-[11px] font-medium" style={{ color: estadoConfig[estadoModulo].text }}><span className="size-1.5 rounded-full" style={{ backgroundColor: estadoConfig[estadoModulo].text }} />{estadoConfig[estadoModulo].label}</div></div> })}</div> : <p className="text-xs text-[#45464d]">Aún no hay módulos asignados.</p>}
                  </section>

                  <section className="p-5 sm:p-6 rounded-xl bg-white shadow-sm">
                    <div className="flex items-start justify-between gap-4 pb-3"><div><h2 className="text-lg font-semibold tracking-tight text-[#0b1c30]">Horario</h2></div><HugeiconsIcon icon={CalendarIcon} size={22} className="text-[#76777d]" /></div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#eff4ff] mt-3">
                      <div><span className="text-[10px] uppercase tracking-wider font-semibold text-[#45464d]">Bloque horario</span><span className="block text-lg font-semibold text-[#0b1c30] mt-1">{curso.horario?.hora_inicio || curso.horaInicio || "—"} – {curso.horario?.hora_fin || curso.horaFin || "—"}</span></div>
                      <div className="flex flex-wrap gap-2">{curso.horario?.diasSemana?.length ? curso.horario.diasSemana.map((dia: DiaHorario) => <span key={dia.id || dia.dia_semana} className="px-3 py-1.5 rounded-lg bg-white text-sm font-semibold text-[#0b1c30] shadow-sm">{getDiaNombre(dia.dia_semana)}</span>) : <span className="text-xs text-[#45464d]">Días no especificados</span>}</div>
                    </div>
                    {curso.horasTotales > 0 && <p className="mt-4 text-xs text-[#45464d]">Duración total: <strong className="text-[#0b1c30]">{curso.horasTotales} horas académicas</strong></p>}
                  </section>
                </div>

                <section className="lg:col-span-5 p-5 sm:p-6 rounded-xl bg-white shadow-sm">
                  <div className="flex items-center justify-between pb-4"><div><h2 className="text-lg font-semibold tracking-tight text-[#0b1c30]">Precio por estudiante</h2><p className="text-xs text-[#45464d] mt-1">Precios desglosados por persona y módulo</p></div><div className="size-9 rounded-lg bg-[#ffdbca] text-[#5c2400] flex items-center justify-center"><HugeiconsIcon icon={Money01Icon} size={18} /></div></div>
                  <div className="space-y-2 mt-2">{modulos.length ? [...modulos].sort((a,b) => (a.numero_orden ?? 999)-(b.numero_orden ?? 999)).map((mod, idx) => <div key={mod.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#eff4ff]"><div><span className="text-sm font-medium text-[#0b1c30]">Módulo {mod.numero_orden || idx + 1}: {mod.nombre_modulo || "Sin definir"}</span><span className="block text-xs text-[#45464d] mt-0.5">{mod.horas_academicas ? `${mod.horas_academicas} horas lectivas` : "Precio por módulo"}</span></div><strong className="text-base text-[#0b1c30] whitespace-nowrap">{mod.precio_base != null ? `$${Number(mod.precio_base).toFixed(2)}` : "—"}</strong></div>) : <p className="text-xs text-[#45464d]">Sin precios de módulo registrados.</p>}</div>
                  <div className="mt-4 p-4 rounded-xl bg-[#e5eeff] flex items-center justify-between gap-3"><div><span className="text-[10px] uppercase tracking-wider font-bold text-[#45464d]">Total por estudiante</span><span className="block text-xs text-[#45464d] mt-1">Suma de los módulos del curso</span></div><div className="text-right"><strong className="text-2xl text-[#9d4300]">${modulos.reduce((sum, m) => sum + (Number(m.precio_base) || 0), 0).toFixed(2)}</strong><span className="block text-[10px] text-[#45464d]">USD / participante</span></div></div>
                </section>
              </div>

              {/* Observaciones */}
              {curso.observaciones && (
                <div className="p-5 sm:p-6 rounded-xl bg-white shadow-sm border border-transparent">
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
              <div id="curso-panel-modulos" role="tabpanel" aria-labelledby="curso-tab-modulos" className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div><h2 className="text-xl font-semibold tracking-tight text-[#0b1c30]">Módulos del curso ({modulos.length})</h2></div>
                </div>
              <div className="flex flex-col gap-4">
              {modulos.length === 0 ? (
                <div className="p-12 text-center border rounded-xl border-dashed" style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}>
                  <HugeiconsIcon icon={NoteIcon} size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">Sin módulos asignados</p>
                </div>
               ) : (
                   [...modulos].sort((a, b) => (a.numero_orden ?? 999) - (b.numero_orden ?? 999)).map((mod, idx: number) => {
                    const estado = calcularEstadoModulo(mod.fecha_inicio, mod.fecha_fin)
                   return (
                      <div key={mod.id} className="p-5 sm:p-6 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="size-12 rounded-xl flex items-center justify-center text-base font-bold shrink-0" style={{ backgroundColor: estado === "en_progreso" ? "#131b2e" : "#dce9ff", color: estado === "en_progreso" ? "white" : "#45464d" }}>
                           {mod.numero_orden || idx + 1}
                         </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap"><span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#dce9ff] text-[#45464d]">Módulo {mod.numero_orden || idx + 1}</span><span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: estado === "en_progreso" ? "#ffdbca" : "#e5eeff", color: estado === "en_progreso" ? "#5c2400" : "#45464d" }}>{estadoConfig[estado].label}</span></div>
                            <h3 className="text-lg font-semibold mt-1 text-[#0b1c30]">{mod.nombre_modulo || "Sin definir"}</h3>
                            <p className="text-xs mt-1 text-[#45464d]">{mod.fecha_inicio ? parseLocalDate(mod.fecha_inicio).toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" }) : "Fecha pendiente"}{mod.fecha_fin ? ` – ${parseLocalDate(mod.fecha_fin).toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" })}` : ""}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between lg:justify-end gap-5 pl-16 lg:pl-0">
                          <div className="lg:text-right"><span className="text-[10px] uppercase tracking-wider text-[#45464d]">Arancel</span><strong className="block text-lg text-[#0b1c30]">{mod.precio_base != null ? `$${Number(mod.precio_base).toFixed(2)} USD` : "—"}</strong></div>
                         {(isAdmin || isSecretaria) && (
                           <Link
                             to={`/instructor/notas/${id}/${mod.id}`}
                             className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-white transition-all active:scale-95 shrink-0 bg-[#fd761a] hover:bg-[#9d4300]"
                           >
                             <HugeiconsIcon icon={NoteIcon} size={12} />
                             Registrar Notas
                           </Link>
                         )}
                        </div>
                       </div>
                        <div className="grid grid-cols-3 gap-4 ml-16 mt-5 pt-4 border-t border-[#e5eeff]">
                           <div>
                             <span className="text-xs font-medium" style={{ color: COLORS.TEXT_MUTED }}>Fecha inicio</span>
                             <p className="text-sm font-medium mt-1" style={{ color: mod.fecha_inicio ? COLORS.CHARCOAL : COLORS.TEXT_MUTED }}>
                               {mod.fecha_inicio ? parseLocalDate(mod.fecha_inicio).toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" }) : "Sin definir"}
                             </p>
                           </div>
                           <div>
                             <span className="text-xs font-medium" style={{ color: COLORS.TEXT_MUTED }}>Fecha fin</span>
                             <p className="text-sm font-medium mt-1" style={{ color: mod.fecha_fin ? COLORS.CHARCOAL : COLORS.TEXT_MUTED }}>
                               {mod.fecha_fin ? parseLocalDate(mod.fecha_fin).toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" }) : "Sin definir"}
                             </p>
                           </div>
                           <div>
                             <span className="text-xs font-medium" style={{ color: COLORS.TEXT_MUTED }}>Precio</span>
                             <p className="text-sm font-medium mt-1" style={{ color: mod.precio_base != null ? COLORS.CHARCOAL : COLORS.TEXT_MUTED }}>
                               {mod.precio_base != null ? `$${Number(mod.precio_base).toFixed(2)}` : "Sin definir"}
                             </p>
                           </div>
                         </div>
                     </div>
                   )
                 })
              )}
              </div>
            </div>
          )}

          {/* Tab: Asistencia */}
          {tab === "asistencia" && (
            <div id="curso-panel-asistencia" role="tabpanel" aria-labelledby="curso-tab-asistencia"><CursoAsistenciaSection
              cursoId={id!}
              cursoNombre={curso.nombre}
              modulos={modulos}
            /></div>
          )}

          {/* Tab: Estudiantes */}
          {tab === "estudiantes" && (
            <div id="curso-panel-estudiantes" role="tabpanel" aria-labelledby="curso-tab-estudiantes" className="space-y-4">
                <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 shrink-0"><span className="size-3 rounded-full bg-[#fd761a]"/><h2 className="text-base font-semibold text-[#0b1c30]">{matriculasMeta.total} estudiante{matriculasMeta.total !== 1 ? "s" : ""} matriculado{matriculasMeta.total !== 1 ? "s" : ""}</h2></div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <div className="relative w-full sm:w-72">
                      <HugeiconsIcon icon={Search01Icon} size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#45464d]" />
                      <input value={matriculasSearch} onChange={(event) => setMatriculasSearch(event.target.value)} placeholder="Buscar por nombre..." className="w-full bg-[#eff4ff] rounded-lg pl-9 pr-3 py-2.5 text-xs text-[#0b1c30] placeholder:text-[#45464d] outline-none" />
                    </div>
                    <button
  onClick={async () => {
    if (!curso) return;
    try {
      const data = await cursosService.getAsistenciaPDFData(id!)
      await generarListadoAsistenciaPDF(data)
      toast.success("Listado de asistencia descargado");
    } catch { toast.error("Error al generar PDF") }
  }}
  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#e5eeff] text-[#0b1c30] shadow-sm hover:bg-[#dce9ff] transition-colors"
>
  <HugeiconsIcon icon={Download01Icon} size={14} />
  Listado Asistencia
</button>
                  </div>
                </div>
              {loadingMatriculas ? (
                <div className="p-12 text-center text-sm" style={{ color: COLORS.TEXT_MUTED }}>Cargando estudiantes…</div>
              ) : matriculas.length === 0 ? (
                <div className="p-12 text-center border rounded-xl border-dashed" style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}>
                  <HugeiconsIcon icon={UserIcon} size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">Sin estudiantes matriculados</p>
                </div>
              ) : (
                <CursoEstudiantesTable
                  matriculas={matriculas}
                  meta={matriculasMeta}
                  onPageChange={(page) => { void cargarMatriculas(page) }}
                />
              )}
            </div>
          )}

          {/* Tab: Pagos */}
          {tab === "pagos" && (
            <div id="curso-panel-pagos" role="tabpanel" aria-labelledby="curso-tab-pagos"><CursoPagosSection
              cursoId={id!}
              cursoNombre={curso.nombre}
              curso={curso}
              matriculas={matriculas}
            /></div>
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

  const inicio = parseLocalDate(fechaInicio)
  const fin = parseLocalDate(fechaFin)

  if (hoy < inicio) return "pendiente"
  if (hoy > fin) return "completado"
  return "en_progreso"
}

function StatCard({ icon, label, value, subtitle, progress }: { icon: React.ReactNode; label: string; value: string; subtitle?: string; progress?: number }) {
  return (
    <div className="p-5 rounded-xl bg-white shadow-sm flex flex-col justify-between min-h-32">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#45464d" }}>{label}</p>
        <div className="size-8 rounded-lg bg-[#ffdbca] flex items-center justify-center" style={{ color: "#9d4300" }}>{icon}</div>
      </div>
      <div className="mt-3">
        <p className="text-xl font-bold tracking-tight" style={{ color: "#0b1c30" }}>{value}</p>
        {subtitle && <p className="text-xs mt-1 font-medium" style={{ color: "#9d4300" }}>{subtitle}</p>}
        {progress !== undefined && <div className="w-full h-1.5 bg-[#e5eeff] rounded-full mt-2.5 overflow-hidden"><div className="h-full bg-[#fd761a] rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} /></div>}
      </div>
    </div>
  )
}
