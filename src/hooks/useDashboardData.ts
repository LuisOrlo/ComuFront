import { useQueries } from "@tanstack/react-query"
import { financeService } from "@/services/finance.service"
import { cursosService } from "@/services/cursos.service"
import { agendaService } from "@/services/agenda.service"

function today(): string {
  return new Date().toISOString().split("T")[0]
}

export function useDashboardData() {
  const [resumenQuery, estadisticasQuery, cursosQuery, agendaQuery, notificacionesQuery, cuentasQuery] = useQueries({
    queries: [
      {
        queryKey: ["dashboard", "resumen"],
        queryFn: financeService.getResumen,
        staleTime: 5 * 60 * 1000,
      },
      {
        queryKey: ["dashboard", "estadisticas"],
        queryFn: () => financeService.getEstadisticas({}),
        staleTime: 5 * 60 * 1000,
      },
      {
        queryKey: ["dashboard", "cursos"],
        queryFn: () => cursosService.getCursos({ per_page: 50 }),
        staleTime: 5 * 60 * 1000,
      },
      {
        queryKey: ["dashboard", "agenda", today()],
        queryFn: () => agendaService.getEvents({ fecha_inicio: today(), fecha_fin: today() }),
        staleTime: 2 * 60 * 1000,
      },
      {
        queryKey: ["dashboard", "notificaciones"],
        queryFn: () => cursosService.getNotificaciones(),
        staleTime: 2 * 60 * 1000,
      },
      {
        queryKey: ["dashboard", "cuentas-pendientes"],
        queryFn: () => financeService.getCuentas({ estado: "pendiente", per_page: 4 }),
        staleTime: 5 * 60 * 1000,
      },
    ],
  })

  const resumen = resumenQuery.data
  const estadisticas = estadisticasQuery.data
  const cursos = cursosQuery.data?.data ?? []
  const agenda = agendaQuery.data?.data ?? []
  const notificaciones = notificacionesQuery.data
  const cuentasPendientes = cuentasQuery.data?.data ?? []

  const kpis = {
    matriculasActivas: cursos.reduce((acc, c) => acc + c.estudiantes, 0),
    ingresosDelMes: estadisticas?.metricas?.ingresos ?? 0,
    cursosEnProgreso: cursos.filter((c) => c.estado === "en_progreso").length,
    pagosPendientes: resumen?.total_pendiente ?? 0,
  }

  const ingresosVsEgresos: { name: string; ingresos: number; egresos: number }[] =
    estadisticas?.ingresos_vs_egresos?.map((item: { mes: string; ingresos: number; egresos: number }) => ({
      name: item.mes,
      ingresos: item.ingresos,
      egresos: item.egresos,
    })) ?? []

  const alertasPagos = cuentasPendientes.map((c: Record<string, unknown>) => ({
    estudiante: (c.persona_nombre as string) ?? "—",
    curso: (c.curso_nombre as string) ?? (c.concepto as string) ?? "—",
    monto: c.saldo_pendiente as number,
    dias: (() => {
      if (!c.created_at) return 0
      const diff = Date.now() - new Date(c.created_at as string).getTime()
      return Math.floor(diff / (1000 * 60 * 60 * 24))
    })(),
  }))

  const ocupacionCursos = cursos.map((c) => ({
    name: c.nombre,
    instructor: c.instructor,
    enrolled: c.estudiantes,
    capacity: c.capacidad,
  }))

  const loading =
    resumenQuery.isLoading ||
    estadisticasQuery.isLoading ||
    cursosQuery.isLoading ||
    agendaQuery.isLoading ||
    notificacionesQuery.isLoading ||
    cuentasQuery.isLoading

  const error =
    resumenQuery.error ||
    estadisticasQuery.error ||
    cursosQuery.error ||
    agendaQuery.error ||
    notificacionesQuery.error ||
    cuentasQuery.error

  return {
    kpis,
    ingresosVsEgresos,
    alertasPagos,
    ocupacionCursos,
    agendaDelDia: agenda,
    actividadReciente: notificaciones?.recientes ?? [],
    pendientes: notificaciones?.pendientes ?? 0,
    loading,
    error,
  }
}
