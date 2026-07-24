import { useParams, Link } from "react-router"
import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, AddCircleIcon, ImageIcon, Delete02Icon } from "@hugeicons/core-free-icons"
import { useStudentProfile } from "../hooks/useStudentProfile"
import { ProfileHeader } from "../sections/ProfileHeader"
import { InfoTabContent } from "../sections/InfoTabContent"
import { OverviewTabContent } from "../sections/OverviewTabContent"
import { AcademicTabContent } from "../sections/AcademicTabContent"
import { FinancialTabContent } from "../sections/FinancialTabContent"
import { ConfirmationModal } from "@/components/ConfirmationModal"
import { ImageZoom } from "@/pages/matriculas/ImageZoom"
import { estudiantesService } from "@/services/estudiantes.service"
import { toast } from "sonner"
import { getStorageUrl } from "@/lib/utils"
import { COLORS } from "@/lib/constants"

const tabs = [
  { key: "informacion" as const, label: "Informacion" },
  { key: "resumen" as const, label: "Resumen" },
  { key: "academico" as const, label: "Academico" },
  { key: "financiero" as const, label: "Financiero" },
]

export function EstudiantePerfilAcademicoPage() {
  const { id } = useParams<{ id: string }>()
  const [deleteCedulaOpen, setDeleteCedulaOpen] = useState(false)
  const [deletingCedula, setDeletingCedula] = useState(false)
  const [cedulaPurgado, setCedulaPurgado] = useState(false)
  const [showCedulaModal, setShowCedulaModal] = useState(false)
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

  const cedulaUrl = studentData?.cedula_photo_url
  const isCedulaPurgado = cedulaPurgado || (studentData?.cedula_purgado === true)

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

  const totalCursos = studentData?.total_cursos ?? academicData?.matriculas.length ?? 0
  const totalTalleres = studentData?.total_talleres ?? 0
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

  const handleDeleteCedula = async () => {
    if (!id) return
    setDeleteCedulaOpen(false)
    setDeletingCedula(true)
    try {
      await estudiantesService.deleteArchivoCedula(id)
      toast.success("Foto de cédula eliminada")
      setCedulaPurgado(true)
    } catch { toast.error("Error al eliminar cédula") }
    finally { setDeletingCedula(false) }
  }

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
        totalTalleres={totalTalleres}
        estadoPago={estadoPago}
        saldoPendiente={saldoPendiente}
        onUpdate={(fields) => updateStudentInfo(fields)}
        saving={saving}
      />

      <div className="bg-white border rounded-2xl p-4 mb-6 flex items-center gap-6" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex items-center gap-3">
          <HugeiconsIcon icon={ImageIcon} size={18} style={{ color: COLORS.ACCENT }} />
          <span className="text-sm font-bold" style={{ color: COLORS.CHARCOAL }}>Foto de Cédula</span>
        </div>

        {isCedulaPurgado ? (
          <div className="flex items-center gap-4 flex-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-50 px-3 py-1.5 rounded-full border border-red-200">
              <HugeiconsIcon icon={ImageIcon} size={12} />
              Cédula eliminada del almacenamiento
            </span>
          </div>
        ) : cedulaUrl ? (
          <div className="flex items-center gap-4 flex-1">
            <div className="size-16 rounded-xl border overflow-hidden bg-gray-50 shrink-0" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <img src={getStorageUrl(cedulaUrl)} alt="Cédula"
                className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowCedulaModal(true)}
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold border hover:bg-gray-50 transition-colors"
                style={{ borderColor: COLORS.BORDER_SUBTLE, color: COLORS.CHARCOAL }}
              >
                Ver completa
              </button>
              <button onClick={() => setDeleteCedulaOpen(true)} disabled={deletingCedula}
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-red-500 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50">
                <HugeiconsIcon icon={Delete02Icon} size={12} className="inline mr-1" />
                Eliminar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs opacity-50">Sin foto de cédula</span>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={deleteCedulaOpen}
        title="Eliminar foto de cédula"
        message="¿Eliminar la foto de cédula del almacenamiento? El registro se conservará como constancia histórica. Esta acción es irreversible."
        confirmText="Eliminar"
        cancelText="Cancelar"
        isLoading={deletingCedula}
        icon="danger"
        onConfirm={handleDeleteCedula}
        onCancel={() => setDeleteCedulaOpen(false)}
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
            <FinancialTabContent data={financialData} loading={loading && !financialData} />
          )}
        </div>
      </div>

      {showCedulaModal && cedulaUrl && (
        <ImageZoom
          url={getStorageUrl(cedulaUrl)}
          onClose={() => setShowCedulaModal(false)}
        />
      )}
    </div>
  )
}
