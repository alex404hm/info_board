import { notFound } from "next/navigation"
import { SectionPageShell } from "@/components/SectionPageShell"
import { IntranetSectionPage } from "@/components/panels/IntranetPanel"
import { INTRANET_SECTIONS } from "@/lib/intranet-static"

interface Props {
  params: Promise<{ section: string }>
}

export default async function IntranetSectionRoute({ params }: Props) {
  const { section } = await params
  const cat = INTRANET_SECTIONS.find((s) => s.key === section)
  if (!cat) notFound()

  return (
    <SectionPageShell title={cat.title} subtitle={cat.subtitle} noHeader>
      <IntranetSectionPage sectionKey={cat.key} sections={INTRANET_SECTIONS} />
    </SectionPageShell>
  )
}
