'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3002);
const rooms = new Map();
let quoteCache = null;
let quoteFetchedAt = 0;
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.json':'application/json; charset=utf-8', '.ico':'image/x-icon' };

function send(res, status, data) {
  res.writeHead(status, { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store', 'access-control-allow-origin':'*' });
  res.end(JSON.stringify(data));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; if (body.length > 1_000_000) req.destroy(); });
    req.on('end', () => { try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error('Invalid JSON')); } });
    req.on('error', reject);
  });
}
function roomView(room) { return { code:room.code, players:room.players, state:room.state, updatedAt:room.updatedAt, stateUpdatedAt:room.stateUpdatedAt }; }
function quoteView(quote, extra={}) {
  const age = Date.now() - Date.parse(quote.quoteTime);
  const stale = !Number.isFinite(age) || age < -5 * 60_000 || age > 24 * 60 * 60_000;
  return { ...quote, ...extra, stale, ...(stale ? { note:extra.note || 'Provider quote is more than 24 hours old; shown as stale.' } : {}) };
}
async function getQuote() {
  const now = Date.now();
  if (quoteCache && now - quoteFetchedAt < 60_000) return quoteView(quoteCache, { cached:true });
  let timeout;
  try {
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), 6500);
    const url = 'https://query1.finance.yahoo.com/v8/finance/chart/TIO%3DF?range=1d&interval=5m';
    const response = await fetch(url, { signal:controller.signal, headers:{ 'user-agent':'Mozilla/5.0 CommonwealthTradeGame/1.0' } });
    if (!response.ok) throw new Error(`Quote provider returned ${response.status}`);
    const json = await response.json();
    const result = json.chart?.result?.[0];
    const meta = result?.meta;
    const price = meta?.regularMarketPrice;
    if (!Number.isFinite(price)) throw new Error('Quote provider returned no current price');
    quoteCache = { available:true, symbol:'TIO=F', name:'Iron Ore 62% Fe, CFR China', price, currency:meta.currency || 'USD', unit:'per tonne', source:'Yahoo Finance chart (unofficial; may be delayed)', quoteTime:meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : new Date().toISOString(), fetchedAt:new Date(now).toISOString() };
    quoteFetchedAt = now;
    return quoteView(quoteCache, { cached:false });
  } catch (error) {
    if (quoteCache) return quoteView(quoteCache, { cached:true, note:'Provider refresh failed; showing last successful quote.' });
    return { available:false, symbol:'TIO=F', name:'Iron ore benchmark', source:'Yahoo Finance chart (unofficial)', fetchedAt:new Date().toISOString(), note:`Live quote unavailable: ${error.message}` };
  } finally {
    clearTimeout(timeout);
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'access-control-allow-origin':'*', 'access-control-allow-methods':'GET,POST,PUT,OPTIONS', 'access-control-allow-headers':'content-type' }); return res.end(); }
  if (url.pathname === '/api/health') return send(res, 200, { ok:true, rooms:rooms.size });
  if (url.pathname === '/api/quotes/iron-ore' && req.method === 'GET') return send(res, 200, await getQuote());
  if (url.pathname === '/api/rooms' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      let code;
      do { code = crypto.randomBytes(3).toString('hex').toUpperCase(); } while (rooms.has(code));
      const room = { code, players:[String(body.name || 'Treasurer').slice(0,24)], state:null, updatedAt:Date.now(), stateUpdatedAt:0 };
      rooms.set(code, room);
      return send(res, 201, { ...roomView(room), playerIndex:0 });
    } catch { return send(res, 400, { error:'Invalid request body' }); }
  }
  const join = url.pathname.match(/^\/api\/rooms\/([A-Z0-9]+)\/join$/i);
  if (join && req.method === 'POST') {
    const room = rooms.get(join[1].toUpperCase());
    if (!room) return send(res, 404, { error:'Room not found. Check the code or create a new room.' });
    if (room.players.length >= 2) return send(res, 409, { error:'This room already has two players.' });
    try {
      const body = await readBody(req);
      room.players.push(String(body.name || 'Guest').slice(0,24)); room.updatedAt = Date.now();
      return send(res, 200, { ...roomView(room), playerIndex:1 });
    } catch { return send(res, 400, { error:'Invalid request body' }); }
  }
  const roomPath = url.pathname.match(/^\/api\/rooms\/([A-Z0-9]+)$/i);
  if (roomPath) {
    const room = rooms.get(roomPath[1].toUpperCase());
    if (!room) return send(res, 404, { error:'Room not found. It may have expired after a server restart.' });
    if (req.method === 'GET') return send(res, 200, roomView(room));
    if (req.method === 'PUT') {
      try {
        const body = await readBody(req);
        if (!body.state || !Array.isArray(body.state.players)) return send(res, 400, { error:'A valid game state is required.' });
        room.state = body.state; room.updatedAt = Date.now(); room.stateUpdatedAt = room.updatedAt;
        return send(res, 200, { ok:true, updatedAt:room.updatedAt, stateUpdatedAt:room.stateUpdatedAt });
      } catch { return send(res, 400, { error:'Invalid request body' }); }
    }
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 404, { error:'Not found' });
  let requested = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  let file = path.resolve(ROOT, `.${requested}`);
  if (!file.startsWith(`${ROOT}${path.sep}`) && file !== path.join(ROOT, 'index.html')) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (error, content) => {
    if (error) { res.writeHead(404, { 'content-type':'text/plain; charset=utf-8' }); return res.end('Not found'); }
    res.writeHead(200, { 'content-type':MIME[path.extname(file)] || 'application/octet-stream', 'cache-control':'no-cache' });
    if (req.method === 'HEAD') return res.end();
    res.end(content);
  });
});
server.listen(PORT, '0.0.0.0', () => console.log(`COMMONWEALTH server listening on http://localhost:${PORT}`));
