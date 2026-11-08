import { useState, useEffect, useLayoutEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  Search,
  Calendar,
  CalendarDays,
  Clock,
  Users,
  DollarSign,
  Building2,
  Monitor,
  MapPin,
  Check,
  Info,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  Plus,
  AlertTriangle,
} from "lucide-react"
import { HugeiconsIcon } from "@hugeicons/react"
import { MapPinIcon, Cancel01Icon, Loading02Icon } from "@hugeicons/core-free-icons"
import { parseLocalDate } from "@/lib/utils"
import { scrollPageToTop } from "@/lib/scroll"
import { tallerService, type HorarioTaller, type SesionTaller } from "@/services/taller.service"
import { ciudadesService, type Ciudad } from "@/services/ciudades.service"
import { personasService } from "@/services/personas.service"
import { TallerSesionesCalendar, type SesionFormItem } from "./components/TallerSesionesCalendar"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { toast } from "sonner"

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

const DIAS_MAP = [
  { num: 1, short: "Lun", full: "Lunes" },
  { num: 2, short: "Mar", full: "Martes" },
  { num: 3, short: "Mié", full: "Miércoles" },
  { num: 4, short: "Jue", full: "Jueves" },
  { num: 5, short: "Vie", full: "Viernes" },
  { num: 6, short: "Sáb", full: "Sábado" },
  { num: 7, short: "Dom", full: "Domingo" },
]

const STEP_META = [
  { step: 1, title: "Información & Instructor", subtitle: "Datos generales", nextLabel: "Siguiente: Calendario" },
  { step: 2, title: "Calendario & Horarios", subtitle: "Fechas & Frecuencia", nextLabel: "Siguiente: Configuración" },
  { step: 3, title: "Configuración & Precios", subtitle: "Cupos & Aranceles", nextLabel: "Finalizar y Crear Taller" },
]

interface FormData {
  nombre: string
  descripcion: string
  instructor_id: string
  modalidad: string
  ciudad_id: number
  fecha: string
  fecha_fin: string
  hora_inicio: string
  hora_fin: string
  capacidad_maxima: string
  precio: string
  precio_matricula: string
}

interface HorarioForm {
  dia_semana: number
  hora_inicio: string
  hora_fin: string
  aula: string
}

const initialState: FormData = {
  nombre: "",
  descripcion: "",
  instructor_id: "",
  modalidad: "presencial",
  ciudad_id: 0,
  fecha: "",
  fecha_fin: "",
  hora_inicio: "",
  hora_fin: "",
  capacidad_maxima: "30",
  precio: "",
  precio_matricula: "",
}

interface Persona {
  id: string
  nombres: string
  apellidos: string
  email?: string
}

