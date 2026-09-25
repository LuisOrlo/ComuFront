import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router"
import { lazy, Suspense, useState, useRef } from "react"
import type { ComponentType } from "react"
import { useQuery } from "@tanstack/react-query"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
function lazyNamed<T>(load: () => Promise<T>, exportName: string) {
  return lazy(async () => {
    const module = await load()
    const component = (module as Record<string, unknown>)[exportName]
    if (typeof component !== "function") throw new Error(`No se encontró la exportación ${exportName}`)
    return { default: component as ComponentType<unknown> }
  })
}

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      Cargando…
    </div>
  )
}

function LegacyPagoDetalleRedirect() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={id ? `/finanzas/movimientos/${id}` : "/finanzas/movimientos"} replace />
}

const LoginPage = lazyNamed(() => import("@/pages/login/LoginPage"), "LoginPage")
const HomePage = lazyNamed(() => import("@/pages/home/HomePage"), "HomePage")
const CursosPage = lazyNamed(() => import("@/pages/cursos/CursosPage"), "CursosPage")
const CursoFormPage = lazyNamed(() => import("@/pages/cursos/CursoFormPage"), "CursoFormPage")
const CursoDetailPage = lazyNamed(() => import("@/pages/cursos/detalle/CursoDetailPage"), "CursoDetailPage")
const CursosPersonalizadosPage = lazyNamed(() => import("@/pages/cursos-personalizados/CursosPersonalizadosPage"), "CursosPersonalizadosPage")
const CursoPersonalizadoFormPage = lazyNamed(() => import("@/pages/cursos-personalizados/CursoPersonalizadoFormPage"), "CursoPersonalizadoFormPage")
const CursoPersonalizadoDetailPage = lazyNamed(() => import("@/pages/cursos-personalizados/CursoPersonalizadoDetailPage"), "CursoPersonalizadoDetailPage")
const CatalogosConCursosPage = lazyNamed(() => import("@/pages/catalogos/CatalogosConCursosPage"), "CatalogosConCursosPage")
const CatalogoFormPage = lazyNamed(() => import("@/pages/catalogos/CatalogoFormPage"), "CatalogoFormPage")
const CiudadesPage = lazyNamed(() => import("@/pages/admin/ciudades/CiudadesPage"), "CiudadesPage")
const PersonasPage = lazyNamed(() => import("@/pages/personas/PersonasPage"), "PersonasPage")
const PagosPersonaPage = lazyNamed(() => import("@/pages/personas/PagosPersonaPage"), "PagosPersonaPage")
const TareasPage = lazyNamed(() => import("@/pages/tareas/TareasPage"), "TareasPage")
const CuentasPage = lazyNamed(() => import("@/pages/cuentas/CuentasPage"), "CuentasPage")
const NuevaMatriculaPublicaPage = lazyNamed(() => import("@/pages/matriculas/NuevaMatriculaPublicaPage"), "NuevaMatriculaPublicaPage")
const AprobacionMatriculasPage = lazyNamed(() => import("@/pages/matriculas/AprobacionMatriculasPage"), "AprobacionMatriculasPage")
const AprobacionSolicitudPage = lazyNamed(() => import("@/pages/matriculas/AprobacionSolicitudPage"), "AprobacionSolicitudPage")
const AprobacionTallerPage = lazyNamed(() => import("@/pages/matriculas/AprobacionTallerPage"), "AprobacionTallerPage")
const InscribirEstudiantePage = lazyNamed(() => import("@/pages/matriculas/InscribirEstudiantePage"), "InscribirEstudiantePage")
const SolicitudesInscripcionPage = lazyNamed(() => import("@/pages/solicitudes-inscripcion/SolicitudesInscripcionPage"), "SolicitudesInscripcionPage")
const SolicitudInscripcionDetallePage = lazyNamed(() => import("@/pages/solicitudes-inscripcion/SolicitudInscripcionDetallePage"), "SolicitudInscripcionDetallePage")
const AulasPage = lazyNamed(() => import("@/pages/servicios/aulas/AulasPage"), "AulasPage")
const AulasGestionPage = lazyNamed(() => import("@/pages/servicios/aulas/AulasGestionPage"), "AulasGestionPage")
const HistorialAulasPage = lazyNamed(() => import("@/pages/servicios/aulas/HistorialAulasPage"), "HistorialAulasPage")
const EquiposPage = lazyNamed(() => import("@/pages/servicios/equipos/EquiposPage"), "EquiposPage")
const NuevoEquipoPage = lazyNamed(() => import("@/pages/servicios/equipos/NuevoEquipoPage"), "NuevoEquipoPage")
const AlquileresListPage = lazyNamed(() => import("@/pages/servicios/equipos/AlquileresListPage"), "AlquileresListPage")
const NuevoAlquilerPage = lazyNamed(() => import("@/pages/servicios/equipos/NuevoAlquilerPage"), "NuevoAlquilerPage")
const HistorialEquipoPage = lazyNamed(() => import("@/pages/servicios/equipos/HistorialEquipoPage"), "HistorialEquipoPage")
const AlquilerDetallePage = lazyNamed(() => import("@/pages/servicios/equipos/AlquilerDetallePage"), "AlquilerDetallePage")
const PodcastPage = lazyNamed(() => import("@/pages/servicios/podcast/PodcastPage"), "PodcastPage")
const PaquetesPage = lazyNamed(() => import("@/pages/servicios/podcast/PaquetesPage"), "PaquetesPage")
const NuevaReservaPage = lazyNamed(() => import("@/pages/servicios/podcast/NuevaReservaPage"), "NuevaReservaPage")
const HistorialPodcastPage = lazyNamed(() => import("@/pages/servicios/podcast/HistorialPodcastPage"), "HistorialPodcastPage")
const ReservaPodcastDetallePage = lazyNamed(() => import("@/pages/servicios/podcast/ReservaPodcastDetallePage"), "ReservaPodcastDetallePage")
const NuevaReservaAulaPage = lazyNamed(() => import("@/pages/servicios/aulas/NuevaReservaPage"), "NuevaReservaPage")
const EdicionVideoPage = lazyNamed(() => import("@/pages/servicios/edicion-video/EdicionVideoPage"), "EdicionVideoPage")
const EdicionVideoFormPage = lazyNamed(() => import("@/pages/servicios/edicion-video/EdicionVideoFormPage"), "EdicionVideoFormPage")
const EdicionVideoDetallePage = lazyNamed(() => import("@/pages/servicios/edicion-video/EdicionVideoDetallePage"), "EdicionVideoDetallePage")
const HistorialEdicionVideoPage = lazyNamed(() => import("@/pages/servicios/edicion-video/HistorialEdicionVideoPage"), "HistorialEdicionVideoPage")
const RadioPage = lazyNamed(() => import("@/pages/servicios/radio/RadioPage"), "RadioPage")
const RadioHistorialPage = lazyNamed(() => import("@/pages/servicios/radio/RadioHistorialPage"), "RadioHistorialPage")
const ReservaRadioDetallePage = lazyNamed(() => import("@/pages/servicios/radio/ReservaRadioDetallePage"), "ReservaRadioDetallePage")
const ClientesPage = lazyNamed(() => import("@/pages/clientes/ClientesPage"), "ClientesPage")
const NuevoClientePage = lazyNamed(() => import("@/pages/clientes/NuevoClientePage"), "NuevoClientePage")
const ClienteDetallePage = lazyNamed(() => import("@/pages/clientes/detalle/ClienteDetallePage"), "ClienteDetallePage")
const ClientePagoPage = lazyNamed(() => import("@/pages/clientes/detalle/ClientePagoPage"), "ClientePagoPage")
const RadioTarifasPage = lazyNamed(() => import("@/pages/servicios/radio/TarifasPage"), "TarifasPage")
const InstructorDashboardPage = lazyNamed(() => import("@/pages/instructor-portal/InstructorDashboardPage"), "InstructorDashboardPage")
const InstructorCursosPage = lazyNamed(() => import("@/pages/instructor-portal/InstructorCursosPage"), "InstructorCursosPage")
const InstructorCursoDetailPage = lazyNamed(() => import("@/pages/instructor-portal/detalle/InstructorCursoDetailPage"), "InstructorCursoDetailPage")
const AsistenciaRegistroPage = lazyNamed(() => import("@/pages/instructor-portal/AsistenciaRegistroPage"), "AsistenciaRegistroPage")
const NotasRegistroPage = lazyNamed(() => import("@/pages/instructor-portal/NotasRegistroPage"), "NotasRegistroPage")
const ClasesModuloPage = lazyNamed(() => import("@/pages/instructor-portal/ClasesModuloPage"), "ClasesModuloPage")
const InstructorHorarioPage = lazyNamed(() => import("@/pages/instructor-portal/InstructorHorarioPage"), "InstructorHorarioPage")
const DetalleEstudiantePage = lazyNamed(() => import("@/pages/instructor-portal/detalle/DetalleEstudiantePage"), "DetalleEstudiantePage")
const InstructorTallerDetailPage = lazyNamed(() => import("@/pages/instructor-portal/InstructorTallerDetailPage"), "InstructorTallerDetailPage")
const FinancePagosPage = lazyNamed(() => import("@/pages/finanzas/pagos/FinancePagosPage"), "FinancePagosPage")
const CuentasCobrarLayout = lazyNamed(() => import("@/pages/finanzas/pagos/CuentasCobrarLayout"), "CuentasCobrarLayout")
const TalleresCuentasPage = lazyNamed(() => import("@/pages/finanzas/pagos/TalleresCuentasPage"), "TalleresCuentasPage")
const TallerCuentasDetallePage = lazyNamed(() => import("@/pages/finanzas/pagos/TallerCuentasDetallePage"), "TallerCuentasDetallePage")
const TallerParticipantePage = lazyNamed(() => import("@/pages/finanzas/pagos/TallerParticipantePage"), "TallerParticipantePage")
const CursosCuentasPage = lazyNamed(() => import("@/pages/finanzas/pagos/CursosCuentasPage"), "CursosCuentasPage")
const CursosPersonalizadosCuentasPage = lazyNamed(() => import("@/pages/finanzas/pagos/CursosCuentasPage"), "CursosPersonalizadosCuentasPage")
const CursoCuentasDetallePage = lazyNamed(() => import("@/pages/finanzas/pagos/CursoCuentasDetallePage"), "CursoCuentasDetallePage")
const CursoEstudiantePagoPage = lazyNamed(() => import("@/pages/finanzas/pagos/CursoEstudiantePagoPage"), "CursoEstudiantePagoPage")
const ServiciosCuentasPage = lazyNamed(() => import("@/pages/finanzas/pagos/ServiciosCuentasPage"), "ServiciosCuentasPage")
const ServicioCuentaDetallePage = lazyNamed(() => import("@/pages/finanzas/pagos/ServicioCuentaDetallePage"), "ServicioCuentaDetallePage")
const ServicioPagoPage = lazyNamed(() => import("@/pages/finanzas/pagos/ServicioPagoPage"), "ServicioPagoPage")
const HistorialPage = lazyNamed(() => import("@/pages/finanzas/pagos/HistorialPage"), "HistorialPage")
const PagoDetallePage = lazyNamed(() => import("@/pages/finanzas/pagos/PagoDetallePage"), "PagoDetallePage")
const IngresosPage = lazyNamed(() => import("@/pages/finanzas/ingresos/IngresosPage"), "IngresosPage")
const IngresoDetallePage = lazyNamed(() => import("@/pages/finanzas/ingresos/IngresoDetallePage"), "IngresoDetallePage")
const EgresosPage = lazyNamed(() => import("@/pages/finanzas/egresos/EgresosPage"), "EgresosPage")
const EgresoFormPage = lazyNamed(() => import("@/pages/finanzas/egresos/EgresoFormPage"), "EgresoFormPage")
const EgresoDetallePage = lazyNamed(() => import("@/pages/finanzas/egresos/EgresoDetallePage"), "EgresoDetallePage")
const EstadisticasPage = lazyNamed(() => import("@/pages/finanzas/estadisticas/EstadisticasPage"), "EstadisticasPage")
const CatalogoDetallePage = lazyNamed(() => import("@/pages/finanzas/estadisticas/CatalogoDetallePage"), "CatalogoDetallePage")
const EstudianteDetalleFinanzasPage = lazyNamed(() => import("@/pages/finanzas/estadisticas/EstudianteDetallePage"), "EstudianteDetallePage")
const EstudiantesPage = lazyNamed(() => import("@/pages/estudiantes/EstudiantesPage"), "EstudiantesPage")
const NuevoEstudiantePage = lazyNamed(() => import("@/pages/estudiantes/NuevoEstudiantePage"), "NuevoEstudiantePage")
const NuevoEstudianteInscripcionPage = lazyNamed(() => import("@/pages/estudiantes/NuevoEstudiantePage"), "NuevoEstudianteInscripcionPage")
const SecretariaDashboardPage = lazyNamed(() => import("@/pages/secretaria"), "SecretariaDashboardPage")
const EstudiantePerfilAcademicoPage = lazyNamed(() => import("@/pages/estudiantes/perfil-academico/EstudiantePerfilAcademicoPage"), "EstudiantePerfilAcademicoPage")
const RegistrarPagoPage = lazyNamed(() => import("@/pages/estudiantes/perfil-academico/RegistrarPagoPage"), "RegistrarPagoPage")
const EstudiantesCursoDetallePage = lazyNamed(() => import("@/pages/estudiantes/detalle/EstudiantesCursoDetallePage"), "EstudiantesCursoDetallePage")
const EstudiantesTallerDetallePage = lazyNamed(() => import("@/pages/estudiantes/detalle/EstudiantesTallerDetallePage"), "EstudiantesTallerDetallePage")
const EstudiantesCiudadDetallePage = lazyNamed(() => import("@/pages/estudiantes/detalle/EstudiantesCiudadDetallePage"), "EstudiantesCiudadDetallePage")
const TalleresPage = lazyNamed(() => import("@/pages/admin/talleres"), "TalleresPage")
const TallerFormPage = lazyNamed(() => import("@/pages/admin/talleres"), "TallerFormPage")
const TallerDetallePage = lazyNamed(() => import("@/pages/admin/talleres"), "TallerDetallePage")
const InstructorTalleresPage = lazyNamed(() => import("@/pages/admin/talleres"), "InstructorTalleresPage")
const AsistenciaTallerPage = lazyNamed(() => import("@/pages/admin/talleres"), "AsistenciaTallerPage")
const ParticipantesTallerPage = lazyNamed(() => import("@/pages/admin/talleres"), "ParticipantesTallerPage")
const CertificadosPage = lazyNamed(() => import("@/pages/certificados/CertificadosPage"), "CertificadosPage")
const CargaMasivaCertificadosPage = lazyNamed(() => import("@/pages/certificados/CargaMasivaCertificadosPage"), "CargaMasivaCertificadosPage")
const VerificarCertificadosPage = lazyNamed(() => import("@/pages/certificados/VerificarCertificadosPage"), "VerificarCertificadosPage")
const EstudianteStatsPage = lazyNamed(() => import("@/pages/estudiantes/EstudianteStatsPage"), "EstudianteStatsPage")
const EstudianteSegmentsPage = lazyNamed(() => import("@/pages/estudiantes/EstudianteSegmentsPage"), "EstudianteSegmentsPage")
const ImportarEstudiantesPage = lazyNamed(() => import("@/pages/estudiantes/ImportarEstudiantesPage"), "ImportarEstudiantesPage")
const AgendaPage = lazyNamed(() => import("@/pages/agenda/AgendaPage"), "AgendaPage")
import { Sidebar, TopBar } from "@/components/layout/Navigation"
import { cursosService } from "@/services/cursos.service"
import { Toaster } from "sonner"

