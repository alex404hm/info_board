import { SectionPageShell } from "@/components/SectionPageShell"
import { NewsPanel } from "@/components/panels/NewsPanel"

export default function NewsPage() {
  return (
    <SectionPageShell title="Nyheder" subtitle="Seneste nyheder fra DR.dk">
      <NewsPanel />
    </SectionPageShell>
  )
}
