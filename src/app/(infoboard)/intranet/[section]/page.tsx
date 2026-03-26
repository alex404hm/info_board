export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import { SectionPageShell } from "@/components/SectionPageShell"
import { IntranetSectionPage } from "@/components/panels/IntranetPanel"
import { db } from "@/db"
import { intranetPage } from "@/db/schema"
import { eq } from "drizzle-orm"

interface Props {
  params: Promise<{ section: string }>
}

export default async function IntranetSectionRoute({ params }: Props) {
  const resolvedParams = await params

  const categories = await db
    .select()
    .from(intranetPage)
    .where(eq(intranetPage.isDraft, false))

  const cat = categories.find((c) => c.key === resolvedParams.section)
  if (!cat) notFound()

  return (
    <SectionPageShell title={cat.title} subtitle={cat.subtitle ?? ""} noHeader>
      <IntranetSectionPage sectionKey={cat.key} categories={categories} />
    </SectionPageShell>
  )
}
