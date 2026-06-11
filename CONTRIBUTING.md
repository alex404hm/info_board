# Contributing to info_board

## Branch-struktur

| Branch | Formål | Opdateres via |
|---|---|---|
| `main` | Produktion — live hjemmeside | Pull request fra `development` |
| `development` | Staging/preview — samlingspunkt for features | Pull request fra `feature/*` |
| `feature/*` | Dagligt arbejde — én branch per opgave | Oprettes fra `development` |

**Aldrig** commit direkte til `main` eller `development`. Alt arbejde foregår på feature-branches.

## Navngivning

```
feature/beskrivelse-af-opgaven   ← ny funktionalitet
fix/kort-beskrivelse-af-fejl     ← bugfix
refactor/hvad-der-refaktoreres   ← omstrukturering uden ny adfærd
chore/hvad-der-opdateres         ← dependencies, config, CI
```

## Dagligt workflow

### Start en ny opgave

```bash
# Sørg for at du er opdateret
git checkout development
git pull origin development

# Opret din feature-branch
git checkout -b feature/min-opgave
```

### Underveis — gem dit arbejde

```bash
git add -p                        # gennemgå ændringer chunk for chunk
git commit -m "feat: hvad og hvorfor"
git push origin feature/min-opgave
```

### Når opgaven er klar til review

1. Gå til [github.com/alex404hm/info_board/pulls](https://github.com/alex404hm/info_board/pulls)
2. Opret et Pull Request fra `feature/min-opgave` → `development`
3. Beskriv hvad der er ændret og hvorfor
4. Merge når du er tilfreds — slet branchen bagefter

### Merge til produktion

Når `development` er testet og klar:

1. Opret et Pull Request fra `development` → `main`
2. Tjek Vercels preview-deployment
3. Merge — Vercel deployer automatisk til produktion

## Commit-beskeder

Format: `type: kort beskrivelse i nutid`

```
feat: tilføj afgangspanel til forsiden
fix: ret forkert tidzone i kalender-API
refactor: opdel WeatherPanel i mindre komponenter
chore: opdater Next.js til 15.3
```

## Miljøvariabler

Kopier `.env.example` til `.env.local` og udfyld værdierne. Commit aldrig `.env`-filer — de er og skal forblive i `.gitignore`.
