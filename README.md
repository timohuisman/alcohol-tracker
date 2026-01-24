# Alcohol Tracker

Een web applicatie om je alcoholconsumptie per dag bij te houden, met multi-device synchronisatie via Supabase.

## Features

- ✅ Alcohol consumptie registreren per dag
- ✅ Kalenderweergave met kleurcodering
- ✅ Inzichten en statistieken
- ✅ **Multi-device synchronisatie** - toegang vanaf meerdere apparaten
- ✅ **Real-time updates** - wijzigingen verschijnen direct op alle apparaten
- ✅ **Authenticatie** - veilige toegang tot je eigen data

## Setup

### 1. Supabase Project Aanmaken

Volg de gedetailleerde instructies in [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) om:
- Een Supabase project aan te maken
- De database tabel te configureren
- Row Level Security in te stellen
- Je API credentials te verkrijgen

### 2. Configuratie

1. Kopieer `public/supabase-config.example.js` naar `public/supabase-config.local.js`
2. Vervang `YOUR_SUPABASE_URL` met je Supabase Project URL
3. Vervang `YOUR_SUPABASE_ANON_KEY` met je Supabase anon key

### 3. Lokaal Testen

Je kunt de app lokaal testen door een lokale webserver te starten:

```bash
# Met Python
python -m http.server 8000

# Of met Node.js (npx)
npx serve public

# Of met PHP
php -S localhost:8000 -t public
```

Open dan `http://localhost:8000` in je browser.

### DDEV (aanrader voor lokaal)

Deze repository bevat een DDEV configuratie die je kunt meecommitten.

1. Zorg dat DDEV geïnstalleerd is
2. Start de omgeving:

```bash
ddev start
```

3. Open de app:

```bash
ddev launch
```

Of handmatig: `https://alcohol-tracker.ddev.site`

### 4. Deployen (GitHub Pages)

Voor GitHub Pages heb je een productieconfig nodig in `public/supabase-config.js`:

1. Kopieer `public/supabase-config.example.js` naar `public/supabase-config.js`
2. Vul je Supabase URL + anon key in
3. Commit en push

Let op: `public/supabase-config.local.js` blijft lokaal en is git‑ignored.

### 5. PWA (installeren op telefoon)

De app bevat een PWA manifest en service worker. Na deployment kun je op je telefoon via de browser
de app installeren op je homescreen (bijv. “Add to Home Screen”).

Let op: service workers werken alleen via `http://localhost` of `https://` (niet via `file://`).
Bij GitHub Pages moet het `start_url` en de `scope` in `public/manifest.webmanifest` overeenkomen met
de repo‑naam, bijvoorbeeld `/alcohol-tracker/`. Pas dit aan als je repo‑naam anders is.

### 5. Deployen (overige)

Je kunt de app deployen naar:
- **Netlify**: Sleep de `public` folder naar Netlify Drop
- **Vercel**: `vercel --prod public`
- **GitHub Pages**: Push naar een `gh-pages` branch
- Elke andere statische hosting service

## Gebruik

1. Open de app in je browser
2. Maak een account aan (of log in als je al een account hebt)
3. Begin met het toevoegen van alcohol consumptie entries
4. Je data wordt automatisch gesynchroniseerd naar de cloud
5. Log in op een ander apparaat om je data te zien

## Technologie

- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Backend**: Supabase (PostgreSQL database)
- **Authenticatie**: Supabase Auth
- **Real-time**: Supabase Realtime subscriptions

## Bestanden

- `public/index.html` - Hoofd HTML bestand
- `public/app.js` - JavaScript logica
- `public/styles.css` - Styling
- `public/supabase-config.local.js` - Lokale Supabase configuratie (niet mee gecommit)
- `public/supabase-config.js` - Productie Supabase configuratie (mee gecommit voor GitHub Pages)
- `public/supabase-config.example.js` - Voorbeeld Supabase configuratie
- `SUPABASE_SETUP.md` - Gedetailleerde Supabase setup instructies
- `DATABASE_OPTIES.md` - Overzicht van database opties

## Licentie

Vrij te gebruiken voor persoonlijk gebruik.
