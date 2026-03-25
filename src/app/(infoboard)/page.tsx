import { StatusBar } from "@/components/StatusBar"
import { TopCarousel } from "@/components/TopCarousel"
import { NavTiles } from "@/components/NavTiles"
import { InfoBoardIdleGuard } from "@/components/InfoBoardIdleGuard"
import { LatestMessageBlock } from "@/components/LatestMessageBlock"
export default function InfoBoardHome() {
  return (
    <div className="home-theme h-screen flex flex-col overflow-hidden bg-background">
      <InfoBoardIdleGuard />
      <StatusBar />

      <div className="relative flex flex-1 min-h-0 flex-col px-3 sm:px-6 lg:px-10">

        <div className="flex-1 min-h-0 flex flex-col justify-center overflow-y-auto no-scrollbar py-2 sm:py-4">
          <div className="w-full">
            <TopCarousel />
          </div>
        </div>

        <NavTiles />

        <div
          className="hidden xl:block"
          style={{
            position: "absolute",
            right: "1.5rem",
            left: "unset",
            bottom: 720,
            top: "unset",
            zIndex: 10,
          }}
        >
          <LatestMessageBlock />
        </div>
      </div>
    </div>
  )
}
