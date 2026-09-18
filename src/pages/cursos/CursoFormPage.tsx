import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams } from "react-router-dom"
import {
  ChevronRight,
  ChevronLeft,
  Search,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
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
  Sparkles,
} from "lucide-react"
import { HugeiconsIcon } from "@hugeicons/react"
import { MapPinIcon, Cancel01Icon, Loading02Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { parseLocalDate } from "@/lib/utils"
import { cursosService, type CatalogoCurso, type CursoAbierto } from "@/services/cursos.service"
import { iconMap } from "@/pages/catalogos/components/catalog-icons"
import { instructoresService } from "@/services/instructores.service"
import { ciudadesService, type Ciudad } from "@/services/ciudades.service"
import { toast } from "sonner"
import { ConfirmationModal } from "@/components/ConfirmationModal"

const ACCENT = COLORS.ACCENT

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

interface InstructorOption {
  id: string
  nombres: string
  apellidos: string
  perfil_instructor?: { especialidad?: string }
}

interface Modulo {
  id?: string
  nombre: string
  fecha_inicio: string
  fecha_fin: string
  precio_base?: number
}

const STEP_META = [
  { step: 1, title: "Catálogo & Docente", subtitle: "Requerido", nextLabel: "Siguiente: Información" },
  { step: 2, title: "Información", subtitle: "Fechas & Horarios", nextLabel: "Siguiente: Días de clase" },
  { step: 3, title: "Días de clase", subtitle: "Frecuencia", nextLabel: "Siguiente: Configuración" },
  { step: 4, title: "Configuración", subtitle: "Cupos & Precios", nextLabel: "Siguiente: Módulos" },
  { step: 5, title: "Módulos", subtitle: "Plan de estudio", nextLabel: "Finalizar y Crear Curso" },
]

const DIAS_SEMANA_MAP = [
  { value: 1, short: "Lun", full: "Lunes" },
  { value: 2, short: "Mar", full: "Martes" },
  { value: 3, short: "Mié", full: "Miércoles" },
  { value: 4, short: "Jue", full: "Jueves" },
  { value: 5, short: "Vie", full: "Viernes" },
  { value: 6, short: "Sáb", full: "Sábado" },
  { value: 7, short: "Dom", full: "Domingo" },
]

export function CursoFormPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [catalogos, setCatalogos] = useState<CatalogoCurso[]>([])
  const [instructores, setInstructores] = useState<InstructorOption[]>([])
  const [ciudades, setCiudad] = useState<Ciudad[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [catalogoSearch, setCatalogoSearch] = useState("")
  const [docenteSearch, setDocenteSearch] = useState("")

  const [showCiudadModal, setShowCiudadModal] = useState(false)
  const [ciudadModalRegion, setCiudadModalRegion] = useState<Region | null>(null)
  const [ciudadModalSeleccionada, setCiudadModalSeleccionada] = useState<string | null>(null)
  const [savingCiudad, setSavingCiudad] = useState(false)
  const [showRegenerationConfirm, setShowRegenerationConfirm] = useState(false)

  const [form, setForm] = useState({
    catalogo_curso_id: "",
    nombre_instancia: "",
    fecha_inicio: "",
    fecha_fin: "",
    hora_inicio: "",
    hora_fin: "",
    capacidad_maxima: 18,
    precio_base: "",
    docente_id: "",
    modalidad: "presencial" as "presencial" | "virtual",
    ciudad_id: 0,
    observaciones: "",
    dias_semana: [] as number[],
    modulos: [] as Modulo[],
  })

  const selectedCatalogo = catalogos.find((c) => c.id === form.catalogo_curso_id)
  const numModulosDefault = selectedCatalogo?.modulos_default || 0

  const calcularFechasModulos = (numModulos: number, fechaInicio: string, fechaFin: string) => {
    if (!fechaInicio || !fechaFin || numModulos === 0) return []
    const inicio = parseLocalDate(fechaInicio)
    const fin = parseLocalDate(fechaFin)
    const totalDias = Math.floor((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
    const totalSemanas = Math.ceil(totalDias / 7)
    const semanasModulo = Math.floor(totalSemanas / numModulos)

    return Array.from({ length: numModulos }, (_, i) => {
      const semanaInicio = i * semanasModulo + 1
      const semanaFin = i === numModulos - 1 ? totalSemanas : (i + 1) * semanasModulo
      const fechaModInicio = new Date(inicio)
      fechaModInicio.setDate(fechaModInicio.getDate() + (semanaInicio - 1) * 7)
      const fechaModFin = new Date(inicio)
      fechaModFin.setDate(fechaModFin.getDate() + semanaFin * 7 - 1)
      if (i === numModulos - 1) fechaModFin.setTime(fin.getTime())
      return {
        nombre: `Módulo ${i + 1}`,
        fecha_inicio: fechaModInicio.toISOString().split("T")[0],
        fecha_fin: fechaModFin.toISOString().split("T")[0],
      }
    })
  }

  useEffect(() => {
    const cargar = async () => {
      setLoadingData(true)
      try {
        const [catRes, instData, ciudadData] = await Promise.all([
          cursosService.getCatalogos(),
          instructoresService.getDisponibles(),
          ciudadesService.getCiudadesTodas(),
        ])
        setCatalogos(catRes.data)
        setInstructores(instData as unknown as InstructorOption[])
        setCiudad(ciudadData)

        if (isEdit && id) {
          const raw = (await cursosService.getCursoAbiertoById(id)) as CursoAbierto
          let modulosEdit: Modulo[] = []
          try {
            const rawModulos = await cursosService.getModulosCurso(id)
            modulosEdit = rawModulos.map((m: Record<string, unknown>) => ({
              id: String(m.id || ""),
              nombre: String(m.nombre_modulo || m.nombre || ""),
              fecha_inicio: String(m.fecha_inicio || ""),
              fecha_fin: String(m.fecha_fin || ""),
              precio_base: m.precio_base == null ? undefined : Number(m.precio_base),
            }))
          } catch {
            modulosEdit = calcularFechasModulos(
              Number(raw.catalogo?.modulos_default) || 0,
              String(raw.fecha_inicio || ""),
              String(raw.fecha_fin || "")
            )
          }

          const horario = raw.horario as Record<string, unknown> | undefined
          const diasSemanaArray = horario?.dias_semana as Array<{ dia_semana: number }> | undefined

          setForm({
            catalogo_curso_id: String(raw.catalogo?.id || ""),
            nombre_instancia: String(raw.nombre_instancia || ""),
            fecha_inicio: String(raw.fecha_inicio || "").split("T")[0],
            fecha_fin: String(raw.fecha_fin || "").split("T")[0],
            hora_inicio: String(horario?.hora_inicio || "").substring(0, 5),
            hora_fin: String(horario?.hora_fin || "").substring(0, 5),
            capacidad_maxima: Number(raw.capacidad_maxima) || 18,
            precio_base: raw.precio_base != null ? String(raw.precio_base) : "",
            docente_id: String(raw.docente_id || ""),
            modalidad: (String(raw.modalidad || "presencial")) as "presencial" | "virtual",
            ciudad_id: Number(raw.ciudad_id) || 0,
            observaciones: String(raw.observaciones || ""),
            dias_semana: Array.isArray(diasSemanaArray)
              ? diasSemanaArray.map((d: { dia_semana: number }) => d.dia_semana)
              : [],
            modulos: modulosEdit,
          })
        }
      } catch {
        toast.error("Error al cargar datos del curso")
      } finally {
        setLoadingData(false)
      }
    }
    cargar()
  }, [id, isEdit])

  useEffect(() => {
    if (form.catalogo_curso_id && !isEdit) {
      const modulos = calcularFechasModulos(numModulosDefault, form.fecha_inicio, form.fecha_fin)
      setForm((prev) => ({ ...prev, modulos }))
    }
  }, [form.catalogo_curso_id, numModulosDefault, form.fecha_inicio, form.fecha_fin, isEdit])

  useEffect(() => {
    if (form.modulos.length > 0 && form.fecha_fin && !isEdit) {
      const lastModuleIndex = form.modulos.length - 1
      if (form.modulos[lastModuleIndex].fecha_fin !== form.fecha_fin) {
        setForm((prev) => {
          const updated = [...prev.modulos]
          updated[lastModuleIndex] = { ...updated[lastModuleIndex], fecha_fin: prev.fecha_fin }
          return { ...prev, modulos: updated }
        })
      }
    }
  }, [form.fecha_fin, isEdit, form.modulos])

  useEffect(() => {
    if (form.catalogo_curso_id && !isEdit) {
      const tipoDelCatalogo = selectedCatalogo?.categoria || "regular"
      const capacidadAutomatica = tipoDelCatalogo === "regular" && form.modalidad === "presencial" ? 18 : 99
      if (form.capacidad_maxima !== capacidadAutomatica) {
        setForm((prev) => ({ ...prev, capacidad_maxima: capacidadAutomatica }))
      }
    }
  }, [selectedCatalogo?.categoria, form.modalidad, isEdit, form.catalogo_curso_id, selectedCatalogo, form.capacidad_maxima])

  const updateField = (f: string, v: string | number | number[] | Modulo[]) => {
    setForm((p) => ({ ...p, [f]: v }))
    setFieldErrors((p) => {
      const n = { ...p }
      delete n[f]
      return n
    })
  }

  const getError = (f: string) => fieldErrors[f]

  const parseErrors = (e: Record<string, string[]>) => {
    const p: Record<string, string> = {}
    for (const [k, v] of Object.entries(e)) p[k] = v[0]
    return p
  }

  const cascadeModuleDates = (moduloIndex: number, newFechaFin: string) => {
    setForm((prev) => {
      const updated = [...prev.modulos]
      updated[moduloIndex] = { ...updated[moduloIndex], fecha_fin: newFechaFin }
      for (let j = moduloIndex + 1; j < updated.length; j++) {
        const prevFechaFin = updated[j - 1].fecha_fin
        if (prevFechaFin) {
          const nextStart = parseLocalDate(prevFechaFin)
          nextStart.setDate(nextStart.getDate() + 1)
          const nextStartStr = nextStart.toISOString().split("T")[0]
          if (j === updated.length - 1) {
            updated[j] = { ...updated[j], fecha_inicio: nextStartStr, fecha_fin: prev.fecha_fin }
          } else {
            const originalInicio = parseLocalDate(updated[j].fecha_inicio)
            const originalFin = parseLocalDate(updated[j].fecha_fin)
            const duracionOriginal =
              !isNaN(originalInicio.getTime()) && !isNaN(originalFin.getTime())
                ? Math.max(1, Math.ceil((originalFin.getTime() - originalInicio.getTime()) / (1000 * 60 * 60 * 24)) + 1)
                : 7
            const newEnd = new Date(nextStart)
            newEnd.setDate(newEnd.getDate() + duracionOriginal - 1)
            updated[j] = { ...updated[j], fecha_inicio: nextStartStr, fecha_fin: newEnd.toISOString().split("T")[0] }
          }
        }
      }
      return { ...prev, modulos: updated }
    })
  }

  const redistribuirFechas = (nuevoTotal: number, nombresActuales: string[]) => {
    const nuevasFechas = calcularFechasModulos(nuevoTotal, form.fecha_inicio, form.fecha_fin)
    const nombresFinales = nombresActuales.map((n, i) => n || `Módulo ${i + 1}`)
    while (nombresFinales.length < nuevoTotal) {
      nombresFinales.push(`Módulo ${nombresFinales.length + 1}`)
    }
    if (nuevasFechas.length === 0) {
      return nombresFinales.map((nombre) => ({ nombre, fecha_inicio: "", fecha_fin: "" }))
    }
    return nuevasFechas.map((f, i) => ({
      ...f,
      nombre: nombresFinales[i] || `Módulo ${i + 1}`,
    }))
  }

  const agregarModulo = () => {
    const nuevosNombres = form.modulos.map((m) => m.nombre)
    const nuevosModulos = redistribuirFechas(form.modulos.length + 1, nuevosNombres)
    setForm((prev) => ({ ...prev, modulos: nuevosModulos }))
  }

  const eliminarModulo = (indice: number) => {
    if (form.modulos.length <= 1) return
    const nuevosNombres = form.modulos.filter((_, i) => i !== indice).map((m) => m.nombre)
    const nuevosModulos = redistribuirFechas(form.modulos.length - 1, nuevosNombres)
    setForm((prev) => ({ ...prev, modulos: nuevosModulos }))
  }

  const moverModulo = (indice: number, direccion: "arriba" | "abajo") => {
    const nuevoIndice = direccion === "arriba" ? indice - 1 : indice + 1
    if (nuevoIndice < 0 || nuevoIndice >= form.modulos.length) return
    setForm((prev) => {
      const copia = [...prev.modulos]
      const temp = copia[indice]
      copia[indice] = copia[nuevoIndice]
      copia[nuevoIndice] = temp
      return { ...prev, modulos: copia }
    })
  }

  // Pure validation check for disabling / enabling buttons
  const isStepValid = (step: number): boolean => {
    if (step === 1) {
      // Catalog is required; Docente is OPTIONAL
      return !!form.catalogo_curso_id
    }
    if (step === 2) {
      if (!form.nombre_instancia.trim()) return false
      if (!form.fecha_inicio || !form.fecha_fin) return false
      if (parseLocalDate(form.fecha_fin) <= parseLocalDate(form.fecha_inicio)) return false
      if (!form.hora_inicio || !form.hora_fin) return false
      if (form.hora_fin <= form.hora_inicio) return false
      return true
    }
    if (step === 3) {
      return form.dias_semana.length > 0
    }
    if (step === 4) {
      const maxCap = form.modalidad === "presencial" ? 18 : 99
      if (!form.capacidad_maxima || form.capacidad_maxima < 1 || form.capacidad_maxima > maxCap) return false
      if (form.precio_base === "" || isNaN(Number(form.precio_base)) || Number(form.precio_base) < 0) return false
      if (form.modalidad === "presencial" && (!form.ciudad_id || form.ciudad_id <= 0)) return false
      return true
    }
    if (step === 5) {
      if (form.modulos.length === 0) return false
      return form.modulos.every((m) => m.nombre.trim() !== "" && !!m.fecha_inicio && !!m.fecha_fin)
    }
    return false
  }

  // Form error populating validation for current step
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}
    if (step === 1) {
      if (!form.catalogo_curso_id) newErrors.catalogo_curso_id = "Selecciona un catálogo para continuar"
      // Docente is strictly optional
    } else if (step === 2) {
      if (!form.nombre_instancia.trim()) newErrors.nombre_instancia = "El nombre de la instancia es obligatorio"
      if (!form.fecha_inicio) newErrors.fecha_inicio = "La fecha de inicio es obligatoria"
      if (!form.fecha_fin) newErrors.fecha_fin = "La fecha de fin es obligatoria"
      if (form.fecha_inicio && form.fecha_fin && parseLocalDate(form.fecha_fin) <= parseLocalDate(form.fecha_inicio)) {
        newErrors.fecha_fin = "La fecha de fin debe ser posterior a la de inicio"
      }
      if (!form.hora_inicio) newErrors.hora_inicio = "La hora de inicio es obligatoria"
      if (!form.hora_fin) newErrors.hora_fin = "La hora de fin es obligatoria"
      if (form.hora_inicio && form.hora_fin && form.hora_fin <= form.hora_inicio) {
        newErrors.hora_fin = "La hora de finalización debe ser posterior a la de inicio"
      }
    } else if (step === 3) {
      if (!form.dias_semana || form.dias_semana.length === 0) {
        newErrors.dias_semana = "Selecciona al menos un día de clase"
      }
    } else if (step === 4) {
      const maxCap = form.modalidad === "presencial" ? 18 : 99
      if (!form.capacidad_maxima || form.capacidad_maxima < 1 || form.capacidad_maxima > maxCap) {
        newErrors.capacidad_maxima =
          form.modalidad === "presencial"
            ? "La capacidad máxima para cursos presenciales es de 18 estudiantes"
            : "La capacidad debe estar entre 1 y 99 estudiantes"
      }
      if (form.precio_base === "" || isNaN(Number(form.precio_base)) || Number(form.precio_base) < 0) {
        newErrors.precio_base = "El precio base por módulo es obligatorio"
      }
      if (form.modalidad === "presencial" && (!form.ciudad_id || form.ciudad_id <= 0)) {
        newErrors.ciudad_id = "Debes seleccionar la sede o ciudad para la modalidad presencial"
      }
    } else if (step === 5) {
      if (form.modulos.length === 0) {
        newErrors.modulos = "Debe existir al menos un módulo configurado"
      } else {
        form.modulos.forEach((mod, idx) => {
          if (!mod.nombre.trim()) newErrors[`modulo_${idx}_nombre`] = "El nombre del módulo es obligatorio"
          if (!mod.fecha_inicio) newErrors[`modulo_${idx}_inicio`] = "Fecha de inicio requerida"
          if (!mod.fecha_fin) newErrors[`modulo_${idx}_fin`] = "Fecha de fin requerida"
        })
      }
    }
    setFieldErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    if (!isStepValid(currentStep)) {
      validateStep(currentStep)
      toast.error("Por favor completa los campos requeridos antes de continuar")
      return
    }
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5))
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
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
    // To jump forward, all steps in between must be valid
    for (let s = 1; s < targetStep; s++) {
      if (!isStepValid(s)) {
        toast.info(`Completa el Paso ${s}: ${STEP_META[s - 1].title} para avanzar`)
        return
      }
    }
    setCurrentStep(targetStep)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSubmit = async (confirmarRegeneracion = false) => {
    if (!isStepValid(currentStep) || !validateStep(currentStep)) {
      toast.error("Revisa los campos obligatorios antes de finalizar")
      return
    }
    setLoading(true)
    try {
      const baseData = {
        nombre_instancia: form.nombre_instancia,
        fecha_inicio: form.fecha_inicio,
        fecha_fin: form.fecha_fin,
        hora_inicio: form.hora_inicio || undefined,
        hora_fin: form.hora_fin || undefined,
        capacidad_maxima: form.capacidad_maxima,
        precio_base: Number(form.precio_base) || 0,
        docente_id: form.docente_id || undefined,
        modalidad: form.modalidad,
        ciudad_id: form.modalidad === "presencial" && form.ciudad_id ? form.ciudad_id : undefined,
        observaciones: form.observaciones || undefined,
        dias_semana: form.dias_semana.length > 0 ? form.dias_semana : undefined,
      }

      if (isEdit && id) {
        await cursosService.actualizarCursoAbierto(id, {
          ...baseData,
          modulos: form.modulos.length > 0 ? form.modulos : undefined,
          confirmar_regeneracion_clases: confirmarRegeneracion || undefined,
        })
        toast.success("Curso actualizado exitosamente")
      } else {
        await cursosService.crearCursoAbierto({
          ...baseData,
          catalogo_curso_id: form.catalogo_curso_id,
          modulos: form.modulos.length > 0 ? form.modulos : undefined,
        })
        toast.success("Curso creado exitosamente")
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cursos"] }),
        queryClient.invalidateQueries({ queryKey: ["cursos-abiertos"] }),
        queryClient.invalidateQueries({ queryKey: ["catalogos"] }),
      ])
      navigate("/cursos")
    } catch (err) {
      const responseData = (err as { response?: { data?: { requiere_confirmacion_regeneracion?: boolean } } })?.response
        ?.data
      if (responseData?.requiere_confirmacion_regeneracion && !confirmarRegeneracion) {
        setShowRegenerationConfirm(true)
        return
      }
      const e = (err as { response?: { data?: { errors?: Record<string, string[]>; mensaje?: string } } })?.response?.data
        ?.errors
      if (e) {
        setFieldErrors(parseErrors(e))
        toast.error(Object.values(e).flat()[0] as string)
      } else {
        toast.error(
          (err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje || "Error al guardar el curso"
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCrearCiudad = async (nombre: string) => {
    if (!nombre.trim()) return
    setSavingCiudad(true)
    try {
      const nueva = await ciudadesService.crearCiudad(nombre.trim())
      toast.success(`Ciudad "${nombre}" creada`)
      const ciudadesActualizadas = await ciudadesService.getCiudadesTodas()
      setCiudad(ciudadesActualizadas)
      updateField("ciudad_id", nueva.id)
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

  // Filtered lists
  const filteredCatalogos = catalogos.filter((c) => c.nombre.toLowerCase().includes(catalogoSearch.toLowerCase()))
  const filteredDocentes = instructores.filter((d) =>
    `${d.nombres} ${d.apellidos} ${d.perfil_instructor?.especialidad || ""}`
      .toLowerCase()
      .includes(docenteSearch.toLowerCase())
  )

  const selectedDocente = instructores.find((d) => d.id === form.docente_id)
  const currentStepIsValid = isStepValid(currentStep)
  const totalCursoCalculado = (form.modulos.length * (Number(form.precio_base) || 0)).toFixed(2)

  // Day toggle helpers
  const toggleDia = (diaVal: number) => {
    if (form.dias_semana.includes(diaVal)) {
      updateField(
        "dias_semana",
        form.dias_semana.filter((d) => d !== diaVal)
      )
    } else {
      updateField("dias_semana", [...form.dias_semana, diaVal].sort())
    }
  }

  const selectWeekdays = () => updateField("dias_semana", [1, 2, 3, 4, 5])
  const selectWeekend = () => updateField("dias_semana", [6, 7])
  const resetDays = () => updateField("dias_semana", [])

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
        <div className="text-center p-8">
          <HugeiconsIcon icon={Loading02Icon} size={36} className="animate-spin text-[#fd761a] mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-600">Cargando datos del curso...</p>
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
              onClick={() => navigate("/cursos")}
              type="button"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#fd761a] transition-colors w-fit"
            >
              <ArrowLeft size={16} />
              <span>Volver a cursos</span>
            </button>
            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                {isEdit ? "Editar Curso" : "Nuevo Curso"}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-[#fd761a] text-xs font-bold uppercase tracking-wider">
                {isEdit ? "Edición" : "Configuración"}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Paso <span className="font-bold text-slate-900">{currentStep}</span> de 5 ·{" "}
              <span className="text-[#fd761a] font-semibold">{STEP_META[currentStep - 1].title}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => navigate("/cursos")}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>

        {/* ================= 5-STEP INTEGRAL STEPPER ================= */}
        <div className="w-full bg-white p-5 sm:p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="relative flex items-center justify-between w-full">
            {/* Connecting Line Background */}
            <div className="absolute left-6 right-6 top-5 h-0.5 bg-slate-200 -z-0" />
            {/* Dynamic Fill Progress Line */}
            <div
              className="absolute left-6 top-5 h-0.5 bg-[#fd761a] transition-all duration-300 -z-0"
              style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 min-h-[520px]">
          {/* ================= PASO 1: CATÁLOGO & DOCENTE ================= */}
          {currentStep === 1 && (
            <section className="flex flex-col gap-8">
              {/* Catalog Section */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Selecciona el catálogo</h2>
                    <p className="text-sm text-slate-500">
                      El curso se creará dentro del catálogo seleccionado y adoptará su estructura básica.
                    </p>
                  </div>
                  {/* Search input */}
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 text-slate-400 size-4 pointer-events-none" />
                    <input
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none transition-all"
                      placeholder="Buscar catálogo..."
                      type="text"
                      value={catalogoSearch}
                      onChange={(e) => setCatalogoSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Catalog Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCatalogos.map((cat) => {
                    const isSelected = form.catalogo_curso_id === cat.id
                    const colorHex = cat.color || ACCENT
                    const icon = cat.imagen && iconMap[cat.imagen]

                    return (
                      <div
                        key={cat.id}
                        onClick={() => updateField("catalogo_curso_id", isSelected ? "" : cat.id)}
                        className={`relative p-5 rounded-2xl cursor-pointer shadow-xs flex flex-col justify-between transition-all duration-150 ${
                          isSelected
                            ? "bg-orange-50/50 border-2 border-[#fd761a] ring-2 ring-orange-100/50 shadow-sm"
                            : "bg-slate-50/80 hover:bg-slate-100/70 border border-slate-200/80 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                              style={{
                                backgroundColor: isSelected ? "#fd761a" : `color-mix(in srgb, ${colorHex} 15%, transparent)`,
                                color: isSelected ? "#ffffff" : colorHex,
                              }}
                            >
                              {icon ? (
                                <HugeiconsIcon icon={icon} size={22} />
                              ) : (
                                <span className="text-base font-bold">{cat.nombre.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div>
                              <h3 className="text-base font-bold text-slate-900 leading-tight">{cat.nombre}</h3>
                              {cat.categoria && (
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                  {cat.categoria}
                                </span>
                              )}
                            </div>
                          </div>

                          {isSelected && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#fd761a] text-white text-xs font-bold shrink-0 shadow-xs">
                              <Check size={13} strokeWidth={3} />
                              <span>Seleccionado</span>
                            </span>
                          )}
                        </div>

                        {cat.descripcion && (
                          <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                            {cat.descripcion}
                          </p>
                        )}

                      </div>
                    )
                  })}

                  {filteredCatalogos.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-sm text-slate-500">No se encontraron catálogos con "{catalogoSearch}"</p>
                    </div>
                  )}
                </div>

                {getError("catalogo_curso_id") && (
                  <p className="text-xs font-medium text-red-500 mt-1 flex items-center gap-1">
                    <Info size={14} /> {getError("catalogo_curso_id")}
                  </p>
                )}
              </div>

              {/* Instructor Section (Strictly Optional) */}
              <div className="flex flex-col gap-4 pt-4 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-slate-900">Docente responsable</h3>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold uppercase tracking-wider">
                        Opcional
                      </span>
                    </div>
                    
                  </div>
                  {/* Search input */}
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 text-slate-400 size-4 pointer-events-none" />
                    <input
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none transition-all"
                      placeholder="Buscar docente..."
                      type="text"
                      value={docenteSearch}
                      onChange={(e) => setDocenteSearch(e.target.value)}
                    />
                  </div>
                </div>

                {/* Instructors Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredDocentes.map((d) => {
                    const isSelected = form.docente_id === d.id
                    const initials = `${d.nombres.charAt(0)}${d.apellidos.charAt(0)}`.toUpperCase()

                    return (
                      <div
                        key={d.id}
                        onClick={() => updateField("docente_id", isSelected ? "" : d.id)}
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
                                {d.nombres} {d.apellidos}
                              </h4>
                              <span className="text-[11px] text-[#fd761a] font-medium block truncate">
                                {d.perfil_instructor?.especialidad || "Instructor General"}
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
                            <span className="text-slate-400 hover:text-red-500">Haz clic para desmarcar</span>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {filteredDocentes.length === 0 && (
                    <div className="col-span-full py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-xs text-slate-500">No hay docentes disponibles</p>
                    </div>
                  )}
                </div>

                {selectedDocente && (
                  <div className="p-3 bg-orange-50/40 rounded-xl border border-orange-100 flex items-center justify-between text-xs text-slate-700">
                    <span>
                      Docente seleccionado:{" "}
                      <strong>
                        {selectedDocente.nombres} {selectedDocente.apellidos}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => updateField("docente_id", "")}
                      className="text-xs font-semibold text-[#fd761a] hover:underline"
                    >
                      Quitar asignación
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ================= PASO 2: INFORMACIÓN GENERAL ================= */}
          {currentStep === 2 && (
            <section className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-slate-900">Información general del curso</h2>
                <p className="text-sm text-slate-500">
                  Define el identificador institucional, periodicidad del ciclo y rango de fechas global.
                </p>
              </div>

              <div className="flex flex-col gap-5">
                {/* Course Instance Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-800 flex items-center justify-between">
                    <span>
                      Nombre identificativo de la instancia de curso <span className="text-[#fd761a]">*</span>
                    </span>
                    
                  </label>
                  <input
                    className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 border text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none transition-all ${
                      getError("nombre_instancia") ? "border-red-400 bg-red-50/20" : "border-slate-200"
                    }`}
                    type="text"
                    placeholder="Ej: Oratoria Ejecutiva · Cohorte Q1 2026"
                    value={form.nombre_instancia}
                    onChange={(e) => updateField("nombre_instancia", e.target.value)}
                  />
                  {getError("nombre_instancia") && (
                    <p className="text-xs text-red-500 mt-0.5">{getError("nombre_instancia")}</p>
                  )}
                </div>

                {/* Date Matrix Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-800">
                      Fecha de inicio <span className="text-[#fd761a]">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-3 text-slate-400 size-4 pointer-events-none" />
                      <input
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none transition-all ${
                          getError("fecha_inicio") ? "border-red-400 bg-red-50/20" : "border-slate-200"
                        }`}
                        type="date"
                        value={form.fecha_inicio}
                        onChange={(e) => updateField("fecha_inicio", e.target.value)}
                      />
                    </div>
                    {getError("fecha_inicio") && (
                      <p className="text-xs text-red-500 mt-0.5">{getError("fecha_inicio")}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-800">
                      Fecha de fin <span className="text-[#fd761a]">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-3 text-slate-400 size-4 pointer-events-none" />
                      <input
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none transition-all ${
                          getError("fecha_fin") ? "border-red-400 bg-red-50/20" : "border-slate-200"
                        }`}
                        type="date"
                        value={form.fecha_fin}
                        onChange={(e) => updateField("fecha_fin", e.target.value)}
                      />
                    </div>
                    {getError("fecha_fin") && <p className="text-xs text-red-500 mt-0.5">{getError("fecha_fin")}</p>}
                  </div>
                </div>

                {/* Time Matrix Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-800">
                      Hora de inicio <span className="text-[#fd761a]">*</span>
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3.5 top-3 text-slate-400 size-4 pointer-events-none" />
                      <input
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none transition-all ${
                          getError("hora_inicio") ? "border-red-400 bg-red-50/20" : "border-slate-200"
                        }`}
                        type="time"
                        value={form.hora_inicio}
                        onChange={(e) => updateField("hora_inicio", e.target.value)}
                      />
                    </div>
                    {getError("hora_inicio") && (
                      <p className="text-xs text-red-500 mt-0.5">{getError("hora_inicio")}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-800">
                      Hora de finalización <span className="text-[#fd761a]">*</span>
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3.5 top-3 text-slate-400 size-4 pointer-events-none" />
                      <input
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none transition-all ${
                          getError("hora_fin") ? "border-red-400 bg-red-50/20" : "border-slate-200"
                        }`}
                        type="time"
                        value={form.hora_fin}
                        onChange={(e) => updateField("hora_fin", e.target.value)}
                      />
                    </div>
                    {getError("hora_fin") && <p className="text-xs text-red-500 mt-0.5">{getError("hora_fin")}</p>}
                  </div>
                </div>

                {/* Informative helper box */}
                <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200/80 flex items-start gap-3">
                  <Info className="text-[#fd761a] size-5 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-slate-900">Regla de sincronización temporal</span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Estas fechas corresponden al ciclo completo: <strong className="text-slate-900">Inicio:</strong>{" "}
                      primer día del Módulo 1 · <strong className="text-slate-900">Fin:</strong> último día lectivo del
                      último módulo. En el paso de módulos podrás verificar la distribución del calendario.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ================= PASO 3: DÍAS DE CLASE ================= */}
          {currentStep === 3 && (
            <section className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-slate-900">Días de clase</h2>
                <p className="text-sm text-slate-500">
                  Selecciona los días de la semana en que se impartirá el curso de forma presencial u online.
                </p>
              </div>

              <div className="flex flex-col gap-5">
                {/* Quick Preset Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-[#fd761a]" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Atajos de recurrencia:</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={selectWeekdays}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-orange-50 hover:text-[#fd761a] hover:border-orange-200 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs transition-all"
                    >
                      Lun – Vie (Laborables)
                    </button>
                    <button
                      type="button"
                      onClick={selectWeekend}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-orange-50 hover:text-[#fd761a] hover:border-orange-200 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs transition-all"
                    >
                      Sáb – Dom (Fines de semana)
                    </button>
                    <button
                      type="button"
                      onClick={resetDays}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 text-xs font-semibold border border-slate-200 transition-all"
                    >
                      Limpiar selección
                    </button>
                  </div>
                </div>

                {/* 7-Day Chips Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                  {DIAS_SEMANA_MAP.map((dia) => {
                    const isActive = form.dias_semana.includes(dia.value)

                    return (
                      <button
                        key={dia.value}
                        type="button"
                        onClick={() => toggleDia(dia.value)}
                        className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-150 ${
                          isActive
                            ? "bg-orange-50/70 border-2 border-[#fd761a] text-slate-900 shadow-sm ring-2 ring-orange-100/60"
                            : "bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                            isActive ? "bg-[#fd761a] text-white" : "border border-slate-300 text-transparent"
                          }`}
                        >
                          <Check size={14} strokeWidth={3} />
                        </span>
                        <span className="text-lg font-bold">{dia.short}</span>
                        <span className={`text-xs font-medium ${isActive ? "text-[#fd761a] font-bold" : "text-slate-400"}`}>
                          {dia.full}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {getError("dias_semana") && (
                  <p className="text-xs text-red-500 font-medium">{getError("dias_semana")}</p>
                )}

                {/* Selection Counter & Schedule Summary */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#fd761a] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      {form.dias_semana.length}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-sm font-bold text-slate-900">
                        {form.dias_semana.length} {form.dias_semana.length === 1 ? "día" : "días"} de clase seleccionados
                      </span>
                      <span className="text-xs text-slate-500">
                        {form.dias_semana.length > 0
                          ? form.dias_semana
                              .map((v) => DIAS_SEMANA_MAP.find((d) => d.value === v)?.full)
                              .filter(Boolean)
                              .join(", ")
                          : "No has seleccionado ningún día aún"}
                      </span>
                    </div>
                  </div>

                  {form.dias_semana.length > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                      <ShieldCheck size={16} />
                      <span>Frecuencia lista</span>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ================= PASO 4: CONFIGURACIÓN ================= */}
          {currentStep === 4 && (
            <section className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-slate-900">Configuración del curso</h2>
                <p className="text-sm text-slate-500">
                  Parámetros operativos de matrícula, aforo máximo, esquema arancelario y sede.
                </p>
              </div>

              <div className="flex flex-col gap-5">
                {/* 2 Columns: Capacity & Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Capacity */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-800 flex items-center justify-between">
                      <span>
                        Capacidad máxima de estudiantes <span className="text-[#fd761a]">*</span>
                      </span>
                      <span className="text-xs font-normal text-slate-400">
                        {form.modalidad === "presencial" ? "Máx: 18 aula" : "Máx: 99 virtual"}
                      </span>
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3.5 top-3 text-slate-400 size-4 pointer-events-none" />
                      <input
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border text-slate-900 text-base font-bold focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none transition-all ${
                          getError("capacidad_maxima") ? "border-red-400 bg-red-50/20" : "border-slate-200"
                        }`}
                        type="number"
                        min={1}
                        max={form.modalidad === "presencial" ? 18 : 99}
                        value={form.capacidad_maxima}
                        onChange={(e) => {
                          let val = parseInt(e.target.value) || 1
                          if (form.modalidad === "presencial" && val > 18) val = 18
                          if (val > 99) val = 99
                          updateField("capacidad_maxima", val)
                        }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">
                      {form.modalidad === "presencial"
                        ? "Capacidad máxima para cursos presenciales: 18 estudiantes."
                        : "Aforo operativo para cursos en modalidad online o virtual."}
                    </span>
                    {getError("capacidad_maxima") && (
                      <p className="text-xs text-red-500 mt-0.5">{getError("capacidad_maxima")}</p>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-800 flex items-center justify-between">
                      <span>
                        Precio base por módulo ($ USD) <span className="text-[#fd761a]">*</span>
                      </span>
                      <span className="text-xs font-semibold text-[#fd761a]">Facturación modular</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3.5 top-3 text-slate-400 size-4 pointer-events-none" />
                      <input
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border text-slate-900 text-base font-bold focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none transition-all ${
                          getError("precio_base") ? "border-red-400 bg-red-50/20" : "border-slate-200"
                        }`}
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="0.00"
                        value={form.precio_base}
                        onChange={(e) => updateField("precio_base", e.target.value)}
                      />
                    </div>

                    {/* Live Financial Calculator */}
                    <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200 flex items-center justify-between text-xs">
                      <span className="text-slate-700">
                        Cálculo de curso: <strong>{form.modulos.length} módulos</strong> × $
                        {Number(form.precio_base) > 0 ? Number(form.precio_base).toFixed(2) : "0.00"}
                      </span>
                      <span className="font-bold text-[#fd761a]">Total: ${totalCursoCalculado} USD</span>
                    </div>

                    {getError("precio_base") && (
                      <p className="text-xs text-red-500 mt-0.5">{getError("precio_base")}</p>
                    )}
                  </div>
                </div>

                {/* Modality Segmented Selector & City Dropdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Modality */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-800">
                      Modalidad de impartición <span className="text-[#fd761a]">*</span>
                    </label>
                    <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => {
                          updateField("modalidad", "presencial")
                          if (form.capacidad_maxima > 18) updateField("capacidad_maxima", 18)
                        }}
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
                        onClick={() => updateField("modalidad", "virtual")}
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

                  {/* Sede / Ciudad (Only relevant for Presencial) */}
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
                          value={form.ciudad_id}
                          onChange={(e) => updateField("ciudad_id", e.target.value ? parseInt(e.target.value, 10) : 0)}
                          className={`w-full pl-10 pr-8 py-2.5 rounded-xl bg-slate-50 border text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none transition-all cursor-pointer ${
                            getError("ciudad_id") ? "border-red-400 bg-red-50/20" : "border-slate-200"
                          }`}
                        >
                          <option value="0">Seleccionar sede / ciudad...</option>
                          {ciudades.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                      {getError("ciudad_id") && (
                        <p className="text-xs text-red-500 mt-0.5">{getError("ciudad_id")}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-slate-800">Campus Virtual</label>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                        <Monitor size={16} className="text-[#fd761a]" />
                        <span>Sin sede física</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Observaciones textarea */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-800 flex items-center justify-between">
                    <span>Observaciones operativas &amp; requisitos del curso</span>
                    <span className="text-xs font-normal text-slate-400">Opcional</span>
                  </label>
                  <textarea
                    className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none resize-none transition-all"
                    rows={3}
                    placeholder="Requerimientos técnicos para el aula (proyector, material impreso, enlaces de Zoom)..."
                    value={form.observaciones}
                    onChange={(e) => updateField("observaciones", e.target.value)}
                  />
                </div>
              </div>
            </section>
          )}

          {/* ================= PASO 5: MÓDULOS ================= */}
          {currentStep === 5 && (
            <section className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-bold text-slate-900">Plan de módulos del curso</h2>
                  <p className="text-sm text-slate-500">
                    Las fechas y asignaciones se configuran de acuerdo a la duración del ciclo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={agregarModulo}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#fd761a] hover:bg-[#e06512] text-white text-xs sm:text-sm font-bold shadow-sm transition-all self-start sm:self-center"
                >
                  <Plus size={16} />
                  <span>Agregar módulo</span>
                </button>
              </div>

              {/* Sync Helper Banner */}
              <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200/80 flex items-start gap-3">
                <Info className="text-[#fd761a] size-5 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-slate-900">Distribución calendarizada automática</span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Las fechas de inicio y fin de cada módulo se sincronizan en cascada. Puedes ajustar individualmente
                    el precio o nombre de cada etapa evaluativa.
                  </p>
                </div>
              </div>

              {getError("modulos") && (
                <p className="text-xs text-red-500 font-medium">{getError("modulos")}</p>
              )}

              {/* Modules List Container */}
              <div className="flex flex-col gap-4">
                {form.modulos.map((mod, i) => {
                  const diasModulo =
                    mod.fecha_inicio && mod.fecha_fin
                      ? Math.max(
                          1,
                          Math.ceil(
                            (parseLocalDate(mod.fecha_fin).getTime() - parseLocalDate(mod.fecha_inicio).getTime()) /
                              (1000 * 60 * 60 * 24) +
                              1
                          )
                        )
                      : null

                  return (
                    <div
                      key={i}
                      className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 shadow-xs flex flex-col gap-4 hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-[#fd761a] text-white flex items-center justify-center font-bold text-xs">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="text-sm sm:text-base font-bold text-slate-900 truncate">
                            Módulo {i + 1}: {mod.nombre || "Sin nombre"}
                          </span>
                          {diasModulo && (
                            <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[11px] font-semibold">
                              {diasModulo} días lectivos
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={i === 0}
                            onClick={() => moverModulo(i, "arriba")}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Mover arriba"
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            type="button"
                            disabled={i === form.modulos.length - 1}
                            onClick={() => moverModulo(i, "abajo")}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Mover abajo"
                          >
                            <ArrowDown size={16} />
                          </button>
                          {form.modulos.length > 1 && (
                            <button
                              type="button"
                              onClick={() => eliminarModulo(i)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors ml-1 text-[11px] font-bold"
                              title="Eliminar módulo"
                              aria-label={`Quitar módulo ${i + 1}`}
                            >
                              <Trash2 size={16} />
                              <span>Quitar módulo</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                        <div className="flex flex-col gap-1 md:col-span-2">
                          <label className="text-xs font-semibold text-slate-600">Nombre de la unidad modular</label>
                          <input
                            className={`w-full px-3.5 py-2 rounded-xl bg-white border text-slate-900 text-sm focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none ${
                              getError(`modulo_${i}_nombre`) ? "border-red-400" : "border-slate-200"
                            }`}
                            type="text"
                            placeholder="Nombre del módulo"
                            value={mod.nombre}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                modulos: prev.modulos.map((m, j) => (j === i ? { ...m, nombre: e.target.value } : m)),
                              }))
                            }
                          />
                          {getError(`modulo_${i}_nombre`) && (
                            <p className="text-[11px] text-red-500">{getError(`modulo_${i}_nombre`)}</p>
                          )}
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-slate-600">Inicio</label>
                          <input
                            className={`w-full px-3 py-2 rounded-xl bg-white border text-slate-900 text-sm focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none ${
                              getError(`modulo_${i}_inicio`) ? "border-red-400" : "border-slate-200"
                            }`}
                            type="date"
                            value={mod.fecha_inicio}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                modulos: prev.modulos.map((m, j) =>
                                  j === i ? { ...m, fecha_inicio: e.target.value } : m
                                ),
                              }))
                            }
                          />
                          {getError(`modulo_${i}_inicio`) && (
                            <p className="text-[11px] text-red-500">{getError(`modulo_${i}_inicio`)}</p>
                          )}
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-semibold text-slate-600">Fin</label>
                          <input
                            className={`w-full px-3 py-2 rounded-xl bg-white border text-slate-900 text-sm focus:ring-2 focus:ring-[#fd761a] focus:border-transparent outline-none ${
                              getError(`modulo_${i}_fin`) ? "border-red-400" : "border-slate-200"
                            }`}
                            type="date"
                            value={mod.fecha_fin}
                            onChange={(e) => cascadeModuleDates(i, e.target.value)}
                          />
                          {getError(`modulo_${i}_fin`) && (
                            <p className="text-[11px] text-red-500">{getError(`modulo_${i}_fin`)}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600 pt-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200/80">
                        <div className="flex items-center gap-2">
                          <span>Arancel de este módulo:</span>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            className="w-20 px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-[#fd761a] outline-none"
                            placeholder={String(form.precio_base || "0.00")}
                            value={mod.precio_base ?? form.precio_base}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                modulos: prev.modulos.map((m, j) =>
                                  j === i
                                    ? {
                                        ...m,
                                        precio_base: e.target.value === "" ? undefined : Number(e.target.value),
                                      }
                                    : m
                                ),
                              }))
                            }
                          />
                          <span className="text-slate-400 font-medium">USD</span>
                        </div>

                        {selectedDocente ? (
                          <span className="flex items-center gap-1 text-[#fd761a] font-semibold">
                            <Check size={14} /> Docente: {selectedDocente.nombres} {selectedDocente.apellidos}
                          </span>
                        ) : (
                          <span className="text-slate-400">Docente sin asignar (opcional)</span>
                        )}
                      </div>
                    </div>
                  )
                })}

                {form.modulos.length === 0 && (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
                    <p className="text-sm text-slate-500 mb-3">No hay módulos configurados para este curso.</p>
                    <button
                      type="button"
                      onClick={agregarModulo}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#fd761a] text-white text-xs font-bold shadow-xs hover:bg-[#e06512]"
                    >
                      <Plus size={15} /> Agregar Primer Módulo
                    </button>
                  </div>
                )}
              </div>

              {/* Completion Final Badge */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck size={20} className="text-[#fd761a]" />
                  <span className="text-xs sm:text-sm font-medium text-slate-700">
                    Todos los requisitos previos se encuentran listos para registrar el curso.
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  {form.modulos.length} {form.modulos.length === 1 ? "Módulo" : "Módulos"} configurados
                </span>
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

          {/* Center: Cancel */}
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
            {currentStep < 5 ? (
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
                disabled={!currentStepIsValid || loading}
                onClick={() => {
                  void handleSubmit()
                }}
                className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[44px] ${
                  !currentStepIsValid || loading
                    ? "bg-slate-200 text-slate-400 opacity-60 cursor-not-allowed shadow-none"
                    : "bg-[#fd761a] hover:bg-[#e06512] text-white shadow-md active:scale-95 cursor-pointer ring-2 ring-orange-100"
                }`}
              >
                {loading && <HugeiconsIcon icon={Loading02Icon} size={16} className="animate-spin text-white" />}
                <span>{loading ? "Guardando..." : isEdit ? "Guardar Cambios" : "Finalizar y Crear Curso"}</span>
                {!loading && <Check size={18} strokeWidth={2.8} />}
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

      {/* ================= REGENERATION CONFIRMATION MODAL ================= */}
      <ConfirmationModal
        isOpen={showRegenerationConfirm}
        title="Regenerar clases con asistencia"
        message="Los cambios de programación reemplazarán las clases actuales. Las asistencias asociadas podrían perderse. Confirma únicamente si ya verificaste esta consecuencia."
        confirmText="Regenerar y guardar"
        cancelText="Volver a revisar"
        isDangerous
        isLoading={loading}
        icon="danger"
        onConfirm={() => {
          setShowRegenerationConfirm(false)
          void handleSubmit(true)
        }}
        onCancel={() => setShowRegenerationConfirm(false)}
      />
    </div>
  )
}
