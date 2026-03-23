"use client"

import { useState } from "react"
import { SectionPageShell } from "@/components/SectionPageShell"
import { IntranetPanel } from "@/components/panels/IntranetPanel"

export default function IntranetPage() {
  const [inDetail, setInDetail] = useState(false)

  return (
    <SectionPageShell
      title="Intranet"
      subtitle="Løn, befordring, læreplads og rettigheder for lærlinge"
      noHeader={inDetail}
    >
      <IntranetPanel onDetailChange={setInDetail} />
    </SectionPageShell>
  )
}
