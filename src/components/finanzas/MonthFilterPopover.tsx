import { useEffect, useRef, useState } from "react"
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react"

export const MESES = [
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

export function calcularRangoFechas(
  mesStr: string,
  anioStr: string
): { fecha_desde?: string; fecha_hasta?: string } {
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

  return {
    fecha_desde: `${anio}-01-01`,
    fecha_hasta: `${anio}-12-31`,
  }
}

export interface MonthFilterPopoverProps {
  mes: string
  anio: string
  onChange: (mes: string, anio: string, rango: { fecha_desde?: string; fecha_hasta?: string }) => void
}

export function MonthFilterPopover({ mes, anio, onChange }: MonthFilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [popoverYear, setPopoverYear] = useState(() => (anio ? parseInt(anio, 10) : new Date().getFullYear()))
  const popoverRef = useRef<HTMLDivElement | null>(null)

  const anioActualNum = new Date().getFullYear()
  const mesActualNum = String(new Date().getMonth() + 1)

  useEffect(() => {
    if (isOpen) {
      setPopoverYear(anio ? parseInt(anio, 10) : new Date().getFullYear())
    }
  }, [isOpen, anio])

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  const tieneFechaActiva = Boolean(mes || anio)

  const etiquetaFecha = (() => {
    if (mes && anio) {
      const mObj = MESES.find((m) => m.value === mes)
      return `${mObj?.full || mes} ${anio}`
    }
    if (anio) return `Año ${anio}`
    return "Mes y Año"
  })()

  const handleSelectMes = (mesValor: string) => {
    const yearStr = String(popoverYear)
    const rango = calcularRangoFechas(mesValor, yearStr)
    onChange(mesValor, yearStr, rango)
    setIsOpen(false)
  }

  const handleSelectTodoElAnio = (year: number) => {
    const yearStr = String(year)
    const rango = calcularRangoFechas("", yearStr)
    onChange("", yearStr, rango)
    setIsOpen(false)
  }

  const handleLimpiar = () => {
    onChange("", "", { fecha_desde: undefined, fecha_hasta: undefined })
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Filtrar por mes y año"
        className={`h-9 px-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer select-none ${
          tieneFechaActiva
            ? "bg-orange-50/80 border-[#fd761a] text-[#fd761a] shadow-2xs font-bold"
            : "bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700"
        }`}
      >
        <Calendar size={14} className={tieneFechaActiva ? "text-[#fd761a]" : "text-slate-400"} />
        <span>{etiquetaFecha}</span>
        {tieneFechaActiva ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              handleLimpiar()
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation()
                handleLimpiar()
              }
            }}
            title="Quitar filtro de mes"
            className="p-0.5 rounded-full hover:bg-orange-200/60 text-[#fd761a] transition-colors ml-0.5 cursor-pointer"
          >
            <X size={12} />
          </span>
        ) : (
          <span className="text-slate-400 text-[10px] ml-0.5">▼</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 left-0 sm:left-auto sm:right-0 w-[270px] bg-white border border-slate-200/90 rounded-2xl shadow-xl p-3.5 space-y-3">
          {/* Cabecera del popover: Navegación de Año */}
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => setPopoverYear((y) => y - 1)}
              className="size-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
              title="Año anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
              <span>Año</span>
              <input
                type="number"
                value={popoverYear}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10)
                  if (!isNaN(val)) setPopoverYear(val)
                }}
                className="w-16 text-center font-bold text-slate-900 bg-slate-100 hover:bg-slate-200/60 focus:bg-white border border-transparent focus:border-[#fd761a] rounded-lg py-0.5 outline-none focus:ring-2 focus:ring-[#fd761a]/20 transition-all text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
              const isSelected = mes === m.value && Number(anio) === popoverYear
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
              className="font-bold text-[#fd761a] hover:underline cursor-pointer text-[11px]"
            >
              Todo el año {popoverYear}
            </button>
            {tieneFechaActiva && (
              <button
                type="button"
                onClick={handleLimpiar}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-[11px]"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
