import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CalendarIcon,
  UserIcon,
  SearchIcon,
  CheckmarkCircleIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cursosService, type CatalogoCurso, type Curso, type MatriculaDetallada } from "@/services/cursos.service"
import { toast } from "sonner"

export function MatriculasListPage() {
  const navigate = useNavigate()

  // Estados de catálogos
  const [catalogos, setCatalogos] = useState<CatalogoCurso[]>([])
  const [searchCatalogo, setSearchCatalogo] = useState("")
  const [loadingCatalogos, setLoadingCatalogos] = useState(true)

  // Estados de cursos abiertos del catálogo seleccionado
  const [selectedCatalogoId, setSelectedCatalogoId] = useState<string | null>(null)
  const [cursosAbiertos, setCursosAbiertos] = useState<Curso[]>([])
  const [loadingCursos, setLoadingCursos] = useState(false)

  // Estados de horarios/matrículas del curso seleccionado
  const [selectedCursoId, setSelectedCursoId] = useState<string | null>(null)
  const [matriculas, setMatriculas] = useState<MatriculaDetallada[]>([])
  const [loadingMatriculas, setLoadingMatriculas] = useState(false)

  // Cargar catálogos
  useEffect(() => {
    const load = async () => {
      setLoadingCatalogos(true)
      try {
        const res = await cursosService.getCatalogos(searchCatalogo || undefined)
        setCatalogos(res.data)
      } catch { toast.error("Error al cargar catálogos") }
      finally { setLoadingCatalogos(false) }
    }
    load()
  }, [searchCatalogo])

  // Al seleccionar catálogo, cargar sus cursos abiertos
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!selectedCatalogoId) { setCursosAbiertos([]); return }
    const load = async () => {
      setLoadingCursos(true)
      try {
        const res = await cursosService.getCursos({ catalogo_curso_id: selectedCatalogoId })
        setCursosAbiertos(res.data || [])
      } catch { toast.error("Error al cargar cursos") }
      finally { setLoadingCursos(false) }
    }
    load()
  }, [selectedCatalogoId])

  // Al seleccionar curso, cargar sus matrículas
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!selectedCursoId) { setMatriculas([]); return }
    const load = async () => {
      setLoadingMatriculas(true)
      try {
        const mats = await cursosService.getMatriculasCurso(selectedCursoId)
        setMatriculas(mats)
      } catch { toast.error("Error al cargar matrículas") }
      finally { setLoadingMatriculas(false) }
    }
    load()
  }, [selectedCursoId])

  const selectedCatalogo = catalogos.find(c => c.id === selectedCatalogoId)
  const selectedCurso = cursosAbiertos.find(c => c.id === selectedCursoId)

  const handleSelectCatalogo = (id: string) => {
    setSelectedCatalogoId(id === selectedCatalogoId ? null : id)
    setSelectedCursoId(null)
    setMatriculas([])
  }

  const handleSelectCurso = (id: string) => {
    setSelectedCursoId(id === selectedCursoId ? null : id)
  }

  return (
    <div className="min-h-[100dvh] flex flex-col overflow-hidden">
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1300px] mx-auto px-6 py-6 space-y-5">
          {/* Breadcrumb + título */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                <span>Matrículas</span>
                {selectedCatalogo && (
                  <>
                    <span>/</span>
                    <span className="font-medium flex items-center gap-1.5" style={{ color: COLORS.CHARCOAL }}>
                      {selectedCatalogo.color && (
                        <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: selectedCatalogo.color }} />
                      )}
                      {selectedCatalogo.nombre}
                    </span>
                  </>
                )}
                {selectedCurso && (
                  <>
                    <span>/</span>
                    <span className="font-medium" style={{ color: COLORS.ACCENT }}>{selectedCurso.nombre}</span>
                  </>
                )}
              </div>
              <h1 className="text-xl font-semibold" style={{ color: COLORS.CHARCOAL }}>
                {selectedCurso ? `Estudiantes: ${selectedCurso.nombre}` : selectedCatalogo ? selectedCatalogo.nombre : "Catálogo de Cursos"}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/matriculas/aprobacion")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-[0.97]"
                style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 12%, white)`, color: COLORS.ACCENT, border: `1.5px solid ${COLORS.ACCENT}30` }}>
                <HugeiconsIcon icon={CheckmarkCircleIcon} size={16} />Aprobación de Matrículas
              </button>
             
            </div>
          </div>

          <div className="flex gap-5">
            {/* Columna izquierda: Catálogos y cursos */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Buscador catálogos */}
              <div className="relative max-w-md">
                <HugeiconsIcon icon={SearchIcon} size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.TEXT_MUTED }} />
                <input type="text" placeholder="Buscar catálogo por nombre..."
                  value={searchCatalogo} onChange={e => setSearchCatalogo(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm outline-none bg-white"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }} />
              </div>

              {/* Lista de catálogos */}
              {loadingCatalogos ? (
                <div className="p-8 text-center" style={{ color: COLORS.TEXT_MUTED }}>Cargando catálogos...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {catalogos.map(cat => (
                    <button key={cat.id} onClick={() => handleSelectCatalogo(cat.id)}
                      className="text-left p-4 rounded-lg border transition-all"
                      style={{
                        borderColor: selectedCatalogoId === cat.id ? COLORS.ACCENT : COLORS.BORDER_SUBTLE,
                        backgroundColor: selectedCatalogoId === cat.id ? `color-mix(in srgb, ${COLORS.ACCENT} 4%, white)` : "white",
                      }}>
                      <p className="text-sm font-semibold truncate" style={{ color: COLORS.CHARCOAL }}>{cat.nombre}</p>
                      <p className="text-xs mt-1 truncate" style={{ color: COLORS.TEXT_MUTED }}>{cat.categoria}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded border" style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}>
                          {cat.modulos_default || 0} módulos
                        </span>
                        {selectedCatalogoId === cat.id && (
                          <span className="text-xs font-medium" style={{ color: COLORS.ACCENT }}>Seleccionado ✓</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Cursos abiertos del catálogo seleccionado */}
              {selectedCatalogoId && (
                <div className="pt-4 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <h2 className="text-sm font-semibold mb-3" style={{ color: COLORS.CHARCOAL }}>
                    Cursos abiertos de {selectedCatalogo?.nombre}
                  </h2>
                  {loadingCursos ? (
                    <div className="p-8 text-center" style={{ color: COLORS.TEXT_MUTED }}>Cargando cursos...</div>
                  ) : cursosAbiertos.length === 0 ? (
                    <div className="p-8 text-center border rounded-xl border-dashed" style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}>
                      No hay cursos abiertos para este catálogo
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {cursosAbiertos.map(curso => (
                        <button key={curso.id} onClick={() => handleSelectCurso(curso.id)}
                          className="text-left p-4 rounded-lg border transition-all"
                          style={{
                            borderColor: selectedCursoId === curso.id ? COLORS.ACCENT : COLORS.BORDER_SUBTLE,
                            backgroundColor: selectedCursoId === curso.id ? `color-mix(in srgb, ${COLORS.ACCENT} 4%, white)` : "white",
                          }}>
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold truncate" style={{ color: COLORS.CHARCOAL }}>{curso.nombre}</p>
                              {curso.fechaInicio && (
                                <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                                  <HugeiconsIcon icon={CalendarIcon} size={12} />
                                  {curso.fechaInicio} → {curso.fechaFin}
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className="text-[10px] px-1.5 py-0.5 rounded border" style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}>
                                  {curso.modalidad}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                                  style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 10%, transparent)`, color: COLORS.ACCENT }}>
                                  Cap: {curso.capacidad}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Columna derecha: Matrículas */}
            <div className="w-[450px] shrink-0">
              {selectedCursoId ? (
                <div className="rounded-xl border sticky top-6" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <div className="p-4 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <h3 className="text-sm font-semibold" style={{ color: COLORS.CHARCOAL }}>Estudiantes matriculados</h3>
                    <p className="text-xs mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
                      {selectedCurso?.nombre}
                    </p>
                  </div>
                  {loadingMatriculas ? (
                    <div className="p-8 text-center" style={{ color: COLORS.TEXT_MUTED }}>Cargando...</div>
                  ) : matriculas.length === 0 ? (
                    <div className="p-8 text-center" style={{ color: COLORS.TEXT_MUTED }}>
                      <HugeiconsIcon icon={UserIcon} size={28} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Sin estudiantes</p>
                    </div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE } as React.CSSProperties}>
                      {matriculas.map((m) => (
                        <div key={m.id} className="p-4 flex items-start gap-3">
                          <div className="size-9 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 10%, transparent)`, color: COLORS.ACCENT }}>
                            <span className="text-xs font-bold">
                              {(m.estudiante?.nombres?.[0] || "?")}{(m.estudiante?.apellidos?.[0] || "")}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate" style={{ color: COLORS.CHARCOAL }}>
                              {m.estudiante?.nombres 
                                ? `${m.estudiante.nombres} ${m.estudiante.apellidos || ""}`
                                : (m.solicitud_inscripcion?.participante_externo?.nombres 
                                  ? `${m.solicitud_inscripcion.participante_externo.nombres} ${m.solicitud_inscripcion.participante_externo.apellidos || ""}`
                                  : "Sin nombre")}
                            </p>
                            <p className="text-xs truncate" style={{ color: COLORS.TEXT_MUTED }}>
                              {m.estudiante?.correo || m.solicitud_inscripcion?.participante_externo?.correo || "—"}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                style={{
                                  backgroundColor: m.estado === "activa" ? `color-mix(in srgb, ${COLORS.ACCENT} 10%, transparent)` : "#f3f4f6",
                                  color: m.estado === "activa" ? COLORS.ACCENT : COLORS.TEXT_MUTED,
                                }}>
                                {m.estado}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border p-8 text-center sticky top-6" style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}>
                  <HugeiconsIcon icon={UserIcon} size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Selecciona un curso</p>
                  <p className="text-xs mt-1">Elige un catálogo y luego un curso para ver sus estudiantes matriculados</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
