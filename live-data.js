(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const state = {
    spot: null,
    hyper: { status: "Connecting", coin: null, bids: [], asks: [], cvd: 0, trades: 0, lastUpdate: 0, socket: null },
    lighter: { status: "Discovering", market: null, bids: [], asks: [], cvd: 0, trades: 0, lastUpdate: 0, seen: new Set() }
  };

  const fmt = (n, digits = 2) => Number.isFinite(Number(n))
    ? Number(n).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })
    : "—";
  const shortTime = (ts) => ts ? new Date(ts).toLocaleTimeString("en-IN", { hour12: false, timeZone: "Asia/Kolkata" }) + " IST" : "Waiting";
  const safe = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]);

  function mount() {
    const host = $("market-grid");
    if (!host) return;
    const section = document.createElement("section");
    section.id = "live-intelligence";
    section.innerHTML =
      '<div class="live-section-head"><div><div class="eyebrow">LIVE DATA / PHASE 1</div><h2>Connected market feeds</h2><p>Independent sources. No simulated values in this panel.</p></div><span class="live-mode-pill">PUBLIC DATA · READ ONLY</span></div>' +
      '<div class="live-source-grid">' +
        '<article class="live-source-card"><div class="live-source-top"><span class="live-source-dot amber" id="spot-dot"></span><span>SPOT GOLD REFERENCE</span></div><div class="live-source-name">XAU · USD</div><strong class="live-source-price" id="spot-price">—</strong><div class="live-source-meta" id="spot-meta">Connecting to Gold API…</div><div class="live-source-foot">Indicative spot reference · not broker bid/ask</div></article>' +
        '<article class="live-source-card"><div class="live-source-top"><span class="live-source-dot amber" id="hyper-dot"></span><span>HYPERLIQUID PERPETUAL</span></div><div class="live-source-name" id="hyper-symbol">Gold contract discovery</div><strong class="live-source-price" id="hyper-price">—</strong><div class="live-source-meta" id="hyper-meta">Discovering available markets…</div><div class="live-source-foot">Exchange-specific order book · not spot gold</div></article>' +
        '<article class="live-source-card"><div class="live-source-top"><span class="live-source-dot amber" id="lighter-dot"></span><span>LIGHTER PERPETUAL</span></div><div class="live-source-name" id="lighter-symbol">Gold contract discovery</div><strong class="live-source-price" id="lighter-price">—</strong><div class="live-source-meta" id="lighter-meta">Discovering available markets…</div><div class="live-source-foot">Public REST snapshot · market availability varies</div></article>' +
      '</div>' +
      '<div class="live-data-grid">' +
        '<article class="live-panel"><div class="live-panel-head"><div><span class="live-kicker">HYPERLIQUID</span><h3>Level 2 order book</h3></div><span class="live-feed-state" id="hyper-book-state">WAITING</span></div><div class="live-book-columns"><div><div class="live-book-label sell">ASKS · SELL LIQUIDITY</div><div id="hyper-asks" class="live-book-list"><div class="live-empty">Waiting for a matching gold market</div></div></div><div><div class="live-book-label buy">BIDS · BUY LIQUIDITY</div><div id="hyper-bids" class="live-book-list"><div class="live-empty">Waiting for a matching gold market</div></div></div></div><div class="live-metrics"><div><span>BOOK IMBALANCE</span><strong id="hyper-obi">—</strong></div><div><span>BEST SPREAD</span><strong id="hyper-spread">—</strong></div><div><span>BOOK UPDATED</span><strong id="hyper-time">—</strong></div></div></article>' +
        '<article class="live-panel"><div class="live-panel-head"><div><span class="live-kicker">ORDER FLOW</span><h3>Trade aggression & CVD</h3></div><span class="live-feed-state" id="flow-state">WAITING</span></div><div class="live-cvd-value" id="hyper-cvd">—</div><div class="live-cvd-caption">Cumulative trade delta since this browser connected</div><div class="live-cvd-track"><span id="cvd-track"></span></div><div class="live-metrics"><div><span>TRADES SEEN</span><strong id="hyper-trades">0</strong></div><div><span>BUY / SELL DELTA</span><strong id="hyper-delta">—</strong></div><div><span>LAST TRADE</span><strong id="hyper-trade-time">—</strong></div></div><p class="live-disclaimer">Trade-side classification follows the exchange feed. CVD starts at zero on connection and is not a complete session history.</p></article>' +
      '</div>' +
      '<article class="live-panel lighter-panel"><div class="live-panel-head"><div><span class="live-kicker">LIGHTER · SECOND VENUE</span><h3>Gold market depth & trade flow</h3></div><span class="live-feed-state" id="lighter-book-state">DISCOVERING</span></div><div class="lighter-summary"><div><span>BEST BID</span><strong id="lighter-best-bid">—</strong></div><div><span>BEST ASK</span><strong id="lighter-best-ask">—</strong></div><div><span>IMBALANCE</span><strong id="lighter-obi">—</strong></div><div><span>CVD SINCE CONNECT</span><strong id="lighter-cvd">—</strong></div></div><p class="live-disclaimer" id="lighter-note">The scanner searches active perpetual markets only. Tokenized-gold spot markets are not treated as XAUUSD or gold futures.</p></article>' +
      '<div class="live-footnote"><span>DATA INTEGRITY</span> If a provider has no matching gold perpetual, its panel remains unavailable. We do not substitute BTC, XAUT or sample values.</div>';
    host.parentNode.insertBefore(section, host);
  }

  function setDot(id, status) {
    const el = $(id);
    if (!el) return;
    el.className = "live-source-dot " + (status === "Connected" ? "green" : status === "Error" || status === "Unavailable" ? "red" : "amber");
  }

  async function refreshSpot() {
    try {
      const response = await fetch("https://api.gold-api.com/price/XAU", { cache: "no-store" });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const data = await response.json();
      const price = Number(data.price);
      const updated = Date.parse(data.updatedAt);
      if (!Number.isFinite(price) || !Number.isFinite(updated)) throw new Error("Invalid price payload");
      state.spot = { price, updated };
      $("spot-price").textContent = "$" + fmt(price, 2);
      $("spot-meta").textContent = "Updated " + shortTime(updated);
      setDot("spot-dot", Date.now() - updated < 120000 ? "Connected" : "Stale");
    } catch (error) {
      $("spot-meta").textContent = "Unavailable: " + error.message;
      setDot("spot-dot", "Error");
    }
  }

  async function postHyper(payload) {
    const response = await fetch("https://api.hyperliquid.xyz/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("Hyperliquid HTTP " + response.status);
    return response.json();
  }

  async function discoverHyperGold() {
    const candidates = [];
    try {
      const main = await postHyper({ type: "metaAndAssetCtxs" });
      if (main && main[0] && Array.isArray(main[0].universe)) {
        main[0].universe.forEach((asset) => {
          if (/gold|xau/i.test(asset.name || "")) candidates.push({ coin: asset.name, dex: null });
        });
      }
    } catch (_) {}
    try {
      const dexs = await postHyper({ type: "perpDexs" });
      if (Array.isArray(dexs)) {
        for (const dex of dexs) {
          if (!dex || !dex.name) continue;
          try {
            const meta = await postHyper({ type: "metaAndAssetCtxs", dex: dex.name });
            if (meta && meta[0] && Array.isArray(meta[0].universe)) {
              meta[0].universe.forEach((asset) => {
                if (/gold|xau/i.test(asset.name || "")) candidates.push({ coin: asset.name, dex: dex.name });
              });
            }
          } catch (_) {}
        }
      }
    } catch (_) {}
    const unique = candidates.filter((item, index, list) => list.findIndex((x) => x.coin === item.coin) === index);
    if (!unique.length) {
      state.hyper.status = "Unavailable";
      $("hyper-meta").textContent = "No active GOLD/XAU perpetual found in accessible Hyperliquid DEX metadata.";
      $("hyper-symbol").textContent = "No matching contract";
      $("hyper-book-state").textContent = "UNAVAILABLE";
      setDot("hyper-dot", "Unavailable");
      return;
    }
    state.hyper.coin = unique[0].coin;
    $("hyper-symbol").textContent = unique[0].coin + (unique[0].dex ? " · " + unique[0].dex : " · Main DEX");
    connectHyper();
  }

  function connectHyper() {
    if (!state.hyper.coin) return;
    state.hyper.status = "Connecting";
    const socket = new WebSocket("wss://api.hyperliquid.xyz/ws");
    state.hyper.socket = socket;
    socket.onopen = () => {
      socket.send(JSON.stringify({ method: "subscribe", subscription: { type: "l2Book", coin: state.hyper.coin } }));
      socket.send(JSON.stringify({ method: "subscribe", subscription: { type: "trades", coin: state.hyper.coin } }));
      $("hyper-meta").textContent = "WebSocket connected · awaiting first book";
      $("hyper-book-state").textContent = "CONNECTED";
      setDot("hyper-dot", "Connecting");
    };
    socket.onmessage = (event) => {
      let message;
      try { message = JSON.parse(event.data); } catch (_) { return; }
      if (message.channel === "l2Book" && message.data && Array.isArray(message.data.levels)) {
        const levels = message.data.levels;
        state.hyper.bids = (levels[0] || []).map((x) => ({ price: Number(x.px), size: Number(x.sz), count: Number(x.n || 0) })).filter((x) => x.price > 0 && x.size > 0);
        state.hyper.asks = (levels[1] || []).map((x) => ({ price: Number(x.px), size: Number(x.sz), count: Number(x.n || 0) })).filter((x) => x.price > 0 && x.size > 0);
        state.hyper.lastUpdate = Number(message.data.time || Date.now());
        state.hyper.status = "Connected";
        renderHyperBook();
      }
      if (message.channel === "trades" && Array.isArray(message.data)) {
        message.data.forEach((trade) => {
          const qty = Number(trade.sz);
          if (!Number.isFinite(qty) || qty <= 0) return;
          state.hyper.cvd += trade.side === "B" ? qty : trade.side === "A" ? -qty : 0;
          state.hyper.trades += 1;
          state.hyper.lastTradeTime = Number(trade.time || Date.now());
          state.hyper.lastTradeDelta = trade.side === "B" ? qty : -qty;
        });
        renderHyperFlow();
      }
    };
    socket.onerror = () => {
      $("hyper-meta").textContent = "WebSocket error; reconnecting";
      setDot("hyper-dot", "Error");
    };
    socket.onclose = () => {
      state.hyper.status = "Reconnecting";
      $("hyper-book-state").textContent = "RECONNECTING";
      setDot("hyper-dot", "Stale");
      setTimeout(() => {
        if (state.hyper.coin) connectHyper();
      }, 3000);
    };
  }

  function renderBookRows(id, levels, side) {
    const target = $(id);
    if (!target) return;
    if (!levels.length) {
      target.innerHTML = '<div class="live-empty">No depth received</div>';
      return;
    }
    const max = Math.max(...levels.slice(0, 6).map((x) => x.size), 0.0000001);
    target.innerHTML = levels.slice(0, 6).map((level) =>
      '<div class="live-book-row ' + side + '"><span>' + fmt(level.price, 2) + '</span><span>' + fmt(level.size, 3) + '</span><i style="width:' + Math.max(4, level.size / max * 100) + '%"></i></div>'
    ).join("");
  }

  function imbalance(bids, asks) {
    const bid = bids.slice(0, 10).reduce((sum, x) => sum + x.size, 0);
    const ask = asks.slice(0, 10).reduce((sum, x) => sum + x.size, 0);
    return { bid, ask, value: bid + ask ? (bid - ask) / (bid + ask) : null };
  }

  function renderHyperBook() {
    const h = state.hyper;
    renderBookRows("hyper-bids", h.bids, "buy");
    renderBookRows("hyper-asks", h.asks, "sell");
    const metrics = imbalance(h.bids, h.asks);
    const spread = h.bids.length && h.asks.length ? h.asks[0].price - h.bids[0].price : null;
    const mid = h.bids.length && h.asks.length ? (h.asks[0].price + h.bids[0].price) / 2 : null;
    $("hyper-price").textContent = mid === null ? "—" : "$" + fmt(mid, 2);
    $("hyper-meta").textContent = h.status + " · Book " + shortTime(h.lastUpdate);
    $("hyper-obi").textContent = metrics.value === null ? "—" : (metrics.value > 0 ? "+" : "") + (metrics.value * 100).toFixed(1) + "%";
    $("hyper-spread").textContent = spread === null ? "—" : fmt(spread, 3);
    $("hyper-time").textContent = shortTime(h.lastUpdate);
    $("hyper-book-state").textContent = "LIVE L2";
    setDot("hyper-dot", "Connected");
  }

  function renderHyperFlow() {
    const h = state.hyper;
    $("hyper-cvd").textContent = (h.cvd > 0 ? "+" : "") + fmt(h.cvd, 4);
    $("hyper-trades").textContent = String(h.trades);
    $("hyper-delta").textContent = h.lastTradeDelta === undefined ? "—" : (h.lastTradeDelta > 0 ? "+" : "") + fmt(h.lastTradeDelta, 4);
    $("hyper-trade-time").textContent = shortTime(h.lastTradeTime);
    $("flow-state").textContent = "LIVE TRADES";
    const width = Math.min(100, Math.abs(h.cvd) / (Math.abs(h.cvd) + 1) * 100);
    $("cvd-track").style.width = width + "%";
    $("cvd-track").className = h.cvd >= 0 ? "positive" : "negative";
  }

  async function lighterGet(path) {
    const response = await fetch("https://mainnet.zklighter.elliot.ai/api/v1/" + path + (path.includes("?") ? "&" : "?") + "_ts=" + Date.now(), { cache: "no-store" });
    if (!response.ok) throw new Error("Lighter HTTP " + response.status);
    const data = await response.json();
    if (data.code && data.code !== 200) throw new Error(data.message || "Lighter API error");
    return data;
  }

  function findArray(data, keys) {
    for (const key of keys) if (Array.isArray(data[key])) return data[key];
    return [];
  }

  async function discoverLighter() {
    try {
      const data = await lighterGet("orderBooks");
      const markets = findArray(data, ["order_books", "orderBooks", "markets", "data"]);
      const market = markets.find((item) =>
        item && item.status === "active" &&
        String(item.market_type || "").toLowerCase() === "perp" &&
        /gold|xau/i.test(String(item.symbol || ""))
      );
      if (!market) {
        state.lighter.status = "Unavailable";
        $("lighter-symbol").textContent = "No matching gold perpetual";
        $("lighter-meta").textContent = "No active GOLD/XAU perpetual found. Tokenized-gold spot is deliberately excluded.";
        $("lighter-book-state").textContent = "UNAVAILABLE";
        $("lighter-note").textContent = "No matching active gold perpetual was returned by Lighter market discovery. We will not substitute XAUT/USDC or another instrument.";
        setDot("lighter-dot", "Unavailable");
        return;
      }
      state.lighter.market = market;
      $("lighter-symbol").textContent = market.symbol + " · market " + market.market_id;
      $("lighter-meta").textContent = "Market discovered · public REST snapshots";
      state.lighter.status = "Connected";
      pollLighter();
      setInterval(pollLighter, 5000);
    } catch (error) {
      state.lighter.status = "Error";
      $("lighter-meta").textContent = "Discovery failed: " + error.message;
      $("lighter-book-state").textContent = "ERROR";
      setDot("lighter-dot", "Error");
    }
  }

  function aggregateOrders(orders) {
    const map = new Map();
    (orders || []).forEach((order) => {
      const price = Number(order.price);
      const size = Number(order.remaining_base_amount || order.initial_base_amount);
      if (!(price > 0) || !(size > 0)) return;
      const key = price.toFixed(8);
      map.set(key, (map.get(key) || 0) + size);
    });
    return Array.from(map, ([price, size]) => ({ price: Number(price), size }))
      .sort((a, b) => b.price - a.price);
  }

  async function pollLighter() {
    const market = state.lighter.market;
    if (!market || state.lighter.polling) return;
    state.lighter.polling = true;
    try {
      const [book, trades] = await Promise.all([
        lighterGet("orderBookOrders?market_id=" + market.market_id + "&limit=100"),
        lighterGet("recentTrades?market_id=" + market.market_id + "&limit=100")
      ]);
      state.lighter.bids = aggregateOrders(book.bids || []);
      state.lighter.asks = aggregateOrders(book.asks || []).sort((a, b) => a.price - b.price);
      const list = findArray(trades, ["trades", "recent_trades", "data"]);
      list.slice().reverse().forEach((trade) => {
        const id = String(trade.trade_id_str || trade.trade_id || "");
        if (!id || state.lighter.seen.has(id)) return;
        state.lighter.seen.add(id);
        const qty = Number(trade.size);
        if (Number.isFinite(qty) && qty > 0) {
          state.lighter.cvd += trade.is_maker_ask ? qty : -qty;
          state.lighter.trades += 1;
        }
      });
      if (state.lighter.seen.size > 2000) state.lighter.seen = new Set(Array.from(state.lighter.seen).slice(-1000));
      state.lighter.lastUpdate = Date.now();
      state.lighter.status = "Connected";
      renderLighter();
    } catch (error) {
      state.lighter.status = "Error";
      $("lighter-meta").textContent = "Snapshot error: " + error.message;
      $("lighter-book-state").textContent = "STALE / ERROR";
      setDot("lighter-dot", "Error");
    } finally {
      state.lighter.polling = false;
    }
  }

  function renderLighter() {
    const l = state.lighter;
    const metrics = imbalance(l.bids, l.asks);
    const bid = l.bids.length ? l.bids[0].price : null;
    const ask = l.asks.length ? l.asks[0].price : null;
    const mid = bid && ask ? (bid + ask) / 2 : null;
    $("lighter-price").textContent = mid === null ? "—" : "$" + fmt(mid, 2);
    $("lighter-best-bid").textContent = bid === null ? "—" : fmt(bid, 2);
    $("lighter-best-ask").textContent = ask === null ? "—" : fmt(ask, 2);
    $("lighter-obi").textContent = metrics.value === null ? "—" : (metrics.value > 0 ? "+" : "") + (metrics.value * 100).toFixed(1) + "%";
    $("lighter-cvd").textContent = (l.cvd > 0 ? "+" : "") + fmt(l.cvd, 4);
    $("lighter-meta").textContent = "REST snapshot · " + shortTime(l.lastUpdate);
    $("lighter-book-state").textContent = "SNAPSHOT OK";
    setDot("lighter-dot", "Connected");
  }

  function updateClock() {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
    const hour = Number(parts.find((x) => x.type === "hour").value);
    const minute = Number(parts.find((x) => x.type === "minute").value);
    const total = hour * 60 + minute;
    const status = total >= 570 && total < 900 ? "Monitoring window open" : total < 570 ? "Profile build / pre-monitoring" : "Observation only · no new entries";
    const box = document.querySelector(".session-box strong");
    if (box) box.innerHTML = '<span class="status-dot ' + (total >= 570 && total < 900 ? "" : "amber") + '"></span> ' + status;
  }

  mount();
  refreshSpot();
  setInterval(refreshSpot, 15000);
  discoverHyperGold();
  discoverLighter();
  updateClock();
  setInterval(updateClock, 30000);
})();