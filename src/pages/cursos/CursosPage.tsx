import { useState } from "react"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { useNavigate } from "react-router"
import { usePermission } from "@/hooks/usePermission"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AddCircleIcon,
  GridViewIcon,
  Table01Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Book02Icon,
} from "@hugeicons/core-free-icons"
import { FilterBar } from "@/components/cursos/FilterBar"
import { CourseTable, type Curso } from "@/components/cursos/CourseTable"
import { CourseCardGrid } from "@/components/cursos/CourseCardGrid"
import { cursosService, type CursoFilters } from "@/services/cursos.service"

type Vista = "tabla" | "cards"

export function CursosPage() {
  const navigate = useNavigate()
  const { isAdmin } = usePermission()
  const [vista, setVista] = useState<Vista>("tabla")
  // Paginación
  const [currentPage, setCurrentPage] = useState(1)

  // Filtros
  const [filtros, setFiltros] = useState<CursoFilters>({})
  const cursosQuery = useQuery({
    queryKey: ["cursos", "listado", filtros, currentPage],
    queryFn: () => cursosService.getCursos(filtros, currentPage),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })
  const cursos: Curso[] = cursosQuery.data?.data ?? []
  const total = cursosQuery.data?.meta.total ?? 0
  const perPage = cursosQuery.data?.meta.per_page ?? 15
  const totalPages = cursosQuery.data?.meta.last_page ?? 1
  const loading = cursosQuery.isLoading
  const error = cursosQuery.isError ? "Error al cargar los cursos. Por favor, intenta de nuevo." : null

  const handleFilterChange = (nuevosFiltros: CursoFilters) => {
    setFiltros(nuevosFiltros)
    setCurrentPage(1) // Reiniciar a página 1 cuando hay cambios en filtros
  }

  const handleViewCurso = (id: string) => {
    navigate(`/cursos/${id}`)
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
    <div className="min-h-[100dvh] flex flex-col overflow-hidden bg-slate-50/50">
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Header */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Cursos
              </h1>
            </div>
            {isAdmin && (
              <button
                onClick={() => navigate("/cursos/nuevo")}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[#fd761a] hover:bg-[#e06310] shadow-sm shadow-[#fd761a]/30 transition-all active:scale-95 cursor-pointer select-none"
              >
                <HugeiconsIcon icon={AddCircleIcon} size={18} />
                <span>Nuevo Curso</span>
              </button>
            )}
          </header>

          {/* Filtros */}
          <FilterBar onFilterChange={handleFilterChange} />

          {/* Controles de vista y contador */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                onClick={() => setVista("tabla")}
                aria-pressed={vista === "tabla"}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  vista === "tabla"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <HugeiconsIcon icon={Table01Icon} size={14} />
                <span>Tabla</span>
              </button>
              <button
                onClick={() => setVista("cards")}
                aria-pressed={vista === "cards"}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  vista === "cards"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <HugeiconsIcon icon={GridViewIcon} size={14} />
                <span>Tarjetas</span>
              </button>
            </div>

            <span className="text-xs font-semibold text-slate-500">
              Mostrando <span className="text-slate-800 font-bold">{total > 0 ? inicio : 0} - {fin}</span> de{" "}
              <span className="text-slate-800 font-bold">{total}</span> cursos
            </span>
          </div>

          {/* Estado de carga */}
          {loading && (
            <div className="flex items-center justify-center py-24 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex flex-col items-center gap-3">
                <div className="size-9 rounded-full border-3 border-orange-100 border-t-[#fd761a] animate-spin" />
                <span className="text-sm font-semibold text-slate-500">Cargando cursos...</span>
              </div>
            </div>
          )}

          {/* Estado de error */}
          {error && !loading && (
            <div className="p-6 rounded-2xl bg-rose-50/70 border border-rose-200 text-rose-800 shadow-xs">
              <p className="text-sm font-semibold">{error}</p>
              <button
                onClick={() => { void cursosQuery.refetch() }}
                className="mt-3 text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-2xs cursor-pointer"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Sin resultados */}
          {!loading && cursos.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200/80 shadow-xs text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#fd761a] flex items-center justify-center mb-3">
                <HugeiconsIcon icon={Book02Icon} size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                No se encontraron cursos
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mb-4">
                No hay cursos disponibles que coincidan con los filtros aplicados.
              </p>
              <button
                onClick={() => handleFilterChange({})}
                className="text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Limpiar filtros
              </button>
            </div>
          )}

          {/* Tabla o Cards */}
          {!loading && cursos.length > 0 && (
            vista === "tabla" ? (
              <CourseTable cursos={cursos} onView={handleViewCurso} />
            ) : (
              <CourseCardGrid
                cursos={cursos}
                onView={handleViewCurso}
                onNewCurso={isAdmin ? () => navigate("/cursos/nuevo") : undefined}
              />
            )
          )}

          {/* Paginación */}
          {!loading && total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 pb-6">
              <span className="text-xs font-semibold text-slate-500 order-2 sm:order-1">
                Mostrando {inicio} - {fin} de {total} cursos
              </span>
              <div className="flex items-center gap-1.5 order-1 sm:order-2">
                <button
                  onClick={() => irAPagina(currentPage - 1)}
                  aria-label="Página anterior"
                  disabled={currentPage === 1}
                  className="size-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <HugeiconsIcon icon={ChevronLeftIcon} size={16} />
                </button>

                {paginasBotones.map((pagina) => (
                  <button
                    key={pagina}
                    onClick={() => irAPagina(pagina)}
                    aria-label={`Ir a la página ${pagina}`}
                    aria-current={pagina === currentPage ? "page" : undefined}
                    className={`size-9 flex items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      pagina === currentPage
                        ? "bg-[#fd761a] text-white shadow-xs shadow-[#fd761a]/30"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
                    }`}
                  >
                    {pagina}
                  </button>
                ))}

                <button
                  onClick={() => irAPagina(currentPage + 1)}
                  aria-label="Página siguiente"
                  disabled={currentPage === totalPages}
                  className="size-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <HugeiconsIcon icon={ChevronRightIcon} size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
