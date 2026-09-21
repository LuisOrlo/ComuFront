import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  BookOpen,
  Building2,
  Calendar,
  Check,
  Clock,
  CreditCard,
  Eye,
  FileCheck,
  GraduationCap,
  Layers,
  Loader2,
  Mail,
  Monitor,
  Phone,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react"
import { COLORS } from "@/lib/constants"
import { cursosService, type CursoAbierto } from "@/services/cursos.service"
import { cursosPersonalizadosService, type CursoPersonalizado } from "@/services/cursosPersonalizados.service"
import { tallerService, type Taller } from "@/services/taller.service"
import { estudiantesService } from "@/services/estudiantes.service"
import { PagoPreAprobacionSection, type PagoPreAprobacionRef } from "@/pages/matriculas/PagoPreAprobacionSection"
import { toast } from "sonner"

type TipoInscripcion = "curso" | "personalizado" | "taller"
const metodosPago = [
  { value: "transferencia", label: "Depósito / Transferencia" },
  { value: "efectivo", label: "Efectivo" },
]

function formatDate(value?: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" })
}

function formatTime(value?: string | null) {
  return value ? value.slice(0, 5) : ""
}

function formatEnrollmentError(error: unknown) {
  const typedError = error as {
    response?: {
      status?: number
      data?: { mensaje?: string; message?: string; conflictos?: Array<Record<string, unknown>> }
    }
  }
  if (!typedError.response) return "No se pudo completar la inscripción. Inténtalo nuevamente."

  const data = typedError.response.data
  const base = data?.mensaje || data?.message || "Error al inscribir estudiante"
  if (!Array.isArray(data?.conflictos) || !data.conflictos.length) return base

  const details = data.conflictos.map((conflict) => {
    const name = String(conflict.nombre || "actividad")
    const day = String(conflict.dia || "")
    const start = String(conflict.hora_inicio || "").slice(0, 5)
    const end = String(conflict.hora_fin || "").slice(0, 5)
    const from = formatDate(String(conflict.fecha_inicio || ""))
    const to = formatDate(String(conflict.fecha_fin || ""))
    return `${name}: ${day} ${start} - ${end} · ${from} - ${to}`
  })

  return `${base}\n${details.join("\n")}`
}

function availability(occupied: number, capacity?: number) {
  if (capacity === undefined || capacity === null) return "Cupos no disponibles"
  const libres = Math.max(0, capacity - occupied)
  return `${libres} cupo${libres !== 1 ? "s" : ""} disponible${libres !== 1 ? "s" : ""} de ${capacity}`
}

interface ComprobanteUploaderProps {
  file: File | null
  onChange: (file: File | null) => void
}

