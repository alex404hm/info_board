import { SectionPageShell } from "@/components/SectionPageShell"
import { NewsPanel } from "@/components/panels/NewsPanel"

export default function NewsPage() {
  return (
    <SectionPageShell title="Nyheder" subtitle="DR.dk artikler med direkte laes-link">
      <NewsPanel />
    </SectionPageShell>
  )
}
