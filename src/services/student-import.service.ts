import api, { apiMultipart } from "@/services/auth.service"

export interface ImportPreviewRow {
  row_number: number
  original_data: Record<string, unknown>
  student: {
    full_name?: string | null
    nombres?: string | null
    apellidos?: string | null
    cedula?: string | null
    correo?: string | null
    celular?: string | null
    ciudad?: string | null
    ciudad_id?: number | null
    name_inference?: boolean
  }
  identity_resolution: {
    status: string
    persona_id?: string | null
    candidates?: Array<Record<string, unknown>>
  }
  city_resolution?: { status: string; ciudad_id?: number | null; nombre?: string | null }
  enrollment?: {
    status: string
    curso_abierto_id?: string
    curso_nombre?: string | null
    fecha_inicio?: string | null
    fecha_fin?: string | null
    historico?: boolean
    proposed_action?: string
    existing_matricula_id?: string | null
    errors?: Array<{ code: string; message: string }>
    warnings?: Array<{ code: string; message: string }>
  }
  finance?: {
    enabled: boolean
    financial_modules?: Array<Record<string, unknown>>
    total?: number
    paid?: number
    balance?: number
    status?: string
    transactions_expected?: number
    errors?: Array<{ code: string; message: string }>
    warnings?: Array<{ code: string; message: string }>
  }
  errors: Array<{ code: string; message: string; field?: string }>
  warnings: Array<{ code: string; message: string }>
  status: "READY" | "WARNING" | "BLOCKED" | "IMPORTED" | "SKIPPED" | "FAILED"
}

export interface ImportPreviewResponse {
  preview_id: string
  headers: string[]
  suggested_mapping: Record<string, string>
  mapping?: Record<string, string>
  sample_rows?: Array<Record<string, unknown>>
  rows?: ImportPreviewRow[]
  summary?: Record<string, number>
  stage: "MAPPING" | "PREVIEW"
  expires_at: string
  enrollment?: Record<string, unknown>
  finance?: Record<string, unknown>
}

export interface ImportExecutionResponse {
  preview_id: string
  summary: Record<string, number>
  rows: Array<ImportPreviewRow & {
    persona_id?: string | null
    perfil_estudiante_id?: string | null
    action?: string | null
    matricula_id?: string | null
    enrollment_action?: string | null
  enrollment_status?: string | null
    finance_status?: string | null
    financial_lines_created?: number
    accounts_created?: number
    transactions_created?: number
    financial_warnings?: Array<{ code: string; message: string }>
  }>
}

export interface ImportCourse {
  id: string
  nombre_instancia?: string | null
  fecha_inicio?: string | null
  fecha_fin?: string | null
  modalidad?: string | null
  estado?: string | null
  es_personalizado?: boolean
  capacidad_maxima?: number
  total_matriculas?: number
  catalogo?: { nombre?: string | null }
  ciudad?: { nombre?: string | null }
}

export interface ImportModule {
  id: string
  nombre_modulo?: string | null
  numero_orden?: number
  precio_base?: number | string | null
}

export const studentImportService = {
  async preview(file?: File, previewId?: string, mapping?: Record<string, string>, enrollment?: Record<string, unknown>, finance?: Record<string, unknown>) {
    const form = new FormData()
    if (file) form.append("archivo", file)
    if (previewId) form.append("preview_id", previewId)
    if (mapping) form.append("mapping", JSON.stringify(mapping))
    if (enrollment) form.append("enrollment", JSON.stringify(enrollment))
    if (finance) form.append("finance", JSON.stringify(finance))

    const response = await apiMultipart.post<{ data: ImportPreviewResponse }>("/imports/students/preview", form)
    return response.data.data
  },

  async getCourseModules(courseId: string) {
    const response = await api.get<{ data: ImportModule[] }>(`/academic/cursos-abiertos/${courseId}/modulos`, { params: { per_page: 100 } })
    return response.data.data
  },

  async getCourses(historical = false) {
    const response = await api.get<{ data: ImportCourse[] }>("/academic/cursos-abiertos", {
      params: historical
        ? { per_page: 100, historicos: "true" }
        : { per_page: 100, dias_desde_inicio: 7 },
    })
    return response.data.data
  },

  async execute(previewId: string, confirmedRows: Array<Record<string, unknown>>) {
    const response = await api.post<{ data: ImportExecutionResponse }>("/imports/students/execute", {
      preview_id: previewId,
      confirmed_rows: confirmedRows,
    })
    return response.data.data
  },
}
