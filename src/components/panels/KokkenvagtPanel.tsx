"use client"

import { Coffee, CheckCircle2, ListChecks, Info, Clock, User } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Data ────────────────────────────────────────────────────────────────────

const SCHEDULE = [
  { week: 11, name: "Anders & Birgitte", task: "Tøm opvasker & tør borde", status: "In progress" },
  { week: 12, name: "Claus & Dorthe", task: "Tøm opvasker & tør borde", status: "Pending" },
  { week: 13, name: "Erik & Frederikke", task: "Tøm opvasker & tør borde", status: "Pending" },
  { week: 14, name: "Gunnar & Hanne", task: "Tøm opvasker & tør borde", status: "Pending" },
]

const INSTRUCTIONS = [
  "Tøm opvaskemaskinen hver morgen inden kl. 09:00.",
  "Tør alle borde og overflader af efter frokost (kl. 12:30).",
  "Sørg for at kaffemaskinen er ren og klar til næste dag.",
  "Fyld op med kopper, skeer og servietter.",
  "Tøm skraldespanden hvis den er fuld.",
]

// ─── Components ──────────────────────────────────────────────────────────────

function InstructionCard({ text, index }: { text: string; index: number }) {
  return (
    <div 
      className="flex items-start gap-4 rounded-xl p-4 transition-all hover:bg-white/[0.05] bg-card/20 border border-border/30"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-black text-primary border border-primary/30 shadow-sm shadow-primary/5">
        {index + 1}
      </div>
      <p className="text-sm font-medium leading-relaxed text-foreground/90">{text}</p>
    </div>
  )
}

export function KokkenvagtPanel() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Schedule Table */}
      <div className="lg:col-span-2">
        <div 
          className="overflow-hidden rounded-3xl bg-card/40 backdrop-blur-md border border-border/50 shadow-2xl"
        >
          <div className="border-b border-border/50 bg-card/40 px-6 py-5">
            <h2 className="flex items-center gap-3 text-lg font-black uppercase tracking-widest text-foreground">
              <Clock className="h-5 w-5 text-primary" />
              Vagtplan
            </h2>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/30 bg-muted/20 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  <th className="px-6 py-4">Uge</th>
                  <th className="px-6 py-4">Ansvarlige</th>
                  <th className="px-6 py-4">Opgave</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {SCHEDULE.map((item) => (
                  <tr key={item.week} className="group transition-colors hover:bg-primary/5">
                    <td className="whitespace-nowrap px-6 py-5 font-black text-primary tabular-nums">UGE {item.week}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3 text-sm font-bold text-foreground">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/50 border border-border/50">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        {item.name}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-muted-foreground">{item.task}</td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "inline-flex items-center gap-2 rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-widest border shadow-sm",
                        item.status === "In progress" 
                          ? "bg-primary/10 text-primary border-primary/20 shadow-primary/5" 
                          : "bg-muted/10 text-muted-foreground border-border/30"
                      )}>
                        <div className={cn("h-1.5 w-1.5 rounded-full", item.status === "In progress" ? "bg-primary animate-pulse" : "bg-muted-foreground/50")} />
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="space-y-6">
        <div 
          className="rounded-3xl p-6 bg-card/40 backdrop-blur-md border border-border/50 shadow-2xl"
        >
          <h2 className="mb-6 flex items-center gap-3 text-lg font-black uppercase tracking-widest text-foreground">
            <ListChecks className="h-5 w-5 text-primary" />
            Sådan gør du
          </h2>
          <div className="space-y-4">
            {INSTRUCTIONS.map((text, i) => (
              <InstructionCard key={i} text={text} index={i} />
            ))}
          </div>
          
          <div className="mt-8 rounded-2xl bg-primary/10 p-5 border border-primary/20 shadow-inner">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <Info className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-black text-primary uppercase tracking-[0.2em]">Husk!</p>
                <p className="mt-1.5 text-sm font-medium leading-relaxed text-foreground/80">
                  Et rent køkken giver gladere kolleger. Tak for din indsats!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
