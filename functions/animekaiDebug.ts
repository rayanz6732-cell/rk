import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const ANIMEKAI_BASE = "https://animekai.to";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

Deno.serve(async (req) => {
  const cors = { "Access-Control-Allow-Origin": "*" };
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: cors });

    const body = await req.json();
    const slug = body.slug || "one-piece-dk6r";

    const watchR = await fetch(`${ANIMEKAI_BASE}/watch/${slug}`, {
      headers: {
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    const html = await watchR.text();

    // Find inline scripts that contain the ajax setup / episode loading
    const scriptContents = [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)]
      .map(m => m[1].trim())
      .filter(s => s.length > 50);

    // Look for window. variables, episode/ani/token patterns
    const relevantScripts = scriptContents.filter(s =>
      s.match(/ani_id|ep_id|token|episode|ajax|watch/i)
    );

    // Find div with episodes list
    const epListDiv = html.match(/<div[^>]*id="ep-list"[^>]*>([\s\S]{0,2000})/i);
    const epSection = html.match(/<section[^>]*id="[^"]*episode[^"]*"[^>]*>([\s\S]{0,2000})/i);

    // Find the watch-section container
    const watchContainer = html.match(/class="[^"]*watch-container[^"]*"[^>]*data-id="([^"]+)"/i)
      || html.match(/id="watch"[^>]*data-id="([^"]+)"/i)
      || html.match(/<div[^>]*data-id="([a-zA-Z0-9]{4,10})"[^>]*class="[^"]*watch/i);

    // Search for the episode token in HTML - look for data-token or token= 
    const tokenPatterns = [...html.matchAll(/data-token="([^"]+)"/g)].map(m => ({ token: m[1], ctx: html.slice(Math.max(0, m.index-100), m.index+100) }));
    
    // Search for any "key" used in AJAX
    const keyPatterns = [...html.matchAll(/\bkey['"]\s*:\s*['"]([^'"]+)['"]/g)].map(m=>m[1]);
    const tokenInScript = [...html.matchAll(/\btoken['"]\s*[=:]\s*['"]([^'"]+)['"]/g)].map(m=>m[1]);

    // HTML region around episodes section 
    const epIdx = html.indexOf('ep-list');
    const epListContext = epIdx >= 0 ? html.slice(Math.max(0, epIdx-200), epIdx+1000) : "not found";

    return Response.json({
      relevant_scripts: relevantScripts.map(s => s.slice(0, 600)),
      watch_container: watchContainer ? watchContainer[1] : null,
      token_patterns: tokenPatterns.slice(0, 10),
      key_patterns: keyPatterns.slice(0, 10),
      token_in_script: tokenInScript.slice(0, 10),
      ep_list_div: epListDiv ? epListDiv[0].slice(0, 500) : null,
      ep_list_context: epListContext.slice(0, 800),
    }, { headers: cors });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
});