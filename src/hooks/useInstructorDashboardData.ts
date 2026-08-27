import { useEffect, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { instructorService, type InstructorCurso, type EstudianteCurso, type CursoDashboard } from "@/services/instructor.service"
import { toast } from "sonner"

export interface ClaseConCurso {
  id: string
  cursoId: string
  cursoNombre: string
  moduloNombre: string
  fecha: string
  horaInicio: string
  horaFin: string
  asistenciaRegistrada: boolean
}

export interface CursoActivoConData {
  id: string
  nombre: string
  catalogoNombre: string
  periodo: string
  ciudad: string
  estudiantesCount: number
  moduloActual: string
  totalClases: number
  clasesRealizadas: number
  progreso: number
}

export interface DashboardData {
  fechaActual: string
  cursosActivosCount: number
  clasesSemanaCount: number
  totalEstudiantes: number
  clasesHoy: (ClaseConCurso & { desdeHorario?: boolean })[]
  proximaClase: (ClaseConCurso & { desdeHorario?: boolean }) | null
  cursosActivos: CursoActivoConData[]
  clasesPendientesSemana: (ClaseConCurso & { vencida: boolean; desdeHorario?: boolean })[]
  observacionesPendientes: ClaseConCurso[]
}

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0]
}

function addDays(date: Date, days: number): Date {
  const r = new Date(date)
  r.setDate(r.getDate() + days)
  return r
}

function getWeekBounds(): { start: string; end: string } {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now)
  monday.setDate(diff)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { start: toDateStr(monday), end: toDateStr(sunday) }
}

function getDiasSemana(curso: InstructorCurso): number[] {
  const h = curso.horario
  if (!h) return []

  const rawDias = (Array.isArray(h.dias_semana) && h.dias_semana.length > 0)
    ? h.dias_semana
    : (h.dia_semana ?? [])

  const diasArray = Array.isArray(rawDias) ? rawDias : [rawDias]

  return diasArray
    .map((d) => {
      if (typeof d === "number") return d
      if (d && typeof d === "object" && "dia_semana" in d) return (d as { dia_semana: number }).dia_semana
      return undefined
    })
    .filter((d): d is number => typeof d === "number" && d >= 1 && d <= 7)
}

function cursoTieneClaseEnFecha(curso: InstructorCurso, dateStr: string): boolean {
  const dias = getDiasSemana(curso)
  if (dias.length === 0) return false

  const date = new Date(dateStr + "T00:00:00")
  const jsDay = date.getDay()
  const nuestroDia = jsDay === 0 ? 7 : jsDay

  if (!dias.includes(nuestroDia)) return false

  const start = curso.fecha_inicio.split("T")[0] || curso.fecha_inicio
  const end = curso.fecha_fin ? (curso.fecha_fin.split("T")[0] || curso.fecha_fin) : start
  return dateStr >= start && dateStr <= end
}

