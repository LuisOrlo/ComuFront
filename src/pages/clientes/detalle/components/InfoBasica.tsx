import { HugeiconsIcon } from "@hugeicons/react"
import { CallIcon, Mail01Icon, Location01Icon, Briefcase01Icon, IdIcon, HeartIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import type { ClienteExterno } from "@/services/clientes.service"

export function InfoBasica({ cliente }: { cliente: ClienteExterno }) {
  const esEmpresa = cliente.tipo_cliente === "empresa"
  const nombre = cliente.nombre_mostrado || (esEmpresa ? cliente.nombre_empresa || "" : `${cliente.nombres} ${cliente.apellidos || ""}`).trim()
  const iniciales = nombre.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase()
  const groups = [
    { title: "Identificación", icon: IdIcon, fields: [{ label: esEmpresa ? "Tipo de cliente" : "Número de identificación", value: esEmpresa ? "Empresa" : cliente.cedula, icon: IdIcon }] },
    { title: "Contacto directo", icon: CallIcon, fields: [{ label: "Teléfono / celular", value: cliente.celular, icon: CallIcon }, { label: "Correo electrónico", value: cliente.correo, icon: Mail01Icon }] },
    { title: "Ubicación", icon: Location01Icon, fields: [{ label: "Ciudad / provincia", value: cliente.ciudad, icon: Location01Icon }, { label: "Dirección", value: cliente.direccion, icon: Location01Icon }, ...(esEmpresa ? [] : [{ label: "Ocupación / profesión", value: cliente.ocupacion, icon: Briefcase01Icon }, { label: "Estado civil", value: cliente.estado_civil, icon: HeartIcon }])] },
  ]
  return <div className="space-y-6">
    <div><h2 className="text-lg font-bold" style={{ color: COLORS.CHARCOAL }}>{esEmpresa ? "Información de la empresa" : "Ficha personal e información general"}</h2><p className="text-sm text-[#73747b]">Datos del cliente y contacto directo.</p></div>
    <div className="flex items-center gap-3 rounded-2xl bg-[#eff4ff] p-4"><div className="flex size-14 items-center justify-center rounded-full bg-[#131b2e] text-lg font-bold text-white">{iniciales}</div><div><h3 className="text-lg font-bold" style={{ color: COLORS.CHARCOAL }}>{nombre}</h3><p className="text-sm text-[#73747b]">{esEmpresa ? "Empresa" : "Persona"} · Cliente desde {cliente.created_at ? new Date(cliente.created_at).toLocaleDateString("es-ES", { year: "numeric", month: "long" }) : "—"}</p></div></div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{groups.map(({ title, icon: GroupIcon, fields }) => <section key={title} className="rounded-2xl bg-[#f8f9ff] p-4"><div className="mb-4 flex items-center gap-2"><HugeiconsIcon icon={GroupIcon} size={19} style={{ color: COLORS.ACCENT }} /><h3 className="text-base font-bold" style={{ color: COLORS.CHARCOAL }}>{title}</h3></div><div className="space-y-3">{fields.map(({ label, value, icon: Icon }) => <div key={label} className="flex items-start gap-3 rounded-xl bg-white p-3"><div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#e5eeff]"><HugeiconsIcon icon={Icon} size={15} style={{ color: COLORS.ACCENT }} /></div><div className="min-w-0"><div className="text-[10px] font-bold uppercase tracking-wider text-[#73747b]">{label}</div><p className="mt-1 break-words text-sm font-semibold" style={{ color: COLORS.CHARCOAL }}>{value || <span className="text-[#c6c6cd]">—</span>}</p></div></div>)}</div></section>)}</div>
    {esEmpresa && Boolean(cliente.contactos?.length) && <section className="rounded-2xl bg-[#f8f9ff] p-4"><h3 className="mb-4 text-base font-bold" style={{ color: COLORS.CHARCOAL }}>Contactos</h3><div className="space-y-2">{cliente.contactos?.map(contacto => <div key={contacto.id} className="flex items-center justify-between rounded-xl bg-white p-3"><div><p className="text-sm font-bold">{contacto.nombres} {contacto.apellidos || ""}</p><p className="text-xs text-[#73747b]">{contacto.cargo || "Contacto"}{contacto.es_principal ? " · Principal" : ""}</p></div><div className="text-right text-xs text-[#73747b]"><p>{contacto.celular || "—"}</p><p>{contacto.activo === false ? "Inactivo" : contacto.correo || "Activo"}</p></div></div>)}</div></section>}
    {cliente.observaciones && <div className="rounded-xl bg-[#eff4ff] p-4"><div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#73747b]">Observaciones</div><p className="text-sm" style={{ color: COLORS.CHARCOAL }}>{cliente.observaciones}</p></div>}
  </div>
}
