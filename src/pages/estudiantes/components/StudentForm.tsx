import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react"
import { COLORS } from "@/lib/constants"
import { ECUADOR_CITIES } from "@/data/ciudades-ecuador"
import { EMPTY_STUDENT_FORM } from "./studentForm.constants"

export interface StudentFormValues {
  nombres: string
  apellidos: string
  cedula: string
  correo: string
  celular: string
  ciudad_id: string
  ciudad?: string
  notas_internas: string
  ocupacion: string
  direccion: string
  estado_civil: string
  edad: string
  nivel_educativo: string
  archivo_cedula?: File | null
}

interface StudentFormProps {
  initialValues?: StudentFormValues
  saving?: boolean
  submitLabel?: string
  onSubmit: (values: StudentFormValues) => Promise<void> | void
  onCancel?: () => void
}

const inputClass = "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/10"
const labelClass = "mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#73747b]"
const namePattern = /^[\p{L}]+(?:[ '\u002D][\p{L}]+)*$/u
const maritalStatuses = ["soltero", "casado", "divorciado", "viudo", "union_libre"]
const educationLevels = ["educacion inicial", "general basica", "bachillerato", "tecnico/tecnologico", "superior", "otro"]

export function StudentForm({ initialValues = EMPTY_STUDENT_FORM, saving = false, submitLabel = "Registrar estudiante", onSubmit, onCancel }: StudentFormProps) {
  const [values, setValues] = useState<StudentFormValues>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof StudentFormValues, string>>>({})
  const [archivoCedula, setArchivoCedula] = useState<File | null>(null)
  const [cedulaPreview, setCedulaPreview] = useState<string | null>(null)
  const [ciudadTexto, setCiudadTexto] = useState(initialValues.ciudad || "")
  const [ciudadOpen, setCiudadOpen] = useState(false)
  const [ciudadFocus, setCiudadFocus] = useState(-1)
  const ciudadRef = useRef<HTMLDivElement>(null)
  const cedulaInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setValues(initialValues)
    setCiudadTexto(initialValues.ciudad || "")
  }, [initialValues])

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ciudadRef.current && !ciudadRef.current.contains(event.target as Node)) setCiudadOpen(false)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [])

  useEffect(() => {
    return () => {
      if (cedulaPreview) URL.revokeObjectURL(cedulaPreview)
    }
  }, [cedulaPreview])

  const update = (field: keyof StudentFormValues, value: string) => {
    setValues(previous => ({ ...previous, [field]: value }))
    setErrors(previous => ({ ...previous, [field]: undefined }))
  }

  const handleInputChange = (field: keyof StudentFormValues, value: string) => {
    if (field === "cedula" || field === "celular") {
      update(field, value.replace(/\D/g, "").slice(0, 10))
      return
    }
    update(field, value)
  }

  const validate = () => {
    const next: Partial<Record<keyof StudentFormValues, string>> = {}
    const nombres = values.nombres.trim()
    const apellidos = values.apellidos.trim()
    const cedula = values.cedula.trim()
    const celular = values.celular.trim()
    if (!nombres) next.nombres = "Los nombres son obligatorios."
    else if (!namePattern.test(nombres)) next.nombres = "Los nombres solo pueden contener letras, espacios, guiones o apóstrofes."
    if (!apellidos) next.apellidos = "Los apellidos son obligatorios."
    else if (!namePattern.test(apellidos)) next.apellidos = "Los apellidos solo pueden contener letras, espacios, guiones o apóstrofes."
    if (cedula && !/^\d{10}$/.test(cedula)) next.cedula = "La cédula debe contener exactamente 10 dígitos."
    if (celular && !/^\d{10}$/.test(celular)) next.celular = "El celular debe contener exactamente 10 dígitos."
    if (values.correo && !/^\S+@\S+\.\S+$/.test(values.correo.trim())) next.correo = "Ingresa un correo válido."
    if (values.nombres.length > 100) next.nombres = "Los nombres no pueden superar 100 caracteres."
    if (values.apellidos.length > 100) next.apellidos = "Los apellidos no pueden superar 100 caracteres."
    if (values.correo.length > 150) next.correo = "El correo no puede superar 150 caracteres."
    if (values.ocupacion.length > 100) next.ocupacion = "La ocupación no puede superar 100 caracteres."
    if (values.direccion.length > 1000) next.direccion = "La dirección no puede superar 1000 caracteres."
    if (values.estado_civil && !maritalStatuses.includes(values.estado_civil)) next.estado_civil = "Selecciona un estado civil válido."
    if (values.nivel_educativo && !educationLevels.includes(values.nivel_educativo)) next.nivel_educativo = "Selecciona un nivel educativo válido."
    if (values.edad) {
      const edad = Number(values.edad)
      if (!Number.isInteger(edad) || edad < 0 || edad > 150) next.edad = "La edad debe estar entre 0 y 150."
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!validate()) return
    await onSubmit({
      ...values,
      nombres: values.nombres.trim(),
      apellidos: values.apellidos.trim(),
      cedula: values.cedula.trim(),
      correo: values.correo.trim(),
      celular: values.celular.trim(),
      notas_internas: values.notas_internas.trim(),
      ocupacion: values.ocupacion.trim(),
      direccion: values.direccion.trim(),
      ciudad: ciudadTexto.trim() || undefined,
      archivo_cedula: archivoCedula,
    })
  }

  const field = (name: Exclude<keyof StudentFormValues, "archivo_cedula">, label: string, type = "text", placeholder?: string) => (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type={type}
        value={values[name]}
        onChange={event => handleInputChange(name, event.target.value)}
        maxLength={name === "cedula" || name === "celular" ? 10 : undefined}
        inputMode={name === "cedula" || name === "celular" ? "numeric" : type === "number" ? "numeric" : undefined}
        pattern={name === "cedula" || name === "celular" ? "[0-9]{10}" : undefined}
        min={name === "edad" ? 0 : undefined}
        max={name === "edad" ? 150 : undefined}
        placeholder={placeholder}
        className={inputClass}
        style={{ borderColor: errors[name] ? "#f43f5e" : COLORS.BORDER_SUBTLE }}
      />
      {errors[name] && <p className="mt-1 text-xs text-rose-600">{errors[name]}</p>}
    </div>
  )

  const ciudadesFiltradas = useMemo(() => {
    const query = ciudadTexto.trim().toLowerCase()
    return ECUADOR_CITIES.filter(city => !query || city.toLowerCase().includes(query)).slice(0, 30)
  }, [ciudadTexto])

  const seleccionarCiudad = (ciudad: string) => {
    setCiudadTexto(ciudad)
    setValues(previous => ({ ...previous, ciudad_id: "", ciudad }))
    setCiudadOpen(false)
    setCiudadFocus(-1)
  }

  const handleCiudadKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!ciudadOpen && (event.key === "ArrowDown" || event.key === "Enter")) {
      setCiudadOpen(true)
      return
    }
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setCiudadFocus(previous => Math.min(previous + 1, ciudadesFiltradas.length - 1))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setCiudadFocus(previous => Math.max(previous - 1, 0))
    } else if (event.key === "Enter" && ciudadFocus >= 0) {
      event.preventDefault()
      seleccionarCiudad(ciudadesFiltradas[ciudadFocus])
    } else if (event.key === "Escape") {
      setCiudadOpen(false)
      setCiudadFocus(-1)
    }
  }

  const seleccionarCedula = (file: File | null) => {
    if (cedulaPreview) URL.revokeObjectURL(cedulaPreview)
    setArchivoCedula(file)
    setCedulaPreview(file ? URL.createObjectURL(file) : null)
  }

  const quitarCedula = () => {
    seleccionarCedula(null)
    if (cedulaInputRef.current) cedulaInputRef.current.value = ""
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <h2 className="text-lg font-bold" style={{ color: COLORS.CHARCOAL }}>Datos personales</h2>
        <p className="mt-1 text-sm text-[#73747b]">Registra únicamente la información de la persona. La matrícula se realizará posteriormente.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {field("nombres", "Nombres *", "text", "Ej. Juan")}
        {field("apellidos", "Apellidos *", "text", "Ej. Pérez")}
        {field("cedula", "Cédula", "text", "10 dígitos, opcional")}
        {field("celular", "Celular", "tel", "10 dígitos, opcional")}
        <div className="sm:col-span-2">{field("correo", "Correo electrónico", "email", "correo@ejemplo.com")}</div>
      </div>

      <div className="border-t pt-5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <h3 className="mb-4 text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>Perfil registrado</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div ref={ciudadRef} className="relative">
            <label className={labelClass}>Ciudad</label>
            <input
              type="text"
              value={ciudadTexto}
              onChange={event => {
                const text = event.target.value
                setCiudadTexto(text)
                setValues(previous => ({ ...previous, ciudad_id: "", ciudad: text }))
                setCiudadOpen(true)
                setCiudadFocus(-1)
              }}
              onFocus={() => setCiudadOpen(true)}
              onKeyDown={handleCiudadKeyDown}
              placeholder="Escribe o busca una ciudad"
              className={inputClass}
              style={{ borderColor: COLORS.BORDER_SUBTLE }}
            />
            {ciudadOpen && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border bg-white shadow-lg" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                {ciudadesFiltradas.length ? ciudadesFiltradas.map((ciudad, index) => (
                  <button key={ciudad} type="button" onMouseDown={event => { event.preventDefault(); seleccionarCiudad(ciudad) }} onMouseEnter={() => setCiudadFocus(index)} className="block w-full px-3.5 py-2.5 text-left text-sm hover:bg-slate-50" style={{ backgroundColor: index === ciudadFocus ? "#f1f5f9" : "white", color: COLORS.CHARCOAL }}>
                    {ciudad}
                  </button>
                )) : <div className="px-3.5 py-2.5 text-sm" style={{ color: COLORS.TEXT_MUTED }}>Sin coincidencias. Puedes conservar el texto escrito.</div>}
              </div>
            )}
          </div>
          {field("edad", "Edad", "number", "Opcional")}
          {field("ocupacion", "Ocupación", "text", "Opcional")}
          <div>
            <label className={labelClass}>Estado civil</label>
            <select value={values.estado_civil} onChange={event => update("estado_civil", event.target.value)} className={inputClass} style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <option value="">Seleccionar estado civil</option>
              <option value="soltero">Soltero</option>
              <option value="casado">Casado</option>
              <option value="divorciado">Divorciado</option>
              <option value="viudo">Viudo</option>
              <option value="union_libre">Unión libre</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Nivel educativo</label>
            <select value={values.nivel_educativo} onChange={event => update("nivel_educativo", event.target.value)} className={inputClass} style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <option value="">Seleccionar nivel educativo</option>
              <option value="educacion inicial">Educación inicial</option>
              <option value="general basica">Educación general básica</option>
              <option value="bachillerato">Bachillerato</option>
              <option value="tecnico/tecnologico">Técnico / tecnológico</option>
              <option value="superior">Superior</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div className="sm:col-span-2">{field("direccion", "Dirección", "text", "Opcional")}</div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Notas internas</label>
            <textarea value={values.notas_internas} onChange={event => update("notas_internas", event.target.value)} rows={3} placeholder="Opcional" className={`${inputClass} resize-y`} style={{ borderColor: COLORS.BORDER_SUBTLE }} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Copia de cédula</label>
            <input
              ref={cedulaInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={event => seleccionarCedula(event.target.files?.[0] || null)}
              className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-[#e5eeff] file:px-3 file:py-1.5 file:text-xs file:font-bold`}
            />
            {cedulaPreview && archivoCedula && (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <img src={cedulaPreview} alt="Previsualización de la copia de cédula" className="h-20 w-28 rounded-lg border border-slate-200 bg-white object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-700">{archivoCedula.name}</p>
                  <p className="mt-1 text-[11px] text-slate-500">Previsualización de la imagen seleccionada</p>
                  <button type="button" onClick={quitarCedula} className="mt-2 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50">Quitar imagen</button>
                </div>
              </div>
            )}
            <p className="mt-1 text-xs text-[#73747b]">Opcional. Imagen JPG, PNG o WEBP de hasta 5 MB.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        {onCancel && <button type="button" onClick={onCancel} className="rounded-xl px-5 py-2.5 text-sm font-bold text-[#73747b] transition-colors hover:bg-[#eff4ff]">Cancelar</button>}
        <button type="submit" disabled={saving} className="rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60" style={{ backgroundColor: COLORS.ACCENT }}>
          {saving ? "Guardando..." : submitLabel}
        </button>
      </div>
    </form>
  )
}
