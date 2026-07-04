import { useState, useEffect, useCallback } from "react"
import { tareasService, type TareaStaff, type TareaFilters } from "@/services/tareas.service"

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
      const res = await tareasService.getTareas(filters)
      setState({
        tareas: res.tareas,
        loading: false,
        totales: res.totales,
        currentPage: res.meta.current_page,
        lastPage: res.meta.last_page,
      })
    } catch {
      setState((prev) => ({ ...prev, loading: false }))
    }
  }, [filters])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
