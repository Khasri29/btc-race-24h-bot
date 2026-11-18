// Slope Rider: a selective trend bot for the BTC 24-hour race (agent-fun/bars-replay/v1).
//
// Idea: on one-minute cbBTC bars, most trend rules lose to fees — a round trip costs
// about 26 bps (4 bps fee, 2 bps slippage, ~7-10 bps of price impact each way), while
// a typical one-minute move is under 0.1%. So this bot trades rarely, only when the
// medium-term trend is unambiguously up, and lets the winner run.
//
// Entry (flat only): the 60-bar simple moving average of closes rose more than 0.20%
// over the last 60 bars, and the latest close sits above that average. One full-size
// buy, up to the weight cap.
//
// Exit (holding): the first of three that hits —
//   - the same 60-bar SMA slope turns negative (the trend is gone), or
//   - a trailing stop 1.00% below the highest close since the entry fill, or
//   - a hard stop 0.80% below the entry fill price.
// A sell empties the whole position. No take-profit: a real trend is ridden, not capped.
//
// Everything is integer arithmetic on the bar closes, a pure function of the bars the
// harness sent: no randomness, no wall clock, no network, no files outside the repo.
// Two runs on the same data produce the same orders.

import { runBars, type BarsState, type OrderInput } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';
/** Bars in the moving average. */
const SMA_PERIOD = 60;
/** Bars over which the moving average's slope is measured. */
const SLOPE_WINDOW = 60;
/** Enter when the SMA rose more than this over SLOPE_WINDOW bars, in basis points. */
const SLOPE_ENTRY_BPS = 20n;
/** Trailing stop below the highest close since the entry fill, in basis points. */
const TRAIL_BPS = 100n;
/** Hard stop below the entry fill price, in basis points. */
const STOP_BPS = 80n;
/** Wide open: a fill at the next open rarely moves more than a few dozen bps. */
const MAX_SLIPPAGE_BPS = 10_000;
const BPS = 10_000n;

/** Every close the harness sent, one per batch, in price-scale units. */
const closes: bigint[] = [];
/** Fill price of the open position, and the highest close since it. Null while flat. */
let entryPrice: bigint | null = null;
let peakPrice: bigint | null = null;

/** The simple moving average of the last `period` closes ending at index `end`. */
function smaAt(end: number, period: number): bigint | null {
  if (end < period - 1) return null;
  let sum = 0n;
  for (let k = end - period + 1; k <= end; k++) sum += closes[k];
  return sum / BigInt(period);
}

/** (now - then) / then in basis points, truncated toward zero. */
function slopeBps(now: bigint, then: bigint): bigint {
  return ((now - then) * BPS) / then;
}

await runBars({
  onBatch(state: BarsState, batch): OrderInput[] {
    const close = state.close(SYMBOL);
    if (close === null) return [];
    closes.push(close);
    const i = closes.length - 1;

    // Sync the entry and peak with the fills this batch reports.
    for (const fill of batch.fills) {
      if (fill.symbol !== SYMBOL || fill.status !== 'filled') continue;
      if (fill.side === 'buy') {
        entryPrice = BigInt(fill.price);
        peakPrice = BigInt(fill.price);
      } else {
        entryPrice = null;
        peakPrice = null;
      }
    }

    // Warm-up batches build history but never trade.
    if (state.warmingUp) return [];

    const held = state.positions.get(SYMBOL);
    const smaNow = smaAt(i, SMA_PERIOD);
    const smaThen =
      i - SLOPE_WINDOW >= SMA_PERIOD - 1 ? smaAt(i - SLOPE_WINDOW, SMA_PERIOD) : null;

    if (held === undefined) {
      // Flat: enter only on a confirmed rising medium-term trend.
      if (smaNow === null || smaThen === null || smaThen === 0n) return [];
      if (slopeBps(smaNow, smaThen) <= SLOPE_ENTRY_BPS) return [];
      if (close <= smaNow) return [];
      const room = state.weightRoom(SYMBOL);
      const notional = state.cash < room ? state.cash : room;
      if (notional < BigInt(state.hello.fees.min_notional_quote_units)) return [];
      return [
        {
          side: 'buy',
          symbol: SYMBOL,
          notional_quote_units: notional,
          max_slippage_bps: MAX_SLIPPAGE_BPS,
        },
      ];
    }

    // Holding: exit on trend failure, trailing stop, or hard stop.
    if (entryPrice === null || peakPrice === null) return [];
    if (close > peakPrice) peakPrice = close;
    const trailLine = (peakPrice * (BPS - TRAIL_BPS)) / BPS;
    const stopLine = (entryPrice * (BPS - STOP_BPS)) / BPS;
    const slope =
      smaNow !== null && smaThen !== null && smaThen !== 0n
        ? slopeBps(smaNow, smaThen)
        : null;
    if ((slope !== null && slope < 0n) || close <= trailLine || close <= stopLine) {
      return [
        {
          side: 'sell',
          symbol: SYMBOL,
          qty: held.qty,
          max_slippage_bps: MAX_SLIPPAGE_BPS,
        },
      ];
    }
    return [];
  },
});
