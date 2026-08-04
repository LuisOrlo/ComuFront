/* eslint-disable @typescript-eslint/no-explicit-any */
import { HugeiconsIcon } from "@hugeicons/react"
import { UserIcon, BookOpenIcon, PaymentIcon, Image01Icon, DashboardSquareIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { Section } from "../../AprobacionHelpers"
import { fixImageUrl } from "../../AprobacionUtils"

interface SolicitudResumenTabProps {
  selected: any
  getCursoNombre: () => string
  setExpandedImageUrl: (url: string | null) => void
  cursoCatalogo: string
  cursoPrecio: number
  cursoModalidad: string
  cursoCiudad: string
  cursoHorario: string
}

export function SolicitudResumenTab({ selected, getCursoNombre, setExpandedImageUrl,
  cursoCatalogo, cursoPrecio, cursoModalidad, cursoCiudad, cursoHorario }: SolicitudResumenTabProps) {
  return (
    <Section title="Resumen de la solicitud" icon={DashboardSquareIcon}>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE, borderLeft: "3px solid oklch(0.55 0.15 240)" }}>
          <div className="flex items-center gap-2 mb-3">
            <HugeiconsIcon icon={UserIcon} size={14} style={{ color: "oklch(0.55 0.15 240)" }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "oklch(0.55 0.15 240)" }}>Estudiante</span>
          </div>
          <div className="space-y-1.5 text-sm">
            <p className="font-bold" style={{ color: COLORS.CHARCOAL }}>
              {selected.solicitante?.datos?.nombres} {selected.solicitante?.datos?.apellidos}
            </p>
            <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
              Cédula: <span className="font-medium font-mono" style={{ color: COLORS.CHARCOAL }}>{selected.solicitante?.datos?.cedula || "—"}</span>
            </p>
            <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
              Edad: <span className="font-medium" style={{ color: COLORS.CHARCOAL }}>{selected.solicitante?.datos?.edad ? `${selected.solicitante.datos.edad} años` : "—"}</span>
            </p>
            <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
              Ciudad: <span className="font-medium" style={{ color: COLORS.CHARCOAL }}>{selected.solicitante?.datos?.ciudad || "—"}</span>
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE, borderLeft: "3px solid oklch(0.55 0.12 300)" }}>
          <div className="flex items-center gap-2 mb-3">
            <HugeiconsIcon icon={BookOpenIcon} size={14} style={{ color: "oklch(0.55 0.12 300)" }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "oklch(0.55 0.12 300)" }}>Curso</span>
          </div>
          <div className="space-y-1.5 text-sm">
            <p className="font-bold" style={{ color: COLORS.CHARCOAL }}>{getCursoNombre()}</p>
            <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
              Catálogo: <span className="font-medium" style={{ color: COLORS.CHARCOAL }}>{cursoCatalogo}</span>
            </p>
            <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
              Precio: <span className="font-medium" style={{ color: COLORS.CHARCOAL }}>${cursoPrecio || 0}</span>
            </p>
            <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
              {cursoModalidad}{cursoCiudad !== "—" ? ` · ${cursoCiudad}` : ""}
            </p>
            <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
              {cursoHorario !== "—" ? cursoHorario : ""}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE, borderLeft: "3px solid oklch(0.65 0.15 75)" }}>
          <div className="flex items-center gap-2 mb-3">
            <HugeiconsIcon icon={PaymentIcon} size={14} style={{ color: "oklch(0.65 0.15 75)" }} />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "oklch(0.65 0.15 75)" }}>Pago</span>
          </div>
          <div className="space-y-1.5 text-sm">
            <p className="text-xs">
              <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{ backgroundColor: "oklch(0.55 0.15 240 / 0.12)", color: "oklch(0.55 0.15 240)" }}>
                {(selected.pago?.comprobante?.tipo || "—").toUpperCase()}
              </span>
            </p>
            <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
              Fecha: <span className="font-medium" style={{ color: COLORS.CHARCOAL }}>{(selected.pago?.comprobante?.fecha_pago_declarada || "—").split("T")[0]}</span>
            </p>
            <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
              Monto: <span className="font-medium" style={{ color: COLORS.CHARCOAL }}>
                {Number(selected.pago?.monto_solicitado) > 0 ? `$${Number(selected.pago.monto_solicitado).toLocaleString()}` : "No especificado"}
              </span>
            </p>
            {selected.pago?.comprobante?.url && !selected.pago?.comprobante?.comprobante_purgado && (
              <button onClick={() => setExpandedImageUrl(fixImageUrl(selected.pago.comprobante.url))}
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
          {selected.pago?.comprobante?.cedula_url && !selected.pago?.comprobante?.cedula_purgado ? (
            <img src={fixImageUrl(selected.pago.comprobante.cedula_url)} alt="Cédula"
              className="w-full object-contain max-h-[140px] rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
              style={{ borderColor: COLORS.BORDER_SUBTLE }}
              onClick={() => setExpandedImageUrl(fixImageUrl(selected.pago.comprobante.cedula_url))} />
          ) : selected.pago?.comprobante?.cedula_purgado ? (
            <span className="text-xs text-red-400">Cédula eliminada</span>
          ) : (
            <span className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>No se ha subido la foto de cédula</span>
          )}
        </div>
      </div>
    </Section>
  )
}
