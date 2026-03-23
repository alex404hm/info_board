export type Departure = {
  line: string
  destination: string
  from: string
  sourceStopId: string
  sourceStopName: string
  sourceStopSlot: 1 | 2
  time: string
  minutesUntil: number
  type: "bus" | "train"
  platform: string
  delayMin: number
  cancelled: boolean
}

export type DepartureGroup = {
  id: string
  sourceStopSlot: 1 | 2
  title: string
  sourceStopId: string
  sourceStopName: string
  departures: Departure[]
  error?: string
}

export type DeparturesApiResponse = {
  fetchedAt: string
  stopIds: string[]
  groups: DepartureGroup[]
  departures?: Departure[]
}

export type WeatherApiResponse = {
  location?: {
    address: string
    lat: number
    lon: number
  }
  updatedAt: string
  temperatureC: number | null
  humidityPct: number | null
  windKmh: number | null
  condition: string
  symbolCode?: string | null
  forecastDays?: Array<{
    date: string
    weekday: string
    minC: number | null
    maxC: number | null
    condition: string
    symbolCode?: string
    windMs?: number | null
  }>
}

export type DailyDishApiResponse = {
  found: boolean
  servingToday?: boolean
  name: string
  dishName?: string
  type?: string
  typeName?: string
  description?: string
  priceLabel: string
  unitPrice: number | null
  unitSystem?: string
  moduleName?: string
  imageUrl?: string | null
  dateLabel?: string
  nextDishName?: string | null
  nextDishType?: string | null
  nextDishDateLabel?: string | null
  currency?: string
  regular?: {
    dishName: string
    description: string
    priceLabel: string
  } | null
  vegetarian?: {
    dishName: string
    description: string
    priceLabel: string
  } | null
  weekMenu?: Array<{
    dateKey: string
    dayLabel: string
    dishName: string
    regular: { dishName: string; description: string; priceLabel: string } | null
    vegetarian: { dishName: string; description: string; priceLabel: string } | null
  }>
}

export type ImportantContact = {
  name: string
  role: string
  phone: string
  email: string
  status: string
}

export type Instructor = {
  id: string
  name: string
  title: string
  area: string
  email: string
  phone: string
  room: string
}

export type DrNewsItem = {
  title: string
  link: string
  description: string
  content: string
  pubDate: string
  imageUrl?: string | null
  imageCaption?: string | null
  author?: string | null
  bodyParagraphs?: string[]
  source: "dr"
}

export type DrNewsApiResponse = {
  source: string
  fetchedAt: string
  items: DrNewsItem[]
}