function ComprobanteUploader({ file, onChange }: ComprobanteUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(2) + " MB"
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-700">
        Comprobante de pago <span className="font-normal text-slate-400">(Opcional)</span>
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const f = e.target.files?.[0] || null
          onChange(f)
        }}
        className="hidden"
      />

      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 transition hover:border-orange-400 hover:bg-orange-50/20"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-xs transition-transform group-hover:scale-105 text-slate-400 group-hover:text-orange-500">
            <UploadCloud size={20} />
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-700 group-hover:text-orange-600">
            Haz clic para adjuntar comprobante
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">JPG, PNG o WEBP hasta 5 MB</p>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            {previewUrl ? (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="group relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-slate-200 shadow-xs"
                title="Ver comprobante en pantalla completa"
              >
                <img
                  src={previewUrl}
                  alt="Vista previa"
                  className="h-full w-full object-cover transition duration-200 group-hover:scale-110"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <Eye size={16} />
                </div>
              </button>
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                <FileCheck size={22} />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 truncate" title={file.name}>
                {file.name}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {formatFileSize(file.size)} · <span className="font-medium text-emerald-600">Comprobante cargado</span>
              </p>
              <div className="mt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 hover:underline"
                >
                  <Eye size={12} /> Ver previsualización
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] font-medium text-slate-500 hover:text-slate-700"
                >
                  Cambiar
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onChange(null)
              if (fileInputRef.current) fileInputRef.current.value = ""
            }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-500"
            title="Quitar archivo"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      {/* Modal Lightbox Previsualizador */}
      {showModal && previewUrl && file && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative max-h-[90vh] max-w-2xl w-full overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50/50">
              <div className="flex items-center gap-2 min-w-0">
                <FileCheck size={16} className="text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-slate-800 truncate">{file.name}</span>
                <span className="text-[11px] text-slate-400 shrink-0">({formatFileSize(file.size)})</span>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex max-h-[75vh] items-center justify-center overflow-auto bg-slate-950/5 p-4">
              <img
                src={previewUrl}
                alt="Comprobante de pago"
                className="max-h-[70vh] w-auto rounded-lg object-contain shadow-sm border border-slate-200"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function InscribirEstudiantePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [tipo, setTipo] = useState<TipoInscripcion>("curso")
  const [estudiante, setEstudiante] = useState<Record<string, unknown> | null>(null)
  const [loadingEstudiante, setLoadingEstudiante] = useState(true)
  const [loadingOfertas, setLoadingOfertas] = useState(false)
  const [search, setSearch] = useState("")
  const [mostrarCursosHistoricos, setMostrarCursosHistoricos] = useState(false)
  const [cursos, setCursos] = useState<CursoAbierto[]>([])
  const [personalizados, setPersonalizados] = useState<CursoPersonalizado[]>([])
  const [talleres, setTalleres] = useState<Taller[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [metodoCurso, setMetodoCurso] = useState("transferencia")
  const [cursoPagoValido, setCursoPagoValido] = useState(false)
  const [sinRegistroFinanciero, setSinRegistroFinanciero] = useState(false)
  const cursoPagoRef = useRef<PagoPreAprobacionRef>(null)
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null)
  const [pagoInicial, setPagoInicial] = useState("")
  const [metodoPersonalizado, setMetodoPersonalizado] = useState("transferencia")
  const [montoTaller, setMontoTaller] = useState("")
  const [metodoTaller, setMetodoTaller] = useState("transferencia")

  useEffect(() => {
    if (!id) return
    setLoadingEstudiante(true)
    estudiantesService
      .getStudentById(id)
      .then((data) => setEstudiante(data as unknown as Record<string, unknown>))
      .catch(() => {
        toast.error("Error al cargar estudiante")
        navigate("/estudiantes")
      })
      .finally(() => setLoadingEstudiante(false))
  }, [id, navigate])

  useEffect(() => {
    setLoadingOfertas(true)
    setSelectedId(null)
    setSearch("")
    setCursoPagoValido(false)
    setSinRegistroFinanciero(false)
    setComprobanteFile(null)

    const load =
      tipo === "curso"
        ? mostrarCursosHistoricos
          ? cursosService.getCursosAbiertosGestion({ per_page: 100, historicos: true }).then((courses) =>
              setCursos(courses.filter((course) => !course.es_personalizado))
            )
          : cursosService
              .getCursosAbiertosParaInscripcion({ per_page: 100 })
              .then((response) =>
                setCursos(((response as { data?: CursoAbierto[] }).data || []).filter((course) => !course.es_personalizado))
              )
        : tipo === "personalizado"
          ? cursosPersonalizadosService
              .listar({ per_page: 100 })
              .then((response) =>
                setPersonalizados(
                  response.data.filter(
                    (course) => course.es_activo && course.estado_visual !== "finalizado" && course.estado_visual !== "lleno"
                  )
                )
              )
          : tallerService.listar().then((response) => setTalleres(((response.data || response.datos || []) as Taller[])))

    load
      .catch(() => {
        toast.error("No se pudieron cargar las ofertas disponibles.")
        if (tipo === "curso") setCursos([])
        if (tipo === "personalizado") setPersonalizados([])
        if (tipo === "taller") setTalleres([])
      })
      .finally(() => setLoadingOfertas(false))
  }, [tipo, mostrarCursosHistoricos])

  const selectedCurso = tipo === "curso" ? cursos.find((course) => course.id === selectedId) : undefined
  const selectedPersonalizado =
    tipo === "personalizado" ? personalizados.find((course) => course.id === selectedId) : undefined
  const selectedTaller = tipo === "taller" ? talleres.find((taller) => taller.id === selectedId) : undefined

  const filteredCursos = useMemo(
    () =>
      cursos.filter((course) =>
        (course.nombre_instancia || course.catalogo?.nombre || "").toLowerCase().includes(search.toLowerCase())
      ),
    [cursos, search]
  )
  const filteredPersonalizados = useMemo(
    () => personalizados.filter((course) => course.nombre.toLowerCase().includes(search.toLowerCase())),
    [personalizados, search]
  )
  const filteredTalleres = useMemo(
    () => talleres.filter((taller) => taller.nombre.toLowerCase().includes(search.toLowerCase())),
    [talleres, search]
  )

  const submitCurso = async (pagos: Record<string, unknown>[], metodoPago: string) => {
    if (!id || !selectedCurso) return
    setSaving(true)
    try {
      const comprobante = !sinRegistroFinanciero && comprobanteFile ? await cursosService.uploadComprobante(comprobanteFile) : undefined
      await cursosService.inscribirEstudianteDesdePerfil({
        estudiante_id: id,
        curso_abierto_id: selectedCurso.id,
        pagos,
        metodo_pago: metodoPago,
        sin_registro_financiero: sinRegistroFinanciero,
        archivo_comprobante_url: comprobante?.url,
      })
      toast.success(
        `Inscripción registrada en ${selectedCurso.nombre_instancia || selectedCurso.catalogo?.nombre || "el curso"}`
      )
      navigate(`/estudiantes/${id}/academico`)
    } catch (error: unknown) {
      toast.error(formatEnrollmentError(error))
    } finally {
      setSaving(false)
    }
  }

  const submitPersonalizado = async () => {
    if (!id || !selectedPersonalizado) return
    const precio = Number(selectedPersonalizado.precio_total || 0)
    const pago = Number(pagoInicial || 0)
    if (!Number.isFinite(pago) || pago <= 0 || pago > precio) {
      toast.error("El pago inicial debe ser mayor que $0 y no superar el precio total.")
      return
    }
    setSaving(true)
    try {
      const comprobante = comprobanteFile ? await cursosService.uploadComprobante(comprobanteFile) : undefined
      await cursosService.inscribirEstudianteDesdePerfil({
        estudiante_id: id,
        curso_abierto_id: selectedPersonalizado.id,
        pagos: [],
        pago_inicial: pago,
        metodo_pago: metodoPersonalizado,
        archivo_comprobante_url: comprobante?.url,
      })
      toast.success(`Inscripción registrada en ${selectedPersonalizado.nombre}`)
      navigate(`/estudiantes/${id}/academico`)
    } catch (error: unknown) {
      toast.error(formatEnrollmentError(error))
    } finally {
      setSaving(false)
    }
  }

  const submitTaller = async () => {
    if (!id || !selectedTaller) return
    const precio = Number(selectedTaller.precio || 0)
    const monto = Number(montoTaller || 0)
    if (precio > 0 && monto <= 0) {
      toast.error("Ingresa un monto mayor a $0 para este taller.")
      return
    }
    setSaving(true)
    try {
      const comprobante = comprobanteFile ? await cursosService.uploadComprobante(comprobanteFile) : undefined
      await tallerService.inscribirEstudianteDesdePerfil({
        estudiante_id: id,
        taller_id: selectedTaller.id,
        monto_pagado: monto,
        metodo_pago: metodoTaller,
        comprobante_url: comprobante?.url,
      })
      toast.success(`Inscripción registrada en ${selectedTaller.nombre}`)
      navigate(`/estudiantes/${id}/academico`)
    } catch (error: unknown) {
      toast.error(formatEnrollmentError(error))
    } finally {
      setSaving(false)
    }
  }

  if (loadingEstudiante) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 size={28} className="animate-spin text-orange-500" />
          <span className="text-sm font-medium">Cargando datos del estudiante...</span>
        </div>
      </div>
    )
  }

  const nombre = estudiante ? `${estudiante.nombres || ""} ${estudiante.apellidos || ""}`.trim() : "—"
  const cedula = estudiante ? String(estudiante.cedula || "—") : "—"
  const correo = estudiante?.correo ? String(estudiante.correo) : null
  const telefono = estudiante?.telefono ? String(estudiante.telefono) : null
  const inicial = (estudiante?.nombres as string)?.[0] || (estudiante?.apellidos as string)?.[0] || "E"

  const personalizadoSaldo = selectedPersonalizado
    ? Math.max(0, Number(selectedPersonalizado.precio_total) - Number(pagoInicial || 0))
    : 0

  const empty =
    (tipo === "curso" && !filteredCursos.length) ||
    (tipo === "personalizado" && !filteredPersonalizados.length) ||
    (tipo === "taller" && !filteredTalleres.length)

  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-50/50 pb-12">
      {/* Header Contextual */}
      <header className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span style={{ color: COLORS.ACCENT }}>Estudiantes</span>
            <span className="text-slate-300">/</span>
            <span>Perfil Académico</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-700">Inscripción</span>
          </div>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inscribir estudiante</h1>
              <p className="mt-0.5 text-xs text-slate-500">
                Selecciona una oferta formativa disponible y formaliza el registro administrativo.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/estudiantes/${id}/academico`)}
              className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-xs transition hover:bg-slate-50 hover:text-slate-900"
            >
              <ArrowLeft size={14} />
              Volver al perfil
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 space-y-6">
        {/* 1. Tarjeta Resumen del Estudiante */}
        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white shadow-sm"
              style={{ backgroundColor: COLORS.ACCENT }}
            >
              {inicial.toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 truncate">{nombre}</h2>
                <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
                  Estudiante
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <CreditCard size={13} className="text-slate-400" />
                  C.I. {cedula}
                </span>
                {correo && (
                  <span className="inline-flex items-center gap-1">
                    <Mail size={13} className="text-slate-400" />
                    {correo}
                  </span>
                )}
                {telefono && (
                  <span className="inline-flex items-center gap-1">
                    <Phone size={13} className="text-slate-400" />
                    {telefono}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 2. Selector de Tipo de Oferta (Tabs Modernos) */}
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-slate-200/80 bg-slate-100/70 p-1">
          {(
            [
              ["curso", "Curso Regular", BookOpen],
              ["personalizado", "Curso personalizado", Sparkles],
              ["taller", "Taller", Layers],
            ] as const
          ).map(([value, label, Icon]) => {
            const active = tipo === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setTipo(value)
                  setMostrarCursosHistoricos(false)
                  setPagoInicial("")
                  setMontoTaller("")
                }}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                  active
                    ? "bg-white text-slate-900 shadow-xs ring-1 ring-black/5"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon size={15} className={active ? "text-orange-500" : "text-slate-400"} />
                <span>{label}</span>
              </button>
            )
          })}
        </div>

        {/* 3. Buscador y Listado de Ofertas */}
        <section className="space-y-3">
          {tipo === "curso" && (
            <div className="flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-800">
                  {mostrarCursosHistoricos ? "Cursos históricos" : "Cursos disponibles para matrícula"}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {mostrarCursosHistoricos
                    ? "Listado administrativo para completar registros de cursos anteriores."
                    : "Incluye cursos futuros y cursos que iniciaron hace siete días o menos."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMostrarCursosHistoricos((current) => !current)
                  setSelectedId(null)
                  setSearch("")
                  setSinRegistroFinanciero(false)
                }}
                className="shrink-0 rounded-lg border border-orange-200 px-3 py-2 text-xs font-semibold text-orange-700 transition-colors hover:bg-orange-50"
              >
                {mostrarCursosHistoricos ? "Volver a cursos disponibles" : "Ver cursos históricos"}
              </button>
            </div>
          )}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Buscar ${
                tipo === "curso" ? "curso regular" : tipo === "personalizado" ? "curso personalizado" : "taller"
              } por nombre...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-9 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {loadingOfertas ? (
            <div className="rounded-xl border border-slate-200/80 bg-white py-12 text-center text-xs text-slate-400">
              <Loader2 size={24} className="mx-auto mb-2 animate-spin text-orange-500" />
              Cargando ofertas disponibles...
            </div>
          ) : (
            <div className="grid gap-2.5 max-h-[350px] overflow-y-auto pr-1">
              {/* Ofertas Tipo Curso */}
              {tipo === "curso" &&
                filteredCursos.map((course) => {
                  const occupied = course.total_matriculas ?? course.matriculas?.length ?? 0
                  const isSelected = selectedId === course.id
                  return (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(isSelected ? null : course.id)
                        setSinRegistroFinanciero(false)
                        setComprobanteFile(null)
                      }}
                      className={`group relative flex flex-col justify-between gap-3 rounded-xl border p-4 text-left transition-all sm:flex-row sm:items-center ${
                        isSelected
                          ? "border-orange-500 bg-orange-50/25 ring-1 ring-orange-400 shadow-xs"
                          : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-sm font-bold transition-colors ${
                              isSelected ? "text-orange-900" : "text-slate-900 group-hover:text-orange-600"
                            }`}
                          >
                            {course.nombre_instancia || course.catalogo?.nombre || "Curso sin nombre"}
                          </p>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            {course.modalidad === "virtual" ? <Monitor size={13} /> : <Building2 size={13} />}
                            <span className="capitalize">{course.modalidad || "Presencial"}</span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar size={13} />
                            {formatDate(course.fecha_inicio)}
                          </span>
                          <span className="font-semibold text-slate-700">
                            ${Number(course.precio_base || 0).toFixed(2)} USD
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isSelected ? "bg-orange-100 text-orange-800" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {availability(occupied, course.capacidad_maxima)}
                        </span>
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600">
                            <Check size={14} /> Seleccionado
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}

              {/* Ofertas Tipo Curso Personalizado */}
              {tipo === "personalizado" &&
                filteredPersonalizados.map((course) => {
                  const isSelected = selectedId === course.id
                  return (
                    <button
                      key={course.id}
                      type="button"
                      onClick={() => setSelectedId(isSelected ? null : course.id)}
                      className={`group relative flex flex-col justify-between gap-3 rounded-xl border p-4 text-left transition-all sm:flex-row sm:items-center ${
                        isSelected
                          ? "border-orange-500 bg-orange-50/25 ring-1 ring-orange-400 shadow-xs"
                          : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-bold transition-colors ${
                            isSelected ? "text-orange-900" : "text-slate-900 group-hover:text-orange-600"
                          }`}
                        >
                          {course.nombre}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            {course.modalidad === "virtual" ? <Monitor size={13} /> : <Building2 size={13} />}
                            <span className="capitalize">{course.modalidad}</span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar size={13} />
                            {formatDate(course.fecha_inicio)}
                          </span>
                          {(course.hora_inicio || course.hora_fin) && (
                            <span className="inline-flex items-center gap-1">
                              <Clock size={13} />
                              {formatTime(course.hora_inicio)}
                              {course.hora_fin ? ` - ${formatTime(course.hora_fin)}` : ""}
                            </span>
                          )}
                          <span className="font-semibold text-slate-700">
                            ${Number(course.precio_total || 0).toFixed(2)} USD
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isSelected ? "bg-orange-100 text-orange-800" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {course.cupos_disponibles} cupos disponibles
                        </span>
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600">
                            <Check size={14} /> Seleccionado
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}

              {/* Ofertas Tipo Taller */}
              {tipo === "taller" &&
                filteredTalleres.map((taller) => {
                  const occupied = taller.inscripciones_count || taller.inscripciones?.length || 0
                  const isSelected = selectedId === taller.id
                  return (
                    <button
                      key={taller.id}
                      type="button"
                      onClick={() => setSelectedId(isSelected ? null : taller.id)}
                      className={`group relative flex flex-col justify-between gap-3 rounded-xl border p-4 text-left transition-all sm:flex-row sm:items-center ${
                        isSelected
                          ? "border-orange-500 bg-orange-50/25 ring-1 ring-orange-400 shadow-xs"
                          : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-bold transition-colors ${
                            isSelected ? "text-orange-900" : "text-slate-900 group-hover:text-orange-600"
                          }`}
                        >
                          {taller.nombre}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            {taller.modalidad === "virtual" ? <Monitor size={13} /> : <Building2 size={13} />}
                            <span className="capitalize">{taller.modalidad || "Presencial"}</span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar size={13} />
                            {formatDate(taller.fecha)}
                          </span>
                          <span className="font-semibold text-slate-700">
                            ${Number(taller.precio || 0).toFixed(2)} USD
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isSelected ? "bg-orange-100 text-orange-800" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {availability(occupied, taller.capacidad_maxima)}
                        </span>
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600">
                            <Check size={14} /> Seleccionado
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}

              {empty && (
                <div className="rounded-xl border border-slate-200/80 bg-white py-12 text-center text-slate-400">
                  <GraduationCap size={36} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600">No se encontraron ofertas disponibles</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {search ? "Prueba cambiando el término de búsqueda." : "No hay registros activos para este tipo."}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* 4. SECCIÓN DE PAGO (CURSO REGULAR) */}
        {selectedCurso && (
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-orange-600">
                Detalle Financiero del Curso
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                Pago · {selectedCurso.nombre_instancia || selectedCurso.catalogo?.nombre}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Registra los pagos por módulo si corresponde o inscribe al estudiante sin movimientos financieros.
              </p>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-orange-200 bg-orange-50/60 p-4">
              <input
                type="checkbox"
                checked={sinRegistroFinanciero}
                onChange={(event) => setSinRegistroFinanciero(event.target.checked)}
                className="mt-0.5 size-4 accent-[#fd761a]"
              />
              <span>
                <span className="block text-sm font-semibold text-slate-800">Inscribir sin registrar dinero</span>
                <span className="mt-0.5 block text-xs leading-5 text-slate-600">Úsalo para cursos históricos o casos sin respaldo financiero. No se crearán cargos, cuentas por cobrar ni transacciones para esta matrícula.</span>
              </span>
            </label>

            <div className={sinRegistroFinanciero ? "hidden" : "block"}>
              <PagoPreAprobacionSection
                ref={cursoPagoRef}
                cursoAbiertoId={selectedCurso.id}
                cursoNombre={selectedCurso.nombre_instancia || selectedCurso.catalogo?.nombre || "Curso"}
                metodoPagoInicial={metodoCurso}
                onMontoValidoChange={setCursoPagoValido}
                onSubmit={submitCurso}
              />
            </div>

            {!sinRegistroFinanciero && <div className="border-t border-slate-100 pt-5 space-y-4">
              {/* Previsualizador de comprobante */}
              <ComprobanteUploader file={comprobanteFile} onChange={setComprobanteFile} />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Método de pago
                </label>
                <select
                  value={metodoCurso}
                  onChange={(e) => setMetodoCurso(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm text-slate-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                >
                  {metodosPago.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => cursoPagoRef.current?.submit()}
                disabled={saving || !cursoPagoValido}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xs transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: COLORS.ACCENT }}
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? "Inscribiendo..." : "Inscribir al curso"}
              </button>
            </div>}
            {sinRegistroFinanciero && (
              <button
                type="button"
                onClick={() => void submitCurso([], "otro")}
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xs transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: COLORS.ACCENT }}
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? "Inscribiendo..." : "Inscribir sin registro financiero"}
              </button>
            )}
          </section>
        )}

        {/* 5. SECCIÓN DE PAGO (CURSO PERSONALIZADO) */}
        {selectedPersonalizado && (
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-5">
            <div className="flex flex-col gap-1 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-orange-600">
                  Planificación Financiera
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">
                  Pago inicial · {selectedPersonalizado.nombre}
                </h2>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 border border-slate-200/60">
                <span className="text-xs text-slate-500">Precio total:</span>
                <span className="text-sm font-bold text-slate-900">
                  ${Number(selectedPersonalizado.precio_total).toFixed(2)} USD
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Pago inicial ($ USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    min="0.01"
                    max={selectedPersonalizado.precio_total}
                    step="0.01"
                    value={pagoInicial}
                    onChange={(e) => setPagoInicial(e.target.value)}
                    placeholder={`Hasta $${Number(selectedPersonalizado.precio_total).toFixed(2)}`}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-7 pr-3 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
                  <span>Saldo resultante tras el pago:</span>
                  <span className="font-bold text-slate-700">${personalizadoSaldo.toFixed(2)} USD</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Método de pago
                </label>
                <select
                  value={metodoPersonalizado}
                  onChange={(e) => setMetodoPersonalizado(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm text-slate-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                >
                  {metodosPago.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Previsualizador de comprobante */}
              <ComprobanteUploader file={comprobanteFile} onChange={setComprobanteFile} />

              <button
                type="button"
                onClick={submitPersonalizado}
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xs transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: COLORS.ACCENT }}
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? "Inscribiendo..." : "Inscribir curso personalizado"}
              </button>
            </div>
          </section>
        )}

        {/* 6. SECCIÓN DE PAGO (TALLER) */}
        {selectedTaller && (
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-5">
            <div className="flex flex-col gap-1 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-orange-600">
                  Arancel de Participación
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">
                  Pago · {selectedTaller.nombre}
                </h2>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 border border-slate-200/60">
                <span className="text-xs text-slate-500">Arancel fijado:</span>
                <span className="text-sm font-bold text-slate-900">
                  ${Number(selectedTaller.precio || 0).toFixed(2)} USD
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Monto a pagar ($ USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={montoTaller}
                    onChange={(e) => setMontoTaller(e.target.value)}
                    placeholder={String(selectedTaller.precio || "0")}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-7 pr-3 text-xs sm:text-sm text-slate-800 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Método de pago
                </label>
                <select
                  value={metodoTaller}
                  onChange={(e) => setMetodoTaller(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm text-slate-700 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                >
                  {metodosPago.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Previsualizador de comprobante */}
              <ComprobanteUploader file={comprobanteFile} onChange={setComprobanteFile} />

              <button
                type="button"
                onClick={submitTaller}
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xs transition hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: COLORS.ACCENT }}
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? "Inscribiendo..." : "Inscribir al taller"}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
