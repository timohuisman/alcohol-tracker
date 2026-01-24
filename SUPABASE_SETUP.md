# Supabase Setup Instructies

## Stap 1: Supabase Project Aanmaken

1. Ga naar [supabase.com](https://supabase.com)
2. Klik op "Start your project" of "Sign in"
3. Maak een account aan (of log in met GitHub/Google)
4. Klik op "New Project"
5. Vul de volgende gegevens in:
   - **Name**: alcohol-tracker (of een andere naam)
   - **Database Password**: Kies een sterk wachtwoord (bewaar dit!)
   - **Region**: Kies de dichtstbijzijnde regio (bijv. West Europe)
6. Klik op "Create new project"
7. Wacht 1-2 minuten tot het project is aangemaakt

## Stap 2: Database Tabel Aanmaken

1. In je Supabase dashboard, ga naar **Table Editor** (in het linker menu)
2. Klik op **"New table"**
3. Vul in:
   - **Name**: `entries`
   - **Description**: Alcohol consumptie entries
4. Voeg de volgende kolommen toe (klik op "Add column" voor elke kolom):

   | Column name | Type | Default value | Is nullable? | Is unique? |
   |-------------|------|---------------|---------------|------------|
   | id | uuid | gen_random_uuid() | ❌ | ✅ |
   | user_id | uuid | - | ❌ | ❌ |
   | date | date | - | ❌ | ❌ |
   | name | text | - | ❌ | ❌ |
   | units | int4 | - | ❌ | ❌ |
   | note | text | - | ✅ | ❌ |
   | created_at | timestamptz | now() | ❌ | ❌ |
   | updated_at | timestamptz | now() | ❌ | ❌ |

5. Klik op **"Save"**

## Stap 3: Row Level Security (RLS) Instellen

Dit zorgt ervoor dat gebruikers alleen hun eigen data kunnen zien en bewerken.

1. Ga naar **Table Editor** → klik op de `entries` tabel
2. Klik op het **"..."** menu rechtsboven → **"View policies"**
3. Klik op **"New policy"**
4. Kies **"For full customization"**
5. Vul in:
   - **Policy name**: `Users can view own entries`
   - **Allowed operation**: SELECT
   - **Policy definition**: 
     ```sql
     (auth.uid() = user_id)
     ```
6. Klik op **"Review"** en dan **"Save policy"**

7. Maak nog een policy:
   - **Policy name**: `Users can insert own entries`
   - **Allowed operation**: INSERT
   - **Policy definition**:
     ```sql
     (auth.uid() = user_id)
     ```
   - Klik op **"Review"** en **"Save policy"**

8. Maak nog een policy:
   - **Policy name**: `Users can update own entries`
   - **Allowed operation**: UPDATE
   - **Policy definition**:
     ```sql
     (auth.uid() = user_id)
     ```
   - Klik op **"Review"** en **"Save policy"**

9. Maak nog een policy:
   - **Policy name**: `Users can delete own entries`
   - **Allowed operation**: DELETE
   - **Policy definition**:
     ```sql
     (auth.uid() = user_id)
     ```
   - Klik op **"Review"** en **"Save policy"**

## Stap 4: API Credentials Ophalen

1. Ga naar **Settings** (tandwiel icoon linksonder) → **API**
2. Je ziet twee belangrijke waarden:
   - **Project URL**: Dit is je `SUPABASE_URL`
   - **anon public key**: Dit is je `SUPABASE_ANON_KEY`

## Stap 5: Configuratie Bestand Invullen

1. Open het bestand `public/supabase-config.js`
2. Vervang `YOUR_SUPABASE_URL` met je Project URL
3. Vervang `YOUR_SUPABASE_ANON_KEY` met je anon public key

Voorbeeld:
```javascript
const SUPABASE_URL = 'https://abcdefghijklmnop.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

## Stap 6: Authenticatie Instellen (Optioneel)

Standaard is email/password authenticatie al ingeschakeld. Als je OAuth wilt toevoegen (Google, GitHub, etc.):

1. Ga naar **Authentication** → **Providers**
2. Schakel de gewenste providers in
3. Volg de instructies voor elke provider

## Klaar! 🎉

Je Supabase setup is nu compleet. Open de app in je browser en je kunt:
- Een account aanmaken
- Inloggen
- Entries toevoegen die automatisch gesynchroniseerd worden

## Troubleshooting

### "Invalid API key" error
- Controleer of je de juiste `anon public key` hebt gebruikt (niet de `service_role key`)
- Zorg dat er geen extra spaties zijn in `supabase-config.js`

### "new row violates row-level security policy"
- Controleer of je alle RLS policies correct hebt ingesteld
- Zorg dat `user_id` automatisch wordt ingevuld bij het aanmaken van entries

### "relation does not exist"
- Controleer of de tabel `entries` correct is aangemaakt
- Controleer of de tabel naam exact `entries` is (kleine letters)

### Authenticatie werkt niet
- Controleer of email/password authenticatie is ingeschakeld in Authentication → Providers
- Controleer of je email is geverifieerd (als email verificatie is vereist)

## Delen via link (alleen lezen)

Met onderstaande SQL kun je een leeslink genereren waarmee anderen je gegevens kunnen bekijken zonder te bewerken.

1. Ga in Supabase naar **SQL Editor** → **New query**
2. Plak en run:
   ```sql
   create table if not exists public.share_links (
     id uuid primary key default gen_random_uuid(),
     user_id uuid not null,
     token text not null unique,
     created_at timestamptz not null default now(),
     revoked_at timestamptz
   );

   create index if not exists share_links_token_idx on public.share_links (token);

   alter table public.share_links enable row level security;

   create policy "Users can manage own share links"
     on public.share_links
     for all
     using (auth.uid() = user_id)
     with check (auth.uid() = user_id);

   create or replace function public.get_shared_entries(share_token text)
   returns setof public.entries
   language sql
   security definer
   set search_path = public
   as $$
     select e.*
     from public.entries e
     join public.share_links s on s.user_id = e.user_id
     where s.token = share_token
       and s.revoked_at is null;
   $$;

   grant execute on function public.get_shared_entries(text) to anon, authenticated;
   ```

3. In de app kun je nu via het menu “Deel leeslink” een URL genereren.
4. Wil je een link intrekken? Verwijder de rij in `share_links` of zet `revoked_at` op `now()`.
