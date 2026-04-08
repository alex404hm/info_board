export type IntranetFaqItem = {
  id: string
  title: string
  content: string
}

export const INTRANET_FAQ_SETTING_KEY = "intranet_faq_items"

export const DEFAULT_INTRANET_FAQ_ITEMS: IntranetFaqItem[] = [
  {
    id: "studieadministration",
    title: "Studieadministration",
    content: `
Studieadministrationen er fysisk placeret på TEC Frederiksberg.

Stæhr Johansens Vej 7, 2000 Frederiksberg.

TEC bruger kun digital post. Studieadministrationen sender alle breve til din e-boks. Du har pligt til at tjekke din e-boks.

Det er til studieadministrationen, at du skal melde adresseændring. Du kan kontakte studieadministrationen på [sikkerpost.sop@tec.dk](mailto:sikkerpost.sop@tec.dk) eller på [38 17 70 00](tel:38177000).

Personfølsomme oplysninger til studieadministrationen, som for eksempel en mulighedserklæring, skal sendes til sikkerpost.sop@tec.dk.
`.trim(),
  },
  {
    id: "laerepladssogning",
    title: "Lærepladssøgning",
    content: `
Når du er blevet optaget i skoleoplæringen, skal du fortsat være aktivt lærepladssøgende. Du kan få råd og vejledning undervejs i dit forløb.

### Instruktører

Under din uddannelse i skoleoplæringen er det din instruktør, som er din nærmeste kontaktperson. Du kan altid spørge din instruktør til råds om din uddannelse, og instruktøren kan også henvise dig til andre kontaktpersoner på TEC. Navn og kontaktoplysninger på instruktørerne får du udleveret på et informationsark ved uddannelsens start.
`.trim(),
  },
  {
    id: "laereplads-i-skoleoplaeringen",
    title: "Læreplads når du er i skoleoplæringen",
    content: `
I løbet af din tid i skoleoplæringen har du mulighed for at komme i forskellige former for aftaler. I nogle tilfælde bevarer du din skoleoplæringsydelse, og i andre tilfælde bliver du lønnet som en lærling inden for faget.

### Restuddannelsesaftale

En restuddannelsesaftale er en uddannelsesaftale for resten af lærlingens læretid. Det vil sige, at lærlingen tidligere har gennemført en del af sin uddannelse enten i skoleoplæringen eller i en anden virksomhed, inden lærlingen ansættes i den nye virksomhed.

- Virksomheden skal være godkendt for at ansætte lærlingen i den pågældende periode
- Lærlingen må deltage i virksomhedens produktion
- Virksomheden betaler lærlingens løn efter gældende overenskomst
- Lærlingen er omfattet af virksomhedens forsikring
- Virksomheden har ansvaret for lærlingens uddannelse i den tid, hvor restuddannelsesaftalen løber
- Der er 3 måneders gensidig prøvetid

### Kort aftale

I den korte aftale gælder samme vilkår som ved indgåelse af en restuddannelsesaftale. Desuden gælder følgende:

- Virksomheden har ansvaret for lærlingens uddannelse i den tid, hvor den korte aftale løber
- Den korte aftale skal indeholde minimum en oplæringsperiode og en skoleperiode
- Der kan maksimalt laves 1 kort uddannelsesaftale mellem samme elev og virksomhed, undtagelsesvist en anden med godkendelse fra det lokale uddannelsesudvalg
- Efter en kort aftale er lærlingen berettiget til at blive optaget i skoleoplæringen

### Delaftale

I delaftalen gælder samme vilkår som ved indgåelse af en restuddannelsesaftale. Desuden gælder følgende:

- Virksomheden har ansvaret for lærlingens uddannelse i den tid, hvor delaftalen løber
- Delaftalen indeholder kun en oplæringsperiode
- Delaftalen kan kun indgås og gennemføres én gang mellem samme elev og virksomhed
- Efter en delaftale er lærlingen berettiget til at komme tilbage til skoleoplæringen

### Virksomhedsforlagt oplæring - VFO

- Virksomheden skal være godkendt til at have lærlinge
- Skoleoplæringen betaler skoleoplæringsydelsen, og lærlingen får befordringstilskud efter reglerne
- Aftalens varighed er afhængig af de praktikmål, som danner grundlag for aftalen
- Lærlingen kan maksimalt være 3 uger i samme virksomhed og højst 6 uger af elevens samlede oplæring
- Lærlingen må ikke deltage i virksomhedens produktion, medmindre det er på vegne af en medarbejder
- Lærlingen er delvist omfattet af skoleoplæringens forsikring

### Straffeattest

Såfremt en virksomhed kræver det, kan du blive bedt om at indhente din straffeattest. Du kan bestille straffeattest via borger.dk eller via din lokale politistation.

Hvis du har yderligere spørgsmål til oplæringsaftaler, er du meget velkommen til at kontakte en af TECs virksomhedskonsulenter.
`.trim(),
  },
  {
    id: "emma",
    title: "Emma - Krav og løbende evaluering",
    content: `
### Evaluering af oplæringsforløb

Både når du er i oplæring på skolen, og når du er i VFP, bliver din indsats og det udbytte du får af dine oplæringsophold løbende evalueret. Evalueringen sker både for at sikre, at du lever op til EMMA-kravene, men også for at vi hele tiden kan blive bedre til at gennemføre oplæringsforløbene, så du lærer mest muligt, mens du er i skoleoplæringen.

Du vil under hele dit uddannelsesforløb løbende blive indkaldt til samtaler, hvor dit uddannelsesforløb vil blive evalueret, og din skoleaftale revideret.

### EMMA-kravene består af nedenstående

- **E = Egnet**: Du skal være egnet til at gennemføre den ønskede faglige uddannelse.
- **M = Mobil**: Du skal være indforstået med at flytte efter en ledig læreplads.
- **M = Mobil**: Du skal i faglig forstand være indforstået med, om muligt, at skulle skifte til et beslægtet fagområde, hvis det giver mulighed for en læreplads.
- **A = Aktiv søgende**: Du skal fortsætte med at søge efter en læreplads, mens du er i skoleoplæringen.

Du skal på lærepladsen.dk fremvise dokumentation for, at du løbende søger lærepladser. Krav om antal ansøgninger per måned anvises af din instruktør. Såfremt du bliver anvist at søge en specifik læreplads, skal dette også dokumenteres på lærepladsen.dk.

En af forudsætningerne for at være i skoleoplæringen er, at du har en aktiv og synlig profil på lærepladsen.dk. Du skal jævnligt logge ind og synliggøre din profil, så den ikke deaktiveres. Vi anbefaler, at du gør det mindst en gang hver måned.
`.trim(),
  },
  {
    id: "befordringstilskud",
    title: "Befordringstilskud",
    content: `
Efter bestemmelser fastlagt af Arbejdsgivernes Elevrefusion kan du som skoleoplæringslærling få befordringstilskud svarende til billigste offentlige transportmiddel, hvis din samlede transportvej er mindst 20 km om dagen.

- Befordringstilskud får du udbetalt midt i måneden
- Du vil få 90% befordringstilskud per dag, når du er i oplæring og 100% per dag, når du er på skoleophold
- Beløbet beregnes ud fra billigste offentlige transport. Når du modtager befordringstilskud, kan du ikke trække kørsel fra på selvangivelsen
- Når du er i delaftale, kan du ikke modtage befordringstilskud, men kan trække kørsel fra på din selvangivelse
- Ansøgning for befordring sendes senest sidste arbejdsdag i måneden via sdbf.dk. Du kan maksimalt søge 4 måneder bagud. Du skal bruge dit NemID for at logge ind

Spørg din instruktør, hvis du har flere spørgsmål vedrørende befordring.
`.trim(),
  },
  {
    id: "forsikringsforhold",
    title: "Forsikringsforhold",
    content: `
Hvis du kommer til skade under arbejdet i skoleoplæringen, er du som udgangspunkt dækket af skolens forsikring gennem statens selvforsikring. Men der er nogle undtagelser, blandt andet når du holder pause, hvis du er på vej til og fra arbejde, øver skade med vilje, eller forvolder skade på andre, så er du ikke omfattet af forsikringen.

Derfor kan det anbefales, at du tegner en heltidsulykkesforsikring og eller en ansvarsforsikring.

Det samme gælder, hvis du får stjålet personlige ejendele som tøj, cykel, taske og lignende. Her er du dækket af din egen indbo- eller tyveriforsikring.

Du kan være dækket af dine forældres ansvars- og familieforsikring, også selvom du bor ude. Kontakt forsikringsselskabet for at få præcis besked, så du slipper for ubehagelige overraskelser.
`.trim(),
  },
  {
    id: "sygdom",
    title: "Sygdom",
    content: `
Hvis du er syg, eller på anden måde er forhindret i at møde, skal du give skoleoplæringen besked pr. telefon. Se informationsark fremsendt elektronisk ved opstart i skoleoplæringen.

Fortsætter din sygdom weekenden over, skal du ringe igen om mandagen og sygemelde dig. Du bedes raskmelde dig til din instruktør dagen før, du møder efter sygdomsperiode.

### Sygemeldinger

- Hvis du er i skoleoplæringen, skal du ringe til din instruktør
- Hvis du er på hovedforløb, skal du ringe til din instruktør efter gældende regler i skoleoplæring og melde sygdom til skolen efter gældende regler på hovedforløbet
- Hvis du er i VFP, skal du ringe til virksomheden og din instruktør

Sygemeldinger kan ikke ske pr. e-mail, sms, messenger eller lignende.

### Længerevarende sygdom

Ved længerevarende og hyppig sygdom vil du blive indkaldt til sygefraværssamtale med din instruktør. I særlige tilfælde udfyldes der mulighedserklæring for at få lægelig vurdering og perspektiv.

Ved hospitalsindlæggelse kan hospitalet skrive en erklæring om, hvor længe indlæggelsen eller sygdomsperioden vil vare.

Ved massivt og gentaget sygefravær kan du blive bedt om at aflevere friattest fra 1. sygedag. Friattest skal afleveres til skoleoplæringslederen eller instruktøren første mødedag efter sygeperiode.

Udgifter ved friattest og mulighedserklæring dækkes af skoleoplæringen via TECs EAN-nummer eller SDBF. Spørg din instruktør for yderligere information.

### Kronisk lidelse eller sygdom

Har du en kronisk lidelse, for eksempel epilepsi eller diabetes, bedes du orientere din instruktør. Det samme gælder, hvis du tager livsvigtig medicin eller har allergi, som er væsentlig i forbindelse med hospitalsindlæggelse, for eksempel overfølsomhed overfor penicillin.

**Barnets 1. sygedag**: Du har ret til dit barns 1. sygedag.
`.trim(),
  },
  {
    id: "fravaer",
    title: "Fravær",
    content: `
Du vil som på andre arbejdspladser kunne bede om fri fra arbejde, hvis du har en særlig anledning, men det skal aftales med din instruktør minimum 2 dage før.

- Læge- og tandlægebesøg, hvis det ikke kan lægges uden for arbejdstiden
- Begravelse: ved dødsfald i den nærmeste familie får du fri til begravelse

Som udgangspunkt skelnes ikke mellem lovligt og ulovligt fravær. Alle former for fravær i kortere eller længere perioder medregnes som fravær.

- Ulovligt fravær udløser advarsel i henhold til skoleoplæringens gældende regler. Advarselsprincippet er baseret på en graduering fra mundtlig, 1. skriftlig, 2. skriftlig advarsel til udmeldelse
- Hvis vi vurderer, at dit fraværsmønster er bekymrende, vil du blive indkaldt til en fraværssamtale med henblik på, hvordan fraværet kan mindskes. Fravær i form af barns 1. sygedag og barsel indgår ikke i disse regler
- Du har ret til barsel og forældreorlov efter gældende regler. Se afsnittet om orlov eller kontakt din instruktør for yderligere information
`.trim(),
  },
  {
    id: "orlov",
    title: "Orlov",
    content: `
### Barsel og forældreorlov

Skoleoplæringslærlinge har ret til fravær på grund af barsel, jf. § 2, stk. 1, i lov om ret til orlov og dagpenge ved barsel.

| Mor | Far |
| --- | --- |
| 4 ugers graviditetsorlov |  |
| 2 ugers orlov i forbindelse med fødslen | 2 ugers orlov i forbindelse med fødslen |
| 9 ugers øremærket orlov | 9 ugers øremærket orlov |
| 13 ugers orlov, der kan afholdes eller overdrages helt eller delvist | 13 ugers orlov, der kan afholdes eller overdrages helt eller delvist |

Som forældre har I hver især ret til 24 ugers orlov med skoleoplæringsydelse efter fødslen. I kan holde orlov i forlængelse af hinanden, skiftevis eller samtidig, og I kan overdrage orlov til hinanden. Det betyder, at en forælder kan holde mere end 24 ugers orlov, hvis den anden forælder har overdraget orlov. Den øremærkede orlov kan ikke overdrages.

### Fædreorlov

Faren har ret til 2 ugers fædreorlov, der skal afholdes inden for de første 14 uger efter fødslen. De skal afvikles umiddelbart efter fødsel, selvfølgelig efter aftale med instruktør. Du skal som kommende far sørge for at sende en kopi af vandrejournalen til din instruktør.

### Session og værnepligt

Bliver du indkaldt til session, får du fri til at deltage i dette, uanset om du er i oplæring eller på skoleophold. Vi skal dog have besked om datoen straks efter din indkaldelse. Der gives ikke orlov til værnepligt.
`.trim(),
  },
  {
    id: "fri-og-helligdage",
    title: "Fri og helligdage",
    content: `
I skoleoplæringen optjener du ikke ferie eller feriepenge, som du vil gøre i en virksomhed, når du har en uddannelsesaftale.

Du modtager skoleoplæringsydelse under ferie, som afvikles i skoleoplæringen, såfremt du ikke har optjent feriepenge hos tidligere arbejdsgiver.

Du har 25 feriedage og 5 feriefridage med skoleoplæringsydelse i løbet af et ferieår.

I skoleoplæringen afholdes 3 ugers samlet sommerferie, som fastlægges af skoleoplæringen. Derudover afholdes der feriedage i forbindelse med jul og nytår samt de 3 dage før påske og den indeklemte fredag efter Kristi Himmelfart.

Se informationsark, som er fremsendt elektronisk ved opstart i skoleoplæringen.

Alle ferieperioder aftales skriftligt med din instruktør og senest 2 måneder før afvikling.

Du kan ikke afholde ferie, mens du er på skoleophold.
`.trim(),
  },
  {
    id: "skoleoplaeringsydelse",
    title: "Skoleoplæringsydelse",
    content: `
Du modtager skoleoplæringsydelse som løn i skoleoplæringen. Du skal oprette en NemKonto i din bank, da skoleoplæringsydelsen indsættes på din NemKonto.

Din skoleoplæringsydelse kan ikke suppleres med anden offentlig ydelse. Er du på kontanthjælp eller anden overførselsindkomst, kan du ikke modtage skoleoplæringsydelse.

Skoleoplæringsydelsen udbetales bagud og vil være til disposition den sidste hverdag i hver måned.

Din elektroniske lønseddel kan du finde på [e-boks.dk](https://www.e-boks.dk/).

Du modtager ikke skoleoplæringsydelse, hvis du har ulovligt fravær i skoleoplæringen.

| Sats i 2026 | Beløb pr. måned |
| --- | --- |
| Elever under 18 år | kr. 4.294,- |
| Elever på 1. år af hovedforløbet | kr. 10.287,- |
| Elever på 2. år af hovedforløbet | kr. 11.317,- |
| Elever på 3. år af hovedforløbet | kr. 12.519,- |
| Elever på 4. år og derover på hovedforløbet | kr. 14.738,- |
`.trim(),
  },
  {
    id: "koerekort-og-koersel",
    title: "Kørekort og kørsel i TECs biler",
    content: `
Hvis du skal tage kørekort, har du fri til teori- og køreprøve. Køretimer skal lægges udenfor arbejdstid. På uddannelser, hvor kørekort er et krav, aftaler du opstart af kørekort med din skoleoplæringsleder eller instruktør.

I skoleoplæringen kan der være opgaver, hvor der er brug for kørsel i TECs biler. Din instruktør vil informere dig yderligere.

Til orientering har alle biler i skoleoplæringen GPS-tracking.
`.trim(),
  },
  {
    id: "vaerkstedsregler",
    title: "Værkstedsregler",
    content: `
### Sikkerhed og arbejdsmiljø

Vi lægger vægt på din sikkerhed og et godt arbejdsmiljø.

Af hensyn til din egen og andres sikkerhed og for at undgå arbejdsskader er det vigtigt, at du retter dig efter de instrukser og regler, der er i dit skoleoplæringsområde eller værksted, og at du rydder op efter dig selv.

Orienter dig i brandinstruks og evakueringsplan i dit område eller værksted.

Personlige værnemidler og arbejdstøj udleveres afstemt efter overenskomsten. Som udgangspunkt vil du modtage ovenstående umiddelbart efter, du har påbegyndt din uddannelse.

Vi forventer, at du tager ansvar for og passer ordentligt på lokaler, værktøj, udstyr og biler.

Brug af mobiltelefon og PC i arbejdstiden aftales med din instruktør.

Hvis du forlader værkstedet eller arbejdspladsen, skal det også aftales med din instruktør.

### Ordensregler på TEC

På TEC viser vi respekt for vores medmennesker. Du kan læse mere om vores forventninger til dig, og hvad vi ikke accepterer, i TECs ordensregler.

Hvis du ikke lever op til TECs regler, kan det få konsekvenser for din uddannelse.

Skoleoplæringen vil først advare dig om, hvilke konsekvenser dine overtrædelser vil få, så du har mulighed for at rette op på problemet. I særligt alvorlige tilfælde eller i gentagelsestilfælde kan sanktionen dog iværksættes uden forudgående advarsel.

Advarselsprincippet er baseret på en graduering fra mundtlig, 1. skriftlig, 2. skriftlig advarsel til udmeldelse.
`.trim(),
  },
  {
    id: "ophoer",
    title: "Ophør i skoleoplæringen",
    content: `
Du har pligt til at kontakte din instruktør, hvis du har fået læreplads eller af en anden grund ønsker at stoppe.

### Klagevejledning

Hvis du mener, at du fejlagtigt ikke er optaget i skoleoplæringen, eller at du fejlagtigt er udelukket fra skoleoplæringen, kan du klage over dette. Husk, at vi skal modtage din klage senest 1 uge efter, du har modtaget den skriftlige afgørelse.
`.trim(),
  },
]

export function normalizeIntranetFaqItems(input: unknown): IntranetFaqItem[] {
  if (!Array.isArray(input)) return DEFAULT_INTRANET_FAQ_ITEMS

  const items = input
    .map((item, index) => {
      if (!item || typeof item !== "object") return null

      const raw = item as Partial<IntranetFaqItem>
      const title = typeof raw.title === "string" ? raw.title.trim() : ""
      const content = typeof raw.content === "string" ? raw.content.trim() : ""
      const id = typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : `faq-${index + 1}`

      if (!title || !content) return null
      return { id, title, content }
    })
    .filter((item): item is IntranetFaqItem => Boolean(item))

  return items.length ? items : DEFAULT_INTRANET_FAQ_ITEMS
}
