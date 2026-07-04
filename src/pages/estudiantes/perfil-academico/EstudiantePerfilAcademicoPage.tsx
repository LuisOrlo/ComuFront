import { useParams, Link } from "react-router"
import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, AddCircleIcon } from "@hugeicons/core-free-icons"
import { useStudentProfile } from "../hooks/useStudentProfile"
import { ProfileHeader } from "../sections/ProfileHeader"
import { InfoTabContent } from "../sections/InfoTabContent"
import { OverviewTabContent } from "../sections/OverviewTabContent"
import { AcademicTabContent } from "../sections/AcademicTabContent"
import { FinancialTabContent } from "../sections/FinancialTabContent"
import { PagoInicialMatriculaModal } from "../components/PagoInicialMatriculaModal"
import { COLORS } from "@/lib/constants"

const tabs = [
  { key: "informacion" as const, label: "Informacion" },
  { key: "resumen" as const, label: "Resumen" },
  { key: "academico" as const, label: "Academico" },
  { key: "financiero" as const, label: "Financiero" },
]

export function EstudiantePerfilAcademicoPage() {
  const { id } = useParams<{ id: string }>()
  const [pagoInicialOpen, setPagoInicialOpen] = useState(false)
  const [pagoInicialData, setPagoInicialData] = useState<{
    lineasPagoIds: string[]
    matriculaId: string
    cursoNombre: string
  } | null>(null)
  const {
    studentData,
    academicData,
    financialData,
    loading,
    notFound,
    activeTab,
    setActiveTab,
    updateStudentInfo,
    saving,
    refreshData,
  } = useStudentProfile(id)

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin size-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
        <span className="text-sm text-gray-400 font-medium">Cargando perfil del estudiante...</span>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Estudiante no encontrado.</p>
        <Link to="/estudiantes" className="text-sm font-bold mt-4 inline-block" style={{ color: COLORS.ACCENT }}>
          Volver al listado
        </Link>
      </div>
    )
  }

  if (!studentData && !academicData && !financialData) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No se encontro informacion del estudiante.</p>
        <Link to="/estudiantes" className="text-sm font-bold mt-4 inline-block" style={{ color: COLORS.ACCENT }}>
          Volver al listado
        </Link>
      </div>
    )
  }

  const name = studentData
    ? `${studentData.nombres} ${studentData.apellidos}`
    : (academicData?.estudiante.nombre_completo || financialData?.estudiante.nombre_completo || '')

  const totalCursos = studentData?.total_cursos || academicData?.matriculas.length || 0
  const resumen = financialData?.resumen

  let estadoPago = 'ninguno'
  if (resumen) {
    if (resumen.total_adeudado <= 0 && resumen.cuentas_pagadas > 0) estadoPago = 'al_dia'
    else if (resumen.cuentas_abonadas > 0) estadoPago = 'abonado'
    else if (resumen.cuentas_pendientes > 0) estadoPago = 'deudor'
  } else if (studentData) {
    estadoPago = studentData.estado_pago
  }

  const saldoPendiente = resumen?.total_adeudado || studentData?.saldo_pendiente || 0

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <Link
          to="/estudiantes"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
          Volver a listado de estudiantes
        </Link>
        <Link
          to={`/estudiantes/${id}/inscribir`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all active:scale-[0.97]"
          style={{ backgroundColor: COLORS.ACCENT }}
        >
          <HugeiconsIcon icon={AddCircleIcon} size={16} />
          Inscribir a nuevo curso/taller
        </Link>
      </div>

      <ProfileHeader
        estudiante={{
          id: id || '',
          nombre_completo: name,
          cedula: studentData?.cedula || academicData?.estudiante.cedula || '',
          correo: studentData?.correo || academicData?.estudiante.correo || '',
          celular: studentData?.celular,
          ciudad: studentData?.perfil_estudiante?.ciudad || studentData?.ciudad?.nombre,
          fecha_nacimiento: studentData?.perfil_estudiante?.fecha_nacimiento,
        }}
        totalCursos={totalCursos}
        estadoPago={estadoPago}
        saldoPendiente={saldoPendiente}
        onUpdate={(fields) => updateStudentInfo(fields)}
        saving={saving}
      />

      <div className="bg-white border rounded-2xl overflow-hidden">
        <div className="flex border-b overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-5 py-3.5 text-sm font-bold whitespace-nowrap transition-colors ${
                activeTab === tab.key ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ backgroundColor: COLORS.ACCENT }} />
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === "informacion" && (
            <InfoTabContent data={studentData} academicData={academicData} loading={loading} onRefresh={refreshData} />
          )}
          {activeTab === "resumen" && (
            <OverviewTabContent
              academicData={academicData}
              financialData={financialData}
              academicLoading={loading && !academicData}
              financialLoading={loading && !financialData}
            />
          )}
          {activeTab === "academico" && (
            <AcademicTabContent data={academicData} loading={loading && !academicData} />
          )}
          {activeTab === "financiero" && (
            <FinancialTabContent data={financialData} loading={loading && !financialData}
              onPagoInicial={(data) => { setPagoInicialData(data); setPagoInicialOpen(true) }} />
          )}
        </div>
      </div>

      {pagoInicialData && (
        <PagoInicialMatriculaModal
          open={pagoInicialOpen}
          onOpenChange={setPagoInicialOpen}
          lineasPagoIds={pagoInicialData.lineasPagoIds}
          matriculaId={pagoInicialData.matriculaId}
          cursoNombre={pagoInicialData.cursoNombre}
          onCompleted={() => { setPagoInicialOpen(false); setPagoInicialData(null) }}
        />
      )}
    </div>
  )
}
