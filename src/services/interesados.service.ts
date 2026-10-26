import api, { apiMultipart } from "./auth.service"

export interface Interesado {
  id: string
  curso_abierto_id?: string | null
  taller_id?: string | null
  nombres: string
  apellidos: string
  telefono: string
  cedula?: string | null
  correo?: string | null
  monto_pago_anticipo?: number | null
  comprobante_url?: string | null
  observaciones?: string | null
  estado_embudo: "solo_interesado" | "solicitud_pendiente" | "matriculado"
  es_mismo_curso?: boolean
  curso_registrado?: string | null
  estado_info?: {
    solicitud_id?: string | null
    matricula_id?: string | null
    codigo_matricula?: string | null
    fecha_solicitud?: string | null
    fecha_matricula?: string | null
  }
  creado_por?: {
    id: number
    name: string
  } | null
  created_at?: string
  updated_at?: string
}

export interface InteresadosKPIs {
  total_interesados: number
  solicitudes_pendientes: number
  matriculados: number
  solo_interesados: number
  total_anticipos: number
}

export interface InteresadosResponse {
  interesados: Interesado[]
  kpis: InteresadosKPIs
}

export interface GuardarInteresadoPayload {
  nombres: string
  apellidos: string
  telefono: string
  cedula?: string
  correo?: string
  monto_pago_anticipo?: number | string | null
  comprobante_url?: string | null
  observaciones?: string | null
}

function parseInteresadosResponse(raw: unknown): InteresadosResponse {
  const root = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>
  const payload =
    (root.data && typeof root.data === "object" ? root.data : root) as Record<string, unknown>

  const listaRaw = Array.isArray(payload.interesados)
    ? payload.interesados
    : Array.isArray(payload.datos)
    ? payload.datos
    : Array.isArray(root.interesados)
    ? root.interesados
    : Array.isArray(root.datos)
    ? root.datos
    : []

  const kpisRaw =
    (payload.kpis && typeof payload.kpis === "object"
      ? payload.kpis
      : payload.totales && typeof payload.totales === "object"
      ? payload.totales
      : root.kpis && typeof root.kpis === "object"
      ? root.kpis
      : root.totales && typeof root.totales === "object"
      ? root.totales
      : {}) as Record<string, unknown>

  const interesados: Interesado[] = (listaRaw as Record<string, unknown>[]).map((item) => ({
    id: String(item.id || ""),
    curso_abierto_id: (item.curso_abierto_id as string) ?? null,
    taller_id: (item.taller_id as string) ?? null,
    nombres: String(item.nombres || ""),
    apellidos: String(item.apellidos || ""),
    telefono: String(item.telefono || ""),
    cedula: (item.cedula as string) ?? null,
    correo: (item.correo as string) ?? null,
    monto_pago_anticipo: Number(item.monto_pago_anticipo) || 0,
    comprobante_url: (item.comprobante_url as string) ?? null,
    observaciones: (item.observaciones as string) ?? null,
    estado_embudo: ((item.estado_embudo || item.estado_seguimiento || "solo_interesado") as Interesado["estado_embudo"]),
    es_mismo_curso: item.es_mismo_curso !== undefined ? Boolean(item.es_mismo_curso) : true,
    curso_registrado: (item.curso_registrado as string) ?? null,
    estado_info: {
      solicitud_id: (item.solicitud_id as string) ?? null,
      matricula_id: (item.matricula_id as string) ?? null,
      fecha_solicitud: (item.fecha_registro as string) ?? null,
    },
    created_at: (item.fecha_registro as string) ?? (item.created_at as string) ?? undefined,
  }))

  const kpis: InteresadosKPIs = {
    total_interesados: Number(kpisRaw.total_interesados ?? kpisRaw.total ?? interesados.length) || 0,
    solicitudes_pendientes: Number(kpisRaw.solicitudes_pendientes) || 0,
    matriculados: Number(kpisRaw.matriculados) || 0,
    solo_interesados: Number(kpisRaw.solo_interesados) || 0,
    total_anticipos: Number(kpisRaw.total_anticipos) || 0,
  }

  return { interesados, kpis }
}

function parseSingleInteresado(raw: unknown): Interesado {
  const root = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>
  const item = ((root.data || root.datos || root) && typeof (root.data || root.datos || root) === "object"
    ? (root.data || root.datos || root)
    : {}) as Record<string, unknown>

  return {
    id: String(item.id || ""),
    curso_abierto_id: (item.curso_abierto_id as string) ?? null,
    taller_id: (item.taller_id as string) ?? null,
    nombres: String(item.nombres || ""),
    apellidos: String(item.apellidos || ""),
    telefono: String(item.telefono || ""),
    cedula: (item.cedula as string) ?? null,
    correo: (item.correo as string) ?? null,
    monto_pago_anticipo: Number(item.monto_pago_anticipo) || 0,
    comprobante_url: (item.comprobante_url as string) ?? null,
    observaciones: (item.observaciones as string) ?? null,
    estado_embudo: ((item.estado_embudo || item.estado_seguimiento || "solo_interesado") as Interesado["estado_embudo"]),
    es_mismo_curso: item.es_mismo_curso !== undefined ? Boolean(item.es_mismo_curso) : true,
    curso_registrado: (item.curso_registrado as string) ?? null,
    estado_info: {
      solicitud_id: (item.solicitud_id as string) ?? null,
      matricula_id: (item.matricula_id as string) ?? null,
    },
  }
}

export const interesadosService = {
  async getInteresadosCurso(cursoId: string): Promise<InteresadosResponse> {
    const res = await api.get(`/cursos/${cursoId}/interesados`)
    return parseInteresadosResponse(res.data)
  },

  async getInteresadosTaller(tallerId: string): Promise<InteresadosResponse> {
    const res = await api.get(`/talleres/${tallerId}/interesados`)
    return parseInteresadosResponse(res.data)
  },

  async crearInteresadoCurso(cursoId: string, payload: GuardarInteresadoPayload): Promise<Interesado> {
    const res = await api.post(`/cursos/${cursoId}/interesados`, payload)
    return parseSingleInteresado(res.data)
  },

  async crearInteresadoTaller(tallerId: string, payload: GuardarInteresadoPayload): Promise<Interesado> {
    const res = await api.post(`/talleres/${tallerId}/interesados`, payload)
    return parseSingleInteresado(res.data)
  },

  async actualizarInteresado(id: string, payload: GuardarInteresadoPayload): Promise<Interesado> {
    const res = await api.put(`/interesados/${id}`, payload)
    return parseSingleInteresado(res.data)
  },

  async eliminarInteresado(id: string): Promise<void> {
    await api.delete(`/interesados/${id}`)
  },

  async uploadComprobante(file: File): Promise<string> {
    const formData = new FormData()
    formData.append("comprobante", file)
    formData.append("archivo", file)
    const res = await apiMultipart.post<{ success: boolean; url: string; path: string }>(
      "/interesados/upload-comprobante",
      formData
    )
    return res.data?.url || ""
  },
}
