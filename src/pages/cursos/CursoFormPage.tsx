
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ChevronRight, ChevronLeft, Search, Plus, Trash2 } from "lucide-react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { ValidatedInput } from "@/components/form"
import { cursosService, type CatalogoCurso, type CursoAbierto } from "@/services/cursos.service"
import { instructoresService } from "@/services/instructores.service"
import { ciudadesService, type Ciudad } from "@/services/ciudades.service"
import { toast } from "sonner"

const ACCENT = COLORS.ACCENT
const CHARCOAL = COLORS.CHARCOAL
const TEXT_MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

interface InstructorOption {
  id: string; nombres: string; apellidos: string
  perfil_instructor?: { especialidad?: string }
}

interface Modulo {
  id?: string
  nombre: string
  fecha_inicio: string
  fecha_fin: string
}

export function CursoFormPage() {
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
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [catalogoSearch, setCatalogoSearch] = useState("")
  const [docenteSearch, setDocenteSearch] = useState("")

  const [form, setForm] = useState({
    catalogo_curso_id: "",
    nombre_instancia: "",
    fecha_inicio: "",
    fecha_fin: "",
    hora_inicio: "",
    hora_fin: "",
    capacidad_maxima: 30,
    precio_base: "",
    docente_id: "",
    modalidad: "presencial" as "presencial" | "virtual",
    ciudad_id: 0,
    observaciones: "",
    dias_semana: [] as number[],
    modulos: [] as Modulo[],
  })

  const selectedCatalogo = catalogos.find(c => c.id === form.catalogo_curso_id)
  const numModulosDefault = selectedCatalogo?.modulos_default || 0
  const stepLabels = ["Catálogo & Docente", "Información", "Días de clase", "Configuración", "Módulos"]

  const calcularFechasModulos = (numModulos: number, fechaInicio: string, fechaFin: string) => {
    if (!fechaInicio || !fechaFin || numModulos === 0) return []
    const inicio = new Date(fechaInicio)
    const fin = new Date(fechaFin)
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
        fecha_inicio: fechaModInicio.toISOString().split('T')[0],
        fecha_fin: fechaModFin.toISOString().split('T')[0],
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
          const raw = await cursosService.getCursoAbiertoById(id) as CursoAbierto
          let modulosEdit: Modulo[] = []
          try {
            const rawModulos = await cursosService.getModulosCurso(id)
            modulosEdit = rawModulos.map((m: Record<string, unknown>) => ({
              id: String(m.id || ""),
              nombre: String(m.nombre_modulo || m.nombre || ""),
              fecha_inicio: String(m.fecha_inicio || ""),
              fecha_fin: String(m.fecha_fin || ""),
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
            capacidad_maxima: Number(raw.capacidad_maxima) || 30,
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
      } catch { toast.error("Error al cargar datos") }
      finally { setLoadingData(false) }
    }
    cargar()
  }, [id, isEdit])

  useEffect(() => {
    if (form.catalogo_curso_id && !isEdit) {
      const modulos = calcularFechasModulos(numModulosDefault, form.fecha_inicio, form.fecha_fin)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(prev => ({ ...prev, modulos }))
    }
  }, [form.catalogo_curso_id, numModulosDefault, form.fecha_inicio, form.fecha_fin, isEdit])

  useEffect(() => {
    if (form.modulos.length > 0 && form.fecha_fin && !isEdit) {
      const lastModuleIndex = form.modulos.length - 1
      if (form.modulos[lastModuleIndex].fecha_fin !== form.fecha_fin) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm(prev => {
          const updated = [...prev.modulos]
          updated[lastModuleIndex] = { ...updated[lastModuleIndex], fecha_fin: prev.fecha_fin }
          return { ...prev, modulos: updated }
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.fecha_fin, isEdit])

  useEffect(() => {
    if (form.catalogo_curso_id && !isEdit) {
      const tipoDelCatalogo = selectedCatalogo?.categoria || "regular"
      let capacidadAutomatica = 30
      if (tipoDelCatalogo === "regular" && form.modalidad === "presencial") capacidadAutomatica = 18
      else capacidadAutomatica = 99
      if (form.capacidad_maxima !== capacidadAutomatica) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm(prev => ({ ...prev, capacidad_maxima: capacidadAutomatica }))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCatalogo?.categoria, form.modalidad, isEdit, form.catalogo_curso_id, selectedCatalogo])

  const updateField = (f: string, v: string | number | number[] | Modulo[]) => {
    setForm(p => ({ ...p, [f]: v }))
    setFieldErrors(p => { const n = { ...p }; delete n[f]; return n })
  }

  const getError = (f: string) => fieldErrors[f]
  const parseErrors = (e: Record<string, string[]>) => {
    const p: Record<string, string> = {}
    for (const [k, v] of Object.entries(e)) p[k] = v[0]
    return p
  }

  const cascadeModuleDates = (moduloIndex: number, newFechaFin: string) => {
    setForm(prev => {
      const updated = [...prev.modulos]
      updated[moduloIndex] = { ...updated[moduloIndex], fecha_fin: newFechaFin }
      for (let j = moduloIndex + 1; j < updated.length; j++) {
        const prevFechaFin = updated[j - 1].fecha_fin
        if (prevFechaFin) {
          const nextStart = new Date(prevFechaFin)
          nextStart.setDate(nextStart.getDate() + 1)
          const nextStartStr = nextStart.toISOString().split('T')[0]
          if (j === updated.length - 1) {
            updated[j] = { ...updated[j], fecha_inicio: nextStartStr, fecha_fin: prev.fecha_fin }
          } else {
            const originalInicio = new Date(updated[j].fecha_inicio)
            const originalFin = new Date(updated[j].fecha_fin)
            const duracionOriginal = !isNaN(originalInicio.getTime()) && !isNaN(originalFin.getTime())
              ? Math.max(1, Math.ceil((originalFin.getTime() - originalInicio.getTime()) / (1000 * 60 * 60 * 24)) + 1)
              : 7
            const newEnd = new Date(nextStart)
            newEnd.setDate(newEnd.getDate() + duracionOriginal - 1)
            updated[j] = { ...updated[j], fecha_inicio: nextStartStr, fecha_fin: newEnd.toISOString().split('T')[0] }
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
    const nuevosNombres = form.modulos.map(m => m.nombre)
    const nuevosModulos = redistribuirFechas(form.modulos.length + 1, nuevosNombres)
    setForm(prev => ({ ...prev, modulos: nuevosModulos }))
  }

  const eliminarModulo = (indice: number) => {
    if (form.modulos.length <= 1) return
    const nuevosNombres = form.modulos.filter((_, i) => i !== indice).map(m => m.nombre)
    const nuevosModulos = redistribuirFechas(form.modulos.length - 1, nuevosNombres)
    setForm(prev => ({ ...prev, modulos: nuevosModulos }))
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}
    if (step === 1) {
      if (!form.catalogo_curso_id) newErrors.catalogo_curso_id = "Selecciona un catálogo"
      if (!form.docente_id) newErrors.docente_id = "Selecciona un docente"
    } else if (step === 2) {
      if (!form.nombre_instancia.trim()) newErrors.nombre_instancia = "El nombre es obligatorio"
      if (!form.fecha_inicio) newErrors.fecha_inicio = "La fecha de inicio es obligatoria"
      if (!form.fecha_fin) newErrors.fecha_fin = "La fecha de fin es obligatoria"
      if (form.fecha_inicio && form.fecha_fin && new Date(form.fecha_fin) <= new Date(form.fecha_inicio)) {
        newErrors.fecha_fin = "La fecha de fin debe ser posterior a la de inicio"
      }
      if (!form.hora_inicio) newErrors.hora_inicio = "La hora de inicio es obligatoria"
      if (!form.hora_fin) newErrors.hora_fin = "La hora de fin es obligatoria"
      if (form.hora_inicio && form.hora_fin && form.hora_fin <= form.hora_inicio) {
        newErrors.hora_fin = "La hora de fin debe ser posterior a la de inicio"
      }
    } else if (step === 3) {
      if (!form.dias_semana || form.dias_semana.length === 0) newErrors.dias_semana = "Selecciona al menos un día"
    } else if (step === 4) {
      if (form.capacidad_maxima < 1 || form.capacidad_maxima > 99) newErrors.capacidad_maxima = "La capacidad debe estar entre 1 y 99"
      if (!form.precio_base || Number(form.precio_base) < 0) newErrors.precio_base = "El precio base es obligatorio"
      if (!form.modalidad) newErrors.modalidad = "Selecciona la modalidad"
    } else if (step === 5) {
      if (form.modulos.length === 0) {
        newErrors.modulos = "Debe existir al menos un módulo"
      } else {
        form.modulos.forEach((mod, idx) => {
          if (!mod.nombre.trim()) newErrors[`modulo_${idx}_nombre`] = "El nombre del módulo es obligatorio"
        })
      }
    }
    setFieldErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(currentStep + 1, 5))
    }
  }

  const handlePrevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      toast.error("Revisa los campos marcados en rojo antes de continuar")
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
        docente_id: form.docente_id,
        modalidad: form.modalidad,
        ciudad_id: form.ciudad_id || undefined,
        observaciones: form.observaciones || undefined,
        dias_semana: form.dias_semana.length > 0 ? form.dias_semana : undefined,
      }

      if (isEdit && id) {
        await cursosService.actualizarCursoAbierto(id, {
          ...baseData,
          modulos: form.modulos.length > 0 ? form.modulos : undefined,
        })
        toast.success("Curso actualizado")
      } else {
        await cursosService.crearCursoAbierto({
          ...baseData,
          catalogo_curso_id: form.catalogo_curso_id,
          modulos: form.modulos.length > 0 ? form.modulos : undefined,
        })
        toast.success("Curso creado exitosamente")
      }
      navigate("/cursos")
    } catch (err) {
      const e = (err as { response?: { data?: { errors?: Record<string, string[]>; mensaje?: string } } })?.response?.data?.errors
      if (e) {
        setFieldErrors(parseErrors(e))
        toast.error(Object.values(e).flat()[0] as string)
      } else toast.error((err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje || "Error al guardar el curso")
    } finally { setLoading(false) }
  }

  const inputC = "w-full px-3.5 py-2.5 border rounded-lg text-sm outline-none bg-white transition-all duration-150 focus:ring-2"
  const dateC = "w-full px-3.5 py-2.5 border rounded-lg text-sm outline-none bg-white transition-all duration-150 focus:ring-2"
  const borderS = { borderColor: BORDER }
  const hiddenScroll = "overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
  const dateStyle: React.CSSProperties = { ...borderS, appearance: "auto", colorScheme: "light" as React.CSSProperties["colorScheme"] }
  const label = "block text-xs font-semibold mb-2.5 uppercase tracking-wide"

  const filteredCatalogos = catalogos.filter(c => c.nombre.toLowerCase().includes(catalogoSearch.toLowerCase()))
  const filteredDocentes = instructores.filter(d => `${d.nombres} ${d.apellidos}`.toLowerCase().includes(docenteSearch.toLowerCase()))

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ color: TEXT_MUTED }}>
        <div className="text-center">
          <div className="inline-block animate-spin mb-3" style={{ color: ACCENT }}>⏳</div>
          <p className="text-sm">Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50/50">
      <div className="bg-white border-b shrink-0" style={{ borderColor: BORDER }}>
        <div className="max-w-4xl mx-auto px-6 py-6">
          <button onClick={() => navigate("/cursos")}
            className="inline-flex items-center gap-1.5 text-xs font-medium mb-2 hover:opacity-70" style={{ color: TEXT_MUTED }}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />Volver a cursos
          </button>
          <h1 className="text-xl font-bold" style={{ color: CHARCOAL }}>
            {isEdit ? "Editar Curso" : "Nuevo Curso"}
          </h1>
          <p className="text-sm mt-1" style={{ color: TEXT_MUTED }}>
            Paso {currentStep} de 5: {stepLabels[currentStep - 1]}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full px-6 py-6">
        {/* Progress bar */}
        <div className="bg-white rounded-xl border p-6 mb-6" style={{ borderColor: BORDER }}>
          <div className="flex items-center justify-between mb-3">
            {stepLabels.map((_, idx) => (
              <div key={idx} className="flex items-center flex-1">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200"
                  style={{
                    backgroundColor: idx + 1 <= currentStep ? ACCENT : BORDER,
                    color: idx + 1 <= currentStep ? "white" : TEXT_MUTED,
                  }}
                >
                  {idx + 1}
                </div>
                {idx < stepLabels.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 transition-all duration-200"
                    style={{ backgroundColor: idx + 1 < currentStep ? ACCENT : BORDER }} />
                )}
              </div>
            ))}
          </div>
          <div className="text-xs font-medium" style={{ color: TEXT_MUTED }}>
            {stepLabels[currentStep - 1]}
          </div>
        </div>

        <div className="bg-white rounded-xl border p-6" style={{ borderColor: BORDER }}>
          {/* Step 1: Catálogo y Docente */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className={label} style={{ color: CHARCOAL }}>
                  Catálogo de Curso <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div className="relative mb-2.5">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: TEXT_MUTED }} />
                  <input type="text" placeholder="Buscar por nombre..." value={catalogoSearch}
                    onChange={e => setCatalogoSearch(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 border rounded-lg text-sm outline-none bg-white"
                    style={{ borderColor: BORDER }} />
                </div>
                <div className={`grid grid-cols-1 gap-2 ${hiddenScroll} max-h-[300px] rounded-lg border`} style={{ borderColor: BORDER }}>
                  {filteredCatalogos.map(cat => (
                    <button key={cat.id} type="button"
                      onClick={() => updateField("catalogo_curso_id", form.catalogo_curso_id === cat.id ? "" : cat.id)}
                      className="px-4 py-3 text-left border-b last:border-b-0 hover:bg-gray-50 transition-colors flex items-start justify-between group"
                      style={{ borderColor: BORDER }}>
                      <div className="flex-1">
                        <span className="block text-sm font-medium truncate"
                          style={{ color: form.catalogo_curso_id === cat.id ? ACCENT : CHARCOAL }}>
                          {cat.nombre}
                        </span>
                        <span className="text-xs mt-1" style={{ color: TEXT_MUTED }}>
                          {cat.categoria} • {selectedCatalogo?.id === cat.id ? numModulosDefault : 0} módulos
                        </span>
                      </div>
                      {form.catalogo_curso_id === cat.id && <span className="ml-2 text-lg">✓</span>}
                    </button>
                  ))}
                  {filteredCatalogos.length === 0 && (
                    <div className="p-6 text-center text-sm" style={{ color: TEXT_MUTED }}>No se encontraron catálogos</div>
                  )}
                </div>
                {getError("catalogo_curso_id") && <p className="text-xs mt-2" style={{ color: "#ef4444" }}>{getError("catalogo_curso_id")}</p>}
              </div>

              <div>
                <label className={label} style={{ color: CHARCOAL }}>
                  Docente Responsable <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div className="relative mb-2.5">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: TEXT_MUTED }} />
                  <input type="text" placeholder="Buscar por nombre..." value={docenteSearch}
                    onChange={e => setDocenteSearch(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 border rounded-lg text-sm outline-none bg-white"
                    style={{ borderColor: BORDER }} />
                </div>
                <div className={`grid grid-cols-2 gap-2 ${hiddenScroll} max-h-[300px] rounded-lg border p-2`} style={{ borderColor: BORDER }}>
                  {filteredDocentes.map(d => (
                    <button key={d.id} type="button"
                      onClick={() => updateField("docente_id", form.docente_id === d.id ? "" : d.id)}
                      className="px-3 py-3 rounded-lg border text-left transition-all hover:shadow-sm"
                      style={{
                        backgroundColor: form.docente_id === d.id ? `color-mix(in srgb, ${ACCENT} 10%, white)` : "white",
                        borderColor: form.docente_id === d.id ? ACCENT : BORDER,
                      }}>
                      <span className="block text-xs font-medium truncate"
                        style={{ color: form.docente_id === d.id ? ACCENT : CHARCOAL }}>
                        {d.nombres} {d.apellidos}
                      </span>
                      {d.perfil_instructor?.especialidad && (
                        <span className="block text-[11px] truncate mt-1" style={{ color: TEXT_MUTED }}>
                          {d.perfil_instructor.especialidad}
                        </span>
                      )}
                    </button>
                  ))}
                  {filteredDocentes.length === 0 && (
                    <p className="col-span-2 text-xs py-4 text-center" style={{ color: TEXT_MUTED }}>Sin instructores disponibles</p>
                  )}
                </div>
                {getError("docente_id") && <p className="text-xs mt-2" style={{ color: "#ef4444" }}>{getError("docente_id")}</p>}
              </div>
            </div>
          )}

          {/* Step 2: Información básica */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <ValidatedInput
                label="Nombre de la Instancia"
                value={form.nombre_instancia}
                onChange={(value) => updateField("nombre_instancia", value)}
                onBlur={() => setTouched({ ...touched, nombre_instancia: true })}
                error={fieldErrors.nombre_instancia}
                touched={touched.nombre_instancia}
                placeholder="Ej: Oratoria Ejecutiva - Q1 2026"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={label} style={{ color: CHARCOAL }}>Fecha Inicio <span style={{ color: "#ef4444" }}>*</span></label>
                  <input type="date" value={form.fecha_inicio} onChange={e => updateField("fecha_inicio", e.target.value)}
                    className={dateC} style={{ ...dateStyle, borderColor: getError("fecha_inicio") ? "#ef4444" : BORDER }} />
                  {getError("fecha_inicio") && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{getError("fecha_inicio")}</p>}
                </div>
                <div>
                  <label className={label} style={{ color: CHARCOAL }}>Fecha Fin <span style={{ color: "#ef4444" }}>*</span></label>
                  <input type="date" value={form.fecha_fin} onChange={e => updateField("fecha_fin", e.target.value)}
                    className={dateC} style={{ ...dateStyle, borderColor: getError("fecha_fin") ? "#ef4444" : BORDER }} />
                  {getError("fecha_fin") && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{getError("fecha_fin")}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={label} style={{ color: CHARCOAL }}>Hora Inicio <span style={{ color: "#ef4444" }}>*</span></label>
                  <input type="time" value={form.hora_inicio} onChange={e => updateField("hora_inicio", e.target.value)}
                    className={dateC} style={{ ...dateStyle, borderColor: getError("hora_inicio") ? "#ef4444" : BORDER }} />
                  {getError("hora_inicio") && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{getError("hora_inicio")}</p>}
                </div>
                <div>
                  <label className={label} style={{ color: CHARCOAL }}>Hora Fin <span style={{ color: "#ef4444" }}>*</span></label>
                  <input type="time" value={form.hora_fin} onChange={e => updateField("hora_fin", e.target.value)}
                    className={dateC} style={{ ...dateStyle, borderColor: getError("hora_fin") ? "#ef4444" : BORDER }} />
                  {getError("hora_fin") && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{getError("hora_fin")}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Días de clase */}
          {currentStep === 3 && (
            <DiasSemanaPicker
              selected={form.dias_semana}
              onChange={(dias) => updateField("dias_semana", dias)}
              error={getError("dias_semana")}
            />
          )}

          {/* Step 4: Configuración */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={label} style={{ color: CHARCOAL }}>Capacidad Máxima <span style={{ color: "#ef4444" }}>*</span></label>
                  <input type="number" min={1} max={99} value={form.capacidad_maxima}
                    onChange={e => updateField("capacidad_maxima", parseInt(e.target.value) || 1)}
                    className={inputC} style={{ ...borderS, borderColor: getError("capacidad_maxima") ? "#ef4444" : BORDER }} />
                  {getError("capacidad_maxima") && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{getError("capacidad_maxima")}</p>}
                  {!isEdit && (
                    <p className="text-xs mt-1" style={{ color: TEXT_MUTED }}>
                      {selectedCatalogo?.categoria === "regular" && form.modalidad === "presencial"
                        ? "Capacidad fija para cursos regulares presenciales: 18 estudiantes"
                        : "Capacidad abierta para modalidades virtuales y otros tipos"}
                    </p>
                  )}
                </div>
                <div>
                  <label className={label} style={{ color: CHARCOAL }}>Precio Base <span style={{ color: "#ef4444" }}>*</span></label>
                  <input type="number" min={0} step="0.01" value={form.precio_base}
                    onChange={e => updateField("precio_base", e.target.value)} placeholder="0.00"
                    className={inputC} style={{ ...borderS, borderColor: getError("precio_base") ? "#ef4444" : BORDER }} />
                  {getError("precio_base") && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{getError("precio_base")}</p>}
                </div>
              </div>
              <div>
                <label className={label} style={{ color: CHARCOAL }}>Modalidad</label>
                <div className="flex gap-3">
                  {(["presencial", "virtual"] as const).map(m => (
                    <button key={m} type="button" onClick={() => updateField("modalidad", m)}
                      className="flex-1 px-3 py-3 rounded-lg text-sm font-semibold border transition-all uppercase tracking-wide capitalize"
                      style={{
                        backgroundColor: form.modalidad === m ? ACCENT : "white",
                        borderColor: form.modalidad === m ? ACCENT : BORDER,
                        color: form.modalidad === m ? "white" : TEXT_MUTED,
                      }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={label} style={{ color: CHARCOAL }}>Ciudad (Opcional)</label>
                <select value={form.ciudad_id} onChange={e => updateField("ciudad_id", e.target.value ? parseInt(e.target.value, 10) : 0)}
                  className={inputC} style={borderS}>
                  <option value="">Seleccionar ciudad...</option>
                  {ciudades.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className={label} style={{ color: CHARCOAL }}>Observaciones (Opcional)</label>
                <textarea value={form.observaciones} onChange={e => updateField("observaciones", e.target.value)}
                  className={`${inputC} resize-none`} style={borderS} rows={3} placeholder="Notas adicionales sobre el curso..." />
              </div>
            </div>
          )}

          {/* Step 5: Módulos */}
          {currentStep === 5 && (
            <div className="space-y-4">
              {form.modulos.length === 0 ? (
                <div className="p-8 text-center rounded-lg border" style={{ borderColor: BORDER }}>
                  <p style={{ color: TEXT_MUTED }}>Este catálogo no tiene módulos configurados</p>
                  <button type="button" onClick={agregarModulo}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: ACCENT }}>
                    <Plus size={16} />Agregar Módulo
                  </button>
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${ACCENT} 5%, white)` }}>
                    <p className="text-xs font-semibold" style={{ color: ACCENT }}>
                      Las fechas se distribuyen automáticamente al agregar o quitar módulos. Puedes ajustar cada fecha manualmente.
                    </p>
                  </div>
                  {getError("modulos") && (
                    <p className="text-xs font-medium" style={{ color: "#ef4444" }}>{getError("modulos")}</p>
                  )}
                  <div className={`space-y-3 ${hiddenScroll} max-h-[400px]`}>
                    {form.modulos.map((mod, i) => (
                      <div key={i} className="p-4 rounded-lg border bg-white relative" style={{
                        borderColor: (getError(`modulo_${i}_nombre`) || getError(`modulo_${i}_inicio`) || getError(`modulo_${i}_fin`)) ? "#ef4444" : BORDER,
                      }}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                            style={{ backgroundColor: `color-mix(in srgb, ${ACCENT} 12%, transparent)`, color: ACCENT }}>
                            Módulo {i + 1}
                          </span>
                          {form.modulos.length > 1 && (
                            <button type="button" onClick={() => eliminarModulo(i)}
                              className="ml-auto p-1.5 rounded-lg transition-all hover:bg-red-50"
                              style={{ color: "#ef4444" }}
                              title="Eliminar módulo">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        <input type="text" value={mod.nombre}
                          onChange={e => setForm(prev => ({ ...prev, modulos: prev.modulos.map((m, j) => j === i ? { ...m, nombre: e.target.value } : m) }))}
                          placeholder="Nombre del módulo" className={inputC}
                          style={{ ...borderS, borderColor: getError(`modulo_${i}_nombre`) ? "#ef4444" : BORDER }} />
                        {getError(`modulo_${i}_nombre`) && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{getError(`modulo_${i}_nombre`)}</p>}
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div>
                            <label className="text-xs font-semibold mb-1.5 block" style={{ color: TEXT_MUTED }}>Fecha Inicio</label>
                            <input type="date" value={mod.fecha_inicio}
                              onChange={e => setForm(prev => ({ ...prev, modulos: prev.modulos.map((m, j) => j === i ? { ...m, fecha_inicio: e.target.value } : m) }))}
                              className={dateC} style={{ ...borderS, borderColor: getError(`modulo_${i}_inicio`) ? "#ef4444" : BORDER, colorScheme: "light" }} />
                          </div>
                          <div>
                            <label className="text-xs font-semibold mb-1.5 block" style={{ color: TEXT_MUTED }}>Fecha Fin</label>
                            <input type="date" value={mod.fecha_fin}
                              onChange={e => cascadeModuleDates(i, e.target.value)}
                              className={dateC} style={{ ...borderS, borderColor: getError(`modulo_${i}_fin`) ? "#ef4444" : BORDER, colorScheme: "light" }} />
                          </div>
                        </div>
                        <div className="mt-3 p-2 rounded text-xs" style={{ backgroundColor: `color-mix(in srgb, ${ACCENT} 5%, white)`, color: TEXT_MUTED }}>
                          Duración: {mod.fecha_inicio && mod.fecha_fin ? Math.ceil((new Date(mod.fecha_fin).getTime() - new Date(mod.fecha_inicio).getTime()) / (1000 * 60 * 60 * 24) + 1) : "?"} días
                          {i === form.modulos.length - 1 && <span className="ml-2"> · Anclado a fin del curso: {form.fecha_fin}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={agregarModulo}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed text-sm font-semibold transition-all hover:bg-gray-50"
                    style={{ borderColor: BORDER, color: ACCENT }}>
                    <Plus size={16} />Agregar Módulo
                  </button>
                </>
              )}
            </div>
          )}

          {/* Footer - navigation */}
          <div className="flex gap-3 pt-6 mt-6 border-t" style={{ borderColor: BORDER }}>
            <button type="button" onClick={handlePrevStep} disabled={currentStep === 1}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold border transition-all"
              style={{
                backgroundColor: currentStep === 1 ? "#f3f4f6" : "white",
                color: currentStep === 1 ? TEXT_MUTED : CHARCOAL,
                borderColor: BORDER,
                opacity: currentStep === 1 ? 0.5 : 1,
                cursor: currentStep === 1 ? "not-allowed" : "pointer",
              }}>
              <ChevronLeft size={18} />Anterior
            </button>

            {currentStep < 5 ? (
              <button type="button" onClick={handleNextStep}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white transition-all active:scale-95"
                style={{ backgroundColor: ACCENT }}>
                Siguiente<ChevronRight size={18} />
              </button>
            ) : (
              <button type="button" disabled={loading} onClick={handleSubmit}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-white transition-all active:scale-95"
                style={{ backgroundColor: ACCENT, opacity: loading ? 0.6 : 1 }}>
                {loading ? (isEdit ? "Actualizando..." : "Creando...") : (isEdit ? "Guardar Cambios" : "Crear Curso")}
              </button>
            )}

            <button type="button" onClick={() => navigate("/cursos")}
              className="px-4 py-3 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-all"
              style={{ color: TEXT_MUTED }}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DiasSemanaPicker({ selected, onChange, error }: { selected: number[]; onChange: (d: number[]) => void; error?: string }) {
  const dias = [
    { value: 1, label: "Lun" }, { value: 2, label: "Mar" }, { value: 3, label: "Mié" },
    { value: 4, label: "Jue" }, { value: 5, label: "Vie" }, { value: 6, label: "Sáb" }, { value: 7, label: "Dom" },
  ]
  const toggle = (value: number) => {
    if (selected.includes(value)) onChange(selected.filter(v => v !== value))
    else onChange([...selected, value].sort())
  }
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 5%, white)` }}>
        <p className="text-xs font-semibold" style={{ color: COLORS.ACCENT }}>Selecciona los días de la semana en que se impartirá el curso</p>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {dias.map(d => {
          const isSelected = selected.includes(d.value)
          return (
            <button key={d.value} type="button" onClick={() => toggle(d.value)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all"
              style={{
                borderColor: isSelected ? COLORS.ACCENT : COLORS.BORDER_SUBTLE,
                backgroundColor: isSelected ? COLORS.ACCENT : "white",
                color: isSelected ? "white" : COLORS.TEXT_MUTED,
              }}>
              <span className="text-sm font-bold">{d.label}</span>
            </button>
          )
        })}
      </div>
      <div className="flex justify-between text-xs" style={{ color: COLORS.TEXT_MUTED }}>
        <span>{selected.length} día{selected.length !== 1 ? "s" : ""} seleccionado{selected.length !== 1 ? "s" : ""}</span>
        <button type="button" onClick={() => onChange([1, 2, 3, 4, 5])}
          className="font-medium hover:underline" style={{ color: COLORS.ACCENT }}>
          Lun-Vie (por defecto)
        </button>
      </div>
      {error && <p className="text-xs mt-1" style={{ color: "#ef4444" }}>• {error}</p>}
    </div>
  )
}
