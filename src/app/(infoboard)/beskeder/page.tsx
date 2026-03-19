import { SectionPageShell } from "@/components/SectionPageShell"
import { MessagesBoard } from "@/components/panels/MessagesBoard"

export default function BeskederPage() {
  return (
    <SectionPageShell title="Beskeder" subtitle="Meddelelser fra skolen">
      <MessagesBoard />
    </SectionPageShell>
  )
}