import { ScrollToTop } from "@/components/ScrollToTop"

function DashboardRouter() {
  const { user } = useAuth()
  const roles: string[] = user?.roles || []
  if (roles.includes("Administrador")) return <HomePage />
  if (roles.includes("Instructor")) return <Navigate to="/instructor" replace />
  if (roles.includes("Secretaria")) return <Navigate to="/secretaria" replace />
  return <Navigate to="/login" replace />
}

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => cursosService.getNotificaciones(),
    staleTime: 0,
  })
  const pendientesCount = notificationsQuery.data?.pendientes ?? 0
  const [showNotifications, setShowNotifications] = useState(false)
  const bellRef = useRef<HTMLButtonElement>(null)

  return (
    <div className="flex h-[100dvh] overflow-x-hidden bg-gray-50">
      <div
        className={`fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity duration-300 ${
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileOpen(false)}
      />

      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar collapsed={false} onClose={() => setMobileOpen(false)} pendientesCount={pendientesCount} />
      </div>

      <div className="hidden lg:block shrink-0">
        <Sidebar collapsed={collapsed} onToggleClick={() => setCollapsed(!collapsed)} pendientesCount={pendientesCount} />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-x-hidden">
        <TopBar
          onMenuClick={() => setMobileOpen(true)}
          pendientesCount={pendientesCount}
          showNotifications={showNotifications}
          onNotificationToggle={() => setShowNotifications(prev => !prev)}
          bellRef={bellRef}
        />
        <main className="flex-1 overflow-y-auto">
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<DashboardRouter />} />

            {/* Admin-only routes */}
            <Route path="/cursos" element={<RoleGuard roles={["Administrador", "Secretaria"]}><CursosPage /></RoleGuard>} />
            <Route path="/cursos/nuevo" element={<RoleGuard roles={["Administrador"]}><CursoFormPage /></RoleGuard>} />
            <Route path="/cursos/:id/editar" element={<RoleGuard roles={["Administrador"]}><CursoFormPage /></RoleGuard>} />
            <Route path="/cursos/:id" element={<RoleGuard roles={["Administrador", "Secretaria"]}><CursoDetailPage /></RoleGuard>} />
            <Route path="/cursos-personalizados" element={<RoleGuard roles={["Administrador", "Secretaria"]}><CursosPersonalizadosPage /></RoleGuard>} />
            <Route path="/cursos-personalizados/nuevo" element={<RoleGuard roles={["Administrador"]}><CursoPersonalizadoFormPage /></RoleGuard>} />
            <Route path="/cursos-personalizados/:id/editar" element={<RoleGuard roles={["Administrador", "Secretaria"]}><CursoPersonalizadoFormPage /></RoleGuard>} />
            <Route path="/cursos-personalizados/:id" element={<RoleGuard roles={["Administrador", "Secretaria"]}><CursoPersonalizadoDetailPage /></RoleGuard>} />
            <Route path="/catalogos" element={<RoleGuard roles={["Administrador"]}><CatalogosConCursosPage /></RoleGuard>} />
            <Route path="/catalogos/nuevo" element={<RoleGuard roles={["Administrador"]}><CatalogoFormPage /></RoleGuard>} />
            <Route path="/catalogos/:id/editar" element={<RoleGuard roles={["Administrador"]}><CatalogoFormPage /></RoleGuard>} />
            <Route path="/ciudades" element={<RoleGuard roles={["Administrador"]}><CiudadesPage /></RoleGuard>} />
            <Route path="/personas" element={<RoleGuard roles={["Administrador"]}><PersonasPage /></RoleGuard>} />
            <Route path="/personas/:id/pagos" element={<RoleGuard roles={["Administrador"]}><PagosPersonaPage /></RoleGuard>} />
            <Route path="/clientes" element={<RoleGuard roles={["Administrador", "Secretaria"]}><ClientesPage /></RoleGuard>} />
            <Route path="/clientes/nuevo" element={<RoleGuard roles={["Administrador", "Secretaria"]}><NuevoClientePage /></RoleGuard>} />
            <Route path="/clientes/:clienteId/pagar/:cuentaId" element={<RoleGuard roles={["Administrador", "Secretaria"]}><ClientePagoPage /></RoleGuard>} />
            <Route path="/clientes/:id" element={<RoleGuard roles={["Administrador", "Secretaria"]}><ClienteDetallePage /></RoleGuard>} />
            <Route path="/clientes/:id/editar" element={<RoleGuard roles={["Administrador", "Secretaria"]}><NuevoClientePage /></RoleGuard>} />
            <Route path="/estudiantes" element={<RoleGuard roles={["Administrador", "Secretaria"]}><EstudiantesPage /></RoleGuard>} />
            <Route path="/estudiantes/nuevo" element={<RoleGuard roles={["Administrador", "Secretaria"]}><NuevoEstudiantePage /></RoleGuard>} />
            <Route path="/estudiantes/nuevo/inscribir" element={<RoleGuard roles={["Administrador", "Secretaria"]}><NuevoEstudianteInscripcionPage /></RoleGuard>} />
            <Route path="/estudiantes/importar" element={<RoleGuard roles={["Administrador", "Secretaria"]}><ImportarEstudiantesPage /></RoleGuard>} />
            <Route path="/estudiantes/cursos/:cursoId" element={<RoleGuard roles={["Administrador", "Secretaria"]}><EstudiantesCursoDetallePage /></RoleGuard>} />
            <Route path="/estudiantes/talleres/:tallerId" element={<RoleGuard roles={["Administrador", "Secretaria"]}><EstudiantesTallerDetallePage /></RoleGuard>} />
            <Route path="/estudiantes/ciudades/:ciudadId" element={<RoleGuard roles={["Administrador", "Secretaria"]}><EstudiantesCiudadDetallePage /></RoleGuard>} />
            <Route path="/estudiantes/estadisticas" element={<RoleGuard roles={["Administrador", "Secretaria"]}><EstudianteStatsPage /></RoleGuard>} />
            <Route path="/estudiantes/segmentos" element={<RoleGuard roles={["Administrador", "Secretaria"]}><EstudianteSegmentsPage /></RoleGuard>} />
            <Route path="/estudiantes/:id/inscribir" element={<RoleGuard roles={["Administrador", "Secretaria"]}><InscribirEstudiantePage /></RoleGuard>} />
            <Route path="/estudiantes/:id/academico" element={<RoleGuard roles={["Administrador", "Secretaria"]}><EstudiantePerfilAcademicoPage /></RoleGuard>} />
            <Route path="/estudiantes/:id/academico/registrar-pago/:matriculaId" element={<RoleGuard roles={["Administrador", "Secretaria"]}><RegistrarPagoPage /></RoleGuard>} />
            <Route path="/tareas" element={<RoleGuard roles={["Administrador", "Secretaria"]}><TareasPage /></RoleGuard>} />
            <Route path="/cuentas" element={<RoleGuard roles={["Administrador"]}><CuentasPage /></RoleGuard>} />
            <Route path="/matriculas" element={<RoleGuard roles={["Administrador", "Secretaria"]}><AprobacionMatriculasPage /></RoleGuard>} />
            <Route path="/matriculas/aprobacion/solicitud/:id" element={<RoleGuard roles={["Administrador", "Secretaria"]}><AprobacionSolicitudPage /></RoleGuard>} />
            <Route path="/matriculas/aprobacion/taller/:id" element={<RoleGuard roles={["Administrador", "Secretaria"]}><AprobacionTallerPage /></RoleGuard>} />
            <Route path="/solicitudes-inscripcion" element={<RoleGuard roles={["Administrador", "Secretaria"]}><SolicitudesInscripcionPage /></RoleGuard>} />
            <Route path="/solicitudes-inscripcion/:id" element={<RoleGuard roles={["Administrador", "Secretaria"]}><SolicitudInscripcionDetallePage /></RoleGuard>} />
            <Route path="/servicios/aulas" element={<RoleGuard roles={["Administrador", "Secretaria"]}><HistorialAulasPage /></RoleGuard>} />
            <Route path="/servicios/aulas/historial" element={<RoleGuard roles={["Administrador", "Secretaria"]}><HistorialAulasPage /></RoleGuard>} />
            <Route path="/servicios/aulas/agenda" element={<RoleGuard roles={["Administrador", "Secretaria"]}><AulasPage /></RoleGuard>} />
            <Route path="/servicios/aulas/gestion" element={<RoleGuard roles={["Administrador", "Secretaria"]}><AulasGestionPage /></RoleGuard>} />
            <Route path="/servicios/aulas/nueva-reserva" element={<RoleGuard roles={["Administrador", "Secretaria"]}><NuevaReservaAulaPage /></RoleGuard>} />
            <Route path="/servicios/aulas/nueva-reserva/:aulaId" element={<RoleGuard roles={["Administrador", "Secretaria"]}><NuevaReservaAulaPage /></RoleGuard>} />
            <Route path="/servicios/aulas/reservas/:id/editar" element={<RoleGuard roles={["Administrador", "Secretaria"]}><NuevaReservaAulaPage /></RoleGuard>} />
            <Route path="/servicios/equipos" element={<RoleGuard roles={["Administrador", "Secretaria"]}><EquiposPage /></RoleGuard>} />
            <Route path="/servicios/equipos/nuevo" element={<RoleGuard roles={["Administrador", "Secretaria"]}><NuevoEquipoPage /></RoleGuard>} />
            <Route path="/servicios/equipos/:id/editar" element={<RoleGuard roles={["Administrador", "Secretaria"]}><NuevoEquipoPage /></RoleGuard>} />
            <Route path="/servicios/equipos/nuevo-alquiler/:equipoId" element={<RoleGuard roles={["Administrador", "Secretaria"]}><NuevoAlquilerPage /></RoleGuard>} />
            <Route path="/servicios/equipos/alquileres" element={<RoleGuard roles={["Administrador", "Secretaria"]}><AlquileresListPage /></RoleGuard>} />
            <Route path="/servicios/equipos/alquileres/:id" element={<RoleGuard roles={["Administrador", "Secretaria"]}><AlquilerDetallePage /></RoleGuard>} />
            <Route path="/servicios/equipos/alquileres/:id/editar" element={<RoleGuard roles={["Administrador", "Secretaria"]}><NuevoAlquilerPage /></RoleGuard>} />
            <Route path="/servicios/equipos/:id/historial" element={<RoleGuard roles={["Administrador", "Secretaria"]}><HistorialEquipoPage /></RoleGuard>} />
            <Route path="/servicios/podcast" element={<RoleGuard roles={["Administrador", "Secretaria"]}><HistorialPodcastPage /></RoleGuard>} />
            <Route path="/servicios/podcast/historial" element={<RoleGuard roles={["Administrador", "Secretaria"]}><HistorialPodcastPage /></RoleGuard>} />
            <Route path="/servicios/podcast/agenda" element={<RoleGuard roles={["Administrador", "Secretaria"]}><PodcastPage /></RoleGuard>} />
            <Route path="/servicios/podcast/nueva" element={<RoleGuard roles={["Administrador", "Secretaria"]}><NuevaReservaPage /></RoleGuard>} />
            <Route path="/servicios/podcast/paquetes" element={<RoleGuard roles={["Administrador", "Secretaria"]}><PaquetesPage /></RoleGuard>} />
            <Route path="/servicios/podcast/reservas/:id" element={<RoleGuard roles={["Administrador", "Secretaria"]}><ReservaPodcastDetallePage /></RoleGuard>} />
            <Route path="/servicios/edicion-video" element={<RoleGuard roles={["Administrador", "Secretaria"]}><HistorialEdicionVideoPage /></RoleGuard>} />
            <Route path="/servicios/edicion-video/historial" element={<RoleGuard roles={["Administrador", "Secretaria"]}><HistorialEdicionVideoPage /></RoleGuard>} />
            <Route path="/servicios/edicion-video/agenda" element={<RoleGuard roles={["Administrador", "Secretaria"]}><EdicionVideoPage /></RoleGuard>} />
            <Route path="/servicios/edicion-video/nuevo" element={<RoleGuard roles={["Administrador", "Secretaria"]}><EdicionVideoFormPage /></RoleGuard>} />
            <Route path="/servicios/edicion-video/:id" element={<RoleGuard roles={["Administrador", "Secretaria"]}><EdicionVideoDetallePage /></RoleGuard>} />
            <Route path="/servicios/edicion-video/:id/editar" element={<RoleGuard roles={["Administrador", "Secretaria"]}><EdicionVideoFormPage /></RoleGuard>} />
            <Route path="/servicios/radio" element={<RoleGuard roles={["Administrador", "Secretaria"]}><RadioHistorialPage /></RoleGuard>} />
            <Route path="/servicios/radio/historial" element={<RoleGuard roles={["Administrador", "Secretaria"]}><RadioHistorialPage /></RoleGuard>} />
            <Route path="/servicios/radio/agenda" element={<RoleGuard roles={["Administrador", "Secretaria"]}><RadioPage /></RoleGuard>} />
            <Route path="/servicios/radio/tarifas" element={<RoleGuard roles={["Administrador", "Secretaria"]}><RadioTarifasPage /></RoleGuard>} />
            <Route path="/servicios/radio/reservas/:id" element={<RoleGuard roles={["Administrador", "Secretaria"]}><ReservaRadioDetallePage /></RoleGuard>} />
            <Route path="/finanzas/pagos" element={<RoleGuard roles={["Administrador", "Secretaria"]}><FinancePagosPage /></RoleGuard>}>
              <Route index element={<Navigate to="cuentas/cursos" replace />} />
              <Route path="resumen" element={<Navigate to="/finanzas/pagos" replace />} />
              <Route path="historial" element={<Navigate to="/finanzas/movimientos" replace />} />
              <Route path="historial/:id" element={<RoleGuard roles={["Administrador", "Secretaria"]}><LegacyPagoDetalleRedirect /></RoleGuard>} />
              <Route path="cuentas" element={<RoleGuard roles={["Administrador", "Secretaria"]}><CuentasCobrarLayout /></RoleGuard>}>
                <Route index element={<Navigate to="cursos" replace />} />
                <Route path="talleres" element={<RoleGuard roles={["Administrador", "Secretaria"]}><TalleresCuentasPage /></RoleGuard>} />
                <Route path="talleres/:id" element={<RoleGuard roles={["Administrador", "Secretaria"]}><TallerCuentasDetallePage /></RoleGuard>} />
                <Route path="talleres/:id/participante/:pid" element={<RoleGuard roles={["Administrador", "Secretaria"]}><TallerParticipantePage /></RoleGuard>} />
                <Route path="cursos" element={<RoleGuard roles={["Administrador", "Secretaria"]}><CursosCuentasPage /></RoleGuard>} />
                <Route path="cursos-personalizados" element={<RoleGuard roles={["Administrador", "Secretaria"]}><CursosPersonalizadosCuentasPage /></RoleGuard>} />
                <Route path="cursos/:id" element={<RoleGuard roles={["Administrador", "Secretaria"]}><CursoCuentasDetallePage /></RoleGuard>} />
                <Route path="cursos-personalizados/:id" element={<RoleGuard roles={["Administrador", "Secretaria"]}><CursoCuentasDetallePage /></RoleGuard>} />
                <Route path="servicios" element={<RoleGuard roles={["Administrador", "Secretaria"]}><ServiciosCuentasPage /></RoleGuard>} />
                <Route path="servicios/:name" element={<RoleGuard roles={["Administrador", "Secretaria"]}><ServicioCuentaDetallePage /></RoleGuard>} />
                <Route path="servicios/pago/:cuentaId" element={<RoleGuard roles={["Administrador"]}><ServicioPagoPage /></RoleGuard>} />
              </Route>
            </Route>
            <Route path="/finanzas/movimientos" element={<RoleGuard roles={["Administrador", "Secretaria"]}><HistorialPage /></RoleGuard>} />
            <Route path="/finanzas/movimientos/:id" element={<RoleGuard roles={["Administrador", "Secretaria"]}><PagoDetallePage /></RoleGuard>} />
            <Route path="/finanzas/pagos/cursos/:cursoId/estudiante/:matriculaId/pago" element={<RoleGuard roles={["Administrador"]}><CursoEstudiantePagoPage /></RoleGuard>} />
            <Route path="/finanzas/ingresos" element={<RoleGuard roles={["Administrador"]}><IngresosPage /></RoleGuard>} />
            <Route path="/finanzas/ingresos/:id" element={<RoleGuard roles={["Administrador"]}><IngresoDetallePage /></RoleGuard>} />
            <Route path="/finanzas/egresos" element={<RoleGuard roles={["Administrador"]}><EgresosPage /></RoleGuard>} />
            <Route path="/finanzas/egresos/nuevo" element={<RoleGuard roles={["Administrador"]}><EgresoFormPage /></RoleGuard>} />
            <Route path="/finanzas/egresos/:id/editar" element={<RoleGuard roles={["Administrador"]}><EgresoFormPage /></RoleGuard>} />
            <Route path="/finanzas/egresos/:id" element={<RoleGuard roles={["Administrador"]}><EgresoDetallePage /></RoleGuard>} />
            <Route path="/finanzas/estadisticas" element={<RoleGuard roles={["Administrador"]}><EstadisticasPage /></RoleGuard>} />
            <Route path="/finanzas/estadisticas/catalogo/:id" element={<RoleGuard roles={["Administrador"]}><CatalogoDetallePage /></RoleGuard>} />
            <Route path="/finanzas/estadisticas/estudiante/:id" element={<RoleGuard roles={["Administrador"]}><EstudianteDetalleFinanzasPage /></RoleGuard>} />
            <Route path="/certificados" element={<RoleGuard roles={["Administrador", "Secretaria"]}><CertificadosPage /></RoleGuard>} />
            <Route path="/certificados/carga-masiva" element={<RoleGuard roles={["Administrador", "Secretaria"]}><CargaMasivaCertificadosPage /></RoleGuard>} />

            {/* Agenda */}
            <Route path="/agenda" element={<RoleGuard roles={["Administrador", "Secretaria"]}><AgendaPage /></RoleGuard>} />

            {/* Talleres admin */}
            <Route path="/talleres" element={<RoleGuard roles={["Administrador", "Secretaria"]}><TalleresPage /></RoleGuard>} />
            <Route path="/talleres/nuevo" element={<RoleGuard roles={["Administrador"]}><TallerFormPage /></RoleGuard>} />
            <Route path="/talleres/:id" element={<RoleGuard roles={["Administrador", "Secretaria"]}><TallerDetallePage /></RoleGuard>} />
            <Route path="/talleres/:id/editar" element={<RoleGuard roles={["Administrador"]}><TallerFormPage /></RoleGuard>} />

            {/* Secretaria routes */}
            <Route path="/secretaria" element={<RoleGuard roles={["Secretaria", "Administrador"]}><SecretariaDashboardPage /></RoleGuard>} />

            {/* Instructor portal (Admin + Instructor) */}
            <Route path="/instructor" element={<RoleGuard roles={["Administrador", "Instructor"]}><InstructorDashboardPage /></RoleGuard>} />
            <Route path="/instructor/cursos" element={<RoleGuard roles={["Administrador", "Instructor"]}><InstructorCursosPage /></RoleGuard>} />
            <Route path="/instructor/cursos/:id" element={<RoleGuard roles={["Administrador", "Instructor"]}><InstructorCursoDetailPage /></RoleGuard>} />
            <Route path="/instructor/clases/:cursoId/:moduloId" element={<RoleGuard roles={["Administrador", "Instructor"]}><ClasesModuloPage /></RoleGuard>} />
            <Route path="/instructor/asistencia/:cursoId/:claseId" element={<RoleGuard roles={["Administrador", "Instructor"]}><AsistenciaRegistroPage /></RoleGuard>} />
            <Route path="/instructor/notas/:cursoId/:moduloId" element={<RoleGuard roles={["Administrador", "Secretaria", "Instructor"]}><NotasRegistroPage /></RoleGuard>} />
            <Route path="/instructor/estudiantes/:id" element={<RoleGuard roles={["Administrador", "Instructor"]}><DetalleEstudiantePage /></RoleGuard>} />
            <Route path="/instructor/horario" element={<RoleGuard roles={["Administrador", "Instructor"]}><InstructorHorarioPage /></RoleGuard>} />

            {/* Instructor talleres */}
            <Route path="/instructor/talleres" element={<RoleGuard roles={["Administrador", "Instructor"]}><InstructorTalleresPage /></RoleGuard>} />
            <Route path="/instructor/talleres/:id" element={<RoleGuard roles={["Administrador", "Instructor"]}><InstructorTallerDetailPage /></RoleGuard>} />
            <Route path="/instructor/talleres/:id/asistencia" element={<RoleGuard roles={["Administrador", "Secretaria", "Instructor"]}><AsistenciaTallerPage /></RoleGuard>} />
            <Route path="/instructor/talleres/:id/participantes" element={<RoleGuard roles={["Administrador", "Instructor"]}><ParticipantesTallerPage /></RoleGuard>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const token = localStorage.getItem("auth_token")

  if (!user && !token) {
    return <LoginPage />
  }
  return <>{children}</>
}

function RoleGuard({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const { user } = useAuth()
  const userRoles: string[] = user?.roles || []

  const hasRole = roles.some((r) => userRoles.includes(r))
  if (!hasRole) {
    toast.error("Acceso denegado", {
      description: "No tienes permisos para acceder a esta sección.",
    })
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" richColors closeButton />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/matricula/nueva" element={<NuevaMatriculaPublicaPage />} />
            <Route path="/verificar-certificados" element={<VerificarCertificadosPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
