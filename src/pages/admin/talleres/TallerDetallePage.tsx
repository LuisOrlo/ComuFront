/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { usePermission } from "@/hooks/usePermission"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeftIcon,
  Edit01Icon,
  Delete01Icon,
  Download01Icon,
  UserGroupIcon,
  CalendarIcon,
  Money01Icon,
  CheckmarkCircle01Icon,
  Search01Icon,
  PaymentIcon,
  ClockIcon,
  UserIcon,
  LocationIcon,
  CapIcon,
} from "@hugeicons/core-free-icons"
import { Building2, Sparkles, ChevronDown, ChevronUp, CheckCircle2, ExternalLink } from "lucide-react"
import { COLORS } from "@/lib/constants"
import { tallerService, type Taller, type InscripcionTaller } from "@/services/taller.service"
import {
  generarListadoParticipantesPDF,
  type ParticipanteReporte,
} from "@/lib/generarAsistenciaPDF"
import { financeService } from "@/services/finance.service"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { InteresadosSection } from "@/components/interesados/InteresadosSection"
import { TallerAsistenciaSection } from "./components/TallerAsistenciaSection"
import { toast } from "sonner"

const estadoConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  pendiente: { bg: "bg-amber-50 text-amber-800 border-amber-200", text: "#b45309", dot: "bg-amber-500", label: "Pendiente" },
  confirmado: { bg: "bg-emerald-50 text-emerald-800 border-emerald-200", text: "#047857", dot: "bg-emerald-500", label: "Confirmado" },
  completado: { bg: "bg-slate-100 text-slate-700 border-slate-200", text: "#334155", dot: "bg-slate-500", label: "Completado" },
  cancelado: { bg: "bg-rose-50 text-rose-800 border-rose-200", text: "#b91c1c", dot: "bg-rose-500", label: "Cancelado" },
}

type Tab = "info" | "participantes" | "pagos" | "asistencia" | "interesados"

