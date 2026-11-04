import { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router"
import { usePermission } from "@/hooks/usePermission"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, SaveIcon } from "@hugeicons/core-free-icons"
import { COLORS } from "@/lib/constants"
import {
  instructorService,
  type InstructorCurso,
  type EstudianteCurso,
  type ModuloResumen,
} from "@/services/instructor.service"
import { toast } from "sonner"

type NotaLocal = { calificacion: string }

export function NotasRegistroPage() {
  const { cursoId, moduloId } = useParams<{ cursoId: string; moduloId: string }>()
  const navigate = useNavigate()
  const { isAdmin, isSecretaria } = usePermission()
  const backUrl = isAdmin || isSecretaria
    ? `/cursos/${cursoId}?tab=modulos`
    : `/instructor/cursos/${cursoId}?tab=grades`
  const [curso, setCurso] = useState<InstructorCurso | null>(null)
  const [modulo, setModulo] = useState<ModuloResumen | null>(null)
  const [estudiantes, setEstudiantes] = useState<EstudianteCurso[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notasLocal, setNotasLocal] = useState<Record<string, NotaLocal>>({})

  const loadData = async () => {
    try {
      const [cursoData, estudiantesData] = await Promise.all([
        instructorService.getDetalleCurso(cursoId!),
        instructorService.getEstudiantesCurso(cursoId!),
      ])

      const mod = cursoData.modulos.find((m) => m.id === moduloId) ?? null
      setCurso(cursoData)
      setModulo(mod)
      setEstudiantes(estudiantesData)

      const initialNotas: Record<string, NotaLocal> = {}
      estudiantesData.forEach((e) => {
        const notaExistente = e.notas.find((n) => n.modulo_id === moduloId)
        initialNotas[e.id] = {
          calificacion: notaExistente?.calificacion?.toString() || "",
        }
      })
      setNotasLocal(initialNotas)
    } catch {
      toast.error("Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (cursoId && moduloId) {

      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursoId, moduloId])

  const handleNotaChange = (matriculaId: string, value: string) => {
    const val = value.replace(",", ".")
    if (val === "" || (parseFloat(val) >= 0 && parseFloat(val) <= 10)) {
      setNotasLocal((prev) => ({
        ...prev,
        [matriculaId]: { ...prev[matriculaId], calificacion: val },
      }))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = Object.entries(notasLocal).map(
        ([matriculaId, data]) => ({
          matricula_id: matriculaId,
          calificacion: parseFloat(data.calificacion) || 0,
        }),
      )

      await instructorService.registrarNotas(moduloId!, payload)
      toast.success("Notas guardadas correctamente")
      navigate(backUrl)
    } catch {
      toast.error("Error al guardar las notas")
    } finally {
      setSaving(false)
    }
  }

  if (loading)
    return (
      <div className="p-8 text-center" style={{ color: COLORS.TEXT_MUTED }}>
        Cargando...
      </div>
    )
  if (!modulo)
    return (
      <div className="p-8 text-center" style={{ color: COLORS.TEXT_MUTED }}>
        Módulo no encontrado
      </div>
    )

  const getEstudianteName = (e: EstudianteCurso) => {
    if (e.estudiante) {
      return `${e.estudiante.nombres} ${e.estudiante.apellidos}`
    }
    if (e.participante_externo) {
      return `${e.participante_externo.nombres} ${e.participante_externo.apellidos ?? ""}`
    }
    return "Estudiante externo"
  }

  return (
    <main className="min-h-full bg-[#f8f9ff] px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link to={backUrl} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#45464d] transition-colors hover:text-[#9d4300]">
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          {isAdmin || isSecretaria ? "Volver a módulos del curso" : "Volver al curso"}
        </Link>

        <section className="overflow-hidden rounded-2xl border border-[#e5eeff] bg-white shadow-[0_8px_28px_rgba(11,28,48,0.05)]">
          <header className="border-b border-[#e5eeff] bg-white px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <span className="inline-flex rounded-full bg-[#fff0e6] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9d4300]">Registro de notas</span>
                <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <h1 className="truncate text-lg font-bold tracking-tight text-[#0b1c30] sm:text-xl">{modulo.nombre_modulo}</h1>
                  <span className="flex min-w-0 items-center gap-2 text-sm text-[#45464d]">
                    {curso?.catalogo?.color && <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: curso.catalogo.color }} />}
                    <span className="truncate">{curso?.catalogo?.nombre ?? "Curso"}{curso?.nombre_instancia ? ` · ${curso.nombre_instancia}` : ""}</span>
                  </span>
                </div>
              </div>
              <div className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-[#e5eeff] bg-[#f8f9ff] px-3 py-1.5">
                <span className="text-sm font-bold text-[#0b1c30]">{estudiantes.length}</span>
                <span className="text-xs font-medium text-[#45464d]">{estudiantes.length === 1 ? "estudiante" : "estudiantes"}</span>
              </div>
            </div>
          </header>

          <div className="p-5 sm:p-6">
            <div className="overflow-hidden rounded-xl border border-[#e5eeff]">
              <div className="hidden grid-cols-[minmax(0,1fr)_110px_150px] gap-4 bg-[#eff4ff] px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-[#45464d] md:grid">
                <span>Estudiante</span><span>Asistencia</span><span className="text-center">Calificación / 10</span>
              </div>
              {estudiantes.length === 0 ? (
                <div className="px-5 py-14 text-center text-sm text-[#45464d]">No hay estudiantes matriculados en este curso.</div>
              ) : (
                estudiantes.map((e, index) => {
                  const rawNota = notasLocal[e.id]?.calificacion || ""
                  const nota = rawNota === "" ? null : parseFloat(rawNota)
                  const isApproved = nota !== null && nota >= 6.5
                  return (
                    <div key={e.id} className={`grid gap-4 px-5 py-3 md:grid-cols-[minmax(0,1fr)_110px_150px] md:items-center ${index ? "border-t border-[#e5eeff]" : ""}`}>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#0b1c30]">{getEstudianteName(e)}</p>
                        <p className="mt-0.5 text-[11px] text-[#45464d] md:hidden">Asistencia: {e.porcentaje_asistencia}%</p>
                      </div>
                      <div className="hidden md:block">
                        <span className="inline-flex rounded-full bg-[#e7f7f0] px-2 py-0.5 text-[11px] font-bold text-[#006b4a]">{e.porcentaje_asistencia}%</span>
                      </div>
                      <div className="flex items-center gap-2 md:justify-center">
                        <label className="sr-only" htmlFor={`nota-${e.id}`}>Calificación de {getEstudianteName(e)}</label>
                        <input
                          id={`nota-${e.id}`}
                          type="text"
                          inputMode="decimal"
                          value={rawNota}
                          onChange={(ev) => handleNotaChange(e.id, ev.target.value)}
                          placeholder="0.00"
                          className="h-9 w-20 rounded-lg border bg-white px-2 text-center text-sm font-semibold text-[#0b1c30] outline-none transition focus:border-[#fd761a] focus:ring-2 focus:ring-[#fd761a]/20"
                          style={{ borderColor: nota === null ? "#c6d5ee" : isApproved ? "#009668" : "#ba1a1a" }}
                        />
                        <span className={`min-w-14 text-[11px] font-semibold ${nota === null ? "text-[#797a82]" : isApproved ? "text-[#009668]" : "text-[#ba1a1a]"}`}>
                          {nota === null ? "Pendiente" : isApproved ? "Aprobado" : "Reprobado"}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
              <Link to={backUrl} className="inline-flex items-center justify-center rounded-lg border border-[#c6d5ee] px-5 py-3 text-sm font-semibold text-[#45464d] transition-colors hover:bg-[#eff4ff]">Cancelar</Link>
              <button onClick={handleSave} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#fd761a] px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#9d4300] disabled:cursor-not-allowed disabled:opacity-50">
                <HugeiconsIcon icon={SaveIcon} size={18} />{saving ? "Guardando..." : "Guardar notas"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
