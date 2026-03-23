"use client"

import Link from "next/link"
import { createContext, useContext, useState } from "react"
import {
  ArrowLeft,
  AlertTriangle,
  Info,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Bus,
  Briefcase,
  Star,
  Umbrella,
  Heart,
  Clock,
  GraduationCap,
  MapPin,
} from "lucide-react"

// ── In-app browser context ────────────────────────────────────────────────────

const OpenUrlContext = createContext<((url: string) => void) | null>(null)

// ── Types ──────────────────────────────────────────────────────────────────────

type SectionKey =
  | "befordring"
  | "laerepladssogning"
  | "emma"
  | "forsikring"
  | "sygdom"
  | "fravaer_orlov"
  | "ydelse"

type Category = {
  key: SectionKey
  icon: React.ElementType
  iconColor: string
  iconBg: string
  bgFrom: string
  bgTo: string
  glowA: string
  glowB: string
  accentColor: string
  title: string
  subtitle: string
}

// ── Category definitions ───────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  {
    key: "befordring",
    icon: Bus,
    iconColor: "#60a5fa",
    iconBg: "rgba(96,165,250,0.22)",
    bgFrom: "rgba(30,58,138,0.95)",
    bgTo: "rgba(15,23,42,0.99)",
    glowA: "rgba(96,165,250,0.22)",
    glowB: "rgba(59,130,246,0.12)",
    accentColor: "#60a5fa",
    title: "Befordring",
    subtitle: "Tilskud og refusionsskema",
  },
  {
    key: "laerepladssogning",
    icon: Briefcase,
    iconColor: "#818cf8",
    iconBg: "rgba(129,140,248,0.22)",
    bgFrom: "rgba(49,46,129,0.95)",
    bgTo: "rgba(30,27,75,0.99)",
    glowA: "rgba(129,140,248,0.22)",
    glowB: "rgba(99,102,241,0.12)",
    accentColor: "#818cf8",
    title: "Læreplads",
    subtitle: "Søgning og aftaleformer",
  },
  {
    key: "emma",
    icon: Star,
    iconColor: "#fbbf24",
    iconBg: "rgba(251,191,36,0.22)",
    bgFrom: "rgba(120,53,15,0.95)",
    bgTo: "rgba(69,26,3,0.99)",
    glowA: "rgba(251,191,36,0.22)",
    glowB: "rgba(245,158,11,0.12)",
    accentColor: "#fbbf24",
    title: "EMMA",
    subtitle: "Krav og løbende evaluering",
  },
  {
    key: "forsikring",
    icon: Umbrella,
    iconColor: "#c084fc",
    iconBg: "rgba(192,132,252,0.22)",
    bgFrom: "rgba(88,28,135,0.95)",
    bgTo: "rgba(59,7,100,0.99)",
    glowA: "rgba(192,132,252,0.22)",
    glowB: "rgba(168,85,247,0.12)",
    accentColor: "#c084fc",
    title: "Forsikring",
    subtitle: "Dækning under uddannelse",
  },
  {
    key: "sygdom",
    icon: Heart,
    iconColor: "#f87171",
    iconBg: "rgba(248,113,113,0.22)",
    bgFrom: "rgba(127,29,29,0.95)",
    bgTo: "rgba(69,10,10,0.99)",
    glowA: "rgba(248,113,113,0.22)",
    glowB: "rgba(239,68,68,0.12)",
    accentColor: "#f87171",
    title: "Sygdom",
    subtitle: "Fraværsprocedurer og regler",
  },
  {
    key: "fravaer_orlov",
    icon: Clock,
    iconColor: "#fb923c",
    iconBg: "rgba(251,146,60,0.22)",
    bgFrom: "rgba(124,45,18,0.95)",
    bgTo: "rgba(67,20,7,0.99)",
    glowA: "rgba(251,146,60,0.22)",
    glowB: "rgba(249,115,22,0.12)",
    accentColor: "#fb923c",
    title: "Fravær & Orlov",
    subtitle: "Barsel, fravær og fridage",
  },
  {
    key: "ydelse",
    icon: GraduationCap,
    iconColor: "#2dd4bf",
    iconBg: "rgba(45,212,191,0.22)",
    bgFrom: "rgba(19,78,74,0.95)",
    bgTo: "rgba(4,47,46,0.99)",
    glowA: "rgba(45,212,191,0.22)",
    glowB: "rgba(20,184,166,0.12)",
    accentColor: "#2dd4bf",
    title: "Skoleydelse",
    subtitle: "Din ydelse under oplæring",
  },
]

