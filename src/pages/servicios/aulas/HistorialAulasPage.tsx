import { useState, useEffect, useMemo, useCallback } from "react"
import { useNavigate } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  Clock04Icon,
  Calendar02Icon,
  Money02Icon,
  UserIcon,
  LibraryIcon,
  Home02Icon,
  Mail01Icon,
  CallIcon,
  IdentificationIcon,
  PackageIcon,
  InformationCircleIcon,
  CheckmarkCircle04Icon,
  MapsLocation01Icon,
} from "@hugeicons/core-free-icons"
import { X } from "lucide-react"
import type { IconSvgElement } from "@hugeicons/react"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { aulasService, type Aula, type ReservaAula } from "@/services/aulas.service"
import { toast } from "sonner"

type FiltroTiempo = "todos" | "recientes" | "antiguos"

const ESTADO_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  reservado: { bg: "bg-blue-50", color: "text-blue-700", label: "Reservado" },
  confirmado: { bg: "bg-emerald-50", color: "text-emerald-700", label: "Confirmado" },
  en_progreso: { bg: "bg-amber-50", color: "text-amber-700", label: "En progreso" },
  completado: { bg: "bg-gray-100", color: "text-gray-600", label: "Completado" },
  cancelado: { bg: "bg-red-50", color: "text-red-600", label: "Cancelado" },
}

