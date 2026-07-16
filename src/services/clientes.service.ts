import api from "@/services/auth.service"

export interface ClienteExterno {
  id: string
  nombres: string
  apellidos?: string
  cedula?: string
  correo?: string
  celular?: string
  ciudad_id?: number
  ciudad?: string
  direccion?: string
  ocupacion?: string
  estado_civil?: string
  edad?: number
  fecha_nacimiento?: string
  observaciones?: string
  created_at?: string
}

export const clientesService = {
  getClientes: async (params?: { search?: string; per_page?: number; page?: number }) => {
    const { data } = await api.get("/academic/servicios/clientes-externos", { params })
    return data
  },

  getCliente: async (id: string) => {
    const { data } = await api.get(`/academic/servicios/clientes-externos/${id}`)
    return data.data
  },

  createCliente: async (cliente: Partial<ClienteExterno>) => {
    const { data } = await api.post("/academic/servicios/clientes-externos", cliente)
    return data.data
  },

  updateCliente: async (id: string, cliente: Partial<ClienteExterno>) => {
    const { data } = await api.put(`/academic/servicios/clientes-externos/${id}`, cliente)
    return data.data
  },

  deleteCliente: async (id: string) => {
    const { data } = await api.delete(`/academic/servicios/clientes-externos/${id}`)
    return data.data
  },

  buscarPorCedula: async (cedula: string) => {
    const { data } = await api.post("/academic/servicios/clientes-externos/buscar-cedula", { cedula })
    return data.data
  },

  getClienteReservas: async (id: string) => {
    const { data } = await api.get(`/academic/servicios/clientes-externos/${id}/reservas`)
    return data.data as {
      radio: Array<Record<string, unknown>>
      aulas: Array<Record<string, unknown>>
      podcast: Array<Record<string, unknown>>
      equipos: Array<Record<string, unknown>>
    }
  },

  getClienteFinancial: async (id: string) => {
    const { data } = await api.get(`/academic/servicios/clientes-externos/${id}/financial`)
    return data.data as Array<Record<string, unknown>>
  },
}
