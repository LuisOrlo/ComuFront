import type { ReactNode } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Briefcase01Icon,
  CallIcon,
  IdIcon,
  Note01Icon,
  UserAccountIcon,
} from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import type { ClienteExterno } from "@/services/clientes.service"

function Field({
  label,
  value,
  href,
}: {
  label: string
  value?: string | number | null
  href?: string
}) {
  const hasValue = value !== undefined && value !== null && String(value).trim() !== ""

  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-bold uppercase tracking-wider text-[#73747b]">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold" style={{ color: COLORS.CHARCOAL }}>
        {hasValue ? (
          href ? (
            <a
              href={href}
              className="transition-colors hover:text-[#b45309] hover:underline"
            >
              {value}
            </a>
          ) : (
            value
          )
        ) : (
          <span className="font-medium text-[#a8a8b3]">Sin registrar</span>
        )}
      </dd>
    </div>
  )
}

function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon: typeof IdIcon
  children: ReactNode
}) {
  return (
    <section className="p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <HugeiconsIcon icon={icon} size={17} style={{ color: COLORS.ACCENT }} />
        <h3 className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>
          {title}
        </h3>
      </div>
      {children}
    </section>
  )
}

export function InfoBasica({ cliente }: { cliente: ClienteExterno }) {
  const esEmpresa = cliente.tipo_cliente === "empresa"
  const clienteDesde = cliente.created_at
    ? new Date(cliente.created_at).toLocaleDateString("es-ES", { month: "long", year: "numeric" })
    : ""
  const contactos = cliente.contactos ?? []

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold" style={{ color: COLORS.CHARCOAL }}>
          {esEmpresa ? "Información de la empresa" : "Ficha personal e información general"}
        </h2>
        <p className="text-sm text-[#73747b]">
          {esEmpresa
            ? "Datos de identificación, contacto y personas de contacto de la empresa."
            : "Datos de identificación, contacto y perfil del cliente."}
        </p>
      </div>

      <div
        className="divide-y overflow-hidden rounded-2xl border"
        style={{ borderColor: COLORS.BORDER_SUBTLE }}
      >
        <Section title="Identificación" icon={IdIcon}>
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {esEmpresa ? (
              <Field
                label="Razón social"
                value={cliente.nombre_empresa || cliente.nombre_mostrado}
              />
            ) : (
              <>
                <Field label="Nombres" value={cliente.nombres} />
                <Field label="Apellidos" value={cliente.apellidos} />
              </>
            )}
            <Field
              label={esEmpresa ? "RUC" : "Cédula de identidad"}
              value={esEmpresa ? cliente.ruc : cliente.cedula}
            />
            <Field label="Tipo de cliente" value={esEmpresa ? "Empresa" : "Persona"} />
            <Field label="Cliente desde" value={clienteDesde} />
          </dl>
        </Section>

        <Section title="Contacto" icon={CallIcon}>
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Teléfono / celular" value={cliente.celular} href={cliente.celular ? `tel:${cliente.celular}` : undefined} />
            <Field label="Correo electrónico" value={cliente.correo} href={cliente.correo ? `mailto:${cliente.correo}` : undefined} />
            <Field label="Ciudad" value={cliente.ciudad} />
            <Field label="Dirección" value={cliente.direccion} />
          </dl>
        </Section>

        {!esEmpresa && (
          <Section title="Perfil" icon={UserAccountIcon}>
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Ocupación / profesión" value={cliente.ocupacion} />
              <Field label="Estado civil" value={cliente.estado_civil} />
              <Field
                label="Edad"
                value={cliente.edad != null ? `${cliente.edad} años` : undefined}
              />
            </dl>
          </Section>
        )}

        {cliente.observaciones && (
          <Section title="Observaciones" icon={Note01Icon}>
            <p
              className="whitespace-pre-line text-sm leading-relaxed"
              style={{ color: COLORS.CHARCOAL }}
            >
              {cliente.observaciones}
            </p>
          </Section>
        )}

        {esEmpresa && contactos.length > 0 && (
          <Section title="Contactos de la empresa" icon={Briefcase01Icon}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr
                    className="border-b text-[10px] uppercase tracking-wider text-[#73747b]"
                    style={{ borderColor: COLORS.BORDER_SUBTLE }}
                  >
                    <th className="pb-2 pr-4 font-bold">Contacto</th>
                    <th className="pb-2 pr-4 font-bold">Cargo</th>
                    <th className="pb-2 pr-4 font-bold">Teléfono</th>
                    <th className="pb-2 pr-4 font-bold">Correo</th>
                    <th className="pb-2 font-bold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  {contactos.map((contacto, index) => (
                    <tr key={contacto.id ?? `${contacto.nombres}-${index}`}>
                      <td className="py-3 pr-4 align-top">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold" style={{ color: COLORS.CHARCOAL }}>
                            {contacto.nombres} {contacto.apellidos || ""}
                          </span>
                          {contacto.es_principal && (
                            <span className="rounded-full border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-orange-700">
                              Principal
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-4 align-top text-[#45464d]">
                        {contacto.cargo || <span className="text-[#a8a8b3]">—</span>}
                      </td>
                      <td className="py-3 pr-4 align-top text-[#45464d]">
                        {contacto.celular ? (
                          <a href={`tel:${contacto.celular}`} className="hover:text-[#b45309] hover:underline">
                            {contacto.celular}
                          </a>
                        ) : (
                          <span className="text-[#a8a8b3]">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 align-top text-[#45464d]">
                        {contacto.correo ? (
                          <a href={`mailto:${contacto.correo}`} className="hover:text-[#b45309] hover:underline">
                            {contacto.correo}
                          </a>
                        ) : (
                          <span className="text-[#a8a8b3]">—</span>
                        )}
                      </td>
                      <td className="py-3 align-top">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                            contacto.activo === false
                              ? "border-gray-200 bg-gray-50 text-gray-500"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${
                              contacto.activo === false ? "bg-gray-400" : "bg-emerald-500"
                            }`}
                          />
                          {contacto.activo === false ? "Inactivo" : "Activo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}