export function HistorialAulasPage() {
  const navigate = useNavigate()
  const [reservas, setReservas] = useState<ReservaAula[]>([])
  const [aulas, setAulas] = useState<Aula[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<FiltroTiempo>("todos")
  const [detalleReserva, setDetalleReserva] = useState<ReservaAula | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [res, auls] = await Promise.all([
        aulasService.getReservas(),
        aulasService.getAulas(),
      ])
      setReservas(Array.isArray(res) ? res : [])
      setAulas(auls || [])
    } catch {
      toast.error("Error al cargar historial")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {

    loadData()
  }, [loadData])

  const hace30Dias = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - 30)
    return d
  }, [])

  const filtradas = useMemo(() => {
    switch (filtro) {
      case "recientes":
        return reservas.filter(r => new Date(r.fecha_reserva) >= hace30Dias)
      case "antiguos":
        return reservas.filter(r => new Date(r.fecha_reserva) < hace30Dias)
      default:
        return reservas
    }
  }, [reservas, filtro, hace30Dias])

  const sorted = useMemo(() => [...filtradas].sort((a, b) =>
    new Date(b.fecha_reserva).getTime() - new Date(a.fecha_reserva).getTime()
  ), [filtradas])

  const getAulaNombre = (aulaId: string) => {
    const a = aulas.find(x => x.id === aulaId)
    return a?.nombre || "—"
  }

  const getClienteNombre = (r: ReservaAula) => {
    if (r.persona) return `${r.persona.nombres || ""} ${r.persona.apellidos || ""}`.trim()
    if (r.cliente_externo) return `${r.cliente_externo.nombres || ""} ${r.cliente_externo.apellidos || ""}`.trim()
    return "—"
  }

  const getClienteInfo = (r: ReservaAula) => {
    if (r.persona) return {
      nombres: `${r.persona.nombres || ""} ${r.persona.apellidos || ""}`.trim(),
      correo: r.persona.correo,
      celular: r.persona.celular,
      tipo: "Interno (Staff)",
      cedula: "",
    }
    if (r.cliente_externo) return {
      nombres: `${r.cliente_externo.nombres || ""} ${r.cliente_externo.apellidos || ""}`.trim(),
      correo: r.cliente_externo.correo,
      celular: r.cliente_externo.celular,
      tipo: "Externo (Cliente)",
      cedula: r.cliente_externo.cedula || "",
    }
    return { nombres: "—", correo: "", celular: "", tipo: "—", cedula: "" }
  }

  const handlePago = (r: ReservaAula) => {
    const clienteNombre = getClienteNombre(r)
    const aulaNombre = getAulaNombre(r.aula_id)
    navigate(`/finanzas/pagos/cuentas/servicios/pago/${r.id}`, {
      state: {
        tipo: "aula",
        servicioId: r.id,
        nombre: clienteNombre,
        montoTotal: Number(r.precio_total) || 0,
        montoSaldo: Number(r.precio_total) || 0,
        nombreServicio: `Alquiler de Aula ${aulaNombre}`,
      },
    })
  }

  if (loading) {
    return (
      <div className="px-8 py-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-sm font-medium" style={{ color: COLORS.TEXT_MUTED }}>Cargando historial...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-8 py-6">
      <button onClick={() => navigate("/servicios/aulas")} className="flex items-center gap-2 text-sm font-bold opacity-40 hover:opacity-100 transition-all mb-4" style={{ color: COLORS.CHARCOAL }}>
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        Volver a Aulas
      </button>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h2 className="text-xl font-black" style={{ color: COLORS.CHARCOAL }}>Historial de Alquileres</h2>
          <p className="text-sm mt-1" style={{ color: COLORS.TEXT_MUTED }}>{sorted.length} reserva{sorted.length !== 1 ? "s" : ""}</p>
        </div>

        <div className="flex gap-1 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          {([
            { key: "todos" as const, label: "Todos", icon: PackageIcon },
            { key: "recientes" as const, label: "Recientes", icon: Clock04Icon },
            { key: "antiguos" as const, label: "Antiguos", icon: Calendar02Icon },
          ]).map(t => (
            <button key={t.key} onClick={() => setFiltro(t.key)}
              className="flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all"
              style={{
                borderColor: filtro === t.key ? COLORS.ACCENT : "transparent",
                color: filtro === t.key ? COLORS.CHARCOAL : COLORS.TEXT_MUTED,
              }}>
              <HugeiconsIcon icon={t.icon} size={14} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border bg-white overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left [&_td]:border [&_th]:border [&_td]:border-[oklch(0.85_0_0)] [&_th]:border-[oklch(0.85_0_0)]">
              <thead>
                <tr style={{ backgroundColor: "oklch(0.97 0 0)" }}>
                  <th className="px-2 py-3 text-[10px] font-black uppercase tracking-widest opacity-40 w-[36px] text-center" style={{ color: COLORS.CHARCOAL }}>#</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>Fecha</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>Aula</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>Cliente</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>Horario</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest opacity-40 text-center" style={{ color: COLORS.CHARCOAL }}>Estado</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest opacity-40 text-right" style={{ color: COLORS.CHARCOAL }}>Precio</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center opacity-40 text-sm" style={{ color: COLORS.CHARCOAL }}>No hay reservas</td>
                  </tr>
                ) : (
                  sorted.map((r, idx) => {
                    const estado = ESTADO_STYLES[r.estado] || ESTADO_STYLES.reservado
                    const clienteNombre = getClienteNombre(r)
                    const aulaNombre = getAulaNombre(r.aula_id)
                    return (
                      <tr key={r.id} className="transition-colors" style={{ backgroundColor: idx % 2 === 0 ? "transparent" : "oklch(0.97 0 0 / 0.5)" }}>
                        <td className="px-2 py-3 text-center text-xs opacity-40" style={{ color: COLORS.CHARCOAL }}>{idx + 1}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: COLORS.CHARCOAL }}>
                          {new Date(r.fecha_reserva).toLocaleDateString("es-ES")}
                        </td>
                        <td className="px-4 py-3 text-xs font-bold" style={{ color: COLORS.CHARCOAL }}>{aulaNombre}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: COLORS.CHARCOAL }}>{clienteNombre}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: COLORS.CHARCOAL }}>
                          {r.hora_inicio?.substring(0, 5)} — {r.hora_fin?.substring(0, 5)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn("inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase", estado.bg, estado.color)}>
                            {estado.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-bold" style={{ color: COLORS.CHARCOAL }}>
                          ${r.precio_total?.toLocaleString() || "0"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setDetalleReserva(r)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors hover:bg-gray-50"
                              style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}>
                              <HugeiconsIcon icon={InformationCircleIcon} size={12} />
                              Ver detalle
                            </button>
                            <button onClick={() => handlePago(r)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all hover:opacity-90 active:scale-95 whitespace-nowrap"
                              style={{ backgroundColor: COLORS.ACCENT }}>
                              <HugeiconsIcon icon={CheckmarkCircle04Icon} size={12} />
                              Registrar pago
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {detalleReserva && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDetalleReserva(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="relative bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                <h3 className="text-lg font-black" style={{ color: COLORS.CHARCOAL }}>Detalle de Reserva</h3>
                <button onClick={() => setDetalleReserva(null)} className="size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 space-y-5">
                {(() => {
                  const aula = aulas.find(a => a.id === detalleReserva.aula_id)
                  const cliente = getClienteInfo(detalleReserva)
                  const estado = ESTADO_STYLES[detalleReserva.estado] || ESTADO_STYLES.reservado
                  return (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <InfoDetail icon={Home02Icon} label="Aula" value={aula?.nombre || "—"} />
                        <InfoDetail icon={UserIcon} label="Capacidad" value={aula ? `${aula.capacidad} personas` : "—"} />
                        <InfoDetail icon={Calendar02Icon} label="Fecha" value={new Date(detalleReserva.fecha_reserva).toLocaleDateString("es-ES")} />
                        <InfoDetail icon={Clock04Icon} label="Horario" value={`${detalleReserva.hora_inicio?.substring(0, 5)} — ${detalleReserva.hora_fin?.substring(0, 5)}`} />
                        <InfoDetail icon={Money02Icon} label="Precio/hora" value={`$${aula?.precio_hora?.toLocaleString() || "0"}`} />
                        <InfoDetail icon={Money02Icon} label="Total" value={`$${detalleReserva.precio_total?.toLocaleString() || "0"}`} />
                      </div>

                      <div className="border-t pt-4" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                        <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: COLORS.TEXT_MUTED }}>Cliente</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <InfoDetail icon={UserIcon} label="Nombre" value={cliente.nombres} />
                          <InfoDetail icon={IdentificationIcon} label="Cédula" value={cliente.cedula || "—"} />
                          <InfoDetail icon={Mail01Icon} label="Correo" value={cliente.correo || "—"} />
                          <InfoDetail icon={CallIcon} label="Celular" value={cliente.celular || "—"} />
                          <InfoDetail icon={LibraryIcon} label="Tipo" value={cliente.tipo} />
                          <InfoDetail icon={MapsLocation01Icon} label="Estado" value={estado.label} />
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function InfoDetail({ icon: Icon, label, value }: { icon: IconSvgElement; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <HugeiconsIcon icon={Icon} size={14} style={{ color: COLORS.TEXT_MUTED }} className="mt-0.5 shrink-0" />
      <div>
        <p className="text-[9px] font-bold uppercase opacity-40" style={{ color: COLORS.CHARCOAL }}>{label}</p>
        <p className="text-xs font-bold" style={{ color: COLORS.CHARCOAL }}>{value}</p>
      </div>
    </div>
  )
}
