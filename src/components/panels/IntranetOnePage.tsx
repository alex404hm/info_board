"use client"

import { ChevronDown, Mail, Phone } from "lucide-react"
import { useState, type ReactNode } from "react"

type AccordionItem = {
  id: string
  title: string
  content: ReactNode
}

const ITEMS: AccordionItem[] = [
  {
    id: "studieadministration",
    title: "Studieadministration",
    content: (
      <div className="space-y-4">
        <p>Studieadministrationen er fysisk placeret på TEC Frederiksberg.</p>
        <p>Stæhr Johansens Vej 7, 2000 Frederiksberg.</p>
        <p>TEC bruger kun digital post. Studieadministrationen sender alle breve til din e-boks. Du har pligt til at tjekke din e-boks.</p>
        <p>
          Det er til studieadministrationen, at du skal melde adresseændring. Du kan kontakte studieadministrationen på
          {" "}
          <a href="mailto:sikkerpost.sop@tec.dk" className="font-semibold text-[var(--accent-strong)] underline underline-offset-4">sikkerpost.sop@tec.dk</a>
          {" "}
          eller på
          {" "}
          <a href="tel:38177000" className="font-semibold text-[var(--accent-strong)] underline underline-offset-4">38 17 70 00</a>.
        </p>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
          Personfølsomme oplysninger til studieadministrationen, som f.eks. en mulighedserklæring, skal sendes til sikkerpost.sop@tec.dk.
        </div>
      </div>
    ),
  },
  {
    id: "laerepladssogning",
    title: "Lærepladssøgning",
    content: (
      <div className="space-y-4">
        <p>Når du er blevet optaget i Skoleoplæringen, skal du fortsat være aktivt lærepladssøgende. Du kan få råd og vejledning undervejs i dit forløb.</p>
        <p className="font-semibold text-[var(--foreground)]">Instruktører</p>
        <p>Under din uddannelse i Skoleoplæringen er det din instruktør, som er din nærmeste kontaktperson. Du kan altid spørge din instruktør til råds om din uddannelse, og instruktøren kan også henvise dig til andre kontaktpersoner på TEC. Navn og kontaktoplysninger på instruktørerne får du udleveret på et informationsark ved uddannelsens start.</p>
      </div>
    ),
  },
  {
    id: "laereplads-i-skoleoplaeringen",
    title: "Læreplads når du er i skoleoplæringen",
    content: (
      <div className="space-y-5">
        <p>I løbet af din tid i Skoleoplæringen har du mulighed for at komme i forskellige former for aftaler. I nogle tilfælde bevarer du din Skoleoplæringsydelse, og i andre tilfælde bliver du lønnet som en lærling inden for faget.</p>

        <div className="space-y-2">
          <p className="font-semibold text-[var(--foreground)]">Restuddannelsesaftale</p>
          <p>En restuddannelsesaftale er en uddannelsesaftale for resten af lærlingens læretid. Det vil sige, at lærlingen tidligere har gennemført en del af sin uddannelse enten i Skoleoplæringen eller i en anden virksomhed, inden lærlingen ansættes i den nye virksomhed.</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Virksomheden skal være godkendt for at ansætte lærlingen i den pågældende periode</li>
            <li>Lærlingen må deltage i virksomhedens produktion</li>
            <li>Virksomheden betaler lærlingens løn efter gældende overenskomst</li>
            <li>Lærlingen er omfattet af virksomhedens forsikring</li>
            <li>Virksomheden har ansvaret for lærlingens uddannelse i den tid, hvor restuddannelsesaftalen løber</li>
            <li>Der er 3 måneders gensidig prøvetid</li>
          </ul>
        </div>

        <div className="space-y-2">
          <p className="font-semibold text-[var(--foreground)]">Kort aftale</p>
          <p>I den korte aftale gælder samme vilkår som ved indgåelse af en restuddannelsesaftale. Desuden gælder følgende:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Virksomheden har ansvaret for lærlingens uddannelse i den tid, hvor den korte aftale løber</li>
            <li>Den korte aftale skal indeholde minimum en oplæringsperiode og en skoleperiode</li>
            <li>Der kan maksimalt laves 1 kort uddannelsesaftale mellem samme elev og virksomhed, undtagelsesvist en anden med godkendelse fra det lokale uddannelsesudvalg</li>
            <li>Efter en kort aftale, er lærlingen berettiget til at blive optaget i Skoleoplæringen</li>
          </ul>
        </div>

        <div className="space-y-2">
          <p className="font-semibold text-[var(--foreground)]">Delaftale</p>
          <p>I delaftalen gælder samme vilkår som ved indgåelse af en restuddannelsesaftale. Desuden gælder følgende:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Virksomheden har ansvaret for lærlingens uddannelse i den tid, hvor delaftalen løber</li>
            <li>Delaftalen indeholder kun en oplæringsperiode</li>
            <li>Delaftalen kan kun indgås og gennemføres én gang mellem samme elev og virksomhed</li>
            <li>Efter en delaftale er lærlingen berettiget til at komme tilbage til Skoleoplæringen</li>
          </ul>
        </div>

        <div className="space-y-2">
          <p className="font-semibold text-[var(--foreground)]">Virksomhedsforlagt oplæring - VFO</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Virksomheden skal være godkendt til at have lærlinge</li>
            <li>Skoleoplæringen betaler skoleoplæringsydelsen, og lærlingen får befordringstilskud efter reglerne</li>
            <li>Aftalens varighed er afhængig af de praktikmål, som danner grundlag for aftalen</li>
            <li>Lærlingen kan maksimalt være 3 uger i samme virksomhed og højst 6 uger af elevens samlede oplæring</li>
            <li>Lærlingen må ikke deltage i virksomhedens produktion, medmindre det er på vegne af en medarbejder</li>
            <li>Lærlingen er delvist omfattet af Skoleoplærings forsikring</li>
          </ul>
        </div>

        <div className="space-y-2">
          <p className="font-semibold text-[var(--foreground)]">Straffeattest</p>
          <p>Såfremt en virksomhed kræver det, kan du blive bedt om at indhente din straffeattest. Du kan bestille straffeattest via borger.dk eller via din lokale politistation.</p>
          <p>Hvis du har yderligere spørgsmål til oplæringsaftaler, er du meget velkommen til at kontakte en af TECs virksomhedskonsulenter.</p>
        </div>
      </div>
    ),
  },
  {
    id: "emma",
    title: "Emma - Krav og løbende evaluering",
    content: (
      <div className="space-y-4">
        <p className="font-semibold text-[var(--foreground)]">Evaluering af oplæringsforløb</p>
        <p>Både når du er i oplæring på skolen, og når du er i VFP bliver din indsats og det udbytte du får af dine oplæringsophold løbende evalueret. Evalueringen sker både for at sikre, at du lever op til EMMA-kravene, men også for at vi hele tiden kan blive bedre til at gennemføre oplæringsforløbene, så du lærer mest muligt, mens du er i Skoleoplæringen.</p>
        <p>Du vil under hele dit uddannelsesforløb løbende blive indkaldt til samtaler, hvor dit uddannelsesforløb vil blive evalueret og din skoleaftale revideret.</p>
        <p className="font-semibold text-[var(--foreground)]">Emma-kravene består af nedenstående:</p>
        <div className="space-y-2">
          <p><strong>E = Egnet</strong> - Du skal være egnet til at gennemføre den ønskede faglige uddannelse.</p>
          <p><strong>M = Mobil</strong> - I betydningen geografisk mobil. Du skal være indforstået med at flytte efter en ledig læreplads.</p>
          <p><strong>M = Mobil</strong> - I betydningen faglig mobil. Du skal være indforstået med, om muligt, at skulle skifte til et beslægtet fagområde, hvis det er muligt at få en læreplads her.</p>
          <p><strong>A = Aktiv søgende</strong> - Du skal fortsætte med at søge efter en læreplads, mens du er i Skoleoplæringen.</p>
        </div>
        <p>Du skal på lærepladsen.dk fremvise dokumentation for, at du løbende søger lærepladser. Krav om antal ansøgninger per måned anvises af din instruktør. Såfremt du bliver anvist at søge specifik læreplads, skal dette også dokumenteres på lærepladsen.dk.</p>
        <p>En af forudsætningerne for at være i Skoleoplæringen er, at du har en aktiv og synlig profil på lærepladsen.dk. Du skal jævnligt logge ind og synliggøre din profil, så den ikke deaktiveres. Vi anbefaler, du gør det mindst en gang hver måned.</p>
      </div>
    ),
  },
  {
    id: "befordringstilskud",
    title: "Befordringstilskud",
    content: (
      <div className="space-y-4">
        <p>Efter bestemmelser fastlagt af Arbejdsgivernes Elevrefusion kan du som Skoleoplæringslærling få befordringstilskud svarende til billigste offentlige transportmiddel, hvis din samlede transportvej er mindst 20 km om dagen.</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Befordringstilskud får du udbetalt midt i måneden</li>
          <li>Du vil få 90% befordringstilskud per dag, når du er i oplæring og 100% per dag, når du er på skoleophold</li>
          <li>Beløbet beregnes ud fra billigste offentlige transport. Når du modtager befordringstilskud, kan du ikke trække kørsel fra på selvangivelsen</li>
          <li>Når du er i delaftale, kan du ikke modtage befordringstilskud, men kan trække kørsel fra på din selvangivelse</li>
          <li>Ansøgning for befordring sendes senest sidste arbejdsdag i måneden via sdbf.dk. Du kan max søge 4 mdr. bagud. Du skal bruge dit NemID for at logge ind.</li>
        </ul>
        <p>Spørg din instruktør, hvis du har flere spørgsmål vedr. befordring.</p>
      </div>
    ),
  },
  {
    id: "forsikringsforhold",
    title: "Forsikringsforhold",
    content: (
      <div className="space-y-4">
        <p>Hvis du kommer til skade under arbejdet i Skoleoplæringen, er du som udgangspunkt dækket af skolens forsikring gennem statens selvforsikring. Men der er nogle undtagelser, bl.a. når du holder pause, hvis du er på vej til og fra arbejde, øver skade med vilje, eller forvolder skade på andre, så er du ikke omfattet af forsikringen.</p>
        <p>Derfor kan det anbefales, at du tegner en heltidsulykkesforsikring og/eller en ansvarsforsikring.</p>
        <p>Det samme gælder, hvis du får stjålet personlige ejendele som tøj, cykel, taske osv. Her er du dækket af din egen indbo- eller tyveriforsikring.</p>
        <p>Du kan være dækket af dine forældres ansvars- og familieforsikring, også selvom du bor ude. Kontakt forsikringsselskabet for at få præcis besked, så slipper du for ubehagelige overraskelser.</p>
      </div>
    ),
  },
  {
    id: "sygdom",
    title: "Sygdom",
    content: (
      <div className="space-y-4">
        <p>Hvis du er syg, eller på anden måde er forhindret i at møde, skal du give Skoleoplæringen besked pr. telefon. Se informationsark fremsendt elektronisk ved opstart i Skoleoplæringen.</p>
        <p>Fortsætter din sygdom weekenden over, skal du ringe igen om mandagen og sygemelde dig. Du bedes raskmelde dig til din instruktør dagen før du møder efter sygdomsperiode.</p>
        <p className="font-semibold text-[var(--foreground)]">Sygemeldinger</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Hvis du er i Skoleoplæringen, skal du ringe til din instruktør</li>
          <li>Hvis du er på hovedforløb, skal du ringe til din instruktør efter gældende regler i Skoleoplæring og melde sygdom til skolen efter gældende regler på hovedforløbet</li>
          <li>Hvis du er i VFP, skal du ringe til virksomheden og din instruktør</li>
        </ul>
        <p>Sygemeldinger kan ikke ske pr. e-mail, sms, messenger eller lignende.</p>
        <p className="font-semibold text-[var(--foreground)]">Længerevarende sygdom</p>
        <p>Ved længerevarende og hyppig sygdom vil du blive indkaldt til sygefraværssamtale med din instruktør. I særlige tilfælde udfyldes der mulighedserklæring for at få lægelig vurdering og perspektiv.</p>
        <p>Ved hospitalsindlæggelse kan hospitalet skrive en erklæring om, hvor længe indlæggelsen eller sygdomsperioden vil vare.</p>
        <p>Ved massivt og gentagen sygefravær kan du blive bedt om at aflevere friattest fra 1. sygedag. Friattest skal afleveres til Skoleoplæringslederen eller instruktør første mødedag efter sygeperiode.</p>
        <p>Udgifter ved friattest og mulighedserklæring dækkes af Skoleoplæringen via TECs EAN-nummer eller SDBF. Spørg din instruktør for yderligere information.</p>
        <p className="font-semibold text-[var(--foreground)]">Kronisk lidelse eller sygdom</p>
        <p>Har du en kronisk lidelse, fx epilepsi eller diabetes, bedes du orientere din instruktør. Det samme gælder, hvis du tager livsvigtig medicin eller har allergi, som er væsentlig i forbindelse med hospitalsindlæggelse, fx overfølsomhed overfor penicillin.</p>
        <p><strong>Barnets 1. sygedag</strong>: Du har ret til dit barns 1. sygedag.</p>
      </div>
    ),
  },
  {
    id: "fravaer",
    title: "Fravær",
    content: (
      <div className="space-y-4">
        <p>Du vil som på andre arbejdspladser kunne bede om fri fra arbejde, hvis du har en særlig anledning, men det skal aftales med din instruktør minimum 2 dage før.</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Læge- og tandlægebesøg, hvis det ikke kan lægges uden for arbejdstiden</li>
          <li>Begravelse - ved dødsfald i den nærmeste familie, får du fri til begravelse</li>
        </ul>
        <p>Som udgangspunkt skelnes ikke mellem lovligt og ulovligt fravær. Alle former for fravær i kortere eller længere perioder medregnes som fravær.</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Ulovligt fravær udløser advarsel i henhold til Skoleoplæringens gældende regler. Advarselsprincippet er baseret på en graduering fra mundtlig, 1. skriftlig, 2. skriftlig advarsel til udmeldelse</li>
          <li>Hvis vi vurderer, at dit fraværsmønster er bekymrende, vil du blive indkaldt til en fraværssamtale med henblik på, hvordan fraværet kan mindskes. Fravær i form af barns 1. sygedag og barsel indgår ikke i disse regler</li>
          <li>Du har ret til barsel og forældreorlov efter gældende regler. Se afsnittet om orlov eller kontakt din instruktør for yderligere information</li>
        </ul>
      </div>
    ),
  },
  {
    id: "orlov",
    title: "Orlov",
    content: (
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="font-semibold text-[var(--foreground)]">Barsel og forældreorlov</p>
          <p>Skoleoplæringslærlinge har ret til fravær på grund af barsel, jf. § 2, stk. 1, i lov om ret til orlov og dagpenge ved barsel.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse overflow-hidden rounded-2xl border border-white/10 text-left text-sm">
            <thead>
              <tr className="bg-white/8 text-[var(--foreground)]">
                <th className="border border-white/10 px-4 py-3 font-semibold">Mor</th>
                <th className="border border-white/10 px-4 py-3 font-semibold">Far</th>
              </tr>
            </thead>
            <tbody className="text-[var(--foreground-muted)]">
              <tr>
                <td className="border border-white/10 px-4 py-3">4 ugers graviditetsorlov</td>
                <td className="border border-white/10 px-4 py-3"></td>
              </tr>
              <tr>
                <td className="border border-white/10 px-4 py-3">2 ugers orlov i forbindelse med fødslen</td>
                <td className="border border-white/10 px-4 py-3">2 ugers orlov i forbindelse med fødslen</td>
              </tr>
              <tr>
                <td className="border border-white/10 px-4 py-3">9 ugers øremærket orlov</td>
                <td className="border border-white/10 px-4 py-3">9 ugers øremærket orlov</td>
              </tr>
              <tr>
                <td className="border border-white/10 px-4 py-3">13 ugers orlov, der kan afholdes eller overdrages helt eller delvist</td>
                <td className="border border-white/10 px-4 py-3">13 ugers orlov, der kan afholdes eller overdrages helt eller delvist</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>Som forældre har I hver især ret til 24 ugers orlov med skoleoplæringsydelse efter fødslen. I kan holde orlov i forlængelse af hinanden, skiftevis eller samtidig og I kan overdrage orlov til hinanden. Det betyder, at en forældre kan holde mere end 24 ugers orlov, hvis den anden forældre har overdraget orlov. Den øremærkede orlov kan ikke overdrages.</p>
        <div className="space-y-2">
          <p className="font-semibold text-[var(--foreground)]">Fædreorlov</p>
          <p>Faren har ret til 2 ugers fædreorlov, der skal afholdes inden for de første 14 uger efter fødslen. De skal afvikles umiddelbart efter fødsel, selvfølgelig efter aftale med instruktør. Du skal som kommende far sørge for at sende en kopi af vandrejournalen til din instruktør.</p>
        </div>
        <div className="space-y-2">
          <p className="font-semibold text-[var(--foreground)]">Session og værnepligt</p>
          <p>Bliver du indkaldt til session, får du fri til at deltage i dette, uanset om du er i oplæring eller på skoleophold. Vi skal dog have besked om datoen straks efter din indkaldelse. Der gives ikke orlov til værnepligt.</p>
        </div>
      </div>
    ),
  },
  {
    id: "fri-og-helligdage",
    title: "Fri og helligdage",
    content: (
      <div className="space-y-4">
        <p>I Skoleoplæringen optjener du ikke ferie eller feriepenge, som du vil gøre i en virksomhed, når du har en uddannelsesaftale.</p>
        <p>Du modtager skoleoplæringsydelse under ferie som afvikles i Skoleoplæringen, såfremt du ikke har optjent feriepenge hos tidligere arbejdsgiver.</p>
        <p>Du har 25 feriedage og 5 feriefridage med skoleoplæringsydelse i løbet af et ferieår.</p>
        <p>I Skoleoplæringen afholdes 3 ugers samlet sommerferie, som fastlægges af Skoleoplæringen. Derudover afholdes der feriedage i forbindelse med jul og nytår, samt de 3 dage før påske og den indeklemte fredag efter Kristi Himmelfart.</p>
        <p>Se informationsark, som er fremsendt elektronisk ved opstart i Skoleoplæringen.</p>
        <p>Alle ferieperioder aftales skriftligt med din instruktør og senest 2 måneder før afvikling.</p>
        <p>Du kan ikke afholde ferie, mens du er på skoleophold.</p>
      </div>
    ),
  },
  {
    id: "skoleoplaeringsydelse",
    title: "Skoleoplæringsydelse",
    content: (
      <div className="space-y-5">
        <p>Du modtager skoleoplæringsydelse som løn i Skoleoplæringen. Du skal oprette en NemKonto i din bank, da skoleoplæringsydelsen indsættes på din NemKonto.</p>
        <p>Din skoleoplæringsydelse kan ikke suppleres med anden offentlig ydelse. Er du på kontanthjælp eller anden overførselsindkomst, kan du ikke modtage skoleoplæringsydelse.</p>
        <p>Skoleoplæringsydelsen udbetales bagud og vil være til disposition den sidste hverdag i hver måned.</p>
        <p>Din elektroniske lønseddel kan du finde på <a href="https://www.e-boks.dk/" target="_blank" rel="noreferrer" className="font-semibold text-[var(--accent-strong)] underline underline-offset-4">e-boks.dk</a>.</p>
        <p>Du modtager ikke skoleoplæringsydelse, hvis du har ulovligt fravær i skoleoplæringen.</p>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse overflow-hidden rounded-2xl border border-white/10 text-left text-sm">
            <thead>
              <tr className="bg-white/8 text-[var(--foreground)]">
                <th className="border border-white/10 px-4 py-3 font-semibold">Elever under 18 år</th>
                <th className="border border-white/10 px-4 py-3 font-semibold">Elever over 18 år</th>
                <th className="border border-white/10 px-4 py-3 font-semibold">Beløb pr. måned</th>
              </tr>
            </thead>
            <tbody className="text-[var(--foreground-muted)]">
              <tr>
                <td className="border border-white/10 px-4 py-3">3.813 kr. pr. måned (uanset trin)</td>
                <td className="border border-white/10 px-4 py-3">Trin 01 1. år</td>
                <td className="border border-white/10 px-4 py-3">9.126 kr.</td>
              </tr>
              <tr>
                <td className="border border-white/10 px-4 py-3"></td>
                <td className="border border-white/10 px-4 py-3">Trin 02 2. år</td>
                <td className="border border-white/10 px-4 py-3">10.045 kr.</td>
              </tr>
              <tr>
                <td className="border border-white/10 px-4 py-3"></td>
                <td className="border border-white/10 px-4 py-3">Trin 03 3. år</td>
                <td className="border border-white/10 px-4 py-3">11.111 kr.</td>
              </tr>
              <tr>
                <td className="border border-white/10 px-4 py-3"></td>
                <td className="border border-white/10 px-4 py-3">Trin 04 4. år</td>
                <td className="border border-white/10 px-4 py-3">13.078 kr.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  {
    id: "koerekort-og-koersel",
    title: "Kørekort og kørsel i TECs biler",
    content: (
      <div className="space-y-4">
        <p>Hvis du skal tage kørekort, har du fri til teori- og køreprøve. Køretimer skal lægges udenfor arbejdstid. På uddannelser, hvor kørekort er et krav, aftaler du opstart af kørekort med din skoleoplæringsleder eller instruktør.</p>
        <p>I Skoleoplæringen kan der være opgaver, hvor der er brug for kørsel i TECs biler. Din instruktør vil informere dig yderligere.</p>
        <p>Til orientering har alle biler i Skoleoplæringen GPS-tracking.</p>
      </div>
    ),
  },
  {
    id: "vaerkstedsregler",
    title: "Værkstedsregler",
    content: (
      <div className="space-y-4">
        <p className="font-semibold text-[var(--foreground)]">Sikkerhed og arbejdsmiljø</p>
        <p>Vi lægger vægt på din sikkerhed og et godt arbejdsmiljø.</p>
        <p>Af hensyn til din egen og andres sikkerhed og for at undgå arbejdsskader er det vigtigt, at du retter dig efter de instrukser og regler, der er i dit skoleoplæringsområde eller værksted, og at du rydder op efter dig selv.</p>
        <p>Orienter dig i brandinstruks og evakueringsplan i dit område eller værksted.</p>
        <p>Personlige værnemidler og arbejdstøj udleveres afstemt efter overenskomsten. Som udgangspunkt vil du modtage ovenstående umiddelbart efter, du har påbegyndt din uddannelse.</p>
        <p>Vi forventer, at du tager ansvar for og passer ordentligt på lokaler, værktøj, udstyr og biler.</p>
        <p>Brug af mobiltelefon og PC i arbejdstiden aftales med din instruktør.</p>
        <p>Hvis du forlader værkstedet eller arbejdspladsen, skal det også aftales med din instruktør.</p>
        <p className="font-semibold text-[var(--foreground)]">Ordensregler på TEC</p>
        <p>På TEC viser vi respekt for vores medmennesker. Du kan læse mere om vores forventninger til dig, og hvad vi ikke accepterer i TECs ordensregler.</p>
        <p>Hvis du ikke lever op til TECs regler, kan det få konsekvens for din uddannelse.</p>
        <p>Skoleoplæringen vil først advare dig om, hvilke konsekvenser dine overtrædelser vil få, så du har mulighed for at rette op på problemet. I særligt alvorlige tilfælde eller i gentagelsestilfælde kan sanktionen dog iværksættes uden forudgående advarsel.</p>
        <p>Advarselsprincippet er baseret på en graduering fra mundtlig, 1. skriftlig, 2. skriftlig advarsel til udmeldelse.</p>
      </div>
    ),
  },
  {
    id: "ophoer",
    title: "Ophør i skoleoplæringen",
    content: (
      <div className="space-y-4">
        <p>Du har pligt til at kontakte din instruktør, hvis du har fået læreplads eller af en anden grund ønsker at stoppe.</p>
        <p className="font-semibold text-[var(--foreground)]">Klagevejledning</p>
        <p>Hvis du mener, at du fejlagtigt ikke er optaget i Skoleoplæringen, eller at du fejlagtigt er udelukket fra Skoleoplæringen, kan du klage over dette. Men husk, at vi skal modtage din klage senest 1 uge efter, du har modtaget den skriftlige afgørelse.</p>
      </div>
    ),
  },
]

export function IntranetOnePage() {
  const [openId, setOpenId] = useState<string>(ITEMS[0]?.id ?? "")

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <section
        className="rounded-[2rem] px-6 py-7 md:px-8"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
          border: "1px solid var(--surface-border)",
          boxShadow: "var(--panel-shadow-soft)",
        }}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--accent-strong)" }}>
              Praktisk information
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--foreground)] md:text-4xl">
              Alt samlet på én side
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--foreground-muted)] md:text-base">
              Her er god viden til dig, der skal starte i skoleoplæringen. Du kan åbne hvert afsnit herunder og læse alt direkte på `/intranet` i stedet for at gå ind i separate bokse.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-[var(--foreground-muted)]">
            <a
              href="mailto:sikkerpost.sop@tec.dk"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 transition-colors hover:bg-white/8"
            >
              <Mail className="h-3.5 w-3.5" />
              sikkerpost.sop@tec.dk
            </a>
            <a
              href="tel:38177000"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 transition-colors hover:bg-white/8"
            >
              <Phone className="h-3.5 w-3.5" />
              38 17 70 00
            </a>
          </div>
        </div>
      </section>

      <section className="flex flex-col overflow-hidden rounded-[2rem]" style={{ border: "1px solid var(--surface-border)", boxShadow: "var(--panel-shadow-soft)" }}>
        {ITEMS.map((item, index) => {
          const isOpen = openId === item.id

          return (
            <div
              key={item.id}
              style={{
                background: isOpen ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                borderTop: index === 0 ? "none" : "1px solid var(--divider)",
              }}
            >
              <button
                type="button"
                onClick={() => setOpenId((current) => current === item.id ? "" : item.id)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-white/4 md:px-8"
              >
                <span className="text-base font-semibold md:text-lg" style={{ color: "var(--foreground)" }}>
                  {item.title}
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  style={{ color: "var(--foreground-muted)" }}
                />
              </button>

              {isOpen && (
                <div className="px-6 pb-6 md:px-8 md:pb-8">
                  <div
                    className="rounded-[1.5rem] px-5 py-5 text-sm leading-7 md:px-6 md:py-6 md:text-[15px]"
                    style={{
                      background: "var(--surface-soft)",
                      color: "var(--foreground-muted)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    {item.content}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </section>
    </div>
  )
}
