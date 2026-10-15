# BUSHO — Automated Extraction Logic Tests

These tests exercise the actual `makeExtraction()` function extracted from `app-v2.js` in a small Node.js VM context with UI side effects stubbed. They cover the current mock/rule-based extraction contract; they do **not** validate clinical accuracy or prove production readiness.

## Run

Requires Node.js 18 or newer. From the repository root:

```sh
node --test tests/extraction.test.cjs
```

## Coverage

- Routine report numeric parsing for fever, diarrhea and ORS.
- Ambiguous report review flags.
- Empty report rejection.
- Extraction remains provisional and does not auto-confirm.

## Scope and limitations

The test uses the same `makeExtraction()` function source as the browser app. UI functions are stubbed, so browser rendering, localStorage, the deployed Vercel build, inventory UI, and administrator approval interactions are not tested here. The extraction itself is mock/rule-based and must not be treated as clinical inference.
