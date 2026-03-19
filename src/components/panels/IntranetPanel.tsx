"use client"

import { Globe, Server, Link as LinkIcon, Search, ExternalLink } from "lucide-react"
import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"

const INTRANET_LINKS = [
  { name: "Informationskærm", ip: "10.0.0.206", description: "Administration af infotavler", category: "System" },
  { name: "Server Room A", ip: "10.0.0.10", description: "Hovedserver for administration", category: "Infrastruktur" },
  { name: "Kantine System", ip: "10.0.0.55", description: "Kassesystem og menu-styring", category: "Service" },
  { name: "Print Server", ip: "10.0.0.102", description: "Central printstyring", category: "Service" },
  { name: "WIFI Controller", ip: "10.0.0.5", description: "Styring af trådløst netværk", category: "Infrastruktur" },
]

export function IntranetPanel() {
  const [search, setSearch] = useState("")

  const filteredLinks = useMemo(() => {
    return INTRANET_LINKS.filter(link => 
      link.name.toLowerCase().includes(search.toLowerCase()) ||
      link.ip.includes(search) ||
      link.description.toLowerCase().includes(search.toLowerCase())
    )
  }, [search])

  return (
    <div className="space-y-8">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex flex-1 items-center gap-3 rounded-2xl px-5 py-3 bg-card/50 border border-border/50 backdrop-blur-md shadow-inner">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Søg i intranet links (navn, IP eller beskrivelse)…"
            className="w-full bg-transparent text-base font-medium outline-none text-foreground placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredLinks.map((link, idx) => (
          <a
            key={`${link.ip}-${idx}`}
            href={`http://${link.ip}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/5 bg-card/40 border border-border/50 backdrop-blur-md"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-secondary/80 text-secondary-foreground border border-border/50">
                {link.category}
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                <ExternalLink className="h-4 w-4" />
              </div>
            </div>

            <h3 className="text-lg font-black leading-tight text-foreground group-hover:text-primary transition-colors mb-1">
              {link.name}
            </h3>
            
            <div className="flex items-center gap-2 mb-4">
              <Server className="h-3.5 w-3.5 text-primary/60" />
              <code className="text-sm font-black text-primary tracking-tight">{link.ip}</code>
            </div>

            <p className="text-sm font-medium text-muted-foreground leading-relaxed">
              {link.description}
            </p>

            <div className="mt-6 pt-4 border-t border-border/30 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Klik for at åbne</span>
              <div className="h-1.5 w-1.5 rounded-full bg-primary/20 group-hover:bg-primary transition-colors" />
            </div>
          </a>
        ))}
      </div>

      {filteredLinks.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-24 bg-card/20 rounded-3xl border border-dashed border-border">
          <Globe className="h-12 w-12 text-muted-foreground/20" />
          <p className="text-sm font-medium text-muted-foreground">Ingen intranet links fundet for din søgning</p>
        </div>
      )}
    </div>
  )
}
