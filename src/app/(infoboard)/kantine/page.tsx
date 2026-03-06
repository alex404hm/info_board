import { SectionPageShell } from "@/components/SectionPageShell"
import { CanteenPanel } from "@/components/panels/CanteenPanel"

export default function CanteenPage() {
  return (
    <SectionPageShell title="Kantine" subtitle="Dagens menu og retter fra kanpla">
      <CanteenPanel />
    </SectionPageShell>
  )
}
