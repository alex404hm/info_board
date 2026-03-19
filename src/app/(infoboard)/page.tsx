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
        <div className="mt-4 flex justify-center sm:mt-5">
          <div
            className="flex w-full max-w-[680px] items-center gap-5 rounded-2xl px-8 py-5"
            style={{
              background: "#0d2a52",
              border: "2px solid rgba(122, 173, 255, 0.34)",
              boxShadow: "0 0 28px rgba(39,120,255,0.14), 0 12px 36px rgba(0,0,0,0.38)",
            }}
          >
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
              style={{ background: "rgba(122,173,255,0.14)", border: "1px solid rgba(122,173,255,0.24)" }}
            >
              🧪
            </span>
            <div className="flex-1">
              <p className="text-xl font-bold leading-snug" style={{ color: "#eef5ff" }}>
                Demo-test af ny informationsskærm
              </p>
              <p className="mt-1 text-base font-semibold" style={{ color: "#b8d1f2" }}>
                Giv gerne din mening
              </p>
            </div>
            <div className="ml-2">
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
          style={{
            position: "absolute",
            right: "max(0.25rem, calc((100% - 1400px) / 2 + 0.25rem))",
            top: 115,
            zIndex: 10,
            transform: "translateX(200px)",
          }}
        >
          <LatestMessageBlock />
        </div>
      </div>
    </div>
  )
}
