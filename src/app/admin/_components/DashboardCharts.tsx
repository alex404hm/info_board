"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

interface DayCount {
  day: string
  count: number
}

interface DashboardChartsProps {
  messagesPerDay: DayCount[]
}

export default function DashboardCharts({ messagesPerDay }: DashboardChartsProps) {
  const hasData = messagesPerDay.some(d => d.count > 0)

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Beskeder oprettet — seneste 7 dage
        </h2>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        {!hasData ? (
          <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
            Ingen beskeder oprettet de seneste 7 dage
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={messagesPerDay} barCategoryGap="30%">
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--border)"
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                width={24}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--foreground)",
                }}
                cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                formatter={(value) => [value ?? 0, "Beskeder"]}
                labelStyle={{ color: "var(--muted-foreground)" }}
              />
              <Bar dataKey="count" fill="#5f9dff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  )
}
