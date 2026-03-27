import { db } from "@/db"
import { intranetPage } from "@/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import IntranetPageForm from "../_components/IntranetPageForm"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditIntranetPage({ params }: Props) {
  const { id } = await params
  
  if (id === "new") {
    return <IntranetPageForm />
  }

  const [page] = await db
    .select()
    .from(intranetPage)
    .where(eq(intranetPage.id, id))

  if (!page) notFound()

  return <IntranetPageForm initialData={{ ...page, subtitle: page.subtitle || "" }} />
}
