"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export const description = "An interactive bar chart"

type ChartPoint = {
  date: string
  current: number
  previous: number
}

type ChartResponse = {
  data: ChartPoint[]
  days: number
}

const chartConfig = {
  views: {
    label: "Beskeder",
  },
  current: {
    label: "Seneste periode",
    color: "var(--chart-2)",
  },
  previous: {
    label: "Forrige periode",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function ChartBarInteractive({ days = 30 }: { days?: number }) {
  const [chartData, setChartData] = React.useState<ChartPoint[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isError, setIsError] = React.useState(false)
  const [activeChart, setActiveChart] =
    React.useState<"current" | "previous">("current")

  React.useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        setIsLoading(true)
        setIsError(false)

        const res = await fetch(`/api/admin/dashboard/messages-chart?days=${days}`, {
          cache: "no-store",
        })

        if (!res.ok) {
          throw new Error(`Failed to load chart data: ${res.status}`)
        }

        const json = (await res.json()) as ChartResponse
        if (isMounted) {
          setChartData(Array.isArray(json.data) ? json.data : [])
        }
      } catch {
        if (isMounted) {
          setIsError(true)
          setChartData([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [days])

  const total = React.useMemo(
    () => ({
      current: chartData.reduce((acc, curr) => acc + curr.current, 0),
      previous: chartData.reduce((acc, curr) => acc + curr.previous, 0),
    }),
    [chartData]
  )

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b p-0! sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:py-0!">
          <CardTitle>Beskeder over tid</CardTitle>
          <CardDescription>
            Seneste {days} dage sammenlignet med forrige {days} dage
          </CardDescription>
        </div>
        <div className="flex">
          {(["current", "previous"] as const).map((chart) => {
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-xs text-muted-foreground">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg leading-none font-bold sm:text-3xl">
                  {total[chart].toLocaleString()}
                </span>
              </button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        {isError ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            Kunne ikke hente diagramdata.
          </div>
        ) : isLoading ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            Henter diagramdata...
          </div>
        ) : (
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                />
              }
            />
            <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
          </BarChart>
        </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
