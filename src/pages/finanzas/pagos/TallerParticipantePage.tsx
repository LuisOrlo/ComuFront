/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  UserIcon,
  Calendar02Icon,
  PaymentIcon,
  Upload05Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn, getStorageUrl } from "@/lib/utils"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { validarComprobante } from "@/lib/file-validators"
import { useParams, useNavigate } from "react-router"

export function TallerParticipantePage() {
  const { id: tallerId, pid: participanteId } = useParams<{ id: string; pid: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [modalImage, setModalImage] = useState<string | null>(null)
  const [montoPago, setMontoPago] = useState("")
  const [metodoPago, setMetodoPago] = useState("efectivo")
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null)
  const [savingPago, setSavingPago] = useState(false)
  const comprobanteRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load = async () => {
      if (!tallerId || !participanteId) return
      try {
        const res = await financeService.getHistorialParticipanteTaller(tallerId, participanteId)
        setData(res.datos || res.data || res)
      } catch {
        toast.error("Error al cargar datos del participante")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tallerId, participanteId])

  const recargarDatos = async () => {
    if (!tallerId || !participanteId) return
    try {
      const res = await financeService.getHistorialParticipanteTaller(tallerId, participanteId)
      setData(res.datos || res.data || res)
    } catch { /* silent */ }
  }

  const handleRegistrarPago = async () => {
    const monto = parseFloat(montoPago) || 0
    if (monto <= 0) { toast.error("Ingresa un monto válido"); return }
    if (!data?.cuenta_id) { toast.error("No se encontró la cuenta del participante"); return }
    setSavingPago(true)
    try {
      let comprobanteUrl: string | null = null
      if (comprobanteFile) {
        const form = new FormData()
        form.append("archivo", comprobanteFile)
        const uploadRes = await financeService.uploadComprobantePago(form)
        comprobanteUrl = uploadRes?.data?.url || uploadRes?.url || null
      }
      await financeService.registrarPago({
        cuenta_cobrar_id: data.cuenta_id,
        monto,
        metodo_pago: metodoPago,
        fecha_pago: new Date().toISOString().split("T")[0],
        comprobante_url: comprobanteUrl,
      })
      toast.success("Pago registrado correctamente")
      setMontoPago("")
      setComprobanteFile(null)
      await recargarDatos()
    } catch (err) {
      toast.error((err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje || "Error al registrar pago")
    } finally { setSavingPago(false) }
  }

  const handleComprobanteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validarComprobante(file)
    if (err) { toast.error(err); e.target.value = ""; return }
    setComprobanteFile(file)
  }

  const badgeEstado = (estado: string) => {
    if (estado === "aprobado") return "bg-green-100 text-green-700"
    if (estado === "rechazado") return "bg-red-100 text-red-700"
    return "bg-amber-100 text-amber-700"
  }

  const estadoColor = (estado: string) => {
    if (estado === "aprobado") return "oklch(0.55 0.15 150)"
    if (estado === "rechazado") return "oklch(0.5 0.15 20)"
    return "oklch(0.65 0.15 75)"
  }

  if (loading) {
    return (
      <div className="px-8 py-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-sm font-medium opacity-40" style={{ color: COLORS.CHARCOAL }}>
            Cargando datos del participante...
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="px-8 py-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-sm font-medium opacity-40" style={{ color: COLORS.CHARCOAL }}>
            Participante no encontrado
          </div>
        </div>
      </div>
    )
  }

  const participante = data.participante || data
  const transacciones = data.transacciones || data.historial || []
  const tallerNombre = data.taller_nombre || data.taller?.nombre || "Taller"
  const nombreParticipante = participante.nombres && participante.apellidos
    ? `${participante.nombres} ${participante.apellidos}`.trim()
    : data.nombre_participante || "—"

  return (
    <div className="px-8 py-6">
      

      <button
        onClick={() => navigate(`/finanzas/pagos/cuentas/talleres/${tallerId}`)}
        className="flex items-center gap-2 text-sm font-bold opacity-40 hover:opacity-100 transition-all mb-4"
        style={{ color: COLORS.CHARCOAL }}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        Volver al Taller
      </button>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl space-y-6"
      >
        <div
          className="rounded-2xl border bg-white p-6"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="size-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: "oklch(0.5 0.1 240 / 0.1)" }}
            >
              <HugeiconsIcon icon={UserIcon} size={22} style={{ color: "oklch(0.5 0.1 240)" }} />
            </div>
            <div>
              <h2 className="text-xl font-black" style={{ color: COLORS.CHARCOAL }}>
                {nombreParticipante}
              </h2>
              <p className="text-xs opacity-40">{tallerNombre}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl" style={{ backgroundColor: "oklch(0.97 0 0)" }}>
            <div>
              <p className="text-[10px] font-bold uppercase opacity-40">Precio</p>
              <p className="text-lg font-black" style={{ color: COLORS.CHARCOAL }}>
                {Number(data.monto_total || 0) !== Number(data.precio_taller || 0) && (
                  <span className="text-sm line-through opacity-40 mr-1">${Number(data.precio_taller || 0).toLocaleString()} →</span>
                )}
                ${Number(data.monto_total || data.precio_taller || 0).toLocaleString()}
              </p>
              {data.motivo_ajuste && (
                <p className="text-[11px] italic opacity-50 mt-0.5">
                  ({data.motivo_ajuste})
                </p>
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase opacity-40">Pagado</p>
              <p className="text-lg font-black text-green-600">
                ${Number(data.total_pagado || data.monto_abonado || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase opacity-40">Saldo</p>
              <p className="text-lg font-black" style={{ color: (data.saldo || data.saldo_pendiente || 0) > 0 ? "oklch(0.5 0.15 20)" : "oklch(0.55 0.15 150)" }}>
                ${Number(data.saldo || data.saldo_pendiente || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase opacity-40">Estado</p>
              <p className="text-lg font-black" style={{ color: (data.saldo || data.saldo_pendiente || 0) <= 0 ? "oklch(0.55 0.15 150)" : "oklch(0.65 0.15 75)" }}>
                {(data.saldo || data.saldo_pendiente || 0) <= 0 ? "Pagado" : "Pendiente"}
              </p>
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl border bg-white p-6"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <h3 className="text-base font-black mb-6" style={{ color: COLORS.CHARCOAL }}>
            Historial de Transacciones
          </h3>

          {transacciones.length === 0 ? (
            <p className="text-center text-sm opacity-40 py-8" style={{ color: COLORS.CHARCOAL }}>
              No hay transacciones registradas
            </p>
          ) : (
            <div className="relative">
              <div
                className="absolute left-[15px] top-2 bottom-2 w-px"
                style={{ backgroundColor: COLORS.BORDER_SUBTLE }}
              />

              <div className="space-y-4">
                {transacciones.map((t: any, idx: number) => (
                  <div key={t.id || idx} className="relative pl-10">
                    <div
                      className="absolute left-[10px] top-1.5 size-[11px] rounded-full border-2 border-white ring-2"
                      style={{ backgroundColor: estadoColor(t.estado_verificacion) }}
                    />
                    <div
                      className="p-4 rounded-xl border"
                      style={{ borderColor: COLORS.BORDER_SUBTLE, backgroundColor: "oklch(0.99 0 0)" }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-black" style={{ color: COLORS.CHARCOAL }}>
                            ${Number(t.monto || 0).toLocaleString()}
                          </p>
                          <p className="text-[10px] opacity-40 flex items-center gap-1.5 mt-0.5">
                            <HugeiconsIcon icon={Calendar02Icon} size={10} />
                            {new Date(t.fecha_pago || t.created_at).toLocaleDateString("es-ES", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <span
                          className={cn("px-2 py-0.5 rounded-full text-[8px] font-bold uppercase", badgeEstado(t.estado_verificacion))}
                        >
                          {t.estado_verificacion}
                        </span>
                      </div>
                      <p className="text-[10px] opacity-40 capitalize">{t.metodo_pago}</p>

                      {t.comprobante_url && (
                        <div className="mt-3">
                          <div
                            className="rounded-lg border overflow-hidden cursor-pointer inline-block"
                            style={{ borderColor: COLORS.BORDER_SUBTLE }}
                            onClick={() => setModalImage(getStorageUrl(t.comprobante_url))}
                          >
                            <img
                              src={getStorageUrl(t.comprobante_url)}
                              alt="Comprobante"
                              className="max-h-32 object-contain hover:opacity-80 transition-opacity"
                            />
                          </div>
                        </div>
                      )}
                      {t.observaciones && (
                        <p className="text-[10px] italic opacity-40 mt-2">{t.observaciones}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          className="rounded-2xl border bg-white p-6"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <h3 className="text-base font-black mb-4 flex items-center gap-2" style={{ color: COLORS.CHARCOAL }}>
            <HugeiconsIcon icon={PaymentIcon} size={18} style={{ color: COLORS.ACCENT }} />
            Registrar Nuevo Pago
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: COLORS.TEXT_MUTED }}>
                Monto
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={montoPago}
                  onChange={e => setMontoPago(e.target.value)}
                  onWheel={e => (e.target as HTMLElement).blur()}
                  placeholder="0.00"
                  disabled={savingPago}
                  className="w-full pl-8 pr-4 py-2.5 border rounded-xl text-sm font-mono outline-none bg-white"
                  style={{ borderColor: COLORS.BORDER_SUBTLE, MozAppearance: "textfield" }}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider mb-1 block" style={{ color: COLORS.TEXT_MUTED }}>
                Método de pago
              </label>
              <select
                value={metodoPago}
                onChange={e => setMetodoPago(e.target.value)}
                disabled={savingPago}
                className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none bg-white"
                style={{ borderColor: COLORS.BORDER_SUBTLE }}
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia / Depósito</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <input ref={comprobanteRef} type="file" accept="image/*" className="hidden" onChange={handleComprobanteChange} />
            <button
              onClick={() => comprobanteRef.current?.click()}
              disabled={savingPago}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold hover:bg-gray-50 transition-colors"
              style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.ACCENT }}
            >
              <HugeiconsIcon icon={Upload05Icon} size={14} />
              {comprobanteFile ? comprobanteFile.name : "Subir comprobante"}
            </button>
            <button
              onClick={handleRegistrarPago}
              disabled={savingPago}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.98]"
              style={{ backgroundColor: COLORS.ACCENT, opacity: savingPago ? 0.6 : 1 }}
            >
              {savingPago ? "Registrando..." : "Registrar Pago"}
            </button>
          </div>
        </div>
      </motion.div>

      {modalImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setModalImage(null)}
        >
          <div className="relative flex items-center justify-center p-6" style={{ maxWidth: "min(90vw, 1200px)", maxHeight: "90vh" }}>
            <button
              onClick={(e) => { e.stopPropagation(); setModalImage(null); }}
              className="absolute -top-8 right-0 text-white/60 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Cerrar [X]
            </button>
            <img
              src={modalImage}
              alt="Comprobante"
              className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  )
}
