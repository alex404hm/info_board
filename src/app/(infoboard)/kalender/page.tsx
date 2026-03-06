import { SectionPageShell } from "@/components/SectionPageShell"
import { CalendarPanel } from "@/components/panels/CalendarPanel"

export default function CalendarPage() {
  return (
    <SectionPageShell title="Kalender" subtitle="Skolekalender, helligdage og aktiviteter">
      <CalendarPanel />
    </SectionPageShell>
  )
}
