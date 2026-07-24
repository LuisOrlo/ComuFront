import api from "./auth.service"
import type { DatosAsistenciaPDF } from "@/lib/generarAsistenciaPDF"

export interface InstructorCurso {
  id: string
  catalogo: {
    id: string
    nombre: string
    descripcion?: string
    color?: string
  }
  nombre_instancia: string
  estado: string
  fecha_inicio: string
  fecha_fin: string
  modalidad?: string
  horario: {
    nombre_referencial: string
    hora_inicio?: string
    hora_fin?: string
    dia_semana?: number[]
    dias_semana?: Array<{ dia_semana: number }>
  }
  ciudad: {
    nombre: string
  }
  instructor?: { nombres: string; apellidos: string } | string
  modulos: ModuloResumen[]
}

export interface ModuloResumen {
  id: string
  nombre_modulo: string
  numero_orden: number
  ponderacion: number
}

export interface ClaseItem {
  id: string
  fecha_clase: string
  hora_inicio: string
  hora_fin: string
  asistencia_registrada: boolean
  observaciones?: string
}

export interface EstudianteCurso {
  id: string
  estudiante: {
    id: string
    nombres: string
    apellidos: string
    cedula?: string
    correo?: string
  } | null
  participante_externo?: {
    id: string
    nombres: string
    apellidos?: string
    cedula?: string
    correo?: string
  } | null
  porcentaje_asistencia: number
  clases_asistidas: number
  total_clases: number
  notas: Array<{
    id: string
    modulo_id: string
    calificacion: number
    observaciones?: string
  }>
  estado: string
}

export interface AsistenciaClaseEstudiante {
  id: string
  clase_id: string
  matricula_id: string
  asistio: boolean
  estado: string
  observaciones: string | null
  estudiante: {
    id: string
    nombres: string
    apellidos: string
    cedula: string
    correo: string
    ciudad?: string
  } | null
  participante_externo: {
    id: string
    nombres: string
    apellidos: string
    cedula: string
    correo: string
    telefono?: string
  } | null
}

export interface EstudianteUnificado {
  matriculaId: string
  estudianteId?: string
  nombres: string
  apellidos: string
  cedula: string
  correo: string
  cursoId: string
  cursoNombre: string
  porcentaje_asistencia: number
  promedio_notas: number
  estado: string
}

export const instructorService = {
  async getMisCursos(): Promise<InstructorCurso[]> {
    const response = await api.get("/instructor/mis-cursos")
    return response.data.datos
  },

  async getDetalleCurso(id: string): Promise<InstructorCurso> {
    const response = await api.get(`/instructor/cursos/${id}`)
    return response.data.datos
  },

  async getEstudiantesCurso(id: string): Promise<EstudianteCurso[]> {
    const response = await api.get(`/instructor/cursos/${id}/estudiantes`)
    return response.data.datos
  },

  async getClasesModulo(moduloId: string): Promise<ClaseItem[]> {
    const response = await api.get(`/instructor/modulos/${moduloId}/clases`)
    return response.data.datos
  },

  async getDetalleClase(claseId: string): Promise<ClaseItem> {
    const response = await api.get(`/instructor/clases/${claseId}`)
    return response.data.datos
  },

  async registrarAsistencia(claseId: string, asistencias: Array<{
    matricula_id: string
    asistio: boolean
    estado: string
    observaciones: string
  }>, claseObservaciones?: string) {
    const body: Record<string, unknown> = { asistencias }
    if (claseObservaciones !== undefined) {
      body.clase_observaciones = claseObservaciones
    }
    const response = await api.post(`/instructor/clases/${claseId}/asistencia`, body)
    return response.data
  },

  async registrarNotas(moduloId: string, notas: Array<{
    matricula_id: string
    calificacion: number
    observaciones: string
  }>) {
    const response = await api.post("/instructor/notas", { modulo_id: moduloId, notas })
    return response.data
  },

  async getDetalleEstudiante(id: string): Promise<{
    id: string
    nombres: string
    apellidos: string
    cedula?: string
    correo?: string
    celular?: string
    ciudad?: { nombre: string }
    perfil_estudiante?: {
      fecha_nacimiento?: string
      ocupacion?: string
      direccion?: string
      estado_civil?: string
      edad?: number
    } | null
  }> {
    const response = await api.get(`/instructor/estudiantes/${id}`)
    return response.data.datos
  },

  async getAsistenciaClase(claseId: string): Promise<AsistenciaClaseEstudiante[]> {
    const response = await api.get(`/instructor/clases/${claseId}/asistencia`)
    return response.data.datos
  },

  async getAsistenciaPDFData(cursoId: string): Promise<DatosAsistenciaPDF> {
    const response = await api.get(`/instructor/cursos/${cursoId}/asistencia-pdf`)
    return response.data
  },

  async getTodosEstudiantes(): Promise<EstudianteUnificado[]> {
    const cursos = await this.getMisCursos()
    const resultados = await Promise.all(
      cursos.map(curso =>
        this.getEstudiantesCurso(curso.id).then(estudiantes => ({ curso, estudiantes }))
      )
    )
    const todos: EstudianteUnificado[] = []
    for (const { curso, estudiantes } of resultados) {
      for (const e of estudiantes) {
        const p = e.estudiante || e.participante_externo
        if (!p) continue
        const notas = e.notas.filter(n => n.calificacion != null)
        const promedio = notas.length > 0
          ? notas.reduce((s, n) => s + n.calificacion, 0) / notas.length
          : 0
        todos.push({
          matriculaId: e.id,
          estudianteId: p.id,
          nombres: p.nombres,
          apellidos: p.apellidos || "",
          cedula: p.cedula || "—",
          correo: p.correo || "—",
          cursoId: curso.id,
          cursoNombre: curso.catalogo?.nombre || curso.nombre_instancia,
          porcentaje_asistencia: e.porcentaje_asistencia ?? 0,
          promedio_notas: Math.round(promedio * 10) / 10,
          estado: e.estado,
        })
      }
    }
    return todos
  }
}
