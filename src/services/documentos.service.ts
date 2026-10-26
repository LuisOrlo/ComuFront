import api, { apiMultipart } from "./auth.service"

export interface DocumentoArchivo {
  id: string
  nombre: string
  descripcion?: string | null
  archivo_path: string
  archivo_url: string
  archivo_nombre_original: string
  es_publico: boolean
  descargas_count?: number
  created_at?: string
  updated_at?: string
}

export interface DocumentosKPIs {
  total: number
  publicos: number
  ocultos: number
  total_descargas?: number
}

export interface DocumentosAdminResponse {
  documentos: {
    data?: DocumentoArchivo[]
    current_page?: number
    last_page?: number
    total?: number
  } | DocumentoArchivo[]
  kpis: DocumentosKPIs
}

export interface DocumentosPublicosResponse {
  data?: DocumentoArchivo[]
  current_page?: number
  last_page?: number
  total?: number
}

export const documentosService = {
  /**
   * Obtener lista administrativa de documentos y KPIs
   */
  async listar(params?: { buscar?: string; estado?: string; page?: number; per_page?: number }) {
    const res = await api.get<{ success: boolean; data: DocumentosAdminResponse }>("/documentos", { params })
    return res.data?.data
  },

  /**
   * Subir un nuevo documento PDF
   */
  async subir(payload: { nombre: string; descripcion?: string; es_publico?: boolean; archivo: File }) {
    const formData = new FormData()
    formData.append("nombre", payload.nombre)
    if (payload.descripcion) {
      formData.append("descripcion", payload.descripcion)
    }
    formData.append("es_publico", payload.es_publico ? "1" : "0")
    formData.append("archivo", payload.archivo)

    const res = await apiMultipart.post<{ success: boolean; data: DocumentoArchivo; message: string }>("/documentos", formData)
    return res.data?.data
  },

  /**
   * Actualizar documento existente (nombre, descripción, visibilidad, o reemplazo de PDF)
   */
  async actualizar(id: string, payload: { nombre: string; descripcion?: string; es_publico?: boolean; archivo?: File }) {
    const formData = new FormData()
    formData.append("nombre", payload.nombre)
    if (payload.descripcion !== undefined) {
      formData.append("descripcion", payload.descripcion || "")
    }
    if (payload.es_publico !== undefined) {
      formData.append("es_publico", payload.es_publico ? "1" : "0")
    }
    if (payload.archivo) {
      formData.append("archivo", payload.archivo)
    }

    const res = await apiMultipart.post<{ success: boolean; data: DocumentoArchivo; message: string }>(`/documentos/${id}`, formData)
    return res.data?.data
  },

  /**
   * Alternar visibilidad con 1 clic (Público / Oculto)
   */
  async toggleVisibilidad(id: string) {
    const res = await api.patch<{ success: boolean; data: { id: string; es_publico: boolean }; message: string }>(`/documentos/${id}/toggle-visibilidad`)
    return res.data
  },

  /**
   * Eliminar documento y su archivo físico
   */
  async eliminar(id: string) {
    const res = await api.delete<{ success: boolean; message: string }>(`/documentos/${id}`)
    return res.data
  },

  /**
   * Consultar documentos públicos (solo con es_publico = true)
   */
  async listarPublicos(params?: { buscar?: string; page?: number; per_page?: number }) {
    const res = await api.get<{ success: boolean; data: DocumentosPublicosResponse | DocumentoArchivo[] }>("/public/documentos", { params })
    return res.data?.data
  },

  /**
   * Obtener URL oficial de descarga forzada e incremento de descargas
   */
  obtenerDescargaUrl(id: string): string {
    const baseUrl = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "")
    return `${baseUrl}/public/documentos/${id}/descargar`
  },

  /**
   * Forzar descarga directa en el navegador
   */
  forzarDescarga(id: string, nombreArchivo: string) {
    const url = this.obtenerDescargaUrl(id)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", nombreArchivo)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  },
}
