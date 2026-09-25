/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle04Icon,
  Cancel01Icon,
  ArrowLeft01Icon,
  ArrowLeft02Icon,
  ArrowRight02Icon,
  ArrowRight01Icon,
  UserIcon,
  BookOpenIcon,
  PaymentIcon,
  Image01Icon,
  DashboardSquareIcon,
  Alert02Icon,
} from "@hugeicons/core-free-icons"
import { tallerService } from "@/services/taller.service"
import type { PagoTallerPreAprobacionRef } from "./PagoPreAprobacionTallerSection"
import { validarImagen, fixImageUrl } from "./AprobacionUtils"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { RejectModal } from "@/components/RejectModal"
import { ImageZoom } from "./ImageZoom"
import { TallerParticipanteTab } from "./components/solicitudes/TallerParticipanteTab"
import { TallerTallerTab } from "./components/solicitudes/TallerTallerTab"
import { TallerPagoTab } from "./components/solicitudes/TallerPagoTab"
import { TallerDocumentoTab } from "./components/solicitudes/TallerDocumentoTab"
import { CiudadBadge, ModalidadBadge } from "../estudiantes/components/Badges"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"

type TabId = "resumen" | "participante" | "taller" | "pago" | "documento"

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "resumen", label: "Resumen", icon: DashboardSquareIcon },
  { id: "participante", label: "Participante", icon: UserIcon },
  { id: "taller", label: "Taller", icon: BookOpenIcon },
  { id: "pago", label: "Pago", icon: PaymentIcon },
  { id: "documento", label: "C.Cédula", icon: Image01Icon },
]

