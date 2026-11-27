# Gold Intelligence

A market-intelligence dashboard for XAUUSD traders, using COMEX Gold Futures (GC) as the primary centralized market-data reference.

## Product principles

- **Execution market:** XAUUSD (spot gold).
- **Market intelligence reference:** COMEX Gold Futures standard contract (GC).
- **Basis-aware levels:** COMEX prices must never be copied directly to XAUUSD. A future licensed data adapter will calculate and maintain the live GC-to-XAUUSD basis.
- **Honest data status:** The initial app uses clearly labelled illustrative/demo data. No screen or signal should imply a live feed is connected until a licensed real-time market-data source is configured.
- **No fabricated probabilities:** Directional assessments must be supported by observable evidence and eventually calibrated against historical replay data.

## Initial session model (IST)

- Build the daily COMEX volume profile from **05:30 to 09:30 IST**.
- Freeze the profile at **09:30 IST** for the rest of the session.
- Monitor setups from **09:30 to 15:00 IST**.
- Do not generate new entries after **15:00 IST**.

## Planned modules

1. XAUUSD market overview and session clock.
2. COMEX GC feed adapter boundary and data-health status.
3. Frozen Volume Profile: POC, VAH, VAL, HVN and LVN.
4. Qualified support/resistance zones, with automatic and manual editing.
5. Order-flow monitor: delta, CVD, footprint, DOM, liquidity changes and absorption.
6. Evidence-led buyer/seller assessment, including a clear **NO TRADE** state.
7. Historical replay and backtesting before any empirical performance claims.

## Zone qualification

An automatically detected HVN/LVN is not sufficient by itself. A candidate zone should also show at least two meaningful historical support/resistance reactions. Keep the components visible rather than hiding them inside one opaque rectangle:

- Candle-body cluster: core acceptance region.
- Wick extremes: rejection boundaries.
- Volume cluster: participation confirmation.
- Historical reactions: qualification evidence.

Detailed monitoring begins when price enters the outer wick boundary. The body region is the core area for studying acceptance or rejection.

## Development status

**Stage 1: Dashboard foundation.** The current interface is a front-end prototype with simulated data. Market-data integration, order-flow calculations and signal validation are not yet connected.

## Data and risk notice

This project is an analytical tool prototype, not an execution platform or investment recommendation. Market data may be delayed, simulated, incomplete or unavailable until the appropriate provider and exchange permissions are configured. Never trade from illustrative values.
