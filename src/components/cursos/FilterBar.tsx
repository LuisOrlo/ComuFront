import { useEffect, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { FilterIcon, SearchIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { ciudadesService, type Ciudad } from "@/services/ciudades.service"
import { FilterArrow } from "./FilterArrow"

const selectClasses =
  "appearance-none bg-white border rounded-lg px-3 py-2 text-sm outline-none cursor-pointer min-w-[130px] select-none"

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
    if (onFilterChange) {
      onFilterChange({
        ciudad: filtros.ciudad || undefined,
        modalidad: filtros.modalidad || undefined,
        estado: filtros.estado || undefined,
        search: value || undefined,
      })
    }
  }

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

  return (
    <div
      className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border bg-white"
      style={{ borderColor: COLORS.BORDER_SUBTLE }}
    >
      <div className="flex items-center gap-1.5 mr-1">
        <HugeiconsIcon icon={FilterIcon} size={16} className="text-[--muted-foreground]" />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>
          Filtros
        </span>
      </div>

      {/* Ciudad */}
      <div className="relative">
        <select
          value={filtros.ciudad}
          onChange={(e) => handleFilterChange("ciudad", e.target.value)}
          className={selectClasses}
          style={{
            borderColor: COLORS.BORDER_SUBTLE,
            color: COLORS.CHARCOAL,
            transition: "border-color 180ms ease-out, box-shadow 180ms ease-out",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = COLORS.ACCENT
            e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.ACCENT}15`
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE
            e.currentTarget.style.boxShadow = "none"
          }}
          disabled={cargando}
        >
          <option value="">
            {cargando ? "Cargando..." : "Ciudad"}
          </option>
          {ciudades.map((ciudad) => (
            <option key={ciudad.id} value={ciudad.nombre}>
              {ciudad.nombre}
            </option>
          ))}
        </select>
        <FilterArrow />
      </div>

      {/* Modalidad */}
      <div className="relative">
        <select
          value={filtros.modalidad}
          onChange={(e) => handleFilterChange("modalidad", e.target.value)}
          className={selectClasses}
          style={{
            borderColor: COLORS.BORDER_SUBTLE,
            color: COLORS.CHARCOAL,
            transition: "border-color 180ms ease-out, box-shadow 180ms ease-out",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = COLORS.ACCENT
            e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.ACCENT}15`
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE
            e.currentTarget.style.boxShadow = "none"
          }}
        >
          <option value="">Modalidad</option>
          <option value="presencial">Presencial</option>
          <option value="virtual">Virtual</option>
        </select>
        <FilterArrow />
      </div>

      {/* Estado */}
      <div className="relative">
        <select
          value={filtros.estado}
          onChange={(e) => handleFilterChange("estado", e.target.value)}
          className={selectClasses}
          style={{
            borderColor: COLORS.BORDER_SUBTLE,
            color: COLORS.CHARCOAL,
            transition: "border-color 180ms ease-out, box-shadow 180ms ease-out",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = COLORS.ACCENT
            e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.ACCENT}15`
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE
            e.currentTarget.style.boxShadow = "none"
          }}
        >
          <option value="">Estado</option>
          <option value="en_progreso">En progreso</option>
          <option value="pendiente">Pendiente</option>
          <option value="completado">Completado</option>
        </select>
        <FilterArrow />
      </div>

      {/* Input Búsqueda */}
      <div className="relative flex-1 min-w-[200px] md:min-w-[250px]">
        <div className="relative">
          <HugeiconsIcon
            icon={SearchIcon}
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[--muted-foreground]"
            style={{ color: COLORS.TEXT_MUTED }}
          />
          <input
            type="text"
            placeholder="Buscar cursos..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-sm border rounded-lg outline-none transition-all duration-180 ease-out"
            style={{
              borderColor: COLORS.BORDER_SUBTLE,
              color: COLORS.CHARCOAL,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = COLORS.ACCENT
              e.currentTarget.style.boxShadow = `0 0 0 3px ${COLORS.ACCENT}15`
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE
              e.currentTarget.style.boxShadow = "none"
            }}
          />
        </div>
      </div>

      {/* Botón Limpiar */}
      <button
        onClick={limpiarFiltros}
        className="ml-auto text-xs font-medium transition-colors duration-180 ease-out hover:underline"
        style={{ color: COLORS.ACCENT }}
      >
        Limpiar filtros
      </button>
    </div>
  )
}
