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

    // Fetch watch page
    const watchR = await fetch(`${ANIMEKAI_BASE}/watch/${slug}`, {
      headers: {
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
    });
    const html = await watchR.text();
    const setCookie = watchR.headers.get("set-cookie") || "";

    // Find ALL data-id with context
    const dataIdContexts = [];
    const regex = /data-id="([^"]+)"/g;
    let m;
    while ((m = regex.exec(html)) !== null) {
      const ctx = html.slice(Math.max(0, m.index - 80), m.index + 120);
      dataIdContexts.push({ id: m[1], ctx: ctx.replace(/\s+/g, ' ').slice(0, 200) });
    }

    // Find token/key in script tags
    const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(s => s[1]);
    const tokenPatterns = [];
    for (const s of scripts) {
      const t1 = s.match(/token['":\s]+['"]([^'"]{20,})['"]/gi);
      const t2 = s.match(/key['":\s]+['"]([^'"]{10,})['"]/gi);
      const t3 = s.match(/ani_id['":\s]+['"]([^'"]+)['"]/gi);
      const t4 = s.match(/watch[_-]?id['":\s]+['"]([^'"]+)['"]/gi);
      if (t1) tokenPatterns.push(...t1.slice(0,3));
      if (t2) tokenPatterns.push(...t2.slice(0,3));
      if (t3) tokenPatterns.push(...t3.slice(0,3));
      if (t4) tokenPatterns.push(...t4.slice(0,3));
    }

    // Find watch section
    const watchSection = html.match(/<[^>]+(?:watch|player|episode)[^>]*>/gi) || [];

    // Extract the token from meta tag or specific patterns used by AnimeKai
    const metaTokens = [...html.matchAll(/content="([a-zA-Z0-9+/=_\-]{32,})"/g)].map(m=>m[1]).slice(0,5);
    
    // Look for the specific AJAX call pattern in scripts
    const ajaxPatterns = [];
    for (const s of scripts) {
      if (s.includes('ajax') || s.includes('episode') || s.includes('ani_id')) {
        ajaxPatterns.push(s.slice(0, 500));
      }
    }

    return Response.json({
      watch_status: watchR.status,
      set_cookie: setCookie.slice(0, 300),
      data_id_contexts: dataIdContexts.slice(0, 15),
      token_patterns: tokenPatterns.slice(0, 10),
      watch_section_tags: watchSection.slice(0, 10),
      meta_tokens: metaTokens,
      ajax_patterns: ajaxPatterns.slice(0, 3).map(s => s.slice(0, 300)),
      html_length: html.length,
    }, { headers: cors });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
});