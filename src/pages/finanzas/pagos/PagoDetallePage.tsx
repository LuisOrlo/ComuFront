/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react"
import { motion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  Money02Icon,
  Calendar02Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Clock01Icon,
  Download01Icon,
  ImageIcon,
  UserIcon,
  Note01Icon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { financeService } from "@/services/finance.service"
import { toast } from "sonner"
import { useParams, useNavigate } from "react-router"

export function PagoDetallePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [modalImage, setModalImage] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!id) return
      try {
        const res = await financeService.getTransaccionDetalle(id)
        setData(res.datos || res.data || res)
      } catch {
        toast.error("Error al cargar detalle de transacción")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const badgeEstado = (estado: string) => {
    if (estado === "aprobado") return "bg-green-100 text-green-700"
    if (estado === "rechazado") return "bg-red-100 text-red-700"
    return "bg-amber-100 text-amber-700"
  }

  const estadoIcon = (estado: string) => {
    if (estado === "aprobado") return CheckmarkCircle02Icon
    if (estado === "rechazado") return Cancel01Icon
    return Clock01Icon
  }

  const estadoColor = (estado: string) => {
    if (estado === "aprobado") return "oklch(0.55 0.15 150)"
    if (estado === "rechazado") return "oklch(0.5 0.15 20)"
    return "oklch(0.65 0.15 75)"
  }

  const getNombreEstudiante = () => {
    if (data?.estudiante_nombre) return data.estudiante_nombre
    const cp = data?.cuenta_por_cobrar
    const m = cp?.matricula
    const s = cp?.solicitud_inscripcion
    const it = cp?.inscripcion_taller
    if (m?.estudiante) return `${m.estudiante.nombres || ""} ${m.estudiante.apellidos || ""}`.trim()
    if (s?.estudiante) return `${s.estudiante.nombres || ""} ${s.estudiante.apellidos || ""}`.trim()
    if (s?.participante_externo) return `${s.participante_externo.nombres || ""} ${s.participante_externo.apellidos || ""}`.trim()
    if (it?.participante) return `${it.participante.nombres || ""} ${it.participante.apellidos || ""}`.trim()
    return "—"
  }

  const getCursoNombre = () => {
    if (data?.curso_nombre) return data.curso_nombre
    if (data?.taller_nombre) return data.taller_nombre
    const cp = data?.cuenta_por_cobrar
    const m = cp?.matricula
    const s = cp?.solicitud_inscripcion
    const it = cp?.inscripcion_taller
    if (it?.taller?.nombre) return it.taller.nombre
    if (m?.curso_abierto?.nombre_instancia) return m.curso_abierto.nombre_instancia
    if (m?.curso_abierto?.catalogo?.nombre) return m.curso_abierto.catalogo.nombre
    if (s?.curso_abierto?.nombre_instancia) return s.curso_abierto.nombre_instancia
    if (s?.curso_abierto?.catalogo?.nombre) return s.curso_abierto.catalogo.nombre
    return "—"
  }

  const getModuloNombre = () => {
    if (data?.modulo_nombre) return data.modulo_nombre
    const cp = data?.cuenta_por_cobrar
    const m = cp?.matricula
    if (m?.modulo?.nombre) return m.modulo.nombre
    return null
  }

  if (loading) {
    return (
      <div className="px-8 py-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-sm font-medium opacity-40" style={{ color: COLORS.CHARCOAL }}>
            Cargando detalle...
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
            Transacción no encontrada
          </div>
        </div>
      </div>
    )
  }

  const registradoPor = data?.registrado_por || "—"
  const verificadoPor = data?.verificado_por || "—"

  return (
    <div className="px-8 py-6">
      

      <button
        onClick={() => navigate("/finanzas/pagos/historial")}
        className="flex items-center gap-2 text-sm font-bold opacity-40 hover:opacity-100 transition-all mb-4"
        style={{ color: COLORS.CHARCOAL }}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        Volver al Historial
      </button>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl space-y-6"
      >
        <div
          className="rounded-2xl border bg-white p-8 flex items-center gap-4"
          style={{ borderColor: COLORS.BORDER_SUBTLE }}
        >
          <div
            className="size-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${estadoColor(data.estado_verificacion)}20` }}
          >
            <HugeiconsIcon
              icon={estadoIcon(data.estado_verificacion)}
              size={24}
              style={{ color: estadoColor(data.estado_verificacion) }}
            />
          </div>
          <div>
            <p className="text-3xl font-black" style={{ color: COLORS.CHARCOAL }}>
              ${Number(data.monto || 0).toLocaleString()}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold capitalize" style={{ color: COLORS.CHARCOAL }}>
                {data.metodo_pago}
              </span>
              <span className="size-1 rounded-full bg-current opacity-30" />
              <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full", badgeEstado(data.estado_verificacion))}>
                {data.estado_verificacion}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className="rounded-2xl border bg-white p-6 space-y-4"
            style={{ borderColor: COLORS.BORDER_SUBTLE }}
          >
            <h3 className="text-sm font-black uppercase tracking-wider opacity-40" style={{ color: COLORS.CHARCOAL }}>
              Información General
            </h3>

            <DetailRow icon={Calendar02Icon} label="Fecha de Pago" value={new Date(data.fecha_pago || data.created_at).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })} />
            <DetailRow icon={Money02Icon} label="Método" value={data.metodo_pago} capitalize />
            <DetailRow icon={UserIcon} label="Estudiante" value={getNombreEstudiante()} />
            <DetailRow icon={UserIcon} label="Curso / Taller" value={getCursoNombre()} />
            {getModuloNombre() && (
              <DetailRow icon={UserIcon} label="Módulo" value={getModuloNombre()} />
            )}
          </div>

          <div
            className="rounded-2xl border bg-white p-6 space-y-4"
            style={{ borderColor: COLORS.BORDER_SUBTLE }}
          >
            <h3 className="text-sm font-black uppercase tracking-wider opacity-40" style={{ color: COLORS.CHARCOAL }}>
              Registro y Verificación
            </h3>

            <DetailRow icon={UserIcon} label="Registrado por" value={registradoPor} />
            <DetailRow icon={UserIcon} label="Verificado por" value={data.estado_verificacion === "pendiente" ? "Pendiente" : verificadoPor} />
            {data.observaciones && (
              <DetailRow icon={Note01Icon} label="Observaciones" value={data.observaciones} />
            )}
            {data.motivo_rechazo && (
              <DetailRow icon={Cancel01Icon} label="Motivo de Rechazo" value={data.motivo_rechazo} error />
            )}
          </div>
        </div>

        {data.comprobante_url && (
          <div
            className="rounded-2xl border bg-white p-6"
            style={{ borderColor: COLORS.BORDER_SUBTLE }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black uppercase tracking-wider opacity-40 flex items-center gap-2" style={{ color: COLORS.CHARCOAL }}>
                <HugeiconsIcon icon={ImageIcon} size={16} />
                Comprobante de Pago
              </h3>
              <a
                href={data.comprobante_url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                style={{ color: COLORS.ACCENT, backgroundColor: `${COLORS.ACCENT}15` }}
              >
                <HugeiconsIcon icon={Download01Icon} size={14} />
                Descargar
              </a>
            </div>
            <div
              className="rounded-xl border overflow-hidden cursor-pointer"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}
              onClick={() => setModalImage(data.comprobante_url)}
            >
              <img
                src={data.comprobante_url}
                alt="Comprobante de pago"
                className="w-full max-h-[400px] object-contain bg-gray-50 hover:opacity-90 transition-opacity"
              />
            </div>
          </div>
        )}
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

function DetailRow({ icon: Icon, label, value, capitalize, error }: {
  icon: any
  label: string
  value: string
  capitalize?: boolean
  error?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <HugeiconsIcon icon={Icon} size={16} className="shrink-0 mt-0.5" style={{ color: error ? "oklch(0.5 0.15 20)" : COLORS.TEXT_MUTED }} />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-40" style={{ color: COLORS.CHARCOAL }}>
          {label}
        </p>
        <p
          className={cn("text-sm font-bold", capitalize && "capitalize")}
          style={{ color: error ? "oklch(0.5 0.15 20)" : COLORS.CHARCOAL }}
        >
          {value}
        </p>
      </div>
    </div>
  )
}
