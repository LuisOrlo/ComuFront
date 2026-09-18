import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ChevronRight,
  ChevronLeft,
  Search,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Building2,
  Monitor,
  MapPin,
  Check,
  Info,
  ShieldCheck,
  ArrowLeft,
  Plus,
} from "lucide-react"
import { HugeiconsIcon } from "@hugeicons/react"
import { MapPinIcon, Cancel01Icon, Loading02Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { ciudadesService, type Ciudad } from "@/services/ciudades.service"
import { instructoresService } from "@/services/instructores.service"
import {
  cursosPersonalizadosService,
  type CursoPersonalizadoInput,
} from "@/services/cursosPersonalizados.service"

const ECUADOR_CIUDADES = [
  { nombre: "Quito", provincia: "Pichincha", region: "Sierra" },
  { nombre: "Guayaquil", provincia: "Guayas", region: "Costa" },
  { nombre: "Cuenca", provincia: "Azuay", region: "Sierra" },
  { nombre: "Ambato", provincia: "Tungurahua", region: "Sierra" },
  { nombre: "Santo Domingo", provincia: "Santo Domingo de los Tsáchilas", region: "Tropical" },
  { nombre: "Manta", provincia: "Manabí", region: "Costa" },
  { nombre: "Portoviejo", provincia: "Manabí", region: "Costa" },
  { nombre: "Loja", provincia: "Loja", region: "Sierra" },
  { nombre: "Riobamba", provincia: "Chimborazo", region: "Sierra" },
  { nombre: "Machala", provincia: "El Oro", region: "Costa" },
  { nombre: "Durán", provincia: "Guayas", region: "Costa" },
  { nombre: "Ibarra", provincia: "Imbabura", region: "Sierra" },
  { nombre: "Babahoyo", provincia: "Los Ríos", region: "Costa" },
  { nombre: "Tulcán", provincia: "Carchi", region: "Sierra" },
  { nombre: "Latacunga", provincia: "Cotopaxi", region: "Sierra" },
  { nombre: "Guaranda", provincia: "Bolívar", region: "Sierra" },
  { nombre: "Azogues", provincia: "Cañar", region: "Sierra" },
  { nombre: "Tena", provincia: "Napo", region: "Amazonía" },
  { nombre: "Puyo", provincia: "Pastaza", region: "Amazonía" },
  { nombre: "Zamora", provincia: "Zamora Chinchipe", region: "Amazonía" },
  { nombre: "Macas", provincia: "Morona Santiago", region: "Amazonía" },
  { nombre: "Nueva Loja", provincia: "Sucumbíos", region: "Amazonía" },
  { nombre: "Francisco de Orellana", provincia: "Orellana", region: "Amazonía" },
  { nombre: "Puerto Baquerizo Moreno", provincia: "Galápagos", region: "Insular" },
]

const REGIONES = ["Sierra", "Costa", "Amazonía", "Insular"] as const
type Region = (typeof REGIONES)[number]

const regionColors: Record<Region, string> = {
  Sierra: "oklch(0.65 0.15 250)",
  Costa: "oklch(0.65 0.18 145)",
  Amazonía: "oklch(0.60 0.18 145)",
  Insular: "oklch(0.65 0.15 50)",
}

const STEP_META = [
  { step: 1, title: "Información & Docente", subtitle: "Datos generales", nextLabel: "Siguiente: Fechas & Horarios" },
  { step: 2, title: "Fechas & Horarios", subtitle: "Programación", nextLabel: "Siguiente: Configuración" },
  { step: 3, title: "Configuración & Precios", subtitle: "Modalidad & Cupos", nextLabel: "Finalizar y Guardar" },
]

const emptyForm: CursoPersonalizadoInput = {
  nombre: "",
  descripcion: "",
  docente_id: null,
  modalidad: "presencial",
  ciudad_id: null,
  fecha_inicio: "",
  fecha_fin: "",
  hora_inicio: "",
  hora_fin: "",
  dias_semana: [],
  precio_total: 0,
  capacidad: 1,
}

const getWeekdayFromDate = (dateValue: string): number | null => {
  if (!dateValue) return null
  const [year, month, day] = dateValue.split("-").map(Number)
  if (!year || !month || !day) return null
  const weekday = new Date(year, month - 1, day).getDay()
  return weekday === 0 ? 7 : weekday
}

export function CursoPersonalizadoFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const editing = Boolean(id)

  const [currentStep, setCurrentStep] = useState(1)
  const [form, setForm] = useState<CursoPersonalizadoInput>(emptyForm)
  const [cities, setCities] = useState<Ciudad[]>([])
  const [teachers, setTeachers] = useState<{ id: string; nombres: string; apellidos: string; email?: string }[]>([])
  const [teacherSearch, setTeacherSearch] = useState("")
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [modoDias, setModoDias] = useState<"unico" | "multiple">("unico")

  const [showCiudadModal, setShowCiudadModal] = useState(false)
  const [ciudadModalRegion, setCiudadModalRegion] = useState<Region | null>(null)
  const [ciudadModalSeleccionada, setCiudadModalSeleccionada] = useState<string | null>(null)
  const [savingCiudad, setSavingCiudad] = useState(false)

  useEffect(() => {
    Promise.all([ciudadesService.getCiudadesTodas(), instructoresService.getDisponibles()])
      .then(([cityData, teacherData]) => {
        setCities(cityData)
        setTeachers(teacherData)
      })
      .catch(() => toast.error("No se pudieron cargar los datos base"))
  }, [])

  useEffect(() => {
    if (!id) return
    cursosPersonalizadosService
      .obtener(id)
      .then(({ data }) =>
        setForm({
          nombre: data.nombre || "",
          descripcion: data.descripcion || "",
          docente_id: data.docente_id || null,
          modalidad: data.modalidad,
          ciudad_id: data.ciudad_id || null,
          fecha_inicio: data.fecha_inicio?.slice(0, 10) || "",
          fecha_fin: data.fecha_fin?.slice(0, 10) || "",
          hora_inicio: (data.hora_inicio || "").slice(0, 5),
          hora_fin: (data.hora_fin || "").slice(0, 5),
          precio_total: Number(data.precio_total || 0),
          capacidad: Number(data.capacidad || 1),
          dias_semana: data.dias_semana || [],
        })
      )
      .catch(() => toast.error("No se pudo cargar el curso personalizado"))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (id) {
      setModoDias((form.dias_semana?.length || 0) > 1 ? "multiple" : "unico")
    }
  }, [id, form.dias_semana?.length])

  const setField = (field: keyof CursoPersonalizadoInput, value: string | number | number[] | null) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  // Pure validation check to block Next button
  const isStepValid = (step: number): boolean => {
    if (step === 1) {
      return form.nombre.trim() !== ""
    }
    if (step === 2) {
      if (!form.fecha_inicio) return false
      if (modoDias === "multiple" && !form.fecha_fin) return false
      if (modoDias === "multiple" && form.fecha_fin < form.fecha_inicio) return false
      if (!form.hora_inicio || !form.hora_fin) return false
      if (form.hora_fin <= form.hora_inicio) return false
      if (modoDias === "multiple" && !form.dias_semana?.length) return false
      return true
    }
    if (step === 3) {
      if (!form.modalidad) return false
      if (form.modalidad === "presencial" && !form.ciudad_id) return false
      if (Number(form.precio_total) < 0) return false
      if (Number(form.capacidad) < 1) return false
      return true
    }
    return false
  }

  const validateStep = (step: number): boolean => {
    const next: Record<string, string> = {}
    if (step === 1) {
      if (!form.nombre.trim()) next.nombre = "El nombre es obligatorio"
    } else if (step === 2) {
      if (!form.fecha_inicio) next.fecha_inicio = modoDias === "unico" ? "La fecha de la sesión es obligatoria" : "La fecha de inicio es obligatoria"
      if (modoDias === "multiple" && !form.fecha_fin) next.fecha_fin = "La fecha de fin es obligatoria"
      if (modoDias === "multiple" && form.fecha_inicio && form.fecha_fin && form.fecha_fin < form.fecha_inicio) {
        next.fecha_fin = "La fecha de fin debe ser posterior al inicio"
      }
      if (!form.hora_inicio) next.hora_inicio = "La hora de inicio es obligatoria"
      if (!form.hora_fin) next.hora_fin = "La hora de fin es obligatoria"
      if (form.hora_inicio && form.hora_fin && form.hora_fin <= form.hora_inicio) {
        next.hora_fin = "La hora de fin debe ser posterior al inicio"
      }
      if (modoDias === "multiple" && !form.dias_semana?.length) next.dias_semana = "Selecciona al menos un día de la semana"
    } else if (step === 3) {
      if (!form.modalidad) next.modalidad = "Selecciona la modalidad"
      if (form.modalidad === "presencial" && !form.ciudad_id) next.ciudad_id = "La ciudad es obligatoria"
      if (Number(form.precio_total) < 0) next.precio_total = "El precio no puede ser negativo"
      if (Number(form.capacidad) < 1) next.capacidad = "La capacidad debe ser mayor a 0"
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleNextStep = () => {
    if (!isStepValid(currentStep)) {
      validateStep(currentStep)
      toast.error("Completa los campos obligatorios para continuar")
      return
    }
    setCurrentStep((prev) => Math.min(prev + 1, 3))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleGoToStep = (targetStep: number) => {
    if (targetStep < currentStep) {
      setCurrentStep(targetStep)
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }
    for (let s = 1; s < targetStep; s++) {
      if (!isStepValid(s)) {
        toast.info(`Completa el Paso ${s}: ${STEP_META[s - 1].title} para avanzar`)
        return
      }
    }
    setCurrentStep(targetStep)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleCrearCiudad = async (nombre: string) => {
    if (!nombre.trim()) return
    setSavingCiudad(true)
    try {
      const nueva = await ciudadesService.crearCiudad(nombre.trim())
      toast.success(`Ciudad "${nombre}" creada`)
      const ciudadesActualizadas = await ciudadesService.getCiudadesTodas()
      setCities(ciudadesActualizadas)
      setField("ciudad_id", nueva.id)
      setShowCiudadModal(false)
      setCiudadModalSeleccionada(null)
      setCiudadModalRegion(null)
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { errors?: Record<string, string[]>; message?: string; mensaje?: string } }
      }
      toast.error(axiosErr.response?.data?.message || axiosErr.response?.data?.mensaje || "Error al crear la ciudad")
    } finally {
      setSavingCiudad(false)
    }
  }

  const submit = async () => {
    if (!isStepValid(1) || !isStepValid(2) || !isStepValid(3)) {
      toast.error("Revisa los campos obligatorios antes de guardar")
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        fecha_fin: modoDias === "unico" ? form.fecha_inicio : form.fecha_fin,
        ciudad_id: form.modalidad === "virtual" ? null : form.ciudad_id,
        docente_id: form.docente_id || null,
      }
      if (editing && id) await cursosPersonalizadosService.actualizar(id, payload)
      else await cursosPersonalizadosService.crear(payload)
      toast.success(editing ? "Curso personalizado actualizado" : "Curso personalizado creado")
      navigate("/cursos-personalizados")
    } catch (error) {
      const data = (error as { response?: { data?: { errors?: Record<string, string[]>; message?: string; mensaje?: string } } })
        .response?.data
      const apiErrors = data?.errors || {}
      setErrors(Object.fromEntries(Object.entries(apiErrors).map(([key, value]) => [key, value[0]])))
      const firstValidationError = Object.values(apiErrors)[0]?.[0]
      toast.error(data?.mensaje || data?.message || firstValidationError || "No se pudo guardar el curso")
    } finally {
      setSaving(false)
    }
  }

  const filteredTeachers = teachers.filter((t) =>
    `${t.nombres} ${t.apellidos} ${t.email || ""}`.toLowerCase().includes(teacherSearch.toLowerCase())
  )

  const selectedTeacher = teachers.find((t) => t.id === form.docente_id)
  const currentStepIsValid = isStepValid(currentStep)
  const numCupos = Number(form.capacidad) || 1
  const precioNum = Number(form.precio_total) || 0
  const totalEsperadoCalculado = (numCupos * precioNum).toFixed(2)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="text-center p-8">
          <HugeiconsIcon icon={Loading02Icon} size={36} className="animate-spin text-[#fd761a] mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">Cargando curso personalizado...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      <div className="w-full max-w-[1040px] mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {/* ================= TOP CONTEXT BAR ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => navigate("/cursos-personalizados")}
              type="button"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#fd761a] transition-colors w-fit"
            >
              <ArrowLeft size={16} />
              <span>Volver a cursos personalizados</span>
            </button>
            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {editing ? "Editar Curso Personalizado" : "Nuevo Curso Personalizado"}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-[#fd761a] text-xs font-bold uppercase tracking-wider">
                {editing ? "Edición" : "Configuración"}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Paso <span className="font-bold text-slate-900">{currentStep}</span> de 3 ·{" "}
              <span className="text-[#fd761a] font-semibold">{STEP_META[currentStep - 1].title}</span>
            </p>
          </div>

          <button
            onClick={() => navigate("/cursos-personalizados")}
            type="button"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs transition-colors self-start sm:self-center"
          >
            Cancelar
          </button>
        </div>

        {/* ================= 3-STEP INTEGRAL STEPPER ================= */}
        <div className="w-full bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="relative flex items-center justify-between w-full">
            {/* Connecting Track */}
            <div className="absolute left-8 right-8 top-5 h-0.5 bg-slate-200 -z-0" />
            <div
              className="absolute left-8 top-5 h-0.5 bg-[#fd761a] transition-all duration-300 -z-0"
              style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
            />

            {STEP_META.map((meta) => {
              const isCurrent = currentStep === meta.step
              const isPassed = currentStep > meta.step
              const isValid = isStepValid(meta.step)

              return (
                <button
                  key={meta.step}
                  type="button"
                  onClick={() => handleGoToStep(meta.step)}
                  className="relative z-10 flex flex-col items-center gap-1.5 group focus:outline-none"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 ${
                      isCurrent
                        ? "bg-[#fd761a] text-white shadow-md ring-4 ring-orange-100 scale-105"
                        : isPassed
                          ? "bg-[#fd761a] text-white shadow-sm"
                          : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                    }`}
                  >
                    {isPassed ? <Check size={18} strokeWidth={2.8} /> : meta.step}
                  </div>
                  <span
                    className={`text-xs sm:text-sm font-semibold text-center transition-colors ${
                      isCurrent ? "text-slate-900 font-bold" : isPassed ? "text-slate-700" : "text-slate-400"
                    }`}
                  >
                    {meta.title}
                  </span>
                  <span
                    className={`hidden sm:inline text-[11px] font-medium transition-colors ${
                      isCurrent
                        ? "text-[#fd761a] font-semibold"
                        : isPassed && isValid
                          ? "text-emerald-600"
                          : "text-slate-400"
                    }`}
                  >
                    {meta.subtitle}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ================= MAIN INTERACTIVE STAGE ================= */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 min-h-[480px]">
          {/* ================= PASO 1: INFORMACIÓN & DOCENTE ================= */}
          {currentStep === 1 && (
            <section className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-slate-900">Información del curso personalizado</h2>
                <p className="text-sm text-slate-500">Nombre, descripción y asignación del docente responsable.</p>
              </div>

              <div className="flex flex-col gap-5">
                {/* Nombre */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-800 flex items-center justify-between">
                    <span>
                      Nombre del curso <span className="text-[#fd761a]">*</span>
                    </span>
                    <span className="text-xs font-normal text-slate-400">Identificador para matrícula</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Asesoría Vocal & Oratoria Ejecutiva Personalizada"
                    value={form.nombre}
                    onChange={(e) => setField("nombre", e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 border text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none transition-all ${
                      errors.nombre ? "border-red-400 bg-red-50/20" : "border-slate-200"
                    }`}
                  />
                  {errors.nombre && <p className="text-xs text-red-500 mt-0.5">{errors.nombre}</p>}
                </div>

                {/* Descripción */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-800 flex items-center justify-between">
                    <span>Descripción</span>
                    <span className="text-xs font-normal text-slate-400">Opcional</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Objetivos específicos del curso personalizado..."
                    value={form.descripcion || ""}
                    onChange={(e) => setField("descripcion", e.target.value)}
                    className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none resize-none transition-all"
                  />
                </div>

                {/* Docente (Opcional) */}
                <div className="flex flex-col gap-4 pt-4 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">Docente asignado</h3>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold uppercase tracking-wider">
                          Opcional
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">Selecciona el docente para este curso (puedes asignarlo después).</p>
                    </div>

                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3 top-2.5 text-slate-400 size-4 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Buscar docente..."
                        value={teacherSearch}
                        onChange={(e) => setTeacherSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Teachers Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredTeachers.map((t) => {
                      const isSelected = form.docente_id === t.id
                      const initials = `${t.nombres.charAt(0)}${t.apellidos.charAt(0)}`.toUpperCase()

                      return (
                        <div
                          key={t.id}
                          onClick={() => setField("docente_id", isSelected ? null : t.id)}
                          className={`p-4 rounded-xl cursor-pointer shadow-xs flex flex-col justify-between gap-2.5 transition-all duration-150 ${
                            isSelected
                              ? "bg-orange-50/60 border-2 border-[#fd761a] shadow-sm ring-2 ring-orange-100/50"
                              : "bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/80"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-10 h-10 rounded-full font-bold flex items-center justify-center text-sm shrink-0 transition-colors ${
                                  isSelected ? "bg-[#fd761a] text-white" : "bg-slate-800 text-white"
                                }`}
                              >
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                  {t.nombres} {t.apellidos}
                                </h4>
                                <span className="text-[11px] text-slate-400 block truncate">
                                  {t.email || "Docente registrado"}
                                </span>
                              </div>
                            </div>

                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                isSelected ? "bg-[#fd761a] text-white" : "border border-slate-300 text-transparent"
                              }`}
                            >
                              <Check size={14} strokeWidth={3} />
                            </div>
                          </div>

                          {isSelected && (
                            <div className="pt-2 text-[11px] text-slate-500 border-t border-orange-100 flex items-center justify-between">
                              <span className="font-semibold text-orange-800">Docente asignado</span>
                              <span className="text-slate-400 hover:text-red-500">Clic para desmarcar</span>
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {filteredTeachers.length === 0 && (
                      <div className="col-span-full py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-xs text-slate-500">No hay docentes disponibles</p>
                      </div>
                    )}
                  </div>

                  {selectedTeacher && (
                    <div className="p-3 bg-orange-50/40 rounded-xl border border-orange-100 flex items-center justify-between text-xs text-slate-700">
                      <span>
                        Docente seleccionado: <strong>{selectedTeacher.nombres} {selectedTeacher.apellidos}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setField("docente_id", null)}
                        className="text-xs font-semibold text-[#fd761a] hover:underline"
                      >
                        Quitar asignación
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ================= PASO 2: FECHAS & HORARIOS ================= */}
          {currentStep === 2 && (
            <section className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-slate-900">Fechas &amp; Horarios</h2>
                <p className="text-sm text-slate-500">
                  {modoDias === "unico" ? "Fecha y horario de una sesión." : "Rango de fechas y horario para varias sesiones."}
                </p>
              </div>

              <div className="flex flex-col gap-5">
                {/* Date Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-800">
                      {modoDias === "unico" ? "Fecha de la sesión" : "Fecha de inicio"} <span className="text-[#fd761a]">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-3 text-slate-400 size-4 pointer-events-none" />
                      <input
                        type="date"
                        value={form.fecha_inicio}
                        onChange={(e) => {
                          const value = e.target.value
                          setField("fecha_inicio", value)
                          if (modoDias === "unico") {
                            const weekday = getWeekdayFromDate(value)
                            if (weekday) setField("dias_semana", [weekday])
                          }
                        }}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none transition-all ${
                          errors.fecha_inicio ? "border-red-400 bg-red-50/20" : "border-slate-200"
                        }`}
                      />
                    </div>
                    {errors.fecha_inicio && <p className="text-xs text-red-500 mt-0.5">{errors.fecha_inicio}</p>}
                  </div>

                  {modoDias === "multiple" && <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-800">
                      Fecha de fin <span className="text-[#fd761a]">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-3 text-slate-400 size-4 pointer-events-none" />
                      <input
                        type="date"
                        min={form.fecha_inicio || undefined}
                        value={form.fecha_fin}
                        onChange={(e) => setField("fecha_fin", e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none transition-all ${
                          errors.fecha_fin ? "border-red-400 bg-red-50/20" : "border-slate-200"
                        }`}
                      />
                    </div>
                    {errors.fecha_fin && <p className="text-xs text-red-500 mt-0.5">{errors.fecha_fin}</p>}
                  </div>}
                </div>

                {/* Time Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-800">
                      Hora de inicio <span className="text-[#fd761a]">*</span>
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3.5 top-3 text-slate-400 size-4 pointer-events-none" />
                      <input
                        type="time"
                        value={form.hora_inicio}
                        onChange={(e) => setField("hora_inicio", e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none transition-all ${
                          errors.hora_inicio ? "border-red-400 bg-red-50/20" : "border-slate-200"
                        }`}
                      />
                    </div>
                    {errors.hora_inicio && <p className="text-xs text-red-500 mt-0.5">{errors.hora_inicio}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-800">
                      Hora de fin <span className="text-[#fd761a]">*</span>
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3.5 top-3 text-slate-400 size-4 pointer-events-none" />
                      <input
                        type="time"
                        value={form.hora_fin}
                        onChange={(e) => setField("hora_fin", e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none transition-all ${
                          errors.hora_fin ? "border-red-400 bg-red-50/20" : "border-slate-200"
                        }`}
                      />
                    </div>
                    {errors.hora_fin && <p className="text-xs text-red-500 mt-0.5">{errors.hora_fin}</p>}
                  </div>
                </div>

                {/* Una sesión o varias sesiones semanales */}
                <div className="flex flex-col gap-2 pt-1">
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                    {([
                      ["unico", "Una sesión"],
                      ["multiple", "Varias sesiones"],
                    ] as const).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setModoDias(value)
                          if (value === "unico") {
                            const weekday = getWeekdayFromDate(form.fecha_inicio)
                            if (weekday) setField("dias_semana", [weekday])
                          }
                        }}
                        className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                          modoDias === value ? "bg-white text-[#fd761a] shadow-sm" : "text-slate-500"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {modoDias === "multiple" && <>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-slate-800">
                        Días de clase <span className="text-[#fd761a]">*</span>
                      </label>
                      <span className="text-xs text-slate-400">Selecciona uno o varios días</span>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {[
                        [1, "Lun"], [2, "Mar"], [3, "Mié"], [4, "Jue"],
                        [5, "Vie"], [6, "Sáb"], [7, "Dom"],
                      ].map(([day, label]) => {
                        const value = day as number
                        const selected = form.dias_semana?.includes(value) ?? false
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setField(
                              "dias_semana",
                              selected
                                ? (form.dias_semana || []).filter((item) => item !== value)
                                : [...(form.dias_semana || []), value].sort()
                            )}
                            className={`py-2.5 rounded-xl border text-xs font-bold transition-colors ${
                              selected
                                ? "bg-[#fd761a] border-[#fd761a] text-white"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:border-orange-300"
                            }`}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                    {errors.dias_semana && <p className="text-xs text-red-500">{errors.dias_semana}</p>}
                  </>}
                </div>

                {/* Info Card */}
                {form.fecha_inicio && form.fecha_fin && form.hora_inicio && form.hora_fin && (
                  <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200 flex items-center justify-between text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-[#fd761a]" />
                      <span>
                        Vigencia: <strong>{form.fecha_inicio}</strong> al <strong>{form.fecha_fin}</strong> ·{" "}
                        <strong>{form.hora_inicio}</strong> a <strong>{form.hora_fin}</strong>
                      </span>
                    </div>
                    <span className="font-bold text-[#fd761a]">Horario configurado</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ================= PASO 3: CONFIGURACIÓN & PRECIOS ================= */}
          {currentStep === 3 && (
            <section className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-slate-900">Configuración &amp; Aranceles</h2>
                <p className="text-sm text-slate-500">Modalidad, sede física, aforo y arancel total.</p>
              </div>

              <div className="flex flex-col gap-5">
                {/* 2 Columns: Capacity & Pricing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Capacity */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-800 flex items-center justify-between">
                      <span>
                        Capacidad máxima <span className="text-[#fd761a]">*</span>
                      </span>
                      <span className="text-xs font-normal text-slate-400">Cupos de inscripción</span>
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3.5 top-3 text-slate-400 size-4 pointer-events-none" />
                      <input
                        type="number"
                        min={1}
                        value={form.capacidad}
                        onChange={(e) => setField("capacidad", Number(e.target.value))}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border text-slate-900 text-base font-bold focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none transition-all ${
                          errors.capacidad ? "border-red-400 bg-red-50/20" : "border-slate-200"
                        }`}
                      />
                    </div>
                    {errors.capacidad && <p className="text-xs text-red-500 mt-0.5">{errors.capacidad}</p>}
                  </div>

                  {/* Pricing */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-800 flex items-center justify-between">
                      <span>
                        Precio total del curso ($ USD) <span className="text-[#fd761a]">*</span>
                      </span>
                      <span className="text-xs font-semibold text-[#fd761a]">Arancel completo</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3.5 top-3 text-slate-400 size-4 pointer-events-none" />
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        value={form.precio_total}
                        onChange={(e) => setField("precio_total", Number(e.target.value))}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border text-slate-900 text-base font-bold focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none transition-all ${
                          errors.precio_total ? "border-red-400 bg-red-50/20" : "border-slate-200"
                        }`}
                      />
                    </div>
                    {errors.precio_total && <p className="text-xs text-red-500 mt-0.5">{errors.precio_total}</p>}

                    {/* Live Financial Projection */}
                    <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200/90 flex flex-col gap-2 text-xs mt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">
                          {precioNum === 0
                            ? "Curso sin costo de matrícula"
                            : `Cálculo: ${numCupos} ${numCupos === 1 ? "cupo" : "cupos"} × $${precioNum.toFixed(2)} USD`}
                        </span>
                        <span className="font-semibold text-slate-700">
                          {precioNum === 0 ? "Gratuito" : `$${precioNum.toFixed(2)} / participante`}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-orange-200/70 flex items-center justify-between">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <DollarSign size={15} className="text-[#fd761a]" />
                          Total esperado a recaudar (aforo completo):
                        </span>
                        <span className="text-sm font-bold text-[#fd761a]">
                          ${totalEsperadoCalculado} USD
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modality Segmented Selector & City Dropdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  {/* Modality */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-800">
                      Modalidad <span className="text-[#fd761a]">*</span>
                    </label>
                    <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setField("modalidad", "presencial")}
                        className={`py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                          form.modalidad === "presencial"
                            ? "bg-[#fd761a] text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Building2 size={18} />
                        <span>Presencial</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setField("modalidad", "virtual")}
                        className={`py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                          form.modalidad === "virtual"
                            ? "bg-[#fd761a] text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Monitor size={18} />
                        <span>Online / Virtual</span>
                      </button>
                    </div>
                  </div>

                  {/* Sede / Ciudad */}
                  {form.modalidad === "presencial" ? (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-slate-800">
                          Sede / Ciudad <span className="text-[#fd761a]">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCiudadModal(true)
                            setCiudadModalSeleccionada(null)
                            setCiudadModalRegion(null)
                          }}
                          className="text-xs text-[#fd761a] font-bold hover:underline flex items-center gap-1"
                        >
                          <Plus size={14} /> Nueva sede
                        </button>
                      </div>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3 text-slate-400 size-4 pointer-events-none" />
                        <select
                          value={form.ciudad_id || ""}
                          onChange={(e) => setField("ciudad_id", e.target.value ? Number(e.target.value) : null)}
                          className={`w-full pl-10 pr-8 py-2.5 rounded-xl bg-slate-50 border text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none transition-all cursor-pointer ${
                            errors.ciudad_id ? "border-red-400 bg-red-50/20" : "border-slate-200"
                          }`}
                        >
                          <option value="">Seleccionar ciudad...</option>
                          {cities.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.ciudad_id && <p className="text-xs text-red-500 mt-0.5">{errors.ciudad_id}</p>}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-slate-800">Campus Virtual</label>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                        <Monitor size={16} className="text-[#fd761a]" />
                        <span>Impartición remota a través del aula virtual institucional.</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Completion Badge */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between mt-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck size={20} className="text-[#fd761a]" />
                    <span className="text-xs sm:text-sm font-medium text-slate-700">
                      Parámetros completos y listos para guardar.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-slate-600">
                      {numCupos} {numCupos === 1 ? "cupo" : "cupos"}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-600">
                      Arancel: ${precioNum.toFixed(2)} USD
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs sm:text-sm font-bold text-[#fd761a]">
                      Total proyectado: ${totalEsperadoCalculado} USD
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* ================= ACTION BAR (BOTTOM NAVIGATION) ================= */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
          {/* Back Button */}
          <div>
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={handlePrevStep}
              className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all ${
                currentStep === 1
                  ? "bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer active:scale-95"
              }`}
            >
              <ChevronLeft size={18} />
              <span>Anterior</span>
            </button>
          </div>

          {/* Center: Helper notice */}
          <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
            {!currentStepIsValid && (
              <span className="text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1">
                <Info size={13} />
                Completa los campos obligatorios para continuar
              </span>
            )}
          </div>

          {/* Right: Next / Submit Button */}
          <div>
            {currentStep < 3 ? (
              <button
                type="button"
                disabled={!currentStepIsValid}
                onClick={handleNextStep}
                className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[44px] ${
                  !currentStepIsValid
                    ? "bg-slate-200 text-slate-400 opacity-60 cursor-not-allowed shadow-none"
                    : "bg-[#fd761a] hover:bg-[#e06512] text-white shadow-md active:scale-95 cursor-pointer ring-2 ring-orange-100"
                }`}
              >
                <span>{STEP_META[currentStep - 1].nextLabel}</span>
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                disabled={!currentStepIsValid || saving}
                onClick={() => {
                  void submit()
                }}
                className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[44px] ${
                  !currentStepIsValid || saving
                    ? "bg-slate-200 text-slate-400 opacity-60 cursor-not-allowed shadow-none"
                    : "bg-[#fd761a] hover:bg-[#e06512] text-white shadow-md active:scale-95 cursor-pointer ring-2 ring-orange-100"
                }`}
              >
                {saving && <HugeiconsIcon icon={Loading02Icon} size={16} className="animate-spin text-white" />}
                <span>{saving ? "Guardando..." : editing ? "Guardar Cambios" : "Finalizar y Crear Curso"}</span>
                {!saving && <Check size={18} strokeWidth={2.8} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= REGISTER NEW CITY MODAL ================= */}
      {showCiudadModal && (() => {
        const ciudadesRegistradas = new Set(cities.map((c) => c.nombre))
        const disponibles = ECUADOR_CIUDADES.filter((c) => !ciudadesRegistradas.has(c.nombre))
        const filtradas = ciudadModalRegion ? disponibles.filter((c) => c.region === ciudadModalRegion) : disponibles

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
            onClick={() => setShowCiudadModal(false)}
          >
            <div
              className="bg-white rounded-2xl border border-slate-100 w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl flex items-center justify-center bg-orange-50 text-[#fd761a]">
                    <HugeiconsIcon icon={MapPinIcon} size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Registrar nueva sede / ciudad</h3>
                    <p className="text-xs text-slate-500">Selecciona una ciudad ecuatoriana del catálogo</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCiudadModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={16} />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(80vh-130px)]">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <button
                    type="button"
                    onClick={() => setCiudadModalRegion(null)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                      !ciudadModalRegion
                        ? "bg-[#fd761a] text-white border-[#fd761a]"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Todas
                  </button>
                  {REGIONES.map((region) => (
                    <button
                      key={region}
                      type="button"
                      onClick={() => setCiudadModalRegion(region)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                        ciudadModalRegion === region
                          ? "bg-[#fd761a] text-white border-[#fd761a]"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[240px] overflow-y-auto">
                  {filtradas.map((ciudad) => {
                    const isSelected = ciudadModalSeleccionada === ciudad.nombre
                    return (
                      <button
                        key={ciudad.nombre}
                        type="button"
                        onClick={() => setCiudadModalSeleccionada(ciudad.nombre)}
                        className={`relative flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "bg-orange-50 border-[#fd761a] ring-2 ring-orange-100"
                            : "bg-slate-50/70 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <span className="text-xs font-bold text-slate-900">{ciudad.nombre}</span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                          style={{
                            backgroundColor: `color-mix(in srgb, ${regionColors[ciudad.region as Region] || "oklch(0.6 0.1 200)"} 15%, transparent)`,
                            color: regionColors[ciudad.region as Region] || "oklch(0.6 0.1 200)",
                          }}
                        >
                          {ciudad.region}
                        </span>
                        {isSelected && (
                          <div className="absolute top-2 right-2 size-4 rounded-full bg-[#fd761a] flex items-center justify-center">
                            <Check size={10} className="text-white" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    )
                  })}
                  {filtradas.length === 0 && (
                    <p className="col-span-full text-xs py-6 text-center text-slate-400">
                      No hay ciudades disponibles en esta región
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCiudadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => ciudadModalSeleccionada && handleCrearCiudad(ciudadModalSeleccionada)}
                  disabled={savingCiudad || !ciudadModalSeleccionada}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#fd761a] hover:bg-[#e06512] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingCiudad ? "Registrando..." : "Registrar sede"}
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
