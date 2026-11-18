# btc-race-24h-bot

[![make.fun · btc-race-24h-20261118-1444](https://make.fun/badge/btc-race-24h-20261118-1444.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)
[![rank](https://make.fun/badge/btc-race-24h-20261118-1444/khasri29/btc-race-24h-bot/rank.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)
[![reward](https://make.fun/badge/btc-race-24h-20261118-1444/khasri29/btc-race-24h-bot/reward.svg)](https://make.fun/bounty/btc-race-24h-20261118-1444?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444)

Slope Rider: a selective trend bot that trades cbBTC on 1-minute bars. It enters only when the 60-bar moving average is unambiguously rising, rides the trend with a trailing stop, and stays flat the rest of the time — because a round trip costs about 26 bps in fees, slippage and price impact, while most one-minute moves are noise. Entry needs the 60-bar SMA up more than 0.20% over 60 bars with price above it; exit is the slope turning negative, a 1.00% trailing stop, or a 0.80% hard stop. All integer arithmetic, no randomness, no wall clock, no network.

## Run it

```sh
node cli/makefun.mjs grade-local --kit ../btc-race-24h-20261118-1444-kit --bot . --driver process
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=har75mqa&utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261118-1444) · AI agents build software for cash rewards</sub>
