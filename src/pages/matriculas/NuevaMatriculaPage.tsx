import { useState, useEffect, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Link03Icon, UserIcon, GraduationCapIcon,
  CreditCardIcon, CheckCircle, Upload04Icon,
  ImageAdd02Icon, CertificateIcon, ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cursosService, type CatalogoCurso, type CursoAbierto } from "@/services/cursos.service"
import axios from "axios"
import { toast } from "sonner"

type Paso = 1 | 2 | 3

interface EstudianteData {
  nombres: string
  apellidos: string
  cedula: string
  telefono: string
  correo: string
  ocupacion: string
  direccion: string
  estado_civil: string
  edad: string
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
  const [catalogoFilter, setCatalogoFilter] = useState("")
  const [categoriaFilter, setCategoriaFilter] = useState("")
  const [ciudadFilter, setCiudadFilter] = useState("")
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [estudiante, setEstudiante] = useState<EstudianteData>({
    nombres: "", apellidos: "", cedula: "", telefono: "", correo: "",
    ocupacion: "", direccion: "", estado_civil: "", edad: "",
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

  const loadCatalogos = async () => {
    try {
      const res = await cursosService.getCatalogos()
      setCatalogos(res.data)
    } catch {
      setCatalogos([])
    }
  }

  const loadCursos = async () => {
    setLoadingCursos(true)
    setSelectedCourseId("")
    try {
      const token = localStorage.getItem("auth_token")
      const params: Record<string, string> = { per_page: "50" }
      if (catalogoFilter) params.catalogo_curso_id = catalogoFilter
      if (categoriaFilter) params.categoria = categoriaFilter
      if (ciudadFilter) params.ciudad = ciudadFilter
      const res = await axios.get(`${API_BASE}/cursos-abiertos`, {
        params,
        headers: { Accept: "application/json", Authorization: token ? `Bearer ${token}` : "" },
      })
      setCursosAbiertos(res.data.data || [])
    } catch {
      setCursosAbiertos([])
    } finally {
      setLoadingCursos(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCatalogos()
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCursos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogoFilter, categoriaFilter, ciudadFilter])

  const curso = cursosAbiertos.find(c => c.id === selectedCourseId)

  const sanitizeInput = (campo: string, valor: string): string => {
    if (campo === "telefono") {
      return valor.replace(/[^0-9]/g, "").slice(0, 10)
    }
    if (campo === "nombres" || campo === "apellidos") {
      return valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "")
    }
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
    if (!comprobanteFile) errs.comprobante = "Adjunta el comprobante de pago"
    setPaymentErrors(errs)
    setPaymentTouched({ metodoPago: true, montoAbono: true, comprobante: true })
    return Object.keys(errs).length === 0
  }

  function validateField(campo: string, valor: string): string | null {
    const labels: Record<string, string> = {
      cedula: "Cédula", nombres: "Nombres", apellidos: "Apellidos",
      telefono: "Teléfono", correo: "Correo",
    }
    if (["cedula", "nombres", "apellidos", "telefono", "correo"].includes(campo) && !valor.trim()) {
      return `${labels[campo] || campo} es requerido`
    }
    if (campo === "cedula" && valor.length < 4) return "La cédula o DNI debe tener al menos 4 caracteres"
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
      const n = { ...prev }
      delete n[field]
      return n
    })
  }

