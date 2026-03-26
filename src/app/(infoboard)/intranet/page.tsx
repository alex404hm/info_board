export const dynamic = "force-dynamic"

import { SectionPageShell } from "@/components/SectionPageShell"
import { IntranetPanel } from "@/components/panels/IntranetPanel"
import { db } from "@/db"
import { intranetPage } from "@/db/schema"
import { asc, eq } from "drizzle-orm"

export default async function IntranetPage() {
  const categories = await db
    .select()
    .from(intranetPage)
    .where(eq(intranetPage.isDraft, false))
    .orderBy(asc(intranetPage.order))

  return (
    <SectionPageShell
      title="Intranet"
      subtitle="Løn, befordring, læreplads og rettigheder for lærlinge"
    >
      <IntranetPanel categories={categories} />
    </SectionPageShell>
  )
}
