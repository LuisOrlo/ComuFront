/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Image01Icon,
  Upload05Icon,
  Delete01Icon,
  Download01Icon,
  ViewIcon,
  Add01Icon,
  MinusSignIcon,
  RefreshIcon,
} from "@hugeicons/core-free-icons"
import { fixImageUrl } from "../../AprobacionUtils"

interface TallerDocumentoTabProps {
  selected: any
  cedulaRef: React.RefObject<HTMLInputElement | null>
  handleUploadCedula: (e: React.ChangeEvent<HTMLInputElement>) => void
  uploadingCedula: boolean
  deletingCedula: boolean
  setDeleteArchivoModal: (val: { type: "comprobante" | "cedula"; label: string } | null) => void
  setExpandedImageUrl: (url: string | null) => void
}

export function TallerDocumentoTab({
  selected,
  cedulaRef,
  handleUploadCedula,
  uploadingCedula,
  deletingCedula,
  setDeleteArchivoModal,
  setExpandedImageUrl,
}: TallerDocumentoTabProps) {
  const [zoomLevel, setZoomLevel] = useState(100)
  const [rotation, setRotation] = useState(0)

  const cedulaUrl = selected.cedula_url ? fixImageUrl(selected.cedula_url) : null

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(250, Math.max(50, prev + delta)))
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleReset = () => {
    setZoomLevel(100)
    setRotation(0)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Copia de cédula
            </h2>
            {cedulaUrl && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                Imagen fotográfica
              </span>
            )}
          </div>
         
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={cedulaRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUploadCedula}
          />

          <button
            type="button"
            onClick={() => cedulaRef.current?.click()}
            disabled={uploadingCedula}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <HugeiconsIcon icon={Upload05Icon} size={15} />
            <span>{uploadingCedula ? "Subiendo..." : cedulaUrl ? "Cambiar imagen" : "Subir foto"}</span>
          </button>

          {cedulaUrl && (
            <>
              <a
                href={cedulaUrl}
                download="cedula_participante.jpg"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Descargar fotografía original"
              >
                <HugeiconsIcon icon={Download01Icon} size={15} />
                <span>Descargar</span>
              </a>

              <button
                type="button"
                onClick={() => setDeleteArchivoModal({ type: "cedula", label: "cédula de identidad" })}
                disabled={deletingCedula}
                className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Eliminar archivo"
              >
                <HugeiconsIcon icon={Delete01Icon} size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Viewer Surface */}
      {cedulaUrl ? (
        <div className="space-y-3">
          {/* Controls Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-900 rounded-xl text-white">
            <div className="flex items-center gap-2 text-xs text-slate-300 font-mono">
              <HugeiconsIcon icon={Image01Icon} size={16} className="text-[#fd761a]" />
              <span className="truncate max-w-[240px]">cedula_participante.jpg</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleZoom(-20)}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-200 cursor-pointer"
                title="Alejar"
              >
                <HugeiconsIcon icon={MinusSignIcon} size={16} />
              </button>
              <span className="font-mono text-xs px-2 font-bold text-[#fd761a]">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => handleZoom(20)}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-200 cursor-pointer"
                title="Acercar"
              >
                <HugeiconsIcon icon={Add01Icon} size={16} />
              </button>

              <div className="h-4 w-px bg-slate-700 mx-1" />

              <button
                type="button"
                onClick={handleRotate}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-200 cursor-pointer"
                title="Rotar 90°"
              >
                <HugeiconsIcon icon={RefreshIcon} size={16} />
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-2 py-1 rounded text-xs hover:bg-slate-800 text-slate-300 cursor-pointer font-medium"
                title="Restablecer vista"
              >
                Reset
              </button>

              <button
                type="button"
                onClick={() => setExpandedImageUrl(cedulaUrl)}
                className="px-2.5 py-1 rounded-lg bg-[#fd761a] hover:bg-[#ea580c] text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Pantalla completa"
              >
                <HugeiconsIcon icon={ViewIcon} size={14} />
                <span>Ampliar</span>
              </button>
            </div>
          </div>

          {/* Photo Canvas */}
          <div className="relative bg-slate-950 rounded-2xl p-6 sm:p-10 flex items-center justify-center min-h-[420px] overflow-hidden shadow-inner">
            <div
              className="transition-transform duration-200 ease-out flex items-center justify-center"
              style={{
                transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
              }}
            >
              <img
                src={cedulaUrl}
                alt="Fotografía de Cédula de Identidad"
                className="max-h-[500px] w-auto object-contain rounded-xl shadow-2xl border border-slate-800 select-none cursor-pointer"
                onClick={() => setExpandedImageUrl(cedulaUrl)}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 text-[#fd761a] flex items-center justify-center mx-auto mb-3">
            <HugeiconsIcon icon={Image01Icon} size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-900">No se ha subido la foto de cédula</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Puedes adjuntar una imagen nítida de la cédula del participante en formato JPG o PNG.
          </p>
          <button
            type="button"
            onClick={() => cedulaRef.current?.click()}
            disabled={uploadingCedula}
            className="mt-4 px-5 py-2.5 rounded-xl bg-[#fd761a] hover:bg-[#ea580c] text-white text-xs font-bold shadow-md shadow-orange-600/20 transition-all cursor-pointer"
          >
            {uploadingCedula ? "Subiendo archivo..." : "Subir foto de cédula"}
          </button>
        </div>
      )}
    </div>
  )
}