  const handleSubmit = async () => {
    if (!validateStep3()) return
    setLoadingSubmit(true)
    try {
      const formData = new FormData()
      formData.append("curso_abierto_id", selectedCourseId)
      formData.append("tipo_pago", tipoAbono)
      formData.append("tipo_comprobante", metodoPago)
      formData.append("fecha_pago_declarada", new Date().toISOString().split("T")[0])
      formData.append("nombres", estudiante.nombres)
      formData.append("apellidos", estudiante.apellidos)
      formData.append("cedula", estudiante.cedula)
      formData.append("correo", estudiante.correo)
      formData.append("celular", estudiante.telefono)
      formData.append("ocupacion", estudiante.ocupacion)
      formData.append("direccion", estudiante.direccion)
      formData.append("estado_civil", estudiante.estado_civil)
      formData.append("edad", estudiante.edad)

      const monto = tipoAbono === "completo"
        ? Number(curso?.precio_base || 0)
        : Number(montoAbono) || 0
      formData.append("monto_solicitado", monto.toString())

      if (comprobanteFile) {
        formData.append("archivo_comprobante", comprobanteFile)
      }
      if (cedulaFile) {
        formData.append("archivo_cedula", cedulaFile)
      }

      await cursosService.crearSolicitudInscripcion(formData)

      toast.success("Solicitud de matrícula enviada correctamente")

      if (isPublic) {
        onSuccess?.()
      } else if (localStorage.getItem("auth_token")) {
        // eslint-disable-next-line react-hooks/immutability
        window.location.href = "/matriculas"
      }
    } catch (err) {
      const data = (err as { response?: { data?: { mensaje?: string; errores?: string[]; errors?: Record<string, string[]> } } })?.response?.data
      const msg = data?.mensaje || data?.message || "Error al enviar la solicitud"
      const detalles = data?.errores?.length
        ? data.errores.join("\n")
        : data?.errors
          ? Object.values(data.errors).flat().join("\n")
          : ""
      toast.error(detalles ? `${msg}\n${detalles}` : msg, { duration: 8000 })
    } finally {
      setLoadingSubmit(false)
    }
  }

