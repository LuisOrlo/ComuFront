import { useState, useEffect } from "react"
import { useNavigate } from "react-router"
import { usePermission } from "@/hooks/usePermission"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AddCircleIcon,
  GridViewIcon,
  Table01Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { FilterBar } from "@/components/cursos/FilterBar"
import { CourseTable, type Curso } from "@/components/cursos/CourseTable"
import { CourseCardGrid } from "@/components/cursos/CourseCardGrid"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { cursosService, type CursoFilters } from "@/services/cursos.service"
import { toast } from "sonner"

type Vista = "tabla" | "cards"

export function CursosPage() {
  const navigate = useNavigate()
  const { isAdmin } = usePermission()
  const [vista, setVista] = useState<Vista>("tabla")
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para confirmación de eliminación
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [cursoToDelete, setCursoToDelete] = useState<{ id: string; nombre: string } | null>(null)
  const [deletingCurso, setDeletingCurso] = useState(false)
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [perPage, setPerPage] = useState(15)

  // Filtros
  const [filtros, setFiltros] = useState<CursoFilters>({})

  const cargarCursos = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await cursosService.getCursos(filtros, currentPage)
      setCursos(response.data)
      setTotal(response.meta.total ?? 0)
      setPerPage(response.meta.per_page ?? 15)
      setCurrentPage(response.meta.current_page ?? 1)
      setTotalPages(response.meta.last_page ?? 1)
    } catch (err) {
      console.error("Error cargando cursos:", err)
      setError("Error al cargar los cursos. Por favor, intenta de nuevo.")
      setCursos([])
    } finally {
      setLoading(false)
    }
  }

  // Cargar cursos cuando cambian página o filtros
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarCursos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filtros])

  const handleFilterChange = (nuevosFiltros: CursoFilters) => {
    setFiltros(nuevosFiltros)
    setCurrentPage(1) // Reiniciar a página 1 cuando hay cambios en filtros
  }

  const handleViewCurso = async (id: string) => {
    navigate(`/cursos/${id}`)
  }

  const handleEditCurso = (id: string) => {
    navigate(`/cursos/${id}/editar`)
  }

  const handleDeleteCurso = (id: string, nombre: string) => {
    setCursoToDelete({ id, nombre })
    setShowDeleteConfirm(true)
  }

  const confirmDeleteCurso = async () => {
    if (!cursoToDelete) return
    setDeletingCurso(true)
    try {
      await cursosService.eliminarCursoAbierto(cursoToDelete.id)
      toast.success("Curso eliminado exitosamente")
      setShowDeleteConfirm(false)
      setCursoToDelete(null)
      cargarCursos()
    } catch {
      toast.error("Error al eliminar el curso")
    } finally {
      setDeletingCurso(false)
    }
  }

  const irAPagina = (pagina: number) => {
    if (pagina >= 1 && pagina <= totalPages) {
      setCurrentPage(pagina)
    }
  }

  const inicio = (currentPage - 1) * perPage + 1
  const fin = Math.min(currentPage * perPage, total)

  // Generar botones de paginación
  const paginasBotones: number[] = []
  const maxBotones = 5
  let desde = Math.max(1, currentPage - Math.floor(maxBotones / 2))
  const hasta = Math.min(totalPages, desde + maxBotones - 1)

  if (hasta - desde + 1 < maxBotones) {
    desde = Math.max(1, hasta - maxBotones + 1)
  }

  for (let i = desde; i <= hasta; i++) {
    paginasBotones.push(i)
  }

  return (
    <div className="min-h-[100dvh] flex flex-col overflow-hidden">
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-5">
          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl font-semibold" style={{ color: COLORS.CHARCOAL }}>
                Cursos Activos
              </h1>
              
            </div>
            {isAdmin && (
            <button
              onClick={() => navigate("/cursos/nuevo")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-all duration-200 active:scale-[0.97] select-none"
              style={{
                backgroundColor: COLORS.ACCENT,
                boxShadow: `0 0 15px ${COLORS.ACCENT}25`,
              }}
            >
              <HugeiconsIcon icon={AddCircleIcon} size={18} />
              Nuevo Curso
            </button>
            )}
          </header>

          {/* Filtros */}
          <FilterBar onFilterChange={handleFilterChange} />

          {/* Controles de vista y contador */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 rounded-lg border p-0.5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <button
                onClick={() => setVista("tabla")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-180 ease-out"
                style={{
                  backgroundColor: vista === "tabla" ? COLORS.CHARCOAL : "transparent",
                  color: vista === "tabla" ? "white" : COLORS.TEXT_MUTED,
                }}
              >
                <HugeiconsIcon icon={Table01Icon} size={14} />
                Tabla
              </button>
              <button
                onClick={() => setVista("cards")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-180 ease-out"
                style={{
                  backgroundColor: vista === "cards" ? COLORS.CHARCOAL : "transparent",
                  color: vista === "cards" ? "white" : COLORS.TEXT_MUTED,
                }}
              >
                <HugeiconsIcon icon={GridViewIcon} size={14} />
                Cards
              </button>
            </div>

            <span className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
              Mostrando {total > 0 ? inicio : 0} - {fin} de {total} cursos
            </span>
          </div>

          {/* Estado de carga */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <div
                  className="size-8 rounded-full border-2 border-transparent animate-spin"
                  style={{
                    borderTopColor: COLORS.ACCENT,
                    borderRightColor: COLORS.ACCENT,
                  }}
                />
                <span style={{ color: COLORS.TEXT_MUTED }}>Cargando cursos...</span>
              </div>
            </div>
          )}

          {/* Estado de error */}
          {error && !loading && (
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: "oklch(0.50 0.12 10 / 0.12)",
                borderColor: "oklch(0.50 0.12 10 / 0.20)",
              }}
            >
              <p style={{ color: "oklch(0.50 0.12 10)" }}>{error}</p>
              <button
                onClick={cargarCursos}
                className="mt-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors duration-180"
                style={{
                  backgroundColor: "oklch(0.50 0.12 10 / 0.20)",
                  color: "oklch(0.50 0.12 10)",
                }}
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Sin resultados */}
          {!loading && cursos.length === 0 && !error && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-2">
                <p style={{ color: COLORS.TEXT_MUTED }}>No hay cursos disponibles</p>
                <button
                  onClick={() => handleFilterChange({})}
                  className="text-xs font-medium transition-colors duration-180 ease-out hover:underline"
                  style={{ color: COLORS.ACCENT }}
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
          )}

          {/* Tabla o Cards */}
          {!loading && cursos.length > 0 && (
            vista === "tabla" ? (
              <CourseTable cursos={cursos} onView={handleViewCurso} onEdit={isAdmin ? handleEditCurso : undefined} onDelete={isAdmin ? (id) => { const c = cursos.find(x => x.id === id); handleDeleteCurso(id, c?.nombre || "curso") } : undefined} />
            ) : (
              <CourseCardGrid cursos={cursos} />
            )
          )}

          {/* Paginación */}
          {!loading && total > 0 && (
            <div className="flex items-center justify-between pt-2 pb-4">
              <span className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                Mostrando {inicio} - {fin} de {total} cursos
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => irAPagina(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="size-8 flex items-center justify-center rounded-lg transition-colors duration-150"
                  style={{
                    backgroundColor: "oklch(0.97 0 0)",
                    color: COLORS.TEXT_MUTED,
                    opacity: currentPage === 1 ? 0.4 : 1,
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  }}
                >
                  <HugeiconsIcon icon={ChevronLeftIcon} size={16} />
                </button>

                {paginasBotones.map((pagina) => (
                  <button
                    key={pagina}
                    onClick={() => irAPagina(pagina)}
                    className="size-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors duration-150"
                    style={{
                      backgroundColor:
                        pagina === currentPage ? COLORS.ACCENT : "oklch(0.97 0 0)",
                      color: pagina === currentPage ? "white" : COLORS.TEXT_MUTED,
                    }}
                  >
                    {pagina}
                  </button>
                ))}

                <button
                  onClick={() => irAPagina(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="size-8 flex items-center justify-center rounded-lg transition-colors duration-150"
                  style={{
                    backgroundColor: "oklch(0.97 0 0)",
                    color: COLORS.TEXT_MUTED,
                    opacity: currentPage === totalPages ? 0.4 : 1,
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  }}
                >
                  <HugeiconsIcon icon={ChevronRightIcon} size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Eliminar Curso"
        message={`¿Estás seguro de que deseas eliminar el curso "${cursoToDelete?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="No, cancelar"
        isDangerous={true}
        isLoading={deletingCurso}
        icon="trash"
        onConfirm={confirmDeleteCurso}
        onCancel={() => {
          setShowDeleteConfirm(false)
          setCursoToDelete(null)
        }}
      />
    </div>
  )
}
