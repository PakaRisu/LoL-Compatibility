const https = require('https');

const DDRAGON_URL = 'https://ddragon.leagueoflegends.com/cdn/16.4.1/data/fr_FR/champion.json';

// Simple in-memory cache (dure le temps de vie de la fonction chaude)
let cache = null;
let cacheTime = 0;
const CACHE_TTL = 3600 * 1000; // 1h

module.exports = function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  const now = Date.now();
  if (cache && (now - cacheTime) < CACHE_TTL) {
    res.status(200).json(cache);
    return;
  }

  https.get(DDRAGON_URL, function(r) {
    let data = '';
    r.on('data', function(c) { data += c; });
    r.on('end', function() {
      try {
        cache = JSON.parse(data);
        cacheTime = now;
        res.status(200).json(cache);
      } catch(e) {
        res.status(500).json({ error: 'Erreur parsing DDragon : ' + e.message });
      }
    });
  }).on('error', function(e) {
    res.status(500).json({ error: e.message });
  });
};