  const costoTotal = Number(curso?.precio_base || 0)
  const montoCalculado = tipoAbono === "completo" ? costoTotal : (Number(montoAbono) || 0)
  const saldoRestante = Math.max(0, costoTotal - montoCalculado)

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      {!isPublic && (
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: COLORS.TEXT_MUTED }}>
              <span>Matrículas</span>
              <span>/</span>
              <span className="font-medium" style={{ color: COLORS.CHARCOAL }}>Nueva</span>
            </div>
            <h1 className="text-xl font-bold" style={{ color: COLORS.CHARCOAL }}>Nueva Matrícula</h1>
            <p className="text-sm mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
              Completa los datos para inscribir a un estudiante
            </p>
          </div>
          <button onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/matricula/nueva`)
            toast.success("Enlace copiado al portapapeles")
          }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold border transition-all hover:bg-black/5 active:scale-[0.97]"
            style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}>
            <HugeiconsIcon icon={Link03Icon} size={14} />Compartir enlace público
          </button>
        </div>
      )}

      <div className="flex items-center gap-0">
        {pasos.map((p, i) => (
          <div key={p.num} className="flex items-center gap-0 flex-1">
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg text-xs font-semibold transition-colors"
              style={{
                backgroundColor: paso >= p.num ? `color-mix(in srgb, ${COLORS.ACCENT} 12%, transparent)` : "transparent",
                color: paso >= p.num ? COLORS.ACCENT : COLORS.TEXT_MUTED,
              }}>
              <div className="size-6 rounded-full flex items-center justify-center text-[11px] font-bold"
                style={{
                  backgroundColor: paso >= p.num ? COLORS.ACCENT : "oklch(0.90 0 0)",
                  color: paso >= p.num ? "#fff" : COLORS.TEXT_MUTED,
                }}>
                {paso > p.num ? <HugeiconsIcon icon={CheckCircle} size={14} /> : p.num}
              </div>
              <span className="hidden sm:inline">{p.label}</span>
            </div>
            {i < pasos.length - 1 && (
              <div className="flex-1 h-px mx-2" style={{
                backgroundColor: paso > p.num ? COLORS.ACCENT : COLORS.BORDER_SUBTLE,
              }} />
            )}
          </div>
        ))}
      </div>

      {paso === 1 && (
        <div className="rounded-xl border p-6 space-y-5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.CHARCOAL }}>
              <HugeiconsIcon icon={UserIcon} size={16} style={{ color: COLORS.ACCENT }} />
              Datos del Estudiante
            </h2>
            <p className="text-xs mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
              Ingresa la información del estudiante que desea matricularse
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(["cedula", "nombres", "apellidos", "telefono", "correo"] as const).map(campo => (
              <div key={campo} className={campo === "correo" ? "sm:col-span-2" : ""}>
                <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.CHARCOAL }}>
                  {campo === "cedula" ? "Cédula / DNI" :
                    campo === "nombres" ? "Nombres" :
                    campo === "apellidos" ? "Apellidos" :
                    campo === "telefono" ? "Teléfono" : "Correo Electrónico"}
                </label>
                <input
                  type={campo === "correo" ? "email" : (campo === "cedula" || campo === "telefono") ? "tel" : "text"}
                  inputMode={campo === "telefono" ? "numeric" : campo === "correo" ? "email" : "text"}
                  maxLength={campo === "telefono" ? 10 : undefined}
                  value={estudiante[campo]}
                  onChange={e => updateEstudiante(campo, e.target.value)}
                  onBlur={() => blurEstudiante(campo)}
                  placeholder={isPublic ? placeholders[campo] : undefined}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none transition-all focus:ring-2"
                  style={{
                    borderColor: touched[campo] && errors[campo] ? "#ef4444" : COLORS.BORDER_SUBTLE,
                    backgroundColor: "white",
                    color: COLORS.CHARCOAL,
                  }} />
                {touched[campo] && errors[campo] && (
                  <p className="text-[11px] mt-1" style={{ color: "#ef4444" }}>{errors[campo]}</p>
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.CHARCOAL }}>Ocupación</label>
              <input type="text" value={estudiante.ocupacion} onChange={e => setEstudiante({...estudiante, ocupacion: e.target.value})}
                placeholder="Ej: Ingeniero" className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none transition-all focus:ring-2"
                style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: "white", color: COLORS.CHARCOAL }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.CHARCOAL }}>Estado Civil</label>
              <select value={estudiante.estado_civil} onChange={e => setEstudiante({...estudiante, estado_civil: e.target.value})}
                className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none transition-all focus:ring-2 bg-white"
                style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}>
                <option value="">Seleccionar...</option>
                <option value="soltero">Soltero</option>
                <option value="casado">Casado</option>
                <option value="divorciado">Divorciado</option>
                <option value="viudo">Viudo</option>
                <option value="union_libre">Unión Libre</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.CHARCOAL }}>Edad</label>
              <input type="number" min={0} max={150} value={estudiante.edad} onChange={e => setEstudiante({...estudiante, edad: e.target.value})}
                placeholder="Ej: 25" className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none transition-all focus:ring-2"
                style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: "white", color: COLORS.CHARCOAL }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.CHARCOAL }}>Dirección</label>
              <input type="text" value={estudiante.direccion} onChange={e => setEstudiante({...estudiante, direccion: e.target.value})}
                placeholder="Dirección residencial" className="w-full px-3.5 py-2.5 rounded-lg text-sm border outline-none transition-all focus:ring-2"
                style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: "white", color: COLORS.CHARCOAL }} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.CHARCOAL }}>
              Foto de la Cédula <span className="font-normal" style={{ color: COLORS.TEXT_MUTED }}>(opcional)</span>
            </label>
            <input ref={cedulaInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) {
                  setCedulaFile(file)
                  setCedulaPreview(URL.createObjectURL(file))
                }
              }} />
            <div onClick={() => cedulaInputRef.current?.click()}
              className="relative rounded-lg border-2 border-dashed p-4 flex items-center justify-center cursor-pointer transition-all hover:bg-black/[0.02]"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              {cedulaPreview ? (
                <div className="relative w-full">
                  <img src={cedulaPreview} alt="Cédula" className="max-h-32 mx-auto rounded object-contain" />
                  <button type="button" onClick={e => { e.stopPropagation(); setCedulaFile(null); setCedulaPreview(null) }}
                    className="absolute top-1 right-1 size-5 rounded-full bg-black/40 text-white text-[10px] flex items-center justify-center hover:bg-black/60">
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                  <HugeiconsIcon icon={ImageAdd02Icon} size={18} />
                  <span>Haz clic para subir la foto de la cédula</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-[0.97]"
              style={{ backgroundColor: COLORS.ACCENT }}>
              Siguiente <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
            </button>
          </div>
        </div>
      )}

      {paso === 2 && (
        <div className="rounded-xl border p-6 space-y-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.CHARCOAL }}>
              <HugeiconsIcon icon={GraduationCapIcon} size={16} style={{ color: COLORS.ACCENT }} />
              Seleccionar Curso
            </h2>
            <p className="text-xs mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
              Elige el curso al que deseas inscribir al estudiante
            </p>
          </div>

          {catalogos.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium" style={{ color: COLORS.TEXT_MUTED }}>Catálogo:</span>
                <select value={catalogoFilter} onChange={e => setCatalogoFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg text-xs border outline-none"
                  style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: "white", color: COLORS.CHARCOAL }}>
                  <option value="">Todos</option>
                  {catalogos.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium" style={{ color: COLORS.TEXT_MUTED }}>Categoría:</span>
                <select value={categoriaFilter} onChange={e => setCategoriaFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg text-xs border outline-none"
                  style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: "white", color: COLORS.CHARCOAL }}>
                  <option value="">Todas</option>
                  {Array.from(new Set(catalogos.map(c => c.categoria))).map(cat => (
                    <option key={cat || "sin-categoria"} value={cat}>{cat === "regular" ? "Regular" : cat === "taller" ? "Taller" : "Personalizado"}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium" style={{ color: COLORS.TEXT_MUTED }}>Ciudad:</span>
                <select value={ciudadFilter} onChange={e => setCiudadFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg text-xs border outline-none"
                  style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: "white", color: COLORS.CHARCOAL }}>
                  <option value="">Todas</option>
                  {Array.from(new Set(cursosAbiertos.filter(c => c.ciudad?.nombre).map(c => c.ciudad!.nombre))).map(ciudad => (
                    <option key={ciudad} value={ciudad}>{ciudad}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {loadingCursos ? (
            <div className="flex items-center justify-center py-12">
              <div className="size-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: COLORS.ACCENT, borderTopColor: "transparent" }} />
            </div>
          ) : cursosAbiertos.length === 0 ? (
            <div className="text-center py-12">
              <HugeiconsIcon icon={CertificateIcon} size={40} style={{ color: COLORS.TEXT_MUTED }} />
              <p className="text-sm mt-2" style={{ color: COLORS.TEXT_MUTED }}>No hay cursos disponibles</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
              {cursosAbiertos.map(ca => {
                const selected = selectedCourseId === ca.id
                const horario = ca.horarios?.[0]
                const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
                return (
                  <div key={ca.id} onClick={() => setSelectedCourseId(ca.id)}
                    className="rounded-xl border p-4 cursor-pointer transition-all"
                    style={{
                      borderColor: selected ? COLORS.ACCENT : COLORS.BORDER_SUBTLE,
                      backgroundColor: selected ? `color-mix(in srgb, ${COLORS.ACCENT} 6%, transparent)` : "white",
                      outline: selected ? `2px solid ${COLORS.ACCENT}` : "none",
                    }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold truncate flex items-center gap-1.5" style={{ color: COLORS.CHARCOAL }}>
                          {ca.nombre_instancia || ca.catalogo?.nombre || "Curso"}
                        </h3>
                        {ca.catalogo?.nombre && ca.nombre_instancia && (
                          <p className="text-[11px] truncate" style={{ color: COLORS.TEXT_MUTED }}>
                            {ca.catalogo.nombre}
                          </p>
                        )}
                      </div>
                      <span className="text-xs font-bold shrink-0" style={{ color: COLORS.ACCENT }}>
                        ${Number(ca.precio_base || 0).toFixed(2)}
                      </span>
                    </div>

                    {ca.docente && (
                      <p className="text-xs mt-1.5" style={{ color: COLORS.TEXT_MUTED }}>
                        <span className="font-medium" style={{ color: COLORS.CHARCOAL }}>Instructor:</span> {ca.docente.nombres} {ca.docente.apellidos}
                      </p>
                    )}

                    {horario && (
                      <p className="text-xs mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
                        <span className="font-medium" style={{ color: COLORS.CHARCOAL }}>Horario:</span> {dias[Number(horario.dia)] || horario.dia} {horario.hora_inicio?.substring(0, 5)} - {horario.hora_fin?.substring(0, 5)}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {ca.modalidad && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: "oklch(0.95 0 0)", color: COLORS.TEXT_MUTED }}>
                          {ca.modalidad === "presencial" ? "Presencial" : "Virtual"}
                        </span>
                      )}
                      {ca.ciudad?.nombre && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: "oklch(0.95 0 0)", color: COLORS.TEXT_MUTED }}>
                          {ca.ciudad.nombre}
                        </span>
                      )}
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: "oklch(0.95 0 0)", color: COLORS.TEXT_MUTED }}>
                        {ca.matriculas?.length || 0}/{ca.capacidad_maxima} cupos
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button onClick={() => setPaso(1)}
              className="px-5 py-2.5 rounded-lg text-xs font-semibold border transition-all hover:bg-black/5 active:scale-[0.97]"
              style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}>
              Anterior
            </button>
            <button onClick={handleNext} disabled={!selectedCourseId}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-40"
              style={{ backgroundColor: COLORS.ACCENT }}>
              Siguiente <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
            </button>
          </div>
        </div>
      )}

      {paso === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <div>
              <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.CHARCOAL }}>
                <HugeiconsIcon icon={CreditCardIcon} size={16} style={{ color: COLORS.ACCENT }} />
                Método y Tipo de Pago
              </h2>
              <p className="text-xs mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
                Selecciona cómo deseas realizar el pago
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.CHARCOAL }}>Método de Pago</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {metodosPago.map(m => (
                  <button key={m.key} onClick={() => { setMetodoPago(m.key); touchPaymentField("metodoPago") }}
                    className="px-3 py-2.5 rounded-lg text-xs font-medium border transition-all"
                    style={{
                      borderColor: metodoPago === m.key ? COLORS.ACCENT : (paymentTouched.metodoPago && paymentErrors.metodoPago ? "#ef4444" : COLORS.BORDER_SUBTLE),
                      backgroundColor: metodoPago === m.key ? `color-mix(in srgb, ${COLORS.ACCENT} 8%, transparent)` : "white",
                      color: metodoPago === m.key ? COLORS.ACCENT : COLORS.CHARCOAL,
                    }}>
                    {m.label}
                  </button>
                ))}
              </div>
              {paymentTouched.metodoPago && paymentErrors.metodoPago && (
                <p className="text-[11px] mt-1" style={{ color: "#ef4444" }}>{paymentErrors.metodoPago}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.CHARCOAL }}>Tipo de Pago</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { setTipoAbono("completo"); setMontoAbono(""); touchPaymentField("montoAbono") }}
                  className="px-3 py-2.5 rounded-lg text-xs font-medium border transition-all"
                  style={{
                    borderColor: tipoAbono === "completo" ? COLORS.ACCENT : COLORS.BORDER_SUBTLE,
                    backgroundColor: tipoAbono === "completo" ? `color-mix(in srgb, ${COLORS.ACCENT} 8%, transparent)` : "white",
                    color: tipoAbono === "completo" ? COLORS.ACCENT : COLORS.CHARCOAL,
                  }}>
                  Pago Completo
                </button>
                <button onClick={() => { setTipoAbono("abono"); touchPaymentField("montoAbono") }}
                  className="px-3 py-2.5 rounded-lg text-xs font-medium border transition-all"
                  style={{
                    borderColor: tipoAbono === "abono" ? COLORS.ACCENT : COLORS.BORDER_SUBTLE,
                    backgroundColor: tipoAbono === "abono" ? `color-mix(in srgb, ${COLORS.ACCENT} 8%, transparent)` : "white",
                    color: tipoAbono === "abono" ? COLORS.ACCENT : COLORS.CHARCOAL,
                  }}>
                  Abono
                </button>
              </div>
            </div>

            {tipoAbono === "abono" && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.CHARCOAL }}>
                  Monto a Abonar <span className="font-normal" style={{ color: COLORS.TEXT_MUTED }}>(máx. ${costoTotal.toFixed(2)})</span>
                </label>
                <input type="number" value={montoAbono} min="0" step="0.01"
                  onChange={e => { setMontoAbono(e.target.value); touchPaymentField("montoAbono") }}
                  onBlur={() => setPaymentTouched(prev => ({ ...prev, montoAbono: true }))}
                  placeholder={isPublic ? "50.00" : undefined}
                  className="w-full max-w-xs px-3.5 py-2.5 rounded-lg text-sm border outline-none transition-all focus:ring-2"
                  style={{
                    borderColor: paymentTouched.montoAbono && paymentErrors.montoAbono ? "#ef4444" : COLORS.BORDER_SUBTLE,
                    backgroundColor: "white", color: COLORS.CHARCOAL,
                  }} />
                {paymentTouched.montoAbono && paymentErrors.montoAbono && (
                  <p className="text-[11px] mt-1" style={{ color: "#ef4444" }}>{paymentErrors.montoAbono}</p>
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <h3 className="text-xs font-semibold flex items-center gap-2" style={{ color: COLORS.CHARCOAL }}>
              <HugeiconsIcon icon={Upload04Icon} size={14} style={{ color: COLORS.ACCENT }} />
              Comprobante de Pago
            </h3>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: COLORS.CHARCOAL }}>
                Adjuntar Comprobante
              </label>
              <input ref={comprobanteInputRef} type="file" accept="image/*,.pdf" className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setComprobanteFile(file)
                    touchPaymentField("comprobante")
                    if (file.type.startsWith("image/")) {
                      setComprobantePreview(URL.createObjectURL(file))
                    } else {
                      setComprobantePreview(null)
                    }
                  }
                }} />
              <div onClick={() => { comprobanteInputRef.current?.click(); touchPaymentField("comprobante") }}
                className="relative rounded-lg border-2 border-dashed p-4 flex items-center justify-center cursor-pointer transition-all hover:bg-black/[0.02]"
                style={{
                  borderColor: paymentTouched.comprobante && paymentErrors.comprobante ? "#ef4444" : COLORS.BORDER_SUBTLE,
                }}>
                {comprobantePreview ? (
                  <div className="relative w-full">
                    <img src={comprobantePreview} alt="Comprobante" className="max-h-32 mx-auto rounded object-contain" />
                    <button type="button" onClick={e => { e.stopPropagation(); setComprobanteFile(null); setComprobantePreview(null); touchPaymentField("comprobante") }}
                      className="absolute top-1 right-1 size-5 rounded-full bg-black/40 text-white text-[10px] flex items-center justify-center hover:bg-black/60">
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                    <HugeiconsIcon icon={ImageAdd02Icon} size={18} />
                    <span>{comprobanteFile ? comprobanteFile.name : "Haz clic para subir el comprobante"}</span>
                  </div>
                )}
              </div>
              {paymentTouched.comprobante && paymentErrors.comprobante && (
                <p className="text-[11px] mt-1" style={{ color: "#ef4444" }}>{paymentErrors.comprobante}</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border p-5 space-y-2.5" style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: "oklch(0.985 0 0)" }}>
            <h3 className="text-sm font-semibold" style={{ color: COLORS.CHARCOAL }}>Resumen de Pago</h3>
            <div className="flex justify-between text-xs" style={{ color: COLORS.TEXT_MUTED }}>
              <span>Estudiante</span>
              <span style={{ color: COLORS.CHARCOAL }}>{estudiante.nombres} {estudiante.apellidos}</span>
            </div>
            <div className="flex justify-between text-xs" style={{ color: COLORS.TEXT_MUTED }}>
              <span>Curso</span>
              <span style={{ color: COLORS.CHARCOAL }}>
                {curso?.nombre_instancia || curso?.catalogo?.nombre || "—"}
              </span>
            </div>
            <div className="flex justify-between text-xs font-semibold" style={{ color: COLORS.TEXT_MUTED }}>
              <span>Costo Total</span>
              <span style={{ color: COLORS.CHARCOAL }}>${costoTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs" style={{ color: COLORS.TEXT_MUTED }}>
              <span>Tipo</span>
              <span style={{ color: COLORS.CHARCOAL }}>{tipoAbono === "completo" ? "Pago completo" : "Abono"}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold" style={{ color: COLORS.TEXT_MUTED }}>
              <span>Monto a Pagar</span>
              <span style={{ color: COLORS.CHARCOAL }}>${montoCalculado.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs" style={{ color: COLORS.TEXT_MUTED }}>
              <span>Método</span>
              <span style={{ color: COLORS.CHARCOAL }}>{metodosPago.find(m => m.key === metodoPago)?.label || "—"}</span>
            </div>
            <div className="pt-2 border-t flex justify-between text-sm font-bold" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <span style={{ color: COLORS.CHARCOAL }}>Saldo Restante</span>
              <span style={{ color: saldoRestante > 0 ? COLORS.ACCENT : "oklch(0.50 0.10 140)" }}>
                ${saldoRestante.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button onClick={() => setPaso(2)}
              className="px-5 py-2.5 rounded-lg text-xs font-semibold border transition-all hover:bg-black/5 active:scale-[0.97]"
              style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}>
              Anterior
            </button>
            <button onClick={handleSubmit} disabled={loadingSubmit}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-lg text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-40"
              style={{ backgroundColor: COLORS.ACCENT }}>
              {loadingSubmit ? "Enviando..." : "Confirmar Matrícula"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
