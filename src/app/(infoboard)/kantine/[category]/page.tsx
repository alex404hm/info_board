import { notFound } from "next/navigation"
import { StatusBar } from "@/components/StatusBar"
import { InfoBoardIdleGuard } from "@/components/InfoBoardIdleGuard"
import { CanteenDetail } from "@/components/panels/CanteenPanel"

interface Props {
  params: Promise<{ category: string }>
}

const VALID_SLUGS = ["drikkevarer", "morgenmad", "varme-drikke", "diverse"]

export default async function CanteenCategoryPage({ params }: Props) {
  const { category } = await params
  if (!VALID_SLUGS.includes(category)) notFound()

  return (
    <div className="home-theme flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <InfoBoardIdleGuard />
      <StatusBar />
      <CanteenDetail slug={category} />
    </div>
  )
}
