import { useState, useRef, useEffect, type KeyboardEvent } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserIcon, ImageAdd02Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { ECUADOR_CITIES } from "@/data/ciudades-ecuador"

export interface EstudianteData {
  tipo_id: "cedula" | "dni"
  nombres: string
  apellidos: string
  cedula: string
  telefono: string
  correo: string
  ocupacion: string
  direccion: string
  ciudad: string
  estado_civil: string
  edad: string
  nivel_educativo: string
}

interface DatosEstudianteStepProps {
  estudiante: EstudianteData
  errors: Record<string, string>
  touched: Record<string, boolean>
  updateEstudiante: (campo: string, valor: string) => void
  blurEstudiante: (campo: string) => void
  setEstudiante: React.Dispatch<React.SetStateAction<EstudianteData>>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  setTouched: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  cedulaFile: File | null
  setCedulaFile: (file: File | null) => void
  cedulaPreview: string | null
  setCedulaPreview: (preview: string | null) => void
  canProceed: boolean
  onNext: () => void
  validateField: (campo: string, valor: string) => string | null
}

const nivelesEducativos = [
  { value: "educacion inicial", label: "Educación Inicial" },
  { value: "general basica", label: "Educación General Básica" },
  { value: "bachillerato", label: "Bachillerato" },
  { value: "tecnico/tecnologico", label: "Técnico / Tecnológico" },
  { value: "superior", label: "Superior" },
  { value: "otro", label: "Otro" },
]

const placeholders: Record<string, string> = {
  cedula: "Cédula o DNI",
  nombres: "Juan",
  apellidos: "Pérez",
  telefono: "0987654321",
  correo: "correo@ejemplo.com",
}

