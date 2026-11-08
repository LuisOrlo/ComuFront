import { useState, useMemo, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckCircle } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cursosService, type CursoAbierto } from "@/services/cursos.service"
import { toast } from "sonner"
import { getFriendlyErrorMessage } from "@/lib/errorUtils"
import { DatosEstudianteStep, type EstudianteData } from "./DatosEstudianteStep"
import { PagoForm } from "./PagoForm"

type Paso = 1 | 2

const pasos = [
  { num: 1 as Paso, label: "Datos del Estudiante" },
  { num: 2 as Paso, label: "Método de Pago" },
]

const getLocalDateString = () => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

interface FormularioMatriculaDirectaProps {
  curso: CursoAbierto
  onSuccess: () => void
}

export function FormularioMatriculaDirecta({ curso, onSuccess }: FormularioMatriculaDirectaProps) {
  const [paso, setPaso] = useState<Paso>(1)
  const [estudiante, setEstudiante] = useState<EstudianteData>({
    tipo_id: "cedula",
    nombres: "",
    apellidos: "",
    cedula: "",
    telefono: "",
    correo: "",
    ocupacion: "",
    direccion: "",
    ciudad: "",
    estado_civil: "",
    edad: "",
    nivel_educativo: "",
    acepta_terminos: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [cedulaFile, setCedulaFile] = useState<File | null>(null)
  const [cedulaPreview, setCedulaPreview] = useState<string | null>(null)
  const [metodoPago, setMetodoPago] = useState("")
  const [montoDeclarado, setMontoDeclarado] = useState("")
  const [fechaPago, setFechaPago] = useState(getLocalDateString())
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null)
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(null)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({})
  const [paymentTouched, setPaymentTouched] = useState<Record<string, boolean>>({})
  const [validandoCedula, setValidandoCedula] = useState(false)

  useEffect(() => {
    const main = document.querySelector("main")
    if (main instanceof HTMLElement) {
      main.scrollTo({ top: 0, left: 0, behavior: "smooth" })
    }
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" })
  }, [paso])

  const metodosPago = [
    { key: "efectivo", label: "Efectivo" },
    { key: "transferencia", label: "Transferencia/Deposito" },
  ]

  const step1CanProceed = useMemo(() => {
    const fields: (keyof EstudianteData)[] = ["cedula", "nombres", "apellidos", "telefono", "correo"]
    const allFilled = fields.every((f) => typeof estudiante[f] === "string" && (estudiante[f] as string).trim().length > 0)
    return allFilled && !!cedulaFile && Boolean(estudiante.acepta_terminos) && Object.keys(errors).length === 0
  }, [estudiante, cedulaFile, errors])

  const step2CanSubmit = useMemo(() => {
    if (!metodoPago) return false
    if (!comprobanteFile) return false
    return Object.keys(paymentErrors).length === 0
  }, [metodoPago, comprobanteFile, paymentErrors])

  const sanitizeInput = (campo: string, valor: string): string => {
    if (campo === "telefono") return valor.replace(/[^0-9]/g, "").slice(0, 10)
    if (campo === "cedula" && estudiante.tipo_id === "cedula") return valor.replace(/[^0-9]/g, "").slice(0, 10)
    if (campo === "cedula") return valor.slice(0, 20).toUpperCase()
    if (campo === "correo" || campo === "estado_civil" || campo === "nivel_educativo") return valor
    if (campo === "ciudad") return valor.replace(/[0-9]/g, "").toUpperCase()
    if (campo === "nombres" || campo === "apellidos") return valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "").toUpperCase()
    return valor.toUpperCase()
  }

  function validateField(campo: string, valor: string): string | null {
    const labels: Record<string, string> = {
      cedula: estudiante.tipo_id === "cedula" ? "Cédula" : "DNI",
      nombres: "Nombres",
      apellidos: "Apellidos",
      telefono: "Teléfono",
      correo: "Correo",
      ocupacion: "Ocupación",
      direccion: "Dirección",
      ciudad: "Residencia",
      estado_civil: "Estado Civil",
      nivel_educativo: "Nivel Educativo",
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
    if (campo === "ciudad" && valor && /\d/.test(valor)) return "La ciudad no debe contener números"
    if (campo === "edad" && valor) {
      const edadNum = Number(valor)
      if (isNaN(edadNum) || edadNum < 10) return "Debes tener al menos 10 años para inscribirte"
      if (edadNum > 120) return "La edad ingresada no es válida"
    }
    return null
  }

  const updateEstudiante = (campo: string, valor: string) => {
    const sanitized = sanitizeInput(campo, valor)
    setEstudiante((prev) => ({ ...prev, [campo]: sanitized }))
    const err = validateField(campo, sanitized)
    setErrors((prev) => {
      const n = { ...prev }
      if (err) n[campo] = err
      else delete n[campo]
      return n
    })
  }

  const blurEstudiante = async (campo: string) => {
    setTouched((prev) => ({ ...prev, [campo]: true }))
    const rawVal = estudiante[campo as keyof EstudianteData]
    const valor = typeof rawVal === "string" ? rawVal : ""
    const err = validateField(campo, valor)
    setErrors((prev) => {
      const n = { ...prev }
      if (err) n[campo] = err
      else delete n[campo]
      return n
    })

    if (campo === "cedula" && !err && valor.trim()) {
      try {
        const existe = await cursosService.validarCedulaExiste(valor.trim())
        if (existe) {
          setErrors((prev) => ({ ...prev, cedula: "Esta cédula ya se encuentra registrada en el sistema." }))
          toast.error("La cédula ingresada ya se encuentra registrada en el sistema.")
        }
      } catch {
        // Silencioso en blur si hay fallo de red
      }
    }
  }

  const validateStep1 = (): boolean => {
    const fields: (keyof EstudianteData)[] = ["cedula", "nombres", "apellidos", "telefono", "correo"]
    const newErrors: Record<string, string> = {}
    let valid = true
    fields.forEach((f) => {
      const val = typeof estudiante[f] === "string" ? (estudiante[f] as string) : ""
      const err = validateField(f, val)
      if (err) {
        newErrors[f] = err
        valid = false
      }
    })
    if (!cedulaFile) {
      newErrors.cedulaFile = "Debes adjuntar la cédula (imagen o PDF)"
      valid = false
    }
    if (!estudiante.acepta_terminos) {
      newErrors.acepta_terminos = "Debe aceptar los términos y condiciones para continuar"
      valid = false
    }
    setErrors(newErrors)
    setTouched(fields.reduce((acc, f) => ({ ...acc, [f]: true }), {}))
    return valid
  }

  const handleNext = async () => {
    if (paso === 1) {
      if (!validateStep1()) return
      setValidandoCedula(true)
      try {
        const existe = await cursosService.validarCedulaExiste(estudiante.cedula.trim())
        if (existe) {
          setErrors((prev) => ({ ...prev, cedula: "Esta cédula ya se encuentra registrada en el sistema." }))
          setTouched((prev) => ({ ...prev, cedula: true }))
          toast.error("La cédula ingresada ya se encuentra registrada en el sistema.")
          return
        }
      } catch (err) {
        console.error("Error al validar cédula:", err)
        toast.error("No se pudo verificar la cédula. Por favor, intenta de nuevo.")
        return
      } finally {
        setValidandoCedula(false)
      }
      setPaso(2)
    }
  }

  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {}
    if (!metodoPago) errs.metodoPago = "Selecciona un método de pago"
    if (!comprobanteFile) {
      errs.comprobante = "Adjunta el comprobante de pago"
    }
    setPaymentErrors(errs)
    setPaymentTouched({ metodoPago: true, comprobante: true })
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validateStep2()) return
    setLoadingSubmit(true)
    const localDate = fechaPago || getLocalDateString()

    try {
      const formData = new FormData()
      formData.append("curso_abierto_id", curso.id)
      const precioCurso = Number(curso.precio_base || 0)
      const montoNum = parseFloat(montoDeclarado) || 0
      const esCompleto = precioCurso > 0 && montoNum >= precioCurso

      formData.append("tipo_pago", esCompleto ? "completo" : "abono")
      formData.append("tipo_comprobante", metodoPago)
      formData.append("fecha_pago_declarada", localDate)
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
      formData.append("edad", estudiante.edad)
      formData.append("nivel_educativo", estudiante.nivel_educativo)
      formData.append("monto_solicitado", montoDeclarado || "0")
      formData.append("monto_declarado", montoDeclarado || "0")
      formData.append("acepta_terminos", estudiante.acepta_terminos ? "1" : "0")
      if (comprobanteFile) formData.append("archivo_comprobante", comprobanteFile)
      if (cedulaFile) formData.append("archivo_cedula", cedulaFile)

      await cursosService.crearSolicitudInscripcion(formData)
      toast.success("Solicitud de matrícula enviada correctamente")
      onSuccess()
    } catch (err: unknown) {
      toast.error(getFriendlyErrorMessage(err, "Error al enviar la solicitud"), { duration: 8000 })
    } finally {
      setLoadingSubmit(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Pasos simplificados (Solo 2 pasos) */}
      <div className="flex items-center gap-0">
        {pasos.map((p, i) => (
          <div key={p.num} className="flex items-center gap-0 flex-1">
            <div
              className="flex items-center gap-1.5 sm:gap-2.5 px-3 sm:px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors"
              style={{
                backgroundColor: paso >= p.num ? `color-mix(in srgb, ${COLORS.ACCENT} 12%, transparent)` : "transparent",
                color: paso >= p.num ? COLORS.ACCENT : COLORS.TEXT_MUTED,
              }}
            >
              <div
                className="size-6 rounded-full flex items-center justify-center text-[11px] font-bold"
                style={{
                  backgroundColor: paso >= p.num ? COLORS.ACCENT : "oklch(0.90 0 0)",
                  color: paso >= p.num ? "#fff" : COLORS.TEXT_MUTED,
                }}
              >
                {paso > p.num ? <HugeiconsIcon icon={CheckCircle} size={14} /> : p.num}
              </div>
              <span className="inline font-bold">{p.label}</span>
            </div>
            {i < pasos.length - 1 && (
              <div
                className="flex-1 h-px mx-2"
                style={{ backgroundColor: paso > p.num ? COLORS.ACCENT : COLORS.BORDER_SUBTLE }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Contenido del Paso */}
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
          validandoCedula={validandoCedula}
        />
      )}

      {paso === 2 && (
        <PagoForm
          metodoPago={metodoPago}
          montoDeclarado={montoDeclarado}
          fechaPago={fechaPago}
          showFechaPago={false}
          hideAmount
          comprobanteFile={comprobanteFile}
          comprobantePreview={comprobantePreview}
          paymentErrors={paymentErrors}
          paymentTouched={paymentTouched}
          esTaller={false}
          tallerSel={undefined}
          curso={curso}
          loadingSubmit={loadingSubmit}
          canSubmit={step2CanSubmit}
          metodosPago={metodosPago}
          onMetodoPagoChange={(key) => {
            setMetodoPago(key)
            setPaymentTouched((prev) => ({ ...prev, metodoPago: true }))
            setPaymentErrors((prev) => {
              const n = { ...prev }
              delete n.metodoPago
              return n
            })
          }}
          onMontoDeclaradoChange={(val) => {
            setMontoDeclarado(val)
            setPaymentTouched((prev) => ({ ...prev, monto: true }))
            setPaymentErrors((prev) => {
              const n = { ...prev }
              delete n.monto
              return n
            })
          }}
          onFechaPagoChange={setFechaPago}
          onComprobanteChange={(file) => {
            if (!file) {
              setComprobanteFile(null)
              setComprobantePreview(null)
              setPaymentErrors((prev) => {
                const n = { ...prev }
                delete n.comprobante
                return n
              })
              return
            }
            const MAX = 20 * 1024 * 1024
            if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
              setPaymentErrors((prev) => ({ ...prev, comprobante: "Solo se permiten imágenes (JPG, PNG) o PDF" }))
              return
            }
            if (file.size > MAX) {
              setPaymentErrors((prev) => ({ ...prev, comprobante: "El comprobante no debe superar los 20 MB" }))
              return
            }
            setComprobanteFile(file)
            setComprobantePreview(file.type.startsWith("image/") ? URL.createObjectURL(file) : null)
            setPaymentTouched((prev) => ({ ...prev, comprobante: true }))
            setPaymentErrors((prev) => {
              const n = { ...prev }
              delete n.comprobante
              return n
            })
          }}
          onQuitarComprobante={() => {
            setComprobanteFile(null)
            setComprobantePreview(null)
            setPaymentErrors((prev) => {
              const n = { ...prev }
              delete n.comprobante
              return n
            })
          }}
          onSubmit={handleSubmit}
          onBack={() => setPaso(1)}
        />
      )}
    </div>
  )
}
