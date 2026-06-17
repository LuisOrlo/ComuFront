import { useState, useEffect, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Link03Icon, UserIcon, GraduationCapIcon,
  CreditCardIcon, CheckCircle,
  ImageAdd02Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cursosService, type CatalogoCurso, type CursoAbierto } from "@/services/cursos.service"
import { tallerService } from "@/services/taller.service"
import axios from "axios"
import { toast } from "sonner"

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

const API_BASE = import.meta.env.VITE_API_URL

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

export function NuevaMatriculaPage({ isPublic, onSuccess }: { isPublic?: boolean; onSuccess?: () => void }) {
  const [paso, setPaso] = useState<Paso>(1)
  const [catalogos, setCatalogos] = useState<CatalogoCurso[]>([])
  const [loadingCursos, setLoadingCursos] = useState(false)
  const [cursosAbiertos, setCursosAbiertos] = useState<CursoAbierto[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [talleres, setTalleres] = useState<any[]>([])
  const [catalogoFilter, setCatalogoFilter] = useState("")
  const [ciudadFilter, setCiudadFilter] = useState("")
  const [modalidadFilter, setModalidadFilter] = useState("")
  const [tipoFilter, setTipoFilter] = useState("todos")
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [estudiante, setEstudiante] = useState<EstudianteData>({
    tipo_id: "cedula",
    nombres: "", apellidos: "", cedula: "", telefono: "", correo: "",
    ocupacion: "", direccion: "", estado_civil: "", fecha_nacimiento: "", edad: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [cedulaFile, setCedulaFile] = useState<File | null>(null)
  const [cedulaPreview, setCedulaPreview] = useState<string | null>(null)
  const [tipoAbono, setTipoAbono] = useState<"completo" | "abono">("completo")
  const [montoAbono, setMontoAbono] = useState("")
  const [metodoPago, setMetodoPago] = useState("")
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null)
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(null)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({})
  const [paymentTouched, setPaymentTouched] = useState<Record<string, boolean>>({})

  const cedulaInputRef = useRef<HTMLInputElement>(null)
  const comprobanteInputRef = useRef<HTMLInputElement>(null)

  const metodosPago = [
    { key: "efectivo", label: "Efectivo" },
    { key: "transferencia", label: "Transferencia Bancaria" },
    { key: "deposito", label: "Depósito" },
  ]

  useEffect(() => {
    cursosService.getCatalogos().then(res => setCatalogos(res.data || [])).catch(() => setCatalogos([]))
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedCourseId("")
    const token = localStorage.getItem("auth_token")
    setLoadingCursos(true)

    const cargarCursos = () => {
      const params: Record<string, string> = { per_page: "50", no_iniciados: "true" }
      if (catalogoFilter) params.catalogo_curso_id = catalogoFilter
      if (ciudadFilter) params.ciudad = ciudadFilter
      if (modalidadFilter) params.modalidad = modalidadFilter
      if (tipoFilter === "cursos") params.categoria = "regular"
      return axios.get(`${API_BASE}/cursos-abiertos`, {
        params,
        headers: { Accept: "application/json", Authorization: token ? `Bearer ${token}` : "" },
      }).then(res => res.data.data || [])
    }

    const cargarTalleres = () =>
      tallerService.listar({ per_page: 50, tab: "proximos" })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then(res => (res as any).data || [])

    if (tipoFilter === "todos") {
      Promise.all([cargarCursos(), cargarTalleres()])
        .then(([cursos, talls]) => {
          setCursosAbiertos(cursos)
          setTalleres(talls)
        })
        .catch(() => { setCursosAbiertos([]); setTalleres([]) })
        .finally(() => setLoadingCursos(false))
    } else if (tipoFilter === "cursos") {
      cargarCursos()
        .then(res => { setCursosAbiertos(res); setTalleres([]) })
        .catch(() => setCursosAbiertos([]))
        .finally(() => setLoadingCursos(false))
    } else {
      cargarTalleres()
        .then(res => { setTalleres(res); setCursosAbiertos([]) })
        .catch(() => setTalleres([]))
        .finally(() => setLoadingCursos(false))
    }
  }, [catalogoFilter, ciudadFilter, modalidadFilter, tipoFilter])

  const curso = cursosAbiertos.find(c => c.id === selectedCourseId)
  const tallerSel = talleres.find(t => t.id === selectedCourseId)
  const esTaller = tipoFilter === "taller" || (tipoFilter === "todos" && !!tallerSel && !curso)

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
    const fields: (keyof EstudianteData)[] = ["cedula", "nombres", "apellidos", "telefono", "correo"]
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
    if (tipoAbono === "abono") {
      const monto = Number(montoAbono)
      if (!montoAbono.trim()) errs.montoAbono = "Indica el monto a abonar"
      else if (monto <= 0) errs.montoAbono = "El monto debe ser mayor a cero"
      else if (monto > costoTotal) errs.montoAbono = `El monto no puede superar $${costoTotal.toFixed(2)}`
    }
    if (!esTaller && !comprobanteFile) errs.comprobante = "Adjunta el comprobante de pago"
    setPaymentErrors(errs)
    setPaymentTouched({ metodoPago: true, montoAbono: true, comprobante: true })
    return Object.keys(errs).length === 0
  }

  function validateField(campo: string, valor: string): string | null {
    const labels: Record<string, string> = {
      cedula: estudiante.tipo_id === "cedula" ? "Cédula" : "DNI",
      nombres: "Nombres", apellidos: "Apellidos", telefono: "Teléfono", correo: "Correo",
    }
    if (["cedula", "nombres", "apellidos", "telefono", "correo"].includes(campo) && !valor.trim()) {
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

  const handleMontoAbonoChange = (valor: string) => {
    setMontoAbono(valor)
    if (!paymentTouched.montoAbono) return
    const monto = Number(valor)
    const errs = { ...paymentErrors }
    if (!valor.trim()) errs.montoAbono = "Indica el monto a abonar"
    else if (monto <= 0) errs.montoAbono = "El monto debe ser mayor a cero"
    else if (monto > costoTotal) errs.montoAbono = `El monto no puede superar $${costoTotal.toFixed(2)}`
    else delete errs.montoAbono
    setPaymentErrors(errs)
  }

  const handleSubmit = async () => {
    if (!validateStep3()) return
    setLoadingSubmit(true)
    try {
      const monto = tipoAbono === "completo" ? costoTotal : Number(montoAbono) || 0

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
          estado_civil: estudiante.estado_civil || undefined,
          fecha_nacimiento: estudiante.fecha_nacimiento || undefined,
          edad: estudiante.edad ? Number(estudiante.edad) : undefined,
          tipo_pago: tipoAbono,
          monto_pagado: monto,
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
        formData.append("tipo_pago", tipoAbono)
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
        formData.append("estado_civil", estudiante.estado_civil)
        formData.append("fecha_nacimiento", estudiante.fecha_nacimiento)
        formData.append("edad", estudiante.edad)
        formData.append("monto_solicitado", monto.toString())
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
  const montoCalculado = tipoAbono === "completo" ? costoTotal : (Number(montoAbono) || 0)
  const saldoRestante = Math.max(0, costoTotal - montoCalculado)

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
        <div className="rounded-xl border p-6 space-y-5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.CHARCOAL }}>
              <HugeiconsIcon icon={UserIcon} size={16} style={{ color: COLORS.ACCENT }} />Datos del Estudiante
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(["cedula", "nombres", "apellidos", "telefono", "correo"] as const).map(campo => (
              <div key={campo} className={campo === "correo" ? "sm:col-span-1" : ""}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium">{campo === "cedula" ? (estudiante.tipo_id === "cedula" ? "Cédula" : "DNI") : campo === "nombres" ? "Nombres" : campo === "apellidos" ? "Apellidos" : campo === "telefono" ? "Teléfono" : "Correo Electrónico"}</label>
                  {campo === "cedula" && (
                    <div className="flex p-0.5 rounded-lg bg-gray-100 border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                      {["cedula", "dni"].map((type) => (
                        <button key={type} type="button" onClick={() => { setEstudiante(prev => ({ ...prev, tipo_id: type as "cedula" | "dni", cedula: "" })); setErrors(prev => { const n = { ...prev }; delete n.cedula; return n }); setTouched(prev => { const n = { ...prev }; delete n.cedula; return n }) }}
                          className="px-2 py-1 rounded-md text-[10px] font-bold uppercase transition-all"
                          style={{ backgroundColor: estudiante.tipo_id === type ? "white" : "transparent", color: estudiante.tipo_id === type ? COLORS.ACCENT : COLORS.TEXT_MUTED }}>{type}</button>
                      ))}
                    </div>
                  )}
                </div>
                <input type="text" value={estudiante[campo]} onChange={e => updateEstudiante(campo, e.target.value)} onBlur={() => blurEstudiante(campo)} placeholder={placeholders[campo]}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none" style={{ borderColor: touched[campo] && errors[campo] ? "#ef4444" : COLORS.BORDER_SUBTLE }} />
                {touched[campo] && errors[campo] && <p className="text-[11px] mt-1 text-red-500">{errors[campo]}</p>}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium mb-1.5">Ocupación</label><input type="text" value={estudiante.ocupacion} onChange={e => setEstudiante({...estudiante, ocupacion: e.target.value})} placeholder="Ej: Estudiante, Ingeniero..." className="w-full px-3.5 py-2.5 rounded-lg text-sm border" style={{ borderColor: COLORS.BORDER_SUBTLE }} /></div>
            <div><label className="block text-xs font-medium mb-1.5">Estado Civil</label><select value={estudiante.estado_civil} onChange={e => setEstudiante({...estudiante, estado_civil: e.target.value})} className="w-full px-3.5 py-2.5 rounded-lg text-sm border bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}><option value="">Seleccionar...</option><option value="soltero">Soltero</option><option value="casado">Casado</option></select></div>
            <div><label className="block text-xs font-medium mb-1.5">Fecha de Nacimiento</label><input type="date" value={estudiante.fecha_nacimiento} onChange={e => { const fn = e.target.value; setEstudiante({...estudiante, fecha_nacimiento: fn, edad: calcularEdad(fn)}) }} className="w-full px-3.5 py-2.5 rounded-lg text-sm border" style={{ borderColor: COLORS.BORDER_SUBTLE }} /></div>
            <div><label className="block text-xs font-medium mb-1.5">Edad</label><input type="number" readOnly value={estudiante.edad} className="w-full px-3.5 py-2.5 rounded-lg text-sm border bg-gray-50" /></div>
            <div className="col-span-2"><label className="block text-xs font-medium mb-1.5">Dirección</label><input type="text" value={estudiante.direccion} onChange={e => setEstudiante({...estudiante, direccion: e.target.value})} placeholder="Av. Siempre Viva 123" className="w-full px-3.5 py-2.5 rounded-lg text-sm border" style={{ borderColor: COLORS.BORDER_SUBTLE }} /></div>
          </div>
          <div>
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
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-sm font-semibold flex items-center gap-2"><HugeiconsIcon icon={GraduationCapIcon} size={16} style={{ color: COLORS.ACCENT }} />Seleccionar Curso o Taller</h2>
            <div className="flex flex-wrap items-center gap-2">
              <select value={tipoFilter} onChange={e => setTipoFilter(e.target.value)}
                className="px-3 py-2 rounded-lg text-xs font-medium border bg-white outline-none" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <option value="todos">Todos</option>
                <option value="cursos">Cursos</option>
                <option value="taller">Talleres</option>
              </select>
              {!esTaller && (
                <select value={catalogoFilter} onChange={e => setCatalogoFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg text-xs border bg-white outline-none" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <option value="">Catálogo</option>
                  {catalogos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              )}
              <select value={modalidadFilter} onChange={e => setModalidadFilter(e.target.value)}
                className="px-3 py-2 rounded-lg text-xs border bg-white outline-none" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <option value="">Modalidad</option>
                <option value="presencial">Presencial</option>
                <option value="virtual">Virtual</option>
              </select>
              {!esTaller && (
                <select value={ciudadFilter} onChange={e => setCiudadFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg text-xs border bg-white outline-none" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <option value="">Ciudad</option>
                  {Array.from(new Set(cursosAbiertos.filter(c => c.ciudad?.nombre).map(c => c.ciudad!.nombre))).map(ciudad => <option key={ciudad} value={ciudad}>{ciudad}</option>)}
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[450px] overflow-y-auto pr-1">
            {loadingCursos ? (
              <div className="col-span-full py-8 text-center text-sm" style={{ color: COLORS.TEXT_MUTED }}>Cargando...</div>
            ) : (() => {
              const items: { tipo: "curso" | "taller"; id: string }[] = []
              if (tipoFilter === "taller" || tipoFilter === "todos") items.push(...talleres.map(t => ({ tipo: "taller" as const, id: t.id })))
              if (tipoFilter !== "taller") items.push(...cursosAbiertos.map(c => ({ tipo: "curso" as const, id: c.id })))

              if (items.length === 0) {
                return <div className="col-span-full py-8 text-center text-sm" style={{ color: COLORS.TEXT_MUTED }}>No hay cursos o talleres disponibles</div>
              }

              return items.map(item => {
                const selected = selectedCourseId === item.id
                if (item.tipo === "taller") {
                  const t = talleres.find(t => t.id === item.id)
                  if (!t) return null
                  return (
                    <div key={t.id} onClick={() => setSelectedCourseId(t.id)}
                      className="rounded-lg border p-3 cursor-pointer transition-all shadow-sm hover:shadow-md"
                      style={{ borderColor: selected ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, backgroundColor: selected ? `color-mix(in srgb, ${COLORS.ACCENT} 4%, transparent)` : "white", borderLeft: `3px solid ${selected ? COLORS.ACCENT : "#e5e7eb"}` }}>
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1">
                          <div className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mb-1"
                            style={{ backgroundColor: "oklch(0.92 0.05 80)", color: "oklch(0.55 0.12 70)" }}>Taller</div>
                          <h3 className="text-sm font-bold leading-tight" style={{ color: selected ? COLORS.ACCENT : COLORS.CHARCOAL }}>{t.nombre}</h3>
                        </div>
                        <div className="text-sm font-black text-emerald-600 ml-1">${Number(t.precio || 0).toFixed(2)}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 mt-2 text-xs">
                        <div className="col-span-2"><span className="font-semibold text-orange-600">Instructor: </span>{t.instructor ? `${t.instructor.nombres} ${t.instructor.apellidos}` : "Por asignar"}</div>
                        <div className="mt-1"><span className="font-semibold text-blue-600">Fecha: </span>{t.fecha ? new Date(t.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</div>
                        <div className="mt-1"><span className="font-semibold text-blue-600">Horario: </span>{t.hora_inicio?.substring(0, 5)} - {t.hora_fin?.substring(0, 5)}</div>
                        <div className="col-span-2 mt-1"><span className="font-semibold text-purple-600">Modalidad: </span>{t.modalidad}</div>
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
                    className="rounded-lg border p-3 cursor-pointer transition-all shadow-sm hover:shadow-md"
                    style={{ borderColor: selected ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, backgroundColor: selected ? `color-mix(in srgb, ${COLORS.ACCENT} 4%, transparent)` : "white", borderLeft: `3px solid ${selected ? COLORS.ACCENT : "#e5e7eb"}` }}>
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <div className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded mb-1"
                          style={{ backgroundColor: "oklch(0.92 0.08 220)", color: "oklch(0.45 0.12 220)" }}>Curso</div>
                        <h3 className="text-sm font-bold leading-tight" style={{ color: selected ? COLORS.ACCENT : COLORS.CHARCOAL }}>{ca.nombre_instancia || ca.catalogo?.nombre}</h3>
                      </div>
                      <div className="text-sm font-black text-emerald-600 ml-1">${Number(ca.precio_base || 0).toFixed(2)}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 mt-2 text-xs">
                      <div className="col-span-2"><span className="font-semibold text-orange-600">Instructor: </span>{ca.docente?.nombres} {ca.docente?.apellidos || "Por asignar"}</div>
                      <div className="mt-1"><span className="font-semibold text-blue-600">Inicio: </span>{ca.fecha_inicio ? new Date(ca.fecha_inicio).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '—'}</div>
                      <div className="mt-1"><span className="font-semibold text-blue-600">Fin: </span>{ca.fecha_fin ? new Date(ca.fecha_fin).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '—'}</div>
                      <div className="col-span-2 mt-1"><span className="font-semibold text-purple-600">Modalidad: </span>{ca.modalidad}</div>
                      {horario && <div className="col-span-2 mt-1"><span className="font-semibold text-gray-500">Horario: </span>{horario.dia} | {horario.hora_inicio?.substring(0, 5)} - {horario.hora_fin?.substring(0, 5)}</div>}
                    </div>
                    {selected && <div className="absolute top-1 right-1"><HugeiconsIcon icon={CheckCircle} size={14} style={{ color: COLORS.ACCENT }} /></div>}
                  </div>
                )
              })
            })()}
          </div>
          <div className="flex justify-between pt-2"><button onClick={() => setPaso(1)} className="px-4 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>Anterior</button><button onClick={handleNext} disabled={!selectedCourseId} className="px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50" style={{ backgroundColor: COLORS.ACCENT }}>Siguiente</button></div>
        </div>
      )}

      {paso === 3 && (
        <div className="rounded-xl border p-6 space-y-6" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <h2 className="text-sm font-semibold flex items-center gap-2"><HugeiconsIcon icon={CreditCardIcon} size={16} style={{ color: COLORS.ACCENT }} />Método y Pago</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div><label className="block text-xs font-medium mb-1.5">Método</label><div className="grid grid-cols-2 gap-2">{metodosPago.map(m => <button key={m.key} onClick={() => { setMetodoPago(m.key); touchPaymentField("metodoPago") }} className="px-3 py-2.5 rounded-lg text-xs font-medium border transition-all" style={{ borderColor: metodoPago === m.key ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, backgroundColor: metodoPago === m.key ? `color-mix(in srgb, ${COLORS.ACCENT} 8%, transparent)` : "white", color: metodoPago === m.key ? COLORS.ACCENT : "" }}>{m.label}</button>)}</div></div>
              <div><label className="block text-xs font-medium mb-1.5">Tipo</label><div className="grid grid-cols-2 gap-2"><button onClick={() => { setTipoAbono("completo"); setMontoAbono("") }} className="px-3 py-2.5 rounded-lg text-xs font-medium border" style={{ borderColor: tipoAbono === "completo" ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, backgroundColor: tipoAbono === "completo" ? `color-mix(in srgb, ${COLORS.ACCENT} 8%, transparent)` : "" }}>Completo</button><button onClick={() => setTipoAbono("abono")} className="px-3 py-2.5 rounded-lg text-xs font-medium border" style={{ borderColor: tipoAbono === "abono" ? COLORS.ACCENT : COLORS.BORDER_SUBTLE, backgroundColor: tipoAbono === "abono" ? `color-mix(in srgb, ${COLORS.ACCENT} 8%, transparent)` : "" }}>Abono</button></div></div>
              {tipoAbono === "abono" && <div><label className="block text-xs font-medium mb-1.5">Monto</label><input type="number" value={montoAbono} onChange={e => handleMontoAbonoChange(e.target.value)} onBlur={() => setPaymentTouched(prev => ({ ...prev, montoAbono: true }))} className="w-full max-w-[200px] px-3 py-2 rounded-lg text-sm border" style={{ borderColor: paymentErrors.montoAbono ? "#ef4444" : COLORS.BORDER_SUBTLE }} />{paymentTouched.montoAbono && paymentErrors.montoAbono && <p className="text-[11px] mt-1 text-red-500">{paymentErrors.montoAbono}</p>}</div>}
            </div>
            <div className="space-y-4">
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
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 space-y-2 text-sm border">
            <div className="flex justify-between"><span>{esTaller ? "Taller" : "Curso"}</span><span className="font-bold">{esTaller ? tallerSel?.nombre : (curso?.nombre_instancia || curso?.catalogo?.nombre)}</span></div>
            <div className="flex justify-between"><span>Costo Total</span><span className="font-bold">${costoTotal.toFixed(2)}</span></div>
            <div className="flex justify-between border-t pt-2 mt-2 text-base font-black"><span>Total a Pagar</span><span className="text-emerald-600">${montoCalculado.toFixed(2)}</span></div>
            {saldoRestante > 0 && <div className="flex justify-between text-xs text-red-500"><span>Saldo Restante</span><span>${saldoRestante.toFixed(2)}</span></div>}
          </div>
          <div className="flex justify-between pt-4"><button onClick={() => setPaso(2)} className="px-5 py-2.5 rounded-lg text-xs font-semibold border">Anterior</button><button onClick={handleSubmit} disabled={loadingSubmit} className="px-8 py-2.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: COLORS.ACCENT }}>{loadingSubmit ? "Enviando..." : "Confirmar Matrícula"}</button></div>
        </div>
      )}
    </div>
  )
}
