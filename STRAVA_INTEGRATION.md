# Strava integratie (optioneel)

Hieronder staat een technisch stappenplan om Strava-activiteiten te koppelen aan de Alcohol Tracker, zodat je
kilometers per maand/jaar kunt vergelijken met je alcoholconsumptie. De Strava API vereist OAuth en **een server‑side
component** voor het veilig bewaren van de client secret; dat past goed bij Supabase Edge Functions.

## Overzicht

1. **Strava app aanmaken** en OAuth-gegevens ophalen.
2. **Supabase Edge Function** bouwen voor OAuth en het ophalen van activiteiten.
3. **Tokens opslaan** per gebruiker in Supabase.
4. **Aggregaties berekenen** (kilometers per maand/jaar).
5. **Frontend uitbreiden** met een vergelijking in de inzichten.

## 1) Strava app aanmaken

1. Maak een Strava API‑app aan via <https://www.strava.com/settings/api>.
2. Noteer je **Client ID** en **Client Secret**.
3. Stel de **Authorization Callback Domain** in, bijv. `localhost` voor lokaal en je productie‑domein voor live.

## 2) Supabase Edge Function

Gebruik een Edge Function als veilige proxy voor het OAuth‑proces en het ophalen van activiteiten.

In deze repo staat een voorbeeld‑Edge Function op
`supabase/functions/strava/index.ts` die twee acties ondersteunt:

- `authorize`: wisselt de OAuth `code` om voor tokens en slaat ze op.
- `sync`: haalt activiteiten op en vult `strava_monthly_stats`.

### Benodigdheden

- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Deploy stappen (Supabase CLI)

1. Installeer de Supabase CLI (<https://supabase.com/docs/guides/cli>).
2. Login en link je project:

```bash
supabase login
supabase link --project-ref <project-ref>
```

3. Zet de benodigde secrets:

```bash
supabase secrets set \\
  STRAVA_CLIENT_ID=... \\
  STRAVA_CLIENT_SECRET=... \\
  SUPABASE_URL=... \\
  SUPABASE_SERVICE_ROLE_KEY=...
```

4. Deploy de functie:

```bash
supabase functions deploy strava
```

### OAuth flow

1. Frontend opent Strava OAuth:
   `https://www.strava.com/oauth/authorize?client_id=...&response_type=code&redirect_uri=...&scope=activity:read_all`
2. Strava retourneert `code`.
3. Frontend stuurt `code` naar de Edge Function (`action: "authorize"`).
4. Edge Function wisselt `code` om voor `access_token` + `refresh_token`.
5. Tokens opslaan in Supabase.

## 3) Database‑tabellen

Minimaal:

```sql
create table if not exists strava_tokens (
  user_id uuid primary key references auth.users on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null
);
```

Aanvullend kun je een tabel toevoegen voor geaggregeerde statistieken:

```sql
create table if not exists strava_monthly_stats (
  user_id uuid references auth.users on delete cascade,
  year int not null,
  month int not null,
  total_km numeric not null default 0,
  primary key (user_id, year, month)
);
```

## 4) Aggregaties berekenen

Je kunt in de Edge Function de Strava activiteiten ophalen (bijv. de laatste 12 maanden) en
per maand totalen berekenen. Die totalen schrijf je weg in `strava_monthly_stats` zodat de frontend
alleen nog maar hoeft te lezen.

**Tip:** vraag alleen `type=Run` of filter lokaal op `sport_type`.

## 5) Frontend uitbreiden

In `public/app.js` kun je:

1. Een knop toevoegen “Koppel Strava” die de OAuth flow start.
2. Een API‑call doen naar de Edge Function om maand/jaar statistieken op te halen.
3. De inzichten uitbreiden met:
   - km gelopen per maand/jaar
   - verhouding km vs. standaardglazen

Voorbeeld (vereenvoudigd):

```js
// 1) OAuth starten (in de browser)
const params = new URLSearchParams({
  client_id: STRAVA_CLIENT_ID,
  response_type: "code",
  redirect_uri: STRAVA_REDIRECT_URI,
  scope: "activity:read_all",
});
window.location.href = `https://www.strava.com/oauth/authorize?${params}`;

// 2) OAuth code doorsturen naar Edge Function
await fetch(`${SUPABASE_FUNCTIONS_URL}/strava`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${supabaseToken}`,
  },
  body: JSON.stringify({ action: "authorize", code }),
});

// 3) Sync triggeren
await fetch(`${SUPABASE_FUNCTIONS_URL}/strava`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${supabaseToken}`,
  },
  body: JSON.stringify({ action: "sync" }),
});
```

## Belangrijke aandachtspunten

- **Client Secret hoort nooit in de frontend.** Gebruik altijd een server‑side proxy.
- **Rate limits**: cache resultaten (bijv. één keer per dag).
- **Privacy**: geef duidelijk aan wat er wordt opgehaald en opgeslagen.
