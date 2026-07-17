import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { MusicNote01Icon, Building04Icon, AiPhone01Icon, Camera01Icon, VideoIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { clientesService } from "@/services/clientes.service"
import { toast } from "sonner"

interface ServiciosContratadosProps {
  clienteId: string
}

const serviceIcons: Record<string, { icon: typeof MusicNote01Icon; color: string; bg: string; label: string }> = {
  radio: { icon: MusicNote01Icon, color: "oklch(0.55 0.18 160)", bg: "oklch(0.95 0.02 160)", label: "Radio" },
  aulas: { icon: Building04Icon, color: "oklch(0.55 0.15 220)", bg: "oklch(0.95 0.02 220)", label: "Aulas" },
  podcast: { icon: AiPhone01Icon, color: "oklch(0.55 0.12 280)", bg: "oklch(0.95 0.02 280)", label: "Podcast" },
  equipos: { icon: Camera01Icon, color: "oklch(0.55 0.12 40)", bg: "oklch(0.95 0.02 40)", label: "Equipos" },
  edicion: { icon: VideoIcon, color: "oklch(0.55 0.16 260)", bg: "oklch(0.95 0.02 260)", label: "Edición de Video" },
}

type ReservasData = {
  radio: Array<Record<string, unknown>>
  aulas: Array<Record<string, unknown>>
  podcast: Array<Record<string, unknown>>
  equipos: Array<Record<string, unknown>>
  edicion: Array<Record<string, unknown>>
}

export function ServiciosContratados({ clienteId }: ServiciosContratadosProps) {
  const [data, setData] = useState<ReservasData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    clientesService.getClienteReservas(clienteId).then(r => setData(r as ReservasData)).catch(() => {
      toast.error("Error al cargar servicios contratados")
    }).finally(() => setLoading(false))
  }, [clienteId])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg bg-gray-100 animate-pulse" />)}
      </div>
    )
  }

  if (!data) {
    return <p className="text-sm opacity-50 text-center py-8">No se pudieron cargar los servicios.</p>
  }

  const sections = [
    { key: "radio" as const, items: data.radio },
    { key: "aulas" as const, items: data.aulas },
    { key: "podcast" as const, items: data.podcast },
    { key: "equipos" as const, items: data.equipos },
    { key: "edicion" as const, items: data.edicion },
  ].filter(s => s.items.length > 0)

  if (sections.length === 0) {
    return (
      <div className="text-center py-12">
        <HugeiconsIcon icon={MusicNote01Icon} size={40} className="opacity-20 mx-auto mb-3" />
        <p className="text-sm font-bold opacity-40">No tiene servicios contratados</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {sections.map(({ key, items }) => {
        const cfg = serviceIcons[key]
        const Icon = cfg.icon
        return (
          <div key={key}>
            <div className="flex items-center gap-2 mb-3">
              <div className="size-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: cfg.bg }}>
                <HugeiconsIcon icon={Icon} size={14} style={{ color: cfg.color }} />
              </div>
              <h3 className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>{cfg.label}</h3>
              <span className="text-[10px] opacity-30 font-medium">({items.length})</span>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={String(item.id || idx)}
                  className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <div className="space-y-0.5">
                    <p className="font-medium" style={{ color: COLORS.CHARCOAL }}>
                      {formatReservaTitle(key, item)}
                    </p>
                    <p className="text-xs opacity-40">
                      {formatReservaDate(key, item)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.precio_total != null && (
                      <span className="text-xs font-bold">
                        ${Number(item.precio_total).toFixed(2)}
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      item.estado === "confirmada" || item.estado === "activo" ? "text-green-700 bg-green-100" :
                      item.estado === "vencido" ? "text-red-700 bg-red-100" :
                      "text-yellow-700 bg-yellow-100"
                    }`}>
                      {String(item.estado || "")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function formatReservaTitle(key: string, item: Record<string, unknown>): string {
  if (key === "radio") {
    const tarifa = item.tarifa as Record<string, unknown> | undefined
    return tarifa?.nombre ? String(tarifa.nombre) : "Reserva de Radio"
  }
  if (key === "aulas") {
    const aula = item.aula as Record<string, unknown> | undefined
    return aula?.nombre ? String(aula.nombre) : "Reserva de Aula"
  }
  if (key === "podcast") {
    const paquete = item.paquete as Record<string, unknown> | undefined
    return paquete?.nombre ? String(paquete.nombre) : "Reserva de Podcast"
  }
  if (key === "equipos") {
    const equipo = item.equipo as Record<string, unknown> | undefined
    return equipo?.nombre ? String(equipo.nombre) : "Alquiler de Equipo"
  }
  if (key === "edicion") {
    return String(item.titulo || "Trabajo de Edición")
  }
  return "Reserva"
}

function formatReservaDate(key: string, item: Record<string, unknown>): string {
  if (key === "radio" || key === "aulas" || key === "podcast") {
    const fecha = item.fecha_reserva ? String(item.fecha_reserva) : ""
    const hora = item.hora_inicio ? String(item.hora_inicio).substring(0, 5) : ""
    const horaFin = item.hora_fin ? String(item.hora_fin).substring(0, 5) : ""
    return [fecha, hora && horaFin ? `${hora} - ${horaFin}` : hora].filter(Boolean).join(" · ")
  }
  if (key === "equipos") {
    const entrega = item.fecha_entrega ? new Date(String(item.fecha_entrega)).toLocaleDateString("es-ES") : ""
    const devolucion = item.fecha_devolucion_esperada ? new Date(String(item.fecha_devolucion_esperada)).toLocaleDateString("es-ES") : ""
    return [entrega, devolucion ? `Dev: ${devolucion}` : ""].filter(Boolean).join(" · ")
  }
  if (key === "edicion") {
    const recibo = item.fecha_recibo ? new Date(String(item.fecha_recibo)).toLocaleDateString("es-ES") : ""
    const limite = item.fecha_limite ? new Date(String(item.fecha_limite)).toLocaleDateString("es-ES") : ""
    return [recibo, limite ? `Límite: ${limite}` : ""].filter(Boolean).join(" · ")
  }
  return ""
}
