import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useQuery, useMutation, keepPreviousData } from "@tanstack/react-query"
import { estudiantesService, type Estudiante } from "@/services/estudiantes.service"
import { queryClient } from "@/lib/queryClient"
import { toast } from "sonner"

type PaymentFilter = "todos" | "deudor" | "abonado" | "al_dia"

interface Meta {
  actual: number
  ultima_pagina: number
  total: number
  per_page: number
}

interface UseStudentListOptions {
  extraFilters?: Record<string, string | number | undefined>
  pageSize?: number
  segmentId?: string | null
}

interface UseStudentListReturn {
  estudiantes: Estudiante[]
  loading: boolean
  search: string
  setSearch: (value: string) => void
  paymentFilter: PaymentFilter
  setPaymentFilter: (value: PaymentFilter) => void
  ciudadFilter: string
  setCiudadFilter: (value: string) => void
  ciudades: string[]
  stats: { todos: number; deudor: number; abonado: number; al_dia: number }
  meta: Meta | undefined
  selectedIds: Set<string>
  toggleSelect: (id: string) => void
  toggleSelectAll: () => void
  clearSelection: () => void
  loadPage: (page: number) => void
  deleteStudents: (ids: string[]) => Promise<void>
  refreshData: () => void
}

export function useStudentList(options: UseStudentListOptions = {}): UseStudentListReturn {
  const { extraFilters = {}, pageSize = 25, segmentId = null } = options

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("todos")
  const [ciudadFilter, setCiudadFilter] = useState("")
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState({ todos: 0, deudor: 0, abonado: 0, al_dia: 0 })
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const extraFiltersKey = useMemo(() => JSON.stringify(extraFilters), [extraFilters])

  const queryKey = [
    "estudiantes",
    "lista",
    {
      buscar: debouncedSearch,
      estado_pago: paymentFilter,
      ciudad: ciudadFilter,
      page,
      extra: extraFiltersKey,
      segmento: segmentId,
    },
  ]

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (segmentId) {
        const result = await estudiantesService.getSegmentStudents(segmentId)
        const filtered = result.estudiantes.filter((student) => {
          const term = debouncedSearch.trim().toLocaleLowerCase()
          const fullName = `${student.nombres} ${student.apellidos}`.toLocaleLowerCase()
          const city = student.ciudad?.nombre || student.perfil_estudiante?.ciudad || ""
          return (!term || fullName.includes(term) || (student.cedula || "").toLocaleLowerCase().includes(term) || (student.correo || "").toLocaleLowerCase().includes(term))
            && (paymentFilter === "todos" || student.estado_pago === paymentFilter)
            && (!ciudadFilter || city.toLocaleLowerCase() === ciudadFilter.toLocaleLowerCase())
        })
        const total = filtered.length
        const start = (page - 1) * pageSize
        return {
          datos: filtered.slice(start, start + pageSize),
          ciudades: [...new Set(result.estudiantes.map(e => e.ciudad?.nombre || e.perfil_estudiante?.ciudad).filter(Boolean))] as string[],
          stats: {
            todos: total,
            deudor: result.estudiantes.filter(e => e.estado_pago === "deudor").length,
            abonado: result.estudiantes.filter(e => e.estado_pago === "abonado").length,
            al_dia: result.estudiantes.filter(e => e.estado_pago === "al_dia").length,
          },
          meta: { actual: page, ultima_pagina: Math.max(1, Math.ceil(total / pageSize)), total, per_page: pageSize },
        }
      }
      const params: Record<string, string | number | undefined> = {
        buscar: debouncedSearch || undefined,
        estado_pago: paymentFilter !== "todos" ? paymentFilter : undefined,
        ciudad: ciudadFilter || undefined,
        per_page: pageSize,
        page,
        ...extraFilters,
      }
      return estudiantesService.getEstudiantes(params)
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  })

  const estudiantes = useMemo(() => query.data?.datos ?? [], [query.data])
  const meta = query.data?.meta
  const ciudades = query.data?.ciudades ?? []
  const loading = query.isLoading

  useEffect(() => {
    if (query.data?.stats && paymentFilter === "todos" && !debouncedSearch && !ciudadFilter) {
      setStats(query.data.stats)
    }
  }, [query.data, paymentFilter, debouncedSearch, ciudadFilter])

  useEffect(() => {
    setPage(1)
    setSelectedIds(new Set())
  }, [extraFiltersKey, segmentId])

  const handleSetSearch = useCallback((value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      setSelectedIds(new Set())
      setDebouncedSearch(value)
    }, 300)
  }, [])

  const handleSetPaymentFilter = useCallback((value: PaymentFilter) => {
    setPage(1)
    setSelectedIds(new Set())
    setPaymentFilter(value)
  }, [])

  const handleSetCiudadFilter = useCallback((value: string) => {
    setPage(1)
    setSelectedIds(new Set())
    setCiudadFilter(value)
  }, [])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === estudiantes.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(estudiantes.map(e => e.id)))
    }
  }, [estudiantes, selectedIds])

  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await estudiantesService.deleteStudents(ids)
    },
    onSuccess: (_data, ids) => {
      toast.success(`${ids.length} estudiante(s) eliminado(s)`)
      clearSelection()
      queryClient.invalidateQueries({ queryKey: ["estudiantes"] })
    },
    onError: () => {
      toast.error("Error al eliminar estudiantes")
    },
  })

  const deleteStudents = useCallback(
    (ids: string[]) => deleteMutation.mutateAsync(ids),
    [deleteMutation]
  )

  const loadPage = useCallback((p: number) => setPage(p), [])

  const refreshData = useCallback(async () => {
    await query.refetch()
  }, [query])

  return {
    estudiantes,
    loading,
    search,
    setSearch: handleSetSearch,
    paymentFilter,
    setPaymentFilter: handleSetPaymentFilter,
    ciudadFilter,
    setCiudadFilter: handleSetCiudadFilter,
    ciudades,
    stats,
    meta,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    loadPage,
    deleteStudents,
    refreshData,
  }
}
