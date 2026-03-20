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
        <div className="mt-3 flex items-center justify-center gap-2 sm:mt-5 sm:gap-4">
          <div
            className="flex flex-1 max-w-[680px] items-center gap-3 rounded-xl px-4 py-3 sm:gap-5 sm:rounded-2xl sm:px-8 sm:py-5"
            style={{
              background: "#0d2a52",
              border: "2px solid rgba(122, 173, 255, 0.34)",
              boxShadow: "0 0 28px rgba(39,120,255,0.14), 0 12px 36px rgba(0,0,0,0.38)",
            }}
          >
            <span
              className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl sm:h-12 sm:w-12 sm:text-2xl"
              style={{ background: "rgba(122,173,255,0.14)", border: "1px solid rgba(122,173,255,0.24)" }}
            >
              🧪
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-snug sm:text-xl" style={{ color: "#eef5ff" }}>
                Se hjemmesiden og giv feedback
              </p>
              <p className="mt-0.5 hidden text-xs font-semibold sm:mt-1 sm:block sm:text-base" style={{ color: "#b8d1f2" }}>
                Gå til <span className="font-bold" style={{ color: "#eef5ff" }}>kortlink.dk/2u9fb</span> og del din mening
              </p>
            </div>
            <div className="shrink-0">
              <FeedbackButton inline />
            </div>
          </div>

        </div>

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
