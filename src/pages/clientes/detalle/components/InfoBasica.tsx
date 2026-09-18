import { HugeiconsIcon } from "@hugeicons/react"
import { CallIcon, Mail01Icon, Location01Icon, Briefcase01Icon, IdIcon, HeartIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import type { ClienteExterno } from "@/services/clientes.service"

interface InfoBasicaProps {
  cliente: ClienteExterno
}

export function InfoBasica({ cliente }: InfoBasicaProps) {
  const groups = [
    {
      title: "Identificaci\u00f3n",
      icon: IdIcon,
      fields: [
        { label: "N\u00famero de identificaci\u00f3n", value: cliente.cedula, icon: IdIcon },
      ],
    },
    {
      title: "Contacto directo",
      icon: CallIcon,
      fields: [
        { label: "Tel\u00e9fono celular", value: cliente.celular, icon: CallIcon },
        { label: "Correo electr\u00f3nico principal", value: cliente.correo, icon: Mail01Icon },
      ],
    },
    {
      title: "Ubicaci\u00f3n y perfil",
      icon: Location01Icon,
      fields: [
        { label: "Ciudad / provincia", value: cliente.ciudad, icon: Location01Icon },
        { label: "Direcci\u00f3n de residencia", value: cliente.direccion, icon: Location01Icon },
        { label: "Ocupaci\u00f3n / profesi\u00f3n", value: cliente.ocupacion, icon: Briefcase01Icon },
        { label: "Estado civil", value: cliente.estado_civil, icon: HeartIcon },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-bold" style={{ color: COLORS.CHARCOAL }}>Ficha personal e información general</h2>
        <p className="text-sm text-[#73747b]">Datos de identificación, contacto directo y perfil registrado del cliente.</p>
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-[#eff4ff] p-4">
        <div className="flex size-14 items-center justify-center rounded-full bg-[#131b2e] text-lg font-bold text-white">
          {`${cliente.nombres?.[0] ?? ""}${cliente.apellidos?.[0] ?? ""}`.toUpperCase()}
        </div>
        <div>
          <h3 className="text-lg font-bold" style={{ color: COLORS.CHARCOAL }}>
            {cliente.nombres} {cliente.apellidos || ""}
          </h3>
          <p className="text-sm text-[#73747b]">
            Cliente desde {cliente.created_at ? new Date(cliente.created_at).toLocaleDateString("es-ES", { year: "numeric", month: "long" }) : "—"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map(({ title, icon: GroupIcon, fields }) => (
          <section key={title} className="rounded-2xl bg-[#f8f9ff] p-4">
            <div className="mb-4 flex items-center gap-2">
              <HugeiconsIcon icon={GroupIcon} size={19} style={{ color: COLORS.ACCENT }} />
              <h3 className="text-base font-bold capitalize" style={{ color: COLORS.CHARCOAL }}>{title}</h3>
            </div>
            <div className="space-y-3">
              {fields.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-start gap-3 rounded-xl bg-white p-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#e5eeff]">
                    <HugeiconsIcon icon={Icon} size={15} style={{ color: COLORS.ACCENT }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#73747b]">{label}</div>
                    <p className="mt-1 break-words text-sm font-semibold" style={{ color: COLORS.CHARCOAL }}>{value || <span className="text-[#c6c6cd]">—</span>}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {cliente.observaciones && (
        <div className="rounded-xl bg-[#eff4ff] p-4">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#73747b]">Observaciones</div>
          <p className="text-sm" style={{ color: COLORS.CHARCOAL }}>{cliente.observaciones}</p>
        </div>
      )}
    </div>
  )
}
