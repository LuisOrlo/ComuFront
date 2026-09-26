import api, { apiMultipart } from "@/services/auth.service"
import type { Persona } from "./personas.service"

function mapPersona(raw: Record<string, unknown>): Persona {
  const r = raw as Record<string, unknown> & {
    id: string; tipo: string; cedula?: string; nombres: string; apellidos: string;
    correo?: string; celular?: string; es_activo: boolean;
    ciudad?: string | { id?: number; nombre?: string }; ciudad_id?: number;
    cuenta_sistema?: { id: string; username: string };
    perfil_instructor?: { id: string; especialidad?: string; bio?: string };
    perfil_staff?: { id: string; cargo?: string; salario_base?: number; fecha_ingreso?: string; es_pasante?: boolean };
  };
  return {
    id: r.id, tipo: r.tipo as Persona["tipo"], cedula: r.cedula, nombres: r.nombres, apellidos: r.apellidos,
    correo: r.correo, celular: r.celular, ciudad_id: r.ciudad_id, es_activo: r.es_activo,
    cursos_actuales_count: r.cursos_actuales_count as number | undefined, talleres_actuales_count: r.talleres_actuales_count as number | undefined,
    ciudad: typeof r.ciudad === "object" && r.ciudad !== null ? r.ciudad.nombre : (r.ciudad as string | undefined),
    cuentaSistema: r.cuenta_sistema,
    perfilInstructor: r.perfil_instructor, perfilStaff: r.perfil_staff,
  }
}

export const instructoresService = {
  async getInstructores(filters?: {
    buscar?: string
    ciudad_id?: number
    page?: number
    activos?: boolean
    }): Promise<{ data: Persona[]; meta: { current_page: number; last_page: number; per_page: number; total: number } }> {
    const params: Record<string, string | number> = { per_page: 15, page: filters?.page || 1 }
    if (filters?.buscar) params.buscar = filters.buscar
    if (filters?.ciudad_id) params.ciudad_id = filters.ciudad_id
    if (filters?.activos !== undefined) params.activos = String(filters.activos)
    const res = await api.get<{ data: Record<string, unknown>[]; meta: { current_page: number; last_page: number; per_page: number; total: number } }>("/academic/instructores", { params })
    return { data: res.data.data.map(mapPersona), meta: res.data.meta }
  },

  async getDisponibles(): Promise<{ id: string; nombres: string; apellidos: string }[]> {
    const res = await api.get<{ data: { id: string; nombres: string; apellidos: string }[] }>(
      "/academic/instructores/disponibles"
    )
    return res.data.data
  },

  async getInstructorById(id: string): Promise<Persona> {
    const res = await api.get<{ data: Record<string, unknown> }>(`/academic/instructores/${id}`)
    return mapPersona(res.data.data)
  },

  async updatePerfil(id: string, data: { especialidad?: string; bio?: string }) {
    const res = await api.post(`/academic/instructores/${id}/perfil`, data)
    return res.data
  },

  async getCursos(id: string) {
    const res = await api.get(`/academic/instructores/${id}/cursos`)
    return res.data
  },

  async getHoras(id: string) {
    const res = await api.get(`/academic/instructores/${id}/horas`)
    return res.data
  },

  async getDetalle(id: string): Promise<InstructorDetail> {
    const res = await api.get<{ data: InstructorDetail }>(`/academic/instructores/${id}/detalle`)
    return res.data.data
  },
  async setActivo(id: string, es_activo: boolean) { return api.patch(`/academic/instructores/${id}/estado`, { es_activo }) },
  async subirHojaVida(id: string, archivo: File) {
    const form = new FormData(); form.append("archivo", archivo)
    return apiMultipart.post(`/academic/instructores/${id}/hoja-vida`, form)
  },
  async getHojaVida(id: string, download = false) {
    return api.get(`/academic/instructores/${id}/hoja-vida`, { params: download ? { download: 1 } : {}, responseType: "blob" })
  },
  async eliminarHojaVida(id: string) { return api.delete(`/academic/instructores/${id}/hoja-vida`) },
}

export interface InstructorDetail {
  persona: Persona
  perfil?: { especialidad?: string; bio?: string }
  cuenta?: { username?: string }
  cursos: Record<"actuales" | "proximos" | "historicos", CourseItem[]>
  talleres: Record<"actuales" | "proximos" | "historicos", WorkshopItem[]>
  pagos: Array<Record<string, unknown>>
  horas: Array<Record<string, unknown>>
  hoja_vida?: { nombre_original?: string; size?: number; updated_at?: string } | null
}
export interface CourseItem { id: string; nombre?: string; estado?: string; fecha_inicio?: string; fecha_fin?: string; es_personalizado?: boolean; catalogo?: { nombre?: string }; [key: string]: unknown }
export interface WorkshopItem { id: string; nombre?: string; estado?: string; fecha?: string; fecha_fin?: string; [key: string]: unknown }
