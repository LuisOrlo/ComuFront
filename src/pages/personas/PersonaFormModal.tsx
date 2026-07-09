import { useEffect, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  User02Icon,
  GraduationCapIcon,
  Money01Icon,
  Mail01Icon,
  CheckmarkCircle04Icon,
} from "@hugeicons/core-free-icons"
import { X, Plus } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { ValidatedInput, ValidatedTextarea } from "@/components/form"
import { personasService } from "@/services/personas.service"
import { instructoresService } from "@/services/instructores.service"
import { staffService } from "@/services/staff.service"

import { toast } from "sonner"

interface Props {
  editingId: string | null
  onClose: () => void
  onSuccess: () => void
}

export function PersonaFormModal({ editingId, onClose, onSuccess }: Props) {
  const [saving, setSaving] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const [form, setForm] = useState({
    tipo: "instructor" as "instructor" | "staff" | "secretaria" | "admin",
    cedula: "",
    nombres: "",
    apellidos: "",
    correo: "",
    celular: "",
    ciudad: "",
    es_activo: true,
    especialidad: "",
    bio: "",
    cargo: "",
    salario_base: "",
    fecha_ingreso: "",
    es_pasante: false,
    crearCuenta: false,
    username: "",
    password: "",
  })

  const cargarPersona = async () => {
    if (!editingId) return
    setLoadingData(true)
    try {
      const p = await personasService.getPersonaById(editingId)
      setForm({
        tipo: p.tipo as "instructor" | "staff" | "secretaria" | "admin",
        cedula: p.cedula || "",
        nombres: p.nombres,
        apellidos: p.apellidos,
        correo: p.correo || "",
        celular: p.celular || "",
        ciudad: p.ciudad || "",
        es_activo: p.es_activo,
        especialidad: p.perfilInstructor?.especialidad || "",
        bio: p.perfilInstructor?.bio || "",
        cargo: p.perfilStaff?.cargo || "",
        salario_base: p.perfilStaff?.salario_base ? String(p.perfilStaff.salario_base) : "",
        fecha_ingreso: p.perfilStaff?.fecha_ingreso || "",
        es_pasante: p.perfilStaff?.es_pasante || false,
        crearCuenta: false,
        username: "",
        password: "",
      })
    } catch {
      toast.error("Error al cargar datos")
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFieldErrors({})
    if (editingId) cargarPersona()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId])

  const parseErrors = (errorsObj: Record<string, string[]>) => {
    const parsed: Record<string, string> = {}
    for (const [key, msgs] of Object.entries(errorsObj)) {
      parsed[key] = msgs[0]
    }
    return parsed
  }

  const validateField = (field: string, value: string): string | null => {
    switch (field) {
      case "nombres":
        if (!value.trim()) return "Los nombres son obligatorios"
        if (!/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/.test(value.trim())) return "Solo se permiten letras"
        return null
      case "apellidos":
        if (!value.trim()) return "Los apellidos son obligatorios"
        if (!/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]+$/.test(value.trim())) return "Solo se permiten letras"
        return null
      case "cedula":
        if (!value.trim()) return null
        if (!/^\d+$/.test(value.trim())) return "Solo se permiten números"
        if (value.trim().length > 10) return "Máximo 10 dígitos"
        return null
      case "celular":
        if (!value.trim()) return null
        if (!/^\d+$/.test(value.trim())) return "Solo se permiten números"
        if (value.trim().length > 10) return "Máximo 10 dígitos"
        return null
      case "correo":
        if (!value.trim()) return null
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Correo no válido"
        return null
      case "ciudad":
        if (!value.trim()) return "La ciudad es obligatoria"
        return null
      case "especialidad":
        if (!value.trim()) return "La especialidad es obligatoria"
        return null
      case "cargo":
        if (!value.trim()) return "El cargo es obligatorio"
        return null
      default:
        return null
    }
  }

  const sanitizeInput = (field: string, value: string): string => {
    switch (field) {
      case "nombres":
      case "apellidos":
        return value.replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]/g, "")
      case "cedula":
        return value.replace(/\D/g, "").slice(0, 10)
      case "celular":
        return value.replace(/\D/g, "").slice(0, 10)
      default:
        return value
    }
  }

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const value = (form as Record<string, unknown>)[field] as string
    const err = validateField(field, value)
    setFieldErrors((prev) => {
      const next = { ...prev }
      if (err) next[field] = err
      else delete next[field]
      return next
    })
  }

  const handleChange = (field: keyof typeof form, rawValue: string) => {
    const value = sanitizeInput(field, rawValue)
    setForm((prev) => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const fieldsToValidate: { name: string; value: string }[] = [
      { name: "nombres", value: form.nombres },
      { name: "apellidos", value: form.apellidos },
      { name: "cedula", value: form.cedula },
      { name: "celular", value: form.celular },
      { name: "correo", value: form.correo },
      { name: "ciudad", value: form.ciudad },
    ]
    if (form.tipo === "instructor") {
      fieldsToValidate.push({ name: "especialidad", value: form.especialidad })
    } else {
      fieldsToValidate.push({ name: "cargo", value: form.cargo })
    }

    const allTouched: Record<string, boolean> = {}
    const errors: Record<string, string> = {}
    for (const { name, value } of fieldsToValidate) {
      allTouched[name] = true
      const err = validateField(name, value)
      if (err) errors[name] = err
    }

    if (Object.keys(errors).length > 0) {
      setTouched(allTouched)
      setFieldErrors(errors)
      toast.error("Corrige los errores en el formulario")
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        await personasService.actualizarPersona(editingId, {
          tipo: form.tipo,
          cedula: form.cedula || undefined,
          nombres: form.nombres,
          apellidos: form.apellidos,
          correo: form.correo || undefined,
          celular: form.celular || undefined,
          ciudad: form.ciudad || undefined,
          es_activo: form.es_activo,
        })

        if (form.tipo === "instructor") {
          await instructoresService.updatePerfil(editingId, {
            especialidad: form.especialidad || undefined,
            bio: form.bio || undefined,
          })
        } else {
          await staffService.updatePerfil(editingId, {
            cargo: form.cargo,
            salario_base: form.salario_base ? parseFloat(form.salario_base) : undefined,
            es_pasante: form.tipo === "staff" ? form.es_pasante : false,
          })
        }
        toast.success("Persona actualizada")
      } else {
        await personasService.crearPersonaCompleta({
          tipo: form.tipo,
          cedula: form.cedula || undefined,
          nombres: form.nombres,
          apellidos: form.apellidos,
          correo: form.correo || undefined,
          celular: form.celular || undefined,
          ciudad: form.ciudad || undefined,
          especialidad: form.tipo === "instructor" ? (form.especialidad || undefined) : undefined,
          bio: form.tipo === "instructor" ? (form.bio || undefined) : undefined,
          cargo: form.tipo !== "instructor" ? form.cargo : undefined,
          salario_base: form.tipo !== "instructor" && form.tipo !== "admin" && form.salario_base
            ? parseFloat(form.salario_base) : undefined,
          fecha_ingreso: form.tipo !== "instructor" ? (form.fecha_ingreso || undefined) : undefined,
          es_pasante: form.tipo === "staff" ? form.es_pasante : undefined,
          crear_cuenta: form.crearCuenta && !!form.username && !!form.password,
          username: form.crearCuenta ? form.username : undefined,
          password: form.crearCuenta ? form.password : undefined,
        })
        toast.success("Persona creada exitosamente")
      }

      onClose()
      onSuccess()
    } catch (err) {
      const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } }
      const errorsObj = axiosErr.response?.data?.errors
      const backendMsg = axiosErr.response?.data?.message
      if (errorsObj) {
        setFieldErrors(parseErrors(errorsObj))
        const first = Object.values(errorsObj).flat()[0] as string
        toast.error(first)
      } else if (backendMsg) {
        toast.error(backendMsg)
      } else {
        toast.error("Error al guardar")
      }
    } finally {
      setSaving(false)
    }
  }

  if (loadingData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-8 flex flex-col items-center gap-3">
          <div className="size-8 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: COLORS.ACCENT, borderRightColor: COLORS.ACCENT }} />
          <span className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>Cargando datos...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div
        className="bg-white rounded-xl w-full max-w-2xl max-h-[90dvh] overflow-y-auto persona-modal-scroll animate-modal-in"
        style={{ boxShadow: "0 20px 60px -10px rgba(0,0,0,0.15)" }}
      >
        <style>{`.persona-modal-scroll::-webkit-scrollbar{width:4px}.persona-modal-scroll::-webkit-scrollbar-track{background:transparent}.persona-modal-scroll::-webkit-scrollbar-thumb{background:oklch(0.85 0 0);border-radius:4px}.persona-modal-scroll::-webkit-scrollbar-thumb:hover{background:oklch(0.75 0 0)}@keyframes modalIn{from{opacity:0;transform:scale(0.95) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}.animate-modal-in{animation:modalIn 250ms cubic-bezier(0.16,1,0.3,1) forwards}input:hover,select:hover,textarea:hover{border-color:oklch(0.75 0 0)}`}</style>

        <div
          className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <div className="flex items-center gap-3">
            <div
              className="size-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 12%, transparent)` }}
            >
              <HugeiconsIcon icon={User02Icon} size={20} style={{ color: COLORS.ACCENT }} />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: COLORS.CHARCOAL }}>
                {editingId ? "Editar Persona" : "Nueva Persona"}
              </h2>
              <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                {editingId ? "Modifica los datos de la persona" : "Registra una nueva persona en el sistema"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100"
            style={{ color: COLORS.TEXT_MUTED }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Tipo */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>
                Tipo de persona
              </span>
              <span className="text-xs text-red-500">*</span>
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {[
                { key: "instructor", label: "Instructor", icon: GraduationCapIcon },
                { key: "staff", label: "Staff", icon: Money01Icon },
                { key: "secretaria", label: "Secretaria", icon: Mail01Icon },
                { key: "admin", label: "Admin", icon: CheckmarkCircle04Icon },
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm({ ...form, tipo: key as typeof form.tipo })}
                  className="relative px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 border-2 flex flex-col items-center gap-1.5"
                  style={{
                    backgroundColor: form.tipo === key ? `color-mix(in srgb, ${COLORS.ACCENT} 10%, white)` : "white",
                    color: form.tipo === key ? COLORS.ACCENT : COLORS.TEXT_MUTED,
                    borderColor: form.tipo === key ? COLORS.ACCENT : COLORS.BORDER_SUBTLE,
                  }}
                  onMouseEnter={(e) => {
                    if (form.tipo !== key) {
                      e.currentTarget.style.borderColor = `color-mix(in srgb, ${COLORS.ACCENT} 40%, transparent)`
                      e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${COLORS.ACCENT} 5%, white)`
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (form.tipo !== key) {
                      e.currentTarget.style.borderColor = COLORS.BORDER_SUBTLE
                      e.currentTarget.style.backgroundColor = "white"
                    }
                  }}
                >
                  <HugeiconsIcon icon={icon} size={18} />
                  <span>{label}</span>
                  {form.tipo === key && (
                    <div className="absolute -top-1 -right-1 size-2.5 rounded-full" style={{ backgroundColor: COLORS.ACCENT }} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Datos personales */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>
                Datos personales
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ValidatedInput
                label="Nombres"
                value={form.nombres}
                onChange={(value) => handleChange("nombres", value)}
                onBlur={() => handleBlur("nombres")}
                error={fieldErrors.nombres}
                touched={touched.nombres}
                placeholder="Ej: Carlos"
                required
              />
              <ValidatedInput
                label="Apellidos"
                value={form.apellidos}
                onChange={(value) => handleChange("apellidos", value)}
                onBlur={() => handleBlur("apellidos")}
                error={fieldErrors.apellidos}
                touched={touched.apellidos}
                placeholder="Ej: Roa"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ValidatedInput
                label="Cédula"
                value={form.cedula}
                onChange={(value) => handleChange("cedula", value)}
                onBlur={() => handleBlur("cedula")}
                error={fieldErrors.cedula}
                touched={touched.cedula}
                placeholder="1234567890"
              />
              <ValidatedInput
                label="Celular"
                value={form.celular}
                onChange={(value) => handleChange("celular", value)}
                onBlur={() => handleBlur("celular")}
                error={fieldErrors.celular}
                touched={touched.celular}
                placeholder="0999999999"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ValidatedInput
                label="Correo"
                type="email"
                value={form.correo}
                onChange={(value) => handleChange("correo", value)}
                onBlur={() => handleBlur("correo")}
                error={fieldErrors.correo}
                touched={touched.correo}
                placeholder="correo@email.com"
              />
              <ValidatedInput
                label="Ciudad"
                value={form.ciudad}
                onChange={(value) => handleChange("ciudad", value)}
                onBlur={() => handleBlur("ciudad")}
                error={fieldErrors.ciudad}
                touched={touched.ciudad}
                placeholder="Ej: Quito"
                required
              />
            </div>
          </div>

          {/* Perfil según tipo */}
          {form.tipo === "instructor" ? (
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>
                  Perfil de instructor
                </span>
              </div>
              <ValidatedInput
                label="Especialidad"
                value={form.especialidad}
                onChange={(value) => handleChange("especialidad", value)}
                onBlur={() => handleBlur("especialidad")}
                error={fieldErrors.especialidad}
                touched={touched.especialidad}
                placeholder="Ej: Oratoria y Comunicación"
                required
              />
              <ValidatedTextarea
                label="Bio"
                value={form.bio}
                onChange={(value) => handleChange("bio", value)}
                onBlur={() => setTouched({ ...touched, bio: true })}
                placeholder="Experiencia, formación..."
                rows={3}
                helperText="(opcional)"
              />
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>
                  Datos laborales
                </span>
              </div>
              <ValidatedInput
                label="Cargo"
                value={form.cargo}
                onChange={(value) => handleChange("cargo", value)}
                onBlur={() => handleBlur("cargo")}
                error={fieldErrors.cargo}
                touched={touched.cargo}
                placeholder="Ej: Coordinador Académico"
                required
              />
              {form.tipo === "staff" && (
                <>
                  <ValidatedInput
                    label="Salario base"
                    type="number"
                    value={form.salario_base}
                    onChange={(value) => handleChange("salario_base", value)}
                    onBlur={() => setTouched({ ...touched, salario_base: true })}
                    error={fieldErrors.salario_base}
                    touched={touched.salario_base}
                    placeholder="0.00"
                    helperText="(opcional)"
                  />
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div
                      className="size-5 rounded flex items-center justify-center transition-all duration-150 group-hover:scale-110"
                      style={{
                        backgroundColor: form.es_pasante ? COLORS.ACCENT : "transparent",
                        border: `2px solid ${form.es_pasante ? COLORS.ACCENT : COLORS.BORDER_SUBTLE}`,
                      }}
                      onClick={() => setForm({ ...form, es_pasante: !form.es_pasante })}
                    >
                      {form.es_pasante && <HugeiconsIcon icon={CheckmarkCircle04Icon} size={12} className="text-white" />}
                    </div>
                    <span className="text-sm group-hover:text-[--accent] transition-colors duration-150" style={{ color: COLORS.CHARCOAL }}>Es pasante</span>
                  </label>
                </>
              )}
            </div>
          )}

          {/* Cuenta (solo en creación) */}
          {!editingId && (
            <div className="mb-6">
              <label className="flex items-center gap-2.5 cursor-pointer group mb-4">
                <div
                  className="size-5 rounded flex items-center justify-center transition-all duration-150 group-hover:scale-110"
                  style={{
                    backgroundColor: form.crearCuenta ? COLORS.ACCENT : "transparent",
                    border: `2px solid ${form.crearCuenta ? COLORS.ACCENT : COLORS.BORDER_SUBTLE}`,
                  }}
                  onClick={() => setForm({ ...form, crearCuenta: !form.crearCuenta })}
                >
                  {form.crearCuenta && <HugeiconsIcon icon={CheckmarkCircle04Icon} size={12} className="text-white" />}
                </div>
                <span className="text-sm font-semibold group-hover:text-[--accent] transition-colors duration-150" style={{ color: COLORS.CHARCOAL }}>Crear cuenta de sistema</span>
              </label>
              {form.crearCuenta && (
                <div
                  className="rounded-xl p-4 mt-3 border"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 3%, white)`,
                    borderColor: COLORS.BORDER_SUBTLE
                  }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ValidatedInput
                      label="Usuario"
                      value={form.username}
                      onChange={(value) => handleChange("username", value)}
                      onBlur={() => setTouched({ ...touched, username: true })}
                      error={fieldErrors.username}
                      touched={touched.username}
                      placeholder="Ej: juan.morales"
                      required
                    />
                    <ValidatedInput
                      label="Contraseña"
                      type="password"
                      value={form.password}
                      onChange={(value) => handleChange("password", value)}
                      onBlur={() => setTouched({ ...touched, password: true })}
                      error={fieldErrors.password}
                      touched={touched.password}
                      placeholder="Mínimo 6 caracteres"
                      required
                      helperText="Mínimo 6 caracteres"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {editingId && (
            <div className="mb-6">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div
                  className="size-5 rounded flex items-center justify-center transition-all duration-150 group-hover:scale-110"
                  style={{
                    backgroundColor: form.es_activo ? COLORS.ACCENT : "transparent",
                    border: `2px solid ${form.es_activo ? COLORS.ACCENT : COLORS.BORDER_SUBTLE}`,
                  }}
                  onClick={() => setForm({ ...form, es_activo: !form.es_activo })}
                >
                  {form.es_activo && <HugeiconsIcon icon={CheckmarkCircle04Icon} size={12} className="text-white" />}
                </div>
                <span className="text-sm group-hover:text-[--accent] transition-colors duration-150" style={{ color: COLORS.CHARCOAL }}>Activo</span>
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-5 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 active:scale-[0.98]"
              style={{ backgroundColor: COLORS.ACCENT, opacity: saving ? 0.6 : 1 }}
              onMouseEnter={(e) => {
                if (!saving) e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${COLORS.ACCENT} 85%, black)`
              }}
              onMouseLeave={(e) => {
                if (!saving) e.currentTarget.style.backgroundColor = COLORS.ACCENT
              }}
            >
              {saving ? (
                <>
                  <div className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Guardando...
                </>
              ) : editingId ? (
                <>
                  <Plus size={16} />
                  Actualizar
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Crear Persona
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl text-sm font-medium transition-colors"
              style={{ backgroundColor: "oklch(0.95 0 0)", color: COLORS.TEXT_MUTED }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "oklch(0.92 0 0)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "oklch(0.95 0 0)"
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
