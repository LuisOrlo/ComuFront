import { useState, useEffect, useMemo, type CSSProperties } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Link03Icon, UserIcon, GraduationCapIcon,
  CreditCardIcon, CheckCircle,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cursosService } from "@/services/cursos.service"
import { tallerService } from "@/services/taller.service"
import { toast } from "sonner"
import { StepIndicator } from "./components/StepIndicator"
import { ModalidadStep } from "./components/ModalidadStep"
import { CiudadStep } from "./components/CiudadStep"
import { ListaStep } from "./components/ListaStep"
import { PagoForm } from "./components/PagoForm"
import { useCursosAbiertos, useTalleres } from "@/hooks/useMatriculaData"
import { DatosEstudianteStep, type EstudianteData } from "./components/DatosEstudianteStep"

type Paso = 1 | 2 | 3
const pasos = [
  { num: 1 as Paso, label: "Datos del Estudiante", icon: UserIcon },
  { num: 2 as Paso, label: "Seleccionar Curso", icon: GraduationCapIcon },
  { num: 3 as Paso, label: "Método de Pago", icon: CreditCardIcon },
]

export function NuevaMatriculaPage({ isPublic, onSuccess }: { isPublic?: boolean; onSuccess?: () => void }) {
  const [paso, setPaso] = useState<Paso>(1)
  const [subStep, setSubStep] = useState<"modalidad" | "ciudad" | "lista">("modalidad")
  const [selectedModalidad, setSelectedModalidad] = useState("")
  const [selectedCiudadId, setSelectedCiudadId] = useState<number | null>(null)
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [estudiante, setEstudiante] = useState<EstudianteData>({
    tipo_id: "cedula",
    nombres: "", apellidos: "", cedula: "", telefono: "", correo: "",
    ocupacion: "", direccion: "", ciudad: "", estado_civil: "", edad: "", nivel_educativo: "",
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


  const metodosPago = [
    { key: "efectivo", label: "Efectivo" },
    { key: "transferencia", label: "Transferencia/Deposito" },
  ]

  const {
    data: cursosAbiertos = [],
    isLoading: loadingCursos,
    isError: cursosError,
  } = useCursosAbiertos({
    modalidad: selectedModalidad,
    ciudadId: selectedCiudadId,
    enabled: !!selectedModalidad,
  })

  const {
    data: talleres = [],
    isLoading: loadingTalleres,
    isError: talleresError,
  } = useTalleres({
    modalidad: selectedModalidad,
    ciudadId: selectedCiudadId,
    enabled: !!selectedModalidad,
  })

  useEffect(() => {
    if (cursosError) toast.error("No se pudieron cargar los cursos disponibles")
  }, [cursosError])

  useEffect(() => {
    if (talleresError) toast.error("No se pudieron cargar los talleres disponibles")
  }, [talleresError])

  const isLoadingData = loadingCursos || loadingTalleres

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

  const curso = cursosAbiertos.find(c => c.id === selectedCourseId)
  const tallerSel = talleres.find(t => t.id === selectedCourseId)
  const esTaller = !!tallerSel && !curso

  const step1CanProceed = useMemo(() => {
    const fields: (keyof EstudianteData)[] = ["cedula", "nombres", "apellidos", "telefono", "correo"]
    const allFilled = fields.every(f => estudiante[f]?.trim())
    return allFilled && !!cedulaFile && Object.keys(errors).length === 0
  }, [estudiante, cedulaFile, errors])

  const step3CanSubmit = useMemo(() => {
    if (!metodoPago) return false
    if (metodoPago === "transferencia" && !comprobanteFile) return false
    return Object.keys(paymentErrors).length === 0
  }, [metodoPago, comprobanteFile, paymentErrors])



  const sanitizeInput = (campo: string, valor: string): string => {
    if (campo === "telefono") return valor.replace(/[^0-9]/g, "").slice(0, 10)
    if (campo === "cedula" && estudiante.tipo_id === "cedula") return valor.replace(/[^0-9]/g, "").slice(0, 10)
    if (campo === "cedula") return valor.slice(0, 20).toUpperCase()
    if (campo === "correo") return valor
    if (campo === "estado_civil") return valor
    if (campo === "nivel_educativo") return valor
    if (campo === "nombres" || campo === "apellidos") return valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "").toUpperCase()
    return valor.toUpperCase()
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
    if (metodoPago === "transferencia" && !comprobanteFile) errs.comprobante = "Adjunta el comprobante de transferencia"
    setPaymentErrors(errs)
    setPaymentTouched({ metodoPago: true, comprobante: true })
    return Object.keys(errs).length === 0
  }

  function validateField(campo: string, valor: string): string | null {
    const labels: Record<string, string> = {
      cedula: estudiante.tipo_id === "cedula" ? "Cédula" : "DNI",
      nombres: "Nombres", apellidos: "Apellidos", telefono: "Teléfono", correo: "Correo",
      ocupacion: "Ocupación", direccion: "Dirección", ciudad: "Residencia",
      estado_civil: "Estado Civil", nivel_educativo: "Nivel Educativo",
    }
    if (["cedula", "nombres", "apellidos", "telefono", "correo"].includes(campo) && !valor.trim()) {
      return `${labels[campo] || campo} es requerido`
    }
    if (campo === "cedula") {
      if (estudiante.tipo_id === "cedula") {
        if (!/^\d{10}$/.test(valor)) return "La cédula debe tener exactamente 10 dígitos"
      } else {
        if (valor.length < 5) return "El DNI debe tener al menos 5 caracteres"
        if (valor.length > 20) return "El DNI no debe exceder los 20 caracteres"
      }
    }
    if ((campo === "nombres" || campo === "apellidos") && valor && valor.length < 2) return "Mínimo 2 caracteres"
    if (campo === "telefono" && valor && !/^\d{10}$/.test(valor)) return "El teléfono debe tener 10 dígitos"
    if (campo === "correo" && valor && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) return "Correo inválido"
    if (campo === "edad" && valor) {
      const edadNum = Number(valor)
      if (isNaN(edadNum) || edadNum < 10) return "Debes tener al menos 10 años para inscribirte"
      if (edadNum > 120) return "La edad ingresada no es válida"
    }
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
        const formData = new FormData()
        formData.append("taller_id", selectedCourseId)
        formData.append("nombres", estudiante.nombres)
        formData.append("apellidos", estudiante.apellidos)
        formData.append("cedula", estudiante.cedula)
        formData.append("correo", estudiante.correo)
        formData.append("email", estudiante.correo)
        formData.append("telefono", estudiante.telefono)
        formData.append("ocupacion", estudiante.ocupacion)
        formData.append("direccion", estudiante.direccion)
        formData.append("ciudad", estudiante.ciudad)
        formData.append("estado_civil", estudiante.estado_civil)
        formData.append("edad", estudiante.edad)
        formData.append("nivel_educativo", estudiante.nivel_educativo)
        formData.append("tipo_pago", "abono")
        formData.append("monto_pagado", "0")
        formData.append("metodo_pago", metodoPago)
        formData.append("fecha_pago", new Date().toISOString().split("T")[0])
        if (comprobanteFile) formData.append("comprobante", comprobanteFile)
        if (cedulaFile) formData.append("archivo_cedula", cedulaFile)
        await tallerService.inscribir(formData)
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
        formData.append("email", estudiante.correo)
        formData.append("celular", estudiante.telefono)
        formData.append("ocupacion", estudiante.ocupacion)
        formData.append("direccion", estudiante.direccion)
        formData.append("ciudad", estudiante.ciudad)
        formData.append("estado_civil", estudiante.estado_civil)
        formData.append("edad", estudiante.edad)
        formData.append("nivel_educativo", estudiante.nivel_educativo)
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

  const handleModalidadSelect = (mod: string) => {
    setSelectedModalidad(mod)
    setSelectedCiudadId(null)
    setSelectedCourseId("")
    if (mod === "virtual") setSubStep("lista")
    else setSubStep("ciudad")
  }

  const handleCiudadSelect = (id: number) => {
    setSelectedCiudadId(id)
    setSelectedCourseId("")
    setSubStep("lista")
  }

  const handleCursoSelect = (id: string) => {
    setSelectedCourseId(id)
  }

  const handleWizardBack = () => {
    if (subStep === "modalidad") setPaso(1)
    else if (subStep === "ciudad") setSubStep("modalidad")
    else if (subStep === "lista") {
      if (selectedModalidad === "virtual") setSubStep("modalidad")
      else setSubStep("ciudad")
    }
  }

  const handleWizardNext = () => {
    if (subStep === "lista") handleNext()
    else if (subStep === "modalidad" && selectedModalidad) {
      if (selectedModalidad === "virtual") setSubStep("lista")
      else setSubStep("ciudad")
    }
    else if (subStep === "ciudad" && selectedCiudadId) setSubStep("lista")
  }

  const wizardNextDisabled = subStep === "modalidad" ? !selectedModalidad
    : subStep === "ciudad" ? !selectedCiudadId
    : !selectedCourseId

  return (
    <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {loadingSubmit && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm"
          style={{ zIndex: 9999 }}
          role="status"
          aria-live="polite"
          aria-label="Enviando solicitud"
        >
          <div className="flex flex-col items-center gap-4 px-6 text-center">
            <div
              className="size-12 rounded-full border-4 border-gray-200 animate-spin"
              style={{ borderTopColor: COLORS.ACCENT } as CSSProperties}
            />
            <div>
              <p className="text-base font-bold" style={{ color: COLORS.CHARCOAL }}>
                Enviando solicitud
              </p>
              <p className="text-sm mt-1" style={{ color: COLORS.TEXT_MUTED }}>
                Estamos registrando la información de tu matrícula. No cierres esta ventana.
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
      <style>{`
        .hover-orange:hover {
          border-color: #86efac !important;
          background-color: #f0fdf4 !important;
        }
      `}</style>

      {!isPublic && (
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: COLORS.TEXT_MUTED }}>
              <span>Matrículas</span><span>/</span><span className="font-medium" style={{ color: COLORS.CHARCOAL }}>Nueva</span>
            </div>
            <h1 className="text-xl font-bold" style={{ color: COLORS.CHARCOAL }}>Completa tu Matrícula</h1>
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
            <div className="flex items-center gap-1 sm:gap-2.5 px-2 sm:px-4 py-3 rounded-lg text-xs font-semibold transition-colors"
              style={{ backgroundColor: paso >= p.num ? `color-mix(in srgb, ${COLORS.ACCENT} 12%, transparent)` : "transparent", color: paso >= p.num ? COLORS.ACCENT : COLORS.TEXT_MUTED }}>
              <div className="size-6 rounded-full flex items-center justify-center text-[11px] font-bold"
                style={{ backgroundColor: paso >= p.num ? COLORS.ACCENT : "oklch(0.90 0 0)", color: paso >= p.num ? "#fff" : COLORS.TEXT_MUTED }}>
                {paso > p.num ? <HugeiconsIcon icon={CheckCircle} size={14} /> : p.num}
              </div>
              <span className="inline truncate max-w-[80px] sm:max-w-none">{p.label}</span>
            </div>
            {i < pasos.length - 1 && <div className="flex-1 h-px mx-2" style={{ backgroundColor: paso > p.num ? COLORS.ACCENT : COLORS.BORDER_SUBTLE }} />}
          </div>
        ))}
      </div>

      {paso === 1 && (
        <DatosEstudianteStep
          estudiante={estudiante}
          errors={errors}
          touched={touched}
          updateEstudiante={updateEstudiante}
          blurEstudiante={blurEstudiante}
          setEstudiante={setEstudiante}
          setErrors={setErrors}
          setTouched={setTouched}
          cedulaFile={cedulaFile}
          setCedulaFile={setCedulaFile}
          cedulaPreview={cedulaPreview}
          setCedulaPreview={setCedulaPreview}
          canProceed={step1CanProceed}
          onNext={handleNext}
          validateField={validateField}
        />
      )}

      {paso === 2 && (
        <div className="rounded-xl border p-4 sm:p-6 space-y-6 bg-white shadow-sm overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <StepIndicator subStep={subStep} selectedModalidad={selectedModalidad} />

          <AnimatePresence mode="wait">
            {subStep === "modalidad" && (
              <ModalidadStep selectedModalidad={selectedModalidad} onSelect={handleModalidadSelect} />
            )}
            {subStep === "ciudad" && (
              <CiudadStep ciudades={ciudades} selectedCiudadId={selectedCiudadId} loadingCursos={isLoadingData} onSelect={handleCiudadSelect} onBack={() => setSubStep("modalidad")} />
            )}
            {subStep === "lista" && (
              <ListaStep talleres={talleres} cursosAbiertos={cursosAbiertos} selectedCourseId={selectedCourseId} loadingCursos={isLoadingData} onSelect={handleCursoSelect} onBack={() => selectedModalidad === "virtual" ? setSubStep("modalidad") : setSubStep("ciudad")} />
            )}
          </AnimatePresence>

          <div className="flex justify-between pt-2 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <button onClick={handleWizardBack} className="px-4 py-2 rounded-lg text-xs font-semibold border hover:bg-gray-50 transition-colors" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              Anterior
            </button>
            <button onClick={handleWizardNext} disabled={wizardNextDisabled}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50 transition-all active:scale-[0.98]" style={{ backgroundColor: COLORS.ACCENT }}>
              {subStep === "lista" ? "Siguiente" : "Continuar"}
            </button>
          </div>
        </div>
      )}

      {paso === 3 && (
        <PagoForm
          metodoPago={metodoPago}
          comprobanteFile={comprobanteFile}
          comprobantePreview={comprobantePreview}
          paymentErrors={paymentErrors}
          paymentTouched={paymentTouched}
          esTaller={esTaller}
          tallerSel={tallerSel}
          curso={curso}
          loadingSubmit={loadingSubmit}
          metodosPago={metodosPago}
          canSubmit={step3CanSubmit}
          onMetodoPagoChange={(key) => { setMetodoPago(key); touchPaymentField("metodoPago") }}
          onComprobanteChange={(file) => {
            if (!file) {
              setComprobanteFile(null)
              setComprobantePreview(null)
              setPaymentErrors(prev => { const n = { ...prev }; delete n.comprobante; return n })
              return
            }
            const MAX = 5 * 1024 * 1024
            if (!file.type.startsWith("image/")) {
              setPaymentErrors(prev => ({ ...prev, comprobante: "Solo se permiten imágenes (JPG, PNG)" }))
              return
            }
            if (file.size > MAX) {
              setPaymentErrors(prev => ({ ...prev, comprobante: "La imagen no debe superar los 5MB" }))
              return
            }
            setComprobanteFile(file)
            setPaymentErrors(prev => { const n = { ...prev }; delete n.comprobante; return n })
            setComprobantePreview(URL.createObjectURL(file))
          }}
          onQuitarComprobante={() => { setComprobanteFile(null); setComprobantePreview(null) }}
          onSubmit={handleSubmit}
          onBack={() => setPaso(2)}
        />
      )}
    </div>
  )
}