export function TallerDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAdmin, isSecretaria, isInstructor } = usePermission()
  const canManageAsistencia = isAdmin || isSecretaria || isInstructor
  const [taller, setTaller] = useState<Taller | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("info")
  const [searchParticipantes, setSearchParticipantes] = useState("")
  const [inscripciones, setInscripciones] = useState<InscripcionTaller[]>([])
  const [loadingInscripciones, setLoadingInscripciones] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<InscripcionTaller | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [financieroData, setFinancieroData] = useState<any>(null)
  const [transacciones, setTransacciones] = useState<any[]>([])
  const [loadingPagos, setLoadingPagos] = useState(false)
  const [searchEstudiantePago, setSearchEstudiantePago] = useState("")
  const [filtroPagoEstado, setFiltroPagoEstado] = useState<"todos" | "pendientes" | "completados">("todos")
  const [expandedEstudiantes, setExpandedEstudiantes] = useState<Record<string, boolean>>({})
  const [estudiantesConPagos, setEstudiantesConPagos] = useState<any[]>([])
  const [mostrarTodasTransacciones, setMostrarTodasTransacciones] = useState(false)
  const [showDeleteTallerConfirm, setShowDeleteTallerConfirm] = useState(false)
  const [deletingTaller, setDeletingTaller] = useState(false)

  useEffect(() => {
    if (!id) return
    tallerService
      .obtener(id)
      .then((t) => {
        setTaller(t)
        if (t?.inscripciones && Array.isArray(t.inscripciones) && t.inscripciones.length > 0) {
          setInscripciones(t.inscripciones)
        }
      })
      .catch(() => toast.error("Error al cargar taller"))
      .finally(() => setLoading(false))
  }, [id, refreshKey])

  useEffect(() => {
    if (!id) return
    const params: Record<string, unknown> = { per_page: 100 }
    if (searchParticipantes.trim()) params.search = searchParticipantes
    tallerService
      .listarInscripciones(id, params)
      .then((res) => setInscripciones((res as any).data || []))
      .catch(() => {})
      .finally(() => setLoadingInscripciones(false))
  }, [id, searchParticipantes, refreshKey])

  useEffect(() => {
    if (!id || tab !== "pagos") return
    const loadPagosData = async () => {
      setLoadingPagos(true)
      try {
        const res = await financeService.getTallerFinanciero(id)
        const data = res.datos || res.data || res
        setFinancieroData(data)

        const participantes = data.participantes || []
        const historiales = await Promise.all(
          participantes.map((p: any) =>
            financeService
              .getHistorialParticipanteTaller(id, p.id)
              .then((r) => ({
                participanteId: p.id,
                nombre: p.estudiante_nombre || `${p.nombres || ""} ${p.apellidos || ""}`.trim(),
                data: r.datos || r.data || r,
              }))
              .catch(() => null)
          )
        )

        const allTransacciones: any[] = []
        historiales.forEach((h) => {
          if (!h) return
          const trans = h.data.transacciones || []
          trans.forEach((t: any) => {
            allTransacciones.push({
              id: t.id,
              participante_nombre: h.nombre,
              participante_id: h.participanteId,
              monto: t.monto || 0,
              metodo_pago: t.metodo_pago || "—",
              fecha_pago: t.fecha_pago || null,
              estado_verificacion: t.estado_verificacion || "pendiente",
              comprobante_url: t.comprobante_url || null,
              observaciones: t.observaciones || null,
            })
          })
        })
        setTransacciones(allTransacciones)

        // Estructurar estudiantes con sus pagos para el desplegable
        const estList = participantes.map((p: any) => {
          const hist = historiales.find((h) => h?.participanteId === p.id)
          const trans = (hist?.data?.transacciones || []).map((t: any) => ({
            id: t.id,
            monto: Number(t.monto || 0),
            metodo_pago: t.metodo_pago || "—",
            fecha_pago: t.fecha_pago || null,
            estado_verificacion: t.estado_verificacion || "pendiente",
            comprobante_url: t.comprobante_url || null,
            observaciones: t.observaciones || null,
          }))

          const total = Number(p.monto_total || (Number(taller?.precio || 0) + Number(taller?.precio_matricula || 0)) || 0)
          const abonado = Number(
            p.monto_abonado !== undefined
              ? p.monto_abonado
              : trans.filter((t: any) => t.estado_verificacion === "aprobado").reduce((acc: number, t: any) => acc + t.monto, 0)
          )
          const saldo = Number(p.saldo_pendiente ?? Math.max(0, total - abonado))

          let estado_pago: "completado" | "parcial" | "pendiente" = "pendiente"
          if (total > 0 && abonado >= total) estado_pago = "completado"
          else if (abonado > 0) estado_pago = "parcial"

          return {
            participanteId: p.id,
            nombre: p.estudiante_nombre || `${p.nombres || ""} ${p.apellidos || ""}`.trim() || "Estudiante",
            cedula: p.cedula || "—",
            correo: p.correo || "—",
            telefono: p.telefono || "",
            monto_total: total,
            monto_abonado: abonado,
            saldo_pendiente: saldo,
            estado_pago,
            transacciones: trans,
          }
        })

        // Fallback a inscripciones locales si participantes vino vacío
        if (estList.length === 0 && inscripciones.length > 0) {
          inscripciones.forEach((ins) => {
            const total = Number(taller?.precio || 0) + Number(taller?.precio_matricula || 0)
            const abonado = Number(ins.monto_pagado || 0)
            const saldo = Math.max(0, total - abonado)
            let estado_pago: "completado" | "parcial" | "pendiente" = "pendiente"
            if (total > 0 && abonado >= total) estado_pago = "completado"
            else if (abonado > 0) estado_pago = "parcial"

            estList.push({
              participanteId: ins.id,
              nombre: `${ins.nombres || ""} ${ins.apellidos || ""}`.trim() || "Estudiante",
              cedula: ins.cedula || "—",
              correo: ins.correo || "—",
              telefono: ins.telefono || "",
              monto_total: total,
              monto_abonado: abonado,
              saldo_pendiente: saldo,
              estado_pago,
              transacciones: [],
            })
          })
        }

        setEstudiantesConPagos(estList)
      } catch {
        toast.error("Error al cargar datos financieros")
      } finally {
        setLoadingPagos(false)
      }
    }
    loadPagosData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, tab, refreshKey])

  const handleDeleteInscripcion = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await tallerService.eliminarInscripcion(deleteTarget.id)
      toast.success("Inscripción eliminada")
      setDeleteTarget(null)
      setRefreshKey((k) => k + 1)
    } catch {
      toast.error("Error al eliminar inscripción")
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteTaller = async () => {
    if (!id) return
    setDeletingTaller(true)
    try {
      await tallerService.eliminar(id)
      toast.success("Taller eliminado")
      navigate("/talleres")
    } catch {
      toast.error("Error al eliminar taller")
    } finally {
      setDeletingTaller(false)
    }
  }

  const formatFecha = (f?: string) => {
    if (!f) return "—"
    try {
      const d = new Date(f)
      const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
      return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`
    } catch {
      return f
    }
  }

  const formatHora = (h?: string) => (h ? h.substring(0, 5) : "—")

  // Cálculo de horas totales si tiene sesiones programadas
  const tallerSesiones = taller?.sesiones
  const totalHorasSesiones = useMemo(() => {
    if (!tallerSesiones || tallerSesiones.length === 0) return null
    let totalMins = 0
    tallerSesiones.forEach((s) => {
      if (s.hora_inicio && s.hora_fin) {
        const [h1, m1] = s.hora_inicio.split(":").map(Number)
        const [h2, m2] = s.hora_fin.split(":").map(Number)
        const diff = h2 * 60 + m2 - (h1 * 60 + m1)
        if (diff > 0) totalMins += diff
      }
    })
    const horas = Math.floor(totalMins / 60)
    const mins = totalMins % 60
    return mins > 0 ? `${horas}h ${mins}m` : `${horas}h`
  }, [tallerSesiones])

  const estudiantesPagosFiltrados = useMemo(() => {
    return estudiantesConPagos.filter((e) => {
      const matchSearch =
        !searchEstudiantePago.trim() ||
        e.nombre.toLowerCase().includes(searchEstudiantePago.toLowerCase()) ||
        e.cedula.toLowerCase().includes(searchEstudiantePago.toLowerCase()) ||
        e.correo.toLowerCase().includes(searchEstudiantePago.toLowerCase())

      if (!matchSearch) return false

      if (filtroPagoEstado === "pendientes") return e.saldo_pendiente > 0
      if (filtroPagoEstado === "completados") return e.saldo_pendiente === 0 || e.estado_pago === "completado"
      return true
    })
  }, [estudiantesConPagos, searchEstudiantePago, filtroPagoEstado])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9ff]">
        <div className="size-10 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: COLORS.ACCENT, borderRightColor: COLORS.ACCENT }} />
      </div>
    )
  }

  if (!taller) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9ff] text-[#45464d] p-6 text-center">
        <p className="text-base font-semibold">Taller no encontrado</p>
        <button
          onClick={() => navigate("/talleres")}
          className="mt-3 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#fd761a] hover:bg-orange-600 transition-all"
        >
          Volver a talleres
        </button>
      </div>
    )
  }

  const listaInscripciones = inscripciones.length > 0 ? inscripciones : taller.inscripciones || []
  const inscritosActivos = listaInscripciones.filter((i) => i.estado === "activo")
  const totalParticipantes = listaInscripciones.length
  const capacidad = Number(taller.capacidad_maxima) || 0
  const pctOcupacion = capacidad > 0 ? Math.round((inscritosActivos.length / capacidad) * 100) : 0
  const est = estadoConfig[taller.estado] || estadoConfig.pendiente

  const precioTaller = Number(taller.precio || 0)
  const matriculaTaller = Number(taller.precio_matricula || 0)
  const totalPorParticipante = precioTaller + matriculaTaller
  const recaudadoCaja = Number(financieroData?.totales?.recaudado || 0)
  const totalEsperadoPotencial = capacidad * totalPorParticipante
  const pctRecaudado =
    totalEsperadoPotencial > 0
      ? Math.min(100, Math.round((recaudadoCaja / totalEsperadoPotencial) * 100))
      : 0

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "info", label: "Información", icon: CalendarIcon },
    { key: "participantes", label: `Participantes (${totalParticipantes})`, icon: UserGroupIcon },
    { key: "pagos", label: "Pagos & Finanzas", icon: Money01Icon },
    { key: "asistencia", label: `Asistencia (${taller.asistencias?.length || 0})`, icon: CheckmarkCircle01Icon },
    { key: "interesados", label: "Interesados", icon: UserIcon },
  ]

  const toggleExpandEstudiante = (participanteId: string) => {
    setExpandedEstudiantes((prev) => ({
      ...prev,
      [participanteId]: !prev[participanteId],
    }))
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#f8f9ff] text-[#0b1c30]">
      <main className="flex-1">
        {/* ================= HERO HEADER ================= */}
        <div className="bg-white border-b border-[#e5eeff]">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-6 relative">
            <button
              onClick={() => navigate("/talleres")}
              className="inline-flex items-center gap-1.5 text-xs font-medium mb-6 transition-all duration-200 text-slate-500 hover:text-[#fd761a]"
            >
              <HugeiconsIcon icon={ArrowLeftIcon} size={14} />
              Volver a talleres
            </button>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide bg-[#d3e4fe] text-[#0b1c30]">
                    {taller.modalidad || "Presencial"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold bg-white text-slate-700 shadow-2xs border border-[#e5eeff]">
                    <span className={`size-1.5 rounded-full ${est.dot}`} />
                    {est.label}
                  </span>
                  {taller.fecha_fin ? (
                    <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold bg-orange-50 text-[#fd761a] border border-orange-200/60">
                      Ciclo Multidía ({taller.sesiones?.length || "Varios"} sesiones)
                    </span>
                  ) : (
                    <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold bg-slate-100 text-slate-700">
                      Jornada Única
                    </span>
                  )}
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-[#0b1c30]">
                  {taller.nombre}
                </h1>

                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                    <HugeiconsIcon icon={UserIcon} size={14} className="text-[#fd761a]" />
                    {taller.instructor
                      ? `${taller.instructor.nombres} ${taller.instructor.apellidos}`
                      : "Instructor por asignar"}
                  </span>
                  <span className="opacity-40">·</span>
                  <span className="inline-flex items-center gap-1">
                    <HugeiconsIcon icon={LocationIcon} size={14} className="text-[#fd761a]" />
                    {taller.ciudad?.nombre || (taller.modalidad === "virtual" ? "Campus Virtual" : "Sede Principal")}
                  </span>
                  <span className="opacity-40">·</span>
                  <span className="inline-flex items-center gap-1">
                    <HugeiconsIcon icon={CalendarIcon} size={14} />
                    {formatFecha(taller.fecha)}
                    {taller.fecha_fin ? ` – ${formatFecha(taller.fecha_fin)}` : ""}
                  </span>
                  <span className="opacity-40">·</span>
                  <span className="inline-flex items-center gap-1">
                    <HugeiconsIcon icon={ClockIcon} size={14} />
                    {formatHora(taller.hora_inicio)} – {formatHora(taller.hora_fin)}
                  </span>
                </div>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/talleres/${id}/editar`)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-white bg-[#fd761a] hover:bg-orange-600 active:scale-95 shadow-sm"
                    style={{ boxShadow: `0 0 15px #fd761a30` }}
                  >
                    <HugeiconsIcon icon={Edit01Icon} size={14} />
                    Editar
                  </button>
                  <button
                    onClick={() => setShowDeleteTallerConfirm(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-black/5 text-[#45464d] hover:bg-red-50 hover:text-red-600 active:scale-95"
                  >
                    <HugeiconsIcon icon={Delete01Icon} size={14} />
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= TABS & MAIN CONTENT ================= */}
        <div className="max-w-[1280px] mx-auto w-full px-6 lg:px-8 py-6 space-y-6">
          {/* Tabs bar */}
          <div
            role="tablist"
            aria-label="Secciones del taller"
            className="flex gap-1 border-b overflow-x-auto bg-[#f8f9ff] -mx-6 lg:-mx-8 px-6 lg:px-8 border-[#e5eeff]"
          >
            {tabs.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3.5 text-xs font-semibold border-b-2 transition-all shrink-0 whitespace-nowrap"
                style={{
                  borderColor: tab === t.key ? "#fd761a" : "transparent",
                  color: tab === t.key ? "#9d4300" : "#45464d",
                }}
              >
                <HugeiconsIcon icon={t.icon} size={14} />
                {t.label}
              </button>
            ))}
          </div>

          {/* ================= TAB: INFORMACIÓN ================= */}
          {tab === "info" && (
            <div className="space-y-6">
              {/* Row de 4 StatCards estilo Cursos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                  icon={<HugeiconsIcon icon={CapIcon} size={16} />}
                  label="Capacidad y Ocupación"
                  value={`${inscritosActivos.length} / ${capacidad}`}
                  subtitle={pctOcupacion > 0 ? `${pctOcupacion}% cupos ocupados` : "Sin participantes inscritos"}
                  progress={pctOcupacion}
                />
                <StatCard
                  icon={<HugeiconsIcon icon={CalendarIcon} size={16} />}
                  label="Fecha de inicio"
                  value={formatFecha(taller.fecha)}
                  subtitle={taller.fecha_fin ? "Apertura del ciclo" : "Jornada intensiva única"}
                />
                <StatCard
                  icon={<HugeiconsIcon icon={CalendarIcon} size={16} />}
                  label="Fecha de finalización"
                  value={taller.fecha_fin ? formatFecha(taller.fecha_fin) : "Mismo día"}
                  subtitle={taller.fecha_fin ? "Cierre del taller" : "1 sola jornada programada"}
                />
                <StatCard
                  icon={<HugeiconsIcon icon={ClockIcon} size={16} />}
                  label="Horario y Sesiones"
                  value={`${formatHora(taller.hora_inicio)} – ${formatHora(taller.hora_fin)}`}
                  subtitle={totalHorasSesiones ? `${totalHorasSesiones} de duración estimada` : "Zona horaria local"}
                />
              </div>

              {/* Grid 2 columnas (7 / 5) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Columna Izquierda (7 cols) */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  {/* Cronograma de Sesiones Programadas */}
                  <section className="p-5 sm:p-6 rounded-2xl bg-white border border-[#e5eeff] shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#e5eeff]">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-lg bg-orange-100 text-[#fd761a] flex items-center justify-center">
                          <Sparkles size={16} />
                        </div>
                        <div>
                          <h2 className="text-base sm:text-lg font-bold text-[#0b1c30]">
                            Cronograma de Sesiones
                          </h2>
                          <p className="text-xs text-slate-500">
                            {taller.sesiones && taller.sesiones.length > 0
                              ? "Calendario con los días y horarios específicos del taller"
                              : "Detalle de los días planificados para este taller"}
                          </p>
                        </div>
                      </div>

                      {totalHorasSesiones && (
                        <span className="px-2.5 py-1 rounded-full bg-orange-50 text-[#fd761a] text-xs font-bold border border-orange-200/80">
                          Total: {totalHorasSesiones}
                        </span>
                      )}
                    </div>

                    <div className="pt-4">
                      {taller.sesiones && taller.sesiones.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {taller.sesiones.map((s, idx) => {
                            const yaTieneAsistencia = taller.asistencias?.some(
                              (a) => String(a.fecha_sesion).split("T")[0] === String(s.fecha_sesion).split("T")[0]
                            )

                            return (
                              <div
                                key={s.id || idx}
                                className="p-3.5 rounded-xl border border-slate-200/90 bg-[#eff4ff]/60 hover:bg-[#eff4ff] transition-all flex flex-col justify-between gap-2"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="flex size-6 items-center justify-center rounded-full bg-[#fd761a] text-white text-[10px] font-bold shrink-0">
                                      #{idx + 1}
                                    </span>
                                    <span className="text-xs font-bold text-[#0b1c30]">
                                      {formatFecha(s.fecha_sesion)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    {yaTieneAsistencia ? (
                                      <button
                                        type="button"
                                        onClick={() => setTab("asistencia")}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors shrink-0"
                                        title="Ver o editar la asistencia de esta sesión"
                                      >
                                        <span className="size-1.5 rounded-full bg-emerald-600" />
                                        Asistencia
                                      </button>
                                    ) : canManageAsistencia ? (
                                      <button
                                        type="button"
                                        onClick={() => setTab("asistencia")}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-[#9d4300] hover:bg-orange-200 transition-colors shrink-0"
                                        title="Tomar asistencia para esta sesión"
                                      >
                                        Tomar Asistencia
                                      </button>
                                    ) : null}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-200/50">
                                  <span className="font-semibold text-slate-800">
                                    {formatHora(s.hora_inicio)} – {formatHora(s.hora_fin)}
                                  </span>
                                  {s.aula ? (
                                    <span className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                                      <Building2 size={12} />
                                      {s.aula}
                                    </span>
                                  ) : (
                                    <span className="text-[11px] text-slate-400">Aula estándar</span>
                                  )}
                                </div>

                                {s.tema && (
                                  <p className="text-[11px] text-slate-600 line-clamp-1 italic bg-white/70 px-2 py-1 rounded-md border border-slate-200/40">
                                    Tema: {s.tema}
                                  </p>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : taller.fecha_fin && taller.horarios && taller.horarios.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {taller.horarios.map((h: any) => {
                            const dias = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
                            return (
                              <div
                                key={h.id}
                                className="p-3 rounded-xl border border-[#e5eeff] bg-[#eff4ff] text-xs flex flex-col gap-1"
                              >
                                <span className="font-bold text-[#fd761a]">
                                  {dias[h.dia_semana] || `Día ${h.dia_semana}`}
                                </span>
                                <span className="font-semibold text-[#0b1c30]">
                                  {formatHora(h.hora_inicio)} – {formatHora(h.hora_fin)}
                                </span>
                                {h.aula && <span className="text-slate-500 text-[11px]">Aula: {h.aula}</span>}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200/80 flex items-center justify-between text-xs text-slate-700">
                          <div>
                            <span className="font-bold text-slate-900 block mb-0.5">
                              Jornada Única (Masterclass)
                            </span>
                            <span>
                              Programada para el <strong>{formatFecha(taller.fecha)}</strong> de{" "}
                              <strong>{formatHora(taller.hora_inicio)}</strong> a{" "}
                              <strong>{formatHora(taller.hora_fin)}</strong>.
                            </span>
                          </div>
                          <span className="font-bold text-[#fd761a] px-3 py-1 bg-white rounded-lg border border-orange-200">
                            1 Sesión
                          </span>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Ficha del Instructor y Descripción */}
                  <section className="p-5 sm:p-6 rounded-2xl bg-white border border-[#e5eeff] shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#e5eeff]">
                      <h2 className="text-base sm:text-lg font-bold text-[#0b1c30]">
                        Instructor Responsable
                      </h2>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold uppercase">
                        Docente
                      </span>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-xl bg-[#eff4ff]">
                      <div className="size-12 rounded-full bg-[#fd761a] text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                        {taller.instructor
                          ? `${taller.instructor.nombres?.charAt(0) || ""}${taller.instructor.apellidos?.charAt(0) || ""}`.toUpperCase()
                          : "IN"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm sm:text-base font-bold text-[#0b1c30] truncate">
                          {taller.instructor
                            ? `${taller.instructor.nombres} ${taller.instructor.apellidos}`
                            : "Sin instructor asignado aún"}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {taller.instructor
                            ? "Docente titular encargado de las sesiones y dictado formativo"
                            : "Puedes asignar o actualizar el docente desde la edición del taller."}
                        </p>
                      </div>
                    </div>

                    {taller.descripcion && (
                      <div className="pt-2">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Descripción y Objetivos
                        </h3>
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                          {taller.descripcion}
                        </div>
                      </div>
                    )}
                  </section>
                </div>

                {/* Columna Derecha (5 cols): Aranceles & Proyección Financiera */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  {/* Desglose de Precios */}
                  <section className="p-5 sm:p-6 rounded-2xl bg-white border border-[#e5eeff] shadow-xs">
                    <div className="flex items-center justify-between pb-4 border-b border-[#e5eeff]">
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-[#0b1c30]">
                          Precio por Participante
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Valores configurados para inscripción
                        </p>
                      </div>
                      <div className="size-9 rounded-xl bg-[#ffdbca] text-[#9d4300] flex items-center justify-center">
                        <HugeiconsIcon icon={Money01Icon} size={18} />
                      </div>
                    </div>

                    <div className="space-y-3 mt-4">
                      {/* Arancel Taller */}
                      <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[#eff4ff]">
                        <div>
                          <span className="text-xs font-bold text-[#0b1c30] block">
                            Arancel del Taller
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Costo de acceso y materiales
                          </span>
                        </div>
                        <strong className="text-base text-[#0b1c30] font-bold whitespace-nowrap">
                          ${precioTaller.toFixed(2)} USD
                        </strong>
                      </div>

                      {/* Matrícula / Inscripción */}
                      <div
                        className={`flex items-center justify-between gap-3 p-3.5 rounded-xl ${
                          matriculaTaller > 0
                            ? "bg-orange-50/70 border border-orange-200/80"
                            : "bg-[#eff4ff]"
                        }`}
                      >
                        <div>
                          <span className="text-xs font-bold text-[#0b1c30] block">
                            Inscripción / Matrícula
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {matriculaTaller > 0
                              ? "Cuota fija inicial por participante"
                              : "Sin costo adicional de inscripción"}
                          </span>
                        </div>
                        {matriculaTaller > 0 ? (
                          <strong className="text-base text-[#9d4300] font-bold whitespace-nowrap">
                            +${matriculaTaller.toFixed(2)} USD
                          </strong>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            $0.00
                          </span>
                        )}
                      </div>

                      {/* Total por alumno */}
                      <div className="mt-4 p-4 rounded-xl bg-[#e5eeff] flex items-center justify-between gap-3 border border-[#d3e4fe]">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-600">
                            Total a cobrar por participante
                          </span>
                          <span className="block text-xs text-slate-500 mt-0.5">
                            {matriculaTaller > 0
                              ? `Arancel ($${precioTaller.toFixed(2)}) + Matrícula ($${matriculaTaller.toFixed(2)})`
                              : "Arancel único total"}
                          </span>
                        </div>
                        <strong className="text-lg font-black text-[#0b1c30] whitespace-nowrap">
                          ${totalPorParticipante.toFixed(2)} USD
                        </strong>
                      </div>
                    </div>
                  </section>

                  {/* Proyección Financiera Global */}
                  <section className="p-5 sm:p-6 rounded-2xl bg-white border border-[#e5eeff] shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#e5eeff]">
                      <h3 className="text-sm font-bold text-[#0b1c30]">
                        Proyección Financiera
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                        Cupo: {capacidad} personas
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">Recaudación en Caja:</span>
                        <strong className="text-sm font-bold text-emerald-700">
                          ${recaudadoCaja.toFixed(2)} USD
                        </strong>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">Total esperado a cupo lleno:</span>
                        <strong className="text-sm font-bold text-[#fd761a]">
                          ${Number(totalEsperadoPotencial).toFixed(2)} USD
                        </strong>
                      </div>

                      <div className="pt-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                          <span>Progreso de recaudo</span>
                          <span className="font-bold text-slate-700">{pctRecaudado}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#e5eeff] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#fd761a] transition-all"
                            style={{ width: `${pctRecaudado}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB: PARTICIPANTES ================= */}
          {tab === "participantes" && (
            <div className="bg-white rounded-2xl border border-[#e5eeff] shadow-xs overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-[#e5eeff] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="relative flex-1 w-full sm:max-w-xs">
                  <HugeiconsIcon
                    icon={Search01Icon}
                    size={15}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={searchParticipantes}
                    onChange={(e) => setSearchParticipantes(e.target.value)}
                    placeholder="Buscar por nombre, cédula o correo..."
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-xs bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-[#fd761a] transition-all"
                  />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="text-xs font-semibold text-slate-600">
                    <strong>{inscritosActivos.length}</strong> {inscritosActivos.length === 1 ? "inscrito" : "inscritos"}
                  </span>
                  <button
                    onClick={async () => {
                      try {
                        const activos = inscripciones.filter((i) => i.estado === "activo")
                        const mapaFinanciero: Record<string, { monto_abonado: number; monto_total: number; saldo_pendiente: number }> = {}
                        try {
                          const resFin = await financeService.getTallerFinanciero(id!)
                          const data = resFin.datos || resFin.data || resFin
                          const participantesFin = data.participantes || []
                          for (const p of participantesFin) {
                            mapaFinanciero[p.id] = {
                              monto_abonado: Number(p.monto_abonado) || 0,
                              monto_total: Number(p.monto_total) || Number(taller?.precio) || 0,
                              saldo_pendiente: Number(p.saldo_pendiente) || 0,
                            }
                          }
                        } catch {
                          /* fallback a datos de la inscripción */
                        }
                        const participantes: ParticipanteReporte[] = activos.map((ins) => {
                          const fin = mapaFinanciero[ins.id]
                          const pagado = fin ? fin.monto_abonado : Number(ins.monto_pagado) || 0
                          const total = fin ? fin.monto_total : Number(taller?.precio) || 0
                          return {
                            nombres: ins.nombres,
                            apellidos: ins.apellidos,
                            cedula: ins.cedula,
                            telefono: ins.telefono || "",
                            montoPagado: pagado,
                            saldoPendiente: Math.max(0, total - pagado),
                          }
                        })
                        await generarListadoParticipantesPDF(taller?.nombre || "", participantes)
                        toast.success("Listado descargado")
                      } catch (e) {
                        const msg = e instanceof Error ? e.message : "Error desconocido"
                        toast.error(`Error al generar PDF: ${msg}`)
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
                  >
                    <HugeiconsIcon icon={Download01Icon} size={14} />
                    Exportar PDF
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                {loadingInscripciones ? (
                  <div className="p-16 text-center text-xs text-slate-400">
                    Cargando participantes...
                  </div>
                ) : inscripciones.length === 0 ? (
                  <div className="p-16 text-center text-xs text-slate-500">
                    No hay participantes inscritos aún en este taller.
                  </div>
                ) : (
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#e5eeff] bg-slate-50/60 text-[#45464d]">
                        <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-[10px]">Participante</th>
                        <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-[10px]">Cédula</th>
                        <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-[10px]">Correo</th>
                        <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-[10px]">Teléfono</th>
                        <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-[10px]">Pagado / Total</th>
                        <th className="px-6 py-3.5 font-bold uppercase tracking-wider text-[10px] text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5eeff]">
                      {inscripciones
                        .filter((i) => i.estado !== "retirado")
                        .map((ins) => {
                          const pagado = Number(ins.monto_pagado || 0)
                          const total = Number(taller.precio || 0)
                          const completo = pagado >= total && total > 0

                          return (
                            <tr key={ins.id} className="hover:bg-[#eff4ff]/40 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="size-8 rounded-full bg-[#ffdbca] text-[#9d4300] font-bold text-xs flex items-center justify-center shrink-0">
                                    {`${ins.nombres?.charAt(0) || ""}${ins.apellidos?.charAt(0) || ""}`.toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-bold text-[#0b1c30]">
                                      {ins.nombres} {ins.apellidos}
                                    </p>
                                    <p className="text-[11px] text-slate-400">{ins.ciudad || "Sede principal"}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 font-medium text-slate-700">{ins.cedula}</td>
                              <td className="px-4 py-4 text-slate-600">{ins.correo}</td>
                              <td className="px-4 py-4 text-slate-600">{ins.telefono || "—"}</td>
                              <td className="px-4 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                    completo
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : "bg-amber-50 text-amber-800 border border-amber-200"
                                  }`}
                                >
                                  ${pagado.toFixed(2)} / ${total.toFixed(2)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {isAdmin && (
                                  <button
                                    onClick={() => setDeleteTarget(ins)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                    title="Eliminar inscripción"
                                  >
                                    <HugeiconsIcon icon={Delete01Icon} size={15} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ================= TAB: PAGOS ================= */}
          {tab === "pagos" && (
            <div className="space-y-6">
              {/* StatCards de pagos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-[#e5eeff] p-5 shadow-xs flex flex-col justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Total Recaudado en Caja
                  </p>
                  <p className="text-2xl font-black text-emerald-700 mt-2">
                    ${Number(financieroData?.totales?.recaudado || 0).toFixed(2)}{" "}
                    <span className="text-sm font-normal text-slate-400">
                      / ${Number(financieroData?.totales?.esperado || totalEsperadoPotencial).toFixed(2)} USD
                    </span>
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-[#e5eeff] p-5 shadow-xs flex flex-col justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Pagos Verificados Aprobados
                  </p>
                  <p className="text-2xl font-black text-[#fd761a] mt-2">
                    {transacciones.filter((t) => t.estado_verificacion === "aprobado").length}
                    <span className="text-xs font-normal text-slate-400 ml-2">transacciones confirmadas</span>
                  </p>
                </div>

                <div className="bg-white rounded-2xl border border-[#e5eeff] p-5 shadow-xs flex flex-col justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Estudiantes con Saldo Pendiente
                  </p>
                  <p className="text-2xl font-black text-rose-600 mt-2">
                    {estudiantesConPagos.filter((e) => e.saldo_pendiente > 0).length}
                    <span className="text-xs font-normal text-slate-400 ml-2">por regularizar</span>
                  </p>
                </div>
              </div>

              {/* SECCIÓN PRINCIPAL: DESPLEGABLE POR ESTUDIANTE */}
              <div className="bg-white rounded-2xl border border-[#e5eeff] shadow-xs overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-[#e5eeff] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-[#0b1c30]">
                      Estudiantes y Detalle de Pagos
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Haz clic en cualquier estudiante para desplegar el historial de pagos y abonos realizados.
                    </p>
                  </div>

                  {/* Barra de Búsqueda y Filtros */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative">
                      <HugeiconsIcon
                        icon={Search01Icon}
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        type="text"
                        value={searchEstudiantePago}
                        onChange={(e) => setSearchEstudiantePago(e.target.value)}
                        placeholder="Buscar por estudiante, cédula..."
                        className="w-full sm:w-64 pl-10 pr-3.5 py-2 rounded-xl text-xs bg-slate-50 border border-slate-200 outline-none focus:bg-white focus:ring-2 focus:ring-[#fd761a] transition-all"
                      />
                    </div>

                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setFiltroPagoEstado("todos")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          filtroPagoEstado === "todos"
                            ? "bg-white text-slate-900 shadow-2xs"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        Todos ({estudiantesConPagos.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFiltroPagoEstado("pendientes")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          filtroPagoEstado === "pendientes"
                            ? "bg-white text-rose-700 shadow-2xs"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        Con Saldo ({estudiantesConPagos.filter((e) => e.saldo_pendiente > 0).length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFiltroPagoEstado("completados")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          filtroPagoEstado === "completados"
                            ? "bg-white text-emerald-700 shadow-2xs"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        Pagados ({estudiantesConPagos.filter((e) => e.saldo_pendiente === 0 && e.monto_total > 0).length})
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lista de estudiantes en Acordeón / Desplegable */}
                <div className="p-5 sm:p-6 space-y-3">
                  {loadingPagos ? (
                    <div className="p-16 text-center text-xs text-slate-400">
                      Cargando información financiera de los estudiantes...
                    </div>
                  ) : estudiantesPagosFiltrados.length === 0 ? (
                    <div className="p-16 text-center text-xs text-slate-500">
                      No se encontraron estudiantes con los filtros seleccionados.
                    </div>
                  ) : (
                    estudiantesPagosFiltrados.map((est) => {
                      const isExpanded = Boolean(expandedEstudiantes[est.participanteId])
                      const total = est.monto_total
                      const abonado = est.monto_abonado
                      const saldo = est.saldo_pendiente
                      const numPagos = est.transacciones.length

                      return (
                        <div
                          key={est.participanteId}
                          className="rounded-2xl border border-[#e5eeff] bg-white overflow-hidden transition-all shadow-2xs hover:border-slate-300"
                        >
                          {/* Fila Cabecera del Estudiante (Clicable para desplegar) */}
                          <div
                            onClick={() => toggleExpandEstudiante(est.participanteId)}
                            className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 select-none transition-colors"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="size-10 rounded-full bg-[#ffdbca] text-[#9d4300] font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                {est.nombre
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .slice(0, 2)
                                  .join("")
                                  .toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-sm font-bold text-[#0b1c30] truncate">
                                    {est.nombre}
                                  </h4>
                                  <span className="text-[11px] text-slate-400 font-mono">
                                    C.I: {est.cedula}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 truncate">
                                  {est.correo} {est.telefono ? `· Tel: ${est.telefono}` : ""}
                                </p>
                              </div>
                            </div>

                            {/* Indicadores Financieros & Acciones */}
                            <div className="flex flex-wrap items-center gap-3 justify-between md:justify-end">
                              {/* Badge de Estado Financiero */}
                              {saldo === 0 && total > 0 ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 size={13} className="text-emerald-600" />
                                  Pagado Completo (${abonado.toFixed(2)})
                                </span>
                              ) : abonado > 0 ? (
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                    Abonado: ${abonado.toFixed(2)}
                                  </span>
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                    Resta: ${saldo.toFixed(2)}
                                  </span>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  Sin Pagos (Deuda: ${total.toFixed(2)})
                                </span>
                              )}

                              {/* Botón Registrar Pago */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigate(`/finanzas/pagos/cuentas/talleres/${id}/participante/${est.participanteId}`)
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-[#fd761a] hover:bg-orange-600 shadow-2xs transition-all"
                              >
                                <HugeiconsIcon icon={PaymentIcon} size={13} />
                                Registrar Pago
                              </button>

                              {/* Botón / Toggle Desplegable */}
                              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">
                                <span>{numPagos} {numPagos === 1 ? "pago" : "pagos"}</span>
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </div>
                            </div>
                          </div>

                          {/* CONTENIDO DESPLEGABLE: Historial de Pagos del Estudiante */}
                          {isExpanded && (
                            <div className="border-t border-[#e5eeff] bg-slate-50/60 p-4 sm:p-5 animate-in slide-in-from-top-2 duration-200">
                              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60">
                                <span className="text-xs font-bold text-slate-700">
                                  Historial de pagos de {est.nombre}
                                </span>
                                <span className="text-xs text-slate-500">
                                  Total a cobrar: <strong>${total.toFixed(2)} USD</strong> · Saldo pendiente: <strong className={saldo > 0 ? "text-rose-600" : "text-emerald-700"}>${saldo.toFixed(2)} USD</strong>
                                </span>
                              </div>

                              {numPagos === 0 ? (
                                <div className="p-6 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500 space-y-2">
                                  <p>Este estudiante aún no registra ningún pago o abono para este taller.</p>
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/finanzas/pagos/cuentas/talleres/${id}/participante/${est.participanteId}`)}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#fd761a] hover:bg-orange-600 transition-all shadow-2xs"
                                  >
                                    <HugeiconsIcon icon={PaymentIcon} size={13} />
                                    Registrar Primer Pago
                                  </button>
                                </div>
                              ) : (
                                <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
                                  <table className="w-full text-xs text-left">
                                    <thead>
                                      <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                                        <th className="px-4 py-2.5">Fecha</th>
                                        <th className="px-4 py-2.5">Monto</th>
                                        <th className="px-4 py-2.5">Método de Pago</th>
                                        <th className="px-4 py-2.5">Verificación</th>
                                        <th className="px-4 py-2.5">Observaciones</th>
                                        <th className="px-4 py-2.5 text-right">Comprobante</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {est.transacciones.map((t: any) => (
                                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                          <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">
                                            {t.fecha_pago ? formatFecha(t.fecha_pago) : "—"}
                                          </td>
                                          <td className="px-4 py-3 font-bold text-emerald-700 whitespace-nowrap">
                                            ${Number(t.monto).toFixed(2)} USD
                                          </td>
                                          <td className="px-4 py-3 capitalize text-slate-700 whitespace-nowrap">
                                            {t.metodo_pago}
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap">
                                            <span
                                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                t.estado_verificacion === "aprobado"
                                                  ? "bg-emerald-100 text-emerald-800"
                                                  : t.estado_verificacion === "rechazado"
                                                  ? "bg-rose-100 text-rose-800"
                                                  : "bg-amber-100 text-amber-800"
                                              }`}
                                            >
                                              {t.estado_verificacion}
                                            </span>
                                          </td>
                                          <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                                            {t.observaciones || "—"}
                                          </td>
                                          <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <button
                                              type="button"
                                              onClick={() => navigate(`/finanzas/movimientos/${t.id}`)}
                                              className="inline-flex items-center gap-1 text-xs font-bold text-[#fd761a] hover:underline"
                                            >
                                              Ver Detalle
                                              <ExternalLink size={12} />
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Historial General Plegable de todas las transacciones */}
              <div className="bg-white rounded-2xl border border-[#e5eeff] shadow-xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => setMostrarTodasTransacciones(!mostrarTodasTransacciones)}
                  className="w-full px-6 py-4 border-b border-[#e5eeff] flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="text-xs font-bold text-[#0b1c30]">
                      Historial Cronológico General ({transacciones.length} transacciones)
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Vista consolidada de todos los movimientos de caja registrados en este taller.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <span>{mostrarTodasTransacciones ? "Ocultar" : "Mostrar"}</span>
                    {mostrarTodasTransacciones ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </button>

                {mostrarTodasTransacciones && (
                  <div className="overflow-x-auto">
                    {loadingPagos ? (
                      <div className="p-12 text-center text-xs text-slate-400">Cargando transacciones...</div>
                    ) : transacciones.length === 0 ? (
                      <div className="p-12 text-center text-xs text-slate-500">No hay pagos registrados para este taller.</div>
                    ) : (
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-[#e5eeff] bg-slate-50 text-slate-600">
                            <th className="px-6 py-3 font-bold uppercase tracking-wider text-[10px]">Participante</th>
                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Fecha</th>
                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Monto</th>
                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Método</th>
                            <th className="px-4 py-3 font-bold uppercase tracking-wider text-[10px]">Estado</th>
                            <th className="px-6 py-3 font-bold uppercase tracking-wider text-[10px] text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5eeff]">
                          {transacciones.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50/60">
                              <td className="px-6 py-3.5 font-bold text-[#0b1c30]">{t.participante_nombre}</td>
                              <td className="px-4 py-3.5 text-slate-600">{t.fecha_pago ? formatFecha(t.fecha_pago) : "—"}</td>
                              <td className="px-4 py-3.5 font-bold text-slate-900">${Number(t.monto).toFixed(2)}</td>
                              <td className="px-4 py-3.5 capitalize text-slate-600">{t.metodo_pago}</td>
                              <td className="px-4 py-3.5">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    t.estado_verificacion === "aprobado"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {t.estado_verificacion}
                                </span>
                              </td>
                              <td className="px-6 py-3.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/finanzas/movimientos/${t.id}`)}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-[#fd761a] hover:underline"
                                >
                                  Ver Detalle
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= TAB: ASISTENCIA ================= */}
          {tab === "asistencia" && (
            <TallerAsistenciaSection
              taller={taller}
              inscritosActivos={inscritosActivos}
              canManageAsistencia={canManageAsistencia}
              onTallerUpdated={(updated) => setTaller(updated)}
            />
          )}

          {/* ================= TAB: INTERESADOS ================= */}
          {tab === "interesados" && id && (
            <div className="w-full">
              <InteresadosSection
                tipo="taller"
                entidadId={id}
                entidadNombre={taller.nombre}
                precioBase={Number(taller.precio || 0)}
              />
            </div>
          )}
        </div>
      </main>

      {/* ================= MODALES ================= */}
      <ConfirmationModal
        isOpen={!!deleteTarget}
        title="¿Eliminar participante del taller?"
        message={`¿Estás seguro de eliminar a "${deleteTarget?.nombres} ${deleteTarget?.apellidos}" de este taller? Esta acción es irreversible y eliminará su inscripción, sus asistencias, su cuenta por cobrar y cualquier deuda o valor pendiente asociado a este taller.`}
        confirmText="Eliminar por completo"
        cancelText="Cancelar"
        isLoading={deleting}
        icon="trash"
        isDangerous
        onConfirm={handleDeleteInscripcion}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmationModal
        isOpen={showDeleteTallerConfirm}
        title="Eliminar Taller"
        message={`¿Estás seguro de eliminar "${taller.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isLoading={deletingTaller}
        icon="trash"
        isDangerous
        onConfirm={handleDeleteTaller}
        onCancel={() => setShowDeleteTallerConfirm(false)}
      />
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  subtitle,
  progress,
}: {
  icon: React.ReactNode
  label: string
  value: string
  subtitle?: string
  progress?: number
}) {
  return (
    <div className="p-5 rounded-2xl bg-white shadow-xs border border-[#e5eeff] flex flex-col justify-between min-h-32">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-[#45464d]">{label}</p>
        <div className="size-8 rounded-xl bg-[#ffdbca] flex items-center justify-center text-[#9d4300]">{icon}</div>
      </div>
      <div className="mt-3">
        <p className="text-xl font-bold tracking-tight text-[#0b1c30]">{value}</p>
        {subtitle && <p className="text-xs mt-1 font-medium text-[#9d4300]">{subtitle}</p>}
        {progress !== undefined && (
          <div className="w-full h-1.5 bg-[#e5eeff] rounded-full mt-2.5 overflow-hidden">
            <div
              className="h-full bg-[#fd761a] rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
