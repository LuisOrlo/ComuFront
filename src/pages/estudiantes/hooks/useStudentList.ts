import { useState, useEffect, useCallback } from "react"
import { estudiantesService, type Estudiante } from "@/services/estudiantes.service"
import { toast } from "sonner"

type PaymentFilter = "todos" | "deudor" | "abonado" | "al_dia"

interface Meta {
  actual: number
  ultima_pagina: number
  total: number
  per_page: number
}

interface UseStudentListReturn {
  estudiantes: Estudiante[]
  loading: boolean
  search: string
  setSearch: (value: string) => void
  paymentFilter: PaymentFilter
  setPaymentFilter: (value: PaymentFilter) => void
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

export function useStudentList(): UseStudentListReturn {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("todos")
  const [stats, setStats] = useState({ todos: 0, deudor: 0, abonado: 0, al_dia: 0 })
  const [meta, setMeta] = useState<Meta | undefined>(undefined)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const loadData = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const response = await estudiantesService.getEstudiantes({
        buscar: search || undefined,
        estado_pago: paymentFilter !== "todos" ? paymentFilter : undefined,
        page,
      })
      setEstudiantes(response.datos)
      setMeta(response.meta ?? undefined)
      if (response.stats) setStats(response.stats)
    } catch {
      toast.error("Error al cargar estudiantes")
    } finally {
      setLoading(false)
    }
  }, [search, paymentFilter])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

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

  const deleteStudents = useCallback(async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => estudiantesService.deleteStudent(id)))
      toast.success(`${ids.length} estudiante(s) eliminado(s)`)
      clearSelection()
      loadData()
    } catch {
      toast.error("Error al eliminar estudiantes")
    }
  }, [clearSelection, loadData])

  return {
    estudiantes,
    loading,
    search,
    setSearch,
    paymentFilter,
    setPaymentFilter,
    stats,
    meta,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    loadPage: loadData,
    deleteStudents,
    refreshData: () => loadData(),
  }
}
