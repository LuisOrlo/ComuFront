import { BrowserRouter, Routes, Route, Navigate } from "react-router"
import { useState } from "react"
import { AuthProvider, useAuth } from "@/context/AuthContext"
import { toast } from "sonner"
import { LoginPage } from "@/pages/login/LoginPage"
import { HomePage } from "@/pages/home/HomePage"
import { CursosPage } from "@/pages/cursos/CursosPage"
import { CursoDetailPage } from "@/pages/cursos/detalle/CursoDetailPage"
import { CatalogosConCursosPage } from "@/pages/catalogos/CatalogosConCursosPage"
import { CiudadesPage } from "@/pages/admin/ciudades/CiudadesPage"
import { PersonasPage } from "@/pages/personas/PersonasPage"

import { AsistenciaStaffPage } from "@/pages/asistencia/AsistenciaStaffPage"
import { CuentasPage } from "@/pages/cuentas/CuentasPage"

import { NuevaMatriculaPublicaPage } from "@/pages/matriculas/NuevaMatriculaPublicaPage"
import { AprobacionMatriculasPage } from "@/pages/matriculas/AprobacionMatriculasPage"
import { SolicitudesInscripcionPage } from "@/pages/solicitudes-inscripcion/SolicitudesInscripcionPage"
import { SolicitudInscripcionDetallePage } from "@/pages/solicitudes-inscripcion/SolicitudInscripcionDetallePage"
import { AulasPage } from "@/pages/servicios/aulas/AulasPage"
import { EquiposPage } from "@/pages/servicios/equipos/EquiposPage"
import { AlquileresListPage } from "@/pages/servicios/equipos/AlquileresListPage"
import { PodcastPage } from "@/pages/servicios/podcast/PodcastPage"
import { EdicionVideoPage } from "@/pages/servicios/edicion-video/EdicionVideoPage"
import { InstructorCursosPage } from "@/pages/instructor-portal/InstructorCursosPage"
import { InstructorCursoDetailPage } from "@/pages/instructor-portal/detalle/InstructorCursoDetailPage"
import { AsistenciaRegistroPage } from "@/pages/instructor-portal/AsistenciaRegistroPage"
import { NotasRegistroPage } from "@/pages/instructor-portal/NotasRegistroPage"
import { ClasesModuloPage } from "@/pages/instructor-portal/ClasesModuloPage"
import { InstructorHorarioPage } from "@/pages/instructor-portal/InstructorHorarioPage"
import { MisEstudiantesPage } from "@/pages/instructor-portal/MisEstudiantesPage"
import { FinancePagosPage } from "@/pages/finanzas/pagos/FinancePagosPage"
import { EstudiantesPage } from "@/pages/estudiantes/EstudiantesPage"
import { EstudiantePerfilAcademicoPage } from "@/pages/estudiantes/perfil-academico/EstudiantePerfilAcademicoPage"
import { CertificadosPage } from "@/pages/certificados/CertificadosPage"
import { CargaMasivaCertificadosPage } from "@/pages/certificados/CargaMasivaCertificadosPage"
import { VerificarCertificadosPage } from "@/pages/certificados/VerificarCertificadosPage"
import { EstudianteStatsPage } from "@/pages/estudiantes/EstudianteStatsPage"
import { EstudianteSegmentsPage } from "@/pages/estudiantes/EstudianteSegmentsPage"
import { Sidebar, TopBar } from "@/components/layout/Navigation"
import { Toaster } from "sonner"

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

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
        <Sidebar collapsed={false} onClose={() => setMobileOpen(false)} />
      </div>

      <div className="hidden lg:block shrink-0">
        <Sidebar collapsed={collapsed} />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar
          onMenuClick={() => setMobileOpen(true)}
          onToggleClick={() => setCollapsed(!collapsed)}
          collapsed={collapsed}
        />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<HomePage />} />

            {/* Admin-only routes */}
            <Route path="/cursos" element={<RoleGuard roles={["Administrador"]}><CursosPage /></RoleGuard>} />
            <Route path="/cursos/:id" element={<RoleGuard roles={["Administrador"]}><CursoDetailPage /></RoleGuard>} />
            <Route path="/catalogos" element={<RoleGuard roles={["Administrador"]}><CatalogosConCursosPage /></RoleGuard>} />
            <Route path="/ciudades" element={<RoleGuard roles={["Administrador"]}><CiudadesPage /></RoleGuard>} />
            <Route path="/personas" element={<RoleGuard roles={["Administrador"]}><PersonasPage /></RoleGuard>} />
            <Route path="/estudiantes" element={<RoleGuard roles={["Administrador"]}><EstudiantesPage /></RoleGuard>} />
            <Route path="/estudiantes/estadisticas" element={<RoleGuard roles={["Administrador"]}><EstudianteStatsPage /></RoleGuard>} />
            <Route path="/estudiantes/segmentos" element={<RoleGuard roles={["Administrador"]}><EstudianteSegmentsPage /></RoleGuard>} />
            <Route path="/estudiantes/:id/academico" element={<RoleGuard roles={["Administrador"]}><EstudiantePerfilAcademicoPage /></RoleGuard>} />
            <Route path="/asistencia" element={<RoleGuard roles={["Administrador"]}><AsistenciaStaffPage /></RoleGuard>} />
            <Route path="/cuentas" element={<RoleGuard roles={["Administrador"]}><CuentasPage /></RoleGuard>} />
            <Route path="/matriculas" element={<RoleGuard roles={["Administrador"]}><AprobacionMatriculasPage /></RoleGuard>} />
            <Route path="/solicitudes-inscripcion" element={<RoleGuard roles={["Administrador"]}><SolicitudesInscripcionPage /></RoleGuard>} />
            <Route path="/solicitudes-inscripcion/:id" element={<RoleGuard roles={["Administrador"]}><SolicitudInscripcionDetallePage /></RoleGuard>} />
            <Route path="/servicios/aulas" element={<RoleGuard roles={["Administrador"]}><AulasPage /></RoleGuard>} />
            <Route path="/servicios/equipos" element={<RoleGuard roles={["Administrador"]}><EquiposPage /></RoleGuard>} />
            <Route path="/servicios/equipos/alquileres" element={<RoleGuard roles={["Administrador"]}><AlquileresListPage /></RoleGuard>} />
            <Route path="/servicios/podcast" element={<RoleGuard roles={["Administrador"]}><PodcastPage /></RoleGuard>} />
            <Route path="/servicios/edicion-video" element={<RoleGuard roles={["Administrador"]}><EdicionVideoPage /></RoleGuard>} />
            <Route path="/finanzas/pagos" element={<RoleGuard roles={["Administrador"]}><FinancePagosPage /></RoleGuard>} />
            <Route path="/certificados" element={<RoleGuard roles={["Administrador"]}><CertificadosPage /></RoleGuard>} />
            <Route path="/certificados/carga-masiva" element={<RoleGuard roles={["Administrador"]}><CargaMasivaCertificadosPage /></RoleGuard>} />

            {/* Instructor portal (Admin + Instructor) */}
            <Route path="/instructor/cursos" element={<RoleGuard roles={["Administrador", "Instructor"]}><InstructorCursosPage /></RoleGuard>} />
            <Route path="/instructor/cursos/:id" element={<RoleGuard roles={["Administrador", "Instructor"]}><InstructorCursoDetailPage /></RoleGuard>} />
            <Route path="/instructor/clases/:cursoId/:moduloId" element={<RoleGuard roles={["Administrador", "Instructor"]}><ClasesModuloPage /></RoleGuard>} />
            <Route path="/instructor/asistencia/:cursoId/:claseId" element={<RoleGuard roles={["Administrador", "Instructor"]}><AsistenciaRegistroPage /></RoleGuard>} />
            <Route path="/instructor/notas/:cursoId/:moduloId" element={<RoleGuard roles={["Administrador", "Instructor"]}><NotasRegistroPage /></RoleGuard>} />
            <Route path="/instructor/estudiantes" element={<RoleGuard roles={["Administrador", "Instructor"]}><MisEstudiantesPage /></RoleGuard>} />
            <Route path="/instructor/horario" element={<RoleGuard roles={["Administrador", "Instructor"]}><InstructorHorarioPage /></RoleGuard>} />

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
  const userRoles: string[] = (user as any)?.roles || []

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
