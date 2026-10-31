/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useCallback, useImperativeHandle, forwardRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AlertCircleIcon,
  Coins02Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  Upload05Icon,
  Image01Icon,
  File01Icon,
} from "@hugeicons/core-free-icons"
import { cursosService } from "@/services/cursos.service"
import { COLORS } from "@/lib/constants"
import { toast } from "sonner"
import { getStorageUrl } from "@/lib/utils"
import { ImageZoom } from "@/pages/matriculas/ImageZoom"
import { AjustePrecioPanel } from "./components/solicitudes/AjustePrecioPanel"
import { type MetodoPagoItem, type ConceptoDestino } from "@/components/finanzas/MetodosPagoSplitInput"
import { ModuloPagoMixtoModal } from "@/components/finanzas/ModuloPagoMixtoModal"

interface PagoPreAprobacionSectionProps {
  cursoAbiertoId: string
  cursoNombre: string
  esPersonalizado?: boolean
  precioCurso?: number
  precioMatricula?: number
  metodoPagoInicial?: string
  comprobanteInicialUrl?: string | null
  onMontoValidoChange?: (valido: boolean) => void
  onTotalPrecioChange?: (total: number) => void
  onSubmit: (
    pagos: any[],
    metodoPago: string,
    inscripcion?: { total: number; cubierto: number; motivo_ajuste?: string },
    metodosPago?: MetodoPagoItem[],
    grupoPagoId?: string
  ) => void
}

export type PagoPreAprobacionRef = {
  submit: () => void | Promise<void>
  totalPrecio: number
  montoValido: boolean
}

