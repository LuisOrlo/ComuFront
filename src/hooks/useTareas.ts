/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react"
import { tareasService, type TareaStaff, type TareaFilters } from "@/services/tareas.service"
import { edicionVideoService } from "@/services/edicion-video.service"

interface TareasState {
  tareas: TareaStaff[]
  loading: boolean
  totales: { total: number; pendiente: number; en_progreso: number; completada: number }
  currentPage: number
  lastPage: number
}

export function useTareas() {
  const [state, setState] = useState<TareasState>({
    tareas: [],
    loading: true,
    totales: { total: 0, pendiente: 0, en_progreso: 0, completada: 0 },
    currentPage: 1,
    lastPage: 1,
  })

  const [filters, setFilters] = useState<TareaFilters>({
    page: 1,
    per_page: 15,
    sort: "created_at",
    dir: "desc",
  })

  const fetchTareas = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }))
    try {
      const [res, trabajosRes] = await Promise.all([
        tareasService.getTareas(filters),
        edicionVideoService.getTrabajos({ per_page: 100 }),
      ])

      const trabajos: TareaStaff[] = (trabajosRes.data || [])
        .filter((trabajo) => trabajo.estado !== "entregado" && trabajo.editor_ids && trabajo.editor_ids.length > 0)
        .flatMap((trabajo): (TareaStaff | null)[] =>
          trabajo.editor_ids.map((editorId) => {
            const editor = trabajo.editores?.find((persona) => persona.id === editorId)
            if (!editor) return null

            return {
              id: `edicion-video-${trabajo.id}-${editor.id}`,
              titulo: `Edición de video: ${trabajo.titulo}`,
              descripcion: trabajo.descripcion,
              persona_id: editor.id,
              persona: { ...editor, tipo: "staff" },
              fecha_inicio: trabajo.fecha_recibo,
              fecha_fin: trabajo.fecha_limite,
              estado: trabajo.estado === "recibido" ? "pendiente" : "en_progreso",
              created_at: trabajo.created_at || trabajo.fecha_recibo,
              origen: "edicion_video" as const,
              trabajo_id: trabajo.id,
            } satisfies TareaStaff
          })
        )
        .filter((tarea): tarea is TareaStaff => tarea !== null)

      // Filtrar los trabajos de edición de video con los filtros activos
      const trabajosFiltrados = trabajos.filter((t) => {
        if (filters.estado && t.estado !== filters.estado) return false
        if (filters.persona_id && t.persona_id !== filters.persona_id) return false
        if (filters.titulo) {
          const query = filters.titulo.toLowerCase()
          const matchTitulo = t.titulo.toLowerCase().includes(query)
          const matchDesc = t.descripcion ? t.descripcion.toLowerCase().includes(query) : false
          if (!matchTitulo && !matchDesc) return false
        }
        return true
      })

      // Sumar los totales de ambas fuentes (tareas manuales + trabajos de video)
      const totalesCombinados = {
        total: (res.totales?.total || 0) + trabajos.length,
        pendiente:
          (res.totales?.pendiente || 0) +
          trabajos.filter((t) => t.estado === "pendiente").length,
        en_progreso:
          (res.totales?.en_progreso || 0) +
          trabajos.filter((t) => t.estado === "en_progreso").length,
        completada:
          (res.totales?.completada || 0) +
          trabajos.filter((t) => t.estado === "completada").length,
      }

      // Combinar y ordenar
      const tareasCombinadas = [...res.tareas, ...trabajosFiltrados].sort((a, b) => {
        const dir = filters.dir === "asc" ? 1 : -1
        const field = filters.sort || "created_at"
        const valA = (a as any)[field] || ""
        const valB = (b as any)[field] || ""
        if (valA < valB) return -1 * dir
        if (valA > valB) return 1 * dir
        return 0
      })

      setState({
        tareas: tareasCombinadas,
        loading: false,
        totales: totalesCombinados,
        currentPage: res.meta?.current_page || 1,
        lastPage: Math.max(1, res.meta?.last_page || 1),
      })
    } catch {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }, [filters])

  useEffect(() => {
    fetchTareas()
  }, [fetchTareas])

  const setFiltro = useCallback((key: keyof TareaFilters, value: string | number | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }))
  }, [])

  const setPagina = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }))
  }, [])

  const setOrden = useCallback((field: string) => {
    setFilters((prev) => {
      if (prev.sort === field) {
        return { ...prev, dir: prev.dir === "asc" ? "desc" : "asc", page: 1 }
      }
      return { ...prev, sort: field, dir: "desc", page: 1 }
    })
  }, [])

  return {
    ...state,
    filters,
    setFiltro,
    setPagina,
    setOrden,
    recargar: fetchTareas,
  }
}
