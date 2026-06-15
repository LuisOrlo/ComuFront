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
import { ciudadesService, type Ciudad } from "@/services/ciudades.service"
import { toast } from "sonner"

interface Props {
  editingId: string | null
  onClose: () => void
  onSuccess: () => void
}

const inputClasses = "w-full px-3 py-2.5 bg-white border rounded-xl outline-none text-sm transition-all duration-150"
const inputFocus = "focus:border-[--accent] focus:ring-2 focus:ring-[--accent]/20 focus:shadow-sm"

// Helper para calcular estilo de validación
function getInputValidationStyle(hasError: boolean) {
  if (hasError) {
    return {
      borderColor: "#ef4444",
      boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.1)",
    }
  }
  return {
    borderColor: COLORS.BORDER_SUBTLE,
  }
}

export function PersonaFormModal({ editingId, onClose, onSuccess }: Props) {
  const [saving, setSaving] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [ciudades, setCiudades] = useState<Ciudad[]>([])
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const [form, setForm] = useState({
    tipo: "instructor" as "instructor" | "staff" | "secretaria" | "admin",
    cedula: "",
    nombres: "",
    apellidos: "",
    correo: "",
    celular: "",
    ciudad_id: "",
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

  const cargarCiudades = async () => {
    try {
      const data = await ciudadesService.getCiudadesTodas()
      setCiudades(data)
    } catch { /* */ }
  }

  const cargarPersona = async () => {
    if (!editingId) return
    setLoadingData(true)
    try {
      const p = await personasService.getPersonaById(editingId)
      setForm({
        tipo: p.tipo,
        cedula: p.cedula || "",
        nombres: p.nombres,
        apellidos: p.apellidos,
        correo: p.correo || "",
        celular: p.celular || "",
        ciudad_id: p.ciudad_id ? String(p.ciudad_id) : "",
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
    cargarCiudades()
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

  const getError = (field: string) => fieldErrors[field]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombres.trim() || !form.apellidos.trim()) return

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
          ciudad_id: form.ciudad_id ? parseInt(form.ciudad_id) : undefined,
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
          ciudad_id: form.ciudad_id ? parseInt(form.ciudad_id) : undefined,
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
                onChange={(value) => setForm({ ...form, nombres: value })}
                onBlur={() => setTouched({ ...touched, nombres: true })}
                error={fieldErrors.nombres}
                touched={touched.nombres}
                placeholder="Ej: Carlos"
                required
              />
              <ValidatedInput
                label="Apellidos"
                value={form.apellidos}
                onChange={(value) => setForm({ ...form, apellidos: value })}
                onBlur={() => setTouched({ ...touched, apellidos: true })}
                error={fieldErrors.apellidos}
                touched={touched.apellidos}
                placeholder="Ej: Roa"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={{ color: COLORS.CHARCOAL }}>
                  Cédula
                </label>
                <input
                  type="text"
                  value={form.cedula}
                  onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                  placeholder="1234567890"
                  className={`${inputClasses} ${inputFocus}`}
                  style={{ 
                    ...getInputValidationStyle(!!getError("cedula")),
                    color: COLORS.CHARCOAL 
                  }}
                />
                {getError("cedula") && (
                  <div className="flex items-start gap-1.5 mt-2">
                    <span className="text-red-500 text-lg leading-none">•</span>
                    <p className="text-red-500 text-xs">{getError("cedula")}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={{ color: COLORS.CHARCOAL }}>
                  Celular
                </label>
                <input
                  type="text"
                  value={form.celular}
                  onChange={(e) => setForm({ ...form, celular: e.target.value })}
                  placeholder="0999999999"
                  className={`${inputClasses} ${inputFocus}`}
                  style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={{ color: COLORS.CHARCOAL }}>
                  Correo
                </label>
                <input
                  type="email"
                  value={form.correo}
                  onChange={(e) => setForm({ ...form, correo: e.target.value })}
                  placeholder="correo@email.com"
                  className={`${inputClasses} ${inputFocus}`}
                  style={{ 
                    ...getInputValidationStyle(!!getError("correo")),
                    color: COLORS.CHARCOAL 
                  }}
                />
                {getError("correo") && (
                  <div className="flex items-start gap-1.5 mt-2">
                    <span className="text-red-500 text-lg leading-none">•</span>
                    <p className="text-red-500 text-xs">{getError("correo")}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={{ color: COLORS.CHARCOAL }}>
                  Ciudad
                </label>
                <select
                  value={form.ciudad_id}
                  onChange={(e) => setForm({ ...form, ciudad_id: e.target.value })}
                  className={`${inputClasses} ${inputFocus}`}
                  style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
                >
                  <option value="">Seleccionar...</option>
                  {ciudades.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
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
               <div>
                <ValidatedInput
                  label="Especialidad"
                  value={form.especialidad}
                  onChange={(value) => setForm({ ...form, especialidad: value })}
                  onBlur={() => setTouched({ ...touched, especialidad: true })}
                  error={fieldErrors.especialidad}
                  touched={touched.especialidad}
                  placeholder="Ej: Oratoria y Comunicación"
                  helperText="(opcional)"
                />
               </div>
               <div>
                <ValidatedTextarea
                  label="Bio"
                  value={form.bio}
                  onChange={(value) => setForm({ ...form, bio: value })}
                  onBlur={() => setTouched({ ...touched, bio: true })}
                  error={fieldErrors.bio}
                  touched={touched.bio}
                  placeholder="Experiencia, formación..."
                  rows={3}
                  helperText="(opcional)"
                />
               </div>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>
                  Datos laborales
                </span>
              </div>
              <div>
                <ValidatedInput
                  label="Cargo"
                  value={form.cargo}
                  onChange={(value) => setForm({ ...form, cargo: value })}
                  onBlur={() => setTouched({ ...touched, cargo: true })}
                  error={fieldErrors.cargo}
                  touched={touched.cargo}
                  placeholder="Ej: Coordinador Académico"
                  required
                />
              </div>
              {form.tipo === "staff" && (
                <>
                   <div>
                    <ValidatedInput
                      label="Salario base"
                      type="number"
                      value={form.salario_base}
                      onChange={(value) => setForm({ ...form, salario_base: value })}
                      onBlur={() => setTouched({ ...touched, salario_base: true })}
                      error={fieldErrors.salario_base}
                      touched={touched.salario_base}
                      placeholder="0.00"
                      helperText="(opcional)"
                    />
                   </div>
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
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={{ color: COLORS.CHARCOAL }}>
                        Usuario <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        placeholder="Ej: juan.morales"
                        className={`${inputClasses} ${inputFocus}`}
                        style={{ 
                          borderColor: getError("username") ? "#ef4444" : COLORS.BORDER_SUBTLE,
                          color: COLORS.CHARCOAL,
                          boxShadow: getError("username") ? `0 0 0 3px rgba(239, 68, 68, 0.1)` : "none"
                        }}
                      />
                      {getError("username") && (
                        <div className="flex items-start gap-1.5 mt-2">
                          <span className="text-red-500 text-lg leading-none">•</span>
                          <p className="text-red-500 text-xs">{getError("username")}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold mb-2" style={{ color: COLORS.CHARCOAL }}>
                        Contraseña <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="Mínimo 6 caracteres"
                        className={`${inputClasses} ${inputFocus}`}
                        style={{ 
                          borderColor: getError("password") ? "#ef4444" : COLORS.BORDER_SUBTLE,
                          color: COLORS.CHARCOAL,
                          boxShadow: getError("password") ? `0 0 0 3px rgba(239, 68, 68, 0.1)` : "none"
                        }}
                      />
                      {getError("password") && (
                        <div className="flex items-start gap-1.5 mt-2">
                          <span className="text-red-500 text-lg leading-none">•</span>
                          <p className="text-red-500 text-xs">{getError("password")}</p>
                        </div>
                      )}
                      <p className="text-[10px] mt-2" style={{ color: COLORS.TEXT_MUTED }}>Mínimo 6 caracteres</p>
                    </div>
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