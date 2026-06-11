import api from "@/services/auth.service"

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface Ciudad {
  id: number
  nombre: string
  created_at?: string
  updated_at?: string
}

export interface CiudadPaginada {
  data: Ciudad[]
  meta: {
    total: number
    per_page: number
    current_page: number
    last_page: number
  }
}

export interface CiudadListaResponse {
  data: Ciudad[]
}

// ============================================================================
// SERVICIO DE CIUDADES
// ============================================================================

export const ciudadesService = {
  /**
   * GET /api/v1/ciudades/todas/sin-paginacion
   * Obtener todas las ciudades sin paginación (para selects)
   * ✅ PÚBLICO (no requiere autenticación)
   */
  async getCiudadesTodas(): Promise<Ciudad[]> {
    const response = await api.get<CiudadListaResponse>(
      "/ciudades/todas/sin-paginacion"
    )
    return response.data.data
  },

  /**
   * GET /api/v1/academic/ciudades
   * Listar ciudades con paginación y búsqueda
   */
  async getCiudades(search?: string, page: number = 1): Promise<CiudadPaginada> {
    const params: Record<string, string | number> = {
      per_page: 15,
      page,
    }

    if (search) {
      params.search = search
    }

    const response = await api.get<CiudadPaginada>("/academic/ciudades", {
      params,
    })

    return response.data
  },

  /**
   * GET /api/v1/academic/ciudades/{id}
   * Obtener detalles de una ciudad
   */
  async getCiudadById(id: number): Promise<Ciudad> {
    const response = await api.get<{ data: Ciudad }>(
      `/academic/ciudades/${id}`
    )

    return response.data.data
  },

  /**
   * POST /api/v1/academic/ciudades
   * Crear nueva ciudad
   */
  async crearCiudad(nombre: string): Promise<Ciudad> {
    const response = await api.post<{ data: Ciudad; message: string }>(
      "/academic/ciudades",
      { nombre }
    )

    return response.data.data
  },

  /**
   * PUT /api/v1/academic/ciudades/{id}
   * Actualizar ciudad
   */
  async actualizarCiudad(id: number, nombre: string): Promise<Ciudad> {
    const response = await api.put<{ data: Ciudad; message: string }>(
      `/academic/ciudades/${id}`,
      { nombre }
    )

    return response.data.data
  },

  /**
   * DELETE /api/v1/academic/ciudades/{id}
   * Eliminar ciudad
   */
  async eliminarCiudad(id: number): Promise<void> {
    await api.delete(`/academic/ciudades/${id}`)
  },
}

export default api
