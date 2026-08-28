import { useState } from "react"
import { usePermission } from "@/hooks/usePermission"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PencilEdit01Icon, Mail01Icon, SmartPhone01Icon,
  SaveIcon, Cancel01Icon, MapPinIcon
} from "@hugeicons/core-free-icons"
import { FinancialStatusBadge } from "../components/FinancialStatusBadge"
import { COLORS } from "@/lib/constants"

interface ProfileHeaderProps {
  estudiante: {
    id: string
    nombre_completo: string
    cedula: string
    correo: string
    celular?: string
    ciudad?: string
  }
  totalCursos: number
  totalTalleres?: number
  estadoPago: string
  saldoPendiente: number
  onUpdate: (fields: Record<string, string>) => void
  saving: boolean
}

export function ProfileHeader({ estudiante, totalCursos, totalTalleres = 0, estadoPago, saldoPendiente, onUpdate, saving }: ProfileHeaderProps) {

  const tieneCursos = totalCursos > 0
  const tieneTalleres = totalTalleres > 0
  const { isAdmin } = usePermission()
  const [editing, setEditing] = useState(false)
  const [nombres, setNombres] = useState("")
  const [apellidos, setApellidos] = useState("")
  const [correo, setCorreo] = useState("")
  const [celular, setCelular] = useState("")

  const handleStartEdit = () => {
    const parts = estudiante.nombre_completo.split(" ")
    setNombres(parts[0] || "")
    setApellidos(parts.slice(1).join(" ") || "")
    setCorreo(estudiante.correo || "")
    setCelular(estudiante.celular || "")
    setEditing(true)
  }

  const handleSave = () => {
    onUpdate({ nombres, apellidos, correo, celular })
    setEditing(false)
  }

  const initials = estudiante.nombre_completo
    .split(" ")
    .map(n => n.charAt(0))
    .join("")
    .substring(0, 2)
    .toUpperCase()

  return (
    <div className="bg-white overflow-hidden mb-6" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
      <div className="px-8 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div className="flex items-center gap-5">
          <div className="size-16 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0 text-white" style={{ backgroundColor: COLORS.ACCENT }}>
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold" style={{ color: COLORS.CHARCOAL }}>{estudiante.nombre_completo}</h1>
              {!editing && isAdmin && (
                <button onClick={handleStartEdit} aria-label="Editar datos del estudiante" className="size-7 rounded-lg border flex items-center justify-center hover:bg-gray-50 transition-colors" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <HugeiconsIcon icon={PencilEdit01Icon} size={13} style={{ color: COLORS.TEXT_MUTED }} />
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-2 mt-3">
                <div className="flex gap-2 flex-wrap">
                  <input type="text" value={nombres} onChange={e => setNombres(e.target.value)} placeholder="Nombres"
                    className="px-3 py-1.5 rounded-lg text-sm bg-white border outline-none w-36" style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }} />
                  <input type="text" value={apellidos} onChange={e => setApellidos(e.target.value)} placeholder="Apellidos"
                    className="px-3 py-1.5 rounded-lg text-sm bg-white border outline-none w-36" style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }} />
                  <input type="email" value={correo} onChange={e => setCorreo(e.target.value)} placeholder="Correo"
                    className="px-3 py-1.5 rounded-lg text-sm bg-white border outline-none w-48" style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }} />
                  <input type="text" value={celular} onChange={e => setCelular(e.target.value)} placeholder="Celular"
                    className="px-3 py-1.5 rounded-lg text-sm bg-white border outline-none w-32" style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={handleSave} disabled={saving}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors disabled:opacity-50" style={{ backgroundColor: COLORS.ACCENT }}>
                    <HugeiconsIcon icon={SaveIcon} size={12} />
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                  <button onClick={() => setEditing(false)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors" style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.TEXT_MUTED }}>
                    <HugeiconsIcon icon={Cancel01Icon} size={12} />
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-1">
                <span className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>C.I. {estudiante.cedula}</span>
                {estudiante.correo && (
                  <span className="text-sm flex items-center gap-1.5" style={{ color: COLORS.TEXT_MUTED }}>
                    <HugeiconsIcon icon={Mail01Icon} size={12} />
                    {estudiante.correo}
                  </span>
                )}
                {estudiante.celular && (
                  <span className="text-sm flex items-center gap-1.5" style={{ color: COLORS.TEXT_MUTED }}>
                    <HugeiconsIcon icon={SmartPhone01Icon} size={12} />
                    {estudiante.celular}
                  </span>
                )}
                {estudiante.ciudad && (
                  <span className="text-sm flex items-center gap-1.5" style={{ color: COLORS.TEXT_MUTED }}>
                    <HugeiconsIcon icon={MapPinIcon} size={12} />
                    {estudiante.ciudad}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-5 shrink-0">
          {tieneCursos && (
            <div className="text-center">
              <span className="block text-[10px] font-bold uppercase" style={{ color: COLORS.TEXT_MUTED }}>Cursos</span>
              <span className="text-2xl font-bold" style={{ color: COLORS.CHARCOAL }}>{totalCursos}</span>
            </div>
          )}
          {tieneTalleres && (
            <div className="text-center">
              <span className="block text-[10px] font-bold uppercase" style={{ color: COLORS.TEXT_MUTED }}>Talleres</span>
              <span className="text-2xl font-bold" style={{ color: COLORS.CHARCOAL }}>{totalTalleres}</span>
            </div>
          )}
          <div className="text-right">
            <FinancialStatusBadge status={estadoPago} />
            {saldoPendiente > 0 && (
              <div className="text-sm font-bold mt-1" style={{ color: "oklch(0.5 0.15 20)" }}>${saldoPendiente.toLocaleString()}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
