import { useEffect, useState, useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Building2,
  Monitor,
  MapPin,
  Edit,
  Trash2,
  Search,
  X,
  DollarSign,
  GraduationCap,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Copy,
  Check,
  TrendingUp,
  Receipt,
  UserCheck,
} from "lucide-react"
import { toast } from "sonner"
import { COLORS } from "@/lib/constants"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import {
  cursosPersonalizadosService,
  type CursoPersonalizado,
  type CursoPersonalizadoEstudiante,
  type FinanzasCursoPersonalizado,
} from "@/services/cursosPersonalizados.service"

const DIAS_LABEL: Record<number, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
  0: "Domingo",
}

const DIAS_SHORT: Record<number, string> = {
  1: "Lun",
  2: "Mar",
  3: "Mié",
  4: "Jue",
  5: "Vie",
  6: "Sáb",
  7: "Dom",
  0: "Dom",
}

const money = (value: number) =>
  "$" + Number(value || 0).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—"
  try {
    const raw = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr
    const [y, m, d] = raw.split("-").map(Number)
    if (!y || !m || !d) return dateStr
    const date = new Date(y, m - 1, d)
    return date.toLocaleDateString("es-EC", { day: "numeric", month: "short", year: "numeric" })
  } catch {
    return dateStr
  }
}

