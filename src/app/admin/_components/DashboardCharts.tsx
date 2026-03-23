"use client"

import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts"

interface DayData {
  day: string
  views: number
  logins: number
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
