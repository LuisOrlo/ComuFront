import { useState, useEffect, useRef, useMemo } from "react"
import { useNavigate } from "react-router"
import { usePermission } from "@/hooks/usePermission"
import { GraduationCapIcon, BookOpen01Icon, Layers01Icon, UserGroupIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { ChevronRight, Download, FolderPlus, Pencil, Plus, RefreshCw, UserPlus } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { cursosService, type CatalogoCurso, type Curso, type MatriculaDetallada } from "@/services/cursos.service"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { toast } from "sonner"
import { iconMap } from "./components/catalog-icons"
import { CatalogoGrid } from "./components/CatalogoGrid"
import { CursoGrid } from "./components/CursoGrid"
import { EstudiantesTable } from "./components/EstudiantesTable"
import { CollapsedSectionBar } from "./components/CollapsedSectionBar"
import { SectionHeader } from "./components/SectionHeader"
import { getEstudianteData } from "./components/estudiantesHelpers"

export function CatalogosConCursosPage() {
  const navigate = useNavigate()
  const { isAdmin } = usePermission()

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [catalogoToDelete, setCatalogoToDelete] = useState<{ id: string; nombre: string } | null>(null)
  const [deletingCatalogo, setDeletingCatalogo] = useState(false)

  const [catalogos, setCatalogos] = useState<CatalogoCurso[]>([])
  const [searchCatalogo, setSearchCatalogo] = useState("")

  const [selectedCatalogoId, setSelectedCatalogoId] = useState<string | null>(null)
  const [cursos, setCursos] = useState<Curso[]>([])
  const [searchCurso, setSearchCurso] = useState("")
  const [loadingCursos, setLoadingCursos] = useState(false)

  const [selectedCursoId, setSelectedCursoId] = useState<string | null>(null)
  const [matriculas, setMatriculas] = useState<MatriculaDetallada[]>([])
  const [searchEstudiante, setSearchEstudiante] = useState("")
  const [loadingMatriculas, setLoadingMatriculas] = useState(false)
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null)

  const [collapsedCatalogos, setCollapsedCatalogos] = useState(false)
  const [collapsedCursos, setCollapsedCursos] = useState(false)

  const cursosSectionRef = useRef<HTMLDivElement>(null)
  const estudiantesSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await cursosService.getCatalogos(searchCatalogo || undefined)
        setCatalogos(res.data)
      } catch { toast.error("Error al cargar catálogos") }
    }
    load()
  }, [searchCatalogo])

  useEffect(() => {
    if (!selectedCatalogoId) {
      setCursos([])
      setSearchCurso("")
      return
    }
    const load = async () => {
      setLoadingCursos(true)
      try {
        const res = await cursosService.getCursos({
          catalogo_curso_id: selectedCatalogoId,
          search: searchCurso || undefined,
        })
        setCursos(res.data || [])
        setCatalogos((prev) => prev.map((catalogo) => (
          catalogo.id === selectedCatalogoId
            ? { ...catalogo, cursos_count: res.meta.total }
            : catalogo
        )))
      } catch { toast.error("Error al cargar cursos") }
      finally { setLoadingCursos(false) }
    }
    load()
  }, [selectedCatalogoId, searchCurso])

  useEffect(() => {
    if (!selectedCursoId) {
      setMatriculas([])
      setSearchEstudiante("")
      return
    }
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

  // Scroll suave hacia las secciones al navegar entre niveles
  useEffect(() => {
    if (selectedCatalogoId) {
      requestAnimationFrame(() => {
        cursosSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      })
    }
  }, [selectedCatalogoId])

  useEffect(() => {
    if (selectedCursoId) {
      requestAnimationFrame(() => {
        estudiantesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      })
    }
  }, [selectedCursoId])

  const selectedCatalogo = catalogos.find(c => c.id === selectedCatalogoId)
  const selectedCurso = cursos.find(c => c.id === selectedCursoId)

  const filteredMatriculas = useMemo(() => {
    const q = searchEstudiante.trim().toLowerCase()
    return matriculas.filter((m) => {
      const e = getEstudianteData(m)
      if (!e) return false
      const matchesSearch = !q || `${e.nombres} ${e.apellidos}`.toLowerCase().includes(q)
        || e.cedula.toLowerCase().includes(q)
        || (e.correo || "").toLowerCase().includes(q)
      return matchesSearch
    })
  }, [matriculas, searchEstudiante])

  const handleSelectCatalogo = (id: string) => {
    const isSame = id === selectedCatalogoId
    setSelectedCatalogoId(isSame ? null : id)
    setSelectedCursoId(null)
    setMatriculas([])
    setSearchEstudiante("")
    setCollapsedCatalogos(false)
    setCollapsedCursos(false)
  }

  const handleSelectCurso = (id: string) => {
    const isSame = id === selectedCursoId
    setSelectedCursoId(isSame ? null : id)
    setCollapsedCatalogos(true)
    setCollapsedCursos(true)
  }

  const handleBackFromCursos = () => {
    setSelectedCatalogoId(null)
    setSelectedCursoId(null)
    setMatriculas([])
    setCollapsedCatalogos(false)
    setCollapsedCursos(false)
  }

  const handleDeleteCatalogo = (id: string, nombre: string) => {
    setCatalogoToDelete({ id, nombre })
    setShowDeleteConfirm(true)
  }

  const confirmDeleteCatalogo = async () => {
    if (!catalogoToDelete) return
    setDeletingCatalogo(true)
    try {
      await cursosService.eliminarCatalogo(catalogoToDelete.id)
      toast.success("Catálogo eliminado exitosamente")
      setShowDeleteConfirm(false)
      setCatalogoToDelete(null)
      cargarCatalogos()
    } catch {
      toast.error("Error al eliminar el catálogo")
    } finally {
      setDeletingCatalogo(false)
    }
  }

  const cargarCatalogos = async () => {
    try {
      const res = await cursosService.getCatalogos(searchCatalogo || undefined)
      setCatalogos(res.data)
    } catch { toast.error("Error al cargar catálogos") }
  }

  const catalogoIcon = selectedCatalogo?.imagen
    ? iconMap[selectedCatalogo.imagen]
    : undefined

  const activeLevel = selectedCursoId ? 3 : selectedCatalogoId ? 2 : 1

  const goToLevel = (level: number) => {
    if (level === 1) {
      handleBackFromCursos()
      return
    }

    if (level === 2 && selectedCatalogoId) {
      setSelectedCursoId(null)
      setMatriculas([])
      setCollapsedCatalogos(false)
      setCollapsedCursos(false)
      return
    }

    if (level === 3 && selectedCursoId) {
      setCollapsedCatalogos(true)
      setCollapsedCursos(true)
    }
  }

  const handleExport = async (formato: "csv" | "pdf") => {
    if (!selectedCursoId) return
    setExporting(formato)
    try {
      const blob = await cursosService.exportarParticipantesCurso(selectedCursoId, formato)
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `estudiantes-${selectedCursoId}.${formato}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast.success(`Listado exportado en ${formato.toUpperCase()}`)
    } catch {
      toast.error("No se pudo exportar el listado")
    } finally {
      setExporting(null)
    }
  }

  const ocupacionCurso = selectedCurso && selectedCurso.capacidad > 0
    ? Math.round((selectedCurso.estudiantes / selectedCurso.capacidad) * 100)
    : 0

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9ff]" style={{ color: COLORS.CHARCOAL }}>
      <main className="w-full flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
          <section className="flex flex-col gap-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div className="flex flex-col gap-2 max-w-3xl">
                
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: "#0b1c30" }}>
                  Explorar la Academia
                </h1>
                
              </div>

              <div className="flex items-stretch gap-3 flex-wrap lg:flex-nowrap">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white shadow-sm min-w-[170px]">
                  <div className="size-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#e5eeff", color: COLORS.ACCENT }}>
                    <HugeiconsIcon icon={Layers01Icon} size={21} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold uppercase tracking-wide" style={{ color: COLORS.TEXT_MUTED }}>Catálogos</span>
                    <span className="text-xl font-bold" style={{ color: "#0b1c30" }}>{catalogos.length}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white shadow-sm min-w-[170px]">
                  <div className="size-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#ffdbca", color: "#783200" }}>
                    <HugeiconsIcon icon={GraduationCapIcon} size={21} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold uppercase tracking-wide" style={{ color: COLORS.TEXT_MUTED }}>
                      {selectedCatalogo ? "Cursos visibles" : "Cursos seleccionados"}
                    </span>
                    <span className="text-xl font-bold" style={{ color: "#0b1c30" }}>{cursos.length}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="flex items-center gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: "#eff4ff" }}>
                {[
                  { level: 1, label: "Categorías" },
                  { level: 2, label: "Cursos" },
                  { level: 3, label: "Estudiantes" },
                ].map(({ level, label }) => {
                  const enabled = level === 1 || (level === 2 ? !!selectedCatalogoId : !!selectedCursoId)
                  const active = activeLevel === level
                  return (
                    <button
                      key={label}
                      type="button"
                      disabled={!enabled}
                      onClick={() => goToLevel(level)}
                      className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: active ? "#fd761a" : "transparent",
                        color: active ? "white" : COLORS.TEXT_MUTED,
                        boxShadow: active ? "0 2px 5px rgba(253,118,26,.18)" : undefined,
                      }}
                    >
                      <span className="size-4 rounded-full flex items-center justify-center text-[10px]" style={{ backgroundColor: active ? "rgba(255,255,255,.2)" : "#e5eeff" }}>
                        {level}
                      </span>
                      {label}
                    </button>
                  )
                })}
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate("/cursos/nuevo")}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold hover:brightness-95"
                    style={{ backgroundColor: "#e5eeff", color: "#0b1c30" }}
                  >
                    <Plus size={16} />
                    Nuevo curso
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/catalogos/nuevo")}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-white shadow-sm hover:brightness-110"
                    style={{ backgroundColor: "#fd761a" }}
                  >
                    <FolderPlus size={16} />
                    Nuevo catálogo
                  </button>
                </div>
              )}
            </div>
          </section>

          <nav aria-label="Jerarquía de navegación" className="mb-8 px-4 py-3 rounded-xl bg-white shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <button type="button" onClick={() => goToLevel(1)} className="inline-flex items-center gap-1.5 font-semibold hover:opacity-80" style={{ color: activeLevel === 1 ? "#fd761a" : COLORS.TEXT_MUTED }}>
                <HugeiconsIcon icon={Layers01Icon} size={16} />
                Catálogos
              </button>
              {selectedCatalogo && (
                <>
                  <ChevronRight size={14} style={{ color: COLORS.BORDER_SUBTLE }} />
                  <button type="button" onClick={() => goToLevel(2)} className="inline-flex items-center gap-1.5 font-semibold max-w-[240px]" style={{ color: activeLevel === 2 ? "#fd761a" : COLORS.TEXT_MUTED }}>
                    <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: "#eff4ff", color: COLORS.CHARCOAL }}>Nivel 2</span>
                    <span className="truncate">{selectedCatalogo.nombre}</span>
                  </button>
                </>
              )}
              {selectedCurso && (
                <>
                  <ChevronRight size={14} style={{ color: COLORS.BORDER_SUBTLE }} />
                  <span className="inline-flex items-center gap-1.5 font-bold max-w-[260px]" style={{ color: "#0b1c30" }}>
                    <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: "#ffdbca", color: "#783200" }}>Nivel 3</span>
                    <span className="truncate">{selectedCurso.nombre}</span>
                  </span>
                </>
              )}
            </div>
            {(selectedCatalogoId || selectedCursoId) && (
              <button type="button" onClick={() => goToLevel(1)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold hover:brightness-95" style={{ backgroundColor: "#eff4ff", color: COLORS.TEXT_MUTED }}>
                <RefreshCw size={13} />
                Restablecer vista
              </button>
            )}
          </nav>

          {selectedCatalogo && selectedCatalogoId && (
            <section className="mb-8 bg-white p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-center gap-4 min-w-0">
                <div className="size-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `color-mix(in srgb, ${selectedCatalogo.color || COLORS.ACCENT} 14%, white)`, color: selectedCatalogo.color || COLORS.ACCENT }}>
                  {catalogoIcon ? <HugeiconsIcon icon={catalogoIcon} size={26} /> : <HugeiconsIcon icon={BookOpen01Icon} size={26} />}
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] uppercase tracking-wider font-semibold" style={{ color: selectedCatalogo.color || COLORS.ACCENT }}>Catálogo activo</span>
                  <h2 className="text-xl font-bold truncate" style={{ color: "#0b1c30" }}>{selectedCatalogo.nombre}</h2>
                  {selectedCatalogo.descripcion && <p className="text-xs truncate max-w-xl" style={{ color: COLORS.TEXT_MUTED }}>{selectedCatalogo.descripcion}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button type="button" onClick={handleBackFromCursos} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold hover:brightness-95" style={{ backgroundColor: "#eff4ff", color: "#0b1c30" }}>
                  <RefreshCw size={15} /> Cambiar catálogo
                </button>
                {isAdmin && <button type="button" onClick={() => navigate(`/catalogos/${selectedCatalogo.id}/editar`)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold hover:brightness-95" style={{ backgroundColor: "#eff4ff", color: "#0b1c30" }}><Pencil size={14} /> Editar</button>}
                {isAdmin && <button type="button" onClick={() => navigate("/cursos/nuevo")} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white hover:brightness-110" style={{ backgroundColor: "#fd761a" }}><Plus size={15} /> Nuevo curso</button>}
              </div>
            </section>
          )}

          <div className="flex flex-col gap-10">
        {/* SECCIÓN 1: CATÁLOGOS */}
        <section aria-label="Catálogos">
          {collapsedCatalogos && selectedCatalogo ? (
            <div className="animate-fade-slide-down">
              <CollapsedSectionBar
                label={selectedCatalogo.nombre}
                color={selectedCatalogo.color}
                icon={catalogoIcon}
                onExpand={() => setCollapsedCatalogos(false)}
              />
            </div>
          ) : (
            <div className="animate-fade-slide-down">
              <SectionHeader title="CATEGORÍAS" count={catalogos.length} icon={<HugeiconsIcon icon={Layers01Icon} size={18} />} />
              <CatalogoGrid
                catalogos={catalogos}
                selectedId={selectedCatalogoId}
                search={searchCatalogo}
                onSearchChange={setSearchCatalogo}
                onSelect={handleSelectCatalogo}
                onEdit={(id) => navigate(`/catalogos/${id}/editar`)}
                onDelete={handleDeleteCatalogo}
                isAdmin={isAdmin}
              />
            </div>
          )}
        </section>

        {/* SECCIÓN 2: CURSOS (condicional) */}
        {selectedCatalogoId && (
          <section ref={cursosSectionRef} aria-label="Cursos" className="scroll-mt-20">
            {collapsedCursos ? (
              <div className="animate-fade-slide-down">
                <CollapsedSectionBar
                  label={selectedCatalogo?.nombre || "Cursos"}
                  color={selectedCatalogo?.color}
                  icon={GraduationCapIcon}
                  onExpand={() => setCollapsedCursos(false)}
                />
              </div>
            ) : (
              <div className="animate-fade-slide-down">
                <SectionHeader
                  title={`Cursos de "${selectedCatalogo?.nombre || ""}"`}
                  count={cursos.length}
                  color={selectedCatalogo?.color}
                  onBack={handleBackFromCursos}
                  backLabel="Catálogos"
                  icon={<HugeiconsIcon icon={GraduationCapIcon} size={18} />}
                  subtitle={`Mostrando ${cursos.length} cursos de ${selectedCatalogo?.cursos_count ?? cursos.length} programados en este catálogo`}
                  collapsible
                  collapsed={collapsedCursos}
                  onToggleCollapse={() => setCollapsedCursos(true)}
                />
                <CursoGrid
                  cursos={cursos}
                  selectedId={selectedCursoId}
                  search={searchCurso}
                  onSearchChange={setSearchCurso}
                  onSelect={handleSelectCurso}
                  loading={loadingCursos}
                />
              </div>
            )}
          </section>
        )}

        {/* SECCIÓN 3: ESTUDIANTES (condicional) */}
        {selectedCursoId && selectedCurso && (
          <section ref={estudiantesSectionRef} aria-label="Estudiantes" className="scroll-mt-20">
            <div className="animate-fade-slide-down">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                <div className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0"><div className="size-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#eff4ff", color: COLORS.ACCENT }}><HugeiconsIcon icon={Layers01Icon} size={20} /></div><div className="min-w-0"><span className="block text-[10px] font-medium" style={{ color: COLORS.TEXT_MUTED }}>Catálogo seleccionado</span><span className="block text-sm font-bold truncate" style={{ color: "#0b1c30" }}>{selectedCatalogo?.nombre}</span></div></div>
                  <button type="button" onClick={() => goToLevel(1)} className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap hover:brightness-95" style={{ backgroundColor: "#eff4ff", color: COLORS.TEXT_MUTED }}>Cambiar</button>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0"><div className="size-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#ffdbca", color: "#783200" }}><HugeiconsIcon icon={GraduationCapIcon} size={20} /></div><div className="min-w-0"><span className="block text-[10px] font-medium" style={{ color: COLORS.TEXT_MUTED }}>Curso seleccionado</span><span className="block text-sm font-bold truncate" style={{ color: "#0b1c30" }}>{selectedCurso.nombre}</span></div></div>
                  <button type="button" onClick={() => goToLevel(2)} className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap hover:brightness-95" style={{ backgroundColor: "#eff4ff", color: COLORS.TEXT_MUTED }}>Cambiar</button>
                </div>
              </div>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap"><h2 className="text-xl font-bold" style={{ color: "#0b1c30" }}>Estudiantes matriculados</h2><span className="px-2.5 py-1 rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: "#fd761a" }}>{matriculas.length} alumnos</span></div>
                  <div className="flex items-center gap-3 flex-wrap mt-1 text-xs" style={{ color: COLORS.TEXT_MUTED }}><span>Capacidad máxima: <strong style={{ color: "#0b1c30" }}>{selectedCurso.capacidad}</strong></span><span>·</span><span>Ocupación: <strong style={{ color: "#fd761a" }}>{ocupacionCurso}%</strong></span></div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button type="button" onClick={() => void handleExport("pdf")} disabled={!!exporting} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-semibold shadow-sm hover:brightness-110 disabled:opacity-50" style={{ backgroundColor: "#fd761a" }}><Download size={15} />{exporting === "pdf" ? "Exportando..." : "Exportar PDF"}</button>
                  <button type="button" onClick={() => navigate("/matriculas")} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-semibold shadow-sm hover:brightness-110" style={{ backgroundColor: "#131b2e" }}><UserPlus size={15} /> Gestionar matrículas</button>
                </div>
              </div>
              <SectionHeader
                title={`Estudiantes de "${selectedCurso.nombre}"`}
                count={matriculas.length}
                color={selectedCatalogo?.color}
                subtitle={selectedCatalogo?.nombre}
                icon={<HugeiconsIcon icon={UserGroupIcon} size={18} />}
                onBack={() => {
                  setCollapsedCursos(false)
                  setCollapsedCatalogos(false)
                  setSelectedCursoId(null)
                }}
                backLabel="Cursos"
              />
              <EstudiantesTable
                matriculas={filteredMatriculas}
                loading={loadingMatriculas}
                search={searchEstudiante}
                onSearchChange={setSearchEstudiante}
                totalModulos={selectedCurso.totalModulos}
              />
            </div>
          </section>
        )}

          </div>
        </div>
      </main>

      {showDeleteConfirm && catalogoToDelete && (
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          title="Eliminar Catálogo"
          message={`¿Estás seguro de que deseas eliminar el catálogo "${catalogoToDelete.nombre}"?`}
          onConfirm={confirmDeleteCatalogo}
          onCancel={() => setShowDeleteConfirm(false)}
          isLoading={deletingCatalogo}
          confirmText="Eliminar"
          isDangerous={true}
          icon="trash"
        />
      )}
    </div>
  )
}
