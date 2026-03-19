import { NextResponse } from "next/server"

type CanteenItem = {
  name: string
  price: string
  category: string
}

async function fetchKanplaCanteenData() {
  const response = await fetch("https://app.kanpla.io/api/internal/load/frontend", {
    method: "POST",
    headers: {
      "accept": "application/json, text/plain, */*",
      "accept-language": "da-DK,da;q=0.9,en-US;q=0.8,en;q=0.7",
      "authorization": "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjJhYWM0MWY3NTA4OGZlOGUwOWEwN2Q0NDRjZmQ2YjhjZTQ4MTJhMzEiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20va2FucGxhLTg3YmUzIiwiYXVkIjoia2FucGxhLTg3YmUzIiwiYXV0aF90aW1lIjoxNzcyNDM1MTUyLCJ1c2VyX2lkIjoiNndvMjdNYjA3Vk5TRnVOR3FIVjg2WUYwTU5yMSIsInN1YiI6IjZ3bzI3TWIwN1ZOU0Z1TkdxSFY4NllGME1OcjEiLCJpYXQiOjE3NzMxMzc0NjksImV4cCI6MTc3MzE0MTA2OSwiZW1haWwiOiJhbG1vMzBAZWxldi50ZWMuZGsiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsiYWxtbzMwQGVsZXYudGVjLmRrIl19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.p6P4_ITzR37_j3BzsOJLzEiPDaCqGc2cy1PP0fDoDJ-4BbW8scKrfyN9o4L4x4H2IyvSprtN8SHg5Dxgliiayf6pkeXQH4IneCZFBc_OV0PFBxWr7rtAPSaL20UUhNBRFyfMZX1VgO13HFmEbsKdqNs0fqzJW0xZT_2w4yqsU1nYVa9RE0oy3i6QARuZbG2KNyX9yyL5lVp1NFNeuTeAPMDkhPTHKUm5cI7r-njhJoqRUdI7YmdwY59IW6v8Imcf6XSKpb7UrYAM96PLINW4-rMQu0j7vagP4ujSWRNYLcEAa_z2aynNNvcdAlcdzsDsuKzkVJaFm3KeE9MeBRpxEg",
      "content-type": "application/json",
      "kanpla-app-env": "PROD",
      "kanpla-auth-provider": "GAuth",
      "origin": "https://app.kanpla.io",
      "referer": "https://app.kanpla.io/app"
    },
    body: JSON.stringify({
      "userId": "6wo27Mb07VNSFuNGqHV86YF0MNr1",
      "url": "app",
      "language": "da"
    }),
    next: { revalidate: 600 }
  })

  if (!response.ok) {
    throw new Error(`Kanpla API returned status ${response.status}`)
  }

  return response.json()
}

export async function GET() {
  try {
    const data = await fetchKanplaCanteenData()
    
    // Get items from the specific offer ID
    const targetOfferId = "n8JTISR5cgYOjM2dS4IE"
    const offer = data.offers?.[targetOfferId]
    
    if (!offer || !offer.items) {
      return NextResponse.json({ items: [] })
    }

    // Extract items with name, price, and category
    const items: CanteenItem[] = offer.items.map((item: any) => {
      const name: string = item.name || "Unavngivet ret"

      // Try to get category from various possible Kanpla fields
      let category: string =
        item.category?.name ||
        item.productLine?.name ||
        item.labels?.[0] ||
        item.group?.name ||
        ""

      // Normalise to one of the 4 UI categories
      const normalise = (raw: string, itemName: string): string => {
        const s = (raw + " " + itemName).toLowerCase()
        // Varme drikke — check before generic drikkevarer
        if (s.includes("varm") && (s.includes("drikke") || s.includes("kakao"))) return "Varme drikke"
        if (s.includes("kaffe") || s.includes("espresso") || s.includes("cappuccino") ||
            s.includes("latte") || s.includes("americano") || s.includes("macchiato") ||
            s.includes(" te ") || s.match(/\bte\b/) || s.includes("chai"))             return "Varme drikke"
        // Drikkevarer (cold)
        if (s.includes("drikkevare") || s.includes("juice") || s.includes("smoothie") ||
            s.includes("sodavand") || s.includes("cola") || s.includes("vand") ||
            s.includes("mælk") || s.includes("shake") || s.includes("energi"))         return "Drikkevarer"
        // Morgenmad
        if (s.includes("morgenmad") || s.includes("breakfast") || s.includes("yoghurt") ||
            s.includes("müsli") || s.includes("havregrød") || s.includes("grød") ||
            s.includes("croissant") || s.includes("bagel") || s.includes("toast") ||
            s.includes("sandwich") || s.includes("wrap") || s.includes("bolle") ||
            s.includes("rundstykke") || s.includes("brød"))                             return "Morgenmad"
        return "Diverse"
      }

      category = normalise(category, name)

      return {
        name,
        price: item.unitPrice ? `${(item.unitPrice / 80).toFixed(2)} DKK` : "Dagspris",
        category,
      }
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error("Canteen API error:", error)
    return NextResponse.json(
      { 
        error: "Could not read canteen data from Kanpla API",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
