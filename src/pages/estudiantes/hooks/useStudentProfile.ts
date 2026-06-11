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
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<ProfileTab>("informacion")

  const loadData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const [estudiante, academic, financial] = await Promise.allSettled([
        estudiantesService.getStudentById(id),
        estudiantesService.getAcademicProfile(id),
        estudiantesService.getFinancialProfile(id),
      ])
      if (estudiante.status === 'fulfilled') setStudentData(estudiante.value)
      else toast.error("Error al cargar datos del estudiante")
      if (academic.status === 'fulfilled') setAcademicData(academic.value)
      else toast.error("Error al cargar historial academico")
      if (financial.status === 'fulfilled') setFinancialData(financial.value)
      else toast.error("Error al cargar historial financiero")
    } catch {
      toast.error("Error al cargar el perfil")
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadData()
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
    activeTab,
    setActiveTab,
    refreshData: loadData,
    updateStudentInfo,
    saving,
  }
}
