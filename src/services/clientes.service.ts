import api from "@/services/auth.service"

export interface ClienteExterno {
  id: string
  nombres: string
  apellidos?: string
  cedula?: string
  correo?: string
  celular?: string
  ciudad_id?: number
  observaciones?: string
  created_at?: string
}

export const clientesService = {
  getClientes: async (params?: { search?: string; per_page?: number }) => {
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

  buscarPorCedula: async (cedula: string) => {
    const { data } = await api.post("/academic/servicios/clientes-externos/buscar-cedula", { cedula })
    return data.data
  },
}