function getIniciales(nombre?: string) {
  if (!nombre) return "—"
  const parts = nombre.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function CursoPersonalizadoDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState<CursoPersonalizado | null>(null)
  const [students, setStudents] = useState<CursoPersonalizadoEstudiante[]>([])
  const [finance, setFinance] = useState<FinanzasCursoPersonalizado | null>(null)
  const [tab, setTab] = useState<"resumen" | "estudiantes" | "finanzas">("resumen")
  const [loading, setLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    if (!id) return
    setLoading(true)
    cursosPersonalizadosService
      .obtener(id)
      .then((result) => {
        setCourse(result.data)
        setStudents(result.estudiantes || [])
        setFinance(result.finanzas)
      })
      .catch(() => toast.error("No se pudo cargar el curso personalizado"))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  const handleDelete = async () => {
    if (!id) return
    setDeleting(true)
    try {
      await cursosPersonalizadosService.eliminar(id)
      toast.success("Curso personalizado eliminado correctamente")
      navigate("/cursos-personalizados")
    } catch {
      toast.error("El curso no se puede eliminar si cuenta con matrículas registradas")
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/60 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl border border-slate-100 shadow-sm max-w-sm w-full mx-4">
          <div className="size-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="font-bold text-slate-800 text-base">Cargando curso personalizado</h3>
          <p className="text-xs text-slate-500 mt-1">Obteniendo datos académicos y finanzas...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50/60 flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md w-full">
          <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <GraduationCap size={24} />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Curso no encontrado</h2>
          <p className="text-xs text-slate-500 mt-1">El curso personalizado solicitado no existe o fue eliminado.</p>
          <button
            onClick={() => navigate("/cursos-personalizados")}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition hover:brightness-110 active:scale-95"
            style={{ backgroundColor: COLORS.ACCENT }}
          >
            <ArrowLeft size={14} /> Volver al listado
          </button>
        </div>
      </div>
    )
  }

  // Visual state styling
  const estadoVisual = course.estado_visual || "proximo"
  const estadoConfig = {
    proximo: { label: "Próximo", bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200/80", dot: "bg-sky-500" },
    en_curso: { label: "En curso", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200/80", dot: "bg-emerald-500" },
    lleno: { label: "Cupos agotados", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200/80", dot: "bg-amber-500" },
    finalizado: { label: "Finalizado", bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200", dot: "bg-slate-400" },
  }[estadoVisual] || { label: estadoVisual, bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", dot: "bg-slate-400" }

  const ocupacionPorcentaje = Math.min(
    100,
    course.capacidad > 0 ? Math.round(((course.matriculados || 0) / course.capacidad) * 100) : 0
  )

  const precioUnitario = Number(course.precio_total) || 0
  const capacidad = Number(course.capacidad) || 1
  const totalProyectado = precioUnitario * capacidad
  const totalEsperado =
    finance?.total_esperado && finance.total_esperado > 0 ? finance.total_esperado : totalProyectado
  const totalAbonado = Number(finance?.total_abonado) || 0
  const saldoPendiente =
    finance?.saldo_pendiente && finance.saldo_pendiente > 0
      ? finance.saldo_pendiente
      : Math.max(0, totalEsperado - totalAbonado)

  const tabs = [
    { key: "resumen" as const, label: "Resumen General", icon: Calendar },
    { key: "estudiantes" as const, label: `Estudiantes (${students.length})`, icon: Users },
    { key: "finanzas" as const, label: "Finanzas & Pagos", icon: Receipt },
  ]

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Back Link */}
        <button
          onClick={() => navigate("/cursos-personalizados")}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-orange-600 transition-colors group cursor-pointer"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Volver a cursos personalizados
        </button>

        {/* ================= HEADER HERO CARD ================= */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs relative overflow-hidden">
          {/* Subtle decorative top border accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600" />

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-3.5 flex-1 min-w-0">
              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200/60">
                  <GraduationCap size={12} />
                  Curso personalizado
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    course.modalidad === "presencial"
                      ? "bg-blue-50 text-blue-700 border-blue-200/70"
                      : "bg-purple-50 text-purple-700 border-purple-200/70"
                  }`}
                >
                  {course.modalidad === "presencial" ? (
                    <>
                      <Building2 size={12} />
                      Presencial {course.ciudad ? `· ${course.ciudad}` : ""}
                    </>
                  ) : (
                    <>
                      <Monitor size={12} />
                      Modalidad Virtual
                    </>
                  )}
                </span>

                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${estadoConfig.bg} ${estadoConfig.text} ${estadoConfig.border}`}
                >
                  <span className={`size-1.5 rounded-full ${estadoConfig.dot}`} />
                  {estadoConfig.label}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight break-words">
                {course.nombre}
              </h1>

              {/* Meta details line */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-medium">
                  <div className="size-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-[10px]">
                    {course.docente ? getIniciales(`${course.docente.nombres} ${course.docente.apellidos}`) : "—"}
                  </div>
                  <span>
                    Docente:{" "}
                    <strong className="text-slate-800">
                      {course.docente ? `${course.docente.nombres} ${course.docente.apellidos}` : "Sin docente asignado"}
                    </strong>
                  </span>
                </div>

                <span className="text-slate-300 hidden sm:inline">•</span>

                <div className="flex items-center gap-1.5 font-medium">
                  <Calendar size={13} className="text-slate-400" />
                  <span>
                    {formatDate(course.fecha_inicio)} — {formatDate(course.fecha_fin)}
                  </span>
                </div>

                {course.hora_inicio && course.hora_fin && (
                  <>
                    <span className="text-slate-300 hidden sm:inline">•</span>
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock size={13} className="text-slate-400" />
                      <span>
                        {course.hora_inicio.slice(0, 5)} – {course.hora_fin.slice(0, 5)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate(`/cursos-personalizados/${id}/editar`)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-xs hover:brightness-110 active:scale-95 cursor-pointer"
                style={{ backgroundColor: COLORS.ACCENT }}
              >
                <Edit size={14} />
                Editar Curso
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50/80 hover:bg-rose-100/80 border border-rose-200/80 transition-all active:scale-95 cursor-pointer"
              >
                <Trash2 size={14} />
                Eliminar
              </button>
            </div>
          </div>
        </div>

        {/* ================= TABS NAVIGATION ================= */}
        <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto no-scrollbar">
          {tabs.map((item) => {
            const Icon = item.icon
            const active = tab === item.key
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
                  active
                    ? "border-orange-500 text-orange-600 bg-orange-50/40 rounded-t-xl"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                <Icon size={15} />
                {item.label}
              </button>
            )
          })}
        </div>

        {/* ================= TAB CONTENT ================= */}

        {/* 1. RESUMEN GENERAL */}
        {tab === "resumen" && (
          <div className="space-y-6">
            {/* KPI Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stat 1: Cupos & Ocupación */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ocupación de Cupos</span>
                  <div className="size-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Users size={16} />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-slate-900">{course.matriculados}</span>
                    <span className="text-xs text-slate-400 font-semibold">/ {course.capacidad} cupos</span>
                  </div>
                  <div className="mt-2.5 w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        ocupacionPorcentaje >= 100
                          ? "bg-amber-500"
                          : ocupacionPorcentaje >= 75
                          ? "bg-orange-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${ocupacionPorcentaje}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 flex items-center justify-between">
                    <span>{course.cupos_disponibles} disponibles</span>
                    <span className="font-bold text-slate-700">{ocupacionPorcentaje}%</span>
                  </p>
                </div>
              </div>

              {/* Stat 2: Inversión por estudiante */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Precio Unitario</span>
                  <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <DollarSign size={16} />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-extrabold text-slate-900">{money(course.precio_total)}</span>
                  <p className="text-[11px] text-slate-500 mt-1">Por participante matriculado</p>
                  <p className="text-[11px] text-emerald-700 font-semibold mt-2">
                    Proyección total: {money(course.precio_total * course.capacidad)}
                  </p>
                </div>
              </div>

              {/* Stat 3: Modalidad & Sede */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Modalidad & Sede</span>
                  <div className="size-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    {course.modalidad === "presencial" ? <Building2 size={16} /> : <Monitor size={16} />}
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-lg font-bold text-slate-900 capitalize">{course.modalidad}</span>
                  <p className="text-xs text-slate-600 font-medium mt-1 flex items-center gap-1.5">
                    {course.modalidad === "presencial" ? (
                      <>
                        <MapPin size={13} className="text-orange-500" />
                        {course.ciudad || "Sede no especificada"}
                      </>
                    ) : (
                      <>
                        <Monitor size={13} className="text-blue-500" />
                        Plataforma sincrónica online
                      </>
                    )}
                  </p>
                  <span className="inline-block mt-2 text-[11px] font-semibold text-slate-400">
                    {course.es_activo ? "Curso activo" : "Curso pausado"}
                  </span>
                </div>
              </div>

              {/* Stat 4: Horario Sincrónico */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Horario de Clases</span>
                  <div className="size-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock size={16} />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-lg font-bold text-slate-900">
                    {course.hora_inicio && course.hora_fin
                      ? `${course.hora_inicio.slice(0, 5)} – ${course.hora_fin.slice(0, 5)}`
                      : "Sin horario"}
                  </span>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {course.dias_semana && course.dias_semana.length > 0 ? (
                      course.dias_semana.map((dia) => (
                        <span
                          key={dia}
                          className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-700"
                        >
                          {DIAS_SHORT[dia] || dia}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400">Días sin especificar</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bento Grid: 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Col 1 & 2: Información Académica Detallada */}
              <div className="lg:col-span-2 space-y-6">
                {/* Academic Card */}
                <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
                  <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                    <div className="size-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                      <GraduationCap size={18} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Ficha Técnica Académica</h2>
                      <p className="text-xs text-slate-500">Parámetros operativos y programación del curso</p>
                    </div>
                  </div>

                  {/* Docente box */}
                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-extrabold text-base">
                      {course.docente ? getIniciales(`${course.docente.nombres} ${course.docente.apellidos}`) : "—"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Instructor responsable
                      </span>
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {course.docente ? `${course.docente.nombres} ${course.docente.apellidos}` : "Sin docente asignado"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {course.docente ? "Docente titular del curso personalizado" : "Puedes asignar un docente editando el curso"}
                      </p>
                    </div>
                  </div>

                  {/* Details dl */}
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="p-3.5 rounded-xl bg-slate-50/50 border border-slate-100">
                      <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha de Inicio</dt>
                      <dd className="mt-1 text-sm font-bold text-slate-800">{formatDate(course.fecha_inicio)}</dd>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50/50 border border-slate-100">
                      <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha de Fin</dt>
                      <dd className="mt-1 text-sm font-bold text-slate-800">{formatDate(course.fecha_fin)}</dd>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50/50 border border-slate-100">
                      <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Horario de Clase</dt>
                      <dd className="mt-1 text-sm font-bold text-slate-800">
                        {course.hora_inicio && course.hora_fin
                          ? `${course.hora_inicio.slice(0, 5)} a ${course.hora_fin.slice(0, 5)}`
                          : "No definido"}
                      </dd>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50/50 border border-slate-100">
                      <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Días de Dictado</dt>
                      <dd className="mt-1 text-sm font-bold text-slate-800">
                        {course.dias_semana && course.dias_semana.length > 0
                          ? course.dias_semana.map((d) => DIAS_LABEL[d] || d).join(", ")
                          : "Sesión única o flexible"}
                      </dd>
                    </div>
                  </dl>

                  {/* Description Box */}
                  <div className="pt-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">
                      Descripción y Objetivos
                    </span>
                    <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/60 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {course.descripcion || "No se ha registrado una descripción detallada para este curso."}
                    </div>
                  </div>
                </section>
              </div>

              {/* Col 3: Side summary cards */}
              <div className="space-y-6">
                {/* Financial Summary Card */}
                <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Receipt size={16} className="text-orange-600" />
                      <h3 className="text-sm font-bold text-slate-800">Resumen Financiero</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTab("finanzas")}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
                    >
                      Ver detalle →
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                      <span className="text-slate-600 font-medium">Facturación esperada:</span>
                      <strong className="text-slate-900 font-bold">
                        {money(totalEsperado)}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 text-emerald-800">
                      <span className="font-medium">Total recaudado:</span>
                      <strong className="font-bold">{money(totalAbonado)}</strong>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/60 text-rose-800">
                      <span className="font-medium">Saldo por cobrar:</span>
                      <strong className="font-bold">{money(saldoPendiente)}</strong>
                    </div>
                  </div>

                  {finance && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Cuentas al día: {finance.cuentas_pagadas}</span>
                      <span>Pendientes: {finance.cuentas_pendientes}</span>
                    </div>
                  )}
                </section>

                {/* Quick Student Access Card */}
                <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-purple-600" />
                      <h3 className="text-sm font-bold text-slate-800">Estudiantes ({students.length})</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTab("estudiantes")}
                      className="text-xs font-bold text-purple-600 hover:text-purple-700 cursor-pointer"
                    >
                      Ver todos →
                    </button>
                  </div>

                  {students.length === 0 ? (
                    <div className="text-center py-6">
                      <Users size={24} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-xs text-slate-500 font-medium">Sin estudiantes inscritos aún</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {students.slice(0, 3).map((st) => (
                        <div
                          key={st.matricula_id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/70 transition-colors"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-bold text-slate-800 truncate">
                              {st.estudiante?.nombre || "Sin nombre"}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">{st.estudiante?.correo || "Sin correo"}</p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                              st.estado_financiero === "pagado"
                                ? "bg-emerald-100 text-emerald-800"
                                : st.estado_financiero === "abonado"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {st.estado_financiero || "Pendiente"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        )}

        {/* 2. LISTADO DE ESTUDIANTES */}
        {tab === "estudiantes" && <StudentTableSection students={students} />}

        {/* 3. FINANZAS Y FACTURACIÓN */}
        {tab === "finanzas" && <FinanceSection course={course} finance={finance} students={students} />}
      </div>

      {/* Confirmation Modal for Deletion */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="¿Eliminar este curso personalizado?"
        message={`Esta acción eliminará "${course.nombre}". Solo es posible eliminar cursos que no posean matrículas ni cobros vinculados.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        isDangerous
        isLoading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
        icon="trash"
      />
    </div>
  )
}

/* ========================================================================= */
/* SUB-COMPONENT: STUDENTS TABLE SECTION                                     */
/* ========================================================================= */

function StudentTableSection({ students }: { students: CursoPersonalizadoEstudiante[] }) {
  const [search, setSearch] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    if (!text || text === "—") return
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success("Cédula copiada al portapapeles")
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return students
    const q = search.toLowerCase()
    return students.filter(
      (s) =>
        s.estudiante?.nombre?.toLowerCase().includes(q) ||
        s.estudiante?.identificacion?.toLowerCase().includes(q) ||
        s.estudiante?.correo?.toLowerCase().includes(q)
    )
  }, [students, search])

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Table Header toolbar */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Estudiantes Matriculados</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro de participantes vinculados oficialmente a este curso personalizado.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, cédula o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-8 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all placeholder:text-slate-400 font-medium"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Users size={22} />
          </div>
          <p className="text-sm font-bold text-slate-700">
            {students.length === 0
              ? "No hay estudiantes matriculados en este curso"
              : "No se encontraron estudiantes que coincidan con la búsqueda"}
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {students.length === 0
              ? "Las inscripciones de este curso aparecerán aquí una vez aprobadas."
              : "Prueba buscando con otro término de búsqueda."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">Estudiante</th>
                <th className="py-3.5 px-4">Cédula / Identificación</th>
                <th className="py-3.5 px-4">Estado Matrícula</th>
                <th className="py-3.5 px-4 text-right">Monto Pagado</th>
                <th className="py-3.5 px-4 text-right">Saldo Pendiente</th>
                <th className="py-3.5 px-5 text-center">Estado Financiero</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.map((row) => {
                const finEstado = row.estado_financiero?.toLowerCase() || "pendiente"
                const badgeClass =
                  finEstado === "pagado"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : finEstado === "abonado"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"

                return (
                  <tr key={row.matricula_id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Estudiante Info */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-orange-100 text-orange-700 font-extrabold text-[11px] flex items-center justify-center shrink-0">
                          {getIniciales(row.estudiante?.nombre)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">
                            {row.estudiante?.nombre || "Sin nombre registrado"}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{row.estudiante?.correo || "Sin correo"}</p>
                        </div>
                      </div>
                    </td>

                    {/* Cédula */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {row.estudiante?.identificacion ? (
                        <div className="inline-flex items-center gap-1.5 font-mono text-slate-700 bg-slate-100/70 px-2 py-1 rounded-md">
                          <span>{row.estudiante.identificacion}</span>
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(row.estudiante?.identificacion || "", row.matricula_id)
                            }
                            className="text-slate-400 hover:text-orange-600 transition-colors cursor-pointer"
                            title="Copiar cédula"
                          >
                            {copiedId === row.matricula_id ? (
                              <Check size={12} className="text-emerald-600" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Estado Matrícula */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize bg-slate-100 text-slate-700">
                        <UserCheck size={11} className="text-slate-500" />
                        {row.estado_matricula || "Activo"}
                      </span>
                    </td>

                    {/* Monto Pagado */}
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {money(row.monto_pagado)}
                    </td>

                    {/* Saldo Pendiente */}
                    <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                      {money(row.saldo_pendiente)}
                    </td>

                    {/* Estado Financiero */}
                    <td className="py-3.5 px-5 text-center whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border capitalize ${badgeClass}`}>
                        {row.estado_financiero || "Pendiente"}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer count */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
        <span>
          Mostrando <strong>{filtered.length}</strong> de <strong>{students.length}</strong> estudiantes
        </span>
      </div>
    </div>
  )
}

/* ========================================================================= */
/* SUB-COMPONENT: FINANCE SECTION                                            */
/* ========================================================================= */

function FinanceSection({
  course,
  finance,
  students,
}: {
  course: CursoPersonalizado
  finance: FinanzasCursoPersonalizado | null
  students: CursoPersonalizadoEstudiante[]
}) {
  const precioUnitario = Number(course.precio_total) || 0
  const capacidad = Number(course.capacidad) || 1
  const totalProyectado = precioUnitario * capacidad
  const totalEsperado =
    finance?.total_esperado && finance.total_esperado > 0 ? finance.total_esperado : totalProyectado
  const totalAbonado = Number(finance?.total_abonado) || 0
  const saldoPendiente =
    finance?.saldo_pendiente && finance.saldo_pendiente > 0
      ? finance.saldo_pendiente
      : Math.max(0, totalEsperado - totalAbonado)

  const porcentajeRecaudado =
    totalEsperado > 0
      ? Math.min(100, Math.round((totalAbonado / totalEsperado) * 100))
      : 0

  return (
    <div className="space-y-6">
      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Esperado */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Facturación</span>
            <div className="size-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900">{money(totalEsperado)}</span>
            <p className="text-[11px] text-slate-500 mt-1">Monto total proyectado</p>
          </div>
        </div>

        {/* Total Abonado */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Recaudado</span>
            <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-emerald-700">{money(totalAbonado)}</span>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">{porcentajeRecaudado}% del total recaudado</p>
          </div>
        </div>

        {/* Saldo Pendiente */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Por Recaudar</span>
            <div className="size-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-rose-700">{money(saldoPendiente)}</span>
            <p className="text-[11px] text-rose-600 font-semibold mt-1">Saldo pendiente de cobro</p>
          </div>
        </div>

        {/* Precio por estudiante */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inversión / Estudiante</span>
            <div className="size-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-900">{money(precioUnitario)}</span>
            <p className="text-[11px] text-slate-500 mt-1">Tarifa individual por cupo</p>
          </div>
        </div>
      </div>

      {/* Recaudación Progress Bar Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Progreso de Recaudación de Fondos</h3>
            <p className="text-xs text-slate-500 mt-0.5">Avance de pagos respecto al valor total de las matrículas</p>
          </div>
          <span className="text-sm font-extrabold text-orange-600">{porcentajeRecaudado}%</span>
        </div>

        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${porcentajeRecaudado}%` }}
          />
        </div>

        {/* 3 Status Breakdown Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span className="text-xs font-bold text-emerald-900">Cuentas Pagadas</span>
            </div>
            <strong className="text-base font-extrabold text-emerald-700">{finance?.cuentas_pagadas ?? 0}</strong>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock3 size={16} className="text-amber-600" />
              <span className="text-xs font-bold text-amber-900">Con Abonos Parciales</span>
            </div>
            <strong className="text-base font-extrabold text-amber-700">{finance?.cuentas_abonadas ?? 0}</strong>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-600" />
              <span className="text-xs font-bold text-rose-900">Cuentas Pendientes</span>
            </div>
            <strong className="text-base font-extrabold text-rose-700">{finance?.cuentas_pendientes ?? 0}</strong>
          </div>
        </div>
      </div>

      {/* Embedded Detailed Student Payment Table */}
      <StudentTableSection students={students} />
    </div>
  )
}
