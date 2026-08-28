import { useState, useEffect, useRef, useMemo } from "react"
import { useNavigate } from "react-router"
import { usePermission } from "@/hooks/usePermission"
import { GraduationCapIcon, BookOpen01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Plus } from "lucide-react"
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
    if (!q) return matriculas
    return matriculas.filter((m) => {
      const e = getEstudianteData(m)
      if (!e) return false
      return `${e.nombres} ${e.apellidos}`.toLowerCase().includes(q)
        || e.cedula.toLowerCase().includes(q)
        || (e.correo || "").toLowerCase().includes(q)
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50/30">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b shrink-0"
        style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight truncate" style={{ color: COLORS.CHARCOAL }}>
              Explorar la Academia
            </h1>
            <p className="text-xs mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
              {catalogos.length} catálogos &middot; {cursos.length} cursos activos
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => navigate("/catalogos/nuevo")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.97] shadow-lg shrink-0"
              style={{ backgroundColor: COLORS.ACCENT }}
            >
              <Plus size={16} />
              Nuevo Catálogo
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl w-full mx-auto px-4 py-6 flex-1 flex flex-col gap-8">
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
              <SectionHeader title="Catálogos" count={catalogos.length} />
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
              <SectionHeader
                title={`Estudiantes de "${selectedCurso.nombre}"`}
                count={matriculas.length}
                color={selectedCatalogo?.color}
                subtitle={selectedCatalogo?.nombre}
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
              />
            </div>
          </section>
        )}

        {/* Placeholder inicial */}
        {!selectedCatalogoId && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <HugeiconsIcon icon={BookOpen01Icon} size={40} style={{ color: COLORS.TEXT_MUTED }} />
            <p className="mt-3 text-sm font-medium" style={{ color: COLORS.TEXT_MUTED }}>
              Selecciona un catálogo arriba para ver sus cursos
            </p>
          </div>
        )}
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