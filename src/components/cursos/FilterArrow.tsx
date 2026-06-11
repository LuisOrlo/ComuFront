import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon } from "@hugeicons/core-free-icons"

export function FilterArrow() {
  return (
    <span
      style={{
        position: "absolute",
        right: 10,
        top: "50%",
        transform: "translateY(-50%)",
        pointerEvents: "none" as const,
      }}
    >
      <HugeiconsIcon icon={ArrowDown01Icon} size={12} />
    </span>
  )
}