export function TallerFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [currentStep, setCurrentStep] = useState(1)
  const [form, setForm] = useState<FormData>(initialState)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [instructorQuery, setInstructorQuery] = useState("")
  const [instructores, setInstructores] = useState<Persona[]>([])
  const [searchingInstructor, setSearchingInstructor] = useState(false)
  const [instructorNombre, setInstructorNombre] = useState("")
  const [multiDia, setMultiDia] = useState(false)
  const [horarios, setHorarios] = useState<HorarioForm[]>([])
  const [diasSeleccionados, setDiasSeleccionados] = useState<number[]>([])
  const [ciudades, setCiudades] = useState<Ciudad[]>([])
  const [showCiudadModal, setShowCiudadModal] = useState(false)
  const [ciudadModalRegion, setCiudadModalRegion] = useState<Region | null>(null)
  const [ciudadModalSeleccionada, setCiudadModalSeleccionada] = useState<string | null>(null)
  const [savingCiudad, setSavingCiudad] = useState(false)
  const [mostrarPrecioMatricula, setMostrarPrecioMatricula] = useState(false)
  const [sesiones, setSesiones] = useState<SesionFormItem[]>([])
  const [showRegenerationConfirm, setShowRegenerationConfirm] = useState(false)

  // Al cambiar de paso, volver al inicio de la página
  useLayoutEffect(() => {
    scrollPageToTop("auto")
    const rafId = requestAnimationFrame(() => scrollPageToTop("auto"))
    const timeout = setTimeout(() => scrollPageToTop("auto"), 30)
    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(timeout)
    }
  }, [currentStep])

  // Cargar datos en modo edición
  useEffect(() => {
    if (!isEdit) return
    const cargar = async () => {
      setLoading(true)
      try {
        const taller = await tallerService.obtener(id!)
        setForm({
          nombre: taller.nombre || "",
          descripcion: taller.descripcion || "",
          instructor_id: taller.instructor_id || "",
          modalidad: taller.modalidad || "presencial",
          ciudad_id: Number(taller.ciudad_id) || 0,
          fecha: String(taller.fecha || "").split("T")[0],
          fecha_fin: String(taller.fecha_fin || "").split("T")[0],
          hora_inicio: taller.hora_inicio?.substring(0, 5) || "",
          hora_fin: taller.hora_fin?.substring(0, 5) || "",
          capacidad_maxima: String(taller.capacidad_maxima || "30"),
          precio: taller.precio != null ? String(taller.precio) : "",
          precio_matricula: taller.precio_matricula != null ? String(taller.precio_matricula) : "",
        })
        setMostrarPrecioMatricula(Number(taller.precio_matricula) > 0)
        if (taller.instructor) {
          setInstructorNombre(`${taller.instructor.nombres} ${taller.instructor.apellidos}`)
        }
        if (taller.fecha_fin) {
          setMultiDia(true)
          if (taller.horarios?.length) {
            setHorarios(
              taller.horarios.map((h: HorarioTaller) => ({
                dia_semana: h.dia_semana,
                hora_inicio: h.hora_inicio?.substring(0, 5) || "",
                hora_fin: h.hora_fin?.substring(0, 5) || "",
                aula: h.aula || "",
              }))
            )
            setDiasSeleccionados(taller.horarios.map((h: HorarioTaller) => h.dia_semana))
          }

          if (taller.sesiones && taller.sesiones.length > 0) {
            setSesiones(
              taller.sesiones.map((s: SesionTaller) => ({
                id: s.id,
                fecha_sesion: String(s.fecha_sesion).split("T")[0],
                hora_inicio: s.hora_inicio?.substring(0, 5) || "09:00",
                hora_fin: s.hora_fin?.substring(0, 5) || "12:00",
                aula: s.aula || "",
                tema: s.tema || "",
                observaciones: s.observaciones || "",
                hasAsistencia: taller.asistencias?.some(
                  (a: { fecha_sesion?: string }) => a.fecha_sesion && String(a.fecha_sesion).split("T")[0] === String(s.fecha_sesion).split("T")[0]
                ),
              }))
            )
          } else if (taller.horarios && taller.horarios.length > 0) {
            // Taller legacy sin sesiones guardadas: proyectar para que el usuario pueda revisarlas y guardarlas
            const fInicio = String(taller.fecha || "").split("T")[0]
            const fFin = String(taller.fecha_fin || "").split("T")[0]
            if (fInicio && fFin) {
              const start = parseLocalDate(fInicio)
              const end = parseLocalDate(fFin)
              if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
                const generadas: SesionFormItem[] = []
                const curr = new Date(start)
                while (curr.getTime() <= end.getTime()) {
                  const isoDay = curr.getDay() === 0 ? 7 : curr.getDay()
                  const matchingHorario = taller.horarios.find((h: HorarioTaller) => h.dia_semana === isoDay)
                  if (matchingHorario) {
                    const dateStr = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, "0")}-${String(curr.getDate()).padStart(2, "0")}`
                    generadas.push({
                      fecha_sesion: dateStr,
                      hora_inicio: matchingHorario.hora_inicio?.substring(0, 5) || "09:00",
                      hora_fin: matchingHorario.hora_fin?.substring(0, 5) || "12:00",
                      aula: matchingHorario.aula || "",
                    })
                  }
                  curr.setDate(curr.getDate() + 1)
                }
                setSesiones(generadas)
              }
            }
          }
        }
      } catch {
        toast.error("Error al cargar taller")
        navigate("/talleres")
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [id, isEdit, navigate])

  const buscarInstructores = async (q: string) => {
    setInstructorQuery(q)
    setSearchingInstructor(true)
    try {
      const params: Record<string, string | number> = { tipo: "instructor", per_page: 25 }
      if (q.trim()) params.buscar = q
      const res = await personasService.getPersonas(params)
      setInstructores(res.data)
    } catch {
      setInstructores([])
    } finally {
      setSearchingInstructor(false)
    }
  }

  // Cargar instructores y ciudades al montar
  useEffect(() => {
    buscarInstructores("")
    ciudadesService.getCiudadesTodas().then(setCiudades).catch(() => {})
  }, [])

  const recalcularSesionesPorDias = (
    dias: number[],
    fInicio?: string,
    fFin?: string,
    hInicio?: string,
    hFin?: string
  ) => {
    const startDateStr = fInicio || form.fecha
    const endDateStr = fFin || form.fecha_fin
    const horaIni = hInicio || form.hora_inicio || "09:00"
    let horaFin = hFin || form.hora_fin || "12:00"
    if (horaFin <= horaIni) {
      const [h, m] = horaIni.split(":").map(Number)
      const nextH = Math.min((isNaN(h) ? 9 : h) + 2, 23)
      horaFin = `${String(nextH).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}`
    }

    if (!startDateStr || !endDateStr) return
    const inicio = parseLocalDate(startDateStr)
    const fin = parseLocalDate(endDateStr)
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime()) || inicio > fin) return

    const generadas: SesionFormItem[] = []
    const curr = new Date(inicio)

    while (curr.getTime() <= fin.getTime()) {
      const isoDay = curr.getDay() === 0 ? 7 : curr.getDay()
      if (dias.includes(isoDay)) {
        const dateStr = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, "0")}-${String(curr.getDate()).padStart(2, "0")}`
        const prev = sesiones.find((s) => s.fecha_sesion === dateStr)
        const sInicio = prev?.hora_inicio || horaIni
        let sFin = prev?.hora_fin || horaFin
        if (sFin <= sInicio) {
          sFin = horaFin > sInicio ? horaFin : `${String(Math.min(parseInt(sInicio, 10) + 2, 23)).padStart(2, "0")}:00`
        }
        generadas.push({
          fecha_sesion: dateStr,
          hora_inicio: sInicio,
          hora_fin: sFin,
          aula: prev?.aula || "",
          hasAsistencia: prev?.hasAsistencia || false,
        })
      }
      curr.setDate(curr.getDate() + 1)
    }

    setSesiones(generadas)
  }

  const toggleDia = (dia: number) => {
    let nextDays: number[]
    if (diasSeleccionados.includes(dia)) {
      setHorarios((h) => h.filter((x) => x.dia_semana !== dia))
      nextDays = diasSeleccionados.filter((d) => d !== dia)
    } else {
      setHorarios((h) => [
        ...h,
        {
          dia_semana: dia,
          hora_inicio: form.hora_inicio || "09:00",
          hora_fin: form.hora_fin || "12:00",
          aula: "",
        },
      ])
      nextDays = [...diasSeleccionados, dia].sort()
    }
    setDiasSeleccionados(nextDays)
    recalcularSesionesPorDias(nextDays)
  }

  const selectWeekdays = () => {
    const days = [1, 2, 3, 4, 5]
    setDiasSeleccionados(days)
    setHorarios(
      days.map((dia) => ({
        dia_semana: dia,
        hora_inicio: form.hora_inicio || "09:00",
        hora_fin: form.hora_fin || "12:00",
        aula: "",
      }))
    )
    recalcularSesionesPorDias(days)
  }

  const selectWeekend = () => {
    const days = [6, 7]
    setDiasSeleccionados(days)
    setHorarios(
      days.map((dia) => ({
        dia_semana: dia,
        hora_inicio: form.hora_inicio || "09:00",
        hora_fin: form.hora_fin || "12:00",
        aula: "",
      }))
    )
    recalcularSesionesPorDias(days)
  }

  const resetDays = () => {
    setDiasSeleccionados([])
    setHorarios([])
    setSesiones([])
  }

  const seleccionarInstructor = (p: Persona) => {
    if (form.instructor_id === p.id) {
      // Desmarcar
      setForm((f) => ({ ...f, instructor_id: "" }))
      setInstructorNombre("")
    } else {
      setForm((f) => ({ ...f, instructor_id: p.id }))
      setInstructorNombre(`${p.nombres} ${p.apellidos}`)
    }
  }

  // Pure step validation to block Next button
  const isStepValid = (step: number): boolean => {
    if (step === 1) {
      return form.nombre.trim() !== ""
    }
    if (step === 2) {
      if (!form.fecha) return false
      if (!multiDia) {
        if (!form.hora_inicio || !form.hora_fin) return false
        if (form.hora_fin <= form.hora_inicio) return false
        return true
      }
      // Varios días
      if (!form.fecha_fin) return false
      if (parseLocalDate(form.fecha_fin) < parseLocalDate(form.fecha)) return false
      if (sesiones.length === 0) return false
      // Cada sesión debe tener hora_fin estrictamente mayor a hora_inicio
      const tieneHorarioInvalido = sesiones.some(
        (s) => !s.hora_inicio || !s.hora_fin || s.hora_fin <= s.hora_inicio
      )
      if (tieneHorarioInvalido) return false
      return true
    }
    if (step === 3) {
      if (!form.capacidad_maxima || parseInt(form.capacidad_maxima, 10) < 1) return false
      if (form.precio === "" || isNaN(Number(form.precio)) || Number(form.precio) < 0) return false
      if (form.precio_matricula !== "" && (isNaN(Number(form.precio_matricula)) || Number(form.precio_matricula) < 0)) return false
      if (form.modalidad === "presencial" && (!form.ciudad_id || form.ciudad_id <= 0)) return false
      return true
    }
    return false
  }

  const handleNextStep = () => {
    if (currentStep === 2) {
      if (!multiDia) {
        if (!form.fecha || !form.hora_inicio || !form.hora_fin) {
          toast.error("Por favor completa la fecha y horas del taller")
          return
        }
        if (form.hora_fin <= form.hora_inicio) {
          toast.error("La hora de finalización debe ser posterior a la de inicio")
          return
        }
      } else {
        if (!form.fecha || !form.fecha_fin) {
          toast.error("Por favor completa el rango de fechas del taller")
          return
        }
        if (sesiones.length === 0) {
          toast.error("Debes seleccionar al menos un día en el calendario para programar sesiones")
          return
        }
        const sesionInvalida = sesiones.find(
          (s) => !s.hora_inicio || !s.hora_fin || s.hora_fin <= s.hora_inicio
        )
        if (sesionInvalida) {
          toast.error(
            `La sesión del ${sesionInvalida.fecha_sesion} tiene un horario inválido (${sesionInvalida.hora_inicio} – ${sesionInvalida.hora_fin}). La hora de finalización debe ser posterior a la hora de inicio.`
          )
          return
        }
      }
    }

    if (!isStepValid(currentStep)) {
      toast.error("Por favor completa los campos obligatorios antes de continuar")
      return
    }
    setCurrentStep((prev) => Math.min(prev + 1, 3))
    scrollPageToTop("auto")
  }

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
    scrollPageToTop("auto")
  }

  const handleGoToStep = (targetStep: number) => {
    if (targetStep < currentStep) {
      setCurrentStep(targetStep)
      scrollPageToTop("auto")
      return
    }
    for (let s = 1; s < targetStep; s++) {
      if (!isStepValid(s)) {
        toast.info(`Completa el Paso ${s}: ${STEP_META[s - 1].title} para avanzar`)
        return
      }
    }
    setCurrentStep(targetStep)
    scrollPageToTop("auto")
  }

  const handleCrearCiudad = async (nombre: string) => {
    if (!nombre.trim()) return
    setSavingCiudad(true)
    try {
      const nueva = await ciudadesService.crearCiudad(nombre.trim())
      toast.success(`Ciudad "${nombre}" creada`)
      const ciudadesActualizadas = await ciudadesService.getCiudadesTodas()
      setCiudades(ciudadesActualizadas)
      setForm((f) => ({ ...f, ciudad_id: nueva.id }))
      setShowCiudadModal(false)
      setCiudadModalSeleccionada(null)
      setCiudadModalRegion(null)
    } catch (err) {
      const axiosErr = err as {
        response?: { data?: { errors?: Record<string, string[]>; message?: string; mensaje?: string } }
      }
      toast.error(axiosErr.response?.data?.message || axiosErr.response?.data?.mensaje || "Error al crear la ciudad")
    } finally {
      setSavingCiudad(false)
    }
  }

  const handleSubmit = async (e?: React.FormEvent, forceRegenerate = false) => {
    if (e) e.preventDefault()
    if (multiDia) {
      if (sesiones.length === 0) {
        toast.error("Debes seleccionar al menos un día en el calendario para programar sesiones")
        return
      }
      const sesionInvalida = sesiones.find(
        (s) => !s.hora_inicio || !s.hora_fin || s.hora_fin <= s.hora_inicio
      )
      if (sesionInvalida) {
        toast.error(
          `La sesión del ${sesionInvalida.fecha_sesion} tiene un horario inválido (${sesionInvalida.hora_inicio} – ${sesionInvalida.hora_fin}). La hora de finalización debe ser posterior a la de inicio.`
        )
        return
      }
    } else {
      if (form.hora_inicio && form.hora_fin && form.hora_fin <= form.hora_inicio) {
        toast.error("La hora de finalización debe ser posterior a la de inicio")
        return
      }
    }
    if (!isStepValid(1) || !isStepValid(2) || !isStepValid(3)) {
      toast.error("Revisa los campos obligatorios antes de guardar")
      return
    }
    setSaving(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || undefined,
        instructor_id: form.instructor_id || null,
        capacidad_maxima: parseInt(form.capacidad_maxima, 10),
        precio: parseFloat(form.precio),
        precio_matricula: form.precio_matricula !== "" ? parseFloat(form.precio_matricula) : 0,
        modalidad: form.modalidad,
        ciudad_id: form.modalidad === "virtual" ? undefined : form.ciudad_id || undefined,
        fecha: form.fecha,
      }

      if (!multiDia) {
        data.hora_inicio = form.hora_inicio
        data.hora_fin = form.hora_fin
        delete data.fecha_fin
      } else {
        data.fecha_fin = form.fecha_fin
        if (sesiones.length > 0) {
          data.sesiones = sesiones.map((s) => ({
            fecha_sesion: s.fecha_sesion,
            hora_inicio: s.hora_inicio,
            hora_fin: s.hora_fin,
            aula: s.aula || undefined,
            tema: s.tema || undefined,
            observaciones: s.observaciones || undefined,
          }))
          data.hora_inicio = sesiones[0].hora_inicio
          data.hora_fin = sesiones[0].hora_fin
        }
        if (horarios.length > 0) {
          data.horarios = horarios
        }
      }

      if (forceRegenerate) {
        data.confirmar_regeneracion_sesiones = true
      }

      if (isEdit) {
        await tallerService.actualizar(id!, data)
        toast.success("Taller actualizado exitosamente")
      } else {
        await tallerService.crear(data)
        toast.success("Taller creado exitosamente")
      }
      navigate("/talleres")
    } catch (err: unknown) {
      const axiosData = (err as { response?: { data?: { mensaje?: string; requiere_confirmacion_regeneracion?: boolean } } })?.response?.data
      if (axiosData?.requiere_confirmacion_regeneracion) {
        setShowRegenerationConfirm(true)
        return
      }
      const msg = axiosData?.mensaje || "Error al guardar el taller"
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const filteredInstructores = instructores.filter(
    (p) =>
      !instructorQuery.trim() ||
      `${p.nombres} ${p.apellidos} ${p.email || ""}`.toLowerCase().includes(instructorQuery.toLowerCase())
  )

  const currentStepIsValid = isStepValid(currentStep)
  const numCupos = parseInt(form.capacidad_maxima, 10) || 0
  const precioNum = parseFloat(form.precio) || 0
  const matriculaNum = parseFloat(form.precio_matricula) || 0
  const totalEsperadoCalculado = (numCupos * (precioNum + matriculaNum)).toFixed(2)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="text-center p-8">
          <HugeiconsIcon icon={Loading02Icon} size={36} className="animate-spin text-[#fd761a] mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">Cargando taller...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      <div className="w-full max-w-[1040px] mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {/* ================= TOP CONTEXT BAR & BREADCRUMB ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => navigate("/talleres")}
              type="button"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#fd761a] transition-colors w-fit"
            >
              <ArrowLeft size={14} />
              <span>Volver a talleres</span>
            </button>
            <div className="flex items-center gap-2.5 mt-0.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {isEdit ? "Editar Taller" : "Nuevo Taller"}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-[#fd761a] text-[11px] font-bold uppercase tracking-wider">
                {isEdit ? "Edición" : "Configuración"}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Paso <span className="font-bold text-slate-800">{currentStep}</span> de 3 ·{" "}
              <span className="text-[#fd761a] font-semibold">{STEP_META[currentStep - 1].title}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => navigate("/talleres")}
              type="button"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 h-9 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>

        {/* ================= 3-STEP INTEGRAL STEPPER ================= */}
        <div className="w-full bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="relative flex items-center justify-between w-full">
            {/* Connecting Line Background */}
            <div className="absolute left-8 right-8 top-5 h-0.5 bg-slate-200 -z-0" />
            {/* Dynamic Fill Progress Line */}
            <div
              className="absolute left-8 top-5 h-0.5 bg-[#fd761a] transition-all duration-300 -z-0"
              style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
            />

            {/* Stepper Triggers */}
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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 min-h-[500px]">
          {/* ================= PASO 1: INFORMACIÓN & INSTRUCTOR ================= */}
          {currentStep === 1 && (
            <section className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Información del taller</h2>
                <p className="text-xs text-slate-500">
                  Ingresa el nombre, una descripción detallada y asigna al instructor encargado.
                </p>
              </div>

              <div className="flex flex-col gap-5">
                {/* Nombre del taller */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>
                      Nombre del taller <span className="text-[#fd761a]">*</span>
                    </span>
                    <span className="text-xs font-normal text-slate-400">Título visible para inscripción</span>
                  </label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                    placeholder="Ej: Taller Práctico de Fotografía & Iluminación Digital"
                    className="w-full px-4 h-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* Descripción */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                    <span>Descripción y objetivos del taller</span>
                    <span className="text-xs font-normal text-slate-400">Opcional</span>
                  </label>
                  <textarea
                    rows={3}
                    value={form.descripcion}
                    onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                    placeholder="Describe los temas a tratar, requisitos previos o el material que los estudiantes deben llevar..."
                    className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none resize-none transition-all"
                  />
                </div>

                {/* Instructor Section */}
                <div className="flex flex-col gap-4 pt-4 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900">Instructor responsable</h3>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold uppercase tracking-wider">
                          Opcional
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Selecciona el instructor que dictará el taller. Puedes dejarlo sin asignar y agregarlo luego.
                      </p>
                    </div>

                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Buscar por nombre o correo..."
                        value={instructorQuery}
                        onChange={(e) => {
                          setInstructorQuery(e.target.value)
                          buscarInstructores(e.target.value)
                        }}
                        className="w-full pl-9 pr-3 h-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Instructor Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {searchingInstructor ? (
                      <div className="col-span-full py-8 text-center text-slate-400">
                        <HugeiconsIcon icon={Loading02Icon} size={24} className="animate-spin text-[#fd761a] mx-auto mb-2" />
                        <p className="text-xs">Buscando instructores...</p>
                      </div>
                    ) : (
                      filteredInstructores.map((p) => {
                        const isSelected = form.instructor_id === p.id
                        const initials = `${p.nombres.charAt(0)}${p.apellidos.charAt(0)}`.toUpperCase()

                        return (
                          <div
                            key={p.id}
                            onClick={() => seleccionarInstructor(p)}
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
                                    {p.nombres} {p.apellidos}
                                  </h4>
                                  <span className="text-[11px] text-slate-400 block truncate">
                                    {p.email || "Instructor Registrado"}
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
                                <span className="font-semibold text-orange-800">Instructor asignado</span>
                                <span className="text-slate-400 hover:text-red-500">Clic para desmarcar</span>
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}

                    {!searchingInstructor && filteredInstructores.length === 0 && (
                      <div className="col-span-full py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-xs text-slate-500">No se encontraron instructores disponibles</p>
                      </div>
                    )}
                  </div>

                  {form.instructor_id && instructorNombre && (
                    <div className="p-3 bg-orange-50/40 rounded-xl border border-orange-100 flex items-center justify-between text-xs text-slate-700">
                      <span>
                        Instructor seleccionado: <strong>{instructorNombre}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setForm((f) => ({ ...f, instructor_id: "" }))
                          setInstructorNombre("")
                        }}
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

          {/* ================= PASO 2: CALENDARIO & HORARIOS ================= */}
          {currentStep === 2 && (
            <section className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Calendario &amp; Horarios</h2>
                <p className="text-xs text-slate-500">
                  Define si el taller se realizará en una sola fecha o distribuido en varios días.
                </p>
              </div>

              {/* Mode Selector: Single Day vs Multi Day */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setMultiDia(false)
                    setForm((f) => ({ ...f, fecha_fin: "" }))
                    setHorarios([])
                    setDiasSeleccionados([])
                  }}
                  className={`p-3.5 rounded-xl flex items-center gap-3 transition-all ${
                    !multiDia
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200 font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      !multiDia ? "bg-[#fd761a] text-white" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    <Calendar size={18} />
                  </div>
                  <div className="text-left">
                    <span className="block text-sm">Jornada Única (1 Día)</span>
                    <span className="block text-xs font-normal text-slate-400">Masterclass o taller intensivo</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMultiDia(true)}
                  className={`p-3.5 rounded-xl flex items-center gap-3 transition-all ${
                    multiDia
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200 font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      multiDia ? "bg-[#fd761a] text-white" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    <CalendarDays size={18} />
                  </div>
                  <div className="text-left">
                    <span className="block text-sm">Varios Días (Ciclo / Frecuencia)</span>
                    <span className="block text-xs font-normal text-slate-400">Varias sesiones programadas</span>
                  </div>
                </button>
              </div>

              {/* Single Day Layout */}
              {!multiDia ? (
                <div className="flex flex-col gap-5 pt-2">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Fecha del taller <span className="text-[#fd761a]">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4 pointer-events-none" />
                      <input
                        type="date"
                        value={form.fecha}
                        onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                        className="w-full pl-10 pr-4 h-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Hora de inicio <span className="text-[#fd761a]">*</span>
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4 pointer-events-none" />
                        <input
                          type="time"
                          value={form.hora_inicio}
                          onChange={(e) => setForm((f) => ({ ...f, hora_inicio: e.target.value }))}
                          className="w-full pl-10 pr-4 h-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Hora de finalización <span className="text-[#fd761a]">*</span>
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4 pointer-events-none" />
                        <input
                          type="time"
                          value={form.hora_fin}
                          onChange={(e) => setForm((f) => ({ ...f, hora_fin: e.target.value }))}
                          className="w-full pl-10 pr-4 h-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {form.fecha && form.hora_inicio && form.hora_fin && form.hora_fin <= form.hora_inicio && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700 font-semibold">
                      <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                      <span>La hora de finalización ({form.hora_fin}) debe ser posterior a la de inicio ({form.hora_inicio}).</span>
                    </div>
                  )}

                  {form.fecha && form.hora_inicio && form.hora_fin && form.hora_fin > form.hora_inicio && (
                    <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200 flex items-center justify-between text-xs text-slate-700">
                      <div className="flex items-center gap-2">
                        <Check size={16} className="text-[#fd761a]" />
                        <span>
                          Taller programado para el <strong>{form.fecha}</strong> de <strong>{form.hora_inicio}</strong> a{" "}
                          <strong>{form.hora_fin}</strong>
                        </span>
                      </div>
                      <span className="font-bold text-[#fd761a]">Jornada única lista</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Multi Day Layout */
                <div className="flex flex-col gap-5 pt-2">
                  {/* Date Range & Base Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Fecha de inicio <span className="text-[#fd761a]">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4 pointer-events-none" />
                        <input
                          type="date"
                          value={form.fecha}
                          onChange={(e) => {
                            const val = e.target.value
                            setForm((f) => ({ ...f, fecha: val }))
                            if (diasSeleccionados.length > 0) {
                              recalcularSesionesPorDias(diasSeleccionados, val, form.fecha_fin)
                            }
                          }}
                          className="w-full pl-10 pr-4 h-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Fecha de fin <span className="text-[#fd761a]">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4 pointer-events-none" />
                        <input
                          type="date"
                          value={form.fecha_fin}
                          min={form.fecha || undefined}
                          onChange={(e) => {
                            const val = e.target.value
                            setForm((f) => ({ ...f, fecha_fin: val }))
                            if (diasSeleccionados.length > 0) {
                              recalcularSesionesPorDias(diasSeleccionados, form.fecha, val)
                            }
                          }}
                          className="w-full pl-10 pr-4 h-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Horario base por defecto */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Hora de inicio general
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4 pointer-events-none" />
                        <input
                          type="time"
                          value={form.hora_inicio}
                          onChange={(e) => {
                            const val = e.target.value
                            setForm((f) => ({ ...f, hora_inicio: val }))
                            if (diasSeleccionados.length > 0) {
                              recalcularSesionesPorDias(diasSeleccionados, form.fecha, form.fecha_fin, val, form.hora_fin)
                            }
                          }}
                          className="w-full pl-10 pr-4 h-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Hora de finalización general
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4 pointer-events-none" />
                        <input
                          type="time"
                          value={form.hora_fin}
                          onChange={(e) => {
                            const val = e.target.value
                            setForm((f) => ({ ...f, hora_fin: val }))
                            if (diasSeleccionados.length > 0) {
                              recalcularSesionesPorDias(diasSeleccionados, form.fecha, form.fecha_fin, form.hora_inicio, val)
                            }
                          }}
                          className="w-full pl-10 pr-4 h-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {form.hora_inicio && form.hora_fin && form.hora_fin <= form.hora_inicio && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-700 font-semibold">
                      <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                      <span>La hora de finalización general ({form.hora_fin}) debe ser posterior a la de inicio ({form.hora_inicio}).</span>
                    </div>
                  )}

                  {/* Day shortcuts & chips */}
                  <div className="flex flex-col gap-3 pt-1">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-[#fd761a]" />
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                          Atajos de recurrencia:
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={selectWeekdays}
                          className="h-8 px-3 rounded-lg bg-white hover:bg-orange-50 hover:text-[#fd761a] hover:border-orange-200 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs transition-all flex items-center justify-center"
                        >
                          Lun – Vie (Laborables)
                        </button>
                        <button
                          type="button"
                          onClick={selectWeekend}
                          className="h-8 px-3 rounded-lg bg-white hover:bg-orange-50 hover:text-[#fd761a] hover:border-orange-200 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs transition-all flex items-center justify-center"
                        >
                          Sáb – Dom (Fines de semana)
                        </button>
                        <button
                          type="button"
                          onClick={resetDays}
                          className="h-8 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-500 text-xs font-semibold border border-slate-200 transition-all flex items-center justify-center"
                        >
                          Limpiar selección
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                      {DIAS_MAP.map((dia) => {
                        const isActive = diasSeleccionados.includes(dia.num)

                        return (
                          <button
                            key={dia.num}
                            type="button"
                            onClick={() => toggleDia(dia.num)}
                            className={`p-3.5 rounded-2xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all duration-150 ${
                              isActive
                                ? "bg-orange-50/70 border-2 border-[#fd761a] text-slate-900 shadow-sm ring-2 ring-orange-100/60"
                                : "bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                                isActive ? "bg-[#fd761a] text-white" : "border border-slate-300 text-transparent"
                              }`}
                            >
                              <Check size={12} strokeWidth={3} />
                            </span>
                            <span className="text-base font-bold">{dia.short}</span>
                            <span className={`text-[11px] font-medium ${isActive ? "text-[#fd761a] font-bold" : "text-slate-400"}`}>
                              {dia.full}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* CALENDARIO INTERACTIVO DE SESIONES */}
                  <div className="pt-2">
                    <TallerSesionesCalendar
                      fechaInicioTaller={form.fecha}
                      fechaFinTaller={form.fecha_fin}
                      horaInicioDefault={form.hora_inicio || "09:00"}
                      horaFinDefault={form.hora_fin || "12:00"}
                      diasSemana={diasSeleccionados}
                      sesiones={sesiones}
                      onChangeSesiones={setSesiones}
                    />
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ================= PASO 3: CONFIGURACIÓN & PRECIOS ================= */}
          {currentStep === 3 && (
            <section className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Configuración &amp; Aranceles</h2>
                <p className="text-xs text-slate-500">
                  Establece el aforo de participantes, arancel de inscripción, modalidad y sede física.
                </p>
              </div>

              <div className="flex flex-col gap-5">
                {/* 2 Columns: Capacity & Modality */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Capacity */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                      <span>
                        Capacidad máxima <span className="text-[#fd761a]">*</span>
                      </span>
                      <span className="text-xs font-normal text-slate-400">Cupos de inscripción</span>
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4 pointer-events-none" />
                      <input
                        type="number"
                        min={1}
                        value={form.capacidad_maxima}
                        onChange={(e) => setForm((f) => ({ ...f, capacidad_maxima: e.target.value }))}
                        className="w-full pl-10 pr-4 h-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Límite de asistentes que el taller admitirá en su lista de confirmados.
                    </span>
                  </div>

                  {/* Modality */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Modalidad de impartición <span className="text-[#fd761a]">*</span>
                    </label>
                    <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200 h-11 items-center">
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, modalidad: "presencial" }))}
                        className={`h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          form.modalidad === "presencial"
                            ? "bg-[#fd761a] text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Building2 size={16} />
                        <span>Presencial</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, modalidad: "virtual" }))}
                        className={`h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          form.modalidad === "virtual"
                            ? "bg-[#fd761a] text-white shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Monitor size={16} />
                        <span>Online / Virtual</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sede / Ciudad (si es presencial) */}
                {form.modalidad === "presencial" ? (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700">
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
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4 pointer-events-none" />
                      <select
                        value={form.ciudad_id}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            ciudad_id: e.target.value ? parseInt(e.target.value, 10) : 0,
                          }))
                        }
                        className="w-full pl-10 pr-8 h-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none transition-all cursor-pointer"
                      >
                        <option value="0">Seleccionar sede / ciudad...</option>
                        {ciudades.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700">Campus Virtual</label>
                    <div className="h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                      <Monitor size={16} className="text-[#fd761a]" />
                      <span>Impartición remota mediante enlace de videoconferencia (Zoom / Meet).</span>
                    </div>
                  </div>
                )}

                {/* Sección de Precios y Aranceles */}
                <div className="pt-3 border-t border-slate-100 flex flex-col gap-4">
                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Aranceles &amp; Precios del Taller
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Configura el costo por participante y opcionalmente una cuota de inscripción o matrícula.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pricing */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                        <span>
                          Precio por participante ($ USD) <span className="text-[#fd761a]">*</span>
                        </span>
                        <span className="text-xs font-semibold text-[#fd761a]">Arancel taller</span>
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4 pointer-events-none" />
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="0.00"
                          value={form.precio}
                          onChange={(e) => setForm((f) => ({ ...f, precio: e.target.value }))}
                          className="w-full pl-10 pr-4 h-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      {/* Live Financial Projection */}
                      <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200/90 flex flex-col gap-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">
                            {precioNum === 0
                              ? "Taller de acceso gratuito"
                              : `Cálculo: ${numCupos} cupos × $${precioNum.toFixed(2)} USD`}
                          </span>
                          <span className="font-semibold text-slate-700">
                            {precioNum === 0 ? "Gratuito" : `$${(numCupos * precioNum).toFixed(2)} USD`}
                          </span>
                        </div>
                        {matriculaNum > 0 && (
                          <div className="flex items-center justify-between text-blue-700">
                            <span className="text-slate-600">
                              Inscripción: {numCupos} cupos × ${matriculaNum.toFixed(2)} USD
                            </span>
                            <span className="font-semibold text-blue-700">
                              +${(numCupos * matriculaNum).toFixed(2)} USD
                            </span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-orange-200/70 flex items-center justify-between">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <DollarSign size={14} className="text-[#fd761a]" />
                            Total esperado a recaudar:
                          </span>
                          <span className="text-xs font-bold text-[#fd761a]">
                            ${totalEsperadoCalculado} USD
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Registration Fee (Precio de inscripción / matrícula) */}
                    {!(mostrarPrecioMatricula || Number(form.precio_matricula) > 0) ? (
                      <button
                        type="button"
                        onClick={() => setMostrarPrecioMatricula(true)}
                        aria-expanded={false}
                        aria-controls="precio-matricula-panel"
                        className="group flex h-full min-h-[140px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-5 text-center transition-colors hover:border-[#fd761a] hover:bg-orange-50/40 focus:outline-none focus:ring-2 focus:ring-[#fd761a] focus:ring-offset-1"
                      >
                        <span className="flex size-8 items-center justify-center rounded-full bg-white text-slate-400 ring-1 ring-slate-200 transition-colors group-hover:text-[#fd761a] group-hover:ring-[#fd761a]/40">
                          <Plus className="size-4" />
                        </span>
                        <span className="text-xs font-semibold text-slate-700 group-hover:text-[#fd761a]">
                          {Number(form.precio_matricula) > 0
                            ? `Cuota de inscripción: $${Number(form.precio_matricula).toFixed(2)} USD · Editar`
                            : "Agregar precio de inscripción / matrícula"}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {Number(form.precio_matricula) > 0 ? "Por participante" : "Opcional · por participante"}
                        </span>
                      </button>
                    ) : (
                      <div
                        id="precio-matricula-panel"
                        className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200"
                      >
                        <label className="text-xs font-semibold text-slate-700 flex items-center justify-between gap-2">
                          <span>Precio de inscripción / matrícula ($ USD)</span>
                          <span className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-blue-600">Por participante</span>
                            <button
                              type="button"
                              onClick={() => {
                                setMostrarPrecioMatricula(false)
                                setForm((f) => ({ ...f, precio_matricula: "" }))
                              }}
                              aria-expanded={true}
                              aria-controls="precio-matricula-panel"
                              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            >
                              <ChevronUp className="size-3" />
                              Ocultar
                            </button>
                          </span>
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-4 pointer-events-none" />
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="0.00"
                            value={form.precio_matricula}
                            onChange={(e) => setForm((f) => ({ ...f, precio_matricula: e.target.value }))}
                            className="w-full pl-10 pr-4 h-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none transition-all"
                          />
                        </div>

                        {/* Registration Fee Summary */}
                        <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between text-xs">
                          <span className="text-slate-700">Matrícula por participante:</span>
                          <span className="font-bold text-blue-700">
                            ${Number(form.precio_matricula) > 0 ? Number(form.precio_matricula).toFixed(2) : "0.00"} USD
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500">
                          Cuota inicial de inscripción o matrícula asignada al taller para cada participante (opcional).
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Completion Final Badge */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between mt-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck size={20} className="text-[#fd761a]" />
                    <span className="text-xs sm:text-sm font-medium text-slate-700">
                      Todos los requisitos del taller se encuentran listos para guardar.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-slate-600">
                      {multiDia ? `${diasSeleccionados.length} días configurados` : "Jornada única"}
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
              className={`inline-flex items-center justify-center gap-1.5 px-5 h-11 rounded-xl font-semibold text-xs transition-all ${
                currentStep === 1
                  ? "bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer active:scale-95"
              }`}
            >
              <ChevronLeft size={16} />
              <span>Anterior</span>
            </button>
          </div>

          {/* Center: Helper message */}
          <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
            {!currentStepIsValid && (
              <span className="text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1">
                <Info size={13} />
                Completa los campos obligatorios para continuar
              </span>
            )}
          </div>

          {/* Right: Next Step / Submit Button */}
          <div>
            {currentStep < 3 ? (
              <button
                type="button"
                disabled={!currentStepIsValid}
                onClick={handleNextStep}
                className={`inline-flex items-center justify-center gap-2 px-6 h-11 rounded-xl font-bold text-xs transition-all ${
                  !currentStepIsValid
                    ? "bg-slate-200 text-slate-400 opacity-60 cursor-not-allowed shadow-none"
                    : "bg-[#fd761a] hover:bg-[#e06512] text-white shadow-md active:scale-95 cursor-pointer ring-2 ring-orange-100"
                }`}
              >
                <span>{STEP_META[currentStep - 1].nextLabel}</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                disabled={!currentStepIsValid || saving}
                onClick={() => {
                  void handleSubmit()
                }}
                className={`inline-flex items-center justify-center gap-2 px-6 h-11 rounded-xl font-bold text-xs transition-all ${
                  !currentStepIsValid || saving
                    ? "bg-slate-200 text-slate-400 opacity-60 cursor-not-allowed shadow-none"
                    : "bg-[#fd761a] hover:bg-[#e06512] text-white shadow-md active:scale-95 cursor-pointer ring-2 ring-orange-100"
                }`}
              >
                {saving && <HugeiconsIcon icon={Loading02Icon} size={16} className="animate-spin text-white" />}
                <span>{saving ? "Guardando..." : isEdit ? "Guardar Cambios" : "Finalizar y Crear Taller"}</span>
                {!saving && <Check size={16} strokeWidth={2.8} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= REGISTER NEW CITY MODAL ================= */}
      {showCiudadModal && (() => {
        const ciudadesRegistradas = new Set(ciudades.map((c) => c.nombre))
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

      <ConfirmationModal
        isOpen={showRegenerationConfirm}
        title="Regenerar sesiones con asistencia"
        message="Los cambios de programación reemplazarán las sesiones actuales del taller. Las asistencias ya registradas podrían verse afectadas. Confirma únicamente si deseas proceder con este cambio."
        confirmText="Regenerar y guardar"
        cancelText="Volver a revisar"
        isDangerous
        isLoading={saving}
        icon="danger"
        onConfirm={() => {
          setShowRegenerationConfirm(false)
          void handleSubmit(undefined, true)
        }}
        onCancel={() => setShowRegenerationConfirm(false)}
      />
    </div>
  )
}
