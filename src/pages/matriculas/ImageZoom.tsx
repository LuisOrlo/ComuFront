import { useState, useRef, useEffect, useCallback } from "react"
import { ZoomIn, ZoomOut, RotateCcw, X } from "lucide-react"

export function ImageZoom({
  url,
  onClose,
  title = "Visualizador de imagen",
}: {
  url: string
  onClose: () => void
  title?: string
}) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0 })

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.5, 5))
  }, [])

  const handleZoomOut = useCallback(() => {
    setScale((prev) => {
      const next = Math.max(prev - 0.5, 1)
      if (next === 1) {
        setPosition({ x: 0, y: 0 })
      }
      return next
    })
  }, [])

  const handleReset = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  // Zoom mediante la rueda del ratón
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const delta = -e.deltaY * 0.002
    setScale((prev) => {
      const next = Math.min(Math.max(prev + delta, 1), 5)
      if (next === 1) {
        setPosition({ x: 0, y: 0 })
      }
      return parseFloat(next.toFixed(2))
    })
  }

  // Doble clic para alternar zoom rápido
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (scale > 1) {
      handleReset()
    } else {
      setScale(2.5)
    }
  }

  // Arrastre con Mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return // Solo botón izquierdo
    e.preventDefault()
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Arrastre con Pantalla Táctil
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      setIsDragging(true)
      dragStartRef.current = {
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return
    const touch = e.touches[0]
    setPosition({
      x: touch.clientX - dragStartRef.current.x,
      y: touch.clientY - dragStartRef.current.y,
    })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // Tecla Escape para salir y teclas de atajo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      } else if (e.key === "0" || e.key === "r" || e.key === "R") {
        handleReset()
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn()
      } else if (e.key === "-") {
        handleZoomOut()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose, handleReset, handleZoomIn, handleZoomOut])

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-200"
      onMouseUp={handleMouseUp}
      onTouchEnd={handleTouchEnd}
      tabIndex={0}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Barra superior con título y botón de cierre */}
      <div className="w-full flex items-center justify-between px-4 sm:px-6 py-4 bg-gradient-to-b from-black/70 to-transparent z-10 shrink-0">
        <div className="flex items-center gap-2 text-white/90">
          <span className="text-sm font-semibold tracking-wide drop-shadow-xs">
            {title}
          </span>
          {scale > 1 && (
            <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-mono font-medium">
              Arrastra para mover
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="size-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer shadow-lg"
          title="Cerrar (Esc)"
          aria-label="Cerrar"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Contenedor principal de la imagen con viewport interactivo */}
      <div
        className={`relative flex-1 w-full flex items-center justify-center overflow-hidden ${
          scale > 1
            ? isDragging
              ? "cursor-grabbing"
              : "cursor-grab"
            : "cursor-zoom-in"
        }`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onClick={(e) => {
          // Si el clic fue en el fondo fuera de arrastre y sin zoom, cerramos
          if (e.target === e.currentTarget && scale === 1) {
            onClose()
          }
        }}
      >
        <div
          className="transition-transform duration-75 ease-out will-change-transform flex items-center justify-center"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          }}
          onDoubleClick={handleDoubleClick}
        >
          <img
            src={url}
            alt={title}
            draggable={false}
            className="max-w-[90vw] max-h-[75vh] object-contain rounded-xl shadow-2xl pointer-events-none select-none ring-1 ring-white/10"
          />
        </div>
      </div>

      {/* Barra de herramientas flotante inferior */}
      <div className="pb-6 pt-2 z-10 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-2 rounded-full bg-neutral-900/90 border border-white/15 text-white shadow-2xl backdrop-blur-md">
          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className="size-9 rounded-full flex items-center justify-center hover:bg-white/15 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Alejar (-)"
          >
            <ZoomOut className="size-4" />
          </button>

          {/* Porcentaje actual */}
          <div
            onClick={handleReset}
            className="px-2.5 py-1 text-xs font-mono font-bold text-white/90 hover:text-white cursor-pointer select-none"
            title="Doble clic o clic aquí para restablecer (0)"
          >
            {Math.round(scale * 100)}%
          </div>

          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= 5}
            className="size-9 rounded-full flex items-center justify-center hover:bg-white/15 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Acercar (+)"
          >
            <ZoomIn className="size-4" />
          </button>

          <div className="h-4 w-px bg-white/20 mx-1" />

          {/* Reset */}
          <button
            type="button"
            onClick={handleReset}
            disabled={scale === 1 && position.x === 0 && position.y === 0}
            className="h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-medium hover:bg-white/15 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Restablecer tamaño y posición (R)"
          >
            <RotateCcw className="size-3.5" />
            <span className="hidden sm:inline">Restablecer</span>
          </button>
        </div>
      </div>
    </div>
  )
}
