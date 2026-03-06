import { SectionPageShell } from "@/components/SectionPageShell"
import { ContactsPanel } from "@/components/panels/ContactsPanel"

export default function ContactsPage() {
  return (
    <SectionPageShell title="Kontakter" subtitle="Vigtige kontaktpersoner og instruktoerer">
      <ContactsPanel />
    </SectionPageShell>
  )
}
