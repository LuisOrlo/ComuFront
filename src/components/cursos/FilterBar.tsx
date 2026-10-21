import { useEffect, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { FilterIcon, SearchIcon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { MapPin, Calendar, ChevronLeft, ChevronRight, X } from "lucide-react"
import { ciudadesService, type Ciudad } from "@/services/ciudades.service"

export interface FilterBarProps {
  onFilterChange?: (filters: {
    ciudad?: string
    ciudad_id?: number
    modalidad?: string
    estado?: string
    search?: string
    fecha_desde?: string
    fecha_hasta?: string
  }) => void
}

const MESES = [
  { value: "1", label: "Ene", full: "Enero" },
  { value: "2", label: "Feb", full: "Febrero" },
  { value: "3", label: "Mar", full: "Marzo" },
  { value: "4", label: "Abr", full: "Abril" },
  { value: "5", label: "May", full: "Mayo" },
  { value: "6", label: "Jun", full: "Junio" },
  { value: "7", label: "Jul", full: "Julio" },
  { value: "8", label: "Ago", full: "Agosto" },
  { value: "9", label: "Sep", full: "Septiembre" },
  { value: "10", label: "Oct", full: "Octubre" },
  { value: "11", label: "Nov", full: "Noviembre" },
  { value: "12", label: "Dic", full: "Diciembre" },
]

/**
 * Calcula las fechas límite de inicio y fin a partir del mes y año.
 * Evita toISOString() para no introducir desfases por zona horaria (UTC-5).
 * El último día del mes se calcula con new Date(anio, mes, 0).getDate().
 */
function calcularRangoFechas(mesStr: string, anioStr: string): { fecha_desde?: string; fecha_hasta?: string } {
  if (!mesStr && !anioStr) {
    return { fecha_desde: undefined, fecha_hasta: undefined }
  }

  const anio = anioStr ? parseInt(anioStr, 10) : new Date().getFullYear()

  if (mesStr) {
    const mes = parseInt(mesStr, 10)
    const ultimoDia = new Date(anio, mes, 0).getDate()
    const mesPad = String(mes).padStart(2, "0")
    const ultimoDiaPad = String(ultimoDia).padStart(2, "0")
    return {
      fecha_desde: `${anio}-${mesPad}-01`,
      fecha_hasta: `${anio}-${mesPad}-${ultimoDiaPad}`,
    }
  }

  // Mes en "Todos" + año seleccionado -> año completo
  return {
    fecha_desde: `${anio}-01-01`,
    fecha_hasta: `${anio}-12-31`,
  }
}

export function FilterBar({ onFilterChange }: FilterBarProps) {
  const [ciudades, setCiudades] = useState<Ciudad[]>([])
  const [search, setSearch] = useState("")
  const [filtros, setFiltros] = useState({
    ciudad_id: "",
    modalidad: "",
    estado: "",
    mes: "",
    anio: "",
  })
  const [cargando, setCargando] = useState(true)

  // Estado para el popover de mes y año
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [popoverYear, setPopoverYear] = useState(() => new Date().getFullYear())
  const popoverRef = useRef<HTMLDivElement | null>(null)
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

  // Sincronizar el año del popover cuando se abre
  useEffect(() => {
    if (isCalendarOpen) {
      setPopoverYear(filtros.anio ? parseInt(filtros.anio, 10) : new Date().getFullYear())
    }
  }, [isCalendarOpen, filtros.anio])

  // Cerrar el popover al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!isCalendarOpen) return

    const handlePointerDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsCalendarOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsCalendarOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isCalendarOpen])

  // Notificar cambios de filtros combinados
  const aplicarFiltros = (nuevosFiltros: typeof filtros, searchVal: string = search) => {
    setFiltros(nuevosFiltros)
    const { fecha_desde, fecha_hasta } = calcularRangoFechas(nuevosFiltros.mes, nuevosFiltros.anio)

    if (onFilterChange) {
      onFilterChange({
        ciudad_id: nuevosFiltros.ciudad_id ? Number(nuevosFiltros.ciudad_id) : undefined,
        modalidad: nuevosFiltros.modalidad || undefined,
        estado: nuevosFiltros.estado || undefined,
        fecha_desde,
        fecha_hasta,
        search: searchVal || undefined,
      })
    }
  }

  // Manejar cambios en los filtros generales
  const handleFilterChange = (key: keyof typeof filtros, value: string) => {
    const nuevosFiltros = { ...filtros, [key]: value }
    aplicarFiltros(nuevosFiltros)
  }

  // Selección de mes y año desde el popover
  const handleSelectMes = (mesValor: string) => {
    const nuevosFiltros = {
      ...filtros,
      mes: mesValor,
      anio: String(popoverYear),
    }
    aplicarFiltros(nuevosFiltros)
    setIsCalendarOpen(false)
  }

  // Selección de año completo
  const handleSelectTodoElAnio = (anioValor: number) => {
    const nuevosFiltros = {
      ...filtros,
      mes: "",
      anio: String(anioValor),
    }
    aplicarFiltros(nuevosFiltros)
    setIsCalendarOpen(false)
  }

  // Limpiar solo el filtro de fechas
  const limpiarFechas = () => {
    const nuevosFiltros = {
      ...filtros,
      mes: "",
      anio: "",
    }
    aplicarFiltros(nuevosFiltros)
    setIsCalendarOpen(false)
  }

  // Manejar cambios en búsqueda con debounce
  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      aplicarFiltros(filtros, value)
    }, 300)
  }

  useEffect(() => () => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
  }, [])

  // Limpiar todos los filtros
  const limpiarTodosLosFiltros = () => {
    const filtroVacio = {
      ciudad_id: "",
      modalidad: "",
      estado: "",
      mes: "",
      anio: "",
    }
    setFiltros(filtroVacio)
    setSearch("")
    setIsCalendarOpen(false)

    if (onFilterChange) {
      onFilterChange({})
    }
  }

  const tieneFechaActiva = Boolean(filtros.mes || filtros.anio)
  const tieneFiltrosActivos = Boolean(
    filtros.ciudad_id || filtros.modalidad || filtros.estado || tieneFechaActiva || search
  )

  // Etiqueta para el botón del popover
  const etiquetaFecha = (() => {
    if (filtros.mes && filtros.anio) {
      const m = MESES.find((item) => item.value === filtros.mes)
      return `${m?.full || "Mes"} ${filtros.anio}`
    }
    if (filtros.anio && !filtros.mes) {
      return `Año ${filtros.anio}`
    }
    if (filtros.mes && !filtros.anio) {
      const m = MESES.find((item) => item.value === filtros.mes)
      return `${m?.full || "Mes"} (Actual)`
    }
    return "Mes y Año"
  })()

  const fechaActual = new Date()
  const mesActualNum = String(fechaActual.getMonth() + 1)
  const anioActualNum = fechaActual.getFullYear()

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
      <div className="relative flex-1 min-w-[200px] sm:min-w-[220px]">
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

      {/* Select Ciudad (utiliza MapPin de lucide-react y ciudad_id numérico) */}
      <div className="relative min-w-[150px]">
        <MapPin
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <select
          value={filtros.ciudad_id}
          aria-label="Filtrar cursos por ciudad"
          onChange={(e) => handleFilterChange("ciudad_id", e.target.value)}
          disabled={cargando}
          className="w-full appearance-none bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl pl-8.5 pr-8 py-2 text-sm font-semibold text-slate-700 outline-none cursor-pointer focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20 transition-all disabled:opacity-50"
        >
          <option value="">{cargando ? "Cargando..." : "Todas las ciudades"}</option>
          {ciudades.map((ciudad) => (
            <option key={ciudad.id} value={String(ciudad.id)}>
              {ciudad.nombre}
            </option>
          ))}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
          ▼
        </span>
      </div>

      {/* Select Modalidad */}
      <div className="relative min-w-[125px]">
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
      <div className="relative min-w-[125px]">
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

      {/* Popover Calendario de Mes y Año */}
      <div className="relative" ref={popoverRef}>
        <button
          type="button"
          onClick={() => setIsCalendarOpen((prev) => !prev)}
          aria-expanded={isCalendarOpen}
          aria-label="Filtrar por mes y año"
          className={`h-[38px] px-3.5 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer select-none ${
            tieneFechaActiva
              ? "bg-orange-50/70 border-[#fd761a] text-[#fd761a] shadow-xs"
              : "bg-slate-50 hover:bg-slate-100/70 focus:bg-white border-slate-200 text-slate-700"
          }`}
        >
          <Calendar size={15} className={tieneFechaActiva ? "text-[#fd761a]" : "text-slate-400"} />
          <span>{etiquetaFecha}</span>
          {tieneFechaActiva ? (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                limpiarFechas()
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation()
                  limpiarFechas()
                }
              }}
              title="Quitar filtro de fecha"
              className="p-0.5 rounded-full hover:bg-orange-200/50 text-[#fd761a] transition-colors ml-0.5 cursor-pointer"
            >
              <X size={13} />
            </span>
          ) : (
            <span className="text-slate-400 text-xs ml-0.5">▼</span>
          )}
        </button>

        {isCalendarOpen && (
          <div className="absolute z-50 mt-2 left-0 sm:left-auto sm:right-0 w-[280px] bg-white border border-slate-200/90 rounded-2xl shadow-xl p-3.5 space-y-3">
            {/* Cabecera del popover: Navegación de Año (cualquier año) */}
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={() => setPopoverYear((y) => y - 1)}
                className="size-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                title="Año anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                <span>Año</span>
                <input
                  type="number"
                  value={popoverYear}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10)
                    if (!isNaN(val)) setPopoverYear(val)
                  }}
                  className="w-16 text-center font-bold text-slate-900 bg-slate-100 hover:bg-slate-200/60 focus:bg-white border border-transparent focus:border-[#fd761a] rounded-lg py-0.5 outline-none focus:ring-2 focus:ring-[#fd761a]/20 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setPopoverYear((y) => y + 1)}
                className="size-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
                title="Año siguiente"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Grilla de 12 Meses */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {MESES.map((m) => {
                const isSelected = filtros.mes === m.value && Number(filtros.anio) === popoverYear
                const isCurrentMonth = m.value === mesActualNum && popoverYear === anioActualNum

                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => handleSelectMes(m.value)}
                    className={`py-2 px-1 text-xs font-semibold rounded-xl text-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#fd761a] text-white font-bold shadow-xs hover:bg-[#e06310]"
                        : isCurrentMonth
                          ? "bg-orange-50 text-[#fd761a] font-bold border border-orange-200/70 hover:bg-orange-100/70"
                          : "bg-slate-50 hover:bg-slate-100/80 text-slate-700"
                    }`}
                    title={m.full}
                  >
                    {m.label}
                  </button>
                )
              })}
            </div>

            {/* Acciones del pie */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => handleSelectTodoElAnio(popoverYear)}
                className="font-bold text-[#fd761a] hover:underline cursor-pointer"
              >
                Todo el año {popoverYear}
              </button>
              {tieneFechaActiva && (
                <button
                  type="button"
                  onClick={limpiarFechas}
                  className="font-semibold text-rose-500 hover:text-rose-700 hover:underline cursor-pointer"
                >
                  Limpiar fecha
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Botón Limpiar Todos */}
      {tieneFiltrosActivos && (
        <button
          type="button"
          onClick={limpiarTodosLosFiltros}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200/60 transition-all ml-auto cursor-pointer"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={14} />
          <span>Limpiar filtros</span>
        </button>
      )}
    </div>
  )
}
