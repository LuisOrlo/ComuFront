import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { clientesService, type ClienteExterno } from "@/services/clientes.service"
import { toast } from "sonner"

interface FieldErrors {
  nombres?: string
  apellidos?: string
  cedula?: string
  celular?: string
  correo?: string
  ciudad?: string
  fecha_nacimiento?: string
}

export function NuevoClientePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id

  const [nombres, setNombres] = useState("")
  const [apellidos, setApellidos] = useState("")
  const [cedula, setCedula] = useState("")
  const [celular, setCelular] = useState("")
  const [correo, setCorreo] = useState("")
  const [ciudad, setCiudad] = useState("")
  const [direccion, setDireccion] = useState("")
  const [ocupacion, setOcupacion] = useState("")
  const [estadoCivil, setEstadoCivil] = useState("")
  const [fechaNacimiento, setFechaNacimiento] = useState("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!id) return
    clientesService.getCliente(id).then((c: ClienteExterno) => {
      setNombres(c.nombres || "")
      setApellidos(c.apellidos || "")
      setCedula(c.cedula || "")
      setCelular(c.celular || "")
      setCorreo(c.correo || "")
      setCiudad(c.ciudad || "")
      setDireccion(c.direccion || "")
      setOcupacion(c.ocupacion || "")
      setEstadoCivil(c.estado_civil || "")
      setFechaNacimiento(c.fecha_nacimiento || "")
    }).catch(() => {
      toast.error("Error al cargar datos del cliente")
      navigate("/clientes")
    }).finally(() => setLoading(false))
  }, [id, navigate])

  const sanitize = (field: string, value: string): string => {
    if (field === "nombres" || field === "apellidos") {
      return value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "").replace(/\s+/g, " ")
    }
    if (field === "cedula") return value.replace(/\D/g, "").slice(0, 10)
    if (field === "celular") return value.replace(/\D/g, "").slice(0, 10)
    return value
  }

  const validateField = (field: string, value: string): string | null => {
    switch (field) {
      case "nombres":
        if (!value.trim()) return "El nombre es obligatorio"
        if (value.trim().length < 2) return "Mínimo 2 caracteres"
        return null
      case "apellidos":
        if (value.trim() && value.trim().length < 2) return "Mínimo 2 caracteres"
        return null
      case "cedula":
        if (!value.trim()) return null
        if (!/^\d{10}$/.test(value)) return "Debe tener 10 dígitos"
        return null
      case "celular":
        if (!value.trim()) return null
        if (!/^\d{10}$/.test(value)) return "Debe tener 10 dígitos"
        return null
      case "correo":
        if (!value.trim()) return null
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Correo inválido"
        return null
      case "fecha_nacimiento":
        if (!value) return null
        if (new Date(value) > new Date()) return "No puede ser futura"
        return null
      default:
        return null
    }
  }

  const updateField = (field: string, raw: string) => {
    const val = sanitize(field, raw)
    const setters: Record<string, (v: string) => void> = {
      nombres: setNombres, apellidos: setApellidos, cedula: setCedula,
      celular: setCelular, correo: setCorreo, ciudad: setCiudad,
      direccion: setDireccion, ocupacion: setOcupacion, estadoCivil: setEstadoCivil,
      fecha_nacimiento: setFechaNacimiento,
    }
    setters[field]?.(val)
    if (touched[field]) {
    const err = validateField(field, val || "")
      setErrors(prev => ({ ...prev, [field]: err || undefined }))
    }
  }

  const blurField = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const val = {
      nombres, apellidos, cedula, celular, correo,
      ciudad, direccion, ocupacion, estadoCivil, fecha_nacimiento: fechaNacimiento,
    }[field]
    const err = validateField(field, val ?? "")
    setErrors(prev => ({ ...prev, [field]: err || undefined }))
  }

  const validateAll = (): boolean => {
    const fields: (keyof FieldErrors)[] = ["nombres", "apellidos", "cedula", "celular", "correo", "fecha_nacimiento"]
    const newErrors: FieldErrors = {}
    let valid = true
    for (const f of fields) {
      const val = { nombres, apellidos, cedula, celular, correo, ciudad, direccion, ocupacion, estadoCivil, fecha_nacimiento: fechaNacimiento }[f] || ""
      const err = validateField(f, val)
      if (err) { newErrors[f] = err; valid = false }
    }
    setErrors(newErrors)
    setTouched(prev => {
      const t = { ...prev }
      for (const f of fields) t[f] = true
      return t
    })
    return valid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateAll()) return
    setSaving(true)
    try {
      const payload = {
        nombres: nombres.trim(),
        apellidos: apellidos.trim() || undefined,
        cedula: cedula.trim() || undefined,
        celular: celular.trim() || undefined,
        correo: correo.trim() || undefined,
        ciudad: ciudad.trim() || undefined,
        direccion: direccion.trim() || undefined,
        ocupacion: ocupacion.trim() || undefined,
        estado_civil: estadoCivil.trim() || undefined,
        fecha_nacimiento: fechaNacimiento.trim() || undefined,
      }

      if (isEdit && id) {
        await clientesService.updateCliente(id, payload)
        toast.success("Cliente actualizado")
        navigate(`/clientes/${id}`)
      } else {
        const created = await clientesService.createCliente(payload)
        toast.success("Cliente registrado")
        navigate(`/clientes/${(created as ClienteExterno).id}`)
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Error al guardar cliente"
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin size-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  const inputCls = (field: string) => {
    const hasErr = touched[field] && errors[field as keyof FieldErrors]
    return `w-full px-4 py-3 rounded-lg border text-sm font-medium outline-none focus:ring-2 transition-all ${hasErr ? "border-red-400" : ""}`
  }

  const errMsg = (field: string) => {
    if (!touched[field]) return null
    const msg = errors[field as keyof FieldErrors]
    return msg ? <p className="text-[11px] mt-1 text-red-500">{msg}</p> : null
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      <header className="shrink-0 px-8 py-6 border-b bg-white/80 backdrop-blur-md" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(isEdit ? `/clientes/${id}` : "/clientes")}
            className="size-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: COLORS.CHARCOAL }}>
              {isEdit ? "Editar Cliente" : "Nuevo Cliente"}
            </h1>
            <p className="text-sm opacity-50 mt-0.5">
              {isEdit ? "Actualiza los datos del cliente" : "Registra un nuevo cliente en el sistema"}
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 lg:p-8 max-w-3xl mx-auto w-full">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border shadow-xl shadow-black/5 p-6 lg:p-8 space-y-5" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">Nombres *</label>
            <input value={nombres} onChange={e => updateField("nombres", e.target.value)} onBlur={() => blurField("nombres")}
              className={inputCls("nombres")}
              style={touched.nombres && errors.nombres ? undefined : { borderColor: COLORS.BORDER_SUBTLE }} required />
            {errMsg("nombres")}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">Apellidos</label>
              <input value={apellidos} onChange={e => updateField("apellidos", e.target.value)} onBlur={() => blurField("apellidos")}
                className={inputCls("apellidos")}
                style={touched.apellidos && errors.apellidos ? undefined : { borderColor: COLORS.BORDER_SUBTLE }} />
              {errMsg("apellidos")}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">Cédula</label>
              <input value={cedula} onChange={e => updateField("cedula", e.target.value)} onBlur={() => blurField("cedula")}
                className={inputCls("cedula")}
                style={touched.cedula && errors.cedula ? undefined : { borderColor: COLORS.BORDER_SUBTLE }} />
              {errMsg("cedula")}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">Celular</label>
              <input value={celular} onChange={e => updateField("celular", e.target.value)} onBlur={() => blurField("celular")}
                className={inputCls("celular")}
                style={touched.celular && errors.celular ? undefined : { borderColor: COLORS.BORDER_SUBTLE }} />
              {errMsg("celular")}
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">Correo electrónico</label>
              <input type="email" value={correo} onChange={e => updateField("correo", e.target.value)} onBlur={() => blurField("correo")}
                className={inputCls("correo")}
                style={touched.correo && errors.correo ? undefined : { borderColor: COLORS.BORDER_SUBTLE }} />
              {errMsg("correo")}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">Ciudad</label>
              <input value={ciudad} onChange={e => updateField("ciudad", e.target.value)} onBlur={() => blurField("ciudad")}
                className={inputCls("ciudad")}
                style={touched.ciudad && errors.ciudad ? undefined : { borderColor: COLORS.BORDER_SUBTLE }} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">Ocupación</label>
              <input value={ocupacion} onChange={e => setOcupacion(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border text-sm font-medium outline-none focus:ring-2 transition-all"
                style={{ borderColor: COLORS.BORDER_SUBTLE }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">Estado Civil</label>
              <select value={estadoCivil} onChange={e => setEstadoCivil(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border text-sm font-medium outline-none focus:ring-2 bg-white"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <option value="">Seleccionar...</option>
                <option value="soltero">Soltero</option>
                <option value="casado">Casado</option>
                <option value="divorciado">Divorciado</option>
                <option value="viudo">Viudo</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">Fecha de Nacimiento</label>
              <input type="date" value={fechaNacimiento} onChange={e => updateField("fecha_nacimiento", e.target.value)} onBlur={() => blurField("fecha_nacimiento")}
                className={inputCls("fecha_nacimiento")}
                style={touched.fecha_nacimiento && errors.fecha_nacimiento ? undefined : { borderColor: COLORS.BORDER_SUBTLE }}
                max={new Date().toISOString().split("T")[0]} />
              {errMsg("fecha_nacimiento")}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">Dirección</label>
            <textarea value={direccion} onChange={e => setDireccion(e.target.value)} rows={2}
              className="w-full px-4 py-3 rounded-lg border text-sm font-medium outline-none focus:ring-2 resize-none transition-all"
              style={{ borderColor: COLORS.BORDER_SUBTLE }} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate(isEdit ? `/clientes/${id}` : "/clientes")}
              className="flex-1 py-3.5 rounded-lg text-sm font-bold border transition-all hover:bg-gray-50"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-3.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "oklch(0.55 0.18 160)" }}>
              {saving ? "Guardando..." : isEdit ? "Actualizar Cliente" : "Guardar Cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
