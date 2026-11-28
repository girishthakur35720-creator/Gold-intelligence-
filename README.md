# Gold Intelligence

A market-intelligence dashboard for XAUUSD traders. Spot gold is the execution reference; exchange-listed gold perpetuals are separate liquidity/order-flow references and are never silently substituted for spot.

## Product principles

- **Execution market:** XAUUSD spot.
- **Spot reference:** Gold API's public XAU/USD indicative price endpoint. This is not a broker's executable bid/ask quote.
- **Exchange intelligence:** Hyperliquid and Lighter gold/XAU perpetuals are discovered from their public market metadata. Each venue keeps its own book and trade flow.
- **No instrument substitution:** If a venue has no active GOLD/XAU perpetual, it is marked unavailable. Tokenized-gold spot products such as XAUT are not treated as XAUUSD or gold futures.
- **Honest data status:** Legacy dashboard metrics remain explicitly illustrative. Only the new connected-feed panel displays provider data.
- **No fabricated probabilities:** CVD is accumulated from trades received after this browser connects; it is not represented as a complete session history.

## Session model (IST)

- Build the daily Volume Profile from **05:30 to 09:30 IST**.
- Freeze the profile at **09:30 IST**.
- Monitor setups from **09:30 to 15:00 IST**.
- Do not generate new entries after **15:00 IST**.

## Phase 1: Live data foundation

- Gold API XAU/USD indicative reference, refreshed every 15 seconds.
- Hyperliquid market discovery via public metadata, then WebSocket L2 book and trade subscriptions.
- Lighter market discovery via public REST metadata, then up to 250 resting orders per side and the latest 100 trades every 5 seconds when a matching active perpetual exists.
- Independent venue books, top-of-book spread and top-10-level size imbalance.
- Hyperliquid CVD accumulated from new trade prints after connection; Lighter CVD seeded from its initial recent-trade snapshot, then updated with unseen trades.
- Automatic Hyperliquid reconnect, source timestamps, provider status and explicit unavailable states.

## Important data limitations

- Public exchange perpetual order books are venue-specific derivatives data, not the global OTC XAUUSD book.
- Gold API's XAU price is an indicative spot reference, not an executable broker quote and not a substitute for a licensed institutional feed.
- Lighter REST snapshots can be cached by its edge. They are not equivalent to a guaranteed low-latency WebSocket feed. Its visible depth is capped at the requested 250 resting orders per side, and its CVD starts with the latest 100-trade snapshot rather than a full session history.
- CVD starts at zero when the browser connects. It does not reconstruct trades missed before connection.
- The legacy volume profile, zones, order-flow cards and structure panel contain illustrative sample values until their underlying calculations are connected to validated data.
- No automatic trading is enabled.

## Development status

**Phase 1 implementation:** public spot reference and exchange-feed adapters in the browser. Further validation is required for instrument availability, cross-origin access, exchange-side rate limits and observed feed continuity before relying on the data.

## Data and risk notice

This is an analytical prototype, not an execution platform or investment recommendation. Public data can be delayed, incomplete, cached or unavailable. Never trade from illustrative values or an unvalidated feed.
