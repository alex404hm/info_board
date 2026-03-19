import { SectionPageShell } from "@/components/SectionPageShell"
import { IntranetPanel } from "@/components/panels/IntranetPanel"

export default function IntranetPage() {
  return (
    <SectionPageShell 
      title="Intranet" 
      subtitle="Oversigt over interne systemer og IP-adresser"
    >
      <IntranetPanel />
    </SectionPageShell>
  )
}
