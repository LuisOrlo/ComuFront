import { BrowserRouter, Routes, Route, Navigate } from "react-router"
import { useState, useRef, useEffect, useCallback } from "react"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import { LoginPage } from "@/pages/login/LoginPage"
import { HomePage } from "@/pages/home/HomePage"
import { CursosPage } from "@/pages/cursos/CursosPage"
import { CursoFormPage } from "@/pages/cursos/CursoFormPage"
import { CursoDetailPage } from "@/pages/cursos/detalle/CursoDetailPage"
import { CatalogosConCursosPage } from "@/pages/catalogos/CatalogosConCursosPage"
import { CiudadesPage } from "@/pages/admin/ciudades/CiudadesPage"
import { PersonasPage } from "@/pages/personas/PersonasPage"

import { TareasPage } from "@/pages/tareas/TareasPage"
import { CuentasPage } from "@/pages/cuentas/CuentasPage"

import { NuevaMatriculaPublicaPage } from "@/pages/matriculas/NuevaMatriculaPublicaPage"
import { AprobacionMatriculasPage } from "@/pages/matriculas/AprobacionMatriculasPage"
import { InscribirEstudiantePage } from "@/pages/matriculas/InscribirEstudiantePage"
import { SolicitudesInscripcionPage } from "@/pages/solicitudes-inscripcion/SolicitudesInscripcionPage"
import { SolicitudInscripcionDetallePage } from "@/pages/solicitudes-inscripcion/SolicitudInscripcionDetallePage"
import { AulasPage } from "@/pages/servicios/aulas/AulasPage"
import { AulasGestionPage } from "@/pages/servicios/aulas/AulasGestionPage"
import { EquiposPage } from "@/pages/servicios/equipos/EquiposPage"
import { AlquileresListPage } from "@/pages/servicios/equipos/AlquileresListPage"
import { PodcastPage } from "@/pages/servicios/podcast/PodcastPage"
import { PaquetesPage } from "@/pages/servicios/podcast/PaquetesPage"