export function DatosEstudianteStep({
  estudiante,
  errors,
  touched,
  updateEstudiante,
  blurEstudiante,
  setEstudiante,
  setErrors,
  setTouched,

  setCedulaFile,
  cedulaPreview,
  setCedulaPreview,
  canProceed,
  onNext,
  validateField,
}: DatosEstudianteStepProps) {
  const [ciudadOpen, setCiudadOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const cedulaInputRef = useRef<HTMLInputElement>(null)
  const ciudadInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filteredCities = ECUADOR_CITIES.filter(c => !estudiante.ciudad || c.toUpperCase().includes(estudiante.ciudad.toUpperCase()))

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ciudadInputRef.current && !ciudadInputRef.current.parentElement?.contains(e.target as Node)) {
        setCiudadOpen(false)
        setFocusedIndex(-1)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => {
    if (focusedIndex >= 0 && dropdownRef.current) {
      const button = dropdownRef.current.children[focusedIndex] as HTMLButtonElement
      if (button) {
        button.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [focusedIndex])

  const handleCiudadKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!ciudadOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setCiudadOpen(true)
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIndex(prev => (prev < filteredCities.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (focusedIndex >= 0 && focusedIndex < filteredCities.length) {
        selectCiudad(filteredCities[focusedIndex])
      }
    } else if (e.key === 'Escape') {
      setCiudadOpen(false)
      setFocusedIndex(-1)
    }
  }

  const selectCiudad = (c: string) => {
    setEstudiante(prev => ({ ...prev, ciudad: c.toUpperCase() }))
    setCiudadOpen(false)
    setFocusedIndex(-1)
    setErrors(prev => {
      const n = { ...prev }
      delete n.ciudad
      return n
    })
  }

  return (
    <div>
      <h2 className="text-sm font-semibold flex items-center gap-2 mb-4" style={{ color: COLORS.CHARCOAL }}>
        <HugeiconsIcon icon={UserIcon} size={16} style={{ color: COLORS.ACCENT }} />Datos del Estudiante
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
            <label className="block text-xs font-medium">{estudiante.tipo_id === "cedula" ? "Cédula" : "DNI"}</label>
            <div className="flex p-0.5 rounded-lg bg-gray-100 border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              {["cedula", "dni"].map((type) => (
                <button key={type} type="button" onClick={() => { setEstudiante(prev => ({ ...prev, tipo_id: type as "cedula" | "dni", cedula: "" })); setErrors(prev => { const n = { ...prev }; delete n.cedula; return n }); setTouched(prev => { const n = { ...prev }; delete n.cedula; return n }) }}
                  className="px-2 py-1 rounded-md text-[10px] font-bold uppercase transition-all"
                  style={{ backgroundColor: estudiante.tipo_id === type ? "white" : "transparent", color: estudiante.tipo_id === type ? COLORS.ACCENT : COLORS.TEXT_MUTED }}>{type}</button>
              ))}
            </div>
          </div>
          <input type="text" value={estudiante.cedula} onChange={e => updateEstudiante("cedula", e.target.value)} onBlur={() => blurEstudiante("cedula")} placeholder={placeholders.cedula}
            className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none" style={{ borderColor: touched.cedula && errors.cedula ? "#ef4444" : COLORS.BORDER_SUBTLE }} />
          {touched.cedula && errors.cedula && <p className="text-[11px] mt-1 text-red-500">{errors.cedula}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5">Nombres</label>
          <input type="text" value={estudiante.nombres} onChange={e => updateEstudiante("nombres", e.target.value)} onBlur={() => blurEstudiante("nombres")} placeholder={placeholders.nombres}
            className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none" style={{ borderColor: touched.nombres && errors.nombres ? "#ef4444" : COLORS.BORDER_SUBTLE }} />
          {touched.nombres && errors.nombres && <p className="text-[11px] mt-1 text-red-500">{errors.nombres}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5">Apellidos</label>
          <input type="text" value={estudiante.apellidos} onChange={e => updateEstudiante("apellidos", e.target.value)} onBlur={() => blurEstudiante("apellidos")} placeholder={placeholders.apellidos}
            className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none" style={{ borderColor: touched.apellidos && errors.apellidos ? "#ef4444" : COLORS.BORDER_SUBTLE }} />
          {touched.apellidos && errors.apellidos && <p className="text-[11px] mt-1 text-red-500">{errors.apellidos}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5">Teléfono</label>
          <input type="text" value={estudiante.telefono} onChange={e => updateEstudiante("telefono", e.target.value)} onBlur={() => blurEstudiante("telefono")} placeholder={placeholders.telefono}
            className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none" style={{ borderColor: touched.telefono && errors.telefono ? "#ef4444" : COLORS.BORDER_SUBTLE }} />
          {touched.telefono && errors.telefono && <p className="text-[11px] mt-1 text-red-500">{errors.telefono}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5">Correo Electrónico</label>
          <input type="text" value={estudiante.correo} onChange={e => updateEstudiante("correo", e.target.value)} onBlur={() => blurEstudiante("correo")} placeholder={placeholders.correo}
            className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none" style={{ borderColor: touched.correo && errors.correo ? "#ef4444" : COLORS.BORDER_SUBTLE }} />
          {touched.correo && errors.correo && <p className="text-[11px] mt-1 text-red-500">{errors.correo}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 min-w-0">
        <div>
          <label className="block text-xs font-medium mb-1.5">Ocupación</label>
          <input type="text" value={estudiante.ocupacion} onChange={e => updateEstudiante("ocupacion", e.target.value)} onBlur={() => blurEstudiante("ocupacion")} placeholder="Ej: Estudiante, Ingeniero..." className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none" style={{ borderColor: touched.ocupacion && errors.ocupacion ? "#ef4444" : COLORS.BORDER_SUBTLE }} />
          {touched.ocupacion && errors.ocupacion && <p className="text-[11px] mt-1 text-red-500">{errors.ocupacion}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5">Estado Civil</label>
          <select value={estudiante.estado_civil} onChange={e => updateEstudiante("estado_civil", e.target.value)} onBlur={() => blurEstudiante("estado_civil")} className="w-full px-3.5 py-2.5 rounded-lg text-sm border bg-white outline-none" style={{ borderColor: touched.estado_civil && errors.estado_civil ? "#ef4444" : COLORS.BORDER_SUBTLE }}>
            <option value="">Seleccionar...</option>
            <option value="soltero">Soltero</option>
            <option value="casado">Casado</option>
            <option value="otro">Otro</option>
          </select>
          {touched.estado_civil && errors.estado_civil && <p className="text-[11px] mt-1 text-red-500">{errors.estado_civil}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5">Edad</label>
          <input type="number" min="10" max="120" value={estudiante.edad}
            onChange={e => updateEstudiante("edad", e.target.value)}
            onBlur={() => blurEstudiante("edad")}
            placeholder="Ej: 25"
            className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none"
            style={{ borderColor: touched.edad && errors.edad ? "#ef4444" : COLORS.BORDER_SUBTLE }} />
          {touched.edad && errors.edad && <p className="text-[11px] mt-1 text-red-500">{errors.edad}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5">Nivel Educativo</label>
          <select value={estudiante.nivel_educativo} onChange={e => updateEstudiante("nivel_educativo", e.target.value)} onBlur={() => blurEstudiante("nivel_educativo")} className="w-full px-3.5 py-2.5 rounded-lg text-sm border bg-white outline-none" style={{ borderColor: touched.nivel_educativo && errors.nivel_educativo ? "#ef4444" : COLORS.BORDER_SUBTLE }}>
            <option value="">Seleccionar...</option>
            {nivelesEducativos.map(n => (
              <option key={n.value} value={n.value}>{n.label}</option>
            ))}
          </select>
          {touched.nivel_educativo && errors.nivel_educativo && <p className="text-[11px] mt-1 text-red-500">{errors.nivel_educativo}</p>}
        </div>
        <div className="relative">
          <label className="block text-xs font-medium mb-1.5">Ciudad</label>
          <input ref={ciudadInputRef} type="text" value={estudiante.ciudad} 
            onChange={e => { 
              setEstudiante({...estudiante, ciudad: e.target.value.toUpperCase()}); 
              const err = validateField("ciudad", e.target.value.toUpperCase()); 
              setErrors(prev => { const n = { ...prev }; if (err) n.ciudad = err; else delete n.ciudad; return n }); 
              setCiudadOpen(true);
              setFocusedIndex(-1);
            }} 
            onKeyDown={handleCiudadKeyDown}
            onBlur={() => blurEstudiante("ciudad")} 
            onFocus={() => setCiudadOpen(true)} 
            placeholder="Busca tu ciudad..." 
            className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none bg-white" 
            style={{ borderColor: touched.ciudad && errors.ciudad ? "#ef4444" : COLORS.BORDER_SUBTLE }} 
          />
          {ciudadOpen && (
            <div ref={dropdownRef} className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border bg-white shadow-lg max-h-56 overflow-y-auto" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              {filteredCities.length === 0 ? (
                <div className="px-3.5 py-2.5 text-sm" style={{ color: COLORS.TEXT_MUTED }}>Sin resultados</div>
              ) : (
                filteredCities.map((c, idx) => (
                  <button key={c} type="button" 
                    onMouseDown={e => { e.preventDefault(); selectCiudad(c) }} 
                    onMouseEnter={() => setFocusedIndex(idx)}
                    className="w-full text-left px-3.5 py-2 text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors" 
                    style={{ 
                      color: COLORS.CHARCOAL, 
                      backgroundColor: idx === focusedIndex ? "oklch(0.95 0.01 260)" : (estudiante.ciudad === c ? "oklch(0.98 0 0)" : "transparent") 
                    }}>
                    {c}
                  </button>
                ))
              )}
            </div>
          )}
          {touched.ciudad && errors.ciudad && <p className="text-[11px] mt-1 text-red-500">{errors.ciudad}</p>}
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5">Dirección</label>
          <input type="text" value={estudiante.direccion} onChange={e => updateEstudiante("direccion", e.target.value)} onBlur={() => blurEstudiante("direccion")} placeholder="Av. Siempre Viva 123" className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none" style={{ borderColor: touched.direccion && errors.direccion ? "#ef4444" : COLORS.BORDER_SUBTLE }} />
          {touched.direccion && errors.direccion && <p className="text-[11px] mt-1 text-red-500">{errors.direccion}</p>}
        </div>
      </div>
      <div>
        <br />
        <label className="block text-xs font-medium mb-1.5">Foto de la Cédula</label>
        <p className="text-[11px] text-gray-500 mb-2">
          Asegúrese de que la imagen esté en formato JPG, JPEG o PNG y no supere los <strong>2 MB</strong> de tamaño.
        </p>
        <input ref={cedulaInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
          const file = e.target.files?.[0]
          if (!file) return
          const MAX = 2 * 1024 * 1024
          if (!file.type.startsWith("image/")) {
            setErrors(prev => ({ ...prev, cedulaFile: "Solo se permiten imágenes (JPG, PNG)" }))
            if (cedulaInputRef.current) cedulaInputRef.current.value = ""
            return
          }
          if (file.size > MAX) {
            setErrors(prev => ({ ...prev, cedulaFile: "La imagen no debe superar los 2MB" }))
            if (cedulaInputRef.current) cedulaInputRef.current.value = ""
            return
          }
          setCedulaFile(file)
          setCedulaPreview(URL.createObjectURL(file))
          setErrors(prev => { const n = { ...prev }; delete n.cedulaFile; return n })
        }} />
        
        {/* DRAG AND DROP ZONE */}
        <div 
          onClick={() => !cedulaPreview && cedulaInputRef.current?.click()} 
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (cedulaPreview) return;
            const file = e.dataTransfer.files?.[0];
            if (!file) return;
            const MAX = 2 * 1024 * 1024;
            if (!file.type.startsWith("image/")) {
              setErrors(prev => ({ ...prev, cedulaFile: "Solo se permiten imágenes (JPG, PNG)" }));
              return;
            }
            if (file.size > MAX) {
              setErrors(prev => ({ ...prev, cedulaFile: "La imagen no debe superar los 2MB" }));
              return;
            }
            setCedulaFile(file);
            setCedulaPreview(URL.createObjectURL(file));
            setErrors(prev => { const n = { ...prev }; delete n.cedulaFile; return n });
          }}
          className="relative rounded-lg border-2 border-dashed p-4 sm:p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors" 
          style={{ borderColor: errors.cedulaFile ? "#ef4444" : COLORS.BORDER_SUBTLE }}
        >
          {cedulaPreview ? 
            <img src={cedulaPreview} className="max-h-64 rounded" alt="Cédula" /> : 
            <div className="flex flex-col items-center gap-2 text-xs text-gray-400">
              <HugeiconsIcon icon={ImageAdd02Icon} size={32} />
              <span>Haz clic o arrastra la foto aquí</span>
            </div>
          }
        </div>
        
        {cedulaPreview && (
          <button type="button" onClick={() => { setCedulaFile(null); setCedulaPreview(null); if (cedulaInputRef.current) cedulaInputRef.current.value = ""; setErrors(prev => { const n = { ...prev }; delete n.cedulaFile; return n }) }}
            className="text-[11px] mt-1 font-medium hover:underline" style={{ color: "#ef4444" }}>Quitar foto</button>
        )}
        {errors.cedulaFile && <p className="text-[11px] mt-1 text-red-500">{errors.cedulaFile}</p>}
      </div>
      <div className="flex justify-end pt-2">
        <button 
          onClick={onNext} 
          disabled={!canProceed} 
          className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50 transition-opacity" 
          style={{ backgroundColor: COLORS.ACCENT }}
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}
