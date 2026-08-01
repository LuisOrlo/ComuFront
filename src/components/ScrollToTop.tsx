import { useState, useEffect, useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowUp01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { COLORS } from "@/lib/constants"

const SCROLL_PERCENT_THRESHOLD = 0.3
const MIN_CONTAINER_RATIO = 0.4

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)
  const scrollTarget = useRef<Element | null>(null)

  useEffect(() => {
    const onScrollCapture = (e: Event) => {
      const raw = e.target as Element | Document

      // document => la página scrollea sobre la ventana/<main>, usar main como fallback
      const el: Element = raw === document
        ? (document.querySelector("main") ?? document.documentElement)
        : (raw as Element)

      const scrollTop = el.scrollTop ?? 0
      const scrollHeight = el.scrollHeight
      const clientHeight = el.clientHeight

      // Ignorar contenedores pequeños o con solo scroll horizontal
      // (tablas, dropdowns, listas internas) para no alterar el estado
      const hasVerticalScroll = scrollHeight > clientHeight
      const isPageLevel = clientHeight >= window.innerHeight * MIN_CONTAINER_RATIO
      if (!hasVerticalScroll || !isPageLevel) return

      scrollTarget.current = el
      const percent = scrollTop / (scrollHeight - clientHeight)
      setIsVisible(percent >= SCROLL_PERCENT_THRESHOLD)
    }

    window.addEventListener("scroll", onScrollCapture, { passive: true, capture: true })

    return () => {
      window.removeEventListener("scroll", onScrollCapture, { capture: true } as EventListenerOptions)
    }
  }, [])

  const scrollToTop = () => {
    const el = scrollTarget.current
    if (el && typeof (el as HTMLElement).scrollTo === "function") {
      ;(el as HTMLElement).scrollTo({ top: 0, behavior: "smooth" })
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <button
      onClick={scrollToTop}
      className={cn(
        "fixed bottom-8 right-8 z-[100] size-11 rounded-2xl shadow-2xl transition-all duration-500 flex items-center justify-center hover:scale-110 active:scale-95",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
      )}
      style={{
        backgroundColor: COLORS.ACCENT,
        color: "white",
        boxShadow: `0 10px 30px -5px ${COLORS.ACCENT}60`
      }}
      title="Volver arriba"
    >
      <HugeiconsIcon icon={ArrowUp01Icon} size={18} strokeWidth={2.5} />
    </button>
  )
}
