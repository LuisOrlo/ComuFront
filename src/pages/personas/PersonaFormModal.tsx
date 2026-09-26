import { useEffect, useRef, useState, useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  User02Icon,
  GraduationCapIcon,
  Money01Icon,
  Mail01Icon,
  CheckmarkCircle04Icon,
} from "@hugeicons/core-free-icons"
import { X, Plus, FileText, Upload, Trash2 } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { ValidatedInput, ValidatedTextarea } from "@/components/form"
import { personasService } from "@/services/personas.service"
import { instructoresService } from "@/services/instructores.service"
import { staffService } from "@/services/staff.service"
import { ciudadesService } from "@/services/ciudades.service"
import { ECUADOR_CITIES } from "@/data/ciudades-ecuador"
import { CiudadBadge } from "@/components/cursos/CiudadBadge"

import { toast } from "sonner"

interface Props {
  editingId: string | null
  onClose: () => void
  onSuccess: () => void
  instructorOnly?: boolean
}

export function PersonaFormModal({ editingId, onClose, onSuccess, instructorOnly = false }: Props) {
  const [saving, setSaving] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [currentCv, setCurrentCv] = useState<{ nombre_original?: string; size?: number; updated_at?: string } | null>(null)
  const cvInputRef = useRef<HTMLInputElement>(null)

  // Searchable City Selector State
  const [ciudadesList, setCiudadesList] = useState<string[]>(ECUADOR_CITIES)
  const [ciudadDropdownOpen, setCiudadDropdownOpen] = useState(false)
  const [ciudadFocusIndex, setCiudadFocusIndex] = useState(-1)
  const ciudadContainerRef = useRef<HTMLDivElement>(null)

  const [form, setForm] = useState({
    tipo: "instructor" as "instructor" | "staff" | "secretaria" | "admin",
    cedula: "",
    nombres: "",
    apellidos: "",
    correo: "",
    celular: "",
    ciudad: "",
    especialidad: "",
    bio: "",
    cargo: "",
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
      if (instructorOnly || p.tipo === "instructor") {
        try {
          const detail = await instructoresService.getDetalle(editingId)
          setCurrentCv(detail.hoja_vida || null)
        } catch {
          setCurrentCv(null)
        }
      }
      setForm({
        tipo: instructorOnly ? "instructor" : p.tipo as "instructor" | "staff" | "secretaria" | "admin",
        cedula: p.cedula || "",
        nombres: p.nombres,
        apellidos: p.apellidos,
        correo: p.correo || "",
        celular: p.celular || "",
        ciudad: p.ciudad || "",
        especialidad: p.perfilInstructor?.especialidad || "",
        bio: p.perfilInstructor?.bio || "",
        cargo: p.perfilStaff?.cargo || "",

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

    setFieldErrors({})
    setCvFile(null)
    setCurrentCv(null)
    if (editingId) cargarPersona()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId])

  useEffect(() => {
    void ciudadesService
      .getCiudadesTodas()
      .then((ciudades) => {
        if (ciudades?.length) {
          const names = ciudades.map((c) => c.nombre)
          const combined = Array.from(new Set([...names, ...ECUADOR_CITIES])).sort()
          setCiudadesList(combined)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ciudadContainerRef.current && !ciudadContainerRef.current.contains(e.target as Node)) {
        setCiudadDropdownOpen(false)
        setCiudadFocusIndex(-1)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredCiudades = useMemo(() => {
    const q = form.ciudad.trim().toLowerCase()
    if (!q) return ciudadesList.slice(0, 30)
    return ciudadesList.filter((c) => c.toLowerCase().includes(q)).slice(0, 30)
  }, [ciudadesList, form.ciudad])

  const handleCvChange = (file?: File) => {
    if (!file) return
    const extensionPdf = file.name.toLowerCase().endsWith(".pdf")
    const mimeValido = !file.type || file.type === "application/pdf"
    if (!extensionPdf || !mimeValido) {
      toast.error("La hoja de vida debe ser un archivo PDF")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("La hoja de vida no puede superar los 10 MB")
      return
    }
    setCvFile(file)
  }

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
    const tipo = instructorOnly ? "instructor" : form.tipo
    if (tipo === "instructor") {
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
          tipo,
          cedula: form.cedula || undefined,
          nombres: form.nombres,
          apellidos: form.apellidos,
          correo: form.correo || undefined,
          celular: form.celular || undefined,
          ciudad: form.ciudad || undefined,
        })

        if (tipo === "instructor") {
          await instructoresService.updatePerfil(editingId, {
            especialidad: form.especialidad || undefined,
            bio: form.bio || undefined,
          })
          if ((instructorOnly || tipo === "instructor") && cvFile) {
            try {
              await instructoresService.subirHojaVida(editingId, cvFile)
            } catch {
              toast.warning("El instructor se actualizó, pero no se pudo subir la hoja de vida")
              onClose()
              onSuccess()
              return
            }
          }
        } else {
          await staffService.updatePerfil(editingId, {
            cargo: form.cargo,
            es_pasante: form.tipo === "staff" ? form.es_pasante : false,
          })
        }
        toast.success("Persona actualizada")
      } else {
        const created = await personasService.crearPersonaCompleta({
          tipo,
          cedula: form.cedula || undefined,
          nombres: form.nombres,
          apellidos: form.apellidos,
          correo: form.correo || undefined,
          celular: form.celular || undefined,
          ciudad: form.ciudad || undefined,
          especialidad: tipo === "instructor" ? (form.especialidad || undefined) : undefined,
          bio: tipo === "instructor" ? (form.bio || undefined) : undefined,
          cargo: tipo !== "instructor" ? form.cargo : undefined,
          es_pasante: tipo === "staff" ? form.es_pasante : undefined,
          crear_cuenta: instructorOnly ? false : form.crearCuenta && !!form.username && !!form.password,
          username: instructorOnly ? undefined : form.crearCuenta ? form.username : undefined,
          password: instructorOnly ? undefined : form.crearCuenta ? form.password : undefined,
        })
        if ((instructorOnly || tipo === "instructor") && cvFile) {
          try {
            await instructoresService.subirHojaVida(created.id, cvFile)
            toast.success("Instructor y hoja de vida creados exitosamente")
          } catch (cvErr: unknown) {
            console.error("Error subiendo hoja de vida:", cvErr)
            toast.warning("El instructor fue creado correctamente, pero hubo un detalle al subir la hoja de vida")
          }
        } else {
          toast.success(instructorOnly ? "Instructor creado exitosamente" : "Persona creada exitosamente")
        }
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
                {instructorOnly ? (editingId ? "Editar Instructor" : "Nuevo Instructor") : (editingId ? "Editar Persona" : "Nueva Persona")}
              </h2>
              <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                {instructorOnly ? "Registra y administra la información del instructor" : (editingId ? "Modifica los datos de la persona" : "Registra una nueva persona en el sistema")}
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
          {!instructorOnly && <div className="mb-6">
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
          </div>}

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
              <div ref={ciudadContainerRef} className="w-full space-y-1.5 relative">
                <label className="text-xs font-semibold" style={{ color: COLORS.TEXT_MUTED }}>
                  Ciudad <span style={{ color: "#ff4444" }}>*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.ciudad}
                    onChange={(e) => {
                      handleChange("ciudad", e.target.value)
                      setCiudadDropdownOpen(true)
                      setCiudadFocusIndex(-1)
                    }}
                    onFocus={() => setCiudadDropdownOpen(true)}
                    onBlur={() => handleBlur("ciudad")}
                    onKeyDown={(e) => {
                      if (!ciudadDropdownOpen && (e.key === "ArrowDown" || e.key === "Enter")) {
                        setCiudadDropdownOpen(true)
                        return
                      }
                      if (e.key === "ArrowDown") {
                        e.preventDefault()
                        setCiudadFocusIndex((prev) => Math.min(prev + 1, filteredCiudades.length - 1))
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault()
                        setCiudadFocusIndex((prev) => Math.max(prev - 1, 0))
                      } else if (e.key === "Enter" && ciudadFocusIndex >= 0) {
                        e.preventDefault()
                        const selected = filteredCiudades[ciudadFocusIndex]
                        if (selected) {
                          handleChange("ciudad", selected)
                          setCiudadDropdownOpen(false)
                          setCiudadFocusIndex(-1)
                        }
                      } else if (e.key === "Escape") {
                        setCiudadDropdownOpen(false)
                        setCiudadFocusIndex(-1)
                      }
                    }}
                    placeholder="Escribe o busca una ciudad..."
                    className="w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all pr-8"
                    style={{
                      borderColor:
                        touched.ciudad && fieldErrors.ciudad
                          ? "#ff4444"
                          : touched.ciudad && !fieldErrors.ciudad && form.ciudad.trim() !== ""
                          ? COLORS.ACCENT
                          : COLORS.BORDER_SUBTLE,
                      backgroundColor: "white",
                      color: COLORS.CHARCOAL,
                    }}
                  />
                  {form.ciudad && (
                    <button
                      type="button"
                      onClick={() => {
                        handleChange("ciudad", "")
                        setCiudadDropdownOpen(true)
                      }}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Dropdown with matches & CiudadBadge */}
                {ciudadDropdownOpen && (
                  <div
                    className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border bg-white p-1 shadow-lg"
                    style={{ borderColor: COLORS.BORDER_SUBTLE }}
                  >
                    {filteredCiudades.length > 0 ? (
                      filteredCiudades.map((cityName, idx) => (
                        <button
                          key={cityName}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            handleChange("ciudad", cityName)
                            setCiudadDropdownOpen(false)
                            setCiudadFocusIndex(-1)
                          }}
                          onMouseEnter={() => setCiudadFocusIndex(idx)}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition ${
                            idx === ciudadFocusIndex ? "bg-orange-50 text-[#fd761a]" : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <span>{cityName}</span>
                          <CiudadBadge ciudad={cityName} />
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-xs text-gray-400">
                        Sin coincidencias. Puedes conservar el texto escrito.
                      </div>
                    )}
                  </div>
                )}

                {touched.ciudad && fieldErrors.ciudad && (
                  <div className="text-xs" style={{ color: "#ff4444" }}>
                    {fieldErrors.ciudad}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Perfil según tipo */}
          {form.tipo === "instructor" ? (
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>
                  {instructorOnly ? "Perfil profesional" : "Perfil de instructor"}
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

          {/* Cuenta (solo en creación del módulo general de Personas) */}
          {!editingId && !instructorOnly && (
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

          {instructorOnly && (
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Hoja de vida</span>
              </div>
              <input ref={cvInputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => { handleCvChange(event.target.files?.[0]); event.currentTarget.value = "" }} />
              {currentCv && !cvFile && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3 text-sm">
                  <FileText size={17} style={{ color: COLORS.ACCENT }} />
                  <span className="flex-1">Hoja de vida actual: <b>{currentCv.nombre_original}</b>{currentCv.size ? ` (${(currentCv.size / 1024 / 1024).toFixed(2)} MB)` : ""}</span>
                  <button type="button" onClick={() => void instructoresService.getHojaVida(editingId || "").then((response) => { const url = URL.createObjectURL(response.data); window.open(url, "_blank"); setTimeout(() => URL.revokeObjectURL(url), 1000) })} className="text-blue-600">Ver</button>
                  <button type="button" onClick={() => cvInputRef.current?.click()} className="text-blue-600">Reemplazar</button>
                  <button type="button" onClick={async () => { if (!editingId || !confirm("¿Eliminar la hoja de vida?")) return; try { await instructoresService.eliminarHojaVida(editingId); setCurrentCv(null); toast.success("Hoja de vida eliminada") } catch { toast.error("No se pudo eliminar la hoja de vida") } }} className="text-red-600">Eliminar</button>
                </div>
              )}
              {cvFile && (
                <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
                  <FileText size={17} className="text-blue-600" /><span className="flex-1">{cvFile.name} ({(cvFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  <button type="button" onClick={() => setCvFile(null)} className="text-red-600" title="Quitar archivo"><Trash2 size={16} /></button>
                </div>
              )}
              {!cvFile && !currentCv && <p className="text-sm text-gray-500">Ningún archivo seleccionado</p>}
              <button type="button" onClick={() => cvInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><Upload size={16} /> {currentCv ? "Reemplazar PDF" : "Seleccionar PDF"}</button>
              <p className="text-xs text-gray-500">Solo archivos PDF. Tamaño máximo 10 MB.</p>
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
                  {instructorOnly && cvFile ? "Guardando instructor..." : "Guardando..."}
                </>
              ) : editingId ? (
                <>
                  <Plus size={16} />
                  Actualizar
                </>
              ) : (
                <>
                  <Plus size={16} />
                  {instructorOnly ? "Crear Instructor" : "Crear Persona"}
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