import { EdicionVideoPage } from "@/pages/servicios/edicion-video/EdicionVideoPage"
import { RadioPage } from "@/pages/servicios/radio/RadioPage"
import { RadioHistorialPage } from "@/pages/servicios/radio/RadioHistorialPage"
import { TarifasPage as RadioTarifasPage } from "@/pages/servicios/radio/TarifasPage"
import { InstructorDashboardPage } from "@/pages/instructor-portal/InstructorDashboardPage"
import { InstructorCursosPage } from "@/pages/instructor-portal/InstructorCursosPage"
import { InstructorCursoDetailPage } from "@/pages/instructor-portal/detalle/InstructorCursoDetailPage"
import { AsistenciaRegistroPage } from "@/pages/instructor-portal/AsistenciaRegistroPage"
import { NotasRegistroPage } from "@/pages/instructor-portal/NotasRegistroPage"
import { ClasesModuloPage } from "@/pages/instructor-portal/ClasesModuloPage"
import { InstructorHorarioPage } from "@/pages/instructor-portal/InstructorHorarioPage"
import { MisEstudiantesPage } from "@/pages/instructor-portal/MisEstudiantesPage"
import { DetalleEstudiantePage } from "@/pages/instructor-portal/detalle/DetalleEstudiantePage"
import { InstructorTallerDetailPage } from "@/pages/instructor-portal/InstructorTallerDetailPage"
import { FinancePagosPage, FinanceResumenWrapper } from "@/pages/finanzas/pagos/FinancePagosPage"
import { CuentasCobrarLayout } from "@/pages/finanzas/pagos/CuentasCobrarLayout"
import { TalleresCuentasPage } from "@/pages/finanzas/pagos/TalleresCuentasPage"
import { TallerCuentasDetallePage } from "@/pages/finanzas/pagos/TallerCuentasDetallePage"
import { TallerParticipantePage } from "@/pages/finanzas/pagos/TallerParticipantePage"
import { CursosCuentasPage } from "@/pages/finanzas/pagos/CursosCuentasPage"
import { CursoCuentasDetallePage } from "@/pages/finanzas/pagos/CursoCuentasDetallePage"
import { CursoEstudiantePagoPage } from "@/pages/finanzas/pagos/CursoEstudiantePagoPage"
import { ServiciosCuentasPage } from "@/pages/finanzas/pagos/ServiciosCuentasPage"
import { ServicioDetallePage } from "@/pages/finanzas/pagos/ServicioDetallePage"
import { ServicioPagoPage } from "@/pages/finanzas/pagos/ServicioPagoPage"
import { HistorialPage } from "@/pages/finanzas/pagos/HistorialPage"
import { PagoDetallePage } from "@/pages/finanzas/pagos/PagoDetallePage"
import { IngresosPage } from "@/pages/finanzas/ingresos/IngresosPage"
import { IngresoDetallePage } from "@/pages/finanzas/ingresos/IngresoDetallePage"
import { EgresosPage } from "@/pages/finanzas/egresos/EgresosPage"
import { EgresoFormPage } from "@/pages/finanzas/egresos/EgresoFormPage"
import { EgresoDetallePage } from "@/pages/finanzas/egresos/EgresoDetallePage"
import { EstadisticasPage } from "@/pages/finanzas/estadisticas/EstadisticasPage"
import { CatalogoDetallePage } from "@/pages/finanzas/estadisticas/CatalogoDetallePage"
import { EstudianteDetallePage } from "@/pages/finanzas/estadisticas/EstudianteDetallePage"
import { EstudiantesPage } from "@/pages/estudiantes/EstudiantesPage"
import { NuevoEstudiantePage } from "@/pages/estudiantes/NuevoEstudiantePage"
import {
  SecretariaDashboardPage,
  SecretariaSolicitudesPage,
} from "@/pages/secretaria"
import { EstudiantePerfilAcademicoPage } from "@/pages/estudiantes/perfil-academico/EstudiantePerfilAcademicoPage"
import { EstudiantesCursoDetallePage } from "@/pages/estudiantes/detalle/EstudiantesCursoDetallePage"
import { EstudiantesTallerDetallePage } from "@/pages/estudiantes/detalle/EstudiantesTallerDetallePage"
import { EstudiantesCiudadDetallePage } from "@/pages/estudiantes/detalle/EstudiantesCiudadDetallePage"
import {
  TalleresPage,
  TallerFormPage,
  TallerDetallePage,
  InstructorTalleresPage,
  AsistenciaTallerPage,
  ParticipantesTallerPage,
} from "@/pages/admin/talleres"
import { CertificadosPage } from "@/pages/certificados/CertificadosPage"
import { CargaMasivaCertificadosPage } from "@/pages/certificados/CargaMasivaCertificadosPage"
import { VerificarCertificadosPage } from "@/pages/certificados/VerificarCertificadosPage"
import { EstudianteStatsPage } from "@/pages/estudiantes/EstudianteStatsPage"
import { EstudianteSegmentsPage } from "@/pages/estudiantes/EstudianteSegmentsPage"
import { AgendaPage } from "@/pages/agenda/AgendaPage"
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
  const [pendientesCount, setPendientesCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const bellRef = useRef<HTMLButtonElement>(null)

  const fetchPendientes = useCallback(async () => {
    try {
      const res = await cursosService.getNotificaciones()
      setPendientesCount(res.pendientes)
    } catch {
      // silent fail
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPendientes()
    const interval = setInterval(fetchPendientes, 15000)
    return () => clearInterval(interval)
  }, [fetchPendientes])

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gray-50">
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
        <Sidebar collapsed={collapsed} pendientesCount={pendientesCount} />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar
          onMenuClick={() => setMobileOpen(true)}
          onToggleClick={() => setCollapsed(!collapsed)}
          collapsed={collapsed}
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
            <Route path="/catalogos" element={<RoleGuard roles={["Administrador"]}><CatalogosConCursosPage /></RoleGuard>} />
            <Route path="/ciudades" element={<RoleGuard roles={["Administrador"]}><CiudadesPage /></RoleGuard>} />
            <Route path="/personas" element={<RoleGuard roles={["Administrador"]}><PersonasPage /></RoleGuard>} />
            <Route path="/estudiantes" element={<RoleGuard roles={["Administrador", "Secretaria"]}><EstudiantesPage /></RoleGuard>} />
            <Route path="/estudiantes/nuevo" element={<RoleGuard roles={["Administrador", "Secretaria"]}><NuevoEstudiantePage /></RoleGuard>} />
            <Route path="/estudiantes/cursos/:cursoId" element={<RoleGuard roles={["Administrador", "Secretaria"]}><EstudiantesCursoDetallePage /></RoleGuard>} />
            <Route path="/estudiantes/talleres/:tallerId" element={<RoleGuard roles={["Administrador", "Secretaria"]}><EstudiantesTallerDetallePage /></RoleGuard>} />
            <Route path="/estudiantes/ciudades/:ciudadId" element={<RoleGuard roles={["Administrador", "Secretaria"]}><EstudiantesCiudadDetallePage /></RoleGuard>} />
            <Route path="/estudiantes/estadisticas" element={<RoleGuard roles={["Administrador", "Secretaria"]}><EstudianteStatsPage /></RoleGuard>} />
            <Route path="/estudiantes/segmentos" element={<RoleGuard roles={["Administrador", "Secretaria"]}><EstudianteSegmentsPage /></RoleGuard>} />
            <Route path="/estudiantes/:id/inscribir" element={<RoleGuard roles={["Administrador", "Secretaria"]}><InscribirEstudiantePage /></RoleGuard>} />
            <Route path="/estudiantes/:id/academico" element={<RoleGuard roles={["Administrador", "Secretaria"]}><EstudiantePerfilAcademicoPage /></RoleGuard>} />
            <Route path="/tareas" element={<RoleGuard roles={["Administrador", "Secretaria"]}><TareasPage /></RoleGuard>} />
            <Route path="/cuentas" element={<RoleGuard roles={["Administrador"]}><CuentasPage /></RoleGuard>} />
            <Route path="/matriculas/*" element={<RoleGuard roles={["Administrador", "Secretaria"]}><AprobacionMatriculasPage /></RoleGuard>} />
            <Route path="/solicitudes-inscripcion" element={<RoleGuard roles={["Administrador", "Secretaria"]}><SolicitudesInscripcionPage /></RoleGuard>} />
            <Route path="/solicitudes-inscripcion/:id" element={<RoleGuard roles={["Administrador", "Secretaria"]}><SolicitudInscripcionDetallePage /></RoleGuard>} />
            <Route path="/servicios/aulas" element={<RoleGuard roles={["Administrador", "Secretaria"]}><AulasPage /></RoleGuard>} />
            <Route path="/servicios/aulas/gestion" element={<RoleGuard roles={["Administrador", "Secretaria"]}><AulasGestionPage /></RoleGuard>} />
            <Route path="/servicios/equipos" element={<RoleGuard roles={["Administrador", "Secretaria"]}><EquiposPage /></RoleGuard>} />
            <Route path="/servicios/equipos/alquileres" element={<RoleGuard roles={["Administrador", "Secretaria"]}><AlquileresListPage /></RoleGuard>} />
            <Route path="/servicios/podcast" element={<RoleGuard roles={["Administrador", "Secretaria"]}><PodcastPage /></RoleGuard>} />
            <Route path="/servicios/podcast/paquetes" element={<RoleGuard roles={["Administrador", "Secretaria"]}><PaquetesPage /></RoleGuard>} />
            <Route path="/servicios/edicion-video" element={<RoleGuard roles={["Administrador", "Secretaria"]}><EdicionVideoPage /></RoleGuard>} />
            <Route path="/servicios/radio" element={<RoleGuard roles={["Administrador", "Secretaria"]}><RadioPage /></RoleGuard>} />
            <Route path="/servicios/radio/historial" element={<RoleGuard roles={["Administrador", "Secretaria"]}><RadioHistorialPage /></RoleGuard>} />
            <Route path="/servicios/radio/tarifas" element={<RoleGuard roles={["Administrador", "Secretaria"]}><RadioTarifasPage /></RoleGuard>} />
            <Route path="/finanzas/pagos" element={<RoleGuard roles={["Administrador", "Secretaria"]}><FinancePagosPage /></RoleGuard>}>
              <Route index element={<Navigate to="resumen" replace />} />
              <Route path="resumen" element={<RoleGuard roles={["Administrador", "Secretaria"]}><FinanceResumenWrapper /></RoleGuard>} />
              <Route path="historial" element={<RoleGuard roles={["Administrador", "Secretaria"]}><HistorialPage /></RoleGuard>} />
              <Route path="historial/:id" element={<RoleGuard roles={["Administrador", "Secretaria"]}><PagoDetallePage /></RoleGuard>} />
              <Route path="cuentas" element={<RoleGuard roles={["Administrador", "Secretaria"]}><CuentasCobrarLayout /></RoleGuard>}>
                <Route index element={<Navigate to="cursos" replace />} />
                <Route path="talleres" element={<RoleGuard roles={["Administrador", "Secretaria"]}><TalleresCuentasPage /></RoleGuard>} />
                <Route path="talleres/:id" element={<RoleGuard roles={["Administrador", "Secretaria"]}><TallerCuentasDetallePage /></RoleGuard>} />
                <Route path="talleres/:id/participante/:pid" element={<RoleGuard roles={["Administrador", "Secretaria"]}><TallerParticipantePage /></RoleGuard>} />
                <Route path="cursos" element={<RoleGuard roles={["Administrador", "Secretaria"]}><CursosCuentasPage /></RoleGuard>} />
                <Route path="cursos/:id" element={<RoleGuard roles={["Administrador", "Secretaria"]}><CursoCuentasDetallePage /></RoleGuard>} />
                <Route path="servicios" element={<RoleGuard roles={["Administrador", "Secretaria"]}><ServiciosCuentasPage /></RoleGuard>} />
                <Route path="servicios/:name" element={<RoleGuard roles={["Administrador", "Secretaria"]}><ServicioDetallePage /></RoleGuard>} />
                <Route path="servicios/pago/:cuentaId" element={<RoleGuard roles={["Administrador"]}><ServicioPagoPage /></RoleGuard>} />
              </Route>
            </Route>
            <Route path="/finanzas/pagos/cursos/:cursoId/estudiante/:matriculaId/pago" element={<RoleGuard roles={["Administrador"]}><CursoEstudiantePagoPage /></RoleGuard>} />
            <Route path="/finanzas/ingresos" element={<RoleGuard roles={["Administrador"]}><IngresosPage /></RoleGuard>} />
            <Route path="/finanzas/ingresos/:id" element={<RoleGuard roles={["Administrador"]}><IngresoDetallePage /></RoleGuard>} />
            <Route path="/finanzas/egresos" element={<RoleGuard roles={["Administrador"]}><EgresosPage /></RoleGuard>} />
            <Route path="/finanzas/egresos/nuevo" element={<RoleGuard roles={["Administrador"]}><EgresoFormPage /></RoleGuard>} />
            <Route path="/finanzas/egresos/:id/editar" element={<RoleGuard roles={["Administrador"]}><EgresoFormPage /></RoleGuard>} />
            <Route path="/finanzas/egresos/:id" element={<RoleGuard roles={["Administrador"]}><EgresoDetallePage /></RoleGuard>} />
            <Route path="/finanzas/estadisticas" element={<RoleGuard roles={["Administrador"]}><EstadisticasPage /></RoleGuard>} />
            <Route path="/finanzas/estadisticas/catalogo/:id" element={<RoleGuard roles={["Administrador"]}><CatalogoDetallePage /></RoleGuard>} />
            <Route path="/finanzas/estadisticas/estudiante/:id" element={<RoleGuard roles={["Administrador"]}><EstudianteDetallePage /></RoleGuard>} />
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
            <Route path="/secretaria/solicitudes" element={<RoleGuard roles={["Secretaria", "Administrador"]}><SecretariaSolicitudesPage /></RoleGuard>} />

            {/* Instructor portal (Admin + Instructor) */}
            <Route path="/instructor" element={<RoleGuard roles={["Administrador", "Instructor"]}><InstructorDashboardPage /></RoleGuard>} />
            <Route path="/instructor/cursos" element={<RoleGuard roles={["Administrador", "Instructor"]}><InstructorCursosPage /></RoleGuard>} />
            <Route path="/instructor/cursos/:id" element={<RoleGuard roles={["Administrador", "Instructor"]}><InstructorCursoDetailPage /></RoleGuard>} />
            <Route path="/instructor/clases/:cursoId/:moduloId" element={<RoleGuard roles={["Administrador", "Instructor"]}><ClasesModuloPage /></RoleGuard>} />
            <Route path="/instructor/asistencia/:cursoId/:claseId" element={<RoleGuard roles={["Administrador", "Instructor"]}><AsistenciaRegistroPage /></RoleGuard>} />
            <Route path="/instructor/notas/:cursoId/:moduloId" element={<RoleGuard roles={["Administrador", "Instructor"]}><NotasRegistroPage /></RoleGuard>} />
            <Route path="/instructor/estudiantes" element={<RoleGuard roles={["Administrador", "Instructor"]}><MisEstudiantesPage /></RoleGuard>} />
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
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
