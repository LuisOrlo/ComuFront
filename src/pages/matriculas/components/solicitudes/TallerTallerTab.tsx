/* eslint-disable @typescript-eslint/no-explicit-any */
import { BookOpenIcon, CalendarIcon, PaymentIcon, UserIcon, Location01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { Section, InfoItem } from "../../AprobacionHelpers"

interface TallerTallerTabProps {
  selected: any
}

export function TallerTallerTab({ selected }: TallerTallerTabProps) {
  const taller = selected.taller

  return (
    <Section title="Taller" icon={BookOpenIcon}>
      <div className="p-4 rounded-xl space-y-2 border" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <InfoItem icon={BookOpenIcon} label="Taller" value={taller?.nombre || "—"} bold />
        <InfoItem icon={CalendarIcon} label="Fecha inicio" value={taller?.fecha ? new Date(taller.fecha).toLocaleDateString('es-ES') : "—"} />
        {taller?.fecha_fin && (
          <InfoItem icon={CalendarIcon} label="Fecha fin" value={new Date(taller.fecha_fin).toLocaleDateString('es-ES')} />
        )}
        {taller?.modalidad && (
          <InfoItem icon={BookOpenIcon} label="Modalidad" value={taller.modalidad.charAt(0).toUpperCase() + taller.modalidad.slice(1)} />
        )}
        {taller?.instructor && (
          <InfoItem icon={UserIcon} label="Instructor" value={`${taller.instructor.nombres} ${taller.instructor.apellidos}`} />
        )}
        {taller?.ciudad?.nombre && (
          <InfoItem icon={Location01Icon} label="Ciudad" value={taller.ciudad.nombre} />
        )}
        <InfoItem icon={PaymentIcon} label="Precio" value={taller?.precio ? `$${Number(taller.precio).toFixed(2)}` : "—"} bold />
      </div>
    </Section>
  )
}
