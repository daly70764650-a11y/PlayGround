# PlayGround

<!-- omgithub:readme:start -->
## 🚀 Build, play, and remix with OMGithub

**Created using [OMGithub.com](https://go.ondev.store/).**

[![OMGithub](https://img.shields.io/badge/OMGithub-Open%20project-orange?style=for-the-badge)](https://go.ondev.store/daly70764650-a11y/PlayGround)
[![GitHub](https://img.shields.io/badge/GitHub-Source-181717?logo=github&style=for-the-badge)](https://github.com/daly70764650-a11y/PlayGround)

- 🎮 [Open the project](https://go.ondev.store/daly70764650-a11y/PlayGround).
- ✨ [Remix this project](https://go.ondev.store/daly70764650-a11y/PlayGround?remix=1).
- 💻 [Explore the source](https://github.com/daly70764650-a11y/PlayGround).
- 🛠️ [Check build runs](https://github.com/daly70764650-a11y/PlayGround/actions).
- 🐛 [Report an issue](https://github.com/daly70764650-a11y/PlayGround/issues).
- 👤 [Explore the creator's projects](https://go.ondev.store/daly70764650-a11y).
- 🌍 [Create with OMGithub](https://go.ondev.store/).
<!-- omgithub:readme:end -->

## Run locally

Requires Node.js 18 or newer (the server uses the built-in `fetch` API). From the project directory:

```sh
node server.js
```

Then open [http://localhost:3002](http://localhost:3002). Set `PORT` to use another port, for example `PORT=8080 node server.js`. The server hosts the game, proxies the optional benchmark quote and keeps online rooms in memory.

## Game modes and audio

- **Solo vs AI** offers three AI difficulty levels.
- **Pass & play** lets two people take turns on one device.
- **Online room** lets a host create a room and share its six-character code with one opponent. Both players need to reach the same server. Rooms are in-memory and are lost when the Node process restarts; this is a lightweight demo, not durable matchmaking.
- The header controls independently toggle sound effects, a generated background tone sequence, and optional browser speech commentary. Browser support and available voices vary; speech requires a browser with the Web Speech API.

## Market benchmark and game prices

In-game commodity prices are fictional, simulated A$ millions and are never derived from the external quote. The optional iron-ore benchmark uses Yahoo Finance's unofficial `TIO=F` chart endpoint. Yahoo may delay, change, or block the endpoint; the interface identifies the source and quote time and labels stale data, or reports the benchmark unavailable rather than presenting it as live. The benchmark is informational only and does not change gameplay prices.

## Simplified tax ledger

At each quarter settlement, the game charges 25% of positive quarterly cashflow. It adds capital investment back when calculating that flow; negative or zero quarterly flows incur no tax. This is a deliberately simplified game mechanic, not Australian tax law, tax advice, or a representation of actual business tax treatment.