export function useInstructorDashboardData() {
  const dashboardQuery = useQuery<CursoDashboard[]>({
    queryKey: ["instructor", "dashboard"],
    queryFn: instructorService.getDashboard,
    staleTime: 5 * 60 * 1000,
  })

  const cursos = useMemo(() => dashboardQuery.data ?? [], [dashboardQuery.data])

  const activos = useMemo(
    () => cursos.filter(
      (c) => c.estado === "activo" || c.estado === "en_progreso" || c.estado === "pendiente"
    ),
    [cursos]
  )

  const estudiantesMap = useMemo(() => {
    const map: Record<string, EstudianteCurso[]> = {}
    for (const c of cursos) {
      map[c.id] = c.estudiantes || []
    }
    return map
  }, [cursos])

  const clasesList = useMemo<ClaseConCurso[]>(() => {
    const all: ClaseConCurso[] = []
    for (const c of cursos) {
      const cursoNombre = c.nombre_instancia || c.catalogo?.nombre || "Curso"
      for (const cl of c.clases || []) {
        all.push({
          id: cl.id,
          cursoId: c.id,
          cursoNombre,
          moduloNombre: cl.modulo_nombre,
          fecha: (cl.fecha_clase || "").split("T")[0],
          horaInicio: cl.hora_inicio?.substring(0, 5) || "",
          horaFin: cl.hora_fin?.substring(0, 5) || "",
          asistenciaRegistrada: cl.asistencia_registrada,
        })
      }
    }
    return all
  }, [cursos])

  const loading = dashboardQuery.isLoading

  const someError = dashboardQuery.isError

  useEffect(() => {
    if (someError) toast.error("Error al cargar datos del dashboard")
  }, [someError])

  const data: DashboardData | null = useMemo(() => {
    if (loading) return null

    const now = new Date()
    const todayStr = toDateStr(now)
    const { start: weekStart, end: weekEnd } = getWeekBounds()

    const totalEstudiantes = activos.reduce((acc, c) => {
      const est = estudiantesMap[c.id] || []
      return acc + est.length
    }, 0)

    const tieneClasesReales = clasesList.length > 0

    const clasesHoy: (ClaseConCurso & { desdeHorario?: boolean })[] = tieneClasesReales
      ? [...clasesList]
          .filter((c) => c.fecha === todayStr)
          .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
      : activos
          .filter((c) => cursoTieneClaseEnFecha(c, todayStr))
          .map((c) => ({
            id: `${c.id}-hoy`,
            cursoId: c.id,
            cursoNombre: c.nombre_instancia || c.catalogo?.nombre || "Curso",
            moduloNombre: "",
            fecha: todayStr,
            horaInicio: c.horario?.hora_inicio?.substring(0, 5) || "",
            horaFin: c.horario?.hora_fin?.substring(0, 5) || "",
            asistenciaRegistrada: false,
            desdeHorario: true,
          }))
          .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))

    const clasesSemana = tieneClasesReales
      ? clasesList.filter((c) => c.fecha >= weekStart && c.fecha <= weekEnd)
      : activos.flatMap((c) => {
          const dias = getDiasSemana(c)
          if (dias.length === 0) return []
          const result: ClaseConCurso[] = []
          let d = new Date(weekStart + "T00:00:00")
          const end = new Date(weekEnd + "T00:00:00")
          while (d <= end) {
            const ds = toDateStr(d)
            if (cursoTieneClaseEnFecha(c, ds)) {
              const jsDay = d.getDay()
              const nuestroDia = jsDay === 0 ? 7 : jsDay
              if (dias.includes(nuestroDia)) {
                result.push({
                  id: `${c.id}-${ds}`,
                  cursoId: c.id,
                  cursoNombre: c.nombre_instancia || c.catalogo?.nombre || "Curso",
                  moduloNombre: "",
                  fecha: ds,
                  horaInicio: c.horario?.hora_inicio?.substring(0, 5) || "",
                  horaFin: c.horario?.hora_fin?.substring(0, 5) || "",
                  asistenciaRegistrada: false,
                })
              }
            }
            d = addDays(d, 1)
          }
          return result
        })

    const clasesPendientesSemana = clasesSemana
      .filter((c) => !c.asistenciaRegistrada)
      .map((c) => ({ ...c, vencida: c.fecha < todayStr }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.horaInicio.localeCompare(b.horaInicio))

    const observacionesPendientes = tieneClasesReales
      ? [...clasesList].filter((c) => c.fecha < todayStr && c.asistenciaRegistrada)
      : []

    const proximaClase = tieneClasesReales
      ? ([...clasesList]
          .filter(
            (c) =>
              c.fecha > todayStr ||
              (c.fecha === todayStr && c.horaInicio > now.toTimeString().slice(0, 5))
          )
          .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.horaInicio.localeCompare(b.horaInicio))[0] ?? null)
      : (() => {
          for (let i = 1; i <= 60; i++) {
            const d = addDays(now, i)
            const ds = toDateStr(d)
            const cursosConClase = activos.filter((c) => cursoTieneClaseEnFecha(c, ds))
            if (cursosConClase.length > 0) {
              const c = cursosConClase[0]
              return {
                id: `${c.id}-${ds}`,
                cursoId: c.id,
                cursoNombre: c.nombre_instancia || c.catalogo?.nombre || "Curso",
                moduloNombre: "",
                fecha: ds,
                horaInicio: c.horario?.hora_inicio?.substring(0, 5) || "",
                horaFin: c.horario?.hora_fin?.substring(0, 5) || "",
                asistenciaRegistrada: false,
                desdeHorario: true,
              }
            }
          }
          return null
        })()

    const cursosActivos = activos.map((c) => {
      const cursoClases = tieneClasesReales
        ? clasesList.filter((cl) => cl.cursoId === c.id)
        : []

      const totalClases = cursoClases.length
      const clasesRealizadas = cursoClases.filter((cl) => cl.fecha < todayStr).length
      const progreso = totalClases > 0 ? Math.round((clasesRealizadas / totalClases) * 100) : 0
      const estudiantes = estudiantesMap[c.id] || []

      const sortedModulos = [...(c.modulos || [])].sort((a, b) => a.numero_orden - b.numero_orden)
      const moduloEnCurso = sortedModulos.length > 0
        ? (sortedModulos.find((m) => {
            const mClases = cursoClases.filter((cl) => cl.moduloNombre === m.nombre_modulo)
            return mClases.length === 0 || mClases.some((cl) => cl.fecha >= todayStr)
          }) || sortedModulos[sortedModulos.length - 1])
        : null

      return {
        id: c.id,
        nombre: c.nombre_instancia,
        catalogoNombre: c.catalogo?.nombre || "",
        periodo: `${new Date(c.fecha_inicio).toLocaleDateString("es-ES", { day: "numeric", month: "short" })} — ${new Date(c.fecha_fin).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}`,
        ciudad: c.ciudad?.nombre || "",
        estudiantesCount: estudiantes.length,
        moduloActual: moduloEnCurso?.nombre_modulo || "",
        totalClases,
        clasesRealizadas,
        progreso,
      }
    })

    const fechaActual = now.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })

    return {
      fechaActual,
      cursosActivosCount: activos.length,
      clasesSemanaCount: clasesSemana.length,
      totalEstudiantes,
      clasesHoy,
      proximaClase,
      cursosActivos,
      clasesPendientesSemana,
      observacionesPendientes,
    }
  }, [estudiantesMap, clasesList, loading, activos])

  return { data, loading }
}
