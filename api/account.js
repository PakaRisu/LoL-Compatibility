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
  const { gameName, tagLine, region } = req.query;
  if (!gameName || !tagLine || !region) {
    res.status(400).json({ error: 'Paramètres manquants : gameName, tagLine, region' });
    return;
  }
  const routing = ROUTING[region] || 'europe';
  const apiUrl = 'https://' + routing + '.api.riotgames.com/riot/account/v1/accounts/by-riot-id/' +
    encodeURIComponent(gameName) + '/' + encodeURIComponent(tagLine);

  riotGet(apiUrl).then(function(r) {
    res.status(r.status).json(JSON.parse(r.body));
  }).catch(function(e) {
    res.status(500).json({ error: e.message });
  });
};
