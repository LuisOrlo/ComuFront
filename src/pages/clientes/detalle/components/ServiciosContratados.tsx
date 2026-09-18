import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { MusicNote01Icon, Building04Icon, AiPhone01Icon, Camera01Icon, VideoIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { clientesService } from "@/services/clientes.service"
import { toast } from "sonner"
import { formatReservaTitle, formatReservaDate } from "./servicioFormat"

interface ServiciosContratadosProps {
  clienteId: string
}

const serviceIcons: Record<string, { icon: typeof MusicNote01Icon; color: string; bg: string; label: string }> = {
  radio: { icon: MusicNote01Icon, color: "#db2777", bg: "#fdf2f8", label: "Radio" },
  aulas: { icon: Building04Icon, color: "#059669", bg: "#ecfdf5", label: "Aulas" },
  podcast: { icon: AiPhone01Icon, color: "#d97706", bg: "#fffbeb", label: "Podcast" },
  equipos: { icon: Camera01Icon, color: "#9333ea", bg: "#faf5ff", label: "Equipos" },
  edicion: { icon: VideoIcon, color: "#0891b2", bg: "#ecfeff", label: "Edición de Video" },
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

  const totalServicios = sections.reduce((total, section) => total + section.items.length, 0)

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-5 shadow-sm" style={{ border: `1px solid ${COLORS.BORDER_SUBTLE}` }}>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold" style={{ color: COLORS.CHARCOAL }}>Servicios contratados</h2>
            <p className="text-sm text-[#73747b]">Historial de reservas y servicios registrados para este cliente.</p>
          </div>
          <span className="w-fit rounded-full bg-[#ffdbca] px-2.5 py-1 text-[11px] font-bold text-[#783200]">
            {totalServicios} {totalServicios === 1 ? "servicio" : "servicios"}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {sections.map(({ key, items }) => {
            const cfg = serviceIcons[key]
            return (
              <div key={key} className="rounded-xl bg-[#f8f9ff] p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#73747b]">{cfg.label}</div>
                <div className="mt-1 text-xl font-bold" style={{ color: cfg.color }}>{items.length}</div>
              </div>
            )
          })}
        </div>
      </div>

      {sections.map(({ key, items }) => {
        const cfg = serviceIcons[key]
        const Icon = cfg.icon
        return (
          <div key={key}>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: cfg.bg }}>
                <HugeiconsIcon icon={Icon} size={14} style={{ color: cfg.color }} />
              </div>
              <h3 className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>{cfg.label}</h3>
              <span className="rounded-full bg-[#e5eeff] px-2 py-0.5 text-[10px] font-semibold text-[#73747b]">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={String(item.id || idx)}
                  className="flex flex-col gap-3 rounded-xl border bg-white px-4 py-4 text-sm shadow-sm transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                  style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <div className="min-w-0 space-y-1">
                    <p className="font-bold" style={{ color: COLORS.CHARCOAL }}>
                      {formatReservaTitle(key, item)}
                    </p>
                    <p className="text-xs text-[#73747b]">
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
