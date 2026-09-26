import { useEffect, useRef, useState, useCallback } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import {
  ArrowLeft,
  Download,
  FileText,
  Trash2,
  Upload,
  UserRound,
  GraduationCap,
  BookOpen,
  CreditCard,
  Pencil,
  Power,
  ExternalLink,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  FileUp,
  RefreshCw,
  Eye,
} from "lucide-react"
import { toast } from "sonner"
import { COLORS } from "@/lib/constants"
import {
  instructoresService,
  type InstructorDetail,
  type CourseItem,
  type WorkshopItem,
} from "@/services/instructores.service"
import { PersonaFormModal } from "@/pages/personas/PersonaFormModal"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { CiudadBadge } from "@/components/cursos/CiudadBadge"

type TabKey = "perfil" | "cursos" | "talleres" | "hoja_vida" | "pagos"

const fmtDate = (v?: string | null) => {
  if (!v) return "—"
  try {
    return new Date(v).toLocaleDateString("es-EC", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return v
  }
}

const getCiudadNombre = (ciudad?: unknown): string => {
  if (!ciudad) return ""
  if (typeof ciudad === "string") return ciudad
  if (typeof ciudad === "object" && ciudad !== null && "nombre" in ciudad) {
    const val = (ciudad as { nombre?: unknown }).nombre
    return typeof val === "string" ? val : ""
  }
  return ""
}

const fmtMoney = (v?: number | string) => {
  const num = Number(v) || 0
  return `$${num.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const fmtSize = (bytes?: number) => {
  if (!bytes) return ""
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

export function InstructorDetallePage() {
  const { id = "" } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [data, setData] = useState<InstructorDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>("perfil")
  const [uploadingCv, setUploadingCv] = useState(false)
  const [showDeleteCvModal, setShowDeleteCvModal] = useState(false)
  const [deletingCv, setDeletingCv] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [togglingState, setTogglingState] = useState(false)

  // PDF Preview State
  const [cvBlobUrl, setCvBlobUrl] = useState<string | null>(null)
  const [loadingCvPdf, setLoadingCvPdf] = useState(false)
  const [cvPdfError, setCvPdfError] = useState(false)

  // Sub-filter states for Courses & Workshops
  const [courseFilter, setCourseFilter] = useState<"todos" | "actuales" | "proximos" | "historicos">("todos")
  const [workshopFilter, setWorkshopFilter] = useState<"todos" | "actuales" | "proximos" | "historicos">("todos")

  const load = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      const res = await instructoresService.getDetalle(id)
      setData(res)
    } catch {
      toast.error("No se pudo cargar la información del instructor")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  const loadCvBlob = useCallback(async () => {
    if (!id || !data?.hoja_vida) return
    setLoadingCvPdf(true)
    setCvPdfError(false)
    try {
      const res = await instructoresService.getHojaVida(id, false)
      const blob = new Blob([res.data], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      setCvBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return url
      })
    } catch (err) {
      console.error("Error al cargar blob de CV:", err)
      setCvPdfError(true)
      toast.error("No se pudo cargar la previsualización del PDF")
    } finally {
      setLoadingCvPdf(false)
    }
  }, [id, data?.hoja_vida])

  // Automatically load PDF blob when entering the Hoja de Vida tab
  useEffect(() => {
    if (activeTab === "hoja_vida" && data?.hoja_vida && !cvBlobUrl && !loadingCvPdf) {
      void loadCvBlob()
    }
  }, [activeTab, data?.hoja_vida, cvBlobUrl, loadingCvPdf, loadCvBlob])

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (cvBlobUrl) URL.revokeObjectURL(cvBlobUrl)
    }
  }, [cvBlobUrl])

  const handleUploadCV = async (file?: File) => {
    if (!file) return
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("El archivo debe ser un documento PDF")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("El tamaño del archivo no puede superar los 10 MB")
      return
    }
    setUploadingCv(true)
    try {
      await instructoresService.subirHojaVida(id, file)
      toast.success("Hoja de vida subida exitosamente")
      if (cvBlobUrl) {
        URL.revokeObjectURL(cvBlobUrl)
        setCvBlobUrl(null)
      }
      await load()
      // If we are currently in hoja_vida tab, reload preview
      if (activeTab === "hoja_vida") {
        void loadCvBlob()
      }
    } catch {
      toast.error("No se pudo subir la hoja de vida")
    } finally {
      setUploadingCv(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleOpenCV = async (download: boolean) => {
    try {
      const res = await instructoresService.getHojaVida(id, download)
      const blob = new Blob([res.data], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      if (download) {
        const a = document.createElement("a")
        a.href = url
        a.download = data?.hoja_vida?.nombre_original || "hoja-vida.pdf"
        document.body.appendChild(a)
        a.click()
        a.remove()
      } else {
        window.open(url, "_blank")
      }
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } catch {
      toast.error("No se pudo acceder al archivo de la hoja de vida")
    }
  }

  const handleDeleteCV = async () => {
    setDeletingCv(true)
    try {
      await instructoresService.eliminarHojaVida(id)
      toast.success("Hoja de vida eliminada exitosamente")
      if (cvBlobUrl) {
        URL.revokeObjectURL(cvBlobUrl)
        setCvBlobUrl(null)
      }
      setShowDeleteCvModal(false)
      void load()
    } catch {
      toast.error("No se pudo eliminar la hoja de vida")
    } finally {
      setDeletingCv(false)
    }
  }

  const handleToggleActivo = async () => {
    if (!data) return
    const p = data.persona
    const nextState = !p.es_activo
    if (!confirm(`¿${nextState ? "Reactivar" : "Desactivar"} a ${p.nombres} ${p.apellidos}?`)) return
    setTogglingState(true)
    try {
      await instructoresService.setActivo(id, nextState)
      toast.success(nextState ? "Instructor reactivado" : "Instructor desactivado")
      void load()
    } catch {
      toast.error("No se pudo cambiar el estado del instructor")
    } finally {
      setTogglingState(false)
    }
  }

  const cursos = data?.cursos
  const talleres = data?.talleres
  const pagos = data?.pagos

  const totalCursos =
    (cursos?.actuales?.length || 0) +
    (cursos?.proximos?.length || 0) +
    (cursos?.historicos?.length || 0)

  const totalTalleres =
    (talleres?.actuales?.length || 0) +
    (talleres?.proximos?.length || 0) +
    (talleres?.historicos?.length || 0)

  const pagosSummary = (() => {
    if (!pagos) return { count: 0, total: 0 }
    const total = pagos.reduce((acc: number, p: { monto?: number | string }) => acc + (Number(p.monto) || 0), 0)
    return { count: pagos.length, total }
  })()

  const filteredCursos = (() => {
    if (!cursos) return []
    if (courseFilter === "actuales") return cursos.actuales || []
    if (courseFilter === "proximos") return cursos.proximos || []
    if (courseFilter === "historicos") return cursos.historicos || []
    return [
      ...(cursos.actuales || []),
      ...(cursos.proximos || []),
      ...(cursos.historicos || []),
    ]
  })()

  const filteredTalleres = (() => {
    if (!talleres) return []
    if (workshopFilter === "actuales") return talleres.actuales || []
    if (workshopFilter === "proximos") return talleres.proximos || []
    if (workshopFilter === "historicos") return talleres.historicos || []
    return [
      ...(talleres.actuales || []),
      ...(talleres.proximos || []),
      ...(talleres.historicos || []),
    ]
  })()

  if (loading && !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8">
        <div className="size-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#fd761a]" />
        <p className="mt-4 text-sm font-medium text-gray-500">Cargando información del instructor...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No se encontró el instructor seleccionado.</p>
        <Link to="/instructores" className="mt-4 inline-block text-sm font-bold text-[#fd761a]">
          Volver a la lista de instructores
        </Link>
      </div>
    )
  }

  const p = data.persona
  const initials = `${p.nombres?.[0] || ""}${p.apellidos?.[0] || ""}`.toUpperCase()

  const tabs: { key: TabKey; label: string; icon: typeof UserRound; count?: number; badge?: string }[] = [
    { key: "perfil", label: "Perfil Profesional", icon: UserRound },
    { key: "cursos", label: "Cursos", icon: GraduationCap, count: totalCursos },
    { key: "talleres", label: "Talleres", icon: BookOpen, count: totalTalleres },
    { key: "hoja_vida", label: "Hoja de Vida", icon: FileText, badge: data.hoja_vida ? "PDF" : undefined },
    { key: "pagos", label: "Pagos Registrados", icon: CreditCard, count: pagosSummary.count },
  ]

  return (
    <div className="flex min-h-full flex-col bg-[#f8f9ff] text-[#0b1c30]">
      {/* Hidden file input for CV upload/replacement */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => void handleUploadCV(e.target.files?.[0])}
      />

      {/* Header Banner */}
      <header
        className="sticky top-0 z-20 shrink-0 border-b bg-white/95 px-4 py-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)] sm:px-6 lg:px-8"
        style={{ borderColor: COLORS.BORDER_SUBTLE }}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Left: Back button + Avatar + Name + Subtitle */}
            <div className="flex items-center gap-3.5">
              <button
                onClick={() => navigate("/instructores")}
                className="flex size-9 items-center justify-center rounded-xl text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                title="Volver a instructores"
              >
                <ArrowLeft size={18} />
              </button>

              <div
                className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-sm"
                style={{ background: "linear-gradient(135deg, #fd761a 0%, #e05e07 100%)" }}
              >
                {initials}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                    {p.nombres} {p.apellidos}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      p.es_activo ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <span className={`size-1.5 rounded-full ${p.es_activo ? "bg-emerald-500" : "bg-gray-400"}`} />
                    {p.es_activo ? "Activo" : "Inactivo"}
                  </span>
                  {data.perfil?.especialidad && (
                    <span className="hidden rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-700 border border-orange-200 sm:inline-block">
                      {data.perfil.especialidad}
                    </span>
                  )}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                  {p.cedula && <span>CI: <b>{p.cedula}</b></span>}
                  {p.celular && (
                    <span className="flex items-center gap-1">
                      <Phone size={12} className="text-gray-400" />
                      {p.celular}
                    </span>
                  )}
                  {p.correo && (
                    <span className="flex items-center gap-1">
                      <Mail size={12} className="text-gray-400" />
                      {p.correo}
                    </span>
                  )}
                  {Boolean(getCiudadNombre(p.ciudad)) && (
                    <CiudadBadge ciudad={getCiudadNombre(p.ciudad)} />
                  )}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                disabled={togglingState}
                onClick={() => void handleToggleActivo()}
                className={`inline-flex items-center gap-2 rounded-xl border bg-white px-3.5 py-2 text-xs font-bold transition-all hover:bg-gray-50 active:scale-[0.98] ${
                  p.es_activo ? "text-amber-700 hover:border-amber-200" : "text-emerald-700 hover:border-emerald-200"
                }`}
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
              >
                <Power size={14} />
                {p.es_activo ? "Desactivar" : "Reactivar"}
              </button>

              <button
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:shadow active:scale-[0.98]"
                style={{ backgroundColor: COLORS.ACCENT }}
              >
                <Pencil size={14} />
                Editar Perfil
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          {/* Tabs Navigation */}
          <div
            className="flex gap-1.5 overflow-x-auto border-b bg-[#fafbfc] p-2.5"
            style={{ borderColor: COLORS.BORDER_SUBTLE }}
            role="tablist"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key
              const TabIcon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? "text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                  style={{
                    backgroundColor: isActive ? COLORS.ACCENT : "transparent",
                  }}
                  role="tab"
                  aria-selected={isActive}
                >
                  <TabIcon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                        isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                  {tab.badge && (
                    <span
                      className={`ml-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                        isActive ? "bg-white/25 text-white" : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Tab Panes */}
          <div className="p-4 sm:p-6 lg:p-7">
            {/* ==================== TAB 1: PERFIL PROFESIONAL ==================== */}
            {activeTab === "perfil" && (
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Left 2 Cols: Datos personales y biografía */}
                <div className="space-y-6 lg:col-span-2">
                  {/* Datos Personales */}
                  <div className="rounded-2xl border bg-white p-5 shadow-xs" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <div className="mb-4 flex items-center justify-between border-b pb-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <UserRound size={17} style={{ color: COLORS.ACCENT }} />
                        Datos Personales
                      </h3>
                      <button
                        onClick={() => setShowEditModal(true)}
                        className="text-xs font-semibold text-[#fd761a] hover:underline flex items-center gap-1"
                      >
                        <Pencil size={12} />
                        Editar
                      </button>
                    </div>

                    <div className="grid gap-4 text-sm sm:grid-cols-2">
                      <div className="rounded-xl bg-[#f8f9ff] p-3">
                        <span className="text-xs text-gray-500 block">Nombres y Apellidos</span>
                        <span className="font-semibold text-gray-800">{p.nombres} {p.apellidos}</span>
                      </div>
                      <div className="rounded-xl bg-[#f8f9ff] p-3">
                        <span className="text-xs text-gray-500 block">Cédula / Documento</span>
                        <span className="font-semibold text-gray-800">{p.cedula || "No registrada"}</span>
                      </div>
                      <div className="rounded-xl bg-[#f8f9ff] p-3">
                        <span className="text-xs text-gray-500 block">Correo Electrónico</span>
                        <span className="font-semibold text-gray-800">{p.correo || "No registrado"}</span>
                      </div>
                      <div className="rounded-xl bg-[#f8f9ff] p-3">
                        <span className="text-xs text-gray-500 block">Teléfono Celular</span>
                        <span className="font-semibold text-gray-800">{p.celular || "No registrado"}</span>
                      </div>
                      <div className="rounded-xl bg-[#f8f9ff] p-3">
                        <span className="text-xs text-gray-500 block mb-1">Ciudad</span>
                        {getCiudadNombre(p.ciudad) ? (
                          <CiudadBadge ciudad={getCiudadNombre(p.ciudad)} />
                        ) : (
                          <span className="font-semibold text-gray-800">No especificada</span>
                        )}
                      </div>
                      <div className="rounded-xl bg-[#f8f9ff] p-3">
                        <span className="text-xs text-gray-500 block">Cuenta de Sistema</span>
                        <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                          <ShieldCheck size={14} className={data.cuenta?.username ? "text-emerald-600" : "text-gray-400"} />
                          {data.cuenta?.username ? `@${data.cuenta.username}` : "Sin cuenta de usuario"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Perfil Profesional */}
                  <div className="rounded-2xl border bg-white p-5 shadow-xs" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <div className="mb-4 flex items-center justify-between border-b pb-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <GraduationCap size={17} style={{ color: COLORS.ACCENT }} />
                        Perfil Profesional
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">Especialidad</span>
                        <div className="inline-block rounded-lg bg-orange-50 px-3 py-1.5 text-sm font-semibold text-orange-800 border border-orange-200">
                          {data.perfil?.especialidad || "Sin especialidad definida"}
                        </div>
                      </div>

                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">Resumen / Biografía</span>
                        <div className="rounded-xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap min-h-[90px] border border-gray-100">
                          {data.perfil?.bio?.trim() ? data.perfil.bio : (
                            <span className="italic text-gray-400">No se ha registrado una biografía para este instructor.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right 1 Col: Quick Card Hoja de Vida + Actividad General */}
                <div className="space-y-6">
                  {/* Quick Card Hoja de Vida */}
                  <div className="rounded-2xl border bg-white p-5 shadow-xs" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <div className="mb-4 flex items-center justify-between border-b pb-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <FileText size={17} style={{ color: COLORS.ACCENT }} />
                        Hoja de Vida
                      </h3>
                      {data.hoja_vida && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={11} /> Cargada
                        </span>
                      )}
                    </div>

                    {data.hoja_vida ? (
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 rounded-xl border border-orange-100 bg-orange-50/50 p-3.5">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-xs">
                            <FileText size={20} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate text-xs font-bold text-gray-900" title={data.hoja_vida.nombre_original}>
                              {data.hoja_vida.nombre_original || "hoja-vida.pdf"}
                            </h4>
                            <p className="mt-0.5 text-[11px] text-gray-500">
                              {fmtSize(data.hoja_vida.size)}
                              {data.hoja_vida.updated_at && ` · Act. ${fmtDate(data.hoja_vida.updated_at)}`}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setActiveTab("hoja_vida")}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:opacity-90 active:scale-[0.98]"
                          style={{ backgroundColor: COLORS.ACCENT }}
                        >
                          <Eye size={14} />
                          Ver Documento en Visor
                        </button>
                      </div>
                    ) : (
                      <div className="text-center p-3">
                        <p className="text-xs text-gray-500 mb-3">No hay hoja de vida cargada para este instructor.</p>
                        <button
                          onClick={() => setActiveTab("hoja_vida")}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-1.5 text-xs font-bold text-orange-700 hover:bg-orange-100"
                        >
                          <Upload size={13} />
                          Cargar Hoja de Vida
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Resumen Académico Rápido */}
                  <div className="rounded-2xl border bg-white p-5 shadow-xs" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Actividad General</h4>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Cursos asignados</span>
                        <span className="font-bold text-gray-900">{totalCursos}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Talleres asignados</span>
                        <span className="font-bold text-gray-900">{totalTalleres}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Pagos registrados</span>
                        <span className="font-bold text-gray-900">{pagosSummary.count}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Total pagado</span>
                        <span className="font-bold text-emerald-600">{fmtMoney(pagosSummary.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TAB 2: CURSOS ==================== */}
            {activeTab === "cursos" && (
              <div className="space-y-5">
                {/* Sub-filters */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-2">
                    {[
                      { key: "todos" as const, label: "Todos", count: totalCursos },
                      { key: "actuales" as const, label: "Actuales", count: data.cursos?.actuales?.length || 0 },
                      { key: "proximos" as const, label: "Próximos", count: data.cursos?.proximos?.length || 0 },
                      { key: "historicos" as const, label: "Históricos", count: data.cursos?.historicos?.length || 0 },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setCourseFilter(tab.key)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          courseFilter === tab.key
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {tab.label} ({tab.count})
                      </button>
                    ))}
                  </div>
                </div>

                {filteredCursos.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-8 text-center text-sm text-gray-500">
                    No hay cursos registrados en esta categoría.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredCursos.map((c: CourseItem) => {
                      const nombre = c.nombre || c.catalogo?.nombre || "Curso"
                      const estado = c.estado || "—"
                      const estadoBadge =
                        estado === "en_progreso"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : estado === "finalizado"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : estado === "cancelado"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"

                      return (
                        <div
                          key={c.id}
                          className="flex flex-col justify-between rounded-xl border bg-white p-4 shadow-2xs transition hover:shadow-xs"
                          style={{ borderColor: COLORS.BORDER_SUBTLE }}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold text-gray-900 text-sm leading-snug">{nombre}</h4>
                              <span
                                className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${estadoBadge}`}
                              >
                                {estado.replace("_", " ")}
                              </span>
                            </div>

                            {c.es_personalizado && (
                              <span className="mt-2 inline-block rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700 border border-purple-200">
                                Personalizado
                              </span>
                            )}
                          </div>

                          <div className="mt-4 pt-3 border-t text-xs text-gray-500 space-y-1" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                            <div className="flex items-center gap-1.5">
                              <Calendar size={13} className="text-gray-400" />
                              <span>{fmtDate(c.fecha_inicio)} — {fmtDate(c.fecha_fin)}</span>
                            </div>
                            {Boolean(getCiudadNombre(c.ciudad)) && (
                              <div className="pt-0.5">
                                <CiudadBadge ciudad={getCiudadNombre(c.ciudad)} />
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ==================== TAB 3: TALLERES ==================== */}
            {activeTab === "talleres" && (
              <div className="space-y-5">
                {/* Sub-filters */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-2">
                    {[
                      { key: "todos" as const, label: "Todos", count: totalTalleres },
                      { key: "actuales" as const, label: "Actuales", count: data.talleres?.actuales?.length || 0 },
                      { key: "proximos" as const, label: "Próximos", count: data.talleres?.proximos?.length || 0 },
                      { key: "historicos" as const, label: "Históricos", count: data.talleres?.historicos?.length || 0 },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setWorkshopFilter(tab.key)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          workshopFilter === tab.key
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {tab.label} ({tab.count})
                      </button>
                    ))}
                  </div>
                </div>

                {filteredTalleres.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-8 text-center text-sm text-gray-500">
                    No hay talleres registrados en esta categoría.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredTalleres.map((w: WorkshopItem) => {
                      const nombre = w.nombre || "Taller"
                      const estado = w.estado || "—"
                      const estadoBadge =
                        estado === "confirmado" || estado === "en_progreso"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : estado === "finalizado"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : estado === "cancelado"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"

                      return (
                        <div
                          key={w.id}
                          className="flex flex-col justify-between rounded-xl border bg-white p-4 shadow-2xs transition hover:shadow-xs"
                          style={{ borderColor: COLORS.BORDER_SUBTLE }}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold text-gray-900 text-sm leading-snug">{nombre}</h4>
                              <span
                                className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${estadoBadge}`}
                              >
                                {estado.replace("_", " ")}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t text-xs text-gray-500 space-y-1" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                            <div className="flex items-center gap-1.5">
                              <Calendar size={13} className="text-gray-400" />
                              <span>{fmtDate(w.fecha)}{w.fecha_fin ? ` — ${fmtDate(w.fecha_fin)}` : ""}</span>
                            </div>
                            {Boolean(getCiudadNombre(w.ciudad)) && (
                              <div className="pt-0.5">
                                <CiudadBadge ciudad={getCiudadNombre(w.ciudad)} />
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ==================== TAB 4: HOJA DE VIDA (VISOR) ==================== */}
            {activeTab === "hoja_vida" && (
              <div className="space-y-4">
                {/* Header & Tooling bar */}
                <div
                  className="flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-xs">
                      <FileText size={22} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">
                        {data.hoja_vida?.nombre_original || "Hoja de Vida no cargada"}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {data.hoja_vida ? (
                          <>
                            {fmtSize(data.hoja_vida.size)}
                            {data.hoja_vida.updated_at && ` · Última actualización: ${fmtDate(data.hoja_vida.updated_at)}`}
                          </>
                        ) : (
                          "Adjunta un archivo PDF con la hoja de vida o currículum vitae del instructor."
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {data.hoja_vida ? (
                      <>
                        <button
                          onClick={() => void handleOpenCV(false)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50 active:scale-[0.98]"
                        >
                          <ExternalLink size={13} />
                          Abrir en ventana
                        </button>

                        <button
                          onClick={() => void handleOpenCV(true)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50 active:scale-[0.98]"
                        >
                          <Download size={13} />
                          Descargar
                        </button>

                        <button
                          disabled={uploadingCv}
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-700 transition hover:bg-orange-100 disabled:opacity-50"
                        >
                          <Upload size={13} />
                          {uploadingCv ? "Subiendo..." : "Reemplazar PDF"}
                        </button>

                        <button
                          onClick={() => setShowDeleteCvModal(true)}
                          title="Eliminar hoja de vida"
                          className="inline-flex items-center justify-center size-9 rounded-xl border border-red-200 text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    ) : (
                      <button
                        disabled={uploadingCv}
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: COLORS.ACCENT }}
                      >
                        <Upload size={14} />
                        {uploadingCv ? "Subiendo PDF..." : "Subir Hoja de Vida (PDF)"}
                      </button>
                    )}
                  </div>
                </div>

                {/* PDF Viewer Container */}
                {data.hoja_vida ? (
                  <div
                    className="relative flex flex-col rounded-2xl border bg-gray-50 shadow-inner overflow-hidden"
                    style={{ borderColor: COLORS.BORDER_SUBTLE, minHeight: "800px" }}
                  >
                    {loadingCvPdf ? (
                      <div className="flex flex-1 flex-col items-center justify-center p-12 text-center" style={{ minHeight: "750px" }}>
                        <div className="size-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#fd761a]" />
                        <p className="mt-4 text-sm font-semibold text-gray-700">Cargando visualizador de documento...</p>
                        <p className="text-xs text-gray-400 mt-1">Por favor espera un momento mientras preparamos el PDF.</p>
                      </div>
                    ) : cvPdfError ? (
                      <div className="flex flex-1 flex-col items-center justify-center p-12 text-center" style={{ minHeight: "750px" }}>
                        <FileText size={42} className="text-red-400 mb-2" />
                        <h4 className="text-base font-bold text-gray-800">No se pudo cargar la vista previa</h4>
                        <p className="text-xs text-gray-500 mt-1 max-w-md">
                          Ocurrió un problema al obtener el archivo. Puedes intentar recargarlo o abrirlo directamente en una pestaña nueva.
                        </p>
                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={() => void loadCvBlob()}
                            className="inline-flex items-center gap-1.5 rounded-xl border bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                          >
                            <RefreshCw size={13} /> Reintentar
                          </button>
                          <button
                            onClick={() => void handleOpenCV(false)}
                            className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white shadow-xs"
                            style={{ backgroundColor: COLORS.ACCENT }}
                          >
                            <ExternalLink size={13} /> Abrir en pestaña
                          </button>
                        </div>
                      </div>
                    ) : cvBlobUrl ? (
                      <div className="flex flex-1 flex-col h-full w-full">
                        <iframe
                          src={`${cvBlobUrl}#toolbar=1&view=FitH`}
                          title={`Hoja de vida - ${p.nombres} ${p.apellidos}`}
                          className="w-full flex-1 border-0 rounded-2xl bg-white"
                          style={{ minHeight: "820px", height: "100%" }}
                        />
                        <div className="flex items-center justify-between border-t bg-gray-100/80 px-4 py-2 text-[11px] text-gray-500">
                          <span>Visor de Hoja de Vida integrado</span>
                          <button
                            onClick={() => void handleOpenCV(false)}
                            className="font-semibold text-[#fd761a] hover:underline flex items-center gap-1"
                          >
                            <ExternalLink size={11} /> Abrir a pantalla completa
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  /* Empty state when no CV */
                  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white p-12 text-center" style={{ minHeight: "500px" }}>
                    <div className="flex size-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 mb-3 shadow-xs">
                      <FileUp size={30} />
                    </div>
                    <h4 className="text-base font-bold text-gray-800">No hay hoja de vida disponible</h4>
                    <p className="mt-1 text-xs text-gray-500 max-w-sm">
                      Este instructor no cuenta aún con un currículum vitae o expediente cargado. Puedes subir un documento PDF de hasta 10 MB.
                    </p>
                    <button
                      disabled={uploadingCv}
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                      style={{ backgroundColor: COLORS.ACCENT }}
                    >
                      <Upload size={15} />
                      {uploadingCv ? "Subiendo archivo..." : "Seleccionar archivo PDF"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ==================== TAB 5: PAGOS REGISTRADOS ==================== */}
            {activeTab === "pagos" && (
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border bg-white p-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                      <CreditCard size={15} style={{ color: COLORS.ACCENT }} />
                      Total Desembolsado
                    </div>
                    <div className="mt-2 text-2xl font-bold text-emerald-600">{fmtMoney(pagosSummary.total)}</div>
                  </div>

                  <div className="rounded-xl border bg-white p-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                      <FileText size={15} className="text-gray-400" />
                      Total de Transacciones
                    </div>
                    <div className="mt-2 text-2xl font-bold text-gray-900">{pagosSummary.count}</div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#fafbfc] border-b text-gray-500 uppercase tracking-wider" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                      <tr>
                        <th className="p-3.5">Fecha de Pago</th>
                        <th className="p-3.5">Concepto / Categoría</th>
                        <th className="p-3.5">Comprobante / Ref</th>
                        <th className="p-3.5">Método</th>
                        <th className="p-3.5 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-gray-700" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                      {data.pagos.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-sm text-gray-400">
                            No existen registros de egresos/pagos efectuados a este instructor.
                          </td>
                        </tr>
                      ) : (
                        data.pagos.map((pago, i) => (
                          <tr key={i} className="hover:bg-gray-50/50 transition">
                            <td className="p-3.5 font-medium text-gray-900">{fmtDate(String(pago.fecha_pago || ""))}</td>
                            <td className="p-3.5">
                              <span className="font-semibold text-gray-800 block">
                                {String(pago.descripcion || pago.categoria || "Pago de honorarios")}
                              </span>
                              {Boolean(pago.categoria) && (
                                <span className="text-[10px] text-gray-400 block">{String(pago.categoria)}</span>
                              )}
                            </td>
                            <td className="p-3.5 text-gray-600 font-mono text-[11px]">
                              {String(pago.comprobante_numero || pago.referencia || "—")}
                            </td>
                            <td className="p-3.5 capitalize text-gray-600">
                              {String(pago.metodo_pago || pago.forma_pago || "Transferencia")}
                            </td>
                            <td className="p-3.5 text-right font-bold text-emerald-600 text-sm">
                              {fmtMoney(String(pago.monto || 0))}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Confirmation Modal for deleting CV */}
      <ConfirmationModal
        isOpen={showDeleteCvModal}
        title="Eliminar Hoja de Vida"
        message={`¿Estás seguro de que deseas eliminar la hoja de vida de ${p.nombres} ${p.apellidos}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous
        icon="trash"
        isLoading={deletingCv}
        onConfirm={handleDeleteCV}
        onCancel={() => setShowDeleteCvModal(false)}
      />

      {/* Modal for editing Instructor Profile */}
      {showEditModal && (
        <PersonaFormModal
          editingId={p.id}
          instructorOnly
          onClose={() => setShowEditModal(false)}
          onSuccess={() => void load()}
        />
      )}
    </div>
  )
}