export const PagoPreAprobacionSection = forwardRef(function PagoPreAprobacionSection({
  cursoAbiertoId,
  esPersonalizado = false,
  precioCurso = 0,
  precioMatricula,
  metodoPagoInicial,
  comprobanteInicialUrl,
  onMontoValidoChange,
  onTotalPrecioChange,
  onSubmit,
}: PagoPreAprobacionSectionProps, ref) {
  const [montos, setMontos] = useState<Record<string, string>>({})
  const [modulos, setModulos] = useState<any[]>([])
  const [modulosCargados, setModulosCargados] = useState(false)
  const [ajustes, setAjustes] = useState<Record<string, { expandido: boolean; nuevoPrecio: string; motivo: string }>>({})

  // Modo de comprobantes: 'global' (un solo comprobante para todo) o 'individual' (por cada módulo)
  const [modoComprobante, setModoComprobante] = useState<"global" | "individual">("global")
  const [comprobantesPorConcepto, setComprobantesPorConcepto] = useState<
    Record<string, { file?: File | null; url?: string | null; preview?: string | null; usarGlobal?: boolean }>
  >({})
  const [zoomImg, setZoomImg] = useState<string | null>(null)

  // Estado de matrícula / inscripción asignada a nivel de curso
  const [cursoBaseMatricula, setCursoBaseMatricula] = useState<number>(precioMatricula ?? 0)
  const [incluirInscripcion, setIncluirInscripcion] = useState(false)
  const [ajusteInscripcion, setAjusteInscripcion] = useState<{ expandido: boolean; nuevoPrecio: string; motivo: string }>({
    expandido: false,
    nuevoPrecio: "",
    motivo: "",
  })
  const [pagoInscripcion, setPagoInscripcion] = useState("")
  const [pagoCurso, setPagoCurso] = useState("")
  const [ajustePersonalizado, setAjustePersonalizado] = useState({ expandido: false, nuevoPrecio: "", motivo: "" })

  const [grupoPagoId] = useState(() => crypto.randomUUID())
  const [metodoPrincipal, setMetodoPrincipal] = useState<MetodoPagoItem["metodo_pago"]>(
    () => ((metodoPagoInicial as MetodoPagoItem["metodo_pago"]) || "transferencia")
  )
  const [desglosesPorConcepto, setDesglosesPorConcepto] = useState<Record<string, MetodoPagoItem[]>>({})
  const [modalDesglose, setModalDesglose] = useState<{
    open: boolean
    conceptoId: string
    conceptoNombre: string
    montoObjetivo: number
  } | null>(null)

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        const [dataModulos, cursoData] = await Promise.all([
          cursosService.getModulosPorCurso(cursoAbiertoId).catch(() => []),
          precioMatricula === undefined ? cursosService.getCursoAbiertoById(cursoAbiertoId).catch(() => null) : null,
        ])
        if (!isMounted) return
        setModulos(Array.isArray(dataModulos) ? dataModulos : [])

        const fee = Number(precioMatricula !== undefined ? precioMatricula : (cursoData?.precio_matricula ?? 0))
        setCursoBaseMatricula(fee)
        // Por defecto, si el curso tiene configurado valor de inscripción, seleccionarlo
        if (fee > 0) {
          setIncluirInscripcion(true)
        }
      } catch {
        if (!isMounted) return
        setModulos([])
      } finally {
        if (isMounted) setModulosCargados(true)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [cursoAbiertoId, precioMatricula])

  useEffect(() => {
    if (precioMatricula !== undefined) {
      const fee = Number(precioMatricula) || 0
      setCursoBaseMatricula(fee)
      if (fee > 0) {
        setIncluirInscripcion(true)
      }
    }
  }, [precioMatricula])

  const getPrecioEfectivo = useCallback((modulo: any): number => {
    const a = ajustes[modulo.id]
    if (a && !a.expandido && a.nuevoPrecio !== "" && !isNaN(parseFloat(a.nuevoPrecio))) {
      return parseFloat(a.nuevoPrecio)
    }
    return Number(modulo.precio_base ?? modulo.precio ?? 0)
  }, [ajustes])

  const sorted = useMemo(() => {
    return [...modulos].sort((a, b) => (a.numero_orden ?? 0) - (b.numero_orden ?? 0))
  }, [modulos])

  const totalPrecioModulos = useMemo(() => {
    return sorted.reduce((sum: number, m: any) => m ? sum + getPrecioEfectivo(m) : sum, 0)
  }, [sorted, getPrecioEfectivo])

  // Precio efectivo de inscripción (con descuento/ajuste si se aplicó)
  const precioInscripcionEfectivo = useMemo(() => {
    if (!incluirInscripcion) return 0
    if (ajusteInscripcion.nuevoPrecio !== "") {
      return parseFloat(ajusteInscripcion.nuevoPrecio) || 0
    }
    return cursoBaseMatricula
  }, [incluirInscripcion, ajusteInscripcion.nuevoPrecio, cursoBaseMatricula])

  const inscripcionCubierta = useMemo(
    () => (incluirInscripcion ? Math.min(precioInscripcionEfectivo, parseFloat(pagoInscripcion) || 0) : 0),
    [incluirInscripcion, precioInscripcionEfectivo, pagoInscripcion]
  )

  const totalPrecio = useMemo(() => {
    const base = esPersonalizado && modulos.length === 0 ? Number(precioCurso) || 0 : totalPrecioModulos
    return base + (incluirInscripcion ? precioInscripcionEfectivo : 0)
  }, [esPersonalizado, modulos.length, precioCurso, totalPrecioModulos, incluirInscripcion, precioInscripcionEfectivo])

  useEffect(() => {
    if (modulosCargados) {
      onTotalPrecioChange?.(totalPrecio)
    }
  }, [totalPrecio, onTotalPrecioChange, modulosCargados])

  const totalARegistrar = useMemo(() => {
    return sorted.reduce((sum: number, m: any) => m ? sum + parseFloat(montos[m.id] || "0") : sum, 0)
  }, [sorted, montos])

  const modulosCubiertos = useMemo(() => {
    return sorted.filter((m: any) => {
      if (!m) return false
      const monto = parseFloat(montos[m.id] || "0")
      const precio = getPrecioEfectivo(m)
      return monto >= precio
    }).length
  }, [sorted, montos, getPrecioEfectivo])

  const totalIngresado = (esPersonalizado && modulos.length === 0 ? (parseFloat(pagoCurso) || 0) : totalARegistrar) + inscripcionCubierta

  const [, setUploadingFiles] = useState(false)

  const algunModuloExcede = useMemo(() => {
    return sorted.some((m: any) => {
      const monto = parseFloat(montos[m.id] || "0")
      const precio = getPrecioEfectivo(m)
      return monto > precio
    })
  }, [sorted, montos, getPrecioEfectivo])

  const inscripcionExcede = useMemo(() => {
    if (!incluirInscripcion) return false
    const monto = parseFloat(pagoInscripcion || "0")
    return monto > precioInscripcionEfectivo
  }, [incluirInscripcion, pagoInscripcion, precioInscripcionEfectivo])

  const precioPersonalizadoActual = Number(ajustePersonalizado.nuevoPrecio !== "" ? ajustePersonalizado.nuevoPrecio : precioCurso) || 0

  const handleMontoChange = useCallback((moduloId: string, valor: string) => {
    const moduloActual = modulos.find((m: any) => m.id === moduloId)
    if (!moduloActual) return
    const precio = getPrecioEfectivo(moduloActual)
    const nuevoMonto = parseFloat(valor) || 0
    if (nuevoMonto < 0) {
      setMontos(prev => ({ ...prev, [moduloId]: "0" }))
      return
    }
    if (nuevoMonto > precio) {
      setMontos(prev => ({ ...prev, [moduloId]: String(precio) }))
      toast.warning(`El monto no puede exceder el precio del módulo ($${precio.toFixed(2)}). Se ajustó al máximo.`)
      return
    }
    setMontos(prev => ({ ...prev, [moduloId]: valor }))
  }, [modulos, getPrecioEfectivo])

  const toggleAjuste = (moduloId: string) => {
    setAjustes(prev => {
      const actual = prev[moduloId]
      if (actual?.expandido) return { ...prev, [moduloId]: { ...actual, expandido: false } }
      const mod = modulos.find((m: any) => m.id === moduloId)
      return {
        ...prev,
        [moduloId]: {
          expandido: true,
          nuevoPrecio: String(mod?.precio_base ?? mod?.precio ?? 0),
          motivo: actual?.motivo ?? "",
        },
      }
    })
  }

  const conceptos: ConceptoDestino[] = useMemo(() => {
    const list: ConceptoDestino[] = []
    if (incluirInscripcion && precioInscripcionEfectivo > 0) {
      list.push({
        id: "inscripcion",
        nombre: "Inscripción / Matrícula",
        saldo: precioInscripcionEfectivo,
        montoACobrar: inscripcionCubierta,
        precioTotal: precioInscripcionEfectivo,
      })
    }
    sorted.forEach((m) => {
      const precioEfectivo = getPrecioEfectivo(m)
      const montoCobrarModulo = parseFloat(montos[m.id] || "0")
      list.push({
        id: m.id,
        nombre: m.nombre_modulo || m.nombre || `Módulo ${m.numero_orden}`,
        saldo: precioEfectivo,
        montoACobrar: montoCobrarModulo,
        precioTotal: precioEfectivo,
      })
    })
    return list
  }, [incluirInscripcion, precioInscripcionEfectivo, inscripcionCubierta, sorted, getPrecioEfectivo, montos])

  const conceptosConMonto = useMemo(() => {
    return conceptos.filter((c) => (c.montoACobrar ?? 0) > 0)
  }, [conceptos])

  // Manejadores del Modal de Pago Mixto
  const handleAbrirDesglose = useCallback((conceptoId: string, conceptoNombre: string, montoObjetivo: number) => {
    setModalDesglose({
      open: true,
      conceptoId,
      conceptoNombre,
      montoObjetivo,
    })
  }, [])

  const handleGuardarDesglose = useCallback((conceptoId: string, metodosNuevos: MetodoPagoItem[]) => {
    setDesglosesPorConcepto((prev) => ({
      ...prev,
      [conceptoId]: metodosNuevos,
    }))
    toast.success("Pago mixto configurado")
  }, [])

  const handleQuitarDesglose = useCallback((conceptoId: string) => {
    setDesglosesPorConcepto((prev) => {
      const copia = { ...prev }
      delete copia[conceptoId]
      return copia
    })
    toast.info("Se restableció al método de pago principal")
  }, [])

  // Lista unificada de todos los métodos de pago generados para la transacción
  const metodosConsolidados = useMemo(() => {
    const list: MetodoPagoItem[] = []

    // 1. Módulos
    sorted.forEach((m: any) => {
      const monto = parseFloat(montos[m.id] || "0")
      if (monto > 0) {
        const desglose = desglosesPorConcepto[m.id]
        const compInd = modoComprobante === "individual" ? comprobantesPorConcepto[m.id] : null
        const compUrlInd = compInd?.url || null
        const compFileInd = compInd?.file || null

        if (desglose && desglose.length >= 2) {
          desglose.forEach((d) => {
            list.push({
              ...d,
              modulo_id: m.id,
              // Si no tiene comprobante específico de método y se asignó uno individual para el módulo:
              comprobante_url: d.comprobante_url || compUrlInd,
              comprobante_file: d.comprobante_file || (d.comprobante_url ? undefined : compFileInd),
            })
          })
        } else {
          list.push({
            id: `mod-${m.id}`,
            metodo_pago: metodoPrincipal,
            monto: monto.toFixed(2),
            modulo_id: m.id,
            comprobante_url: compUrlInd,
            comprobante_file: compFileInd,
          })
        }
      }
    })

    // 2. Inscripción
    if (incluirInscripcion && inscripcionCubierta > 0) {
      const desgloseIns = desglosesPorConcepto["inscripcion"]
      const compIndIns = modoComprobante === "individual" ? comprobantesPorConcepto["inscripcion"] : null
      const compUrlIns = compIndIns?.url || null
      const compFileIns = compIndIns?.file || null

      if (desgloseIns && desgloseIns.length >= 2) {
        desgloseIns.forEach((d) => {
          list.push({
            ...d,
            modulo_id: "inscripcion",
            comprobante_url: d.comprobante_url || compUrlIns,
            comprobante_file: d.comprobante_file || (d.comprobante_url ? undefined : compFileIns),
          })
        })
      } else {
        list.push({
          id: "ins-principal",
          metodo_pago: metodoPrincipal,
          monto: inscripcionCubierta.toFixed(2),
          modulo_id: "inscripcion",
          comprobante_url: compUrlIns,
          comprobante_file: compFileIns,
        })
      }
    }

    // 3. Curso personalizado sin módulos
    if (esPersonalizado && modulos.length === 0) {
      const pagoPersonalizado = parseFloat(pagoCurso) || 0
      if (pagoPersonalizado > 0) {
        const desglosePers = desglosesPorConcepto["personalizado"]
        const compIndPers = modoComprobante === "individual" ? comprobantesPorConcepto["personalizado"] : null
        const compUrlPers = compIndPers?.url || null
        const compFilePers = compIndPers?.file || null

        if (desglosePers && desglosePers.length >= 2) {
          desglosePers.forEach((d) =>
            list.push({
              ...d,
              comprobante_url: d.comprobante_url || compUrlPers,
              comprobante_file: d.comprobante_file || (d.comprobante_url ? undefined : compFilePers),
            })
          )
        } else {
          list.push({
            id: "curso-personalizado",
            metodo_pago: metodoPrincipal,
            monto: pagoPersonalizado.toFixed(2),
            comprobante_url: compUrlPers,
            comprobante_file: compFilePers,
          })
        }
      }
    }

    return list
  }, [
    sorted,
    montos,
    desglosesPorConcepto,
    metodoPrincipal,
    incluirInscripcion,
    inscripcionCubierta,
    esPersonalizado,
    modulos.length,
    pagoCurso,
    modoComprobante,
    comprobantesPorConcepto,
  ])

  // Resumen agrupado por medio físico/bancario (ej. Transferencia: $110, Efectivo: $20)
  const totalesPorMetodo = useMemo(() => {
    const mapa: Record<string, number> = {}
    metodosConsolidados.forEach((m) => {
      const val = parseFloat(m.monto || "0")
      mapa[m.metodo_pago] = (mapa[m.metodo_pago] || 0) + val
    })
    return Object.entries(mapa).map(([metodo, suma]) => ({ metodo, suma }))
  }, [metodosConsolidados])

  // Verificación de desajuste entre monto del módulo y su pago mixto
  const hayDesgloseDesfasado = useMemo(() => {
    for (const m of sorted) {
      const monto = parseFloat(montos[m.id] || "0")
      const desglose = desglosesPorConcepto[m.id]
      if (desglose && desglose.length >= 2) {
        const suma = desglose.reduce(
          (s, d) => s + Math.round((parseFloat(d.monto) || 0) * 100),
          0
        )
        if (suma !== Math.round(monto * 100)) return true
      }
    }
    if (incluirInscripcion) {
      const desgloseIns = desglosesPorConcepto["inscripcion"]
      if (desgloseIns && desgloseIns.length >= 2) {
        const suma = desgloseIns.reduce(
          (s, d) => s + Math.round((parseFloat(d.monto) || 0) * 100),
          0
        )
        if (suma !== Math.round(inscripcionCubierta * 100)) return true
      }
    }
    if (esPersonalizado && modulos.length === 0) {
      const pagoPersonalizado = parseFloat(pagoCurso) || 0
      const desglosePers = desglosesPorConcepto["personalizado"]
      if (desglosePers && desglosePers.length >= 2) {
        const suma = desglosePers.reduce(
          (s, d) => s + Math.round((parseFloat(d.monto) || 0) * 100),
          0
        )
        if (suma !== Math.round(pagoPersonalizado * 100)) return true
      }
    }
    return false
  }, [
    sorted,
    montos,
    desglosesPorConcepto,
    incluirInscripcion,
    inscripcionCubierta,
    esPersonalizado,
    modulos.length,
    pagoCurso,
  ])

  const faltaComprobanteIndividual = useMemo(() => {
    for (const key of Object.keys(desglosesPorConcepto)) {
      const list = desglosesPorConcepto[key]
      if (list && list.length >= 2) {
        const tieneIndividual = list.some((m) => m.comprobante_file || m.comprobante_url)
        if (tieneIndividual) {
          const algunoFalta = list.some(
            (m) => !m.comprobante_file && !m.comprobante_url && parseFloat(m.monto || "0") > 0
          )
          if (algunoFalta) return true
        }
      }
    }
    return false
  }, [desglosesPorConcepto])

  const totalValido =
    totalPrecio === 0
      ? true
      : esPersonalizado && modulos.length === 0
      ? (parseFloat(pagoCurso) || 0) > 0 && (parseFloat(pagoCurso) || 0) <= precioPersonalizadoActual
      : totalARegistrar > 0 || (incluirInscripcion && precioInscripcionEfectivo > 0 && inscripcionCubierta > 0)

  const montoValido =
    !algunModuloExcede &&
    !inscripcionExcede &&
    !hayDesgloseDesfasado &&
    !faltaComprobanteIndividual &&
    totalValido

  useEffect(() => {
    onMontoValidoChange?.(montoValido)
  }, [montoValido, onMontoValidoChange])

  const handleSubmit = useCallback(async () => {
    if (algunModuloExcede) {
      toast.error("Uno de los módulos tiene un monto a cobrar superior a su precio")
      return
    }
    if (inscripcionExcede) {
      toast.error("El monto de matrícula excede el valor permitido")
      return
    }
    if (hayDesgloseDesfasado) {
      toast.error("Existe un módulo cuyo pago mixto no coincide con el monto actual a cobrar")
      return
    }
    if (faltaComprobanteIndividual) {
      toast.error("Hay métodos en pagos mixtos que requieren su comprobante adjunto")
      return
    }

    let metodosActualizados = [...metodosConsolidados]
    const tieneArchivos = metodosActualizados.some((m) => m.comprobante_file && !m.comprobante_url)
    if (tieneArchivos) {
      setUploadingFiles(true)
      try {
        const uploadPromises = metodosActualizados.map(async (m) => {
          if (m.comprobante_file && !m.comprobante_url) {
            const res = await cursosService.uploadComprobante(m.comprobante_file)
            return { ...m, comprobante_url: res.url }
          }
          return m
        })
        metodosActualizados = await Promise.all(uploadPromises)
      } catch {
        toast.error("Error al subir uno de los comprobantes individuales de pago")
        return
      } finally {
        setUploadingFiles(false)
      }
    }

    const metodosPayload = metodosActualizados.map((m: any) => {
      const metodoRaw = (m.metodo_pago || "").toLowerCase().trim()
      const metodoValido = ["transferencia", "efectivo", "tarjeta", "deposito", "otro"].includes(metodoRaw)
        ? metodoRaw
        : "transferencia"
      return {
        ...m,
        metodo_pago: metodoValido,
        modulo_id: m.modulo_id || m.linea_pago_modulo_id,
        monto: String(parseFloat(m.monto) || 0),
      }
    })

    if (esPersonalizado && modulos.length === 0) {
      onSubmit(
        [],
        metodoPrincipal,
        {
          total: Number(ajustePersonalizado.nuevoPrecio !== "" ? ajustePersonalizado.nuevoPrecio : precioCurso) || 0,
          cubierto: parseFloat(pagoCurso) || 0,
          motivo_ajuste: ajustePersonalizado.nuevoPrecio !== "" ? ajustePersonalizado.motivo : undefined,
        },
        metodosPayload,
        grupoPagoId
      )
      return
    }

    const pagos = modulos
      .filter((m: any) => {
        const monto = parseFloat(montos[m.id] || "0")
        const a = ajustes[m.id]
        const tieneAjuste = a && !a.expandido && a.nuevoPrecio !== "" && parseFloat(a.nuevoPrecio) !== (m.precio_base ?? m.precio ?? 0)
        return monto > 0 || tieneAjuste
      })
      .map((m: any) => {
        const base: Record<string, unknown> = {
          modulo_id: m.id,
          monto: parseFloat(montos[m.id] || "0"),
        }
        const a = ajustes[m.id]
        const precioOriginal = m.precio_base ?? m.precio ?? 0
        if (a && !a.expandido && a.nuevoPrecio !== "" && parseFloat(a.nuevoPrecio) !== precioOriginal) {
          base.monto_ajustado = parseFloat(a.nuevoPrecio)
          base.motivo_ajuste = a.motivo
        }
        return base
      })

    const tieneAjusteInscripcion =
      ajusteInscripcion.nuevoPrecio !== "" && parseFloat(ajusteInscripcion.nuevoPrecio) !== cursoBaseMatricula
    if (incluirInscripcion && (precioInscripcionEfectivo > 0 || tieneAjusteInscripcion)) {
      onSubmit(
        pagos,
        metodoPrincipal,
        {
          total: precioInscripcionEfectivo,
          cubierto: inscripcionCubierta,
          motivo_ajuste: ajusteInscripcion.nuevoPrecio !== "" ? ajusteInscripcion.motivo : undefined,
        },
        metodosPayload,
        grupoPagoId
      )
    } else {
      onSubmit(pagos, metodoPrincipal, undefined, metodosPayload, grupoPagoId)
    }
  }, [
    algunModuloExcede,
    inscripcionExcede,
    hayDesgloseDesfasado,
    faltaComprobanteIndividual,
    metodosConsolidados,
    metodoPrincipal,
    grupoPagoId,
    modulos,
    montos,
    ajustes,
    onSubmit,
    incluirInscripcion,
    precioInscripcionEfectivo,
    inscripcionCubierta,
    ajusteInscripcion,
    esPersonalizado,
    precioCurso,
    pagoCurso,
    ajustePersonalizado,
    cursoBaseMatricula,
  ])

  useImperativeHandle(ref, () => ({
    submit: handleSubmit,
    totalPrecio,
    montoValido,
  }), [handleSubmit, totalPrecio, montoValido])

  if (!modulosCargados) {
    return (
      <div className="pt-4 space-y-3">
        <p className="text-xs opacity-40">Cargando módulos...</p>
      </div>
    )
  }

  if (modulos.length === 0) {
    if (esPersonalizado) {
      const precio = Number(precioCurso) || 0
      const precioEfectivo = Number(ajustePersonalizado.nuevoPrecio !== "" ? ajustePersonalizado.nuevoPrecio : precio)
      return (
        <div className="pt-4 space-y-3">
          <div className="p-4 rounded-xl border space-y-3 bg-white" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.ACCENT }}>Curso personalizado</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm" style={{ color: COLORS.TEXT_MUTED }}>Precio total:</span>
                <AjustePrecioPanel
                  precioOriginal={precio}
                  precioActual={precioEfectivo}
                  motivoActual={ajustePersonalizado.motivo}
                  expandido={ajustePersonalizado.expandido}
                  labelButton="Aplicar descuento"
                  onToggleExpandir={() => setAjustePersonalizado(prev => ({ ...prev, expandido: true }))}
                  onCancelar={() => setAjustePersonalizado(prev => ({ ...prev, expandido: false }))}
                  onConfirmar={(nuevoPrecio, motivo) => setAjustePersonalizado({ expandido: false, nuevoPrecio: String(nuevoPrecio), motivo })}
                />
              </div>
            </div>
            <label className="block text-xs font-semibold" style={{ color: COLORS.CHARCOAL }}>
              Pago inicial a registrar
              <input
                type="number"
                min="0"
                max={precioEfectivo}
                step="0.01"
                value={pagoCurso}
                onChange={e => setPagoCurso(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none"
                placeholder="0.00"
              />
            </label>
            {(parseFloat(pagoCurso) || 0) > precioEfectivo && <p className="text-xs text-red-600">El pago no puede superar el precio total ajustado.</p>}
            {(parseFloat(pagoCurso) || 0) <= 0 && precioEfectivo > 0 && <p className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>Ingresa un pago mayor que cero para aprobar.</p>}
            {precioEfectivo === 0 && <p className="text-xs text-emerald-600 font-semibold">Curso con 100% de descuento ($0.00 a cobrar).</p>}

            {/* Pago mixto para curso personalizado sin módulos */}
            {(parseFloat(pagoCurso) || 0) > 0 && (
              <div className="pt-2 border-t border-slate-100">
                {(() => {
                  const monto = parseFloat(pagoCurso) || 0
                  const desglose = desglosesPorConcepto["personalizado"]
                  const esMixto = desglose && desglose.length >= 2
                  const sumaDesglose = esMixto
                    ? desglose.reduce((s, d) => s + Math.round((parseFloat(d.monto) || 0) * 100), 0)
                    : 0
                  const desfasado = esMixto && sumaDesglose !== Math.round(monto * 100)

                  if (esMixto) {
                    return (
                      <div
                        className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                          desfasado ? "bg-rose-50 border-rose-200" : "bg-emerald-50/70 border-emerald-200"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                            <HugeiconsIcon
                              icon={desfasado ? AlertCircleIcon : CheckmarkCircle02Icon}
                              size={15}
                              className={desfasado ? "text-rose-600 shrink-0" : "text-emerald-600 shrink-0"}
                            />
                            <span className="truncate">
                              {desfasado
                                ? `Pago mixto desajustado ($${(sumaDesglose / 100).toFixed(2)} de $${monto.toFixed(2)})`
                                : `Pago mixto configurado (${desglose.length} métodos)`}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                            {desglose.map((d) => `$${parseFloat(d.monto || "0").toFixed(2)} ${d.metodo_pago}`).join(" · ")}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleAbrirDesglose("personalizado", "Curso personalizado", monto)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                          >
                            {desfasado ? "Reajustar" : "Editar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuitarDesglose("personalizado")}
                            className="p-1 rounded-lg text-rose-600 hover:bg-rose-100/60 transition-colors cursor-pointer"
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={15} />
                          </button>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <button
                      type="button"
                      onClick={() => handleAbrirDesglose("personalizado", "Curso personalizado", monto)}
                      className="text-xs font-bold text-slate-600 hover:text-[#fd761a] hover:bg-orange-50/70 border border-dashed border-slate-300 hover:border-[#fd761a] px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <HugeiconsIcon icon={Coins02Icon} size={14} className="text-[#fd761a]" />
                      <span>Dividir pago (Mixto)</span>
                    </button>
                  )
                })()}
              </div>
            )}
          </div>
        </div>
      )
    }
    return (
      <div className="pt-4 space-y-3">
        <p className="text-xs opacity-40">Este curso no tiene módulos configurados</p>
      </div>
    )
  }

  return (
    <div className="pt-4 space-y-4">
      {/* Selector de Modo de Comprobante (Global vs Individual) */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <HugeiconsIcon icon={Image01Icon} size={16} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">
              Comprobantes de Pago para Módulos
            </span>
            <span className="text-[11px] text-slate-500 block">
              Elige si usarás un único comprobante general o fotos individuales por módulo
            </span>
          </div>
        </div>

        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shrink-0 shadow-2xs">
          <button
            type="button"
            onClick={() => setModoComprobante("global")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              modoComprobante === "global"
                ? "bg-[#fd761a] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Comprobante único
          </button>
          <button
            type="button"
            onClick={() => setModoComprobante("individual")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              modoComprobante === "individual"
                ? "bg-[#fd761a] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Individual por módulo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {sorted.map((modulo: any, idx: number) => {
        if (!modulo) return null
        const monto = parseFloat(montos[modulo.id] || "0")
        const precioOriginal = Number(modulo.precio_base ?? modulo.precio ?? 0)
        const precioEfectivo = getPrecioEfectivo(modulo)
        const a = ajustes[modulo.id]

        const pagado = precioEfectivo === 0 || (monto > 0 && monto >= precioEfectivo)
        const abonado = precioEfectivo > 0 && monto > 0 && monto < precioEfectivo

        let lineaEstado = ""
        if (precioEfectivo === 0) {
          lineaEstado = "Módulo " + (modulo.numero_orden || (idx + 1)) + " cubierto (Descuento 100%)"
        } else if (pagado) {
          lineaEstado = "Módulo " + (modulo.numero_orden || (idx + 1)) + " pagado completo"
        } else if (abonado) {
          const saldo = Math.max(0, precioEfectivo - monto)
          lineaEstado = "Abono · Saldo pendiente: $" + saldo.toLocaleString("es-EC", { minimumFractionDigits: 2 })
        }

        return (
          <div
            key={modulo.id}
            className="p-4 rounded-xl border space-y-3 bg-white"
            style={{
              borderColor: pagado
                ? "oklch(0.55 0.15 150)"
                : abonado
                ? "oklch(0.65 0.15 75)"
                : COLORS.BORDER_SUBTLE,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.ACCENT }}>
                  Módulo {modulo.numero_orden || (idx + 1)}
                </span>
                <p className="text-sm font-bold mt-0.5" style={{ color: COLORS.CHARCOAL }}>
                  {modulo.nombre_modulo || modulo.nombre || `Módulo ${idx + 1}`}
                </p>
              </div>

              <AjustePrecioPanel
                precioOriginal={precioOriginal}
                precioActual={precioEfectivo}
                motivoActual={a?.motivo ?? ""}
                expandido={Boolean(a?.expandido)}
                onConfirmar={(nuevoPrecio, motivo) => {
                  setAjustes(prev => ({
                    ...prev,
                    [modulo.id]: { expandido: false, nuevoPrecio: String(nuevoPrecio), motivo }
                  }))
                  setMontos(prev => {
                    const montoActual = parseFloat(prev[modulo.id] || "0")
                    if (montoActual > nuevoPrecio || nuevoPrecio === 0) {
                      toast.info(`El monto a cobrar de Módulo ${modulo.numero_orden || (idx + 1)} se ajustó al nuevo precio ($${nuevoPrecio.toFixed(2)})`)
                      return { ...prev, [modulo.id]: String(nuevoPrecio) }
                    }
                    return prev
                  })
                }}
                onCancelar={() => {
                  setAjustes(prev => {
                    const actual = prev[modulo.id]
                    if (!actual) return prev
                    return { ...prev, [modulo.id]: { ...actual, expandido: false } }
                  })
                }}
                onToggleExpandir={() => toggleAjuste(modulo.id)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                  Monto a cobrar ahora
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  Máx: ${precioEfectivo.toFixed(2)}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
                <input
                  type="number"
                  min="0"
                  max={precioEfectivo}
                  step="0.01"
                  placeholder="0.00"
                  value={montos[modulo.id] || ""}
                  onChange={e => handleMontoChange(modulo.id, e.target.value)}
                  onWheel={e => (e.target as HTMLElement).blur()}
                  className={`w-full pl-8 pr-4 py-2.5 border rounded-xl text-sm font-mono outline-none bg-white transition-all ${
                    monto > precioEfectivo
                      ? "border-rose-400 focus:border-rose-500 ring-1 ring-rose-200"
                      : "focus:border-blue-500"
                  }`}
                  style={{ borderColor: monto > precioEfectivo ? undefined : COLORS.BORDER_SUBTLE, MozAppearance: "textfield" }}
                />
              </div>
              {monto > precioEfectivo && (
                <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                  <HugeiconsIcon icon={AlertCircleIcon} size={13} />
                  <span>El monto no puede superar el precio del módulo (${precioEfectivo.toFixed(2)})</span>
                </p>
              )}
            </div>

            {/* Control y Resumen de Pago Mixto del Módulo */}
            {monto > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                {(() => {
                  const desglose = desglosesPorConcepto[modulo.id]
                  const esMixto = desglose && desglose.length >= 2
                  const sumaDesglose = esMixto
                    ? desglose.reduce((s, d) => s + Math.round((parseFloat(d.monto) || 0) * 100), 0)
                    : 0
                  const desfasado = esMixto && sumaDesglose !== Math.round(monto * 100)

                  if (esMixto) {
                    return (
                      <div
                        className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                          desfasado
                            ? "bg-rose-50 border-rose-200"
                            : "bg-emerald-50/70 border-emerald-200"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                            <HugeiconsIcon
                              icon={desfasado ? AlertCircleIcon : CheckmarkCircle02Icon}
                              size={15}
                              className={desfasado ? "text-rose-600 shrink-0" : "text-emerald-600 shrink-0"}
                            />
                            <span className="truncate">
                              {desfasado
                                ? `Pago mixto desajustado ($${(sumaDesglose / 100).toFixed(2)} de $${monto.toFixed(2)})`
                                : `Pago mixto (${desglose.length} métodos)`}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                            {desglose
                              .map((d) => `$${parseFloat(d.monto || "0").toFixed(2)} ${d.metodo_pago}`)
                              .join(" · ")}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() =>
                              handleAbrirDesglose(
                                modulo.id,
                                modulo.nombre_modulo || modulo.nombre || `Módulo ${modulo.numero_orden || (idx + 1)}`,
                                monto
                              )
                            }
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                              desfasado
                                ? "bg-rose-600 text-white hover:bg-rose-700 border-rose-600"
                                : "bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                            }`}
                          >
                            {desfasado ? "Reajustar" : "Editar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuitarDesglose(modulo.id)}
                            title="Quitar pago mixto y volver al método principal"
                            className="p-1 rounded-lg text-rose-600 hover:bg-rose-100/60 transition-colors cursor-pointer"
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={15} />
                          </button>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <button
                      type="button"
                      onClick={() =>
                        handleAbrirDesglose(
                          modulo.id,
                          modulo.nombre_modulo || modulo.nombre || `Módulo ${modulo.numero_orden || (idx + 1)}`,
                          monto
                        )
                      }
                      className="text-xs font-bold text-slate-600 hover:text-[#fd761a] hover:bg-orange-50/70 border border-dashed border-slate-300 hover:border-[#fd761a] px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer w-full justify-center sm:w-auto sm:justify-start"
                    >
                      <HugeiconsIcon icon={Coins02Icon} size={14} className="text-[#fd761a]" />
                      <span>Dividir pago de este módulo (Mixto)</span>
                    </button>
                  )
                })()}

                {/* Comprobante Individual de este Módulo */}
                {modoComprobante === "individual" && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <HugeiconsIcon icon={File01Icon} size={14} className="text-[#fd761a]" />
                        <span>Comprobante de este módulo:</span>
                      </span>

                      {comprobanteInicialUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setComprobantesPorConcepto((prev) => ({
                              ...prev,
                              [modulo.id]: { url: comprobanteInicialUrl, preview: null, file: null, usarGlobal: true },
                            }))
                          }}
                          className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
                        >
                          Usar el inicial
                        </button>
                      )}
                    </div>

                    {(() => {
                      const comp = comprobantesPorConcepto[modulo.id]
                      const preview = comp?.preview || (comp?.url ? getStorageUrl(comp.url) : null)

                      if (preview) {
                        return (
                          <div className="flex items-center justify-between gap-2 p-1.5 bg-white rounded-lg border border-slate-200">
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={preview}
                                alt="Comprobante módulo"
                                onClick={() => setZoomImg(preview)}
                                className="size-9 rounded-md object-cover border border-slate-200 shrink-0 cursor-pointer hover:opacity-85"
                                title="Clic para ampliar"
                              />
                              <div className="min-w-0">
                                <span className="text-[11px] font-bold text-slate-800 block truncate">
                                  {comp?.file ? comp.file.name : comp?.usarGlobal ? "Comprobante general" : "Comprobante adjunto"}
                                </span>
                                <span className="text-[10px] text-emerald-600 font-semibold block">
                                  Listo para asociar a este módulo
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setComprobantesPorConcepto((prev) => {
                                  const copy = { ...prev }
                                  delete copy[modulo.id]
                                  return copy
                                })
                              }}
                              className="text-[11px] font-bold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-md cursor-pointer shrink-0"
                            >
                              Quitar
                            </button>
                          </div>
                        )
                      }

                      return (
                        <label className="flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed border-slate-300 hover:border-[#fd761a] rounded-lg text-xs font-semibold text-slate-600 hover:text-[#fd761a] bg-white hover:bg-orange-50/40 cursor-pointer transition-all">
                          <HugeiconsIcon icon={Upload05Icon} size={14} />
                          <span>Subir comprobante exclusivo para este módulo</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                const previewUrl = URL.createObjectURL(file)
                                setComprobantesPorConcepto((prev) => ({
                                  ...prev,
                                  [modulo.id]: { file, preview: previewUrl, url: null, usarGlobal: false },
                                }))
                              }
                            }}
                          />
                        </label>
                      )
                    })()}
                  </div>
                )}
              </div>
            )}

            {lineaEstado && (
              <p className="text-[11px] font-semibold" style={{ color: pagado ? "oklch(0.55 0.15 150)" : "oklch(0.65 0.15 75)" }}>
                {lineaEstado}
              </p>
            )}
          </div>
        )
      })}
      </div>

      {/* Sección Cuota de Inscripción / Matrícula */}
      <div
        className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
          incluirInscripcion
            ? "border-blue-200 bg-white shadow-xs"
            : "border-slate-200/80 bg-slate-50/60"
        }`}
      >
        <div className="p-4 sm:p-4.5 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <input
                id="toggle-inscripcion-checkbox"
                type="checkbox"
                checked={incluirInscripcion}
                onChange={(e) => {
                  const checked = e.target.checked
                  setIncluirInscripcion(checked)
                  if (!checked) {
                    setPagoInscripcion("")
                    setAjusteInscripcion({ expandido: false, nuevoPrecio: "", motivo: "" })
                  }
                }}
                className="w-4 h-4 rounded text-[#fd761a] focus:ring-[#fd761a] border-slate-300 cursor-pointer accent-[#fd761a]"
              />
              <label
                htmlFor="toggle-inscripcion-checkbox"
                className="cursor-pointer select-none"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                    Cuota de Matrícula
                  </span>
                  {!incluirInscripcion && (
                    <span className="text-xs text-slate-400 font-medium">
                      (No cobrar matrícula al estudiante)
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-slate-800 mt-0.5">
                  Cobrar valor de inscripción al estudiante
                </h4>
              </label>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs text-slate-400 block font-medium">Precio inscripción</span>
              <span
                className={`text-sm font-black font-mono ${
                  incluirInscripcion ? "text-blue-700" : "text-slate-400 line-through"
                }`}
              >
                ${(incluirInscripcion ? precioInscripcionEfectivo : cursoBaseMatricula).toLocaleString("es-EC", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {incluirInscripcion && (
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-medium">
                    Valor base asignado al curso:
                  </span>
                  <span className="text-xs font-bold text-slate-800 font-mono">
                    ${cursoBaseMatricula.toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Descuento con AjustePrecioPanel */}
                <AjustePrecioPanel
                  precioOriginal={cursoBaseMatricula}
                  precioActual={precioInscripcionEfectivo}
                  motivoActual={ajusteInscripcion.motivo}
                  expandido={ajusteInscripcion.expandido}
                  labelButton="Aplicar descuento a matrícula"
                  onToggleExpandir={() =>
                    setAjusteInscripcion((prev) => ({
                      ...prev,
                      expandido: !prev.expandido,
                      nuevoPrecio: prev.nuevoPrecio || String(cursoBaseMatricula),
                    }))
                  }
                  onCancelar={() =>
                    setAjusteInscripcion((prev) => ({ ...prev, expandido: false }))
                  }
                  onConfirmar={(nuevoPrecio, motivo) => {
                    setAjusteInscripcion({
                      expandido: false,
                      nuevoPrecio: String(nuevoPrecio),
                      motivo,
                    })
                    const pagoNum = parseFloat(pagoInscripcion) || 0
                    if (pagoNum > nuevoPrecio) {
                      setPagoInscripcion(String(nuevoPrecio))
                      toast.info(`El monto de matrícula se ajustó al nuevo precio ($${nuevoPrecio.toFixed(2)})`)
                    }
                  }}
                />
              </div>

              {cursoBaseMatricula === 0 && ajusteInscripcion.nuevoPrecio === "" && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  <span>Este curso no tiene una cuota de matrícula predeterminada ($0.00). Puedes aplicar un valor usando el botón de descuento/ajuste de arriba.</span>
                </div>
              )}

              {/* Input Monto a pagar de inscripción */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Monto a cobrar ahora por matrícula
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Máx: ${precioInscripcionEfectivo.toFixed(2)}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      max={precioInscripcionEfectivo}
                      value={pagoInscripcion}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0
                        if (val > precioInscripcionEfectivo) {
                          setPagoInscripcion(String(precioInscripcionEfectivo))
                          toast.warning(
                            `El pago no puede exceder el precio de inscripción ($${precioInscripcionEfectivo.toFixed(2)})`
                          )
                        } else {
                          setPagoInscripcion(e.target.value)
                        }
                      }}
                      onWheel={(e) => (e.target as HTMLElement).blur()}
                      placeholder="0.00"
                      className={`w-full pl-8 pr-4 py-2 border rounded-xl text-sm font-mono outline-none bg-white transition-all ${
                        parseFloat(pagoInscripcion || "0") > precioInscripcionEfectivo
                          ? "border-rose-400 focus:border-rose-500 ring-1 ring-rose-200"
                          : "focus:border-[#fd761a] border-slate-200"
                      }`}
                    />
                  </div>
                  {parseFloat(pagoInscripcion || "0") > precioInscripcionEfectivo && (
                    <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                      <HugeiconsIcon icon={AlertCircleIcon} size={13} />
                      <span>El monto no puede superar el precio de matrícula (${precioInscripcionEfectivo.toFixed(2)})</span>
                    </p>
                  )}
                </div>

                <div className="flex items-end">
                  {parseFloat(pagoInscripcion || "0") > 0 ? (
                    <div
                      className="w-full p-2.5 rounded-xl border flex items-center justify-between"
                      style={{
                        backgroundColor: "oklch(0.55 0.15 240 / 0.08)",
                        borderColor: "oklch(0.55 0.15 240 / 0.2)",
                      }}
                    >
                      <span className="text-xs font-semibold" style={{ color: "oklch(0.45 0.15 240)" }}>
                        {inscripcionCubierta >= precioInscripcionEfectivo
                          ? "Matrícula cubierta completa"
                          : "Pago parcial de matrícula"}
                      </span>
                      <span className="text-xs font-bold font-mono" style={{ color: "oklch(0.45 0.15 240)" }}>
                        ${inscripcionCubierta.toLocaleString("es-EC", { minimumFractionDigits: 2 })} de ${precioInscripcionEfectivo.toLocaleString("es-EC", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ) : (
                    <div className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                      Saldo pendiente: ${precioInscripcionEfectivo.toLocaleString("es-EC", { minimumFractionDigits: 2 })} (se registrará como saldo por cobrar)
                    </div>
                  )}
                </div>
              </div>

              {/* Control y Resumen de Pago Mixto de Matrícula */}
              {inscripcionCubierta > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  {(() => {
                    const desglose = desglosesPorConcepto["inscripcion"]
                    const esMixto = desglose && desglose.length >= 2
                    const sumaDesglose = esMixto
                      ? desglose.reduce((s, d) => s + Math.round((parseFloat(d.monto) || 0) * 100), 0)
                      : 0
                    const desfasado = esMixto && sumaDesglose !== Math.round(inscripcionCubierta * 100)

                    if (esMixto) {
                      return (
                        <div
                          className={`p-2.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                            desfasado
                              ? "bg-rose-50 border-rose-200"
                              : "bg-emerald-50/70 border-emerald-200"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                              <HugeiconsIcon
                                icon={desfasado ? AlertCircleIcon : CheckmarkCircle02Icon}
                                size={15}
                                className={desfasado ? "text-rose-600 shrink-0" : "text-emerald-600 shrink-0"}
                              />
                              <span className="truncate">
                                {desfasado
                                  ? `Pago mixto de matrícula desajustado ($${(sumaDesglose / 100).toFixed(2)} de $${inscripcionCubierta.toFixed(2)})`
                                  : `Pago mixto de matrícula (${desglose.length} métodos)`}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                              {desglose
                                .map((d) => `$${parseFloat(d.monto || "0").toFixed(2)} ${d.metodo_pago}`)
                                .join(" · ")}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() =>
                                handleAbrirDesglose(
                                  "inscripcion",
                                  "Inscripción / Matrícula",
                                  inscripcionCubierta
                                )
                              }
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                                desfasado
                                  ? "bg-rose-600 text-white hover:bg-rose-700 border-rose-600"
                                  : "bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                              }`}
                            >
                              {desfasado ? "Reajustar" : "Editar"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuitarDesglose("inscripcion")}
                              title="Quitar pago mixto y volver al método principal"
                              className="p-1 rounded-lg text-rose-600 hover:bg-rose-100/60 transition-colors cursor-pointer"
                            >
                              <HugeiconsIcon icon={Delete02Icon} size={15} />
                            </button>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <button
                        type="button"
                        onClick={() =>
                          handleAbrirDesglose(
                            "inscripcion",
                            "Inscripción / Matrícula",
                            inscripcionCubierta
                          )
                        }
                        className="text-xs font-bold text-slate-600 hover:text-[#fd761a] hover:bg-orange-50/70 border border-dashed border-slate-300 hover:border-[#fd761a] px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer w-full justify-center sm:w-auto sm:justify-start"
                      >
                        <HugeiconsIcon icon={Coins02Icon} size={14} className="text-[#fd761a]" />
                        <span>Dividir pago de matrícula (Mixto)</span>
                      </button>
                    )
                  })()}

                  {/* Comprobante Individual de Matrícula */}
                  {modoComprobante === "individual" && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2 mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <HugeiconsIcon icon={File01Icon} size={14} className="text-[#fd761a]" />
                          <span>Comprobante de matrícula:</span>
                        </span>

                        {comprobanteInicialUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setComprobantesPorConcepto((prev) => ({
                                ...prev,
                                inscripcion: { url: comprobanteInicialUrl, preview: null, file: null, usarGlobal: true },
                              }))
                            }}
                            className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
                          >
                            Usar el inicial
                          </button>
                        )}
                      </div>

                      {(() => {
                        const comp = comprobantesPorConcepto["inscripcion"]
                        const preview = comp?.preview || (comp?.url ? getStorageUrl(comp.url) : null)

                        if (preview) {
                          return (
                            <div className="flex items-center justify-between gap-2 p-1.5 bg-white rounded-lg border border-slate-200">
                              <div className="flex items-center gap-2 min-w-0">
                                <img
                                  src={preview}
                                  alt="Comprobante matrícula"
                                  onClick={() => setZoomImg(preview)}
                                  className="size-9 rounded-md object-cover border border-slate-200 shrink-0 cursor-pointer hover:opacity-85"
                                  title="Clic para ampliar"
                                />
                                <div className="min-w-0">
                                  <span className="text-[11px] font-bold text-slate-800 block truncate">
                                    {comp?.file ? comp.file.name : comp?.usarGlobal ? "Comprobante general" : "Comprobante adjunto"}
                                  </span>
                                  <span className="text-[10px] text-emerald-600 font-semibold block">
                                    Listo para asociar a matrícula
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setComprobantesPorConcepto((prev) => {
                                    const copy = { ...prev }
                                    delete copy["inscripcion"]
                                    return copy
                                  })
                                }}
                                className="text-[11px] font-bold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-md cursor-pointer shrink-0"
                              >
                                Quitar
                              </button>
                            </div>
                          )
                        }

                        return (
                          <label className="flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed border-slate-300 hover:border-[#fd761a] rounded-lg text-xs font-semibold text-slate-600 hover:text-[#fd761a] bg-white hover:bg-orange-50/40 cursor-pointer transition-all">
                            <HugeiconsIcon icon={Upload05Icon} size={14} />
                            <span>Subir comprobante exclusivo para matrícula</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  const previewUrl = URL.createObjectURL(file)
                                  setComprobantesPorConcepto((prev) => ({
                                    ...prev,
                                    inscripcion: { file, preview: previewUrl, url: null, usarGlobal: false },
                                  }))
                                }
                              }}
                            />
                          </label>
                        )
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Resumen Total */}
      <div className="p-4 rounded-xl border space-y-3 bg-white shadow-sm" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium" style={{ color: COLORS.TEXT_MUTED }}>Total módulos del curso</span>
          <span className="font-bold text-base font-mono" style={{ color: COLORS.CHARCOAL }}>${totalPrecioModulos.toLocaleString("es-EC", { minimumFractionDigits: 2 })}</span>
        </div>

        {incluirInscripcion && precioInscripcionEfectivo > 0 && (
          <>
            <div className="flex items-center justify-between text-sm pt-2 border-t" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <span className="font-medium" style={{ color: COLORS.TEXT_MUTED }}>Inscripción / Matrícula</span>
              <span className="font-bold text-base font-mono" style={{ color: "oklch(0.65 0.15 75)" }}>${precioInscripcionEfectivo.toLocaleString("es-EC", { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex items-center justify-between text-sm pt-2 border-t font-bold" style={{ borderColor: COLORS.BORDER_SUBTLE }}>
              <span style={{ color: COLORS.CHARCOAL }}>Total Valor Solicitud (Curso + Inscripción)</span>
              <span className="font-extrabold text-base font-mono" style={{ color: COLORS.ACCENT }}>
                ${(totalPrecioModulos + precioInscripcionEfectivo).toLocaleString("es-EC", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </>
        )}

        <div className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm" style={{ backgroundColor: "oklch(0.55 0.15 150 / 0.08)", borderColor: "oklch(0.55 0.15 150 / 0.25)" }}>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: "oklch(0.40 0.16 150)" }}>
              Total Ingresado en esta transacción
            </span>
            <span className="text-xs font-medium opacity-80 block mt-0.5" style={{ color: "oklch(0.35 0.14 150)" }}>
              {totalPrecio === 0
                ? "Beca / Descuento del 100% aplicado ($0.00 a cobrar)"
                : incluirInscripcion && inscripcionCubierta > 0
                ? `${modulosCubiertos}/${sorted.length} módulos cubiertos + matrícula`
                : `${modulosCubiertos}/${sorted.length} módulos cubiertos`}
            </span>
          </div>
          <span className="text-xl font-black font-mono" style={{ color: "oklch(0.35 0.18 150)" }}>
            ${totalIngresado.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Sección 3: Forma de Pago Principal y Resumen Consolidado */}
      {totalIngresado > 0 && (
        <div className="space-y-3.5 bg-slate-50/70 p-3.5 sm:p-4 rounded-xl border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <HugeiconsIcon icon={Coins02Icon} size={15} className="text-[#fd761a]" />
                <span>Forma de Pago General</span>
                <span className="text-red-500">*</span>
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Método por defecto que aplicará a los conceptos sin pago mixto configurado.
              </p>
            </div>

            <div className="w-full sm:w-64">
              <select
                value={metodoPrincipal}
                onChange={(e) => setMetodoPrincipal(e.target.value as MetodoPagoItem["metodo_pago"])}
                className="w-full h-9.5 px-3 bg-white rounded-lg text-slate-900 text-xs font-bold border border-slate-200 focus:border-[#fd761a] focus:ring-1 focus:ring-[#fd761a] outline-none cursor-pointer"
              >
                <option value="transferencia">Transferencia bancaria</option>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta de débito / crédito</option>
                <option value="deposito">Depósito bancario</option>
                <option value="otro">Otro método</option>
              </select>
            </div>
          </div>

          {/* Resumen Consolidado de la Distribución de Pagos */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-3.5 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Resumen de recaudación de esta transacción
              </span>
              <span className="text-xs font-mono font-bold text-slate-900">
                Total: ${totalIngresado.toFixed(2)}
              </span>
            </div>

            {/* Lista detallada de cada concepto */}
            <div className="divide-y divide-slate-100">
              {conceptosConMonto.map((c) => {
                const desglose = desglosesPorConcepto[c.id]
                const esMixto = desglose && desglose.length >= 2
                const monto = c.montoACobrar ?? 0
                return (
                  <div key={c.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <span className="font-bold text-slate-800 block truncate">{c.nombre}</span>
                      {esMixto ? (
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Pago Mixto ({desglose.length} métodos)
                          </span>
                          <span className="text-[11px] text-slate-600">
                            {desglose.map((d) => `$${parseFloat(d.monto || "0").toFixed(2)} ${d.metodo_pago}`).join(" + ")}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 block capitalize">
                          {metodoPrincipal} (Método principal)
                        </span>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold font-mono text-slate-900 block">
                        ${monto.toFixed(2)}
                      </span>
                      {esMixto ? (
                        <button
                          type="button"
                          onClick={() => handleAbrirDesglose(c.id, c.nombre, monto)}
                          className="text-[10px] font-bold text-[#fd761a] hover:underline cursor-pointer"
                        >
                          Modificar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAbrirDesglose(c.id, c.nombre, monto)}
                          className="text-[10px] font-bold text-slate-500 hover:text-[#fd761a] hover:underline cursor-pointer"
                        >
                          Dividir pago
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Totalizadores por medio físico/bancario */}
            <div className="p-3 bg-slate-50/50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-500 text-[11px]">Ingreso por método:</span>
                {totalesPorMetodo.map((t) => (
                  <span
                    key={t.metodo}
                    className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-medium text-slate-700 capitalize flex items-center gap-1 text-[11px]"
                  >
                    <span>{t.metodo}:</span>
                    <strong className="text-slate-900">${t.suma.toFixed(2)}</strong>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-1.5 font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} className="text-emerald-600" />
                <span>${totalIngresado.toFixed(2)} recaudados al 100%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Pago Mixto Granular */}
      {modalDesglose && (
        <ModuloPagoMixtoModal
          open={modalDesglose.open}
          onClose={() => setModalDesglose(null)}
          conceptoNombre={modalDesglose.conceptoNombre}
          montoObjetivo={modalDesglose.montoObjetivo}
          metodosIniciales={desglosesPorConcepto[modalDesglose.conceptoId]}
          onSave={(metodosNuevos) => handleGuardarDesglose(modalDesglose.conceptoId, metodosNuevos)}
          onRemove={() => handleQuitarDesglose(modalDesglose.conceptoId)}
          permitirComprobantePorMetodo={true}
        />
      )}

      {/* Modal de Zoom para comprobantes */}
      {zoomImg && (
        <ImageZoom url={zoomImg} onClose={() => setZoomImg(null)} />
      )}
    </div>
  )
})
