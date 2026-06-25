/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  Upload05Icon,
  Image01Icon,
  Calendar02Icon,
  CheckmarkCircle04Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { useParams, useNavigate } from "react-router"
import axios from "axios"

export function CursoEstudiantePagoPage() {
  const { cursoId, matriculaId } = useParams<{ cursoId: string; matriculaId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<any>(null)
  const [selectedModulos, setSelectedModulos] = useState<Set<string>>(new Set())
  const [montos, setMontos] = useState<Record<string, string>>({})
  const [metodoPago, setMetodoPago] = useState("efectivo")
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null)
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(null)
  const [imagenExpandida, setImagenExpandida] = useState<string | null>(null)
  const comprobanteRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load = async () => {
      if (!cursoId || !matriculaId) return
      try {
        const res = await financeService.getEstudianteFinancieroCurso(cursoId, matriculaId)
        setData(res.datos || res.data || res)
      } catch {
        toast.error("Error al cargar datos del estudiante")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [cursoId, matriculaId])

  const modulos: any[] = data?.modulos || []
  const historial: any[] = data?.historial || []
  const estudiante = data?.estudiante || {}
  const curso = data?.curso || {}

  const modulosConDeuda = modulos.filter((m: any) => m.saldo_pendiente > 0)

  const toggleModulo = (lineaId: string) => {
    setSelectedModulos(prev => {
      const next = new Set(prev)
      if (next.has(lineaId)) {
        next.delete(lineaId)
        setMontos(m => { const c = { ...m }; delete c[lineaId]; return c })
      } else {
        next.add(lineaId)
        const mod = modulos.find((m: any) => m.linea_pago_modulo_id === lineaId)
        if (mod) {
          setMontos(m => ({ ...m, [lineaId]: String(mod.saldo_pendiente) }))
        }
      }
      return next
    })
  }

  const handleComprobante = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setComprobanteFile(file)
    setComprobantePreview(URL.createObjectURL(file))
  }

  const handleRegistrar = async () => {
    if (!comprobanteFile) { toast.error("Debes subir el comprobante de pago"); return }
    const modulosSeleccionados = Array.from(selectedModulos)
    if (modulosSeleccionados.length === 0) { toast.error("Selecciona al menos un módulo"); return }

    const pagos = modulosSeleccionados.map(lineaId => ({
      linea_pago_modulo_id: lineaId,
      monto: parseFloat(montos[lineaId] || "0"),
      metodo_pago: metodoPago,
    }))

    const montoCero = pagos.find(p => !p.monto || p.monto <= 0)
    if (montoCero) { toast.error("Todos los módulos seleccionados deben tener un monto mayor a 0"); return }

    setSaving(true)
    try {
      const form = new FormData()
      form.append("archivo", comprobanteFile)

      const token = localStorage.getItem("auth_token")
      const base = import.meta.env.VITE_API_URL

      const uploadRes = await axios.post(`${base}/finanzas/pagos-iniciales/comprobante`, form, {
        headers: { Authorization: `Bearer ${token}` },
      })

      const comprobanteUrl = uploadRes.data?.data?.url || uploadRes.data?.url || ""

      await axios.post(`${base}/finanzas/pagos-iniciales`, {
        matricula_id: matriculaId,
        pagos: pagos.map(p => ({ ...p, comprobante_url: comprobanteUrl })),
        metodo_pago: metodoPago,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })

      toast.success("Pago registrado correctamente")
      navigate(-1)
    } catch (err: any) {
      toast.error(err?.response?.data?.mensaje || "Error al registrar pago")
    } finally { setSaving(false) }
  }

  const total = modulosConDeuda
    .filter((m: any) => selectedModulos.has(m.linea_pago_modulo_id))
    .reduce((sum: number, m: any) => sum + parseFloat(montos[m.linea_pago_modulo_id] || "0"), 0)

  if (loading) {
    return (
      <div className="px-8 py-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-sm font-medium opacity-40" style={{ color: COLORS.CHARCOAL }}>Cargando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-8 py-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm font-bold opacity-40 hover:opacity-100 transition-all mb-4"
        style={{ color: COLORS.CHARCOAL }}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        Volver al curso
      </button>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
        <div
          className="rounded-2xl border bg-white p-6"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <h2 className="text-xl font-black" style={{ color: COLORS.CHARCOAL }}>
            {curso.nombre}
          </h2>
          <p className="text-sm mt-1" style={{ color: COLORS.TEXT_MUTED }}>
            {estudiante.nombre}{estudiante.cedula ? ` · ${estudiante.cedula}` : ""}
          </p>
        </div>

        {modulosConDeuda.length === 0 ? (
          <div
            className="rounded-2xl border bg-white p-6 text-center"
            style={{ borderColor: COLORS.BORDER_SUBTLE }}
          >
            <p className="text-sm font-bold text-green-600">Todos los módulos están pagados</p>
            <p className="text-xs mt-1 opacity-40">No hay deuda pendiente para este estudiante</p>
          </div>
        ) : (
          <div
            className="rounded-2xl border bg-white p-6 space-y-4"
            style={{ borderColor: COLORS.BORDER_SUBTLE }}
          >
            <h3 className="text-sm font-black uppercase tracking-wider opacity-40" style={{ color: COLORS.CHARCOAL }}>
              Módulos con deuda
            </h3>

            {modulosConDeuda.map((m: any) => {
              const seleccionado = selectedModulos.has(m.linea_pago_modulo_id)
              const maximo = m.saldo_pendiente
              return (
                <div key={m.linea_pago_modulo_id} className="p-4 rounded-xl border space-y-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={seleccionado}
                        onChange={() => toggleModulo(m.linea_pago_modulo_id)}
                        className="size-4 rounded border-gray-300"
                      />
                      <div>
                        <span className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>
                          {m.nombre_modulo}
                        </span>
                        <span className="text-xs ml-2 opacity-40">
                          Precio: ${m.monto_ajustado.toLocaleString()} · Saldo: ${maximo.toLocaleString()}
                        </span>
                      </div>
                    </label>
                    <span className={cn(
                      "text-[9px] font-bold uppercase px-2 py-0.5 rounded-full",
                      m.estado === "pagado" ? "bg-green-100 text-green-700" :
                      m.estado === "abonado" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                    )}>
                      {m.estado === "pagado" ? "Pagado" : m.estado === "abonado" ? "Parcial" : "Pendiente"}
                    </span>
                  </div>

                  {seleccionado && (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
                      <input
                        type="number"
                        min="0.01"
                        max={maximo}
                        step="0.01"
                        value={montos[m.linea_pago_modulo_id] || ""}
                        onChange={e => setMontos(mt => ({ ...mt, [m.linea_pago_modulo_id]: e.target.value }))}
                        className="w-full pl-8 pr-4 py-2.5 border rounded-xl text-sm font-mono outline-none focus:border-blue-500 bg-white"
                        style={{ borderColor: COLORS.BORDER_SUBTLE }}
                        placeholder={String(maximo)}
                      />
                    </div>
                  )}
                </div>
              )
            })}

            <div className="pt-4 border-t space-y-3" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider ml-1 mb-2 block" style={{ color: COLORS.TEXT_MUTED }}>Método de pago</label>
                <select value={metodoPago} onChange={e => setMetodoPago(e.target.value)}
                  className="w-full px-4 py-3 border rounded-2xl text-sm outline-none focus:border-blue-500 bg-white"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia / Depósito</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider ml-1 mb-2 block" style={{ color: COLORS.TEXT_MUTED }}>Comprobante *</label>
                <input ref={comprobanteRef} type="file" accept="image/*" className="hidden" onChange={handleComprobante} />
                <button type="button" onClick={() => comprobanteRef.current?.click()}
                  className="w-full p-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-xs font-semibold hover:bg-gray-50 transition-colors"
                  style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.ACCENT }}>
                  <HugeiconsIcon icon={comprobanteFile ? Image01Icon : Upload05Icon} size={16} />
                  {comprobanteFile ? comprobanteFile.name : "Subir comprobante de pago"}
                </button>
                {comprobantePreview && (
                  <img src={comprobantePreview} alt="Vista previa"
                    className="mt-2 rounded-xl border object-contain max-h-[200px] w-full"
                    style={{ borderColor: COLORS.BORDER_SUBTLE }} />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <p className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>
                Total: <span className="text-lg" style={{ color: COLORS.ACCENT }}>${total.toLocaleString()}</span>
              </p>
              <button
                type="button"
                onClick={handleRegistrar}
                disabled={saving || selectedModulos.size === 0}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.98] shadow-lg disabled:opacity-60"
                style={{ backgroundColor: COLORS.ACCENT }}
              >
                <HugeiconsIcon icon={CheckmarkCircle04Icon} size={16} />
                {saving ? "Registrando..." : "Registrar pago"}
              </button>
            </div>
          </div>
        )}

        </div>

        <div
          className="rounded-2xl border bg-white overflow-hidden"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <div className="p-6 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <h3 className="text-base font-black" style={{ color: COLORS.CHARCOAL }}>
              Historial de pagos ({historial.length})
            </h3>
          </div>
          <div className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            {historial.length === 0 ? (
              <div className="p-6 text-center text-xs opacity-40">Sin transacciones registradas</div>
            ) : (
              historial.map((t: any) => (
                <div key={t.id} className="px-4 py-3 flex items-center justify-between gap-3 group hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    {t.comprobante_url ? (
                      <button
                        onClick={() => setImagenExpandida(t.comprobante_url)}
                        className="size-10 rounded-lg overflow-hidden border shrink-0 hover:opacity-80 transition-opacity"
                        style={{ borderColor: COLORS.BORDER_SUBTLE }}
                      >
                        <img src={t.comprobante_url} alt="Comprobante"
                          className="w-full h-full object-cover" />
                      </button>
                    ) : (
                      <div className="size-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "oklch(0.95 0 0)" }}>
                        <HugeiconsIcon icon={Calendar02Icon} size={16} style={{ color: COLORS.TEXT_MUTED }} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold" style={{ color: COLORS.CHARCOAL }}>
                        {t.fecha_pago ? new Date(t.fecha_pago).toLocaleDateString("es-ES") : "—"}
                      </p>
                      <p className="text-[10px] opacity-40 truncate">
                        {t.metodo_pago} · {t.modulo_nombre || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-black" style={{ color: "oklch(0.55 0.15 150)" }}>
                      +${Number(t.monto).toLocaleString()}
                    </span>
                    <button
                      onClick={() => navigate(`/finanzas/pagos/historial/${t.id}`)}
                      className="size-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-gray-100"
                      style={{ color: COLORS.TEXT_MUTED }}
                      title="Ver detalles"
                    >
                      <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>

      {imagenExpandida && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setImagenExpandida(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setImagenExpandida(null); }}
            className="absolute top-4 right-4 text-white/60 hover:text-white text-sm font-bold transition-colors"
          >
            Cerrar [X]
          </button>
          <img
            src={imagenExpandida}
            alt="Comprobante"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
