import api, { apiMultipart } from "@/services/auth.service"

export interface Certificado {
  id: string
  estudiante_id: string
  catalogo_id: string
  curso_abierto_id?: string
  modulo_id?: string
  cedula_impresa: string
  fecha_emision: string
  codigo_certificado: string
  archivo_pdf_url?: string
  estado: "generado" | "entregado" | "borrado"
  fecha_entrega?: string
  entregado_fisicamente: boolean
  verificaciones_count: number
  created_at?: string
  updated_at?: string
  estudiante?: {
    id: string
    nombres: string
    apellidos: string
    cedula: string
  }
  catalogo_curso?: {
    id: string
    nombre: string
    color?: string
  }
  curso_abierto?: {
    id: string
    codigo_curso: string
  }
}

export interface CertificadoResponse {
  data: Certificado
  message?: string
}

export interface CertificadoListResponse {
  data: Certificado[]
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export interface EstudiantePanel {
  matricula_id: string
  estado_matricula: string
  fecha_inscripcion?: string
  persona_id: string
  nombres: string
  apellidos: string
  cedula: string
  curso_abierto_id: string
  catalogo_nombre: string
  nombre_instancia?: string
  modalidad?: string
  certificado_id?: string
  codigo_certificado?: string
  estado_certificado?: string
  archivo_pdf_url?: string
}

export interface PanelEstudiantesResponse {
  data: EstudiantePanel[]
  current_page: number
  per_page: number
  total: number
  last_page: number
}

export interface EstudianteCertificado {
  id: string
  nombres: string
  apellidos: string
  cedula: string
  tipo: string
}

export interface BulkCertificadoItem {
  pdf: File
  estudiante_id: string
  curso_abierto_id: string
  catalogo_id: string
  filename: string
}

export interface BulkUploadResponse {
  message: string
  procesados: number
  errores: number
  resultados: Array<{
    index: number
    certificado_id: string
    codigo_certificado: string
    estudiante: string
  }>
  errores_detalle: Array<{
    index: number
    estudiante_id?: string
    error: string
  }>
}

export const certificadosService = {
  getPanelEstudiantes: async (params?: {
    search?: string
    estado_matricula?: string
    curso_abierto_id?: string
    estado_certificado?: string
    pago_completo?: string
    tiene_certificado?: string
    page?: number
    per_page?: number
  }) => {
    const { data } = await api.get<PanelEstudiantesResponse>("/academic/certificados/panel-estudiantes", { params })
    return data
  },

  buscarEstudiantes: async (buscar: string): Promise<EstudianteCertificado[]> => {
    const { data } = await api.get<{ data: EstudianteCertificado[] }>("/academic/certificados/estudiantes", {
      params: { buscar },
    })
    return data.data
  },

  bulkStore: async (items: BulkCertificadoItem[]) => {
    const form = new FormData()
    items.forEach((item, index) => {
      form.append(`certificados[${index}][pdf]`, item.pdf)
      form.append(`certificados[${index}][estudiante_id]`, item.estudiante_id)
      form.append(`certificados[${index}][curso_abierto_id]`, item.curso_abierto_id)
      form.append(`certificados[${index}][catalogo_id]`, item.catalogo_id)
      form.append(`certificados[${index}][filename]`, item.filename)
    })
    const { data } = await apiMultipart.post<BulkUploadResponse>("/academic/certificados/bulk", form, {
      timeout: 120000,
    })
    return data
  },

  getCertificados: async (params?: {
    search?: string
    estado?: string
    curso_abierto_id?: string
    page?: number
    per_page?: number
  }) => {
    const { data } = await api.get<CertificadoListResponse>("/academic/certificados", { params })
    return data
  },

  getCertificado: async (id: string) => {
    const { data } = await api.get<CertificadoResponse>(`/academic/certificados/${id}`)
    return data.data
  },

  createCertificado: async (payload: FormData) => {
    const { data } = await apiMultipart.post<CertificadoResponse>("/academic/certificados", payload)
    return data.data
  },

  uploadPdf: async (id: string, payload: FormData) => {
    const { data } = await apiMultipart.post<CertificadoResponse>(`/academic/certificados/${id}/pdf`, payload)
    return data.data
  },

  removePdf: async (id: string) => {
    const { data } = await api.delete<CertificadoResponse>(`/academic/certificados/${id}/pdf`)
    return data.data
  },

  marcarEntregado: async (id: string, data?: { fecha_entrega?: string; metodo_entrega?: string }) => {
    const { data: resp } = await api.patch<CertificadoResponse>(`/academic/certificados/${id}/entregar`, data)
    return resp.data
  },

  getHistorial: async (id: string) => {
    const { data } = await api.get<{ data: { accion: string; fecha: string; usuario?: string; detalle?: string }[] }>(`/academic/certificados/${id}/historial`)
    return data.data
  },

  deleteCertificado: async (id: string) => {
    await api.delete(`/academic/certificados/${id}`)
  },

  verificarPorCedula: async (cedula: string) => {
    const { data } = await api.get<{ data: Certificado[] }>("/verificar-certificados", {
      params: { cedula },
    })
    return data.data
  },

  verificarPorCodigo: async (codigo: string) => {
    const { data } = await api.get<{ data: Certificado }>(`/verificar-certificados/codigo/${codigo}`)
    return data.data
  },

  descargarPdf: (id: string) => {
    const token = localStorage.getItem("auth_token")
    const baseUrl = import.meta.env.VITE_API_URL
    const url = token
      ? `${baseUrl}/certificados/${id}/descargar`
      : `${baseUrl}/certificados/${id}/descargar`
    window.open(url, "_blank")
  },
}
