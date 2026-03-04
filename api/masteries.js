const https = require('https');
const url = require('url');

function riotGet(apiUrl) {
  return new Promise(function(resolve, reject) {
    const apiKey = process.env.RIOT_API_KEY;
    if (!apiKey) return reject(new Error('RIOT_API_KEY non configurée sur le serveur.'));
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
    req.setTimeout(10000, function() { req.destroy(new Error('Timeout')); });
    req.end();
  });
}

module.exports = function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { puuid, region } = req.query;
  if (!puuid || !region) {
    res.status(400).json({ error: 'Paramètres manquants : puuid, region' });
    return;
  }
  const apiUrl = 'https://' + region + '.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/' + puuid;

  riotGet(apiUrl).then(function(r) {
    res.status(r.status).json(JSON.parse(r.body));
  }).catch(function(e) {
    res.status(500).json({ error: e.message });
  });
};
