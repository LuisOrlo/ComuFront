import { useParams, Link, useNavigate } from "react-router"
import { useState } from "react"
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
import {
  ArrowLeft,
  User,
  LayoutDashboard,
  GraduationCap,
  CreditCard,
  CheckCircle2,
  ZoomIn,
  Eye,
  Trash2,
  FileText,
} from "lucide-react"

export function EstudiantePerfilAcademicoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [deleteCedulaOpen, setDeleteCedulaOpen] = useState(false)
  const [deletingCedula, setDeletingCedula] = useState(false)
  const [cedulaPurgado, setCedulaPurgado] = useState(false)
  const [showCedulaModal, setShowCedulaModal] = useState(false)
  const {
    studentData,
    academicData,
    financialData,
    loading,
    academicLoading,
    financialLoading,
    notFound,
    activeTab,
    setActiveTab,
    updateStudentInfo,
    refreshData,
  } = useStudentProfile(id)

  const cedulaUrl = studentData?.cedula_photo_url
  const isCedulaPurgado = cedulaPurgado || studentData?.cedula_purgado === true

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="animate-spin size-8 border-2 border-[#fd761a] border-t-transparent rounded-full mx-auto mb-4" />
        <span className="text-sm text-slate-500 font-medium">Cargando expediente del estudiante...</span>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl shadow-sm border border-slate-100 max-w-xl mx-auto my-12">
        <p className="text-slate-600 font-medium">Estudiante no encontrado.</p>
        <Link
          to="/estudiantes"
          className="text-xs font-bold text-[#fd761a] hover:underline mt-4 inline-block"
        >
          ← Volver al listado de estudiantes
        </Link>
      </div>
    )
  }

  if (!studentData && !academicData && !financialData) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl shadow-sm border border-slate-100 max-w-xl mx-auto my-12">
        <p className="text-slate-600 font-medium">No se encontró información del estudiante.</p>
        <Link
          to="/estudiantes"
          className="text-xs font-bold text-[#fd761a] hover:underline mt-4 inline-block"
        >
          ← Volver al listado de estudiantes
        </Link>
      </div>
    )
  }

  const name = studentData
    ? `${studentData.nombres} ${studentData.apellidos}`
    : academicData?.estudiante.nombre_completo || financialData?.estudiante.nombre_completo || ""

  const totalCursos = studentData?.total_cursos ?? academicData?.matriculas.length ?? 0
  const totalTalleres = studentData?.total_talleres ?? 0
  const resumen = financialData?.resumen

  let estadoPago = "ninguno"
  if (resumen) {
    if (resumen.total_adeudado <= 0 && resumen.cuentas_pagadas > 0) estadoPago = "al_dia"
    else if (resumen.cuentas_abonadas > 0) estadoPago = "abonado"
    else if (resumen.cuentas_pendientes > 0) estadoPago = "deudor"
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
      toast.success("Foto de cédula eliminada del almacenamiento")
      setCedulaPurgado(true)
    } catch {
      toast.error("Error al eliminar foto de cédula")
    } finally {
      setDeletingCedula(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff]/60 pb-16">
      {/* TOP CONTEXT BAR */}
      <div className="w-full bg-white border-b border-slate-100 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          <Link
            to="/estudiantes"
            className="inline-flex items-center gap-1.5 font-semibold text-slate-500 hover:text-[#fd761a] transition-colors py-1 text-xs"
          >
            <ArrowLeft className="size-4" />
            <span>Volver al listado de estudiantes</span>
          </Link>
        </div>
      </div>

      {/* MAIN VIEWPORT CONTAINER */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* STUDENT IDENTITY HEADER HERO */}
        <ProfileHeader
          estudiante={{
            id: id || "",
            nombre_completo: name,
            cedula: studentData?.cedula || academicData?.estudiante.cedula || "",
            correo: studentData?.correo || academicData?.estudiante.correo || "",
            celular: studentData?.celular,
            ciudad: studentData?.perfil_estudiante?.ciudad || studentData?.ciudad?.nombre,
          }}
          totalCursos={totalCursos}
          totalTalleres={totalTalleres}
          estadoPago={estadoPago}
          saldoPendiente={saldoPendiente}
          onInscribir={() => id && navigate(`/estudiantes/${id}/inscribir`)}
        />

        {/* IDENTITY DOCUMENT COMPACT STRIP */}
        <div className="w-full bg-white rounded-xl p-3 px-4 shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Thumbnail or Icon */}
            {isCedulaPurgado ? (
              <div className="w-16 h-11 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <FileText className="size-5 text-rose-500" />
              </div>
            ) : cedulaUrl ? (
              <div
                className="relative shrink-0 group cursor-pointer"
                onClick={() => setShowCedulaModal(true)}
              >
                <img
                  alt={`Cédula de ${name}`}
                  className="w-16 h-11 object-cover rounded-lg shadow-xs border border-slate-200"
                  src={getStorageUrl(cedulaUrl)}
                />
                <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="text-white size-4" />
                </div>
              </div>
            ) : (
              <div className="w-16 h-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                <FileText className="size-5 text-slate-400" />
              </div>
            )}

            {/* Info details */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Cédula de Identidad</span>
                {isCedulaPurgado ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-semibold">
                    Documento purgado del almacenamiento
                  </span>
                ) : cedulaUrl ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                    <CheckCircle2 className="size-3" />
                    Documento cargado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                    Sin documento registrado
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500 mt-0.5">
                Documento oficial de identidad · C.I.{" "}
                {studentData?.cedula || academicData?.estudiante?.cedula || "—"}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            {cedulaUrl && !isCedulaPurgado && (
              <>
                <button
                  type="button"
                  onClick={() => setShowCedulaModal(true)}
                  className="h-8 px-3 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="size-3.5" />
                  <span>Ver imagen</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteCedulaOpen(true)}
                  disabled={deletingCedula}
                  className="h-8 px-2.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors inline-flex items-center justify-center cursor-pointer"
                  title="Eliminar foto de cédula"
                >
                  <Trash2 className="size-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* INTERACTIVE TAB BAR */}
        <div className="w-full bg-white rounded-xl shadow-sm border border-slate-100 px-4">
          <nav
            aria-label="Pestañas de expediente de estudiante"
            className="flex items-center gap-2 overflow-x-auto no-scrollbar"
          >
            {/* Tab 1: Información */}
            <button
              type="button"
              onClick={() => setActiveTab("informacion")}
              className={`flex items-center gap-2 py-3.5 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "informacion"
                  ? "text-slate-900 border-[#fd761a]"
                  : "text-slate-500 hover:text-slate-800 border-transparent"
              }`}
            >
              <User className={`size-4 ${activeTab === "informacion" ? "text-[#fd761a]" : ""}`} />
              <span>Información</span>
            </button>

            {/* Tab 2: Resumen */}
            <button
              type="button"
              onClick={() => setActiveTab("resumen")}
              className={`flex items-center gap-2 py-3.5 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "resumen"
                  ? "text-slate-900 border-[#fd761a]"
                  : "text-slate-500 hover:text-slate-800 border-transparent"
              }`}
            >
              <LayoutDashboard
                className={`size-4 ${activeTab === "resumen" ? "text-[#fd761a]" : ""}`}
              />
              <span>Resumen</span>
            </button>

            {/* Tab 3: Académico */}
            <button
              type="button"
              onClick={() => setActiveTab("academico")}
              className={`flex items-center gap-2 py-3.5 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "academico"
                  ? "text-slate-900 border-[#fd761a]"
                  : "text-slate-500 hover:text-slate-800 border-transparent"
              }`}
            >
              <GraduationCap
                className={`size-4 ${activeTab === "academico" ? "text-[#fd761a]" : ""}`}
              />
              <span>Académico</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold font-mono">
                {totalCursos}
              </span>
            </button>

            {/* Tab 4: Financiero */}
            <button
              type="button"
              onClick={() => setActiveTab("financiero")}
              className={`flex items-center gap-2 py-3.5 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "financiero"
                  ? "text-slate-900 border-[#fd761a]"
                  : "text-slate-500 hover:text-slate-800 border-transparent"
              }`}
            >
              <CreditCard
                className={`size-4 ${activeTab === "financiero" ? "text-[#fd761a]" : ""}`}
              />
              <span>Financiero</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                  saldoPendiente <= 0
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                ${saldoPendiente.toFixed(2)} {saldoPendiente <= 0 ? "adeudado" : "pendiente"}
              </span>
            </button>
          </nav>
        </div>

        {/* ACTIVE TAB CONTENT CONTAINER */}
        <div className="w-full">
          {activeTab === "informacion" && (
            <InfoTabContent
              data={studentData}
              academicData={academicData}
              loading={loading}
              academicLoading={academicLoading}
              onRefresh={refreshData}
              onUpdateInfo={updateStudentInfo}
              onSwitchToAcademic={() => setActiveTab("academico")}
            />
          )}
          {activeTab === "resumen" && (
            <OverviewTabContent
              academicData={academicData}
              financialData={financialData}
              academicLoading={academicLoading}
              financialLoading={financialLoading}
              onSwitchToAcademic={() => setActiveTab("academico")}
            />
          )}
          {activeTab === "academico" && (
            <AcademicTabContent data={academicData} loading={academicLoading} />
          )}
          {activeTab === "financiero" && (
            <FinancialTabContent
              data={financialData}
              loading={financialLoading}
              onRefresh={refreshData}
            />
          )}
        </div>
      </div>

      {/* Confirmation modal for cédula deletion */}
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

      {/* Full image viewer for cédula */}
      {showCedulaModal && cedulaUrl && (
        <ImageZoom url={getStorageUrl(cedulaUrl)} onClose={() => setShowCedulaModal(false)} />
      )}
    </div>
  )
}
