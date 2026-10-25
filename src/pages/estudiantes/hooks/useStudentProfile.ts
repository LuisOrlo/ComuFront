import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "react-router"
import {
  estudiantesService,
  type AcademicProfile,
  type FinancialProfile,
  type Estudiante,
} from "@/services/estudiantes.service"
import { toast } from "sonner"

type ProfileTab = "informacion" | "resumen" | "academico" | "financiero"
const VALID_TABS: ProfileTab[] = ["informacion", "resumen", "academico", "financiero"]

interface UseStudentProfileReturn {
  studentData: Estudiante | null
  academicData: AcademicProfile | null
  financialData: FinancialProfile | null
  loading: boolean
  academicLoading: boolean
  financialLoading: boolean
  notFound: boolean
  activeTab: ProfileTab
  setActiveTab: (tab: ProfileTab) => void
  refreshData: () => void
  updateStudentInfo: (fields: Record<string, string | number | undefined>) => Promise<void>
  saving: boolean
}

export function useStudentProfile(id: string | undefined): UseStudentProfileReturn {
  const [searchParams] = useSearchParams()
  const initialTabParam = searchParams.get("tab") as ProfileTab | null
  const initialTab = initialTabParam && VALID_TABS.includes(initialTabParam) ? initialTabParam : "informacion"

  const [studentData, setStudentData] = useState<Estudiante | null>(null)
  const [academicData, setAcademicData] = useState<AcademicProfile | null>(null)
  const [financialData, setFinancialData] = useState<FinancialProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [academicLoading, setAcademicLoading] = useState(false)
  const [financialLoading, setFinancialLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab)

  useEffect(() => {
    const tabParam = searchParams.get("tab") as ProfileTab | null
    if (tabParam && VALID_TABS.includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  const loadData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setNotFound(false)
    try {
      const estudiante = await estudiantesService.getStudentById(id)
      setStudentData(estudiante)
    } catch (error) {
      setStudentData(null)
      if ((error as { response?: { status?: number } })?.response?.status === 404) setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  const loadAcademicData = useCallback(async () => {
    if (!id || notFound || academicData || academicLoading) return
    setAcademicLoading(true)
    try { setAcademicData(await estudiantesService.getAcademicProfile(id)) }
    catch { setAcademicData(null) }
    finally { setAcademicLoading(false) }
  }, [id, notFound, academicData, academicLoading])

  const loadFinancialData = useCallback(async () => {
    if (!id || notFound || financialData || financialLoading) return
    setFinancialLoading(true)
    try { setFinancialData(await estudiantesService.getFinancialProfile(id)) }
    catch { setFinancialData(null) }
    finally { setFinancialLoading(false) }
  }, [id, notFound, financialData, financialLoading])

  useEffect(() => {
    if (activeTab === "informacion" || activeTab === "academico" || activeTab === "resumen") {
      void loadAcademicData()
    }
    if (activeTab === "financiero" || activeTab === "resumen") {
      void loadFinancialData()
    }
  }, [activeTab, loadAcademicData, loadFinancialData])

  useEffect(() => {
    if (id) {
      setAcademicData(null)
      setFinancialData(null)
      void loadData()
    }
  }, [id, loadData])

  const refreshData = useCallback(async () => {
    if (!id) return
    setAcademicLoading(true)
    setFinancialLoading(true)
    try {
      const [, academic, financial] = await Promise.all([
        loadData(),
        estudiantesService.getAcademicProfile(id),
        estudiantesService.getFinancialProfile(id),
      ])
      setAcademicData(academic)
      setFinancialData(financial)
    } finally {
      setAcademicLoading(false)
      setFinancialLoading(false)
    }
  }, [id, loadData])

  const updateStudentInfo = useCallback(async (fields: Record<string, string | number | undefined>) => {
    if (!id) return
    setSaving(true)
    try {
      await estudiantesService.updateStudent(id, fields)
      toast.success("Información actualizada")
      await loadData()
      void refreshData()
    } catch (err) {
      toast.error((err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje || "Error al actualizar")
    } finally {
      setSaving(false)
    }
  }, [id, loadData, refreshData])

  return {
    studentData,
    academicData,
    financialData,
    loading,
    academicLoading,
    financialLoading,
    notFound,
    activeTab,
    setActiveTab,
    refreshData,
    updateStudentInfo,
    saving,
  }
}
