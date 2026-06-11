import { useState, useEffect, useMemo } from "react"
import { Link } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserGroupIcon, SearchIcon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import { instructorService, type EstudianteUnificado, type InstructorCurso } from "@/services/instructor.service"
import { toast } from "sonner"

export function MisEstudiantesPage() {
  const [estudiantes, setEstudiantes] = useState<EstudianteUnificado[]>([])
  const [cursos, setCursos] = useState<InstructorCurso[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [cursoFilter, setCursoFilter] = useState("")

  const loadData = async () => {
    try {
      const [todos, misCursos] = await Promise.all([
        instructorService.getTodosEstudiantes(),
        instructorService.getMisCursos(),
      ])
      setEstudiantes(todos)
      setCursos(misCursos)
    } catch {
      toast.error("Error al cargar estudiantes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const filtered = useMemo(() => {
    return estudiantes.filter(e => {
      const fullName = `${e.nombres} ${e.apellidos}`.toLowerCase()
      const matchesSearch = !searchTerm || fullName.includes(searchTerm.toLowerCase()) || e.cedula.includes(searchTerm)
      const matchesCurso = !cursoFilter || e.cursoId === cursoFilter
      return matchesSearch && matchesCurso
    })
  }, [estudiantes, searchTerm, cursoFilter])

  if (loading) {
    return (
      <div className="p-8 text-center" style={{ color: COLORS.TEXT_MUTED }}>
        Cargando estudiantes...
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: COLORS.CHARCOAL }}>
          Mis Estudiantes
        </h1>
        <p className="text-sm mt-1" style={{ color: COLORS.TEXT_MUTED }}>
          {estudiantes.length} estudiante{estudiantes.length !== 1 ? "s" : ""} en todos tus cursos
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <HugeiconsIcon icon={SearchIcon} size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.TEXT_MUTED }} />
          <input
            type="text"
            placeholder="Buscar por nombre o cédula..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border rounded-xl text-xs outline-none bg-white"
            style={{ borderColor: COLORS.BORDER_SUBTLE }}
          />
        </div>
        <select
          value={cursoFilter}
          onChange={e => setCursoFilter(e.target.value)}
          className="px-3 py-2.5 border rounded-xl text-xs outline-none bg-white"
          style={{ borderColor: COLORS.BORDER_SUBTLE, minWidth: 180 }}
        >
          <option value="">Todos los cursos</option>
          {cursos.map(c => (
            <option key={c.id} value={c.id}>{c.nombre_instancia}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <HugeiconsIcon icon={UserGroupIcon} size={40} className="mx-auto mb-3" style={{ color: COLORS.TEXT_MUTED }} />
          <p className="text-sm font-medium" style={{ color: COLORS.CHARCOAL }}>No se encontraron estudiantes</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Estudiante</th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Cédula</th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.TEXT_MUTED }}>Curso</th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-center" style={{ color: COLORS.TEXT_MUTED }}>Asistencia</th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-center" style={{ color: COLORS.TEXT_MUTED }}>Promedio</th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-center" style={{ color: COLORS.TEXT_MUTED }}>Estado</th>
                  <th className="px-5 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
                {filtered.map(e => (
                  <tr key={`${e.matriculaId}-${e.cursoId}`} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="size-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ backgroundColor: `color-mix(in srgb, ${COLORS.ACCENT} 12%, transparent)`, color: COLORS.ACCENT }}
                        >
                          {e.nombres.charAt(0)}{e.apellidos.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: COLORS.CHARCOAL }}>
                            {e.nombres} {e.apellidos}
                          </p>
                          <p className="text-[11px]" style={{ color: COLORS.TEXT_MUTED }}>{e.correo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: COLORS.TEXT_MUTED }}>{e.cedula}</td>
                    <td className="px-5 py-3.5 text-sm font-medium" style={{ color: COLORS.CHARCOAL }}>{e.cursoNombre}</td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${e.porcentaje_asistencia}%`,
                              backgroundColor: e.porcentaje_asistencia >= 70 ? "#10b981" : e.porcentaje_asistencia >= 50 ? "#f59e0b" : "#ef4444",
                            }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold" style={{ color: COLORS.TEXT_MUTED }}>
                          {e.porcentaje_asistencia}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className="text-sm font-bold"
                        style={{ color: e.promedio_notas >= 6.5 ? "#10b981" : e.promedio_notas > 0 ? "#f59e0b" : COLORS.TEXT_MUTED }}
                      >
                        {e.promedio_notas > 0 ? e.promedio_notas.toFixed(1) : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: e.estado === "activo" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                          color: e.estado === "activo" ? "#10b981" : "#ef4444",
                        }}
                      >
                        {e.estado}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        to={`/instructor/cursos/${e.cursoId}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: COLORS.ACCENT }}
                      >
                        Ir al curso
                        <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
