"use client"

import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
  RadialBarChart, RadialBar, PolarAngleAxis,
} from "recharts"
import { Star } from "lucide-react"

interface DayData {
  day: string
  views: number
  logins: number
}

interface Props {
  activityData: DayData[]
  avgRating: number
  totalFeedback: number
}

export function ActivityChart({ activityData }: { activityData: DayData[] }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={activityData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
        <defs>
          <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#5f9dff" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#5f9dff" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="loginsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#34d399" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fill: "rgba(148,163,184,0.7)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "rgba(148,163,184,0.7)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "#0d1525",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            color: "#f0f4ff",
            fontSize: 12,
          }}
          itemStyle={{ color: "#94a3b8" }}
          labelStyle={{ color: "#f0f4ff", fontWeight: 600 }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(v: any, name: any) => [v, name === "views" ? "Sidevisninger" : "Logins"] as any}
        />
        <Area type="monotone" dataKey="views" stroke="#5f9dff" strokeWidth={2} fill="url(#viewsGrad)" dot={false} />
        <Area type="monotone" dataKey="logins" stroke="#34d399" strokeWidth={2} fill="url(#loginsGrad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function FeedbackGauge({ avgRating, totalFeedback }: { avgRating: number; totalFeedback: number }) {
  const radialData = [{
    value: (avgRating / 5) * 100,
    fill: avgRating >= 4 ? "#34d399" : avgRating >= 3 ? "#60a5fa" : "#f87171",
  }]

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <div className="relative">
        <ResponsiveContainer width={120} height={120}>
          <RadialBarChart innerRadius="72%" outerRadius="100%" data={radialData} startAngle={225} endAngle={-45}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" cornerRadius={6} background={{ fill: "rgba(255,255,255,0.05)" }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">
            {totalFeedback === 0 ? "—" : avgRating.toFixed(1)}
          </span>
          <span className="text-[10px] text-muted-foreground">/ 5</span>
        </div>
      </div>
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map((s) => (
          <Star
            key={s}
            className="h-3 w-3"
            style={{
              fill: s <= Math.round(avgRating) && totalFeedback > 0 ? "#f59e0b" : "transparent",
              color: s <= Math.round(avgRating) && totalFeedback > 0 ? "#f59e0b" : "rgba(255,255,255,0.12)",
            }}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{totalFeedback} svar</p>
    </div>
  )
}

export default function DashboardCharts({ activityData, avgRating, totalFeedback }: Props) {
  return { activityData, avgRating, totalFeedback }
}
