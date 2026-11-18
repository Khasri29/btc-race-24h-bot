# Slope Rider — BTC 24-hour race bot

A selective trend bot for the make.fun "Race a BTC trading bot live for 24 hours"
competition (`btc-race-24h-20261118-1444`). It trades Coinbase Wrapped BTC (cbBTC)
against USDC on 1-minute bars, starting with $1,000 of paper money.

## Strategy

Most trend rules lose to fees here: a round trip costs about 26 bps, while a typical
one-minute move is under 0.1%. So the bot trades rarely, only when the medium-term
trend is unambiguously up, and lets the winner run.

- **Enter** (flat only): the 60-bar moving average of closes rose more than 0.20%
  over the last 60 bars, and the latest close sits above that average. One full-size
  buy, up to the weight cap.
- **Exit** (holding), whichever hits first: the same 60-bar slope turns negative, a
  trailing stop 1.00% below the highest close since entry, or a hard stop 0.80%
  below the entry fill price. A sell empties the whole position. No take-profit.

All integer arithmetic on the bar closes — no randomness, no wall clock, no network,
no files outside the repo. Two runs on the same data produce the same orders.

## Run it locally

From the competition kit:

```sh
node cli/makefun.mjs grade-local --kit . --bot /path/to/btc-race-24h-bot --driver process
```

## Files

- `main.ts` — the bot (Node 22, run as `node /bot/main.ts`)
- `vendor/makefun-bars.ts` — the kit's bars-replay SDK shim, byte-identical copy

---

Optional: earn referral rewards, a second way to make money —
[make.fun](https://make.fun/r/har75mqa)
