import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowUp01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { COLORS } from "@/lib/constants"

const SCROLL_PERCENT_THRESHOLD = 0.3

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const scrollContainer = document.querySelector("main")

    const toggleVisibility = () => {
      const el = scrollContainer ?? document.documentElement
      const scrollTop = el.scrollTop
      const scrollHeight = el.scrollHeight
      const clientHeight = el.clientHeight
      const percent = scrollHeight > clientHeight ? scrollTop / (scrollHeight - clientHeight) : 0

      setIsVisible(percent >= SCROLL_PERCENT_THRESHOLD)
    }

    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", toggleVisibility, { passive: true })
    }
    window.addEventListener("scroll", toggleVisibility, { passive: true })
    toggleVisibility()

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", toggleVisibility)
      }
      window.removeEventListener("scroll", toggleVisibility)
    }
  }, [])

  const scrollToTop = () => {
    const scrollContainer = document.querySelector("main")
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" })
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
