import { NextResponse } from "next/server"

export type WageStep = {
  apprenticeshipPeriod: string
  monthlySalaryDkk: number
  hourlySalaryDkk: number
}

export type WageGroup = {
  ageGroup: "under18" | "over18"
  steps: WageStep[]
}

export type WageResponse = {
  lastUpdated: string
  groups: WageGroup[]
}

const WAGE_DATA: WageResponse = {
  lastUpdated: "2025-03-01T00:00:00.000Z",
  groups: [
    {
      ageGroup: "under18",
      steps: [
        { apprenticeshipPeriod: "1. periode", monthlySalaryDkk: 16500, hourlySalaryDkk: 95.19 },
        { apprenticeshipPeriod: "2. periode", monthlySalaryDkk: 17800, hourlySalaryDkk: 102.69 },
        { apprenticeshipPeriod: "3. periode", monthlySalaryDkk: 19100, hourlySalaryDkk: 110.19 },
        { apprenticeshipPeriod: "4. periode", monthlySalaryDkk: 20400, hourlySalaryDkk: 117.69 },
      ],
    },
    {
      ageGroup: "over18",
      steps: [
        { apprenticeshipPeriod: "1. periode", monthlySalaryDkk: 20200, hourlySalaryDkk: 116.54 },
        { apprenticeshipPeriod: "2. periode", monthlySalaryDkk: 21700, hourlySalaryDkk: 125.19 },
        { apprenticeshipPeriod: "3. periode", monthlySalaryDkk: 23200, hourlySalaryDkk: 133.85 },
        { apprenticeshipPeriod: "4. periode", monthlySalaryDkk: 24700, hourlySalaryDkk: 142.50 },
      ],
    },
  ],
}

export async function GET() {
  return NextResponse.json(WAGE_DATA)
}