// ── In-app browser overlay ────────────────────────────────────────────────────

function InAppBrowser({ url, onBack }: { url: string; onBack: () => void }) {
  const domain = (() => {
    try { return new URL(url).hostname.replace(/^www\./, "") }
    catch { return url }
  })()

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        background: "var(--background)",
      }}
    >
      {/* Top bar — back button only */}
      <div
        className="shrink-0 flex items-center gap-3 px-4 py-3"
        style={{
          background: "var(--surface-muted)",
          borderBottom: "1px solid var(--surface-border)",
        }}
      >
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all active:scale-95"
          style={{
            background: "var(--surface-soft)",
            border: "1px solid var(--surface-border)",
            color: "var(--foreground-muted)",
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          Tilbage
        </button>

        {/* Domain pill */}
        <span
          className="truncate text-xs"
          style={{ color: "var(--foreground-soft)" }}
        >
          {domain}
        </span>
      </div>

      {/* iframe */}
      <iframe
        src={url}
        className="flex-1 w-full border-0"
        title={domain}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function InfoBox({
  type,
  children,
}: {
  type: "info" | "warning" | "success"
  children: React.ReactNode
}) {
  const s = {
    info: {
      bg: "rgba(95,157,255,0.08)",
      border: "rgba(95,157,255,0.28)",
      icon: <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#5f9dff" }} />,
    },
    warning: {
      bg: "rgba(249,115,22,0.08)",
      border: "rgba(249,115,22,0.32)",
      icon: <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#f97316" }} />,
    },
    success: {
      bg: "rgba(52,211,153,0.08)",
      border: "rgba(52,211,153,0.28)",
      icon: <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#34d399" }} />,
    },
  }[type]
  return (
    <div className="flex gap-2.5 rounded-xl p-3.5 text-sm leading-relaxed" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
      {s.icon}
      <div style={{ color: "var(--foreground-muted)" }}>{children}</div>
    </div>
  )
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 mt-5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest first:mt-0" style={{ color: "var(--foreground-soft)" }}>
      <ChevronRight className="h-3 w-3 shrink-0" />
      {children}
    </h3>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--accent)" }} />
          <span dangerouslySetInnerHTML={{ __html: item }} />
        </li>
      ))}
    </ul>
  )
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid var(--surface-border)" }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: "var(--surface-soft)", borderBottom: "1px solid var(--surface-border)" }}>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--foreground-muted)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: ri < rows.length - 1 ? "1px solid var(--surface-border)" : "none", background: ri % 2 === 0 ? "transparent" : "rgba(255,255,255,0.012)" }}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-2.5 text-sm" style={{ color: ci === 0 ? "var(--foreground)" : "var(--foreground-muted)" }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// External links open in the in-app browser; internal links use Next.js router
function LinkPill({ href, children, internal = false }: { href: string; children: React.ReactNode; internal?: boolean }) {
  const openUrl = useContext(OpenUrlContext)

  if (internal) {
    return (
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/5"
        style={{ color: "var(--accent)", border: "1px solid rgba(95,157,255,0.22)", background: "rgba(95,157,255,0.06)" }}
      >
        {children}
        <ExternalLink className="h-3 w-3 opacity-60" />
      </Link>
    )
  }

  return (
    <button
      onClick={() => openUrl?.(href)}
      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/5 active:scale-95"
      style={{ color: "var(--accent)", border: "1px solid rgba(95,157,255,0.22)", background: "rgba(95,157,255,0.06)" }}
    >
      {children}
      <ExternalLink className="h-3 w-3 opacity-60" />
    </button>
  )
}

// ── Section content ────────────────────────────────────────────────────────────

function BefordringContent() {
  return (
    <div className="space-y-4">
      <InfoBox type="info">
        Som Skoleoplæringslærling kan du få befordringstilskud svarende til billigste offentlige transportmiddel, hvis din samlede transportvej er mindst <strong>20 km om dagen</strong>.
      </InfoBox>

      <H3>Satser og udbetaling</H3>
      <DataTable
        headers={["Situation", "Tilskud"]}
        rows={[
          ["Under oplæring (værksted)", "90 % af billigste offentlige transport"],
          ["På skoleophold",            "100 % af billigste offentlige transport"],
        ]}
      />
      <BulletList items={[
        "Befordringstilskuddet udbetales <strong>midt i måneden</strong>.",
        "Beløbet beregnes ud fra billigste offentlige transport.",
        "Når du modtager befordringstilskud, kan du <strong>ikke</strong> trække kørsel fra på selvangivelsen.",
        "Når du er i <strong>delaftale</strong>, kan du ikke modtage befordringstilskud, men kan trække kørsel fra på selvangivelsen.",
      ]} />

      <H3>Ansøgning</H3>
      <BulletList items={[
        "Ansøgning sendes senest <strong>sidste arbejdsdag i måneden</strong> via sdbf.dk.",
        "Du kan maksimalt søge <strong>4 måneder bagud</strong>.",
        "Du skal bruge dit NemID for at logge ind på sdbf.dk.",
        "Spørg din instruktør, hvis du har spørgsmål vedrørende befordring.",
      ]} />

      <div className="flex flex-wrap gap-2 pt-1">
        <LinkPill href="https://www.sdbf.dk">Ansøg via sdbf.dk</LinkPill>
      </div>

      <H3>Refusionsskema (PDF)</H3>
      <div
        className="overflow-hidden rounded-2xl"
        style={{ border: "1px solid var(--surface-border)", height: "65vh", boxShadow: "0 2px 16px rgba(0,0,0,0.18)" }}
      >
        <iframe
          src="/Befordringsrefusion.pdf#toolbar=0&navpanes=0&scrollbar=1"
          className="h-full w-full border-0"
          title="Befordringsrefusion PDF"
        />
      </div>
    </div>
  )
}

function LaerepladssogningContent() {
  return (
    <div className="space-y-4">
      <InfoBox type="info">
        Når du er optaget i Skoleoplæringen, skal du fortsat være aktivt lærepladssøgende. Du kan få råd og vejledning undervejs i dit forløb.
      </InfoBox>

      <H3>Instruktører</H3>
      <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
        Under din uddannelse i Skoleoplæringen er det din instruktør, som er din nærmeste kontaktperson. Du kan altid spørge din instruktør til råds om din uddannelse, og instruktøren kan også henvise dig til andre kontaktpersoner på TEC. Navn og kontaktoplysninger på instruktørerne får du udleveret på et informationsark ved uddannelsens start.
      </p>

      <H3>Aftaleformer</H3>
      <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--foreground-muted)" }}>
        I løbet af din tid i Skoleoplæringen har du mulighed for at komme i forskellige former for aftaler.
      </p>

      <div className="space-y-3">
        <div className="rounded-xl p-4 space-y-2" style={{ background: "var(--surface)", border: "1px solid var(--surface-border)" }}>
          <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Restuddannelsesaftale</p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
            En aftale for resten af lærlingens læretid — lærlingen har tidligere gennemført en del af sin uddannelse i Skoleoplæringen eller en anden virksomhed.
          </p>
          <BulletList items={[
            "Virksomheden skal være godkendt for at ansætte lærlingen",
            "Lærlingen må deltage i virksomhedens produktion",
            "Virksomheden betaler lærlingens løn efter gældende overenskomst",
            "Lærlingen er omfattet af virksomhedens forsikring",
            "<strong>3 måneders</strong> gensidig prøvetid",
          ]} />
        </div>

        <div className="rounded-xl p-4 space-y-2" style={{ background: "var(--surface)", border: "1px solid var(--surface-border)" }}>
          <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Kort aftale</p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
            Samme vilkår som restuddannelsesaftalen — desuden gælder:
          </p>
          <BulletList items={[
            "Skal indeholde minimum én oplæringsperiode og én skoleperiode",
            "Maks. <strong>1 kort aftale</strong> mellem samme elev og virksomhed (undtagelsesvist en anden med godkendelse fra lokalt uddannelsesudvalg)",
            "Efter en kort aftale er lærlingen berettiget til at blive optaget i Skoleoplæringen igen",
          ]} />
        </div>

        <div className="rounded-xl p-4 space-y-2" style={{ background: "var(--surface)", border: "1px solid var(--surface-border)" }}>
          <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Delaftale</p>
          <BulletList items={[
            "Indeholder kun én oplæringsperiode",
            "Kan kun indgås og gennemføres <strong>én gang</strong> mellem samme elev og virksomhed",
            "Efter en delaftale er lærlingen berettiget til at komme tilbage til Skoleoplæringen",
          ]} />
        </div>

        <div className="rounded-xl p-4 space-y-2" style={{ background: "var(--surface)", border: "1px solid var(--surface-border)" }}>
          <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Virksomhedsforlagt oplæring (VFO)</p>
          <BulletList items={[
            "Virksomheden skal være godkendt til at have lærlinge",
            "Skoleoplæringen betaler skoleoplæringsydelsen — lærlingen får befordringstilskud efter reglerne",
            "Maks. <strong>3 uger</strong> i samme virksomhed og højst <strong>6 uger</strong> af elevens samlede oplæring",
            "Lærlingen må ikke deltage i virksomhedens produktion (medmindre det er på vegne af en medarbejder)",
            "Lærlingen er delvist omfattet af Skoleoplæringens forsikring",
          ]} />
        </div>
      </div>

      <H3>Straffeattest</H3>
      <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
        Hvis en virksomhed kræver det, kan du blive bedt om at indhente din straffeattest. Du kan bestille straffeattest via borger.dk eller via din lokale politistation.
      </p>
      <div className="flex flex-wrap gap-2 pt-1">
        <LinkPill href="https://www.borger.dk">borger.dk</LinkPill>
        <LinkPill href="https://www.praktikpladsen.dk">Praktikpladsen.dk</LinkPill>
        <LinkPill href="https://www.larepladsen.dk">lærepladsen.dk</LinkPill>
      </div>

      <InfoBox type="success">
        Har du yderligere spørgsmål til oplæringsaftaler, er du meget velkommen til at kontakte en af TECs virksomhedskonsulenter.
      </InfoBox>
    </div>
  )
}

