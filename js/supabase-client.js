// Shared Supabase client. Loaded in <head> on every page, right after the
// supabase-js UMD bundle from jsDelivr (which defines window.supabase), so
// any later script can use window.supabaseClient.
//
// The publishable key is designed to ship in browser code — what it can
// read or write is governed entirely by the Row Level Security policies on
// the Supabase side, not by keeping this key secret.
//
// Connection only for now: no existing feature reads or writes through
// this yet; everything still lives in localStorage.
(function () {
  var SUPABASE_URL = "https://dfyruuicpcqkmqvhosig.supabase.co";
  var SUPABASE_PUBLISHABLE_KEY = "sb_publishable_gAkiUb7OJKaUggzLG9j_yw_DGV4TM3-";

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("[supabase] supabase-js didn't load (CDN blocked or offline) — window.supabaseClient is unavailable.");
    window.supabaseClient = null;
    return;
  }

  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
})();
