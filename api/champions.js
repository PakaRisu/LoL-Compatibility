const https = require('https');

const VERSIONS_URL = 'https://ddragon.leagueoflegends.com/api/versions.json';

// In-memory cache
let cache = null;
let cacheTime = 0;
const CACHE_TTL = 3600 * 1000; // 1h

function fetchUrl(url) {
  return new Promise(function(resolve, reject) {
    https.get(url, function(r) {
      let data = '';
      r.on('data', function(c) { data += c; });
      r.on('end', function() {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(new Error('JSON parse error: ' + e.message)); }
      });
    }).on('error', reject);
  });
}

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  const now = Date.now();
  if (cache && (now - cacheTime) < CACHE_TTL) {
    return res.status(200).json(cache);
  }

  try {
    // Step 1: get latest DDragon version
    const versions = await fetchUrl(VERSIONS_URL);
    const version = versions[0];

    // Step 2: fetch champion data with that version
    const champUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/data/fr_FR/champion.json`;
    const champData = await fetchUrl(champUrl);

    // Step 3: inject version + count so the frontend can use them
    champData.version = version;
    champData.champCount = Object.keys(champData.data).length;

    cache = champData;
    cacheTime = now;
    return res.status(200).json(cache);
  } catch(e) {
    return res.status(500).json({ error: 'DDragon fetch error: ' + e.message });
  }
};
