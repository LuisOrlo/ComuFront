import { useState, useEffect, useRef, useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Link03Icon, UserIcon, GraduationCapIcon,
  CreditCardIcon, CheckCircle,
  ImageAdd02Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import api from "@/services/auth.service"
import { cursosService, type CatalogoCurso, type CursoAbierto } from "@/services/cursos.service"
import { tallerService } from "@/services/taller.service"
import { toast } from "sonner"
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

const TIPO_OPTIONS = [
  { key: "curso" as const, label: "Curso", desc: "Formación completa en un área específica", categoria: "regular" },
  { key: "taller" as const, label: "Taller", desc: "Capacitación práctica y corta", categoria: "taller" },
  { key: "personalizado" as const, label: "Curso Personalizado", desc: "Programa adaptado a tus necesidades", categoria: "personalizado" },
]

export function NuevaMatriculaPage({ isPublic, onSuccess }: { isPublic?: boolean; onSuccess?: () => void }) {
  const [paso, setPaso] = useState<Paso>(1)
  const [catalogos, setCatalogos] = useState<CatalogoCurso[]>([])
  const [loadingCursos, setLoadingCursos] = useState(false)
  const [cursosAbiertos, setCursosAbiertos] = useState<CursoAbierto[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [talleres, setTalleres] = useState<any[]>([])
  const [subStep, setSubStep] = useState<"modalidad" | "ciudad" | "tipo" | "catalogo" | "lista">("modalidad")
  const [selectedModalidad, setSelectedModalidad] = useState("")
  const [selectedCiudadId, setSelectedCiudadId] = useState<number | null>(null)
  const [selectedCiudadNombre, setSelectedCiudadNombre] = useState("")
  const ciudades = useMemo(() => {
    const seen = new Set<number>()
    const result: Array<{id: number; nombre: string}> = []
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
  const [selectedTipo, setSelectedTipo] = useState("")
  const [selectedCatalogoNombre, setSelectedCatalogoNombre] = useState("")
  const [catalogoFilter, setCatalogoFilter] = useState("")
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

  useEffect(() => {
    cursosService.getCatalogos().then(res => setCatalogos(res.data || [])).catch(() => setCatalogos([]))
  }, [])

  const cargarCursosBase = () => {
    const params: Record<string, string | number> = { per_page: 50, no_iniciados: "true" }
    if (selectedModalidad) params.modalidad = selectedModalidad
    if (selectedCiudadId) params.ciudad_id = selectedCiudadId
    return api.get("/cursos-abiertos", { params })
      .then(res => res.data.data || [])
  }

  const cargarTalleresBase = () => {
    const params: Record<string, unknown> = { per_page: 50, tab: "proximos" }
    if (selectedModalidad) params.modalidad = selectedModalidad
    if (selectedCiudadId) params.ciudad_id = selectedCiudadId
    return api.get("/talleres", { params })
      .then(res => (res.data as { data: unknown[] }).data || [])
  }

  const cargarCursosCatalogo = () => {
    const params: Record<string, string | number> = { per_page: 50, no_iniciados: "true" }
    if (catalogoFilter) params.catalogo_curso_id = catalogoFilter
    if (selectedModalidad) params.modalidad = selectedModalidad
    if (selectedCiudadId) params.ciudad_id = selectedCiudadId
    return api.get("/cursos-abiertos", { params })
      .then(res => res.data.data || [])
  }

  // Cargar cursos y talleres cuando cambia modalidad o ciudad
  useEffect(() => {
    if (!selectedModalidad) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedCourseId("")
    setLoadingCursos(true)

    Promise.allSettled([cargarCursosBase(), cargarTalleresBase()])
      .then(([cursosResult, tallsResult]) => {
        setCursosAbiertos(cursosResult.status === "fulfilled" ? cursosResult.value : [])
        setTalleres(tallsResult.status === "fulfilled" ? tallsResult.value : [])
        if (cursosResult.status === "rejected") console.warn("Cursos no disponibles:", cursosResult.reason)
        if (tallsResult.status === "rejected") console.warn("Talleres no disponibles:", tallsResult.reason)
      })
      .finally(() => setLoadingCursos(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedModalidad, selectedCiudadId])

  // Recargar cursos cuando se selecciona un catálogo específico
  useEffect(() => {
    if (!catalogoFilter || !selectedModalidad) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingCursos(true)

    cargarCursosCatalogo()
      .then(data => setCursosAbiertos(data))
      .catch(reason => { console.warn("Cursos no disponibles:", reason); setCursosAbiertos([]) })
      .finally(() => setLoadingCursos(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogoFilter])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ciudadInputRef.current && !ciudadInputRef.current.parentElement?.contains(e.target as Node)) {
        setCiudadOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const curso = cursosAbiertos.find(c => c.id === selectedCourseId)
  const tallerSel = talleres.find(t => t.id === selectedCourseId)
  const esTaller = !!tallerSel && !curso

  const availableTipos = useMemo(() => {
    return TIPO_OPTIONS.filter(t => {
      if (t.categoria === "taller") return talleres.length > 0
      if (t.categoria === "regular") return cursosAbiertos.some(c => c.catalogo?.categoria === "regular")
      if (t.categoria === "personalizado") return cursosAbiertos.some(c => c.catalogo?.categoria === "personalizado")
      return false
    })
  }, [cursosAbiertos, talleres])

  const sanitizeInput = (campo: string, valor: string): string => {
    if (campo === "telefono") return valor.replace(/[^0-9]/g, "").slice(0, 10)
    if (campo === "cedula" && estudiante.tipo_id === "cedula") return valor.replace(/[^0-9]/g, "").slice(0, 10)
    if (campo === "nombres" || campo === "apellidos") return valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "")
    return valor
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

  function validateField(campo: string, valor: string): string | null {
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
    return null
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

      if (isPublic) onSuccess?.()
      else if (localStorage.getItem("auth_token")) window.location.assign("/matriculas")
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

  const costoTotal = esTaller ? Number(tallerSel?.precio || 0) : Number(curso?.precio_base || 0)

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      {!isPublic && (
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: COLORS.TEXT_MUTED }}>
              <span>Matrículas</span><span>/</span><span className="font-medium" style={{ color: COLORS.CHARCOAL }}>Nueva</span>
            </div>
            <h1 className="text-xl font-bold" style={{ color: COLORS.CHARCOAL }}>Nueva Matrícula</h1>
            <p className="text-sm mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>Completa los datos para inscribir a un estudiante</p>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/matricula/nueva`); toast.success("Enlace copiado") }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold border transition-all hover:bg-black/5"
            style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}>
            <HugeiconsIcon icon={Link03Icon} size={14} />Compartir enlace público
          </button>
        </div>
      )}

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
            <div><label className="block text-xs font-medium mb-1.5">Estado Civil</label><select value={estudiante.estado_civil} onChange={e => updateEstudiante("estado_civil", e.target.value)} onBlur={() => blurEstudiante("estado_civil")} className="w-full px-3.5 py-2.5 rounded-lg text-sm border bg-white outline-none" style={{ borderColor: touched.estado_civil && errors.estado_civil ? "#ef4444" : COLORS.BORDER_SUBTLE }}><option value="">Seleccionar...</option><option value="soltero">Soltero</option><option value="casado">Casado</option></select>{touched.estado_civil && errors.estado_civil && <p className="text-[11px] mt-1 text-red-500">{errors.estado_civil}</p>}</div>
            <div><label className="block text-xs font-medium mb-1.5">Fecha de Nacimiento</label><input type="date" value={estudiante.fecha_nacimiento} onChange={e => { const fn = e.target.value; updateEstudiante("fecha_nacimiento", fn); setEstudiante(prev => ({ ...prev, fecha_nacimiento: fn, edad: calcularEdad(fn) })) }} onBlur={() => blurEstudiante("fecha_nacimiento")} className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none" style={{ borderColor: touched.fecha_nacimiento && errors.fecha_nacimiento ? "#ef4444" : COLORS.BORDER_SUBTLE }} />{touched.fecha_nacimiento && errors.fecha_nacimiento && <p className="text-[11px] mt-1 text-red-500">{errors.fecha_nacimiento}</p>}</div>
            <div><label className="block text-xs font-medium mb-1.5">Edad</label><input type="number" readOnly value={estudiante.edad} className="w-full px-3.5 py-2.5 rounded-lg text-sm border bg-gray-50" /></div>
            <div className="relative">
              <label className="block text-xs font-medium mb-1.5">Residencia</label>
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
            <div><label className="block text-xs font-medium mb-1.5">Dirección</label><input type="text" value={estudiante.direccion} onChange={e => updateEstudiante("direccion", e.target.value)} onBlur={() => blurEstudiante("direccion")} placeholder="Av. Siempre Viva 123" className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none" style={{ borderColor: touched.direccion && errors.direccion ? "#ef4444" : COLORS.BORDER_SUBTLE }} />{touched.direccion && errors.direccion && <p className="text-[11px] mt-1 text-red-500">{errors.direccion}</p>}</div>
            
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
          <div className="flex justify-end pt-2"><button onClick={handleNext} className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-accent" style={{ backgroundColor: COLORS.ACCENT }}>Siguiente</button></div>
        </div>
      )}

      {paso === 2 && (
        <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="flex items-center gap-0">
            {[{ key: "modalidad", label: "Modalidad" }, { key: "ciudad", label: "Ciudad" }, { key: "tipo", label: "Tipo" }, { key: "catalogo", label: "Curso" }, { key: "lista", label: "Disponibles" }].map((s, i) => {
              const stepOrder = ["modalidad", "ciudad", "tipo", "catalogo", "lista"]
              const currentIdx = stepOrder.indexOf(subStep)
              const isPast = currentIdx > i
              const isCurrent = subStep === s.key
              return (
                <div key={s.key} className="flex items-center gap-0 flex-1">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold transition-colors"
                    style={{ backgroundColor: isCurrent ? `color-mix(in srgb, ${COLORS.ACCENT} 12%, transparent)` : "transparent", color: isCurrent || isPast ? COLORS.ACCENT : COLORS.TEXT_MUTED }}>
                    <div className="size-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{ backgroundColor: isPast ? COLORS.ACCENT : isCurrent ? COLORS.ACCENT : "oklch(0.90 0 0)", color: isPast || isCurrent ? "#fff" : COLORS.TEXT_MUTED }}>
                      {i + 1}
                    </div>
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {i < 4 && <div className="flex-1 h-px mx-2" style={{ backgroundColor: isPast ? COLORS.ACCENT : COLORS.BORDER_SUBTLE }} />}
                </div>
              )
            })}
          </div>

          {subStep === "modalidad" && (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>Selecciona tu modalidad</p>
              <div className="grid grid-cols-2 gap-3">
                {["presencial", "virtual"].map(mod => (
                  <button key={mod} onClick={() => { setSelectedModalidad(mod); setSelectedCiudadId(null); setSelectedCiudadNombre(""); setSelectedTipo(""); setCatalogoFilter(""); setSelectedCatalogoNombre(""); if (mod === "virtual") { setSubStep("tipo") } else setSubStep("ciudad") }}
                    className="rounded-xl border-2 p-6 text-center cursor-pointer transition-all hover:shadow-md"
                    style={{ borderColor: selectedModalidad === mod ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, backgroundColor: selectedModalidad === mod ? `color-mix(in srgb, ${COLORS.ACCENT} 6%, transparent)` : "white" }}>
                    <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3"
                      style={{ backgroundColor: selectedModalidad === mod ? `color-mix(in srgb, ${COLORS.ACCENT} 15%, transparent)` : "oklch(0.93 0 0)" }}>
                      <HugeiconsIcon icon={mod === "presencial" ? UserIcon : GraduationCapIcon} size={22}
                        style={{ color: selectedModalidad === mod ? COLORS.ACCENT : "oklch(0.55 0 0)" }} />
                    </div>
                    <div className="text-sm font-bold" style={{ color: selectedModalidad === mod ? COLORS.ACCENT : COLORS.CHARCOAL }}>
                      {mod === "presencial" ? "Presencial" : "Virtual"}
                    </div>
                    <div className="text-[11px] mt-1" style={{ color: COLORS.TEXT_MUTED }}>
                      {mod === "presencial" ? "Clases en nuestras instalaciones con instructor en vivo" : "Clases en línea en vivo desde cualquier lugar"}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

              {subStep === "ciudad" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium" style={{ color: COLORS.TEXT_MUTED }}>Modalidad:</span>
                <span className="text-xs font-semibold" style={{ color: COLORS.ACCENT }}>{selectedModalidad === "presencial" ? "Presencial" : "Virtual"}</span>
                <button onClick={() => setSubStep("modalidad")} className="ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-colors hover:bg-gray-50" style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}>Regresar</button>
              </div>
              <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>Selecciona la ciudad donde deseas estudiar</p>
              <p className="text-[11px]" style={{ color: COLORS.TEXT_MUTED }}>Las ciudades mostradas cuentan actualmente con cursos, talleres o cursos personalizados disponibles.</p>
              {ciudades.length === 0 ? (
                <div className="py-8 text-center text-sm" style={{ color: COLORS.TEXT_MUTED }}>
                  {loadingCursos ? "Cargando ciudades..." : "No hay ciudades disponibles"}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ciudades.map(c => (
                    <button key={c.id} onClick={() => { setSelectedCiudadId(c.id); setSelectedCiudadNombre(c.nombre); setSubStep("tipo") }}
                      className="px-4 py-3 rounded-lg text-sm font-medium border transition-all hover:shadow-sm text-left"
                      style={{ borderColor: selectedCiudadId === c.id ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, backgroundColor: selectedCiudadId === c.id ? `color-mix(in srgb, ${COLORS.ACCENT} 6%, transparent)` : "white", color: selectedCiudadId === c.id ? COLORS.ACCENT : COLORS.CHARCOAL }}>
                      {c.nombre}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {subStep === "tipo" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium" style={{ color: COLORS.TEXT_MUTED }}>Modalidad:</span>
                <span className="text-xs font-semibold" style={{ color: COLORS.ACCENT }}>{selectedModalidad === "presencial" ? "Presencial" : "Virtual"}</span>
                {selectedModalidad === "presencial" && (
                  <>
                    <span className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>|</span>
                    <span className="text-xs font-medium" style={{ color: COLORS.TEXT_MUTED }}>Ciudad:</span>
                    <span className="text-xs font-semibold" style={{ color: COLORS.ACCENT }}>{selectedCiudadNombre}</span>
                  </>
                )}
                <button onClick={() => selectedModalidad === "virtual" ? setSubStep("modalidad") : setSubStep("ciudad")} className="ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-colors hover:bg-gray-50" style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}>Cambiar</button>
              </div>
              <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>Selecciona el tipo de programa que deseas estudiar</p>
              {loadingCursos ? (
                <div className="py-8 text-center text-sm" style={{ color: COLORS.TEXT_MUTED }}>Verificando programas disponibles...</div>
              ) : availableTipos.length === 0 ? (
                <div className="py-8 text-center text-sm" style={{ color: COLORS.TEXT_MUTED }}>No hay programas disponibles para esta modalidad{selectedModalidad === "presencial" && selectedCiudadNombre ? " y ciudad" : ""}</div>
              ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {availableTipos.map(t => (
                  <button key={t.key} onClick={() => { setSelectedTipo(t.key); setCatalogoFilter(""); setSelectedCatalogoNombre(""); setSelectedCourseId(""); setSubStep(t.key === "taller" ? "lista" : "catalogo") }}
                    className="rounded-xl border-2 p-6 text-center cursor-pointer transition-all hover:shadow-md"
                    style={{ borderColor: selectedTipo === t.key ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, backgroundColor: selectedTipo === t.key ? `color-mix(in srgb, ${COLORS.ACCENT} 6%, transparent)` : "white" }}>
                    <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3"
                      style={{ backgroundColor: selectedTipo === t.key ? `color-mix(in srgb, ${COLORS.ACCENT} 15%, transparent)` : "oklch(0.93 0 0)" }}>
                      <HugeiconsIcon icon={GraduationCapIcon} size={22}
                        style={{ color: selectedTipo === t.key ? COLORS.ACCENT : "oklch(0.55 0 0)" }} />
                    </div>
                    <div className="text-sm font-bold" style={{ color: selectedTipo === t.key ? COLORS.ACCENT : COLORS.CHARCOAL }}>
                      {t.label}
                    </div>
                    <div className="text-[11px] mt-1" style={{ color: COLORS.TEXT_MUTED }}>{t.desc}</div>
                  </button>
                  ))}
                </div>
            )}
            </div>
          )}

          {subStep === "catalogo" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium" style={{ color: COLORS.TEXT_MUTED }}>Modalidad:</span>
                <span className="text-xs font-semibold" style={{ color: COLORS.ACCENT }}>{selectedModalidad === "presencial" ? "Presencial" : "Virtual"}</span>
                {selectedModalidad === "presencial" && (
                  <>
                    <span className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>|</span>
                    <span className="text-xs font-medium" style={{ color: COLORS.TEXT_MUTED }}>Ciudad:</span>
                    <span className="text-xs font-semibold" style={{ color: COLORS.ACCENT }}>{selectedCiudadNombre}</span>
                  </>
                )}
                <span className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>|</span>
                <span className="text-xs font-medium" style={{ color: COLORS.TEXT_MUTED }}>Tipo:</span>
                <span className="text-xs font-semibold" style={{ color: COLORS.ACCENT }}>{selectedTipo === "curso" ? "Curso" : selectedTipo === "taller" ? "Taller" : "Personalizado"}</span>
                <button onClick={() => setSubStep("tipo")} className="ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-colors hover:bg-gray-50" style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}>Cambiar</button>
              </div>
              <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>Selecciona el curso que deseas estudiar</p>
              {loadingCursos ? (
                <div className="py-8 text-center text-sm" style={{ color: COLORS.TEXT_MUTED }}>Cargando cursos...</div>
              ) : catalogos.length === 0 ? (
                <div className="py-8 text-center text-sm" style={{ color: COLORS.TEXT_MUTED }}>No hay cursos disponibles</div>
              ) : (() => {
                const availableCatalogoIds = new Set(cursosAbiertos.map(c => c.catalogo?.id).filter(Boolean))
                const filtrados = catalogos
                  .filter(c => c.es_activo !== false)
                  .filter(c => c.categoria === (selectedTipo === "curso" ? "regular" : selectedTipo))
                  .filter(c => availableCatalogoIds.has(c.id))
                if (filtrados.length === 0) {
                  return <div className="py-8 text-center text-sm" style={{ color: COLORS.TEXT_MUTED }}>No hay {selectedTipo === "curso" ? "cursos" : selectedTipo === "taller" ? "talleres" : "cursos personalizados"} disponibles para esta ciudad y modalidad</div>
                }
                return (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1">
                  {filtrados.map(cat => (
                    <button key={cat.id} onClick={() => { setCatalogoFilter(cat.id); setSelectedCatalogoNombre(cat.nombre); setSubStep("lista") }}
                      className="rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-md text-left"
                      style={{ borderColor: catalogoFilter === cat.id ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, backgroundColor: catalogoFilter === cat.id ? `color-mix(in srgb, ${COLORS.ACCENT} 6%, transparent)` : "white" }}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold leading-snug" style={{ color: catalogoFilter === cat.id ? COLORS.ACCENT : COLORS.CHARCOAL }}>{cat.nombre}</span>
                        <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded" style={{
                          backgroundColor: cat.categoria === "regular" ? "oklch(0.92 0.08 220)" : cat.categoria === "taller" ? "oklch(0.92 0.05 80)" : "oklch(0.92 0.05 160)",
                          color: cat.categoria === "regular" ? "oklch(0.45 0.12 220)" : cat.categoria === "taller" ? "oklch(0.55 0.12 70)" : "oklch(0.45 0.12 160)"
                        }}>
                          {cat.categoria === "regular" ? "Curso" : cat.categoria === "taller" ? "Taller" : "Personalizado"}
                        </span>
                      </div>
                      {cat.descripcion && <p className="text-[11px] mt-1.5 line-clamp-2" style={{ color: COLORS.TEXT_MUTED }}>{cat.descripcion}</p>}
                    </button>
                  ))}
                </div>
              )})()}
            </div>
          )}

          {subStep === "lista" && (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedTipo === "taller" ? (
                  <>
                    <span className="text-xs font-medium" style={{ color: COLORS.TEXT_MUTED }}>Tipo:</span>
                    <span className="text-xs font-semibold" style={{ color: COLORS.ACCENT }}>Taller</span>
                    <button onClick={() => setSubStep("tipo")} className="ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-colors hover:bg-gray-50" style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}>Cambiar</button>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-medium" style={{ color: COLORS.TEXT_MUTED }}>Curso seleccionado:</span>
                    <span className="text-sm font-bold" style={{ color: COLORS.ACCENT }}>{selectedCatalogoNombre}</span>
                    <button onClick={() => setSubStep("catalogo")} className="ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-md border transition-colors hover:bg-gray-50" style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}>Cambiar</button>
                  </>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                {loadingCursos ? (
                  <div className="col-span-full py-8 text-center text-sm" style={{ color: COLORS.TEXT_MUTED }}>Cargando...</div>
                ) : (() => {
                  const items: { tipo: "curso" | "taller"; id: string }[] = []
                  if (selectedTipo === "taller") {
                    items.push(...talleres.map(t => ({ tipo: "taller" as const, id: t.id })))
                  } else {
                    items.push(...cursosAbiertos.map(c => ({ tipo: "curso" as const, id: c.id })))
                  }

                  if (items.length === 0) {
                    return (
                      <div className="col-span-full py-8 text-center space-y-3">
                        <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>
                          No hay {selectedTipo === "curso" ? "cursos" : selectedTipo === "taller" ? "talleres" : "cursos personalizados"} disponibles para esta ciudad y modalidad
                        </p>
                        {selectedTipo === "curso" && talleres.length > 0 && (
                          <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                            Hay {talleres.length} taller(es) disponible(s).{" "}
                            <button onClick={() => { setSelectedTipo("taller"); setCatalogoFilter(""); setSelectedCatalogoNombre(""); setSubStep("lista") }}
                              className="font-semibold underline" style={{ color: COLORS.ACCENT }}>
                              Ver talleres
                            </button>
                          </p>
                        )}
                      </div>
                    )
                  }

                  return items.map(item => {
                    const selected = selectedCourseId === item.id
                    if (item.tipo === "taller") {
                      const t = talleres.find(t => t.id === item.id)
                      if (!t) return null
                      return (
                        <div key={t.id} onClick={() => setSelectedCourseId(t.id)}
                          className="rounded-lg border p-3 cursor-pointer transition-all shadow-sm hover:shadow-md relative"
                          style={{ borderTopColor: selected ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, borderRightColor: selected ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, borderBottomColor: selected ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, backgroundColor: selected ? `color-mix(in srgb, ${COLORS.ACCENT} 4%, transparent)` : "white", borderLeft: `3px solid ${selected ? COLORS.ACCENT : "#e5e7eb"}` }}>
                          <div className="flex justify-between items-start">
                            <div className="min-w-0 flex-1">
                              <div className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mb-1"
                                style={{ backgroundColor: "oklch(0.92 0.05 80)", color: "oklch(0.55 0.12 70)" }}>Taller</div>
                              <h3 className="text-sm font-bold leading-tight" style={{ color: selected ? COLORS.ACCENT : COLORS.CHARCOAL }}>{t.nombre}</h3>
                            </div>
                            <div className="text-sm font-black text-emerald-600 ml-1 shrink-0">${Number(t.precio || 0).toFixed(2)}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-x-2 mt-2 text-xs">
                            <div className="col-span-2"><span className="font-semibold text-orange-600">Instructor: </span>{t.instructor ? `${t.instructor.nombres} ${t.instructor.apellidos}` : "Por asignar"}</div>
                            <div className="mt-1"><span className="font-semibold text-blue-600">Fecha: </span>{t.fecha ? new Date(t.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</div>
                            <div className="mt-1"><span className="font-semibold text-blue-600">Horario: </span>{t.hora_inicio?.substring(0, 5)} - {t.hora_fin?.substring(0, 5)}</div>
                            <div className="col-span-2 mt-1"><span className="font-semibold text-purple-600">Modalidad: </span>{(t.modalidad || "").toUpperCase()}</div>
                          </div>
                          {selected && <div className="absolute top-1 right-1"><HugeiconsIcon icon={CheckCircle} size={14} style={{ color: COLORS.ACCENT }} /></div>}
                        </div>
                      )
                    }
                    const ca = cursosAbiertos.find(c => c.id === item.id)
                    if (!ca) return null
                    const horario = ca.horarios?.[0]
                    return (
                      <div key={ca.id} onClick={() => setSelectedCourseId(ca.id)}
                        className="rounded-lg border p-3 cursor-pointer transition-all shadow-sm hover:shadow-md relative"
                        style={{ borderColor: selected ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, backgroundColor: selected ? `color-mix(in srgb, ${COLORS.ACCENT} 4%, transparent)` : "white", borderLeft: `3px solid ${selected ? COLORS.ACCENT : "#e5e7eb"}` }}>
                        <div className="flex justify-between items-start">
                          <div className="min-w-0 flex-1">
                            <div className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mb-1"
                              style={{ backgroundColor: "oklch(0.92 0.08 220)", color: "oklch(0.45 0.12 220)" }}>Curso</div>
                            <h3 className="text-sm font-bold leading-tight" style={{ color: selected ? COLORS.ACCENT : COLORS.CHARCOAL }}>{ca.nombre_instancia || ca.catalogo?.nombre}</h3>
                          </div>
                          <div className="text-sm font-black text-emerald-600 ml-1 shrink-0">${Number(ca.precio_base || 0).toFixed(2)}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 mt-2 text-xs">
                          <div className="col-span-2"><span className="font-semibold text-orange-600">Instructor: </span>{ca.docente?.nombres} {ca.docente?.apellidos || "Por asignar"}</div>
                          <div className="mt-1"><span className="font-semibold text-blue-600">Inicio: </span>{ca.fecha_inicio ? new Date(ca.fecha_inicio).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '—'}</div>
                          <div className="mt-1"><span className="font-semibold text-blue-600">Fin: </span>{ca.fecha_fin ? new Date(ca.fecha_fin).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '—'}</div>
                          <div className="col-span-2 mt-1"><span className="font-semibold text-purple-600">Modalidad: </span>{(ca.modalidad || "").toUpperCase()}</div>
                          {horario && <div className="col-span-2 mt-1"><span className="font-semibold text-gray-500">Horario: </span>{horario.dia} | {horario.hora_inicio?.substring(0, 5)} - {horario.hora_fin?.substring(0, 5)}</div>}
                        </div>
                        {selected && <div className="absolute top-0.5 right-0.5"><HugeiconsIcon icon={CheckCircle} size={14} style={{ color: COLORS.ACCENT }} /></div>}
                      </div>
                    )
                  })
                })()}
              </div>
            </>
          )}

          <div className="flex justify-between pt-2">
            <button onClick={() => {
              if (subStep === "modalidad") setPaso(1)
              else if (subStep === "ciudad") setSubStep("modalidad")
              else if (subStep === "tipo") {
                if (selectedModalidad === "virtual") setSubStep("modalidad")
                else setSubStep("ciudad")
              }
              else if (subStep === "catalogo") setSubStep("tipo")
              else if (subStep === "lista") {
                if (selectedTipo === "taller") setSubStep("tipo")
                else setSubStep("catalogo")
              }
            }} className="px-4 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              Anterior
            </button>
            <button onClick={() => {
              if (subStep === "lista") handleNext()
              else if (subStep === "modalidad" && selectedModalidad) {
                if (selectedModalidad === "virtual") setSubStep("tipo")
                else setSubStep("ciudad")
              }
              else if (subStep === "ciudad" && selectedCiudadId) setSubStep("tipo")
              else if (subStep === "tipo" && selectedTipo) {
                if (selectedTipo === "taller") setSubStep("lista")
                else setSubStep("catalogo")
              }
              else if (subStep === "catalogo" && catalogoFilter) setSubStep("lista")
            }} disabled={subStep === "modalidad" ? !selectedModalidad : subStep === "ciudad" ? !selectedCiudadId : subStep === "tipo" ? !selectedTipo : subStep === "catalogo" ? !catalogoFilter : !selectedCourseId}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50" style={{ backgroundColor: COLORS.ACCENT }}>
              {subStep === "lista" ? "Siguiente" : "Continuar"}
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
              <input ref={comprobanteInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) { setComprobanteFile(file); if (file.type.startsWith("image/")) setComprobantePreview(URL.createObjectURL(file)); else setComprobantePreview(null) } }} />
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
          <div className="p-4 rounded-xl bg-gray-50 space-y-2 text-sm border">
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: COLORS.TEXT_MUTED }}>Detalle del {esTaller ? "Taller" : "Curso"}</h3>
            <div className="flex justify-between"><span>Nombre</span><span className="font-bold text-right ml-4">{esTaller ? tallerSel?.nombre : (curso?.nombre_instancia || curso?.catalogo?.nombre)}</span></div>
            {esTaller ? (
              <>
                <div className="flex justify-between"><span>Instructor</span><span className="text-right ml-4">{tallerSel?.instructor ? `${tallerSel.instructor.nombres} ${tallerSel.instructor.apellidos}` : "Por asignar"}</span></div>
                <div className="flex justify-between"><span>Modalidad</span><span className="text-right ml-4">{tallerSel?.modalidad?.toUpperCase() || "—"}</span></div>
                <div className="flex justify-between"><span>Fecha</span><span className="text-right ml-4">{tallerSel?.fecha ? new Date(tallerSel.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : "—"}</span></div>
                <div className="flex justify-between"><span>Horario</span><span className="text-right ml-4">{tallerSel?.hora_inicio?.substring(0, 5)} - {tallerSel?.hora_fin?.substring(0, 5)}</span></div>
              </>
            ) : (
              <>
                <div className="flex justify-between"><span>Instructor</span><span className="text-right ml-4">{curso?.docente?.nombres} {curso?.docente?.apellidos || "Por asignar"}</span></div>
                <div className="flex justify-between"><span>Modalidad</span><span className="text-right ml-4">{curso?.modalidad?.toUpperCase() || "—"}</span></div>
                {curso?.modalidad === "presencial" && curso?.ciudad && (
                  <div className="flex justify-between"><span>Ciudad</span><span className="text-right ml-4">{curso.ciudad.nombre}</span></div>
                )}
                <div className="flex justify-between"><span>Inicio</span><span className="text-right ml-4">{curso?.fecha_inicio ? new Date(curso.fecha_inicio).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : "—"}</span></div>
                <div className="flex justify-between"><span>Fin</span><span className="text-right ml-4">{curso?.fecha_fin ? new Date(curso.fecha_fin).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : "—"}</span></div>
                {curso?.horarios?.[0] && (
                  <div className="flex justify-between"><span>Horario</span><span className="text-right ml-4">{curso.horarios[0].dia} | {curso.horarios[0].hora_inicio?.substring(0, 5)} - {curso.horarios[0].hora_fin?.substring(0, 5)}</span></div>
                )}
              </>
            )}
            <div className="flex justify-between border-t pt-2 mt-2 font-bold"><span>Precio del {esTaller ? "taller" : "curso"}</span><span className="text-emerald-600 text-lg">${costoTotal.toFixed(2)}</span></div>
            
          </div>
          <div className="flex justify-between pt-4"><button onClick={() => setPaso(2)} className="px-5 py-2.5 rounded-lg text-xs font-semibold border">Anterior</button><button onClick={handleSubmit} disabled={loadingSubmit} className="px-8 py-2.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: COLORS.ACCENT }}>{loadingSubmit ? "Enviando..." : "Confirmar Matrícula"}</button></div>
        </div>
      )}
    </div>
  )
}
