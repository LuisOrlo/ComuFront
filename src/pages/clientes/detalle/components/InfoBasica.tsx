import { HugeiconsIcon } from "@hugeicons/react"
import { UserGroupIcon, CallIcon, Mail01Icon, Location01Icon, Calendar01Icon, Briefcase01Icon, IdIcon, HeartIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import type { ClienteExterno } from "@/services/clientes.service"

interface InfoBasicaProps {
  cliente: ClienteExterno
}

export function InfoBasica({ cliente }: InfoBasicaProps) {
  const fields = [
    { label: "C\u00e9dula", value: cliente.cedula, icon: IdIcon },
    { label: "Celular", value: cliente.celular, icon: CallIcon },
    { label: "Correo electr\u00f3nico", value: cliente.correo, icon: Mail01Icon },
    { label: "Ciudad", value: cliente.ciudad, icon: Location01Icon },
    { label: "Direcci\u00f3n", value: cliente.direccion, icon: Location01Icon },
    { label: "Ocupaci\u00f3n", value: cliente.ocupacion, icon: Briefcase01Icon },
    { label: "Estado Civil", value: cliente.estado_civil, icon: HeartIcon },
    { label: "Fecha de Nacimiento", value: cliente.fecha_nacimiento, icon: Calendar01Icon },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="size-14 rounded-full flex items-center justify-center" style={{ backgroundColor: "oklch(0.95 0.02 160)" }}>
          <HugeiconsIcon icon={UserGroupIcon} size={24} style={{ color: "oklch(0.55 0.18 160)" }} />
        </div>
        <div>
          <h3 className="text-lg font-bold" style={{ color: COLORS.CHARCOAL }}>
            {cliente.nombres} {cliente.apellidos || ""}
          </h3>
          <p className="text-sm opacity-50">
            Cliente desde {cliente.created_at ? new Date(cliente.created_at).toLocaleDateString("es-ES", { year: "numeric", month: "long" }) : "—"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {fields.map(({ label, value, icon: Icon }) => (
          <div key={label} className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-40">
              <HugeiconsIcon icon={Icon} size={12} />
              {label}
            </div>
            <p className="text-sm font-medium" style={{ color: COLORS.CHARCOAL }}>
              {value || <span className="opacity-30">—</span>}
            </p>
          </div>
        ))}
      </div>

      {cliente.observaciones && (
        <div className="pt-4 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="text-[10px] font-bold uppercase tracking-wider opacity-40 mb-1.5">Observaciones</div>
          <p className="text-sm" style={{ color: COLORS.CHARCOAL }}>{cliente.observaciones}</p>
        </div>
      )}
    </div>
  )
}
