export type IntranetSection = {
  key: string
  title: string
  subtitle: string
  icon: string
  iconColor: string
  iconBg: string
  accentColor: string
  content: string
}

export const INTRANET_SECTIONS: IntranetSection[] = [
  {
    key: "befordring",
    title: "Befordring",
    subtitle: "Tilskud og refusionsskema",
    icon: "Bus",
    iconColor: "#60a5fa",
    iconBg: "rgba(96,165,250,0.15)",
    accentColor: "#60a5fa",
    content: `Som Skoleoplæringslærling kan du få befordringstilskud svarende til billigste offentlige transportmiddel, hvis din samlede transportvej er mindst 20 km om dagen. Befordringstilskuddet udbetales midt i måneden og beregnes ud fra billigste offentlige transport. Ansøgning sendes senest sidste arbejdsdag i måneden via sdbf.dk. Du kan maksimalt søge 4 måneder bagud.`,
  },
  {
    key: "laerepladssogning",
    title: "Læreplads",
    subtitle: "Søgning og aftaleformer",
    icon: "Briefcase",
    iconColor: "#818cf8",
    iconBg: "rgba(129,140,248,0.15)",
    accentColor: "#818cf8",
    content: `Når du er optaget i Skoleoplæringen, skal du fortsat være aktivt lærepladssøgende. Du kan få råd og vejledning undervejs i dit forløb fra din instruktør, som er din nærmeste kontaktperson. Du kan komme i restuddannelsesaftale, kort aftale, delaftale eller virksomhedsforlagt oplæring (VFO).`,
  },
  {
    key: "emma",
    title: "EMMA",
    subtitle: "Elevplan og uddannelsesplan",
    icon: "BookOpen",
    iconColor: "#34d399",
    iconBg: "rgba(52,211,153,0.15)",
    accentColor: "#34d399",
    content: `EMMA er TEC's digitale platform til uddannelsesplanlægning. Her finder du din personlige uddannelsesplan, mødebøger, evalueringer og dokumentation. Log ind med dit UNI-login. Sørg for at holde din uddannelsesplan opdateret og tjekke jævnligt for beskeder fra din instruktør.`,
  },
  {
    key: "forsikring",
    title: "Forsikring",
    subtitle: "Dækning under oplæringen",
    icon: "Shield",
    iconColor: "#fb923c",
    iconBg: "rgba(251,146,60,0.15)",
    accentColor: "#fb923c",
    content: `Som lærling i Skoleoplæringen er du dækket af en arbejdsskadeforsikring under hele din uddannelse. Forsikringen dækker arbejdsskader og erhvervssygdomme. Ved ulykke eller skade under uddannelsen skal det straks anmeldes til din instruktør og TEC's administration. Husk at læse vilkårene for din specifikke forsikringsdækning.`,
  },
  {
    key: "sygdom",
    title: "Sygdom",
    subtitle: "Regler og procedurer",
    icon: "HeartPulse",
    iconColor: "#f472b6",
    iconBg: "rgba(244,114,182,0.15)",
    accentColor: "#f472b6",
    content: `Hvis du er syg, skal du sygemelde dig til Skoleoplæringen senest kl. 8:00 på første sygedag. Ring til dit hold eller send besked via EMMA. Efter 3 sygedage kan der kræves en friattest. Ved langvarigt sygefravær tager din instruktør kontakt for at aftale den videre proces og eventuel sygeopfølgning.`,
  },
  {
    key: "fravaer",
    title: "Fravær & Orlov",
    subtitle: "Regler og ansøgning",
    icon: "CalendarOff",
    iconColor: "#a78bfa",
    iconBg: "rgba(167,139,250,0.15)",
    accentColor: "#a78bfa",
    content: `Fravær og orlov under din uddannelse skal altid aftales med din instruktør på forhånd. Ulovligt fravær kan have konsekvenser for din skoleoplæringsydelse. Barselsorlov følger de gældende regler for lærlinge. Orlov af personlige årsager kræver godkendelse fra TEC's ledelse. Kontakt din instruktør hurtigst muligt ved behov.`,
  },
  {
    key: "skoleydelse",
    title: "Skoleydelse",
    subtitle: "Løn og udbetaling",
    icon: "Banknote",
    iconColor: "#2dd4bf",
    iconBg: "rgba(45,212,191,0.15)",
    accentColor: "#2dd4bf",
    content: `Som lærling i Skoleoplæringen modtager du skoleoplæringsydelse efter gældende satser. Ydelsen udbetales den sidste bankdag i måneden. Skatteoplysninger hentes automatisk fra SKAT via dit CPR-nummer. Sørg for at din bankkonto er registreret korrekt i systemet. Spørgsmål om løn og udbetaling rettes til TEC's administration.`,
  },
]
