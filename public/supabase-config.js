// Supabase configuratie (productie)
// Vul je eigen credentials in voor GitHub Pages/hosting.
// Je vindt deze in je Supabase dashboard onder Settings > API

const SUPABASE_URL = 'https://jfjrzzzwqxilbscnakww.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_-P67L_S1MMn_h00Ta7LIRg_4bDa62eO';

// Export voor gebruik in andere bestanden
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SUPABASE_URL, SUPABASE_ANON_KEY };
}
