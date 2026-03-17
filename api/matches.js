const https = require('https');
const url = require('url');

const ROUTING = {
  euw1: 'europe', eun1: 'europe', tr1: 'europe', ru: 'europe',
  na1: 'americas', br1: 'americas', la1: 'americas', la2: 'americas',
  kr: 'asia', jp1: 'asia', oc1: 'sea'
};

function riotGet(apiUrl) {
  return new Promise(function(resolve, reject) {
    const apiKey = process.env.RIOT_API_KEY;
    if (!apiKey) return reject(new Error('RIOT_API_KEY non configurée'));
    const parsed = url.parse(apiUrl);
    const options = {
      hostname: parsed.hostname,
      path: parsed.path,
      method: 'GET',
      headers: { 'X-Riot-Token': apiKey, 'Accept': 'application/json' }
    };
    const req = https.request(options, function(res) {
      let data = '';
      res.on('data', function(c) { data += c; });
      res.on('end', function() { resolve({ status: res.statusCode, body: data }); });
    });
    req.on('error', reject);
    req.setTimeout(12000, function() { req.destroy(new Error('Timeout')); });
    req.end();
  });
}

// In-memory cache: puuid → { players, ts }
const cache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 min

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { puuid, region } = req.query;
  if (!puuid || !region) {
    return res.status(400).json({ error: 'puuid and region required' });
  }

  const cacheKey = puuid + ':' + region;
  const now = Date.now();
  if (cache[cacheKey] && now - cache[cacheKey].ts < CACHE_TTL) {
    return res.status(200).json(cache[cacheKey].data);
  }

  const routing = ROUTING[region] || 'europe';

  try {
    // Step 1: fetch last 20 match IDs (all queues)
    const matchListUrl = `https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=20`;
    const matchListResp = await riotGet(matchListUrl);
    if (matchListResp.status !== 200) {
      return res.status(matchListResp.status).json(JSON.parse(matchListResp.body));
    }
    const matchIds = JSON.parse(matchListResp.body);

    // Step 2: fetch all matches in parallel (capped at 20)
    const matchDetails = await Promise.all(
      matchIds.map(function(id) {
        const matchUrl = `https://${routing}.api.riotgames.com/lol/match/v5/matches/${id}`;
        return riotGet(matchUrl).catch(function() { return null; });
      })
    );

    // Step 3: extract co-players, exclude self, count appearances
    const playerMap = {}; // gameName#tag → { gameName, tagLine, count }
    matchDetails.forEach(function(resp) {
      if (!resp || resp.status !== 200) return;
      try {
        const match = JSON.parse(resp.body);
        const participants = match.info && match.info.participants;
        if (!participants) return;
        participants.forEach(function(p) {
          if (p.puuid === puuid) return; // skip self
          if (!p.riotIdGameName || !p.riotIdTagline) return;
          const key = p.riotIdGameName + '#' + p.riotIdTagline;
          if (!playerMap[key]) {
            playerMap[key] = { gameName: p.riotIdGameName, tagLine: p.riotIdTagline, count: 0 };
          }
          playerMap[key].count++;
        });
      } catch(e) {}
    });

    // Step 4: sort by frequency, keep top 15
    const players = Object.values(playerMap)
      .sort(function(a, b) { return b.count - a.count; })
      .slice(0, 15);

    const data = { players };
    cache[cacheKey] = { data, ts: now };
    return res.status(200).json(data);

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
