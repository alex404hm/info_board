import { StatusBar } from "@/components/StatusBar"
import { TopCarousel } from "@/components/TopCarousel"
import { NavTiles } from "@/components/NavTiles"
import { InfoBoardIdleGuard } from "@/components/InfoBoardIdleGuard"

export default function InfoBoardHome() {
  return (
    <div className="home-theme flex h-screen flex-col overflow-hidden bg-background">
      <InfoBoardIdleGuard />
      <StatusBar />

      <div className="flex flex-1 min-h-0 flex-col px-4 sm:px-6 lg:px-10">
        {/* Carousel — vertically centred in all remaining space above the tiles */}
        <div className="flex-1 min-h-0 flex items-center py-4 sm:py-6">
          <div className="w-full">
            <TopCarousel />
          </div>
        </div>

        {/* Navigation tiles — config-driven, always pinned to bottom */}
        <NavTiles />
      </div>
    </div>
  )
}
