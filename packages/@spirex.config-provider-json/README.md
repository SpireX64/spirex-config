# @spirex/config-provider-json

> JSON file provider for @spirex/config — read config from `.json` files with auto-flattening, key filtering, and live-reload on change.

[![npm version](https://badge.fury.io/js/@spirex%2Fconfig-provider-json.svg)](https://www.npmjs.com/package/@spirex/config-provider-json)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue.svg)](https://www.typescriptlang.org/)

`@spirex/config-provider-json` is a configuration provider for [`@spirex/config`](https://www.npmjs.com/package/@spirex/config) that reads key-value pairs from JSON files. Nested objects are automatically flattened with `:` separators — so `{"db": {"host": "localhost"}}` becomes the familiar `db:host` key. Supports whitelist/blacklist filtering, optional files, and `fs.watch`–based hot reload.

## Why use @spirex/config-provider-json?

- **Zero-config flattening** — drop any JSON file in and nested keys become `:`-separated paths.
- **Flat-key priority** — explicit `"db:host": "x"` overrides `{"db": {"host": "y"}}`; the most explicit form wins.
- **Key filtering** — include or exclude sections with prefix-based whitelists and blacklists.
- **Hot reload** — watch files for changes and pick up new values without restarting.
- **Optional files** — `noThrow: true` silently skips missing config files; perfect for local overrides.
- **First-class TypeScript support** — full type declarations included.
- **Zero runtime dependencies** (besides `@spirex/config` itself).

## Installation

```bash
# npm
npm install @spirex/config-provider-json

# yarn
yarn add @spirex/config-provider-json

# pnpm
pnpm add @spirex/config-provider-json
```

## Quick start

```ts
import { configBuilder } from "@spirex/config";
import { JsonConfigProvider } from "@spirex/config-provider-json";

const config = configBuilder()
  .add(new JsonConfigProvider("./config.defaults.json"))
  .add(new JsonConfigProvider("./config.local.json", { noThrow: true }))
  .build();

const host = config.getString("db:host");
const port = config.getInteger("db:port");
```

## Cookbook

Runnable examples are in the [`examples/`](./examples/) folder. Run them from the package root:

```bash
cd packages/@spirex.config-provider-json
node examples/<name>.mjs
```

### Read app metadata from `package.json`

[`examples/from-package-json.mjs`](./examples/from-package-json.mjs) — load the project's own `package.json` and read `name`, `version`, `private`, and the nested `repository:url` through the typed config API.

```ts
import { configBuilder } from "@spirex/config";
import { JsonConfigProvider } from "@spirex/config-provider-json";

const config = configBuilder()
  .add(new JsonConfigProvider("./package.json"))
  .build();

config.getString("name");           // "@spirex/config-provider-json"
config.getString("version");        // "1.0.0"
config.getBoolean("private", false);
config.getString("repository:url"); // nested key, auto-flattened
```

### Layer defaults with local overrides

[`examples/layered-defaults.mjs`](./examples/layered-defaults.mjs) — stack a checked-in defaults file with an optional local override. Providers added later win.

### Filter sections with whitelist / blacklist

[`examples/key-filters.mjs`](./examples/key-filters.mjs) — demonstrate prefix-based inclusion, exclusion, and combined filtering. Blacklist takes priority when both are set.

### Watch for live changes

[`examples/watch-file.mjs`](./examples/watch-file.mjs) — long-running demo that watches `config.json` via `fs.watch` and prints values as they change. Press `Ctrl+C` to clean up.

### Integrate with layered config

[`examples/layered-stack.mjs`](./examples/layered-stack.mjs) — combine JSON with in-memory defaults and environment variables. The last provider that has a value wins: `env > config.json > in-memory`.

## How it works

### JSON flattening

Nested objects are recursively flattened using `:` as the section separator so they integrate naturally with `@spirex/config`'s scoped section API:

```json
{
  "db": {
    "host": "localhost",
    "port": 5432
  },
  "app": { "name": "MyApp" }
}
```

| Config key | Value |
|---|---|
| `db:host` | `"localhost"` |
| `db:port` | `"5432"` |
| `app:name` | `"MyApp"` |

All values are stored as strings — numbers, booleans, and arrays are converted via `String()` during load. The core `@spirex/config` typed getters (`getInteger`, `getBoolean`, etc.) handle parsing back to the desired type. `null` and empty values are skipped.

### Flat keys take priority

A file can mix hierarchical and flat representations. When the same key appears in both forms, the flat (explicit) form wins:

```json
{
  "db": { "host": "nested", "port": 5432 },
  "db:host": "explicit"
}
```

| Key | Value | Reason |
|---|---|---|
| `db:host` | `"explicit"` | Flat key overrides nested |
| `db:port` | `"5432"` | Only in nested form |

### Top-level arrays and primitives

If the JSON file is a top-level array (`[1, 2, 3]`) or a primitive (`42`, `"hello"`), no keys are produced and the cache stays empty. Only objects are flattened.

## API reference

### `new JsonConfigProvider(filePath, options?)`

Creates a new provider bound to a JSON file.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `filePath` | `string` | *(required)* | Path to the JSON file. Relative paths are resolved against `process.cwd()`. |
| `options.whitelist` | `string[]` | — | Only include config keys starting with one of these prefixes. |
| `options.blacklist` | `string[]` | — | Exclude config keys starting with one of these prefixes. |
| `options.watch` | `boolean` | `false` | Watch the file for changes via `fs.watch` and auto-reload. |
| `options.noThrow` | `boolean` | `false` | When `true`, a missing file is silently ignored instead of throwing. |

### Methods

| Method | Returns | Description |
|---|---|---|
| `get(key)` | `string \| undefined` | Returns the value for `key`, or `undefined` if not found or before `load()`. |
| `load()` | `void` | Reads and parses the JSON file. Throws if the file is missing (unless `noThrow: true`) or contains invalid JSON. |
| `unwatch()` | `void` | Stops the file watcher if one is active. Safe to call multiple times or when no watcher exists. |

## License

`@spirex/config-provider-json` is released under the [MIT License](https://opensource.org/licenses/MIT).

