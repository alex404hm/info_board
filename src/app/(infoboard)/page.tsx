import { StatusBar } from "@/components/StatusBar"
import { TopCarousel } from "@/components/TopCarousel"
import { NavTiles } from "@/components/NavTiles"
import { InfoBoardIdleGuard } from "@/components/InfoBoardIdleGuard"
import { FeedbackButton } from "@/components/FeedbackButton"
import { LatestMessageBlock } from "@/components/LatestMessageBlock"
export default function InfoBoardHome() {
  return (
    <div className="home-theme flex h-screen flex-col overflow-hidden bg-background">
      <InfoBoardIdleGuard />
      <StatusBar />

      <div className="relative flex flex-1 min-h-0 flex-col px-4 sm:px-6 lg:px-10">


        <div className="flex flex-1 min-h-0 items-center py-4 sm:py-5">
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
            top: 115,
            zIndex: 10,
          }}
        >
          <LatestMessageBlock />
        </div>
      </div>
    </div>
  )
}
