# Contributing to BUSHO

Thanks for helping. BUSHO is a small, dependency-free static prototype, so contributing is quick.

## Run it

Requires Node.js 18 or newer. There is nothing to install.

```bash
git clone https://github.com/kirtanswamy/BUSHO.git
cd BUSHO
npm start        # or: node server.mjs  -> http://127.0.0.1:4173
```

## Before you open a pull request

```bash
npm run check    # unit tests + smoke checks
```

`npm test` runs the extraction tests in `tests/`. `npm run smoke` starts the server and verifies pages, assets, JavaScript syntax, accessibility basics and that private files are not served.

## Ground rules

1. **Synthetic data only.** Never add real patient or personal information.
2. **Keep a human in control.** AI or rule-based output is a provisional draft; a person confirms it. No diagnosis. No real orders.
3. **No new claims.** Do not claim live AI, integrations or measured impact that do not exist. Describe what the demo actually does.
4. **No build step, no runtime dependencies**, unless the change clearly justifies it and is discussed first.
5. **Accessible by default:** keyboard operable, visible focus, readable contrast, works at 360px wide.
6. **Every visible string is translated.** New text must be added to every language file, and `npm run check` must pass.

## Translations

Hindi, Tamil, Telugu, Bengali and Marathi text was AI-drafted and benefits from native-speaker review. Use the "Translation correction" issue template, or open a pull request that edits the language file directly.

## Commit style

Short, imperative messages with a type prefix, for example `feat: add Marathi sample report`, `fix: align stock meters`, `docs: clarify setup`.
