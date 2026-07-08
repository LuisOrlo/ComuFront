import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, Download04Icon, UserGroupIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import type { Taller, InscripcionTaller } from "@/services/taller.service"
import { generarListadoAsistenciaPDF } from "@/lib/generarAsistenciaPDF"
import { toast } from "sonner"

const CHARCOAL = COLORS.CHARCOAL
const TEXT_MUTED = COLORS.TEXT_MUTED
const BORDER = COLORS.BORDER_SUBTLE

interface Props {
  taller: Taller
  inscripciones: InscripcionTaller[]
  loading: boolean
}

export function TallerParticipantes({ taller, inscripciones, loading }: Props) {
  const [search, setSearch] = useState("")

  const inscritosActivos = inscripciones.filter(i => i.estado === "activo")
  const filtered = search.trim()
    ? inscripciones.filter(i =>
        i.estado !== "retirado" &&
        (`${i.nombres} ${i.apellidos}`.toLowerCase().includes(search.toLowerCase()) ||
         i.cedula?.toLowerCase().includes(search.toLowerCase()))
      )
    : inscripciones.filter(i => i.estado !== "retirado")

  const handleDescargarListado = async () => {
    const activos = inscripciones.filter(i => i.estado === "activo")
    const nombres = activos.map(i => `${i.nombres} ${i.apellidos}`)
    const horario = `${taller.hora_inicio || "—"} - ${taller.hora_fin || "—"}`
    const instructorName = taller.instructor
      ? `${taller.instructor.nombres} ${taller.instructor.apellidos}`
      : undefined
    await generarListadoAsistenciaPDF(taller.nombre, horario, nombres, instructorName)
    toast.success("Listado de asistencia descargado")
  }

  return (
    <div className="bg-white rounded-xl border" style={{ borderColor: BORDER }}>
      <div className="px-5 py-4 border-b flex items-center justify-between gap-3" style={{ borderColor: BORDER }}>
        <div className="relative flex-1 max-w-xs">
          <HugeiconsIcon icon={Search01Icon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: TEXT_MUTED }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar participante..." className="w-full pl-9 pr-3 py-2 rounded-lg text-xs border outline-none" style={{ borderColor: BORDER }} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: TEXT_MUTED }}>
            <HugeiconsIcon icon={UserGroupIcon} size={13} className="inline mr-1" />
            {inscritosActivos.length} inscritos
          </span>
          <button onClick={handleDescargarListado}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold text-white transition-all"
            style={{ backgroundColor: "oklch(0.55 0.15 155)" }}>
            <HugeiconsIcon icon={Download04Icon} size={12} />Descargar Listado
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-sm" style={{ color: TEXT_MUTED }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm" style={{ color: TEXT_MUTED }}>
            {search ? "No se encontraron participantes" : "No hay participantes inscritos"}
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b" style={{ borderColor: BORDER }}>
                <th className="text-left font-semibold px-5 py-3" style={{ color: TEXT_MUTED }}>Participante</th>
                <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Cédula</th>
                <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Correo</th>
                <th className="text-left font-semibold px-4 py-3" style={{ color: TEXT_MUTED }}>Teléfono</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ins => (
                <tr key={ins.id} className="border-b hover:bg-gray-50/50" style={{ borderColor: BORDER }}>
                  <td className="px-5 py-3">
                    <p className="font-semibold" style={{ color: CHARCOAL }}>{ins.nombres} {ins.apellidos}</p>
                  </td>
                  <td className="px-4 py-3" style={{ color: CHARCOAL }}>{ins.cedula}</td>
                  <td className="px-4 py-3" style={{ color: CHARCOAL }}>{ins.correo}</td>
                  <td className="px-4 py-3" style={{ color: CHARCOAL }}>{ins.telefono || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
