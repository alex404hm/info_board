import { db } from "../db"
import { intranetPage } from "./schema"

const PAGES = [
  {
    key: "befordring",
    title: "Befordring",
    subtitle: "Tilskud og refusionsskema",
    icon: "Bus",
    iconColor: "#60a5fa",
    iconBg: "rgba(96,165,250,0.22)",
    bgFrom: "rgba(30,58,138,0.95)",
    bgTo: "rgba(15,23,42,0.99)",
    glowA: "rgba(96,165,250,0.22)",
    glowB: "rgba(59,130,246,0.12)",
    accentColor: "#60a5fa",
    content: `> Som Skoleoplæringslærling kan du få befordringstilskud svarende til billigste offentlige transportmiddel, hvis din samlede transportvej er mindst **20 km om dagen**.

### Satser og udbetaling

| Situation | Tilskud |
| :--- | :--- |
| Under oplæring (værksted) | 90 % af billigste offentlige transport |
| På skoleophold | 100 % af billigste offentlige transport |

- Befordringstilskuddet udbetales **midt i måneden**.
- Beløbet beregnes ud fra billigste offentlige transport.
- Når du modtager befordringstilskud, kan du **ikke** trække kørsel fra på selvangivelsen.
- Når du er i **delaftale**, kan du ikke modtage befordringstilskud, men kan trække kørsel fra på selvangivelsen.

### Ansøgning

- Ansøgning sendes senest **sidste arbejdsdag i måneden** via sdbf.dk.
- Du kan maksimalt søge **4 måneder bagud**.
- Du skal bruge dit NemID for at logge ind på sdbf.dk.
- Spørg din instruktør, hvis du har spørgsmål vedrørende befordring.

[Ansøg via sdbf.dk](https://www.sdbf.dk)

### Refusionsskema (PDF)

<div style="overflow: hidden; border-radius: 16px; border: 1px solid var(--surface-border); height: 65vh; box-shadow: 0 2px 16px rgba(0,0,0,0.18);">
  <iframe src="/Befordringsrefusion.pdf#toolbar=0&navpanes=0&scrollbar=1" style="height: 100%; width: 100%; border: 0;" title="Befordringsrefusion PDF"></iframe>
</div>`,
    order: 0,
  },
  {
    key: "laerepladssogning",
    title: "Læreplads",
    subtitle: "Søgning og aftaleformer",
    icon: "Briefcase",
    iconColor: "#818cf8",
    iconBg: "rgba(129,140,248,0.22)",
    bgFrom: "rgba(49,46,129,0.95)",
    bgTo: "rgba(30,27,75,0.99)",
    glowA: "rgba(129,140,248,0.22)",
    glowB: "rgba(99,102,241,0.12)",
    accentColor: "#818cf8",
    content: `> Når du er optaget i Skoleoplæringen, skal du fortsat være aktivt lærepladssøgende. Du kan få råd og vejledning undervejs i dit forløb.

### Instruktører

Under din uddannelse i Skoleoplæringen er det din instruktør, som er din nærmeste kontaktperson. Du kan altid spørge din instruktør til råds om din uddannelse, og instruktøren kan også henvise dig til andre kontaktpersoner på TEC. Navn og kontaktoplysninger på instruktørerne får du udleveret på et informationsark ved uddannelsens start.

### Aftaleformer

I løbet af din tid i Skoleoplæringen har du mulighed for at komme i forskellige former for aftaler.

#### Restuddannelsesaftale
En aftale for resten af lærlingens læretid — lærlingen har tidligere gennemført en del af sin uddannelse i Skoleoplæringen eller en anden virksomhed.
- Virksomheden skal være godkendt for at ansætte lærlingen
- Lærlingen må deltage i virksomhedens produktion
- Virksomheden betaler lærlingens løn efter gældende overenskomst
- Lærlingen er omfattet af virksomhedens forsikring
- **3 måneders** gensidig prøvetid

#### Kort aftale
Samme vilkår som restuddannelsesaftalen — desuden gælder:
- Skal indeholde minimum én oplæringsperiode og én skoleperiode
- Maks. **1 kort aftale** mellem samme elev og virksomhed (undtagelsesvist en anden med godkendelse fra lokalt uddannelsesudvalg)
- Efter en kort aftale er lærlingen berettiget til at blive optaget i Skoleoplæringen igen

#### Delaftale
- Indeholder kun én oplæringsperiode
- Kan kun indgås og gennemføres **én gang** mellem samme elev og virksomhed
- Efter en delaftale er lærlingen berettiget til at komme tilbage til Skoleoplæringen

#### Virksomhedsforlagt oplæring (VFO)
- Virksomheden skal være godkendt til at have lærlinge
- Skoleoplæringen betaler skoleoplæringsydelsen — lærlingen får befordringstilskud efter reglerne
- Maks. **3 uger** i samme virksomhed og højst **6 uger** af elevens samlede oplæring
- Lærlingen må ikke deltage i virksomhedens produktion (medmindre det er på vegne af en medarbejder)
- Lærlingen er delvist omfattet af Skoleoplæringens forsikring

### Straffeattest

Hvis en virksomhed kræver det, kan du blive bedt om at indhente din straffeattest. Du kan bestille straffeattest via borger.dk eller via din lokale politistation.

[borger.dk](https://www.borger.dk)
[Praktikpladsen.dk](https://www.praktikpladsen.dk)
[lærepladsen.dk](https://www.larepladsen.dk)

**Har du yderligere spørgsmål til oplæringsaftaler, er du meget velkommen til at kontakte en af TECs virksomhedskonsulenter.**`,
    order: 1,
  },
  {
    key: "emma",
    title: "EMMA",
    subtitle: "Krav og løbende evaluering",
    icon: "Star",
    iconColor: "#fbbf24",
    iconBg: "rgba(251,191,36,0.22)",
    bgFrom: "rgba(120,53,15,0.95)",
    bgTo: "rgba(69,26,3,0.99)",
    glowA: "rgba(251,191,36,0.22)",
    glowB: "rgba(245,158,11,0.12)",
    accentColor: "#fbbf24",
    content: `> Både når du er i oplæring på skolen, og når du er i VFO, bliver din indsats løbende evalueret — for at sikre at du lever op til EMMA-kravene og for at forbedre oplæringsforløbet.

### EMMA-kravene

- **E - Egnet**: Du skal være egnet til at gennemføre den ønskede faglige uddannelse.
- **M - Mobil — geografisk**: Du skal være indforstået med at flytte efter en ledig læreplads.
- **M - Mobil — faglig**: Du skal være indforstået med, om muligt, at skifte til et beslægtet fagområde, hvis det er muligt at få en læreplads her.
- **A - Aktiv søgende**: Du skal fortsætte med at søge efter en læreplads, mens du er i Skoleoplæringen.

### Aktiv søgning — krav

- Du skal fremvise dokumentation på **lærepladsen.dk** for, at du løbende søger lærepladser. Antal ansøgninger pr. måned anvises af din instruktør.
- Hvis du bliver anvist at søge en specifik læreplads, skal dette også dokumenteres på lærepladsen.dk.
- Du skal have en **aktiv og synlig profil** på www.lærepladsen.dk — log ind mindst én gang om måneden, så profilen ikke deaktiveres.
- Du kan oprette en søgeagent, så du får en mail, når der er relevante opslag inden for din branche.

### Evalueringsproces

- Du vil løbende blive indkaldt til samtaler, hvor dit uddannelsesforløb evalueres og din skoleaftale revideres.
- Evaluering foretages løbende af dine instruktører og praktikvejledere.
- Resultaterne indgår i din uddannelsesbog og kan påvirke adgangen til næste periode.

[lærepladsen.dk](https://www.larepladsen.dk)`,
    order: 2,
  },
  {
    key: "forsikring",
    title: "Forsikring",
    subtitle: "Dækning under uddannelse",
    icon: "Umbrella",
    iconColor: "#c084fc",
    iconBg: "rgba(192,132,252,0.22)",
    bgFrom: "rgba(88,28,135,0.95)",
    bgTo: "rgba(59,7,100,0.99)",
    glowA: "rgba(192,132,252,0.22)",
    glowB: "rgba(168,85,247,0.12)",
    accentColor: "#c084fc",
    content: `> Hvis du kommer til skade under arbejdet i Skoleoplæringen, er du som udgangspunkt dækket af skolens forsikring gennem **statens selvforsikring**.

### Hvad dækker skolens forsikring?

- Arbejdsskader, der sker i undervisnings- og værkstedstiden.
- Ulykker anmeldes straks til din instruktør og studieadministrationen.

### Hvad dækker den IKKE?

!! Du er **ikke** dækket, hvis du holder pause, er på vej til/fra arbejde, øver skade med vilje, eller forvolder skade på andre.

- Personlige ejendele som tøj, cykel, taske osv. — disse dækkes af din egen indbo/tyveriforsikring.
- Skader sket i fritiden eller uden for arbejdstiden.

### Anbefalinger

- Det anbefales at tegne en **heltidsulykkesforsikring** og/eller en **ansvarsforsikring**.
- Du kan være dækket af dine forældres ansvars- og familieforsikring, også selvom du bor ude — kontakt forsikringsselskabet for at få præcis besked.

### Under VFO (virksomhedsforlagt oplæring)

- Lærlingen er **delvist** dækket af Skoleoplæringens forsikring.
- Kend virksomhedens procedure for ulykkesanmeldelse fra dag 1.

[Arbejdsmarkedets Erhvervssikring](https://www.aes.dk)`,
    order: 3,
  },
  {
    key: "sygdom",
    title: "Sygdom",
    subtitle: "Fraværsprocedurer og regler",
    icon: "Heart",
    iconColor: "#f87171",
    iconBg: "rgba(248,113,113,0.22)",
    bgFrom: "rgba(127,29,29,0.95)",
    bgTo: "rgba(69,10,10,0.99)",
    glowA: "rgba(248,113,113,0.22)",
    glowB: "rgba(239,68,68,0.12)",
    accentColor: "#f87171",
    content: `!! Sygemeldinger kan **ikke** ske pr. e-mail, SMS, Messenger eller lign. — du skal ringe pr. telefon.

### Sådan melder du dig syg

| Situation | Hvem ringer du til? |
| :--- | :--- |
| Du er i Skoleoplæringen | Ring til din instruktør |
| Du er på hovedforløb | Ring til instruktør + meld til skolen efter gældende regler |
| Du er i VFO | Ring til virksomheden og din instruktør |

- Fortsætter din sygdom weekenden over, skal du **ringe igen om mandagen**.
- Raskmeld dig til din instruktør **dagen før** du møder efter sygeperioden.

### Lægeerklæring

- Intet krav om lægeerklæring de første 7 dage.
- Fra **dag 8** kan der kræves friattest eller mulighedserklæring.
- Ved **massivt og gentagen** sygefravær kan du blive bedt om at aflevere friattest fra 1. sygedag.
- Friattest afleveres til Skoleoplæringslederen/instruktøren første mødedag efter sygeperioden.
- **Udgifter** ved friattest og mulighedserklæring dækkes af Skoleoplæringen via TECs EAN-nummer eller SDBF.

### Længerevarende sygdom

- Ved længerevarende og hyppig sygdom vil du blive indkaldt til **sygefraværssamtale** med din instruktør.
- I særlige tilfælde udfyldes der mulighedserklæring for at få en lægelig vurdering.
- Ved hospitalsindlæggelse kan hospitalet skrive en erklæring om varighed.

### Kronisk lidelse / sygdom

> Har du en kronisk lidelse (fx epilepsi eller diabetes), bedes du orientere din instruktør. Det samme gælder livsvigtig medicin eller allergi — fx overfølsomhed over for penicillin.

### Barnets 1. sygedag

Du har ret til dit barns første sygedag.`,
    order: 4,
  },
  {
    key: "fravaer_orlov",
    title: "Fravær & Orlov",
    subtitle: "Barsel, fravær og fridage",
    icon: "Clock",
    iconColor: "#fb923c",
    iconBg: "rgba(251,146,60,0.22)",
    bgFrom: "rgba(124,45,18,0.95)",
    bgTo: "rgba(67,20,7,0.99)",
    glowA: "rgba(251,146,60,0.22)",
    glowB: "rgba(249,115,22,0.12)",
    accentColor: "#fb923c",
    content: `### Fravær — generelle regler

> Du kan bede om fri ved en særlig anledning, men det skal aftales med din instruktør **minimum 2 dage** før.

- Læge- og tandlægebesøg, hvis det ikke kan lægges uden for arbejdstiden.
- Begravelse — ved dødsfald i den nærmeste familie får du fri til begravelsen.
- Som udgangspunkt skelnes **ikke** mellem lovligt og ulovligt fravær — alt fravær medregnes.

### Konsekvenser af fravær

| Fraværsniveau / handling | Konsekvens |
| :--- | :--- |
| Bekymrende fraværsmønster | Indkaldelse til fraværssamtale |
| Ulovligt fravær | Mundtlig advarsel |
| Gentaget ulovligt fravær | 1. skriftlig advarsel |
| Fortsat overtrædelse | 2. skriftlig advarsel → udmeldelse |

!! Fravær i form af barns 1. sygedag og barsel indgår **ikke** i advarselssystemet.

### Barsel og forældreorlov

| | Mor | Far/medforælder |
| :--- | :--- | :--- |
| Graviditetsorlov | 4 uger | — |
| Orlov v. fødsel | 2 uger | 2 uger (inden for 14 uger efter fødsel) |
| Øremærket orlov | 9 uger | 9 uger |
| Overdragelig orlov | 13 uger | 13 uger |
| Total m. ydelse | 24 uger | 24 uger |

- I kan holde orlov i forlængelse af hinanden, skiftevis eller samtidig, og I kan overdrage orlov til hinanden.
- Den **øremærkede orlov** kan ikke overdrages.
- Faren skal sende en kopi af vandrejournalen til instruktøren.
- Barselsdagpenge søges via **borger.dk** — søg inden orloven starter.

### Session og værnepligt

- Bliver du indkaldt til session, får du fri — uanset om du er i oplæring eller på skoleophold. Giv besked om datoen straks efter din indkaldelse.
- Der gives **ikke** orlov til værnepligt.

### Fri og helligdage

*** Du har **25 feriedage** og **5 feriefridage** med skoleoplæringsydelse i løbet af et ferieår.

- I Skoleoplæringen optjener du ikke ferie eller feriepenge som i en ordinær virksomhed.
- Du modtager skoleoplæringsydelse under ferie, såfremt du ikke har optjent feriepenge hos tidligere arbejdsgiver.
- Der afholdes **3 ugers samlet sommerferie**, som fastlægges af Skoleoplæringen.
- Derudover afholdes feriedage i forbindelse med jul/nytår, 3 dage før påske og den indeklemte fredag efter Kristi Himmelfart.
- Alle ferieperioder aftales skriftligt med din instruktør — senest **2 måneder** før afvikling.
- Du kan **ikke** afholde ferie, mens du er på skoleophold.

[Borger.dk — Barsel](https://www.borger.dk/familie-og-boern/barsel)
[Se skolekalender](/kalender)`,
    order: 5,
  },
  {
    key: "ydelse",
    title: "Skoleydelse",
    subtitle: "Din ydelse under oplæring",
    icon: "GraduationCap",
    iconColor: "#2dd4bf",
    iconBg: "rgba(45,212,191,0.22)",
    bgFrom: "rgba(19,78,74,0.95)",
    bgTo: "rgba(4,47,46,0.99)",
    glowA: "rgba(45,212,191,0.22)",
    glowB: "rgba(20,184,166,0.12)",
    accentColor: "#2dd4bf",
    content: `> Du modtager skoleoplæringsydelse som løn i Skoleoplæringen. Ydelsen kan **ikke** suppleres med anden offentlig ydelse — er du på kontanthjælp eller anden overførselsindkomst, kan du ikke modtage skoleoplæringsydelse.

### Aktuelle satser

| Aldersgruppe / trin | Ydelse pr. måned (brutto) |
| :--- | :--- |
| Under 18 år | Ca. 14.500 kr. |
| Over 18 år — 1. år | Ca. 17.600 kr. |
| Over 18 år — 2. år | Ca. 17.600 kr. |
| Over 18 år — 3. år | Ca. 17.600 kr. |
| Over 18 år — 4. år | Ca. 17.600 kr. |

*Satserne reguleres løbende. Kontakt studieadministrationen for præcise aktuelle beløb.*

### Udbetaling

- Ydelsen udbetales **månedligt bagud** — normalt den sidste hverdag i måneden.
- Du skal oprette en **NemKonto** i din bank — ydelsen indsættes direkte her.
- Din elektroniske lønseddel finder du på **e-boks.dk**.
- Der tilbageholdes A-skat — du er skattepligtig af ydelsen.
- Meld adresse- og kontoændringer straks til studieadministrationen.

### Hvornår bortfalder ydelsen?

- Du finder en ordinær læreplads og overgår til virksomhedens løn.
- Du har **ulovligt fravær** i Skoleoplæringen.
- Du afviser et relevant lærepladstilbud uden gyldig grund.
- Du opsiger din uddannelsesaftale.

### Feriepenge og ferietillæg

- Du optjener **12,5 % ferietillæg** af skoleoplæringsydelsen.
- Ferietillægget indbetales automatisk til din Feriekonto.
- Udbetal dine ferietillæg via **ferie.dk** inden ferieafholdelse.

### Kørekort

- Du har fri til teori- og køreprøve.
- Køretimer skal lægges **uden for arbejdstid**.
- På uddannelser, hvor kørekort er et krav, aftaler du opstart med din skoleoplæringsleder/instruktør.

[e-boks.dk — lønsedler](https://www.e-boks.dk)
[ferie.dk](https://www.ferie.dk)`,
    order: 6,
  },
]

async function seedIntranet() {
  console.log("Seeding intranet pages with real content...")

  for (const page of PAGES) {
    await db.insert(intranetPage).values({
      id: crypto.randomUUID(),
      ...page,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: intranetPage.key,
      set: {
        ...page,
        updatedAt: new Date(),
      }
    })
  }

  console.log("Intranet pages seeded successfully!")
}

seedIntranet().catch(console.error)
