import type { MatriculaDetallada } from "@/services/cursos.service"

export interface EstudianteDatos {
  nombres: string
  apellidos: string
  cedula: string
  correo: string
}

export function getEstudianteData(m: MatriculaDetallada): EstudianteDatos | null {
  if (m.estudiante) return m.estudiante
  if (m.solicitud_inscripcion?.estudiante) return m.solicitud_inscripcion.estudiante
  if (m.solicitud_inscripcion?.participante_externo) return m.solicitud_inscripcion.participante_externo
  return null
}

export function estadoBadge(estado: string): { bg: string; text: string; label: string } {
  if (estado === "matricula_creada") {
    return { bg: "#dcfce7", text: "#166534", label: "Activo" }
  }
  if (estado === "pendiente_validacion") {
    return { bg: "#fef3c7", text: "#92400e", label: "Pendiente" }
  }
  if (estado === "rechazada") {
    return { bg: "#fee2e2", text: "#991b1b", label: "Rechazada" }
  }
  return { bg: "#f3f4f6", text: "#374151", label: estado || "—" }
}