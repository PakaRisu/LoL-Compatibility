const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

// ── Helper : requête HTTPS vers l'API Riot ──────────────────────────
function riotRequest(apiUrl, apiKey) {
  return new Promise(function(resolve, reject) {
    const parsed = url.parse(apiUrl);
    const options = {
      hostname: parsed.hostname,
      path: parsed.path,
      method: 'GET',
      headers: {
        'X-Riot-Token': apiKey,
        'Accept': 'application/json'
      }
    };
    const req = https.request(options, function(res) {
      let data = '';
      res.on('data', function(chunk) { data += chunk; });
      res.on('end', function() {
        resolve({ status: res.statusCode, body: data });
      });
    });
    req.on('error', function(e) { reject(e); });
    req.setTimeout(10000, function() { req.destroy(new Error('Timeout')); });
    req.end();
  });
}

// ── Helper : requête HTTPS vers DDragon ────────────────────────────
function ddragonRequest(dUrl) {
  return new Promise(function(resolve, reject) {
    https.get(dUrl, function(res) {
      let data = '';
      res.on('data', function(chunk) { data += chunk; });
      res.on('end', function() { resolve({ status: res.statusCode, body: data }); });
    }).on('error', reject);
  });
}

// ── Routeur ────────────────────────────────────────────────────────
const server = http.createServer(function(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS headers (pour le dev local)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ── Servir le fichier HTML ──
  if (pathname === '/' || pathname === '/index.html') {
    fs.readFile(path.join(__dirname, 'index.html'), function(err, data) {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  // ── /api/account?gameName=X&tagLine=Y&region=euw1&apiKey=RGAPI-... ──
  if (pathname === '/api/account') {
    const { gameName, tagLine, region, apiKey } = parsedUrl.query;
    if (!gameName || !tagLine || !region || !apiKey) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Paramètres manquants' }));
      return;
    }
    const ROUTING = {
      euw1:'europe', eun1:'europe', tr1:'europe', ru:'europe',
      na1:'americas', br1:'americas', la1:'americas', la2:'americas',
      kr:'asia', jp1:'asia', oc1:'sea'
    };
    const routing = ROUTING[region] || 'europe';
    const apiUrl = 'https://' + routing + '.api.riotgames.com/riot/account/v1/accounts/by-riot-id/' +
      encodeURIComponent(gameName) + '/' + encodeURIComponent(tagLine);

    riotRequest(apiUrl, apiKey).then(function(r) {
      res.writeHead(r.status, { 'Content-Type': 'application/json' });
      res.end(r.body);
    }).catch(function(e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    });
    return;
  }

  // ── /api/masteries?puuid=X&region=euw1&apiKey=... ──
  if (pathname === '/api/masteries') {
    const { puuid, region, apiKey } = parsedUrl.query;
    if (!puuid || !region || !apiKey) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Paramètres manquants' }));
      return;
    }
    const apiUrl = 'https://' + region + '.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/' + puuid;
    riotRequest(apiUrl, apiKey).then(function(r) {
      res.writeHead(r.status, { 'Content-Type': 'application/json' });
      res.end(r.body);
    }).catch(function(e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    });
    return;
  }

  // ── /api/champions — proxy DDragon ──
  if (pathname === '/api/champions') {
    const dUrl = 'https://ddragon.leagueoflegends.com/cdn/16.4.1/data/fr_FR/champion.json';
    ddragonRequest(dUrl).then(function(r) {
      res.writeHead(r.status, { 'Content-Type': 'application/json' });
      res.end(r.body);
    }).catch(function(e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, function() {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║   Summoner Synergy — Serveur local   ║');
  console.log('  ╠══════════════════════════════════════╣');
  console.log('  ║  http://localhost:' + PORT + '               ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
  console.log('  Ctrl+C pour arrêter');
  console.log('');
});
