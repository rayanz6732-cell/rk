import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// Test using the aniwatch npm package which scrapes hianime.to
// This is the same package used by the aniwatch-api project
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

Deno.serve(async (req) => {
  const cors = { "Access-Control-Allow-Origin": "*" };
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401, headers: cors });

    const body = await req.json();
    const step = body.step || "search";

    // Step 1: Search hianime.to directly for a title to get hianime ID
    if (step === "search") {
      const query = body.query || "one piece";
      const r = await fetch(`https://hianimez.to/search?keyword=${encodeURIComponent(query)}`, {
        headers: {
          "User-Agent": UA,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        }
      });
      const html = await r.text();
      // Extract anime IDs from search results - format is /watch/slug-XXXX
      const matches = [...html.matchAll(/href="\/([a-z0-9-]+-\d+)"/g)];
      const ids = [...new Set(matches.map(m => m[1]))].slice(0, 5);
      return Response.json({ status: r.status, ids, html_len: html.length }, { headers: cors });
    }

    // Step 2: Get episodes list for a hianime ID
    if (step === "episodes") {
      const animeId = body.anime_id || "one-piece-100"; // hianime format
      const r = await fetch(`https://hianimez.to/ajax/v2/episode/list/${animeId.split('-').pop()}`, {
        headers: {
          "User-Agent": UA,
          "Referer": `https://hianimez.to/${animeId}`,
          "X-Requested-With": "XMLHttpRequest",
        }
      });
      const data = await r.json();
      const html = data?.html || "";
      const epMatches = [...html.matchAll(/data-id="(\d+)"[^>]*data-number="(\d+)"/g)];
      const episodes = epMatches.slice(0, 5).map(m => ({ id: m[1], number: m[2] }));
      return Response.json({ status: r.status, episodes, total: epMatches.length }, { headers: cors });
    }

    // Step 3: Get streaming sources for a hianime episode ID
    if (step === "sources") {
      const episodeId = body.episode_id; // numeric hianime episode id
      const server = body.server || "hd-1";
      const category = body.category || "sub"; // sub or dub

      // First get the servers
      const serversR = await fetch(`https://hianimez.to/ajax/v2/episode/servers?episodeId=${episodeId}`, {
        headers: {
          "User-Agent": UA,
          "Referer": "https://hianimez.to/",
          "X-Requested-With": "XMLHttpRequest",
        }
      });
      const serversData = await serversR.json();
      const serversHtml = serversData?.html || "";
      // Extract server data-id values for sub category
      const serverMatches = [...serversHtml.matchAll(/class="server-item[^"]*"[^>]*data-id="(\d+)"[^>]*data-type="(sub|dub)"[^>]*data-server-id="(\d+)"/g)];
      const serverList = serverMatches.map(m => ({ item_id: m[1], type: m[2], server_id: m[3] }));

      // Pick first sub server
      const chosenServer = serverList.find(s => s.type === category) || serverList[0];
      if (!chosenServer) {
        return Response.json({ error: "No servers", serverList, serversHtml: serversHtml.slice(0, 500) }, { headers: cors });
      }

      // Get source URL
      const sourceR = await fetch(`https://hianimez.to/ajax/v2/episode/sources?id=${chosenServer.item_id}`, {
        headers: {
          "User-Agent": UA,
          "Referer": "https://hianimez.to/",
          "X-Requested-With": "XMLHttpRequest",
        }
      });
      const sourceData = await sourceR.json();
      return Response.json({ source_status: sourceR.status, sourceData, chosenServer }, { headers: cors });
    }

    return Response.json({ error: "Unknown step. Use: search, episodes, sources" }, { headers: cors });
  } catch (err) {
    return Response.json({ error: err.message, stack: err.stack?.slice(0, 300) }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
});