export function AprobacionTallerPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const filtros = useMemo(() => {
    const f: Record<string, string> = {}
    const status = searchParams.get("status")
    const estado = searchParams.get("estado")
    const pagoVerificado = searchParams.get("pago_verificado")
    const search = searchParams.get("search")
    const tallerId = searchParams.get("taller_id")
    const fechaDesde = searchParams.get("fecha_desde")
    const fechaHasta = searchParams.get("fecha_hasta")

    if (status) f.status = status
    if (estado) f.estado = estado
    if (pagoVerificado) f.pago_verificado = pagoVerificado
    if (search) f.search = search
    if (tallerId) f.taller_id = tallerId
    if (fechaDesde) f.fecha_desde = fechaDesde
    if (fechaHasta) f.fecha_hasta = fechaHasta

    // Si no vino ningún filtro explícito, asumir por defecto "pendientes"
    if (!status && !estado && !pagoVerificado) {
      f.status = "pendientes"
      f.estado = "activo"
      f.pago_verificado = "false"
    }

    return f
  }, [searchParams])

  const searchStr = searchParams.toString() ? `?${searchParams.toString()}` : ""

  const [selected, setSelected] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>("resumen")

  const [adjacent, setAdjacent] = useState<{
    prev_id: string | null; next_id: string | null; first_id: string | null
    position: number; total: number; stale: boolean; stale_estado?: string
  }>({ prev_id: null, next_id: null, first_id: null, position: 1, total: 0, stale: false })

  const [editField, setEditField] = useState<string | null>(null)
  const [editVal, setEditVal] = useState("")
  const [savingEdit, setSavingEdit] = useState(false)

  const [expandedComprobante, setExpandedComprobante] = useState(false)
  const [expandedImageUrl, setExpandedImageUrl] = useState<string | null>(null)
  const [uploadingCedula, setUploadingCedula] = useState(false)
  const [uploadingComprobante, setUploadingComprobante] = useState(false)
  const [deletingComprobante, setDeletingComprobante] = useState(false)
  const [deletingCedula, setDeletingCedula] = useState(false)
  const [deleteArchivoModal, setDeleteArchivoModal] = useState<{ type: "comprobante" | "cedula"; label: string } | null>(null)
  const cedulaRef = useRef<HTMLInputElement>(null)
  const comprobanteRef = useRef<HTMLInputElement>(null)

  const pagoRef = useRef<PagoTallerPreAprobacionRef>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmReject, setConfirmReject] = useState(false)
  const [confirmApprove, setConfirmApprove] = useState(false)

  const precioBase = Number(selected?.taller?.precio || 0)

  const fetchDetail = useCallback(async (targetId?: string) => {
    const fetchId = targetId || id
    if (!fetchId) return
    setLoading(true)
    try {
      const res = await tallerService.getInscripcionById(fetchId)
      setSelected((res as any).data || res)
    } catch {
      toast.error("Error al cargar inscripción")
      if (targetId) navigate(`/matriculas${searchStr}`)
    } finally {
      setLoading(false)
    }
  }, [id, navigate, searchStr])

  const fetchAdjacent = useCallback(async (targetId?: string) => {
    const fetchId = targetId || id
    if (!fetchId) return
    try {
      const data = await tallerService.getAdjacent(fetchId, filtros)
      setAdjacent(data)
    } catch { /* silent */ }
  }, [id, filtros])

  const navigateTo = useCallback(async (targetId: string) => {
    navigate(`/matriculas/aprobacion/taller/${targetId}${searchStr}`, { replace: true })
  }, [navigate, searchStr])

  useEffect(() => {
    fetchDetail()
    fetchAdjacent()
  }, [fetchDetail, fetchAdjacent])

  const getTallerNombre = useCallback(() => selected?.taller?.nombre || "—", [selected])

  const startEdit = (field: string, value: string) => { setEditField(field); setEditVal(value) }
  const cancelEdit = () => { setEditField(null); setEditVal("") }

  const saveEdit = async () => {
    if (!id || !editField || editVal === "") return
    setSavingEdit(true)
    try {
      const data: any = { [editField]: editVal }
      await tallerService.actualizarInscripcion(id, data)
      setSelected((prev: any) => prev ? { ...prev, [editField]: editVal } : prev)
      toast.success("Dato actualizado correctamente")
      setEditField(null); setEditVal("")
      fetchDetail()
    } catch {
      toast.error("Error al actualizar dato")
    } finally { setSavingEdit(false) }
  }

  const handleUploadCedula = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return
    const error = validarImagen(file, 2)
    if (error) { toast.error(error); return }
    setUploadingCedula(true)
    try {
      const res = await tallerService.subirCedula(id, file)
      setSelected((prev: any) => ({ ...prev, cedula_url: (res as any).cedula_url }))
      toast.success("Cédula subida correctamente")
    } catch { toast.error("Error al subir cédula") }
    finally { setUploadingCedula(false) }
  }

  const handleUploadComprobante = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return
    const error = validarImagen(file, 5)
    if (error) { toast.error(error); return }
    setUploadingComprobante(true)
    try {
      const res = await tallerService.subirComprobante(id, file)
      setSelected((prev: any) => ({ ...prev, comprobante_url: (res as any).comprobante_url }))
      toast.success("Comprobante subido correctamente")
    } catch { toast.error("Error al subir comprobante") }
    finally { setUploadingComprobante(false) }
  }

  const handleDeleteComprobante = async () => {
    setDeleteArchivoModal(null)
    if (!id) return
    setDeletingComprobante(true)
    try {
      await tallerService.deleteArchivo(id, "comprobante_url")
      toast.success("Comprobante eliminado")
      setSelected((prev: any) => ({ ...prev, comprobante_url: null, comprobante_purgado: true }))
    } catch { toast.error("Error al eliminar comprobante") }
    finally { setDeletingComprobante(false) }
  }

  const handleDeleteCedula = async () => {
    setDeleteArchivoModal(null)
    if (!id) return
    setDeletingCedula(true)
    try {
      await tallerService.deleteArchivo(id, "cedula_url")
      toast.success("Cédula eliminada")
      setSelected((prev: any) => ({ ...prev, cedula_url: null }))
    } catch { toast.error("Error al eliminar cédula") }
    finally { setDeletingCedula(false) }
  }

  const handleApprove = async () => {
    if (!id) return
    setActionLoading(true)
    try {
      const pagoGuardado = await pagoRef.current?.submit()
      if (pagoGuardado === false) {
        setActionLoading(false)
        toast.error("Error al validar datos del pago")
        return
      }
      const montoPagado = pagoRef.current?.getMonto() || 0
      const tipoPago = pagoRef.current?.getTipoPago() || "abono"
      const metodoPago = pagoRef.current?.getMetodoPago() || "efectivo"
      await tallerService.verificarPago(id, {
        monto_pagado: montoPagado,
        tipo_pago: tipoPago,
        metodo_pago: metodoPago,
      })
      setSelected((prev: any) => prev ? { ...prev, pago_verificado: true } : prev)
      toast.success("Inscripción aprobada exitosamente")
      setActionLoading(false)
      setConfirmApprove(false)
      queryClient.invalidateQueries({ queryKey: ["talleres-inscripciones-pendientes"] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      navigate("/matriculas?tab=talleres&status=aprobados")
    } catch (err) {
      setActionLoading(false)
      setConfirmApprove(false)
      toast.error((err as any)?.response?.data?.mensaje || "Error al aprobar inscripción")
    }
  }

  const handleReject = async () => {
    if (!id) return
    setActionLoading(true)
    try {
      await tallerService.cambiarEstadoInscripcion(id, "retirado")
      toast.success("Inscripción rechazada")
      setActionLoading(false)
      queryClient.invalidateQueries({ queryKey: ["talleres-inscripciones-pendientes"] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      navigate("/matriculas?tab=talleres&status=rechazados")
    } catch {
      setActionLoading(false)
      toast.error("Error al rechazar inscripción")
    }
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-[#f8fafc] items-center justify-center p-6">
        <div className="w-10 h-10 rounded-full border-3 border-[#fd761a] border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-500">Cargando expediente del taller...</p>
      </div>
    )
  }

  if (!selected) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-[#f8fafc] items-center justify-center p-6 text-center">
        <HugeiconsIcon icon={Alert02Icon} size={36} className="text-rose-500 mb-2" />
        <h2 className="text-lg font-bold text-slate-900">No se encontró la inscripción</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Es posible que el registro haya sido retirado o ya no esté disponible.
        </p>
        <button
          onClick={() => navigate("/matriculas?tab=talleres")}
          className="mt-4 px-4 py-2 rounded-xl bg-[#fd761a] text-white text-xs font-bold shadow-sm"
        >
          Volver a la bandeja
        </button>
      </div>
    )
  }

  const isAprobado = Boolean(selected.pago_verificado)
  const isRechazado = selected.estado === "retirado"
  const yaProcesada = isAprobado || isRechazado
  const cedulaUrl = selected.cedula_url ? fixImageUrl(selected.cedula_url) : null
  const compUrl = selected.comprobante_url ? fixImageUrl(selected.comprobante_url) : null
  const montoPagado = Number(selected.monto_pagado || 0)

  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50/50 text-slate-900 antialiased selection:bg-[#fd761a] selection:text-white">
      {/* 1. Header & Adjacent Navigation */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => navigate(`/matriculas${searchStr}`)}
              className="w-8 h-8 rounded-lg border border-slate-200/80 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
              title="Volver a la bandeja"
              type="button"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  {selected.nombres || "—"} {selected.apellidos || ""}
                </h1>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  isAprobado
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : isRechazado
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200/70"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isAprobado
                      ? "bg-emerald-500"
                      : isRechazado
                        ? "bg-rose-500"
                        : "bg-amber-500"
                  }`} />
                  {isAprobado ? "Aprobada" : isRechazado ? "Rechazada" : "Pendiente"}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{getTallerNombre()}</span>
                <span>•</span>
                <CiudadBadge ciudad={selected.taller?.ciudad?.nombre || selected.ciudad} />
                <ModalidadBadge modalidad={selected.taller?.modalidad} />
              </div>
            </div>
          </div>

          {/* Adjacent Pagination */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/60">
              <span className="text-[11px] font-semibold text-slate-600 px-2 whitespace-nowrap">
                Solicitud {adjacent.position} de {adjacent.total || 1}
              </span>
              <button
                onClick={() => adjacent.prev_id && navigateTo(adjacent.prev_id)}
                disabled={!adjacent.prev_id}
                className="w-6 h-6 flex items-center justify-center rounded-md bg-white text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                title="Solicitud anterior"
                type="button"
              >
                <HugeiconsIcon icon={ArrowLeft02Icon} size={13} />
              </button>
              <button
                onClick={() => adjacent.next_id && navigateTo(adjacent.next_id)}
                disabled={!adjacent.next_id}
                className="w-6 h-6 flex items-center justify-center rounded-md bg-white text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                title="Siguiente solicitud"
                type="button"
              >
                <HugeiconsIcon icon={ArrowRight02Icon} size={13} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {adjacent.stale && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between text-xs text-amber-900 font-medium">
            <span>
              Esta inscripción ya fue procesada anteriormente — Estado: <strong className="capitalize">{adjacent.stale_estado?.replace(/_/g, " ") || "—"}</strong>
            </span>
            {adjacent.first_id && (
              <button
                onClick={() => navigateTo(adjacent.first_id!)}
                className="px-2.5 py-0.5 rounded-md text-xs font-bold border border-amber-300 bg-white hover:bg-amber-100 transition-colors cursor-pointer"
              >
                Ir a siguiente pendiente
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Sticky Tabs Bar */}
      <aside className="sticky top-[53px] sm:top-[57px] z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav aria-label="Pestañas de taller" className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                  className={`relative flex items-center gap-1.5 py-2.5 px-3 text-xs transition-all whitespace-nowrap cursor-pointer border-b-2 font-bold ${
                    isActive
                      ? "text-[#fd761a] border-[#fd761a]"
                      : "text-slate-500 hover:text-slate-900 border-transparent font-medium"
                  }`}
                >
                  <HugeiconsIcon icon={tab.icon} size={15} />
                  <span>{tab.label}</span>
                  {tab.id === "pago" && !isAprobado && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#fd761a]" />
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* 3. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-8">
        {activeTab === "resumen" && (
          <div className="space-y-4 sm:space-y-5">
            {/* Top Banner Notice */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/80 shadow-2xs">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Resumen de la inscripción
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verificación de participante, asignación lectiva y validación de arancel
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200/60 text-xs font-semibold text-orange-800 self-start sm:self-auto">
                <HugeiconsIcon icon={CheckmarkCircle04Icon} size={14} className="text-orange-600" />
                <span>Listo para validación de pago y cupo oficial</span>
              </div>
            </div>

            {/* 4 Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Participante */}
              <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
                <div>
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                        <HugeiconsIcon icon={UserIcon} size={17} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Participante</h3>
                        <span className="text-[11px] text-slate-400">Datos personales</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Verificado
                    </span>
                  </div>

                  <dl className="py-2.5 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <dt className="text-slate-500 font-medium">Nombre:</dt>
                      <dd className="font-bold text-slate-900 truncate max-w-[200px] text-right">
                        {selected.nombres || "—"} {selected.apellidos || ""}
                      </dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-slate-500 font-medium">Cédula:</dt>
                      <dd className="font-mono font-semibold text-slate-800">
                        {selected.cedula || "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-slate-500 font-medium">Edad:</dt>
                      <dd className="text-slate-800 font-medium">
                        {selected.edad ? `${selected.edad} años` : "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-slate-500 font-medium">Ubicación:</dt>
                      <dd>
                        <CiudadBadge ciudad={selected.ciudad} />
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setActiveTab("participante")}
                    type="button"
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/80 transition-colors cursor-pointer"
                  >
                    <span>Ver información completa</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                  </button>
                </div>
              </div>

              {/* Card 2: Taller */}
              <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
                <div>
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-[#fd761a]">
                        <HugeiconsIcon icon={BookOpenIcon} size={17} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Taller</h3>
                        <span className="text-[11px] text-slate-400">Oferta formativa</span>
                      </div>
                    </div>
                    <ModalidadBadge modalidad={selected.taller?.modalidad} />
                  </div>

                  <dl className="py-2.5 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <dt className="text-slate-500 font-medium">Taller:</dt>
                      <dd className="font-bold text-slate-900 text-right truncate max-w-[200px]">
                        {getTallerNombre()}
                      </dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-slate-500 font-medium">Fecha:</dt>
                      <dd className="text-slate-800 font-medium">
                        {selected.taller?.fecha ? new Date(selected.taller.fecha).toLocaleDateString("es-EC") : "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-slate-500 font-medium">Sede:</dt>
                      <dd>
                        <CiudadBadge ciudad={selected.taller?.ciudad?.nombre || selected.ciudad} />
                      </dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-slate-500 font-medium">Arancel oficial:</dt>
                      <dd className="font-bold text-slate-900 font-mono">
                        ${precioBase.toFixed(2)} USD
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setActiveTab("taller")}
                    type="button"
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/80 transition-colors cursor-pointer"
                  >
                    <span>Ver detalles del taller</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                  </button>
                </div>
              </div>

              {/* Card 3: Pago */}
              <div className="bg-white rounded-xl border border-orange-200/90 p-4 shadow-2xs flex flex-col justify-between relative overflow-hidden">
                <div>
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-[#fd761a]">
                        <HugeiconsIcon icon={PaymentIcon} size={17} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Estado de pago</h3>
                        <span className="text-[11px] font-medium text-amber-700">
                          {isAprobado ? "Aprobado en contabilidad" : "Se valida formalmente al aprobar"}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-orange-50 border border-orange-200 text-[#9d4300]">
                      {isAprobado ? "Verificado" : "Pendiente"}
                    </span>
                  </div>

                  <div className="py-2.5 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Método de pago:</span>
                      <span className="font-semibold text-slate-900 uppercase text-[11px]">
                        {selected.metodo_pago || "Efectivo / Transferencia"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Fecha declarada:</span>
                      <span className="text-slate-800 text-xs font-mono">
                        {selected.fecha_pago ? new Date(selected.fecha_pago).toLocaleDateString("es-EC") : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-orange-50/70 p-2 rounded-lg border border-orange-100">
                      <span className="font-bold text-orange-950 text-xs">Monto declarado:</span>
                      <span className="text-sm sm:text-base font-black text-[#fd761a] font-mono">
                        ${montoPagado > 0 ? montoPagado.toFixed(2) : precioBase.toFixed(2)} USD
                      </span>
                    </div>
                    {compUrl && (
                      <div className="flex items-center justify-between text-xs pt-0.5">
                        <span className="text-slate-500 font-medium">Comprobante adjunto:</span>
                        <button
                          type="button"
                          onClick={() => setExpandedImageUrl(compUrl)}
                          className="font-bold text-[#fd761a] hover:underline cursor-pointer"
                        >
                          Ver comprobante
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setActiveTab("pago")}
                    type="button"
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-orange-50 hover:bg-orange-100 text-[#9d4300] text-xs font-bold border border-orange-200/80 transition-colors cursor-pointer"
                  >
                    <span>Revisar y verificar pago</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                  </button>
                </div>
              </div>

              {/* Card 4: Cédula de Identidad */}
              <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
                <div>
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                        <HugeiconsIcon icon={Image01Icon} size={17} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Cédula de Identidad</h3>
                        <span className="text-[11px] text-slate-400">Documento fotográfico</span>
                      </div>
                    </div>
                    {cedulaUrl ? (
                      <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <HugeiconsIcon icon={CheckmarkCircle04Icon} size={12} />
                        Adjunta
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-slate-100 text-slate-600">
                        Sin adjunto
                      </span>
                    )}
                  </div>

                  {/* Photo preview */}
                  <div className="my-2.5 p-2 bg-slate-950 rounded-lg flex items-center gap-3 text-white overflow-hidden shadow-inner">
                    {cedulaUrl ? (
                      <div
                        onClick={() => setExpandedImageUrl(cedulaUrl)}
                        className="w-20 h-14 rounded-md bg-slate-900 border border-slate-700 overflow-hidden shrink-0 cursor-pointer relative group"
                      >
                        <img
                          src={cedulaUrl}
                          alt="Cédula de identidad"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-bold text-white transition-opacity">
                          Ampliar
                        </div>
                      </div>
                    ) : (
                      <div className="w-20 h-14 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 shrink-0">
                        <HugeiconsIcon icon={Image01Icon} size={20} />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-100 truncate">
                        {cedulaUrl ? "cedula_participante.jpg" : "Sin documento cargado"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {cedulaUrl ? "Documento fotográfico JPG / PNG" : "Pendiente de adjuntar"}
                      </p>
                      {cedulaUrl && (
                        <span className="inline-block mt-0.5 text-[10px] text-emerald-400 font-medium">
                          ✓ Imagen legible para verificación
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Cotejo visual de datos filiatorios con el participante registrado en el taller.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      if (cedulaUrl) setExpandedImageUrl(cedulaUrl)
                      else setActiveTab("documento")
                    }}
                    type="button"
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/80 transition-colors cursor-pointer"
                  >
                    <span>{cedulaUrl ? "Ver imagen en visor" : "Gestionar documento"}</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "participante" && (
          <TallerParticipanteTab
            selected={selected}
            editField={editField}
            editVal={editVal}
            startEdit={startEdit}
            setEditVal={setEditVal}
            saveEdit={saveEdit}
            cancelEdit={cancelEdit}
            savingEdit={savingEdit}
          />
        )}

        {activeTab === "taller" && (
          <TallerTallerTab selected={selected} />
        )}

        {activeTab === "pago" && (
          <TallerPagoTab
            selected={selected}
            yaProcesada={yaProcesada}
            editField={editField}
            editVal={editVal}
            startEdit={startEdit}
            setEditVal={setEditVal}
            saveEdit={saveEdit}
            cancelEdit={cancelEdit}
            savingEdit={savingEdit}
            comprobanteRef={comprobanteRef}
            handleUploadComprobante={handleUploadComprobante}
            uploadingComprobante={uploadingComprobante}
            expandedComprobante={expandedComprobante}
            setExpandedComprobante={setExpandedComprobante}
            setDeleteArchivoModal={setDeleteArchivoModal}
            deletingComprobante={deletingComprobante}
            setExpandedImageUrl={setExpandedImageUrl}
            pagoRef={pagoRef}
            precioBase={precioBase}
            getTallerNombre={getTallerNombre}
          />
        )}

        {activeTab === "documento" && (
          <TallerDocumentoTab
            selected={selected}
            cedulaRef={cedulaRef}
            handleUploadCedula={handleUploadCedula}
            uploadingCedula={uploadingCedula}
            deletingCedula={deletingCedula}
            setDeleteArchivoModal={setDeleteArchivoModal}
            setExpandedImageUrl={setExpandedImageUrl}
          />
        )}
      </main>

      {/* 4. Sticky Bottom Approval Bar */}
      <footer className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-2px_12px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col md:flex-row items-center justify-between gap-2.5">
          {/* Validation Checklist Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70 whitespace-nowrap">
              <HugeiconsIcon icon={CheckmarkCircle04Icon} size={13} className="text-emerald-600" />
              Participante verificado
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 text-orange-900 border border-orange-200/70 whitespace-nowrap">
              <HugeiconsIcon icon={PaymentIcon} size={13} className="text-[#fd761a]" />
              {isAprobado ? "Pago verificado" : `Arancel taller: $${precioBase.toFixed(2)}`}
            </span>

            {cedulaUrl ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70 whitespace-nowrap">
                <HugeiconsIcon icon={CheckmarkCircle04Icon} size={13} className="text-emerald-600" />
                Cédula adjunta
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/70 whitespace-nowrap">
                Cédula no adjunta
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <button
              onClick={() => setConfirmReject(true)}
              disabled={actionLoading || yaProcesada}
              type="button"
              className="px-3.5 py-2 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={15} />
              <span>Rechazar inscripción</span>
            </button>

            <button
              onClick={() => setConfirmApprove(true)}
              disabled={actionLoading || yaProcesada}
              type="button"
              className="px-5 py-2 rounded-xl bg-[#fd761a] hover:bg-[#ea580c] active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs shadow-[#fd761a]/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <HugeiconsIcon icon={CheckmarkCircle04Icon} size={16} />
                  <span>
                    {yaProcesada ? "Inscripción procesada" : "Aprobar inscripción"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ConfirmationModal
        isOpen={confirmApprove}
        title="Aprobar Inscripción a Taller"
        message="Se aprobará la inscripción del participante y se verificará el pago en el sistema."
        confirmText="Aprobar"
        cancelText="Cancelar"
        isLoading={actionLoading}
        icon="info"
        onConfirm={handleApprove}
        onCancel={() => setConfirmApprove(false)}
      />

      <RejectModal
        isOpen={confirmReject}
        isLoading={actionLoading}
        onConfirm={handleReject}
        onCancel={() => setConfirmReject(false)}
      />

      <ConfirmationModal
        isOpen={deleteArchivoModal !== null}
        title="Eliminar archivo del almacenamiento"
        message={`¿Eliminar la imagen de la ${deleteArchivoModal?.label} del almacenamiento? El registro se conservará como constancia histórica. Esta acción es irreversible.`}
        confirmText="Eliminar archivo"
        cancelText="Cancelar"
        isLoading={deleteArchivoModal?.type === "comprobante" ? deletingComprobante : deletingCedula}
        icon="danger"
        onConfirm={() => deleteArchivoModal?.type === "comprobante" ? handleDeleteComprobante() : handleDeleteCedula()}
        onCancel={() => setDeleteArchivoModal(null)}
      />

      {expandedImageUrl && (
        <ImageZoom url={expandedImageUrl} onClose={() => setExpandedImageUrl(null)} />
      )}
    </div>
  )
}
