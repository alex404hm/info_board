import { NextResponse } from "next/server"

const TRAFIK_API = "https://api.dr.dk/trafik/posts?regions%5B%5D=CPH&concluded=false&limited=true"
const TRAFIK_API_CONCLUDED = "https://api.dr.dk/trafik/posts?regions%5B%5D=CPH&concluded=true&limited=true"

export type TrafikUpdate = {
  _id: string
  createdTime: string
  text: string
}

export type TrafikPost = {
  _id: string
  region: string
  type: string
  subtype: string
  text: string
  concluded: boolean
  sortTime: string
  createdTime: string
  updatedTime: string
  updates: TrafikUpdate[]
  highlight: boolean
}

async function fetchPosts(url: string): Promise<TrafikPost[]> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      // No standard Next.js fetch cache here because the response can exceed 2MB.
      // We handle data reduction manually before returning to the client.
      cache: "no-store",
    })
    if (!res.ok) return []
    const data = await res.json()
    if (!Array.isArray(data)) return []

    // Reduce data size: limit to 20 posts and strip unnecessary fields/long update histories
    return data.slice(0, 20).map((post: any) => ({
      _id: post._id,
      region: post.region,
      type: post.type,
      subtype: post.subtype,
      text: post.text,
      concluded: post.concluded,
      sortTime: post.sortTime,
      createdTime: post.createdTime,
      updatedTime: post.updatedTime,
      // Only keep the 2 most recent updates to save space
      updates: Array.isArray(post.updates) 
        ? post.updates.slice(0, 2).map((u: any) => ({
            _id: u._id,
            createdTime: u.createdTime,
            text: u.text
          })) 
        : [],
      highlight: post.highlight,
    }))
  } catch (err) {
    console.error(`Error fetching from ${url}:`, err)
    return []
  }
}

export async function GET() {
  try {
    const [active, concluded] = await Promise.all([
      fetchPosts(TRAFIK_API),
      fetchPosts(TRAFIK_API_CONCLUDED),
    ])

    // Merge, deduplicate by _id, sort by sortTime desc
    const seen = new Set<string>()
    const all: TrafikPost[] = []
    
    // Prioritize active posts
    for (const post of [...active, ...concluded]) {
      if (!seen.has(post._id)) {
        seen.add(post._id)
        all.push(post)
      }
    }
    
    all.sort((a, b) => new Date(b.sortTime).getTime() - new Date(a.sortTime).getTime())

    // Final limit to ensure we don't send too much data to the client
    const limitedResults = all.slice(0, 30)

    return NextResponse.json(
      { fetchedAt: new Date().toISOString(), items: limitedResults },
      { 
        headers: { 
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" 
        } 
      },
    )
  } catch (err) {
    console.error("Traffic fetch error:", err)
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}
