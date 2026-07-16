import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useNavigate } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UserIcon, GraduationCapIcon, BookOpen01Icon,
  CreditCardIcon, CheckCircle, Calendar01Icon, Clock01Icon,
  ImageAdd02Icon, SearchIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import api from "@/services/auth.service"
import { cursosService, type CursoAbierto } from "@/services/cursos.service"
import { tallerService, type Taller, type HorarioTaller } from "@/services/taller.service"
import { toast } from "sonner"
import { validarComprobante } from "@/lib/file-validators"
import { ECUADOR_CITIES } from "@/data/ciudades-ecuador"

type Paso = 1 | 2 | 3

interface EstudianteData {
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
  fecha_nacimiento: string
  edad: string
}

function calcularEdad(fecha: string): string {
  if (!fecha) return ""
  const nacimiento = new Date(fecha)
  if (isNaN(nacimiento.getTime())) return ""
  const hoy = new Date()
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const mesDiff = hoy.getMonth() - nacimiento.getMonth()
  if (mesDiff < 0 || (mesDiff === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--
  }
  return edad >= 0 ? String(edad) : ""
}

const pasos = [
  { num: 1 as Paso, label: "Datos del Estudiante", icon: UserIcon },
  { num: 2 as Paso, label: "Seleccionar Curso", icon: GraduationCapIcon },
  { num: 3 as Paso, label: "Método de Pago", icon: CreditCardIcon },
]

const placeholders: Record<string, string> = {
  cedula: "Cédula o DNI",
  nombres: "Juan",
  apellidos: "Pérez",
  telefono: "0987654321",
  correo: "correo@ejemplo.com",
}

export function NuevoEstudiantePage() {
  const navigate = useNavigate()
  const [paso, setPaso] = useState<Paso>(1)
  const [loadingCursos, setLoadingCursos] = useState(false)
  const [cursosAbiertos, setCursosAbiertos] = useState<CursoAbierto[]>([])
  const [talleres, setTalleres] = useState<Taller[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterModalidad, setFilterModalidad] = useState("")
  const [filterCiudadId, setFilterCiudadId] = useState<number | null>(null)
  const [filterTipo, setFilterTipo] = useState<"todos" | "curso" | "taller">("todos")
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [estudiante, setEstudiante] = useState<EstudianteData>({
    tipo_id: "cedula",
    nombres: "", apellidos: "", cedula: "", telefono: "", correo: "",
    ocupacion: "", direccion: "", ciudad: "", estado_civil: "", fecha_nacimiento: "", edad: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [cedulaFile, setCedulaFile] = useState<File | null>(null)
  const [cedulaPreview, setCedulaPreview] = useState<string | null>(null)
  const [metodoPago, setMetodoPago] = useState("")
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null)
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(null)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({})
  const [paymentTouched, setPaymentTouched] = useState<Record<string, boolean>>({})
  const [ciudadOpen, setCiudadOpen] = useState(false)

  const cedulaInputRef = useRef<HTMLInputElement>(null)
  const comprobanteInputRef = useRef<HTMLInputElement>(null)
  const ciudadInputRef = useRef<HTMLInputElement>(null)

  const metodosPago = [
    { key: "efectivo", label: "Efectivo" },
    { key: "transferencia", label: "Transferencia/Deposito" },
  ]

  const FULL_DAY_NAMES: Record<number, string> = {
    1: "Lunes", 2: "Martes", 3: "Miércoles", 4: "Jueves",
    5: "Viernes", 6: "Sábado", 7: "Domingo",
  }

  function formatDateRange(start: string | null, end: string | null): string {
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }
    const s = start ? new Date(start).toLocaleDateString("es-ES", opts) : null
    const e = end ? new Date(end).toLocaleDateString("es-ES", opts) : null
    if (!s) return "—"
    if (!e || s === e) return s
    return `${s} → ${e}`
  }

  function descHorarioTaller(horarios: HorarioTaller[] | undefined): string {
    if (!horarios || horarios.length === 0) return ""
    const groups = new Map<string, string[]>()
    for (const h of horarios) {
      const key = `${h.hora_inicio?.substring(0, 5)}-${h.hora_fin?.substring(0, 5)}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(FULL_DAY_NAMES[h.dia_semana] || `Día ${h.dia_semana}`)
    }
    return Array.from(groups.entries())
      .map(([key, days]) => { const [hs, he] = key.split("-"); return `${days.join(", ")} | ${hs} - ${he}` })
      .join("  ·  ")
  }

  function descHorarioCurso(horario: CursoAbierto["horario"]): string {
    if (!horario) return ""
    const days: string[] = []
    if (horario.dia_semana && horario.dia_semana.length > 0)
      days.push(...horario.dia_semana.map(d => FULL_DAY_NAMES[d] || `Día ${d}`))
    else if (horario.dias_semana && horario.dias_semana.length > 0)
      days.push(...horario.dias_semana.map(d => FULL_DAY_NAMES[d.dia_semana] || `Día ${d.dia_semana}`))
    const t = [horario.hora_inicio?.substring(0, 5), horario.hora_fin?.substring(0, 5)].filter(Boolean).join(" - ")
    return [days.join(", "), t].filter(Boolean).join(" | ")
  }

  const cargarCursos = useCallback(() => {
    const params: Record<string, string | number> = { per_page: 50, no_iniciados: "true" }
    if (filterModalidad) params.modalidad = filterModalidad
    if (filterCiudadId) params.ciudad_id = filterCiudadId
    return api.get("/cursos-abiertos", { params }).then(res => res.data.data || [])
  }, [filterModalidad, filterCiudadId])

  const cargarTalleres = useCallback(() => {
    const params: Record<string, unknown> = { per_page: 50, tab: "proximos" }
    if (filterModalidad) params.modalidad = filterModalidad
    if (filterCiudadId) params.ciudad_id = filterCiudadId
    return api.get("/talleres", { params }).then(res => (res.data as { data: unknown[] }).data || [])
  }, [filterModalidad, filterCiudadId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingCursos(true)
    setSelectedCourseId("")
    Promise.allSettled([cargarCursos(), cargarTalleres()])
      .then(([cursosResult, tallsResult]) => {
        setCursosAbiertos(cursosResult.status === "fulfilled" ? cursosResult.value : [])
        setTalleres(tallsResult.status === "fulfilled" ? tallsResult.value as Taller[] : [])
        if (cursosResult.status === "rejected") console.warn("Cursos no disponibles:", cursosResult.reason)
        if (tallsResult.status === "rejected") console.warn("Talleres no disponibles:", tallsResult.reason)
      })
      .finally(() => setLoadingCursos(false))
  }, [cargarCursos, cargarTalleres])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ciudadInputRef.current && !ciudadInputRef.current.parentElement?.contains(e.target as Node)) {
        setCiudadOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const availableCiudades = useMemo(() => {
    const seen = new Set<number>()
    const result: Array<{ id: number; nombre: string }> = []
    for (const c of cursosAbiertos) {
      if (c.ciudad && !seen.has(c.ciudad.id)) {
        seen.add(c.ciudad.id)
        result.push({ id: c.ciudad.id, nombre: c.ciudad.nombre })
      }
    }
    for (const t of talleres) {
      if (t.ciudad && !seen.has(t.ciudad.id)) {
        seen.add(t.ciudad.id)
        result.push({ id: t.ciudad.id, nombre: t.ciudad.nombre })
      }
    }
    return result.sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [cursosAbiertos, talleres])

  const filteredItems = useMemo(() => {
    let items: Array<{ tipo: "curso" | "taller"; id: string }> = []
    if (filterTipo === "todos" || filterTipo === "curso") {
      items.push(...cursosAbiertos.map(c => ({ tipo: "curso" as const, id: c.id })))
    }
    if (filterTipo === "todos" || filterTipo === "taller") {
      items.push(...talleres.map(t => ({ tipo: "taller" as const, id: t.id })))
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      items = items.filter(item => {
        if (item.tipo === "curso") {
          const c = cursosAbiertos.find(c => c.id === item.id)
          if (!c) return false
          return (c.nombre_instancia || c.catalogo?.nombre || "").toLowerCase().includes(term)
        }
        const t = talleres.find(t => t.id === item.id)
        if (!t) return false
        return t.nombre.toLowerCase().includes(term)
      })
    }
    return items
  }, [cursosAbiertos, talleres, filterTipo, searchTerm])

  const curso = cursosAbiertos.find(c => c.id === selectedCourseId)
  const tallerSel = talleres.find(t => t.id === selectedCourseId)
  const esTaller = !!tallerSel && !curso

  const sanitizeInput = (campo: string, valor: string): string => {
    if (campo === "telefono") return valor.replace(/[^0-9]/g, "").slice(0, 10)
    if (campo === "cedula" && estudiante.tipo_id === "cedula") return valor.replace(/[^0-9]/g, "").slice(0, 10)
    if (campo === "nombres" || campo === "apellidos") return valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "")
    return valor
  }

  const validateField = (campo: string, valor: string): string | null => {
    const labels: Record<string, string> = {
      cedula: estudiante.tipo_id === "cedula" ? "Cédula" : "DNI",
      nombres: "Nombres", apellidos: "Apellidos", telefono: "Teléfono", correo: "Correo",
      ocupacion: "Ocupación", direccion: "Dirección", ciudad: "Residencia",
      estado_civil: "Estado Civil", fecha_nacimiento: "Fecha de Nacimiento",
    }
    if (["cedula", "nombres", "apellidos", "telefono", "correo", "ocupacion", "direccion", "ciudad", "estado_civil", "fecha_nacimiento"].includes(campo) && !valor.trim()) {
      return `${labels[campo] || campo} es requerido`
    }
    if (campo === "cedula") {
      if (estudiante.tipo_id === "cedula") {
        if (!/^\d{10}$/.test(valor)) return "La cédula debe tener exactamente 10 dígitos"
      } else if (valor.length < 5) return "El DNI debe tener al menos 5 caracteres"
    }
    if ((campo === "nombres" || campo === "apellidos") && valor && valor.length < 2) return "Mínimo 2 caracteres"
    if (campo === "telefono" && valor && !/^\d{10}$/.test(valor)) return "El teléfono debe tener 10 dígitos"
    if (campo === "correo" && valor && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) return "Correo inválido"
    if (campo === "fecha_nacimiento" && valor) {
      const edad = Number(calcularEdad(valor))
      if (edad < 10) return "Debes tener al menos 10 años para inscribirte"
      if (edad > 120) return "La fecha de nacimiento no es válida"
    }
    return null
  }

  const updateEstudiante = (campo: string, valor: string) => {
    const sanitized = sanitizeInput(campo, valor)
    setEstudiante(prev => ({ ...prev, [campo]: sanitized }))
    const err = validateField(campo, sanitized)
    setErrors(prev => {
      const n = { ...prev }
      if (err) n[campo] = err
      else delete n[campo]
      return n
    })
  }

  const blurEstudiante = (campo: string) => {
    setTouched(prev => ({ ...prev, [campo]: true }))
    const valor = estudiante[campo as keyof EstudianteData]
    const err = validateField(campo, valor)
    setErrors(prev => {
      const n = { ...prev }
      if (err) n[campo] = err
      else delete n[campo]
      return n
    })
  }

  const validateStep1 = (): boolean => {
    const fields: (keyof EstudianteData)[] = ["cedula", "nombres", "apellidos", "telefono", "correo", "ocupacion", "direccion", "ciudad", "estado_civil", "fecha_nacimiento"]
    const newErrors: Record<string, string> = {}
    let valid = true
    fields.forEach(f => {
      const err = validateField(f, estudiante[f])
      if (err) { newErrors[f] = err; valid = false }
    })
    if (!cedulaFile) {
      newErrors.cedulaFile = "Debes subir una foto de la cédula"
      valid = false
    }
    setErrors(newErrors)
    setTouched(fields.reduce((acc, f) => ({ ...acc, [f]: true }), {}))
    return valid
  }

  const validateStep2 = (): boolean => {
    if (!selectedCourseId) {
      toast.error("Debes seleccionar un curso")
      return false
    }
    return true
  }

  const validateStep3 = (): boolean => {
    const errs: Record<string, string> = {}
    if (!metodoPago) errs.metodoPago = "Selecciona un método de pago"
    if (!esTaller && !comprobanteFile) errs.comprobante = "Adjunta el comprobante de pago"
    setPaymentErrors(errs)
    setPaymentTouched({ metodoPago: true, comprobante: true })
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (paso === 1 && !validateStep1()) return
    if (paso === 2 && !validateStep2()) return
    setPaso(prev => Math.min(prev + 1, 3) as Paso)
  }

  const touchPaymentField = (field: string) => {
    setPaymentTouched(prev => ({ ...prev, [field]: true }))
    setPaymentErrors(prev => {
      const n = { ...prev }; delete n[field]; return n
    })
  }

  const handleSubmit = async () => {
    if (!validateStep3()) return
    setLoadingSubmit(true)
    try {
      if (esTaller) {
        const inscripcion = await tallerService.inscribir({
          taller_id: selectedCourseId,
          nombres: estudiante.nombres,
          apellidos: estudiante.apellidos,
          cedula: estudiante.cedula,
          correo: estudiante.correo,
          telefono: estudiante.telefono,
          ocupacion: estudiante.ocupacion || undefined,
          direccion: estudiante.direccion || undefined,
          ciudad: estudiante.ciudad || undefined,
          estado_civil: estudiante.estado_civil || undefined,
          fecha_nacimiento: estudiante.fecha_nacimiento || undefined,
          edad: estudiante.edad ? Number(estudiante.edad) : undefined,
          tipo_pago: "abono",
          monto_pagado: 0,
          metodo_pago: metodoPago,
          fecha_pago: new Date().toISOString().split("T")[0],
        })
        const inscId = (inscripcion as Record<string, unknown>).id as string
        if (comprobanteFile) {
          try { await tallerService.subirComprobante(inscId, comprobanteFile) }
          catch { toast.error("Error al subir comprobante") }
        }
        if (cedulaFile) {
          try { await tallerService.subirCedula(inscId, cedulaFile) }
          catch { toast.error("Error al subir foto de cédula") }
        }
        toast.success("Inscripción al taller enviada correctamente")
      } else {
        const formData = new FormData()
        formData.append("curso_abierto_id", selectedCourseId)
        formData.append("tipo_pago", "abono")
        formData.append("tipo_comprobante", metodoPago)
        formData.append("fecha_pago_declarada", new Date().toISOString().split("T")[0])
        formData.append("nombres", estudiante.nombres)
        formData.append("apellidos", estudiante.apellidos)
        formData.append("cedula", estudiante.cedula)
        formData.append("tipo_id", estudiante.tipo_id)
        formData.append("correo", estudiante.correo)
        formData.append("celular", estudiante.telefono)
        formData.append("ocupacion", estudiante.ocupacion)
        formData.append("direccion", estudiante.direccion)
        formData.append("ciudad", estudiante.ciudad)
        formData.append("estado_civil", estudiante.estado_civil)
        formData.append("fecha_nacimiento", estudiante.fecha_nacimiento)
        formData.append("edad", estudiante.edad)
        formData.append("monto_solicitado", "0")
        if (comprobanteFile) formData.append("archivo_comprobante", comprobanteFile)
        if (cedulaFile) formData.append("archivo_cedula", cedulaFile)
        await cursosService.crearSolicitudInscripcion(formData)
        toast.success("Solicitud de matrícula enviada correctamente")
      }
      navigate("/estudiantes")
    } catch (err: unknown) {
      const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data
      const msg = String(data?.mensaje || data?.message || "Error al enviar la solicitud")
      const erroresRaw = data?.errores
      const errorsRaw = data?.errors
      const detalles = Array.isArray(erroresRaw) ? erroresRaw.join("\n") : (errorsRaw ? Object.values(errorsRaw as Record<string, string[]>).flat().join("\n") : "")
      toast.error(detalles ? `${msg}\n${detalles}` : msg, { duration: 8000 })
    } finally {
      setLoadingSubmit(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: COLORS.TEXT_MUTED }}>
            <span>Estudiantes</span><span>/</span><span className="font-medium" style={{ color: COLORS.CHARCOAL }}>Nuevo</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: COLORS.CHARCOAL }}>Registrar Estudiante</h1>
          <p className="text-sm mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>Completa los datos para inscribir a un nuevo estudiante</p>
        </div>
        <button onClick={() => navigate("/estudiantes")}
          className="px-4 py-2 rounded-lg text-xs font-semibold border transition-all hover:bg-black/5"
          style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}>
          Cancelar
        </button>
      </div>

      <div className="flex items-center gap-0">
        {pasos.map((p, i) => (
          <div key={p.num} className="flex items-center gap-0 flex-1">
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg text-xs font-semibold transition-colors"
              style={{ backgroundColor: paso >= p.num ? `color-mix(in srgb, ${COLORS.ACCENT} 12%, transparent)` : "transparent", color: paso >= p.num ? COLORS.ACCENT : COLORS.TEXT_MUTED }}>
              <div className="size-6 rounded-full flex items-center justify-center text-[11px] font-bold"
                style={{ backgroundColor: paso >= p.num ? COLORS.ACCENT : "oklch(0.90 0 0)", color: paso >= p.num ? "#fff" : COLORS.TEXT_MUTED }}>
                {paso > p.num ? <HugeiconsIcon icon={CheckCircle} size={14} /> : p.num}
              </div>
              <span className="hidden sm:inline">{p.label}</span>
            </div>
            {i < pasos.length - 1 && <div className="flex-1 h-px mx-2" style={{ backgroundColor: paso > p.num ? COLORS.ACCENT : COLORS.BORDER_SUBTLE }} />}
          </div>
        ))}
      </div>

      {paso === 1 && (
        <div>
          <h2 className="text-sm font-semibold flex items-center gap-2 mb-4" style={{ color: COLORS.CHARCOAL }}>
            <HugeiconsIcon icon={UserIcon} size={16} style={{ color: COLORS.ACCENT }} />Datos del Estudiante
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1.5">
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
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div><label className="block text-xs font-medium mb-1.5">Ocupación</label><input type="text" value={estudiante.ocupacion} onChange={e => updateEstudiante("ocupacion", e.target.value)} onBlur={() => blurEstudiante("ocupacion")} placeholder="Ej: Estudiante, Ingeniero..." className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none" style={{ borderColor: touched.ocupacion && errors.ocupacion ? "#ef4444" : COLORS.BORDER_SUBTLE }} />{touched.ocupacion && errors.ocupacion && <p className="text-[11px] mt-1 text-red-500">{errors.ocupacion}</p>}</div>
            <div><label className="block text-xs font-medium mb-1.5">Estado Civil</label><select value={estudiante.estado_civil} onChange={e => updateEstudiante("estado_civil", e.target.value)} onBlur={() => blurEstudiante("estado_civil")} className="w-full px-3.5 py-2.5 rounded-lg text-sm border bg-white outline-none" style={{ borderColor: touched.estado_civil && errors.estado_civil ? "#ef4444" : COLORS.BORDER_SUBTLE }}><option value="">Seleccionar...</option><option value="soltero">Soltero</option><option value="casado">Casado</option><option value="otro">Otro</option></select>{touched.estado_civil && errors.estado_civil && <p className="text-[11px] mt-1 text-red-500">{errors.estado_civil}</p>}</div>
            <div><label className="block text-xs font-medium mb-1.5">Fecha de Nacimiento</label><input type="date" value={estudiante.fecha_nacimiento} onChange={e => { const fn = e.target.value; updateEstudiante("fecha_nacimiento", fn); setEstudiante(prev => ({ ...prev, fecha_nacimiento: fn, edad: calcularEdad(fn) })) }} onBlur={() => blurEstudiante("fecha_nacimiento")} className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none" style={{ borderColor: touched.fecha_nacimiento && errors.fecha_nacimiento ? "#ef4444" : COLORS.BORDER_SUBTLE }} />{touched.fecha_nacimiento && errors.fecha_nacimiento && <p className="text-[11px] mt-1 text-red-500">{errors.fecha_nacimiento}</p>}</div>
            <div><label className="block text-xs font-medium mb-1.5">Edad</label><input type="number" readOnly value={estudiante.edad} className="w-full px-3.5 py-2.5 rounded-lg text-sm border bg-gray-50" /></div>
            <div className="relative">
              <label className="block text-xs font-medium mb-1.5">Ciudad</label>
              <input ref={ciudadInputRef} type="text" value={estudiante.ciudad} onChange={e => { setEstudiante({...estudiante, ciudad: e.target.value}); const err = validateField("ciudad", e.target.value); setErrors(prev => { const n = { ...prev }; if (err) n.ciudad = err; else delete n.ciudad; return n }); setCiudadOpen(true) }} onBlur={() => blurEstudiante("ciudad")} onFocus={() => setCiudadOpen(true)} placeholder="Busca tu ciudad..." className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none bg-white" style={{ borderColor: touched.ciudad && errors.ciudad ? "#ef4444" : COLORS.BORDER_SUBTLE }} />
              {ciudadOpen && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border bg-white shadow-lg max-h-56 overflow-y-auto" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  {ECUADOR_CITIES.filter(c => !estudiante.ciudad || c.toLowerCase().includes(estudiante.ciudad.toLowerCase())).length === 0 ? (
                    <div className="px-3.5 py-2.5 text-sm" style={{ color: COLORS.TEXT_MUTED }}>Sin resultados</div>
                  ) : (
                    ECUADOR_CITIES.filter(c => !estudiante.ciudad || c.toLowerCase().includes(estudiante.ciudad.toLowerCase())).map(c => (
                      <button key={c} type="button" onMouseDown={e => { e.preventDefault(); setEstudiante({...estudiante, ciudad: c}); setCiudadOpen(false); setErrors(prev => { const n = { ...prev }; delete n.ciudad; return n }) }} className="w-full text-left px-3.5 py-2 text-sm hover:bg-gray-50" style={{ color: COLORS.CHARCOAL, backgroundColor: estudiante.ciudad === c ? "oklch(0.95 0.01 260)" : "transparent" }}>{c}</button>
                    ))
                  )}
                </div>
              )}
              {touched.ciudad && errors.ciudad && <p className="text-[11px] mt-1 text-red-500">{errors.ciudad}</p>}
            </div>
            <div><label className="block text-xs font-medium mb-1.5">Residencia</label><input type="text" value={estudiante.direccion} onChange={e => updateEstudiante("direccion", e.target.value)} onBlur={() => blurEstudiante("direccion")} placeholder="Av. Siempre Viva 123" className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none" style={{ borderColor: touched.direccion && errors.direccion ? "#ef4444" : COLORS.BORDER_SUBTLE }} />{touched.direccion && errors.direccion && <p className="text-[11px] mt-1 text-red-500">{errors.direccion}</p>}</div>
          </div>
          <div>
            <br />
            <label className="block text-xs font-medium mb-1.5">Foto de la Cédula</label>
            <input ref={cedulaInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) { setCedulaFile(file); setCedulaPreview(URL.createObjectURL(file)); setErrors(prev => { const n = { ...prev }; delete n.cedulaFile; return n }) } }} />
            <div onClick={() => !cedulaPreview && cedulaInputRef.current?.click()} className="relative rounded-lg border-2 border-dashed p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50" style={{ borderColor: errors.cedulaFile ? "#ef4444" : COLORS.BORDER_SUBTLE }}>
              {cedulaPreview ? <img src={cedulaPreview} className="max-h-64 rounded" alt="Cédula" /> : <div className="flex flex-col items-center gap-2 text-xs text-gray-400"><HugeiconsIcon icon={ImageAdd02Icon} size={32} /><span>Subir foto de cédula</span></div>}
            </div>
            {cedulaPreview && (
              <button type="button" onClick={() => { setCedulaFile(null); setCedulaPreview(null); if (cedulaInputRef.current) cedulaInputRef.current.value = ""; setErrors(prev => { const n = { ...prev }; delete n.cedulaFile; return n }) }}
                className="text-[11px] mt-1 font-medium hover:underline" style={{ color: "#ef4444" }}>Quitar foto</button>
            )}
            {errors.cedulaFile && <p className="text-[11px] mt-1 text-red-500">{errors.cedulaFile}</p>}
          </div>
          <div className="flex justify-end pt-2"><button onClick={handleNext} className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: COLORS.ACCENT }}>Siguiente</button></div>
        </div>
      )}

      {paso === 2 && (
        <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <HugeiconsIcon icon={GraduationCapIcon} size={16} style={{ color: COLORS.ACCENT }} />Seleccionar Curso
          </h2>
          <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>
            Busca y selecciona el curso o taller al que deseas inscribir al estudiante
          </p>

          <div className="relative">
            <HugeiconsIcon icon={SearchIcon} size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.TEXT_MUTED }} />
            <input
              type="text" placeholder="Buscar curso o taller..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-lg text-sm border outline-none"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}
            />
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium block" style={{ color: COLORS.TEXT_MUTED }}>Modalidad</label>
              <div className="flex gap-1">
                {[{ key: "", label: "Todas" }, { key: "presencial", label: "Presencial" }, { key: "virtual", label: "Virtual" }].map(mod => (
                  <button key={mod.key} onClick={() => { setFilterModalidad(mod.key); setSelectedCourseId("") }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                    style={{ borderColor: filterModalidad === mod.key ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, backgroundColor: filterModalidad === mod.key ? `color-mix(in srgb, ${COLORS.ACCENT} 8%, transparent)` : "white", color: filterModalidad === mod.key ? COLORS.ACCENT : COLORS.CHARCOAL }}>
                    {mod.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium block" style={{ color: COLORS.TEXT_MUTED }}>Ciudad</label>
              <select value={filterCiudadId ?? ""} onChange={e => { setFilterCiudadId(e.target.value ? Number(e.target.value) : null); setSelectedCourseId("") }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-white outline-none" style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}>
                <option value="">Todas las ciudades</option>
                {availableCiudades.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium block" style={{ color: COLORS.TEXT_MUTED }}>Tipo</label>
              <div className="flex gap-1">
                {[{ key: "todos" as const, label: "Todos" }, { key: "curso" as const, label: "Cursos" }, { key: "taller" as const, label: "Talleres" }].map(t => (
                  <button key={t.key} onClick={() => setFilterTipo(t.key)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                    style={{ borderColor: filterTipo === t.key ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, backgroundColor: filterTipo === t.key ? `color-mix(in srgb, ${COLORS.ACCENT} 8%, transparent)` : "white", color: filterTipo === t.key ? COLORS.ACCENT : COLORS.CHARCOAL }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
            {loadingCursos ? (
              <div className="col-span-full py-8 text-center text-sm" style={{ color: COLORS.TEXT_MUTED }}>Cargando...</div>
            ) : filteredItems.length === 0 ? (
              <div className="col-span-full py-8 text-center text-sm" style={{ color: COLORS.TEXT_MUTED }}>No hay cursos o talleres disponibles con los filtros seleccionados</div>
            ) : (
              filteredItems.map(item => {
                const selected = selectedCourseId === item.id
                if (item.tipo === "taller") {
                  const t = talleres.find(t => t.id === item.id)
                  if (!t) return null
                  return (
                    <div key={t.id} onClick={() => setSelectedCourseId(t.id)}
                      className="rounded-lg border p-3.5 cursor-pointer transition-all shadow-sm hover:shadow-md relative active:scale-[0.98]"
                      style={{ borderColor: selected ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, backgroundColor: selected ? `color-mix(in srgb, ${COLORS.ACCENT} 4%, transparent)` : "white", borderLeft: `3px solid ${selected ? COLORS.ACCENT : "#e5e7eb"}` }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="size-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: "oklch(0.92 0.05 80)" }}>
                          <HugeiconsIcon icon={BookOpen01Icon} size={12} style={{ color: "oklch(0.55 0.12 70)" }} />
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: "oklch(0.92 0.05 80)", color: "oklch(0.55 0.12 70)" }}>Taller</span>
                      </div>
                      <h3 className="text-sm font-bold leading-snug mb-2" style={{ color: selected ? COLORS.ACCENT : COLORS.CHARCOAL }}>{t.nombre}</h3>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5">
                          <HugeiconsIcon icon={Calendar01Icon} size={13} style={{ color: COLORS.ACCENT }} />
                          <span style={{ color: COLORS.CHARCOAL }}>{formatDateRange(t.fecha ?? null, t.fecha_fin ?? null)}</span>
                        </div>
                        {(() => {
                          const horarioStr = descHorarioTaller(t.horarios)
                          if (horarioStr) {
                            return (
                              <div className="flex items-start gap-1.5">
                                <HugeiconsIcon icon={Clock01Icon} size={13} style={{ color: "oklch(0.55 0.15 220)" }} className="mt-0.5 shrink-0" />
                                <span style={{ color: COLORS.CHARCOAL }}>{horarioStr}</span>
                              </div>
                            )
                          }
                          if (t.hora_inicio && t.hora_fin) {
                            return (
                              <div className="flex items-center gap-1.5">
                                <HugeiconsIcon icon={Clock01Icon} size={13} style={{ color: "oklch(0.55 0.15 220)" }} />
                                <span style={{ color: COLORS.CHARCOAL }}>{t.hora_inicio.substring(0, 5)} - {t.hora_fin.substring(0, 5)}</span>
                              </div>
                            )
                          }
                          return null
                        })()}
                      </div>
                      {selected && <div className="absolute top-1.5 right-1.5"><HugeiconsIcon icon={CheckCircle} size={14} style={{ color: COLORS.ACCENT }} /></div>}
                    </div>
                  )
                }
                const ca = cursosAbiertos.find(c => c.id === item.id)
                if (!ca) return null
                return (
                  <div key={ca.id} onClick={() => setSelectedCourseId(ca.id)}
                    className="rounded-lg border p-3.5 cursor-pointer transition-all shadow-sm hover:shadow-md relative active:scale-[0.98]"
                    style={{ borderColor: selected ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, backgroundColor: selected ? `color-mix(in srgb, ${COLORS.ACCENT} 4%, transparent)` : "white", borderLeft: `3px solid ${selected ? COLORS.ACCENT : "#e5e7eb"}` }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="size-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "oklch(0.92 0.08 220)" }}>
                        <HugeiconsIcon icon={GraduationCapIcon} size={12} style={{ color: "oklch(0.45 0.12 220)" }} />
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: "oklch(0.92 0.08 220)", color: "oklch(0.45 0.12 220)" }}>Curso</span>
                    </div>
                    <h3 className="text-sm font-bold leading-snug mb-2" style={{ color: selected ? COLORS.ACCENT : COLORS.CHARCOAL }}>{ca.nombre_instancia || ca.catalogo?.nombre}</h3>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-1.5">
                        <HugeiconsIcon icon={Calendar01Icon} size={13} style={{ color: COLORS.ACCENT }} />
                        <span style={{ color: COLORS.CHARCOAL }}>{formatDateRange(ca.fecha_inicio, ca.fecha_fin)}</span>
                      </div>
                      {(() => {
                        const horarioStr = descHorarioCurso(ca.horario)
                        if (horarioStr) {
                          return (
                            <div className="flex items-start gap-1.5">
                              <HugeiconsIcon icon={Clock01Icon} size={13} style={{ color: "oklch(0.55 0.15 220)" }} className="mt-0.5 shrink-0" />
                              <span style={{ color: COLORS.CHARCOAL }}>{horarioStr}</span>
                            </div>
                          )
                        }
                        return null
                      })()}
                    </div>
                    {selected && <div className="absolute top-1.5 right-1.5"><HugeiconsIcon icon={CheckCircle} size={14} style={{ color: COLORS.ACCENT }} /></div>}
                  </div>
                )
              })
            )}
          </div>

          <div className="flex justify-between pt-2">
            <button onClick={() => setPaso(1)} className="px-4 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              Anterior
            </button>
            <button onClick={handleNext} disabled={!selectedCourseId}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50" style={{ backgroundColor: COLORS.ACCENT }}>
              Siguiente
            </button>
          </div>
        </div>
      )}

      {paso === 3 && (
        <div className="rounded-xl border p-6 space-y-6" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <h2 className="text-sm font-semibold flex items-center gap-2"><HugeiconsIcon icon={CreditCardIcon} size={16} style={{ color: COLORS.ACCENT }} />Método de Pago</h2>
          <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>Selecciona tu método de pago y sube el comprobante con el pago completo o el adelanto para finalizar tu matrícula. </p>
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-medium mb-1.5">Método de pago</label>
              <div className="grid grid-cols-3 gap-2">
                {metodosPago.map(m => (
                  <button key={m.key} onClick={() => { setMetodoPago(m.key); touchPaymentField("metodoPago") }}
                    className="px-3 py-2.5 rounded-lg text-xs font-medium border transition-all"
                    style={{ borderColor: metodoPago === m.key ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, backgroundColor: metodoPago === m.key ? `color-mix(in srgb, ${COLORS.ACCENT} 8%, transparent)` : "white", color: metodoPago === m.key ? COLORS.ACCENT : "" }}>
                    {m.label}
                  </button>
                ))}
              </div>
              {paymentTouched.metodoPago && paymentErrors.metodoPago && <p className="text-[11px] mt-1 text-red-500">{paymentErrors.metodoPago}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Comprobante</label>
              <input ref={comprobanteInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (!file) return; const err = validarComprobante(file); if (err) { toast.error(err); e.target.value = ""; return }; setComprobanteFile(file); if (file.type.startsWith("image/")) setComprobantePreview(URL.createObjectURL(file)); else setComprobantePreview(null) }} />
              <div onClick={() => !comprobantePreview && comprobanteInputRef.current?.click()} className="relative rounded-lg border-2 border-dashed p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50" style={{ borderColor: paymentErrors.comprobante ? "#ef4444" : COLORS.BORDER_SUBTLE }}>
                {comprobantePreview ? <img src={comprobantePreview} className="max-h-64 rounded" alt="Comprobante" /> : <div className="text-xs text-gray-400">{comprobanteFile ? comprobanteFile.name : "Subir comprobante"}</div>}
              </div>
              {comprobantePreview && (
                <button type="button" onClick={() => { setComprobanteFile(null); setComprobantePreview(null); if (comprobanteInputRef.current) comprobanteInputRef.current.value = "" }}
                  className="text-[11px] mt-1 font-medium hover:underline" style={{ color: "#ef4444" }}>Quitar comprobante</button>
              )}
              {paymentTouched.comprobante && paymentErrors.comprobante && <p className="text-[11px] mt-1 text-red-500">{paymentErrors.comprobante}</p>}
            </div>
          </div>
          <div
            className="rounded-xl border p-4 space-y-3"
            style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 3%, transparent)` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="size-7 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 12%, transparent)` }}
              >
                <HugeiconsIcon icon={esTaller ? BookOpen01Icon : GraduationCapIcon} size={14} style={{ color: COLORS.ACCENT }} />
              </div>
              <h3 className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>
                {esTaller ? tallerSel?.nombre : (curso?.nombre_instancia || curso?.catalogo?.nombre)}
              </h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-1.5">
                <HugeiconsIcon icon={Calendar01Icon} size={13} style={{ color: COLORS.ACCENT }} />
                <span style={{ color: COLORS.TEXT_MUTED }}>Fecha</span>
                <span className="font-medium ml-auto" style={{ color: COLORS.CHARCOAL }}>
                  {esTaller
                    ? formatDateRange(tallerSel?.fecha ?? null, tallerSel?.fecha_fin ?? null)
                    : formatDateRange(curso?.fecha_inicio ?? null, curso?.fecha_fin ?? null)}
                </span>
              </div>
              {(() => {
                const horarioStr = esTaller
                  ? descHorarioTaller(tallerSel?.horarios)
                  : descHorarioCurso(curso?.horario)
                if (!horarioStr) return null
                return (
                  <div className="flex items-start gap-1.5">
                    <HugeiconsIcon icon={Clock01Icon} size={13} style={{ color: "oklch(0.55 0.15 220)" }} className="mt-0.5 shrink-0" />
                    <span style={{ color: COLORS.TEXT_MUTED }}>Horario</span>
                    <span className="font-medium ml-auto text-right" style={{ color: COLORS.CHARCOAL }}>{horarioStr}</span>
                  </div>
                )
              })()}
            </div>
          </div>
          <div className="flex justify-between pt-4"><button onClick={() => setPaso(2)} className="px-5 py-2.5 rounded-lg text-xs font-semibold border">Anterior</button><button onClick={handleSubmit} disabled={loadingSubmit} className="px-8 py-2.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: COLORS.ACCENT }}>{loadingSubmit ? "Enviando..." : "Confirmar Matrícula"}</button></div>
        </div>
      )}
    </div>
  )
}
