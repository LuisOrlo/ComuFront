/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle04Icon, Cancel01Icon, ArrowLeft01Icon, ArrowLeft02Icon, ArrowRight02Icon,
  UserIcon, BookOpenIcon, PaymentIcon, Image01Icon, DashboardSquareIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { tallerService } from "@/services/taller.service"
import type { PagoTallerPreAprobacionRef } from "./PagoPreAprobacionTallerSection"
import { validarImagen } from "./AprobacionUtils"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { RejectModal } from "@/components/RejectModal"
import { ImageZoom } from "./ImageZoom"
import { TallerParticipanteTab } from "./components/solicitudes/TallerParticipanteTab"
import { TallerTallerTab } from "./components/solicitudes/TallerTallerTab"
import { TallerPagoTab } from "./components/solicitudes/TallerPagoTab"
import { TallerDocumentoTab } from "./components/solicitudes/TallerDocumentoTab"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

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

  const filtros = useMemo(() => ({
    estado: searchParams.get("estado") || "",
    search: searchParams.get("search") || "",
    pago_verificado: searchParams.get("pago_verificado") || "",
    fecha_desde: searchParams.get("fecha_desde") || "",
    fecha_hasta: searchParams.get("fecha_hasta") || "",
  }), [searchParams])

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
    // Navegación real: evita editar o aprobar la inscripción anterior por error.
    navigate(`/matriculas/aprobacion/taller/${targetId}${searchStr}`, { replace: true })
  }, [navigate, searchStr])

  useEffect(() => { fetchDetail(); fetchAdjacent() }, [fetchDetail, fetchAdjacent])

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
      toast.error("Error al actualizar")
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
      toast.success("Cédula subida")
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
      toast.success("Comprobante subido")
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
        toast.error("Error al guardar pago")
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
      navigate("/matriculas?tab=talleres&status=aprobados")
    } catch (err) {
      setActionLoading(false)
      setConfirmApprove(false)
      toast.error((err as any)?.response?.data?.mensaje || "Error al aprobar")
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
      navigate("/matriculas?tab=talleres&status=rechazados")
    } catch {
      setActionLoading(false)
      toast.error("Error al rechazar")
    }
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-gray-50/50">
        <div className="bg-white border-b shrink-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="max-w-[900px] mx-auto px-6 py-6">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/matriculas")} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
                <HugeiconsIcon icon={ArrowLeft01Icon} size={18} style={{ color: COLORS.CHARCOAL }} />
              </button>
              <h1 className="text-xl font-bold" style={{ color: COLORS.CHARCOAL }}>Detalle de Inscripción</h1>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>Cargando...</p>
        </div>
      </div>
    )
  }

  if (!selected) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-gray-50/50">
        <div className="bg-white border-b shrink-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="max-w-[900px] mx-auto px-6 py-6">
            <button onClick={() => navigate("/matriculas")} className="flex items-center gap-2 text-sm font-medium" style={{ color: COLORS.ACCENT }}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />Volver
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>No se encontró la inscripción</p>
        </div>
      </div>
    )
  }

  const yaProcesada = selected.pago_verificado || selected.estado !== "activo"

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50/50">
      <div className="bg-white border-b shrink-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="max-w-[900px] mx-auto px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(`/matriculas${searchStr}`)} className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors">
                <HugeiconsIcon icon={ArrowLeft01Icon} size={18} style={{ color: COLORS.CHARCOAL }} />
              </button>
              <div>
                <h1 className="text-base font-bold" style={{ color: COLORS.CHARCOAL }}>
                  {selected.nombres || "—"} {selected.apellidos || ""}
                </h1>
                <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>{getTallerNombre()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: COLORS.TEXT_MUTED }}>
              <span className="font-semibold whitespace-nowrap" style={{ color: COLORS.CHARCOAL }}>
                Solicitud {adjacent.position} de {adjacent.total}
              </span>
              <div className="flex gap-1">
                <button onClick={() => adjacent.prev_id && navigateTo(adjacent.prev_id)} disabled={!adjacent.prev_id}
                  className="size-7 flex items-center justify-center rounded-lg border hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <HugeiconsIcon icon={ArrowLeft02Icon} size={14} style={{ color: COLORS.CHARCOAL }} />
                </button>
                <button onClick={() => adjacent.next_id && navigateTo(adjacent.next_id)} disabled={!adjacent.next_id}
                  className="size-7 flex items-center justify-center rounded-lg border hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <HugeiconsIcon icon={ArrowRight02Icon} size={14} style={{ color: COLORS.CHARCOAL }} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {adjacent.stale && (
        <div className="bg-amber-50 border-b" style={{ borderColor: "oklch(0.85 0.12 80)" }}>
          <div className="max-w-[900px] mx-auto px-6 py-3 flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: "oklch(0.5 0.1 70)" }}>
              Esta inscripción ya fue procesada — Estado: <span className="font-bold capitalize">{adjacent.stale_estado?.replace(/_/g, " ") || "—"}</span>
            </span>
            {adjacent.first_id && (
              <button onClick={() => navigateTo(adjacent.first_id!)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors hover:bg-amber-100"
                style={{ borderColor: "oklch(0.85 0.12 80)", color: "oklch(0.5 0.1 70)" }}>
                Ir a siguiente pendiente
              </button>
            )}
          </div>
        </div>
      )}

      <div className="sticky top-0 z-10 bg-white border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="max-w-[900px] mx-auto px-6">
          <div role="tablist" aria-label="Secciones de la inscripción" className="flex gap-1 overflow-x-auto scrollbar-hide">
            {TABS.map(tab => (
              <button key={tab.id} role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-3 sm:px-4 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap shrink-0"
                style={{ borderColor: activeTab === tab.id ? COLORS.ACCENT : "transparent", color: activeTab === tab.id ? COLORS.CHARCOAL : COLORS.TEXT_MUTED }}>
                <HugeiconsIcon icon={tab.icon} size={14} /><span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[900px] mx-auto w-full px-6 py-6">
          <div role="tabpanel" className="bg-white rounded-2xl border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <div className="p-6">
              {activeTab === "resumen" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <HugeiconsIcon icon={DashboardSquareIcon} size={15} style={{ color: COLORS.ACCENT }} />
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Resumen de la inscripción</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE, borderLeft: "3px solid oklch(0.55 0.15 240)" }}>
                      <div className="flex items-center gap-2 mb-3">
                        <HugeiconsIcon icon={UserIcon} size={14} style={{ color: "oklch(0.55 0.15 240)" }} />
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "oklch(0.55 0.15 240)" }}>Participante</span>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <p className="font-bold" style={{ color: COLORS.CHARCOAL }}>{selected.nombres} {selected.apellidos}</p>
                        <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                          Cédula: <span className="font-medium font-mono" style={{ color: COLORS.CHARCOAL }}>{selected.cedula || "—"}</span>
                        </p>
                        <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                          Edad: <span className="font-medium" style={{ color: COLORS.CHARCOAL }}>{selected.edad ? `${selected.edad} años` : "—"}</span>
                        </p>
                        <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                          Ciudad: <span className="font-medium" style={{ color: COLORS.CHARCOAL }}>{selected.ciudad || "—"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE, borderLeft: "3px solid oklch(0.55 0.12 300)" }}>
                      <div className="flex items-center gap-2 mb-3">
                        <HugeiconsIcon icon={BookOpenIcon} size={14} style={{ color: "oklch(0.55 0.12 300)" }} />
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "oklch(0.55 0.12 300)" }}>Taller</span>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <p className="font-bold" style={{ color: COLORS.CHARCOAL }}>{getTallerNombre()}</p>
                        <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                          Fecha: <span className="font-medium" style={{ color: COLORS.CHARCOAL }}>
                            {selected.taller?.fecha ? new Date(selected.taller.fecha).toLocaleDateString('es-ES') : "—"}
                          </span>
                        </p>
                        <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                          Precio: <span className="font-medium" style={{ color: COLORS.CHARCOAL }}>${precioBase.toFixed(2)}</span>
                        </p>
                        {selected.taller?.modalidad && (
                          <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                            {selected.taller.modalidad.charAt(0).toUpperCase() + selected.taller.modalidad.slice(1)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE, borderLeft: "3px solid oklch(0.65 0.15 75)" }}>
                      <div className="flex items-center gap-2 mb-3">
                        <HugeiconsIcon icon={PaymentIcon} size={14} style={{ color: "oklch(0.65 0.15 75)" }} />
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "oklch(0.65 0.15 75)" }}>Pago</span>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <p className="text-xs">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
                            style={{ backgroundColor: "oklch(0.55 0.15 240 / 0.12)", color: "oklch(0.55 0.15 240)" }}>
                            {(selected.metodo_pago || "—").toUpperCase()}
                          </span>
                        </p>
                        <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                          Fecha: <span className="font-medium" style={{ color: COLORS.CHARCOAL }}>
                            {selected.fecha_pago ? new Date(selected.fecha_pago).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : "—"}
                          </span>
                        </p>
                        <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                          Monto: <span className="font-medium" style={{ color: COLORS.CHARCOAL }}>
                            {Number(selected.monto_pagado) > 0 ? `$${Number(selected.monto_pagado).toFixed(2)}` : "Por registrar"}
                          </span>
                        </p>
                        {selected.comprobante_url && (
                          <button onClick={() => setExpandedImageUrl(selected.comprobante_url)}
                            className="text-xs font-semibold hover:underline" style={{ color: COLORS.ACCENT }}>
                            Ver comprobante
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE, borderLeft: "3px solid oklch(0.55 0.15 160)" }}>
                      <div className="flex items-center gap-2 mb-3">
                        <HugeiconsIcon icon={Image01Icon} size={14} style={{ color: "oklch(0.55 0.15 160)" }} />
                        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "oklch(0.55 0.15 160)" }}>Cédula</span>
                      </div>
                      {selected.cedula_url ? (
                        <img src={selected.cedula_url} alt="Cédula"
                          className="w-full object-contain max-h-[140px] rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                          style={{ borderColor: COLORS.BORDER_SUBTLE }}
                          onClick={() => setExpandedImageUrl(selected.cedula_url)} />
                      ) : (
                        <span className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>No se ha subido la foto de cédula</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "participante" && (
                <TallerParticipanteTab selected={selected} editField={editField} editVal={editVal}
                  startEdit={startEdit} setEditVal={setEditVal} saveEdit={saveEdit} cancelEdit={cancelEdit} savingEdit={savingEdit} />
              )}
              {activeTab === "taller" && (
                <TallerTallerTab selected={selected} />
              )}
              {activeTab === "pago" && (
                <TallerPagoTab selected={selected} yaProcesada={yaProcesada}
                  editField={editField} editVal={editVal}
                  startEdit={startEdit} setEditVal={setEditVal}
                  saveEdit={saveEdit} cancelEdit={cancelEdit} savingEdit={savingEdit}
                  comprobanteRef={comprobanteRef} handleUploadComprobante={handleUploadComprobante}
                  uploadingComprobante={uploadingComprobante} expandedComprobante={expandedComprobante}
                  setExpandedComprobante={setExpandedComprobante}
                  setDeleteArchivoModal={setDeleteArchivoModal} deletingComprobante={deletingComprobante}
                  setExpandedImageUrl={setExpandedImageUrl}
                  pagoRef={pagoRef} precioBase={precioBase}
                  getTallerNombre={getTallerNombre} />
              )}
              {activeTab === "documento" && (
                <TallerDocumentoTab selected={selected} cedulaRef={cedulaRef}
                  handleUploadCedula={handleUploadCedula} uploadingCedula={uploadingCedula}
                  deletingCedula={deletingCedula} setDeleteArchivoModal={setDeleteArchivoModal}
                  setExpandedImageUrl={setExpandedImageUrl} />
              )}
            </div>
          </div>
      </div>

      <div className="sticky bottom-0 bg-white border-t z-10" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="max-w-[900px] mx-auto px-6 py-4">
          <div className="flex gap-3">
            <button onClick={() => setConfirmReject(true)} disabled={actionLoading || yaProcesada}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold border transition-all hover:bg-red-50 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderColor: "oklch(0.50 0.15 10 / 0.3)", color: "oklch(0.50 0.15 10)" }}>
              <HugeiconsIcon icon={Cancel01Icon} size={16} className="inline mr-1.5" />Rechazar
            </button>
            <button onClick={() => setConfirmApprove(true)}
              disabled={actionLoading || yaProcesada}
              className="flex-[2] px-4 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97] disabled:opacity-60"
              style={{ backgroundColor: COLORS.ACCENT }}>
              <HugeiconsIcon icon={CheckmarkCircle04Icon} size={16} className="inline mr-1.5" />Aprobar
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmApprove}
        title="Aprobar Inscripción a Taller"
        message="Se aprobará la inscripción del participante y se verificará el pago."
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
