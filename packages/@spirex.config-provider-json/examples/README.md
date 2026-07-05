# Examples

Each example is a standalone ESM script you can run directly with Node.js.

All examples expect to be run from the package root so that local `@spirex/config-provider-json` is resolved as a linked workspace dependency:

```bash
cd packages/@spirex.config-provider-json
node examples/<name>.mjs
```

---

| File | What it shows |
|---|---|
| [`quick-start.mjs`](./quick-start.mjs) | Two JSON providers stacked together with `noThrow` for the optional override. |
| [`from-package-json.mjs`](./from-package-json.mjs) | Read project metadata from `package.json` through the config API. |
| [`layered-defaults.mjs`](./layered-defaults.mjs) | Checked-in defaults + optional local override file. |
| [`key-filters.mjs`](./key-filters.mjs) | Whitelist, blacklist, and combined prefix-based key filtering. |
| [`watch-file.mjs`](./watch-file.mjs) | Hot reload via `fs.watch` — long-running demo that prints live changes. |
| [`layered-stack.mjs`](./layered-stack.mjs) | Full priority stack: in-memory defaults → JSON → environment variables. |