function EmmaContent() {
  return (
    <div className="space-y-4">
      <InfoBox type="info">
        Både når du er i oplæring på skolen, og når du er i VFO, bliver din indsats løbende evalueret — for at sikre at du lever op til EMMA-kravene og for at forbedre oplæringsforløbet.
      </InfoBox>

      <H3>EMMA-kravene</H3>
      <div className="space-y-2.5">
        {[
          { letter: "E", word: "Egnet", desc: "Du skal være egnet til at gennemføre den ønskede faglige uddannelse." },
          { letter: "M", word: "Mobil — geografisk", desc: "Du skal være indforstået med at flytte efter en ledig læreplads." },
          { letter: "M", word: "Mobil — faglig", desc: "Du skal være indforstået med, om muligt, at skifte til et beslægtet fagområde, hvis det er muligt at få en læreplads her." },
          { letter: "A", word: "Aktiv søgende", desc: "Du skal fortsætte med at søge efter en læreplads, mens du er i Skoleoplæringen." },
        ].map(({ letter, word, desc }) => (
          <div key={letter + word} className="flex gap-3 rounded-xl p-3.5" style={{ background: "var(--surface)", border: "1px solid var(--surface-border)" }}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black" style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>
              {letter}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{word}</p>
              <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--foreground-muted)" }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <H3>Aktiv søgning — krav</H3>
      <BulletList items={[
        "Du skal fremvise dokumentation på <strong>lærepladsen.dk</strong> for, at du løbende søger lærepladser. Antal ansøgninger pr. måned anvises af din instruktør.",
        "Hvis du bliver anvist at søge en specifik læreplads, skal dette også dokumenteres på lærepladsen.dk.",
        "Du skal have en <strong>aktiv og synlig profil</strong> på www.lærepladsen.dk — log ind mindst én gang om måneden, så profilen ikke deaktiveres.",
        "Du kan oprette en søgeagent, så du får en mail, når der er relevante opslag inden for din branche.",
      ]} />

      <H3>Evalueringsproces</H3>
      <BulletList items={[
        "Du vil løbende blive indkaldt til samtaler, hvor dit uddannelsesforløb evalueres og din skoleaftale revideres.",
        "Evaluering foretages løbende af dine instruktører og praktikvejledere.",
        "Resultaterne indgår i din uddannelsesbog og kan påvirke adgangen til næste periode.",
      ]} />

      <div className="flex flex-wrap gap-2 pt-1">
        <LinkPill href="https://www.larepladsen.dk">lærepladsen.dk</LinkPill>
      </div>
    </div>
  )
}

function ForsikringContent() {
  return (
    <div className="space-y-4">
      <InfoBox type="info">
        Hvis du kommer til skade under arbejdet i Skoleoplæringen, er du som udgangspunkt dækket af skolens forsikring gennem <strong>statens selvforsikring</strong>.
      </InfoBox>

      <H3>Hvad dækker skolens forsikring?</H3>
      <BulletList items={[
        "Arbejdsskader, der sker i undervisnings- og værkstedstiden.",
        "Ulykker anmeldes straks til din instruktør og studieadministrationen.",
      ]} />

      <H3>Hvad dækker den IKKE?</H3>
      <InfoBox type="warning">
        Du er <strong>ikke</strong> dækket, hvis du holder pause, er på vej til/fra arbejde, øver skade med vilje, eller forvolder skade på andre.
      </InfoBox>
      <BulletList items={[
        "Personlige ejendele som tøj, cykel, taske osv. — disse dækkes af din egen indbo/tyveriforsikring.",
        "Skader sket i fritiden eller uden for arbejdstiden.",
      ]} />

      <H3>Anbefalinger</H3>
      <BulletList items={[
        "Det anbefales at tegne en <strong>heltidsulykkesforsikring</strong> og/eller en <strong>ansvarsforsikring</strong>.",
        "Du kan være dækket af dine forældres ansvars- og familieforsikring, også selvom du bor ude — kontakt forsikringsselskabet for at få præcis besked.",
      ]} />

      <H3>Under VFO (virksomhedsforlagt oplæring)</H3>
      <BulletList items={[
        "Lærlingen er <strong>delvist</strong> dækket af Skoleoplæringens forsikring.",
        "Kend virksomhedens procedure for ulykkesanmeldelse fra dag 1.",
      ]} />

      <div className="flex flex-wrap gap-2 pt-1">
        <LinkPill href="https://www.aes.dk">Arbejdsmarkedets Erhvervssikring</LinkPill>
      </div>
    </div>
  )
}

function SygdomContent() {
  return (
    <div className="space-y-4">
      <InfoBox type="warning">
        Sygemeldinger kan <strong>ikke</strong> ske pr. e-mail, SMS, Messenger eller lign. — du skal ringe pr. telefon.
      </InfoBox>

      <H3>Sådan melder du dig syg</H3>
      <DataTable
        headers={["Situation", "Hvem ringer du til?"]}
        rows={[
          ["Du er i Skoleoplæringen",   "Ring til din instruktør"],
          ["Du er på hovedforløb",       "Ring til instruktør + meld til skolen efter gældende regler"],
          ["Du er i VFO",               "Ring til virksomheden og din instruktør"],
        ]}
      />
      <BulletList items={[
        "Fortsætter din sygdom weekenden over, skal du <strong>ringe igen om mandagen</strong>.",
        "Raskmeld dig til din instruktør <strong>dagen før</strong> du møder efter sygeperioden.",
      ]} />

      <H3>Lægeerklæring</H3>
      <BulletList items={[
        "Intet krav om lægeerklæring de første 7 dage.",
        "Fra <strong>dag 8</strong> kan der kræves friattest eller mulighedserklæring.",
        "Ved <strong>massivt og gentagen</strong> sygefravær kan du blive bedt om at aflevere friattest fra 1. sygedag.",
        "Friattest afleveres til Skoleoplæringslederen/instruktøren første mødedag efter sygeperioden.",
        "<strong>Udgifter</strong> ved friattest og mulighedserklæring dækkes af Skoleoplæringen via TECs EAN-nummer eller SDBF.",
      ]} />

      <H3>Længerevarende sygdom</H3>
      <BulletList items={[
        "Ved længerevarende og hyppig sygdom vil du blive indkaldt til <strong>sygefraværssamtale</strong> med din instruktør.",
        "I særlige tilfælde udfyldes der mulighedserklæring for at få en lægelig vurdering.",
        "Ved hospitalsindlæggelse kan hospitalet skrive en erklæring om varighed.",
      ]} />

      <H3>Kronisk lidelse / sygdom</H3>
      <InfoBox type="info">
        Har du en kronisk lidelse (fx epilepsi eller diabetes), bedes du orientere din instruktør. Det samme gælder livsvigtig medicin eller allergi — fx overfølsomhed over for penicillin.
      </InfoBox>

      <H3>Barnets 1. sygedag</H3>
      <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
        Du har ret til dit barns første sygedag.
      </p>
    </div>
  )
}

function FrevaerOrlovContent() {
  return (
    <div className="space-y-4">
      <H3>Fravær — generelle regler</H3>
      <InfoBox type="info">
        Du kan bede om fri ved en særlig anledning, men det skal aftales med din instruktør <strong>minimum 2 dage</strong> før.
      </InfoBox>
      <BulletList items={[
        "Læge- og tandlægebesøg, hvis det ikke kan lægges uden for arbejdstiden.",
        "Begravelse — ved dødsfald i den nærmeste familie får du fri til begravelsen.",
        "Som udgangspunkt skelnes <strong>ikke</strong> mellem lovligt og ulovligt fravær — alt fravær medregnes.",
      ]} />

      <H3>Konsekvenser af fravær</H3>
      <DataTable
        headers={["Fraværsniveau / handling", "Konsekvens"]}
        rows={[
          ["Bekymrende fraværsmønster",  "Indkaldelse til fraværssamtale"],
          ["Ulovligt fravær",            "Mundtlig advarsel"],
          ["Gentaget ulovligt fravær",   "1. skriftlig advarsel"],
          ["Fortsat overtrædelse",       "2. skriftlig advarsel → udmeldelse"],
        ]}
      />
      <InfoBox type="warning">
        Fravær i form af barns 1. sygedag og barsel indgår <strong>ikke</strong> i advarselssystemet.
      </InfoBox>

      <H3>Barsel og forældreorlov</H3>
      <DataTable
        headers={["", "Mor", "Far/medforælder"]}
        rows={[
          ["Graviditetsorlov",    "4 uger",  "—"],
          ["Orlov v. fødsel",    "2 uger",  "2 uger (inden for 14 uger efter fødsel)"],
          ["Øremærket orlov",    "9 uger",  "9 uger"],
          ["Overdragelig orlov", "13 uger", "13 uger"],
          ["Total m. ydelse",    "24 uger", "24 uger"],
        ]}
      />
      <BulletList items={[
        "I kan holde orlov i forlængelse af hinanden, skiftevis eller samtidig, og I kan overdrage orlov til hinanden.",
        "Den <strong>øremærkede orlov</strong> kan ikke overdrages.",
        "Faren skal sende en kopi af vandrejournalen til instruktøren.",
        "Barselsdagpenge søges via <strong>borger.dk</strong> — søg inden orloven starter.",
      ]} />

      <H3>Session og værnepligt</H3>
      <BulletList items={[
        "Bliver du indkaldt til session, får du fri — uanset om du er i oplæring eller på skoleophold. Giv besked om datoen straks efter din indkaldelse.",
        "Der gives <strong>ikke</strong> orlov til værnepligt.",
      ]} />

      <H3>Fri og helligdage</H3>
      <InfoBox type="success">
        Du har <strong>25 feriedage</strong> og <strong>5 feriefridage</strong> med skoleoplæringsydelse i løbet af et ferieår.
      </InfoBox>
      <BulletList items={[
        "I Skoleoplæringen optjener du ikke ferie eller feriepenge som i en ordinær virksomhed.",
        "Du modtager skoleoplæringsydelse under ferie, såfremt du ikke har optjent feriepenge hos tidligere arbejdsgiver.",
        "Der afholdes <strong>3 ugers samlet sommerferie</strong>, som fastlægges af Skoleoplæringen.",
        "Derudover afholdes feriedage i forbindelse med jul/nytår, 3 dage før påske og den indeklemte fredag efter Kristi Himmelfart.",
        "Alle ferieperioder aftales skriftligt med din instruktør — senest <strong>2 måneder</strong> før afvikling.",
        "Du kan <strong>ikke</strong> afholde ferie, mens du er på skoleophold.",
      ]} />

      <div className="flex flex-wrap gap-2 pt-1">
        <LinkPill href="https://www.borger.dk/familie-og-boern/barsel">Borger.dk — Barsel</LinkPill>
        <LinkPill href="/kalender" internal>Se skolekalender</LinkPill>
      </div>
    </div>
  )
}

function YdelseContent() {
  return (
    <div className="space-y-4">
      <InfoBox type="info">
        Du modtager skoleoplæringsydelse som løn i Skoleoplæringen. Ydelsen kan <strong>ikke</strong> suppleres med anden offentlig ydelse — er du på kontanthjælp eller anden overførselsindkomst, kan du ikke modtage skoleoplæringsydelse.
      </InfoBox>

      <H3>Aktuelle satser</H3>
      <DataTable
        headers={["Aldersgruppe / trin", "Ydelse pr. måned (brutto)"]}
        rows={[
          ["Under 18 år",        "Ca. 14.500 kr."],
          ["Over 18 år — 1. år", "Ca. 17.600 kr."],
          ["Over 18 år — 2. år", "Ca. 17.600 kr."],
          ["Over 18 år — 3. år", "Ca. 17.600 kr."],
          ["Over 18 år — 4. år", "Ca. 17.600 kr."],
        ]}
      />
      <p className="text-xs mt-1" style={{ color: "var(--foreground-soft)" }}>
        Satserne reguleres løbende. Kontakt studieadministrationen for præcise aktuelle beløb.
      </p>

      <H3>Udbetaling</H3>
      <BulletList items={[
        "Ydelsen udbetales <strong>månedligt bagud</strong> — normalt den sidste hverdag i måneden.",
        "Du skal oprette en <strong>NemKonto</strong> i din bank — ydelsen indsættes direkte her.",
        "Din elektroniske lønseddel finder du på <strong>e-boks.dk</strong>.",
        "Der tilbageholdes A-skat — du er skattepligtig af ydelsen.",
        "Meld adresse- og kontoændringer straks til studieadministrationen.",
      ]} />

      <H3>Hvornår bortfalder ydelsen?</H3>
      <BulletList items={[
        "Du finder en ordinær læreplads og overgår til virksomhedens løn.",
        "Du har <strong>ulovligt fravær</strong> i Skoleoplæringen.",
        "Du afviser et relevant lærepladstilbud uden gyldig grund.",
        "Du opsiger din uddannelsesaftale.",
      ]} />

      <H3>Feriepenge og ferietillæg</H3>
      <BulletList items={[
        "Du optjener <strong>12,5 % ferietillæg</strong> af skoleoplæringsydelsen.",
        "Ferietillægget indbetales automatisk til din Feriekonto.",
        "Udbetal dine ferietillæg via <strong>ferie.dk</strong> inden ferieafholdelse.",
      ]} />

      <H3>Kørekort</H3>
      <BulletList items={[
        "Du har fri til teori- og køreprøve.",
        "Køretimer skal lægges <strong>uden for arbejdstid</strong>.",
        "På uddannelser, hvor kørekort er et krav, aftaler du opstart med din skoleoplæringsleder/instruktør.",
      ]} />

      <div className="flex flex-wrap gap-2 pt-1">
        <LinkPill href="https://www.e-boks.dk">e-boks.dk — lønsedler</LinkPill>
        <LinkPill href="https://www.ferie.dk">ferie.dk</LinkPill>
      </div>
    </div>
  )
}

// ── Section router ─────────────────────────────────────────────────────────────

function SectionContent({ sectionKey }: { sectionKey: SectionKey }) {
  switch (sectionKey) {
    case "befordring":        return <BefordringContent />
    case "laerepladssogning": return <LaerepladssogningContent />
    case "emma":              return <EmmaContent />
    case "forsikring":        return <ForsikringContent />
    case "sygdom":            return <SygdomContent />
    case "fravaer_orlov":     return <FrevaerOrlovContent />
    case "ydelse":            return <YdelseContent />
  }
}

// ── Detail view ────────────────────────────────────────────────────────────────

function DetailView({ cat, onBack }: { cat: Category; onBack: () => void }) {
  return (
    <div>
      <div className="mb-5 flex items-center">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all active:scale-95"
          style={{
            background: "var(--surface-soft)",
            border: "1px solid var(--surface-border)",
            color: "var(--foreground-muted)",
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          Tilbage
        </button>
      </div>

      {/* Hero banner */}
      <div
        className="relative mb-6 overflow-hidden rounded-2xl px-6 py-7"
        style={{ background: `linear-gradient(135deg, ${cat.bgFrom}, ${cat.bgTo})` }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full blur-3xl" style={{ background: cat.glowA }} />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full blur-2xl" style={{ background: cat.glowB }} />
        <div className="relative flex items-center gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: cat.iconBg, border: "1px solid rgba(255,255,255,0.16)", boxShadow: `0 0 24px ${cat.glowA}` }}
          >
            <cat.icon className="h-7 w-7" style={{ color: cat.iconColor }} />
          </div>
          <div>
            <p className="text-2xl font-black tracking-tight text-white">{cat.title}</p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>{cat.subtitle}</p>
          </div>
        </div>
      </div>

      <SectionContent sectionKey={cat.key} />

      {/* Footer */}
      <div
        className="mt-8 flex flex-wrap items-center gap-4 rounded-2xl px-5 py-4"
        style={{ background: "var(--surface)", border: "1px solid var(--surface-border)" }}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(95,157,255,0.1)" }}>
          <MapPin className="h-4 w-4" style={{ color: "#5f9dff" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Spørgsmål?</p>
          <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
            Kontakt studieadministrationen eller din uddannelsesvejleder på TEC.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkPill href="/kontakter" internal>Kontakter</LinkPill>
          <LinkPill href="https://www.tec.dk">tec.dk</LinkPill>
        </div>
      </div>
    </div>
  )
}

// ── Hub view ───────────────────────────────────────────────────────────────────

function HubView({ onSelect }: { onSelect: (key: SectionKey) => void }) {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight md:text-4xl" style={{ color: "var(--foreground)" }}>
          Intranet
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--foreground-muted)" }}>
          Løn, befordring, læreplads og rettigheder for lærlinge
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => onSelect(cat.key)}
            className="group flex flex-col overflow-hidden rounded-2xl text-left transition-all duration-200 ease-out hover:-translate-y-0.5 active:scale-[0.97]"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--surface-border)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = cat.accentColor + "66"
              el.style.boxShadow = `0 0 0 1px ${cat.accentColor}44, 0 4px 20px ${cat.accentColor}22`
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = "var(--surface-border)"
              el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.18)"
            }}
          >
            <div
              className="relative flex items-center justify-center overflow-hidden"
              style={{ aspectRatio: "4/3", background: `linear-gradient(145deg, ${cat.bgFrom}, ${cat.bgTo})` }}
            >
              <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full blur-2xl" style={{ background: cat.glowA }} />
              <div className="absolute -bottom-6 -left-6 h-28 w-28 rounded-full blur-2xl" style={{ background: cat.glowB }} />
              <div
                className="relative flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-110"
                style={{
                  background: cat.iconBg,
                  border: "1px solid rgba(255,255,255,0.14)",
                  boxShadow: `0 0 20px ${cat.glowA}`,
                }}
              >
                <cat.icon className="h-8 w-8" style={{ color: cat.iconColor }} />
              </div>
            </div>
            <div className="px-4 py-3.5" style={{ borderTop: "1px solid var(--surface-border)" }}>
              <p className="truncate text-sm font-bold" style={{ color: "var(--foreground)" }}>{cat.title}</p>
              <p className="mt-0.5 truncate text-xs" style={{ color: "var(--foreground-muted)" }}>{cat.subtitle}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────────

export function IntranetPanel({ onDetailChange }: { onDetailChange?: (inDetail: boolean) => void }) {
  const [selected, setSelected] = useState<SectionKey | null>(null)
  const [browserUrl, setBrowserUrl] = useState<string | null>(null)

  const activeCat = CATEGORIES.find((c) => c.key === selected)

  function selectCategory(key: SectionKey) {
    setSelected(key)
    onDetailChange?.(true)
  }

  function goBack() {
    setSelected(null)
    onDetailChange?.(false)
  }

  return (
    <OpenUrlContext.Provider value={setBrowserUrl}>
      {/* In-app browser — rendered as a fixed overlay above everything */}
      {browserUrl && (
        <InAppBrowser url={browserUrl} onBack={() => setBrowserUrl(null)} />
      )}

      {selected && activeCat
        ? <DetailView cat={activeCat} onBack={goBack} />
        : <HubView onSelect={selectCategory} />
      }
    </OpenUrlContext.Provider>
  )
}
