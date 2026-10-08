import { useState, useEffect } from "react"
import { Link } from "react-router"
import { motion, AnimatePresence } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar03Icon,
  Clock01Icon,
  Location01Icon,
  UserIcon,
  Money01Icon,
  Tick02Icon,
  Edit01Icon,
  CameraVideoIcon,
  DocumentCodeIcon,
} from "@hugeicons/core-free-icons"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { streamingService, type ServicioStreaming } from "@/services/streaming.service"
import { toast } from "sonner"

interface Props {
  isOpen: boolean
  onClose: () => void
  streaming: ServicioStreaming | null
  onStatusChanged?: (updated: ServicioStreaming) => void
}

const ESTADOS: Array<{ key: ServicioStreaming["estado"]; label: string; bg: string; text: string }> = [
  { key: "reservado", label: "Reservado", bg: "bg-blue-50 border-blue-200", text: "text-blue-700" },
  { key: "confirmado", label: "Confirmado", bg: "bg-amber-50 border-amber-200", text: "text-amber-700" },
  { key: "en_progreso", label: "En progreso", bg: "bg-indigo-50 border-indigo-200", text: "text-indigo-700" },
  { key: "completado", label: "Completado", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
  { key: "cancelado", label: "Cancelado", bg: "bg-red-50 border-red-200", text: "text-red-700" },
]

export function DetalleStreamingModal({ isOpen, onClose, streaming, onStatusChanged }: Props) {
  const [estadoLocal, setEstadoLocal] = useState<ServicioStreaming["estado"]>("reservado")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (streaming) {
      setEstadoLocal(streaming.estado)
    }
  }, [streaming])

  if (!streaming) return null

  const handleCambiarEstado = async (nuevo: ServicioStreaming["estado"]) => {
    if (nuevo === estadoLocal) return
    setSaving(true)
    try {
      const updated = await streamingService.cambiarEstado(streaming.id, nuevo)
      setEstadoLocal(nuevo)
      toast.success(`Estado actualizado a ${nuevo}`)
      onStatusChanged?.(updated)
    } catch {
      toast.error("Error al cambiar estado")
    } finally {
      setSaving(false)
    }
  }

  const clienteNombre = streaming.cliente_externo
    ? `${streaming.cliente_externo.nombres} ${streaming.cliente_externo.apellidos || ""}`.trim()
    : streaming.persona
      ? `${streaming.persona.nombres} ${streaming.persona.apellidos}`.trim()
      : "Cliente sin asignar"

  const clienteContacto = streaming.cliente_externo?.celular || streaming.persona?.celular || "Sin celular"

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-orange-50 via-white to-amber-50/20 border-b border-orange-100/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-[#fd761a] text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                  <HugeiconsIcon icon={CameraVideoIcon} size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    {streaming.titulo || "Cobertura de Streaming"}
                  </h3>
                  <p className="text-xs text-slate-500">ID: {streaming.id.slice(0, 8)}... · Modal de Ficha Rápida</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="size-9 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Contenido con Scroll */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Selector de Estado Rápido */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                  Estado Operativo
                </span>
                <div className="flex flex-wrap gap-2">
                  {ESTADOS.map((est) => {
                    const isSelected = estadoLocal === est.key
                    return (
                      <button
                        key={est.key}
                        type="button"
                        disabled={saving}
                        onClick={() => handleCambiarEstado(est.key)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all",
                          isSelected
                            ? `${est.bg} ${est.text} shadow-xs ring-2 ring-offset-1 ring-orange-400/40`
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        {est.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Grid Logístico */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    <HugeiconsIcon icon={Calendar03Icon} size={14} />
                    <span>Fecha & Hora</span>
                  </div>
                  <p className="text-sm font-extrabold text-slate-800">
                    {streaming.fecha_evento}
                  </p>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5 flex items-center gap-1">
                    <HugeiconsIcon icon={Clock01Icon} size={12} />
                    {streaming.hora_inicio?.slice(0, 5)} - {streaming.hora_fin?.slice(0, 5)}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    <HugeiconsIcon icon={Location01Icon} size={14} />
                    <span>Ubicación</span>
                  </div>
                  <p className="text-sm font-extrabold text-slate-800 line-clamp-1">
                    {streaming.lugar}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                    {streaming.direccion || streaming.ciudad?.nombre || "Sin dirección"}
                  </p>
                </div>
              </div>

              {/* Cliente y Finanzas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    <HugeiconsIcon icon={UserIcon} size={14} />
                    <span>Cliente Responsable</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800">{clienteNombre}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{clienteContacto}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    <HugeiconsIcon icon={Money01Icon} size={14} />
                    <span>Finanzas</span>
                  </div>
                  <p className="text-sm font-extrabold text-slate-800">
                    Total: ${Number(streaming.precio_total).toFixed(2)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {streaming.pago_registrado ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                        <HugeiconsIcon icon={Tick02Icon} size={12} />
                        Pagado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full">
                        Pendiente
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Staff Técnico */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                  Personal Asignado ({streaming.asignaciones?.length || 0})
                </span>
                {streaming.asignaciones && streaming.asignaciones.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {streaming.asignaciones.map((asig, i) => (
                      <div
                        key={asig.id || i}
                        className="p-3 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-lg bg-orange-100 text-[#fd761a] flex items-center justify-center font-bold text-xs">
                            {asig.persona?.nombres?.charAt(0) || "T"}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">
                              {asig.persona ? `${asig.persona.nombres} ${asig.persona.apellidos}` : "Personal"}
                            </p>
                            <p className="text-[11px] text-slate-400">Técnico de Cobertura</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl">Sin personal asignado</p>
                )}
              </div>

              {/* Equipos */}
              {streaming.equipos_detalle && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    Kits y Equipos Declarados
                  </span>
                  <div className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl text-xs text-amber-900 font-medium whitespace-pre-wrap">
                    {streaming.equipos_detalle}
                  </div>
                </div>
              )}
            </div>

            {/* Footer con Acciones */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
              >
                Cerrar
              </button>
              <div className="flex items-center gap-2">
                <Link
                  to={`/servicios/streaming/${streaming.id}/editar`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl shadow-xs transition-colors"
                >
                  <HugeiconsIcon icon={Edit01Icon} size={14} />
                  Editar
                </Link>
                <Link
                  to={`/servicios/streaming/${streaming.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#fd761a] hover:bg-[#e06310] rounded-xl shadow-md shadow-orange-500/20 transition-all"
                >
                  <HugeiconsIcon icon={DocumentCodeIcon} size={14} />
                  Ver Ficha Completa
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
