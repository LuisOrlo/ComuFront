import { useState, useEffect } from "react"

const QUERY = "(min-width: 1024px)"

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && !window.matchMedia(QUERY).matches)

  useEffect(() => {
    const mql = window.matchMedia(QUERY)
    const onChange = () => setIsMobile(!mql.matches)
    onChange()
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
