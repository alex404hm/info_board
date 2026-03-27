import { NextResponse } from "next/server";

type CalendarEvent = {
  danishShort: string;
  kirkeaar: boolean;
  holliday: boolean;
};

type CalendarDay = {
  date: string;
  formattedDate: string;
  dayName: string;
  weekday: string;
  holliday: boolean;
  events: CalendarEvent[];
  navnedage?: string[];
  moonSymbol?: string;
};

type CalendarFullResponse = {
  year: number;
  days: CalendarDay[];
  solhvervOgJævndøgn?: {
    equinoxesSpring: string;
    equinoxesAutumn: string;
    solsticeSummer: string;
    solsticeWinter: string;
  };
  flagdage?: string[];
};

export async function GET(req: Request, context: { params: Promise<{ year: string }> }) {
  // ✅ Await the params first
  const params = await context.params;
  const year = params.year;

  if (!year) {
    return NextResponse.json({ error: "Year parameter is required" }, { status: 400 });
  }

  try {
    // 1️⃣ Main calendar
    const calendarRes = await fetch(`https://api.kalendarium.dk/Calendar/${year}`);
    if (!calendarRes.ok) throw new Error("Failed to fetch calendar");
    const calendarData = await calendarRes.json();

    // 2️⃣ NameDays
    const namedayRes = await fetch(`https://api.kalendarium.dk/NameDays/${year}`);
    const namedayData = namedayRes.ok ? await namedayRes.json() : { days: [] };

    // 3️⃣ Equinox/Solstice
    const equinoxRes = await fetch(`https://api.kalendarium.dk/EquinoxSolstice/${year}`);
    const equinoxData = equinoxRes.ok ? await equinoxRes.json() : {};

    // 4️⃣ Flagdays
    const flagRes = await fetch(`https://api.kalendarium.dk/FlagDays/${year}`);
    const flagData = flagRes.ok ? await flagRes.json() : { days: [] };

    // 5️⃣ Assemble days
    const days: CalendarDay[] = calendarData.days.map((day: any) => {
      const navnedage =
        namedayData.days?.find((d: any) => d.date === day.date)?.names || [];
      const events: CalendarEvent[] = day.events.map((e: any) => ({
        danishShort: e.danishShort,
        kirkeaar: e.kirkeaar,
        holliday: e.holliday,
      }));

      return {
        date: day.date,
        formattedDate: day.formattedDate,
        dayName: day.dayName,
        weekday: day.weekday,
        holliday: day.holliday,
        events,
        navnedage,
        moonSymbol: day.moonSymbol || "",
      };
    });

    const result: CalendarFullResponse = {
      year: calendarData.yearInfo.year,
      days,
      solhvervOgJævndøgn: equinoxData,
      flagdage: flagData.days?.map((d: any) => d.dayName) || [],
    };

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}