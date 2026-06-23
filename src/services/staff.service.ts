import api from "@/services/auth.service"
import type { Persona } from "./personas.service"

function mapPersona(raw: Record<string, unknown>): Persona {
  const r = raw as Record<string, unknown> & {
    id: string; tipo: string; cedula?: string; nombres: string; apellidos: string;
    correo?: string; celular?: string; es_activo: boolean;
    ciudad?: string; ciudad_id?: number;
    cuenta_sistema?: { id: string; username: string };
    perfil_instructor?: { id: string; especialidad?: string; bio?: string };
    perfil_staff?: { id: string; cargo?: string; salario_base?: number; fecha_ingreso?: string; es_pasante?: boolean };
  };
  return {
    id: r.id, tipo: r.tipo as Persona["tipo"], cedula: r.cedula, nombres: r.nombres, apellidos: r.apellidos,
    correo: r.correo, celular: r.celular, ciudad_id: r.ciudad_id, es_activo: r.es_activo,
    ciudad: r.ciudad, cuentaSistema: r.cuenta_sistema,
    perfilInstructor: r.perfil_instructor, perfilStaff: r.perfil_staff,
  }
}

export const staffService = {
  async getStaff(filters?: {
    buscar?: string
    cargo?: string
    es_pasante?: boolean
    page?: number
    }): Promise<{ data: Persona[]; meta: { current_page: number; last_page: number; per_page: number; total: number } }> {
    const params: Record<string, string | number> = { per_page: 15, page: filters?.page || 1 }
    if (filters?.buscar) params.buscar = filters.buscar
    if (filters?.cargo) params.cargo = filters.cargo
    if (filters?.es_pasante !== undefined) params.es_pasante = String(filters.es_pasante)
    const res = await api.get<{ data: Record<string, unknown>[]; meta: { current_page: number; last_page: number; per_page: number; total: number } }>("/academic/staff", { params })
    return { data: res.data.data.map(mapPersona), meta: res.data.meta }
  },

  async getStaffById(id: string): Promise<Persona> {
    const res = await api.get<{ data: Record<string, unknown> }>(`/academic/staff/${id}`)
    return mapPersona(res.data.data)
  },

  async updatePerfil(id: string, data: {
    cargo: string
    salario_base?: number
    fecha_ingreso?: string
    es_pasante?: boolean
  }) {
    const res = await api.post(`/academic/staff/${id}/perfil`, data)
    return res.data
  },

  async getAsistencia(id: string) {
    const res = await api.get(`/academic/staff/${id}/asistencia`)
    return res.data
  },
}
