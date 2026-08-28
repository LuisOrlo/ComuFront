import { useState, useEffect, useCallback } from "react"
import {
  estudiantesService,
  type AcademicProfile,
  type FinancialProfile,
  type Estudiante,
} from "@/services/estudiantes.service"
import { toast } from "sonner"

type ProfileTab = "informacion" | "resumen" | "academico" | "financiero"

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
  const [studentData, setStudentData] = useState<Estudiante | null>(null)
  const [academicData, setAcademicData] = useState<AcademicProfile | null>(null)
  const [financialData, setFinancialData] = useState<FinancialProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [academicLoading, setAcademicLoading] = useState(false)
  const [financialLoading, setFinancialLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<ProfileTab>("informacion")

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
    if (!id || academicData || academicLoading) return
    setAcademicLoading(true)
    try { setAcademicData(await estudiantesService.getAcademicProfile(id)) }
    catch { setAcademicData(null) }
    finally { setAcademicLoading(false) }
  }, [id, academicData, academicLoading])

  const loadFinancialData = useCallback(async () => {
    if (!id || financialData || financialLoading) return
    setFinancialLoading(true)
    try { setFinancialData(await estudiantesService.getFinancialProfile(id)) }
    catch { setFinancialData(null) }
    finally { setFinancialLoading(false) }
  }, [id, financialData, financialLoading])

  useEffect(() => {
    if (activeTab === "academico") void loadAcademicData()
    if (activeTab === "financiero") void loadFinancialData()
    if (activeTab === "resumen") {
      void loadAcademicData()
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
      toast.success("Informacion actualizada")
      loadData()
    } catch (err) {
      toast.error((err as { response?: { data?: { mensaje?: string } } })?.response?.data?.mensaje || "Error al actualizar")
    } finally {
      setSaving(false)
    }
  }, [id, loadData])

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
