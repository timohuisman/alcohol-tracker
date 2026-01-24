# CSV Import Instructies voor Supabase

## CSV Bestanden

- `entries-template.csv` - Lege template met alleen kolom headers
- `entries-example.csv` - Voorbeeld met sample data

## Belangrijke Opmerkingen

⚠️ **Let op**: De `user_id` in de voorbeeld CSV moet worden vervangen met je eigen user ID!

## Stap 1: Je User ID Ophalen

1. Log in op je Supabase project
2. Ga naar **Authentication** → **Users**
3. Klik op je gebruiker
4. Kopieer de **UUID** (dit is je `user_id`)
5. Vervang `00000000-0000-0000-0000-000000000000` in de CSV met je eigen user ID

## Stap 2: CSV Voorbereiden

### Optie A: Gebruik de Template

1. Open `entries-template.csv`
2. Vul de kolommen in:
   - **user_id**: Je Supabase user UUID
   - **date**: Datum in formaat `YYYY-MM-DD` (bijv. `2025-01-24`)
   - **name**: Naam van het drankje (bijv. "Bier", "Wijn")
   - **units**: Aantal standaardglazen (geheel getal, bijv. `2`)
   - **note**: Opmerking (optioneel, kan leeg blijven)

### Optie B: Gebruik het Voorbeeld

1. Open `entries-example.csv`
2. Vervang alle `00000000-0000-0000-0000-000000000000` met je eigen user ID
3. Pas de data aan naar wens

## Stap 3: CSV Importeren in Supabase

### Methode 1: Via Table Editor (Aanbevolen)

1. Ga naar **Table Editor** in je Supabase dashboard
2. Klik op de `entries` tabel
3. Klik op het **"..."** menu rechtsboven
4. Selecteer **"Import data from CSV"**
5. Upload je CSV bestand
6. Controleer de kolom mapping (zorg dat de kolommen correct gematcht zijn)
7. Klik op **"Import"**

### Methode 2: Via SQL Editor

Als je veel data hebt, kun je ook SQL gebruiken:

```sql
-- Voorbeeld: Import van CSV data
-- Vervang de waarden met je eigen data

INSERT INTO entries (user_id, date, name, units, note)
VALUES 
  ('jouw-user-id-hier', '2025-01-20', 'Bier', 2, 'Borrel met vrienden'),
  ('jouw-user-id-hier', '2025-01-21', 'Wijn', 1, NULL);
```

## CSV Formaat Vereisten

- **Encoding**: UTF-8
- **Scheidingsteken**: Komma (`,`)
- **Headers**: Eerste regel moet kolom namen bevatten
- **Datum formaat**: `YYYY-MM-DD` (bijv. `2025-01-24`)
- **Lege waarden**: Laat leeg of gebruik `NULL` voor optionele velden

## Kolom Details

| Kolom | Type | Vereist | Voorbeeld |
|-------|------|---------|-----------|
| `user_id` | UUID | ✅ Ja | `123e4567-e89b-12d3-a456-426614174000` |
| `date` | Date | ✅ Ja | `2025-01-24` |
| `name` | Text | ✅ Ja | `Bier` |
| `units` | Integer | ✅ Ja | `2` |
| `note` | Text | ❌ Nee | `Borrel met vrienden` |

## Automatische Kolommen

De volgende kolommen worden automatisch ingevuld door Supabase:
- `id` - Wordt automatisch gegenereerd (UUID)
- `created_at` - Wordt automatisch ingesteld op huidige tijd
- `updated_at` - Wordt automatisch ingesteld op huidige tijd

Je hoeft deze **niet** in je CSV op te nemen.

## Troubleshooting

### "Foreign key constraint violation"
- Controleer of de `user_id` bestaat in de `auth.users` tabel
- Zorg dat je de juiste UUID gebruikt

### "Invalid date format"
- Gebruik het formaat `YYYY-MM-DD`
- Bijv. `2025-01-24` (niet `24-01-2025` of `01/24/2025`)

### "Null value in column violates not-null constraint"
- Zorg dat `user_id`, `date`, `name`, en `units` zijn ingevuld
- Alleen `note` kan leeg zijn

### "Duplicate key value violates unique constraint"
- De `id` kolom moet uniek zijn
- Laat Supabase automatisch IDs genereren (niet handmatig invullen)

## Voorbeeld CSV Regel

```csv
user_id,date,name,units,note
123e4567-e89b-12d3-a456-426614174000,2025-01-24,Bier,2,Borrel met vrienden
```

## Tips

1. **Test eerst met 1-2 regels** voordat je grote imports doet
2. **Backup je data** voordat je imports doet (als je al data hebt)
3. **Controleer Row Level Security** - zorg dat je RLS policies correct zijn ingesteld
4. **Gebruik een spreadsheet programma** (Excel, Google Sheets) om je CSV te bewerken, maar exporteer wel als UTF-8 CSV
