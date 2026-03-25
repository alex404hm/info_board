import { db } from "@/db"
import { intranetPage } from "@/db/schema"
import { asc } from "drizzle-orm"
import Link from "next/link"
import { Plus, Edit2, MoveVertical } from "lucide-react"

export default async function AdminIntranetPage() {
  const pages = await db
    .select()
    .from(intranetPage)
    .orderBy(asc(intranetPage.order))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Intranet Sider</h2>
          <p className="text-sm text-muted-foreground">
            Administrer indholdet i de forskellige intranet-sektioner.
          </p>
        </div>
        <Link
          href="/admin/intranet/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Ny side
        </Link>
      </div>

      <div className="grid gap-4">
        {pages.map((page) => (
          <div
            key={page.id}
            className="group relative flex items-center justify-between rounded-xl border border-border bg-card px-6 py-4 transition-all hover:border-border hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <MoveVertical className="h-4 w-4 opacity-30" />
              </div>
              <div>
                <h3 className="font-bold">{page.title}</h3>
                <p className="text-xs text-muted-foreground">{page.subtitle}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {page.key}
              </span>
              <Link
                href={`/admin/intranet/${page.id}`}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <Edit2 className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
        
        {pages.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 p-12 text-center">
            <p className="text-sm text-muted-foreground">Ingen intranet-sider fundet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
