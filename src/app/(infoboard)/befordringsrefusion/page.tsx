import { SectionPageShell } from "@/components/SectionPageShell"

export default function BefordringsrefusionPage() {
  return (
    <SectionPageShell title="Befordringsrefusion" subtitle="Ansøgningsskema for befordringsrefusion">
      <div className="flex h-full w-full flex-col overflow-hidden rounded-xl">
        <iframe
          src="/Befordringsrefusion.pdf"
          className="h-full min-h-[70vh] w-full flex-1 rounded-xl border-0"
          title="Befordringsrefusion PDF"
        />
      </div>
    </SectionPageShell>
  )
}
