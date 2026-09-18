import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { FilterIcon, SearchIcon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { ciudadesService, type Ciudad } from "@/services/ciudades.service"

export interface FilterBarProps {
  onFilterChange?: (filters: {
    ciudad?: string
    modalidad?: string
    estado?: string
    search?: string
  }) => void
}

export function FilterBar({ onFilterChange }: FilterBarProps) {
  const [ciudades, setCiudades] = useState<Ciudad[]>([])
  const [search, setSearch] = useState("")
  const [filtros, setFiltros] = useState({
    ciudad: "",
    modalidad: "",
    estado: "",
  })
  const [cargando, setCargando] = useState(true)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cargar ciudades al montar el componente
  useEffect(() => {
    const cargarCiudades = async () => {
      try {
        const data = await ciudadesService.getCiudadesTodas()
        setCiudades(data)
      } catch (error) {
        console.error("Error cargando ciudades:", error)
      } finally {
        setCargando(false)
      }
    }

    cargarCiudades()
  }, [])

  // Manejar cambios en los filtros
  const handleFilterChange = (key: string, value: string) => {
    const nuevosFiltros = { ...filtros, [key]: value }
    setFiltros(nuevosFiltros)

    // Notificar al padre solo los filtros con valores
    if (onFilterChange) {
      onFilterChange({
        ciudad: nuevosFiltros.ciudad || undefined,
        modalidad: nuevosFiltros.modalidad || undefined,
        estado: nuevosFiltros.estado || undefined,
        search: search || undefined,
      })
    }
  }

  // Manejar cambios en búsqueda
  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      onFilterChange?.({
        ciudad: filtros.ciudad || undefined,
        modalidad: filtros.modalidad || undefined,
        estado: filtros.estado || undefined,
        search: value || undefined,
      })
    }, 300)
  }

  useEffect(() => () => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
  }, [])

  // Limpiar todos los filtros
  const limpiarFiltros = () => {
    const filtroVacio = {
      ciudad: "",
      modalidad: "",
      estado: "",
    }
    setFiltros(filtroVacio)
    setSearch("")

    if (onFilterChange) {
      onFilterChange({})
    }
  }

  const tieneFiltrosActivos = Boolean(filtros.ciudad || filtros.modalidad || filtros.estado || search)

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-wrap items-center gap-3">
      {/* Etiqueta Filtros */}
      <div className="hidden sm:flex items-center gap-2 pr-3 border-r border-slate-200">
        <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#fd761a] flex items-center justify-center">
          <HugeiconsIcon icon={FilterIcon} size={16} />
        </div>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Filtros
        </span>
      </div>

      {/* Input Búsqueda */}
      <div className="relative flex-1 min-w-[200px] sm:min-w-[240px]">
        <HugeiconsIcon
          icon={SearchIcon}
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Buscar cursos..."
          aria-label="Buscar cursos"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-10 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all"
        />
        {search && (
          <button
            type="button"
            onClick={() => handleSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={14} />
          </button>
        )}
      </div>

      {/* Select Ciudad */}
      <div className="relative min-w-[130px]">
        <select
          value={filtros.ciudad}
          aria-label="Filtrar cursos por ciudad"
          onChange={(e) => handleFilterChange("ciudad", e.target.value)}
          disabled={cargando}
          className="w-full appearance-none bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2 pr-8 text-sm font-semibold text-slate-700 outline-none cursor-pointer focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all disabled:opacity-50"
        >
          <option value="">{cargando ? "Cargando..." : "Todas las sedes"}</option>
          {ciudades.map((ciudad) => (
            <option key={ciudad.id} value={ciudad.nombre}>
              {ciudad.nombre}
            </option>
          ))}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
          ▼
        </span>
      </div>

      {/* Select Modalidad */}
      <div className="relative min-w-[130px]">
        <select
          value={filtros.modalidad}
          aria-label="Filtrar cursos por modalidad"
          onChange={(e) => handleFilterChange("modalidad", e.target.value)}
          className="w-full appearance-none bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2 pr-8 text-sm font-semibold text-slate-700 outline-none cursor-pointer focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all"
        >
          <option value="">Modalidad</option>
          <option value="presencial">Presencial</option>
          <option value="virtual">Virtual</option>
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
          ▼
        </span>
      </div>

      {/* Select Estado */}
      <div className="relative min-w-[130px]">
        <select
          value={filtros.estado}
          aria-label="Filtrar cursos por estado"
          onChange={(e) => handleFilterChange("estado", e.target.value)}
          className="w-full appearance-none bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl px-3.5 py-2 pr-8 text-sm font-semibold text-slate-700 outline-none cursor-pointer focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all"
        >
          <option value="">Estado</option>
          <option value="en_progreso">En curso</option>
          <option value="pendiente">Por iniciar</option>
          <option value="completado">Finalizado</option>
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
          ▼
        </span>
      </div>

      {/* Botón Limpiar */}
      {tieneFiltrosActivos && (
        <button
          type="button"
          onClick={limpiarFiltros}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200/60 transition-all ml-auto cursor-pointer"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={14} />
          <span>Limpiar filtros</span>
        </button>
      )}
    </div>
  )
}
