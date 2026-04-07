export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "subheading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "note"; text: string }

export type IntranetSection = {
  key: string
  title: string
  subtitle: string
  icon: string
  iconColor: string
  iconBg: string
  accentColor: string
  blocks: ContentBlock[]
}

export const INTRANET_SECTIONS: IntranetSection[] = [
  {
    key: "studieadministration",
    title: "Studieadministration",
    subtitle: "Kontakt og digital post",
    icon: "Building2",
    iconColor: "#38bdf8",
    iconBg: "rgba(56,189,248,0.15)",
    accentColor: "#38bdf8",
    blocks: [
      {
        type: "paragraph",
        text: "Studieadministrationen er fysisk placeret på TEC Frederiksberg, Stæhr Johansens vej 7, 2000 Frederiksberg.",
      },
      {
        type: "paragraph",
        text: "TEC bruger kun digital post. Studieadministrationen sender alle breve til din e-boks. Du har pligt til at tjekke din e-boks.",
      },
      {
        type: "paragraph",
        text: "Det er til studieadministrationen, at du skal melde adresseændring. Du kan kontakte studieadministrationen på mail sikkerpost.sop@tec.dk eller på tlf.nr. 38177000.",
      },
      {
        type: "note",
        text: "Personfølsomme oplysninger til studieadministrationen, som f.eks. en mulighedserklæring, skal sendes til sikkerpost.sop@tec.dk.",
      },
    ],
  },
  {
    key: "laerepladssogning",
    title: "Læreplads",
    subtitle: "Søgning og aftaleformer",
    icon: "Briefcase",
    iconColor: "#818cf8",
    iconBg: "rgba(129,140,248,0.15)",
    accentColor: "#818cf8",
    blocks: [
      {
        type: "paragraph",
        text: "Når du er blevet optaget i Skoleoplæringen, skal du fortsat være aktivt lærepladssøgende. Du kan få råd og vejledning undervejs i dit forløb.",
      },
      { type: "subheading", text: "Instruktører" },
      {
        type: "paragraph",
        text: "Under din uddannelse i Skoleoplæringen er det din instruktør, som er din nærmeste kontaktperson. Du kan altid spørge din instruktør til råds om din uddannelse, og instruktøren kan også henvise dig til andre kontaktpersoner på TEC. Navn og kontaktoplysninger på instruktørerne får du udleveret på et informationsark ved uddannelsens start.",
      },
      { type: "subheading", text: "Restuddannelsesaftale" },
      {
        type: "paragraph",
        text: "En restuddannelsesaftale er en uddannelsesaftale for resten af lærlingens læretid. Det vil sige, at lærlingen tidligere har gennemført en del af sin uddannelse enten i Skoleoplæringen eller i en anden virksomhed, inden lærlingen ansættes i den nye virksomhed.",
      },
      {
        type: "list",
        items: [
          "Virksomheden skal være godkendt for at ansætte lærlingen i den pågældende periode",
          "Lærlingen må deltage i virksomhedens produktion",
          "Virksomheden betaler lærlingens løn efter gældende overenskomst",
          "Lærlingen er omfattet af virksomhedens forsikring",
          "Virksomheden har ansvaret for lærlingens uddannelse i den tid, hvor restuddannelsesaftalen løber",
          "Der er 3 måneders gensidig prøvetid",
        ],
      },
      { type: "subheading", text: "Kort aftale" },
      {
        type: "paragraph",
        text: "I den korte aftale gælder samme vilkår som ved indgåelse af en restuddannelsesaftale – desuden gælder følgende:",
      },
      {
        type: "list",
        items: [
          "Virksomheden har ansvaret for lærlingens uddannelse i den tid, hvor den korte aftale løber",
          "Den korte aftale skal indeholde minimum en oplæringsperiode og en skoleperiode",
          "Der kan maksimalt laves 1 kort uddannelsesaftale mellem samme elev og virksomhed, undtagelsesvist en anden med godkendelse fra det lokale uddannelsesudvalg",
          "Efter en kort aftale, er lærlingen berettiget til at blive optaget i Skoleoplæringen",
        ],
      },
      { type: "subheading", text: "Delaftale" },
      {
        type: "paragraph",
        text: "I delaftalen gælder samme vilkår som ved indgåelse af en restuddannelsesaftale – desuden gælder følgende:",
      },
      {
        type: "list",
        items: [
          "Virksomheden har ansvaret for lærlingens uddannelse i den tid, hvor delaftalen løber",
          "Delaftalen indeholder kun en oplæringsperiode",
          "Delaftalen kan kun indgås og gennemføres én gang mellem samme elev og virksomhed",
          "Efter en delaftale er lærlingen berettiget til at komme tilbage til Skoleoplæringen",
        ],
      },
      { type: "subheading", text: "Virksomhedsforlagt oplæring – VFO" },
      {
        type: "list",
        items: [
          "Virksomheden skal være godkendt til at have lærlinge",
          "Skoleoplæringen betaler skoleoplæringsydelsen (lønnen), og lærlingen får befordringstilskud efter reglerne",
          "Aftalens varighed er afhængig af de praktikmål, som danner grundlag for aftalen",
          "Lærlingen kan maksimalt være 3 uger i samme virksomhed og højst 6 uger af elevens samlede oplæring",
          "Lærlingen må ikke deltage i virksomhedens produktion, medmindre det er på vegne af en medarbejder",
          "Lærlingen er delvist omfattet af Skoleoplærings forsikring",
        ],
      },
      { type: "subheading", text: "Straffeattest" },
      {
        type: "paragraph",
        text: "Såfremt en virksomhed kræver det, kan du blive bedt om at indhente din straffeattest. Du kan bestille straffeattest via borger.dk eller via din lokale politistation. Hvis du har yderligere spørgsmål til oplæringsaftaler, er du meget velkommen til at kontakte en af TECs virksomhedskonsulenter.",
      },
    ],
  },
  {
    key: "emma",
    title: "EMMA",
    subtitle: "Krav og løbende evaluering",
    icon: "BookOpen",
    iconColor: "#34d399",
    iconBg: "rgba(52,211,153,0.15)",
    accentColor: "#34d399",
    blocks: [
      { type: "subheading", text: "Evaluering af oplæringsforløb" },
      {
        type: "paragraph",
        text: "Både når du er i oplæring på skolen, og når du er i VFP bliver din indsats – og det udbytte du får af dine oplæringsophold – løbende evalueret. Evalueringen sker både for at sikre, at du lever op til EMMA-kravene, men også for at vi hele tiden kan blive bedre til at gennemføre oplæringsforløbene.",
      },
      {
        type: "paragraph",
        text: "Du vil under hele dit uddannelsesforløb løbende blive indkaldt til samtaler, hvor dit uddannelsesforløb vil blive evalueret og din skoleaftale revideret.",
      },
      { type: "subheading", text: "EMMA-kravene" },
      {
        type: "list",
        items: [
          "E = Egnet – Du skal være egnet til at gennemføre den ønskede faglige uddannelse",
          "M = Mobil (geografisk) – Du skal være indforstået med at flytte efter en ledig læreplads",
          "M = Mobil (fagligt) – Du skal være indforstået med, om muligt, at skifte til et beslægtet fagområde",
          "A = Aktiv søgende – Du skal fortsætte med at søge efter en læreplads, mens du er i Skoleoplæringen",
        ],
      },
      {
        type: "note",
        text: "En af forudsætningerne for at være i Skoleoplæringen er, at du har en aktiv og synlig profil på www.lærepladsen.dk. Du skal jævnligt logge ind og synliggøre din profil, så den ikke deaktiveres – vi anbefaler mindst en gang hver måned.",
      },
    ],
  },
  {
    key: "befordring",
    title: "Befordringstilskud",
    subtitle: "Tilskud og refusionsskema",
    icon: "Bus",
    iconColor: "#60a5fa",
    iconBg: "rgba(96,165,250,0.15)",
    accentColor: "#60a5fa",
    blocks: [
      {
        type: "paragraph",
        text: "Efter bestemmelser fastlagt af Arbejdsgivernes Elevrefusion kan du som Skoleoplæringslærling få befordringstilskud svarende til billigste offentlige transportmiddel, hvis din samlede transportvej er mindst 20 km om dagen.",
      },
      {
        type: "list",
        items: [
          "Befordringstilskud får du udbetalt midt i måneden",
          "Du vil få 90% befordringstilskud per dag, når du er i oplæring og 100% per dag, når du er på skoleophold",
          "Beløbet beregnes ud fra billigste offentlige transport – du kan ikke trække kørsel fra på selvangivelsen samtidig",
          "Når du er i delaftale, kan du ikke modtage befordringstilskud, men kan trække kørsel fra på selvangivelsen",
          "Ansøgning sendes senest sidste arbejdsdag i måneden via sdbf.dk – du kan max søge 4 måneder bagud",
        ],
      },
      {
        type: "note",
        text: "Du skal bruge dit NemID for at logge ind på sdbf.dk. Spørg din instruktør, hvis du har flere spørgsmål vedrørende befordring.",
      },
    ],
  },
  {
    key: "forsikring",
    title: "Forsikring",
    subtitle: "Dækning under oplæringen",
    icon: "Shield",
    iconColor: "#fb923c",
    iconBg: "rgba(251,146,60,0.15)",
    accentColor: "#fb923c",
    blocks: [
      {
        type: "paragraph",
        text: "Hvis du kommer til skade under arbejdet i Skoleoplæringen, er du som udgangspunkt dækket af skolens forsikring gennem statens selvforsikring.",
      },
      { type: "subheading", text: "Undtagelser fra dækning" },
      {
        type: "paragraph",
        text: "Der er nogle undtagelser, bl.a. når du holder pause, er på vej til og fra arbejde, øver skade med vilje eller forvolder skade på andre – så er du ikke omfattet af forsikringen. Derfor kan det anbefales, at du tegner en heltidsulykkesforsikring og/eller en ansvarsforsikring.",
      },
      {
        type: "note",
        text: "Personlige ejendele som tøj, cykel og taske dækkes af din egen indbo/tyveriforsikring. Du kan muligvis være dækket af dine forældres ansvars- og familieforsikring, også selvom du bor ude – kontakt forsikringsselskabet for præcis besked.",
      },
    ],
  },
  {
    key: "sygdom",
    title: "Sygdom",
    subtitle: "Regler og procedurer",
    icon: "HeartPulse",
    iconColor: "#f472b6",
    iconBg: "rgba(244,114,182,0.15)",
    accentColor: "#f472b6",
    blocks: [
      {
        type: "paragraph",
        text: "Hvis du er syg, eller på anden måde er forhindret i at møde, skal du give Skoleoplæringen besked pr. telefon. Se informationsarket fremsendt elektronisk ved opstart i Skoleoplæringen.",
      },
      {
        type: "paragraph",
        text: "Fortsætter din sygdom weekenden over, skal du ringe igen om mandagen og sygemelde dig. Du bedes raskmelde dig til din instruktør, dagen før du møder igen.",
      },
      { type: "subheading", text: "Sygemeldinger" },
      {
        type: "list",
        items: [
          "Hvis du er i Skoleoplæringen, skal du ringe til din instruktør",
          "Hvis du er på hovedforløb, skal du ringe til din instruktør og melde sygdom til skolen",
          "Hvis du er i VFP, skal du ringe til virksomheden og din instruktør",
        ],
      },
      {
        type: "note",
        text: "Sygemeldinger kan ikke ske pr. e-mail, SMS, Messenger eller lignende.",
      },
      { type: "subheading", text: "Længerevarende sygdom" },
      {
        type: "paragraph",
        text: "Ved længerevarende og hyppig sygdom vil du blive indkaldt til sygefraværssamtale med din instruktør. I særlige tilfælde udfyldes der mulighedserklæring for at få lægelig vurdering. Ved massivt og gentagen sygefravær kan du blive bedt om at aflevere friattest fra 1. sygedag.",
      },
      {
        type: "paragraph",
        text: "Udgifter ved friattest og mulighedserklæring dækkes af Skoleoplæringen via TECs EAN-nummer eller SDBF. Spørg din instruktør for yderligere information.",
      },
      { type: "subheading", text: "Kronisk lidelse" },
      {
        type: "paragraph",
        text: "Har du en kronisk lidelse, fx epilepsi eller diabetes, bedes du orientere din instruktør. Det samme gælder, hvis du tager livsvigtig medicin eller har allergi relevant ved hospitalsindlæggelse.",
      },
      {
        type: "note",
        text: "Du har ret til dit barns 1. sygedag.",
      },
    ],
  },
  {
    key: "fravaer",
    title: "Fravær",
    subtitle: "Regler og ansøgning",
    icon: "CalendarOff",
    iconColor: "#a78bfa",
    iconBg: "rgba(167,139,250,0.15)",
    accentColor: "#a78bfa",
    blocks: [
      {
        type: "paragraph",
        text: "Du vil som på andre arbejdspladser kunne bede om fri fra arbejde, hvis du har en særlig anledning, men det skal aftales med din instruktør minimum 2 dage før.",
      },
      {
        type: "list",
        items: [
          "Læge- og tandlægebesøg, hvis det ikke kan lægges uden for arbejdstiden",
          "Begravelse – ved dødsfald i den nærmeste familie, får du fri til begravelse",
        ],
      },
      {
        type: "paragraph",
        text: "Som udgangspunkt skelnes ikke mellem lovligt og ulovligt fravær. Alle former for fravær i kortere eller længere perioder medregnes som fravær.",
      },
      {
        type: "list",
        items: [
          "Ulovligt fravær udløser advarsel – gradueret fra mundtlig, 1. skriftlig, 2. skriftlig advarsel til udmeldelse",
          "Ved et bekymrende fraværsmønster vil du blive indkaldt til en fraværssamtale",
          "Fravær i form af barns 1. sygedag og barsel indgår ikke i disse regler",
        ],
      },
      {
        type: "note",
        text: "Du har ret til barsel og forældreorlov efter gældende regler. Se afsnittet om orlov eller kontakt din instruktør for yderligere information.",
      },
    ],
  },
  {
    key: "orlov",
    title: "Orlov",
    subtitle: "Barsel og forældreorlov",
    icon: "Users",
    iconColor: "#f9a8d4",
    iconBg: "rgba(249,168,212,0.15)",
    accentColor: "#f9a8d4",
    blocks: [
      {
        type: "paragraph",
        text: "Skoleoplæringslærlinge har ret til fravær på grund af barsel, jf. § 2, stk. 1, i lov om ret til orlov og dagpenge ved barsel (barselsloven).",
      },
      { type: "subheading", text: "Mor" },
      {
        type: "list",
        items: [
          "4 ugers graviditetsorlov",
          "2 ugers orlov i forbindelse med fødslen",
          "9 ugers øremærket orlov",
          "13 ugers orlov, der kan afholdes eller overdrages helt eller delvist",
        ],
      },
      { type: "subheading", text: "Far" },
      {
        type: "list",
        items: [
          "2 ugers orlov i forbindelse med fødslen",
          "9 ugers øremærket orlov",
          "13 ugers orlov, der kan afholdes eller overdrages helt eller delvist",
        ],
      },
      {
        type: "paragraph",
        text: "Som forældre har I hver især ret til 24 ugers orlov med skoleoplæringsydelse efter fødslen. I kan holde orlov i forlængelse af hinanden, skiftevis eller samtidig, og I kan overdrage orlov til hinanden. Den øremærkede orlov kan ikke overdrages.",
      },
      { type: "subheading", text: "Fædreorlov" },
      {
        type: "paragraph",
        text: "Faren har ret til 2 ugers fædreorlov, der skal afholdes inden for de første 14 uger efter fødslen – umiddelbart efter fødsel og efter aftale med instruktør. Som kommende far skal du sende en kopi af vandrejournalen til din instruktør.",
      },
      { type: "subheading", text: "Session og værnepligt" },
      {
        type: "paragraph",
        text: "Bliver du indkaldt til session, får du fri til at deltage i dette, uanset om du er i oplæring eller på skoleophold. Vi skal dog have besked om datoen straks efter din indkaldelse. Der gives ikke orlov til værnepligt.",
      },
    ],
  },
  {
    key: "helligdage",
    title: "Fri & Helligdage",
    subtitle: "Ferie og feriedage",
    icon: "Sun",
    iconColor: "#fbbf24",
    iconBg: "rgba(251,191,36,0.15)",
    accentColor: "#fbbf24",
    blocks: [
      {
        type: "paragraph",
        text: "I Skoleoplæringen optjener du ikke ferie eller feriepenge, som du vil gøre i en virksomhed med en uddannelsesaftale. Du modtager skoleoplæringsydelse under ferie afviklet i Skoleoplæringen, såfremt du ikke har optjent feriepenge hos en tidligere arbejdsgiver.",
      },
      {
        type: "list",
        items: [
          "Du har 25 feriedage og 5 feriefridage med skoleoplæringsydelse i løbet af et ferieår",
          "I Skoleoplæringen afholdes 3 ugers samlet sommerferie, fastlagt af Skoleoplæringen",
          "Der afholdes feriedage i forbindelse med jul/nytår, de 3 dage før påske og den indeklemte fredag efter Kristi Himmelfart",
          "Alle ferieperioder aftales skriftligt med din instruktør senest 2 måneder før afvikling",
        ],
      },
      {
        type: "note",
        text: "Du kan ikke afholde ferie, mens du er på skoleophold. Se informationsarket fremsendt elektronisk ved opstart i Skoleoplæringen.",
      },
    ],
  },
  {
    key: "skoleydelse",
    title: "Skoleoplæringsydelse",
    subtitle: "Løn og udbetaling",
    icon: "Banknote",
    iconColor: "#2dd4bf",
    iconBg: "rgba(45,212,191,0.15)",
    accentColor: "#2dd4bf",
    blocks: [
      {
        type: "paragraph",
        text: "Du modtager skoleoplæringsydelse som løn i Skoleoplæringen. Du skal oprette en NemKonto i din bank, da skoleoplæringsydelsen indsættes på din NemKonto.",
      },
      {
        type: "paragraph",
        text: "Din skoleoplæringsydelse kan ikke suppleres med anden offentlig ydelse – er du på kontanthjælp eller anden overførselsindkomst, kan du ikke modtage skoleoplæringsydelse.",
      },
      {
        type: "paragraph",
        text: "Skoleoplæringsydelsen udbetales bagud og vil være til disposition den sidste hverdag i hver måned. Din elektroniske lønseddel kan du finde på www.e-boks.dk.",
      },
      { type: "subheading", text: "Satser 2026" },
      {
        type: "list",
        items: [
          "Elever under 18 år: kr. 4.294,- pr. måned",
          "Elever på 1. år af hovedforløbet: kr. 10.287,- pr. måned",
          "Elever på 2. år af hovedforløbet: kr. 11.317,- pr. måned",
          "Elever på 3. år af hovedforløbet: kr. 12.519,- pr. måned",
          "Elever på 4. år og derover på hovedforløbet: kr. 14.738,- pr. måned",
        ],
      },
      {
        type: "note",
        text: "Du modtager ikke skoleoplæringsydelse, hvis du har ulovligt fravær i skoleoplæringen.",
      },
    ],
  },
  {
    key: "koerekort",
    title: "Kørekort & Kørsel",
    subtitle: "Teoriprøve og TECs biler",
    icon: "Car",
    iconColor: "#86efac",
    iconBg: "rgba(134,239,172,0.15)",
    accentColor: "#86efac",
    blocks: [
      {
        type: "paragraph",
        text: "Hvis du skal tage kørekort, har du fri til teori- og køreprøve. Køretimer skal lægges udenfor arbejdstid. På uddannelser, hvor kørekort er et krav, aftaler du opstart af kørekort med din skoleoplæringsleder/instruktør.",
      },
      { type: "subheading", text: "Kørsel i TECs biler" },
      {
        type: "paragraph",
        text: "I Skoleoplæringen kan der være opgaver, hvor der er brug for kørsel i TECs biler. Din instruktør vil informere dig yderligere.",
      },
      {
        type: "note",
        text: "Til orientering har alle biler i Skoleoplæringen GPS/tracking.",
      },
    ],
  },
  {
    key: "vaerksted",
    title: "Værkstedsregler",
    subtitle: "Sikkerhed og arbejdsmiljø",
    icon: "Wrench",
    iconColor: "#fdba74",
    iconBg: "rgba(253,186,116,0.15)",
    accentColor: "#fdba74",
    blocks: [
      {
        type: "paragraph",
        text: "Vi lægger vægt på din sikkerhed og et godt arbejdsmiljø. Af hensyn til din egen og andres sikkerhed er det vigtigt, at du retter dig efter de instrukser og regler, der er i dit skoleoplæringsområde/værksted, og at du rydder op efter dig selv.",
      },
      {
        type: "list",
        items: [
          "Orienter dig i brandinstruks og evakueringsplan i dit område/værksted",
          "Personlige værnemidler og arbejdstøj udleveres afstemt efter overenskomsten ved uddannelsens start",
          "Vi forventer, at du tager ansvar for og passer ordentligt på lokaler, værktøj, udstyr og biler",
          "Brug af mobiltelefon og PC i arbejdstiden aftales med din instruktør",
          "Forlader du værkstedet/arbejdspladsen, skal det aftales med din instruktør",
        ],
      },
      { type: "subheading", text: "Ordensregler på TEC" },
      {
        type: "paragraph",
        text: "På TEC viser vi respekt for vores medmennesker. Du kan læse mere om vores forventninger til dig, og hvad vi ikke accepterer (rusmidler, rygning, vold m.m.) i TECs ordensregler.",
      },
      {
        type: "note",
        text: "Advarselsprincippet er baseret på en graduering fra mundtlig, 1. skriftlig, 2. skriftlig advarsel til udmeldelse. I særligt alvorlige tilfælde kan sanktionen iværksættes uden forudgående advarsel.",
      },
    ],
  },
  {
    key: "ophoer",
    title: "Ophør",
    subtitle: "Stop og klagevejledning",
    icon: "LogOut",
    iconColor: "#f87171",
    iconBg: "rgba(248,113,113,0.15)",
    accentColor: "#f87171",
    blocks: [
      {
        type: "paragraph",
        text: "Du har pligt til at kontakte din instruktør, hvis du har fået læreplads eller af en anden grund ønsker at stoppe i Skoleoplæringen.",
      },
      { type: "subheading", text: "Klagevejledning" },
      {
        type: "paragraph",
        text: "Hvis du mener, at du fejlagtigt ikke er optaget i Skoleoplæringen, eller at du fejlagtigt er udelukket fra Skoleoplæringen, kan du klage over dette.",
      },
      {
        type: "note",
        text: "Vi skal modtage din klage senest 1 uge efter, du har modtaget den skriftlige afgørelse.",
      },
    ],
  },
]
