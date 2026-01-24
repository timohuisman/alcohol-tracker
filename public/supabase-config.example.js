// Supabase configuratie (voorbeeld)
// Kopieer dit bestand naar supabase-config.local.js en vul je eigen credentials in.
// Je vindt deze in je Supabase dashboard onder Settings > API

const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Export voor gebruik in andere bestanden
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SUPABASE_URL, SUPABASE_ANON_KEY };
}
