import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PencilEdit01Icon, Mail01Icon, SmartPhone01Icon,
  SaveIcon, Cancel01Icon, CalendarIcon, MapPinIcon
} from "@hugeicons/core-free-icons"
import { FinancialStatusBadge } from "../components/FinancialStatusBadge"

interface ProfileHeaderProps {
  estudiante: {
    id: string
    nombre_completo: string
    cedula: string
    correo: string
    celular?: string
    ciudad?: string
    fecha_nacimiento?: string
  }
  totalCursos: number
  estadoPago: string
  saldoPendiente: number
  onUpdate: (fields: Record<string, string>) => void
  saving: boolean
}

export function ProfileHeader({ estudiante, totalCursos, estadoPago, saldoPendiente, onUpdate, saving }: ProfileHeaderProps) {
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
    <div className="bg-gray-900 rounded-2xl overflow-hidden mb-6">
      <div className="px-8 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div className="flex items-center gap-5">
          <div className="size-16 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl font-bold shrink-0 text-white">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-white">{estudiante.nombre_completo}</h1>
              {!editing && (
                <button onClick={handleStartEdit} className="size-7 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <HugeiconsIcon icon={PencilEdit01Icon} size={13} className="text-white/60" />
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-2 mt-3">
                <div className="flex gap-2 flex-wrap">
                  <input type="text" value={nombres} onChange={e => setNombres(e.target.value)} placeholder="Nombres"
                    className="px-3 py-1.5 rounded-lg text-sm bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none w-36" />
                  <input type="text" value={apellidos} onChange={e => setApellidos(e.target.value)} placeholder="Apellidos"
                    className="px-3 py-1.5 rounded-lg text-sm bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none w-36" />
                  <input type="email" value={correo} onChange={e => setCorreo(e.target.value)} placeholder="Correo"
                    className="px-3 py-1.5 rounded-lg text-sm bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none w-48" />
                  <input type="text" value={celular} onChange={e => setCelular(e.target.value)} placeholder="Celular"
                    className="px-3 py-1.5 rounded-lg text-sm bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none w-32" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={handleSave} disabled={saving}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50">
                    <HugeiconsIcon icon={SaveIcon} size={12} />
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                  <button onClick={() => setEditing(false)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 text-white/70 hover:bg-white/20 transition-colors">
                    <HugeiconsIcon icon={Cancel01Icon} size={12} />
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-1">
                <span className="text-gray-400 text-sm">C.I. {estudiante.cedula}</span>
                {estudiante.correo && (
                  <span className="text-gray-400 text-sm flex items-center gap-1.5">
                    <HugeiconsIcon icon={Mail01Icon} size={12} />
                    {estudiante.correo}
                  </span>
                )}
                {estudiante.celular && (
                  <span className="text-gray-400 text-sm flex items-center gap-1.5">
                    <HugeiconsIcon icon={SmartPhone01Icon} size={12} />
                    {estudiante.celular}
                  </span>
                )}
                {estudiante.ciudad && (
                  <span className="text-gray-400 text-sm flex items-center gap-1.5">
                    <HugeiconsIcon icon={MapPinIcon} size={12} />
                    {estudiante.ciudad}
                  </span>
                )}
                {estudiante.fecha_nacimiento && (
                  <span className="text-gray-400 text-sm flex items-center gap-1.5">
                    <HugeiconsIcon icon={CalendarIcon} size={12} />
                    {estudiante.fecha_nacimiento}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-5 shrink-0">
          <div className="text-center">
            <span className="block text-[10px] font-bold text-gray-400 uppercase">Cursos</span>
            <span className="text-2xl font-bold text-white">{totalCursos}</span>
          </div>
          <div className="text-right">
            <FinancialStatusBadge status={estadoPago} />
            {saldoPendiente > 0 && (
              <div className="text-sm font-bold text-red-400 mt-1">${saldoPendiente.toLocaleString()}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
