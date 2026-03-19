import { NextRequest, NextResponse } from "next/server"
import type { Employee } from "@/types"
import employeesData from "@/data/employees.json"

const employees = employeesData as Employee[]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search")?.toLowerCase()
  const title = searchParams.get("title")?.toLowerCase()

  let results = employees

  if (search) {
    results = results.filter(
      (e) =>
        e.name.toLowerCase().includes(search) ||
        e.email.toLowerCase().includes(search) ||
        e.title.toLowerCase().includes(search),
    )
  }

  if (title) {
    results = results.filter((e) => e.title.toLowerCase().includes(title))
  }

  return NextResponse.json({
    total: results.length,
    employees: results,
  })
}
