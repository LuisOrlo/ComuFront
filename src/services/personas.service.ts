import api from "@/services/auth.service"

export interface Persona {
  id: string
  tipo: "instructor" | "staff" | "secretaria" | "admin" | "estudiante" | "pasante"
  cedula?: string
  nombres: string
  apellidos: string
  correo?: string
  celular?: string
  ciudad?: string
  ciudad_id?: number
  es_activo: boolean
  cuentaSistema?: { id: string; username: string }
  perfilInstructor?: { id: string; especialidad?: string; bio?: string }
  perfilStaff?: { id: string; cargo?: string; salario_base?: number; fecha_ingreso?: string; es_pasante?: boolean }
}

export interface PersonaPaginada {
  data: Persona[]
  meta: { total: number; per_page: number; current_page: number; last_page: number }
}

function mapPersona(raw: Record<string, unknown>): Persona {
  const r = raw as Record<string, unknown> & {
    id: string; tipo: string; cedula?: string; nombres: string; apellidos: string;
    correo?: string; celular?: string; ciudad?: string; ciudad_id?: number; es_activo: boolean;
    cuenta_sistema?: { id: string; username: string };
    perfil_instructor?: { id: string; especialidad?: string; bio?: string };
    perfil_staff?: { id: string; cargo?: string; salario_base?: number; fecha_ingreso?: string; es_pasante?: boolean };
  };
  return {
    id: r.id,
    tipo: r.tipo as Persona["tipo"],
    cedula: r.cedula,
    nombres: r.nombres,
    apellidos: r.apellidos,
    correo: r.correo,
    celular: r.celular,
    ciudad: r.ciudad,
    ciudad_id: r.ciudad_id,
    es_activo: r.es_activo,
    cuentaSistema: r.cuenta_sistema,
    perfilInstructor: r.perfil_instructor,
    perfilStaff: r.perfil_staff,
  }
}

export const personasService = {
  async getPersonas(filters?: {
    tipo?: string
    buscar?: string
    ciudad_id?: number
    page?: number
  }): Promise<PersonaPaginada> {
    const params: Record<string, string | number> = { per_page: 15, page: filters?.page || 1 }
    if (filters?.tipo) params.tipo = filters.tipo
    if (filters?.buscar) params.buscar = filters.buscar
    if (filters?.ciudad_id) params.ciudad_id = filters.ciudad_id
    const res = await api.get<{ data: Record<string, unknown>[]; meta: { total: number; per_page: number; current_page: number; last_page: number } }>("/academic/personas", { params })
    return {
      data: res.data.data.map(mapPersona),
      meta: res.data.meta,
    }
  },

  async getPersonaById(id: string): Promise<Persona> {
    const res = await api.get<{ data: Record<string, unknown> }>(`/academic/personas/${id}`)
    return mapPersona(res.data.data)
  },

  async crearPersona(data: {
    tipo: "instructor" | "staff" | "secretaria" | "admin"
    cedula?: string
    nombres: string
    apellidos: string
    correo?: string
    celular?: string
    ciudad?: string
    es_activo?: boolean
  }): Promise<Persona> {
    const res = await api.post<{ data: Record<string, unknown>; message: string }>("/academic/personas", data)
    return mapPersona(res.data.data)
  },

  async actualizarPersona(id: string, data: {
    tipo?: "instructor" | "staff" | "secretaria" | "admin"
    cedula?: string
    nombres?: string
    apellidos?: string
    correo?: string
    celular?: string
    ciudad?: string
    es_activo?: boolean
  }): Promise<Persona> {
    const res = await api.put<{ data: Record<string, unknown> }>(`/academic/personas/${id}`, data)
    return mapPersona(res.data.data)
  },

  async eliminarPersona(id: string): Promise<void> {
    await api.delete(`/academic/personas/${id}`)
  },

  async crearPersonaCompleta(data: {
    tipo: "instructor" | "staff" | "secretaria" | "admin"
    cedula?: string
    nombres: string
    apellidos: string
    correo?: string
    celular?: string
    ciudad?: string
    es_activo?: boolean
    especialidad?: string
    bio?: string
    cargo?: string
    salario_base?: number
    fecha_ingreso?: string
    es_pasante?: boolean
    crear_cuenta?: boolean
    username?: string
    password?: string
  }): Promise<Persona> {
    const res = await api.post<{ data: Record<string, unknown>; message: string }>("/academic/personas/completo", data)
    return mapPersona(res.data.data)
  },

  async crearCuenta(personaId: string, username: string, password: string) {
    const res = await api.post(`/academic/personas/${personaId}/cuenta`, { username, password })
    return res.data
  },

  async actualizarCuenta(personaId: string, data: { username?: string; password?: string }) {
    const res = await api.put(`/academic/personas/${personaId}/cuenta`, data)
    return res.data
  },
}
