import { useQuery } from "@tanstack/react-query"
import api from "@/services/auth.service"
import { cursosService, type CatalogoCurso, type CursoAbierto } from "@/services/cursos.service"
import type { Taller } from "@/services/taller.service"

interface UseCursosParams {
  modalidad: string
  ciudadId: number | null
  catalogoFilter?: string
  enabled?: boolean
}

interface UseTalleresParams {
  modalidad: string
  ciudadId: number | null
  enabled?: boolean
}

export function useCatalogos(enabled: boolean) {
  return useQuery<CatalogoCurso[]>({
    queryKey: ["catalogos"],
    queryFn: () => cursosService.getCatalogos().then(res => res.data || []),
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCursosAbiertos({ modalidad, ciudadId, catalogoFilter, enabled }: UseCursosParams) {
  return useQuery<CursoAbierto[]>({
    queryKey: ["cursos-abiertos", modalidad, ciudadId, catalogoFilter],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        per_page: 50,
        dias_desde_inicio: 7,
      }
      if (catalogoFilter) params.catalogo_curso_id = catalogoFilter
      if (modalidad) params.modalidad = modalidad
      if (ciudadId) params.ciudad_id = ciudadId
      const res = await api.get("/cursos-abiertos", { params })
      return res.data.data || []
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}

export function useTalleres({ modalidad, ciudadId, enabled }: UseTalleresParams) {
  return useQuery<Taller[]>({
    queryKey: ["talleres", modalidad, ciudadId],
    queryFn: async () => {
      const params: Record<string, unknown> = {
        per_page: 50,
        tab: "proximos",
      }
      if (modalidad) params.modalidad = modalidad
      if (ciudadId) params.ciudad_id = ciudadId
      const res = await api.get("/talleres", { params })
      return (res.data as { data: Taller[] }).data || []
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}
