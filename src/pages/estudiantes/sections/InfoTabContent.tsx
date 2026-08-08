import { useState } from "react"
import { usePermission } from "@/hooks/usePermission"
import type { Estudiante, AcademicProfile } from "@/services/estudiantes.service"
import { TransferCursoModal } from "@/components/estudiantes/TransferCursoModal"
import { COLORS } from "@/lib/constants"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDataTransferHorizontalIcon } from "@hugeicons/core-free-icons"

interface InfoTabContentProps {
  data: Estudiante | null
  academicData: AcademicProfile | null
  loading: boolean
  onRefresh: () => void
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—"
  const clean = dateStr.split("T")[0]
  const parts = clean.split("-")
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
  return dateStr
}

export function InfoTabContent({ data, academicData, loading, onRefresh }: InfoTabContentProps) {
  const { isAdmin } = usePermission()
  const [transferMatricula, setTransferMatricula] = useState<{
    id: string
    curso: string
    fecha_inscripcion: string
    promedio: number | null
    notas: Array<{ modulo: string; calificacion: number; aprobado: boolean }>
    porcentaje_asistencia: number
  } | null>(null)

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="animate-spin size-6 border-2 border-t-transparent rounded-full mx-auto mb-3" style={{ borderColor: COLORS.ACCENT }} />
        <p className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>Cargando informacion del estudiante...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p style={{ color: COLORS.TEXT_MUTED }}>No se encontro informacion del estudiante.</p>
      </div>
    )
  }

  const perfil = data.perfil_estudiante

  const personalFields: Array<{ label: string; value: string; full?: boolean }> = [
    { label: "Nombres", value: data.nombres },
    { label: "Apellidos", value: data.apellidos },
    { label: "Cedula", value: data.cedula || "—" },
    { label: "Correo", value: data.correo || "—" },
    { label: "Celular", value: data.celular || "—" },
    { label: "Edad", value: perfil?.edad != null ? String(perfil.edad) : "—" },
    { label: "Ocupacion", value: perfil?.ocupacion || "—" },
    { label: "Estado Civil", value: perfil?.estado_civil || "—" },
    { label: "Direccion", value: perfil?.direccion || "—" },
    { label: "Ciudad", value: data.ciudad?.nombre || perfil?.ciudad || "—" },
  ]

  const esTaller = (data.total_talleres ?? 0) > 0 && (data.total_cursos ?? 0) === 0
  const totalLabel = esTaller ? "Total de talleres" : "Total de cursos"

  const academicFields: Array<{ label: string; value: string; full?: boolean }> = [
    { label: totalLabel, value: String(esTaller ? data.total_talleres : perfil?.total_cursos || data.total_cursos || 0) },
    { label: "Primera matricula", value: formatDate(perfil?.primera_matricula) },
    { label: "Ultima matricula", value: formatDate(perfil?.ultima_matricula) },
    { label: "Registrado", value: data.creado_en ? new Date(data.creado_en).toLocaleString("es-ES") : "—" },
    { label: "Ultima actualizacion", value: data.actualizado_en ? new Date(data.actualizado_en).toLocaleString("es-ES") : "—" },
    { label: "Notas internas", value: perfil?.notas_internas || "—", full: true },
  ]

  const matriculasActivas = academicData?.matriculas.filter((m) => m.estado === "activo") ?? []

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: COLORS.TEXT_MUTED }}>Datos Personales</h3>
          <div className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            {personalFields.map((row) => (
              <div key={row.label} className="flex justify-between py-2.5 text-sm">
                <span className="shrink-0" style={{ color: COLORS.TEXT_MUTED }}>{row.label}</span>
                <span className="font-bold text-right ml-4 truncate" style={{ color: COLORS.CHARCOAL }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: COLORS.TEXT_MUTED }}>Perfil Academico</h3>
          <div className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            {academicFields.map((row) => (
              <div key={row.label} className={`py-2.5 text-sm ${row.full ? "" : "flex justify-between"}`}>
                <span style={{ color: COLORS.TEXT_MUTED }}>{row.label}</span>
                <span className={`font-bold ${row.full ? "block mt-1" : "text-right ml-4 truncate"}`} style={{ color: COLORS.CHARCOAL }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {matriculasActivas.length > 0 && (
        <div className="mt-8 pt-6 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: COLORS.TEXT_MUTED }}>
            Matriculas Activas ({matriculasActivas.length})
          </h3>
          <div className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            {matriculasActivas.map((matricula) => (
              <div key={matricula.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: COLORS.CHARCOAL }}>{matricula.curso}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: COLORS.TEXT_MUTED }}>
                    {matricula.notas.length} modulo{matricula.notas.length !== 1 ? "s" : ""}
                    {matricula.promedio !== null && (
                      <>
                        <span className="mx-1.5">·</span>
                        Promedio: {matricula.promedio}
                      </>
                    )}
                    <span className="mx-1.5">·</span>
                    Asistencia: {matricula.porcentaje_asistencia}%
                  </p>
                </div>
                {isAdmin && (
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold"
                      style={{
                        borderColor: "oklch(0.8 0.15 75 / 0.3)",
                        backgroundColor: "oklch(0.8 0.15 75 / 0.08)",
                        color: "oklch(0.55 0.15 75)",
                      }}
                    >
                      En revisión - Por confirmar proceso
                    </span>
                    <button
                      onClick={() => setTransferMatricula(matricula)}
                      disabled
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white cursor-not-allowed disabled:opacity-40 shrink-0"
                      style={{ backgroundColor: COLORS.ACCENT }}
                    >
                      <HugeiconsIcon icon={ArrowDataTransferHorizontalIcon} size={13} />
                      Transferir
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {transferMatricula && (
        <TransferCursoModal
          isOpen={!!transferMatricula}
          onClose={() => setTransferMatricula(null)}
          onSuccess={onRefresh}
          matricula={transferMatricula}
        />
      )}
    </div>
  )
}
