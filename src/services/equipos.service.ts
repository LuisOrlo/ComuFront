import api, { apiMultipart } from "@/services/auth.service"

export interface Equipo {
  id: string
  nombre: string
  descripcion?: string
  foto_url?: string
  precio_diario: number
  estado: "disponible" | "alquilado" | "mantenimiento"
  created_at?: string
  updated_at?: string
  alquileres?: AlquilerEquipo[]
}

export interface AlquilerEquipo {
  id: string
  equipo_id: string
  persona_id?: string
  cliente_externo_id?: string
  fecha_entrega: string
  fecha_devolucion_esperada: string
  fecha_recepcion?: string
  foto_salida_url?: string
  foto_retorno_url?: string
  observaciones?: string
  precio_total: number
  estado: "activo" | "devuelto" | "vencido" | "pendiente" | "entregado"
  created_at?: string
  updated_at?: string
  equipo?: Equipo
  persona?: { id: string; nombres: string; apellidos: string; correo?: string }
  cliente_externo?: { id: string; nombres: string; apellidos?: string; cedula?: string; correo?: string; celular?: string }
}

export const equiposService = {
  getEquipos: async (params?: { search?: string; estado?: string }) => {
    const { data } = await api.get<{ data: Equipo[] }>("/academic/servicios/equipos", { params })
    return data.data
  },

  getEquipo: async (id: string) => {
    const { data } = await api.get<{ data: Equipo }>(`/academic/servicios/equipos/${id}`)
    return data.data
  },

  createEquipo: async (equipo: Partial<Equipo> | FormData) => {
    const client = equipo instanceof FormData ? apiMultipart : api
    const { data } = await client.post<{ data: Equipo }>("/academic/servicios/equipos", equipo)
    return data.data
  },

  updateEquipo: async (id: string, equipo: Partial<Equipo> | FormData) => {
    const client = equipo instanceof FormData ? apiMultipart : api
    const { data } = await client.post<{ data: Equipo }>(`/academic/servicios/equipos/${id}`, equipo)
    return data.data
  },

  deleteEquipo: async (id: string) => {
    await api.delete(`/academic/servicios/equipos/${id}`)
  },

  getAlquileres: async (params?: { equipo_id?: string; estado?: string; search?: string }) => {
    const { data } = await api.get<{ data: AlquilerEquipo[] }>("/academic/servicios/alquileres-equipos", { params })
    return data.data
  },

  getAlquiler: async (id: string) => {
    const { data } = await api.get<{ data: AlquilerEquipo }>(`/academic/servicios/alquileres-equipos/${id}`)
    return data.data
  },

  createAlquiler: async (alquiler: Partial<AlquilerEquipo> | FormData) => {
    const client = alquiler instanceof FormData ? apiMultipart : api
    const { data } = await client.post<{ data: AlquilerEquipo }>("/academic/servicios/alquileres-equipos", alquiler)
    return data.data
  },

  devolverEquipo: async (id: string, payload: { foto_retorno_url?: string; observaciones?: string } | FormData) => {
    const client = payload instanceof FormData ? apiMultipart : api
    const { data } = await client.post<{ data: AlquilerEquipo }>(`/academic/servicios/alquileres-equipos/${id}/devolver`, payload)
    return data.data
  },

  entregarEquipo: async (id: string) => {
    const { data } = await api.post<{ data: AlquilerEquipo }>(`/academic/servicios/alquileres-equipos/${id}/entregar`)
    return data.data
  },

  deleteAlquiler: async (id: string) => {
    await api.delete(`/academic/servicios/alquileres-equipos/${id}`)
  },

  getVencidos: async () => {
    const { data } = await api.get<{ data: AlquilerEquipo[] }>("/academic/servicios/alquileres-equipos/vencidos")
    return data.data
  },
}
