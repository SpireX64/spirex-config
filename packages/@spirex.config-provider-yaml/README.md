# @spirex/config-provider-yaml

> YAML file provider for @spirex/config — read config from `.yaml`/`.yml` files with auto-flattening, key filtering, and live-reload on change.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue.svg)](https://www.typescriptlang.org/)

`@spirex/config-provider-yaml` is a configuration provider for [`@spirex/config`](https://www.npmjs.com/package/@spirex/config) that reads key-value pairs from YAML files. Nested objects are automatically flattened with `:` separators — so `{ db: { host: localhost } }` becomes the familiar `db:host` key. Supports whitelist/blacklist filtering, optional files, and `fs.watch`–based hot reload.

## Why use @spirex/config-provider-yaml?

- **YAML-native parsing** — uses the [`yaml`](https://www.npmjs.com/package/yaml) package for full YAML 1.2 support, including anchors, aliases, block scalars, and multi-document awareness.
- **Zero-config flattening** — drop any YAML mapping in and nested keys become `:`-separated paths.
- **Flat-key priority** — explicit `"db:host": x` overrides `{ db: { host: y } }`; the most explicit form wins.
- **Key filtering** — include or exclude sections with prefix-based whitelists and blacklists.
- **Hot reload** — watch files for changes and pick up new values without restarting.
- **Optional files** — `noThrow: true` silently skips missing config files; perfect for local overrides.
- **Pure parser** — `parseYaml()` is exported separately for use outside the provider (no file I/O).
- **Human-readable config** — YAML's indentation-based syntax is clean, comment-friendly, and widely used.
- **First-class TypeScript support** — full type declarations included.

## Installation

```bash
# npm
npm install @spirex/config-provider-yaml

# yarn
yarn add @spirex/config-provider-yaml

# pnpm
pnpm add @spirex/config-provider-yaml
```

The [`yaml`](https://www.npmjs.com/package/yaml) package is included as a dependency and installed automatically.

## Quick start

```ts
import { configBuilder } from "@spirex/config";
import { YamlConfigProvider } from "@spirex/config-provider-yaml";

const config = configBuilder()
  .add(new YamlConfigProvider("./config.defaults.yaml"))
  .add(new YamlConfigProvider("./config.local.yaml", { noThrow: true }))
  .build();

const host = config.getString("database:host");
const port = config.getInteger("database:port");
```

## How it works

### YAML flattening

Nested mappings are recursively flattened using `:` as the section separator. This works exactly like the JSON provider:

```yaml
database:
  host: localhost
  port: 5432

app:
  name: MyApp
```

| Config key | Value |
|---|---|
| `database:host` | `"localhost"` |
| `database:port` | `"5432"` |
| `app:name` | `"MyApp"` |

All values are stored as strings — numbers, booleans, and dates are converted via `String()` during load. The core `@spirex/config` typed getters (`getInteger`, `getBoolean`, etc.) handle parsing back to the desired type. `null` / `~` values and empty arrays are skipped.

### Flat keys take priority

A file can mix hierarchical and flat representations. When the same key appears in both forms, the flat (explicit) form wins:

```yaml
db:
  host: nested
  port: 5432
db:host: explicit
```

| Key | Value | Reason |
|---|---|---|
| `db:host` | `"explicit"` | Flat key overrides nested |
| `db:port` | `"5432"` | Only in nested form |

### YAML types

YAML's richer type system is handled as follows:

| YAML type | Example | Stored as |
|---|---|---|
| String | `hello` | `"hello"` |
| Integer | `42` | `"42"` |
| Float | `3.14` | `"3.14"` |
| Boolean | `true` / `false` | `"true"` / `"false"` |
| Date | `2024-01-01` | stringified date |
| `null` / `~` | `~` | **skipped** |
| Array | `[1, 2, 3]` | `"1,2,3"` |
| Empty array | `[]` | **skipped** |
| Block scalar | `\|` or `>` | multi-line string |
| Quoted string | `'hello'` / `"world"` | unquoted string |

> **Note:** The `yaml` package follows the YAML 1.2 spec. Values like `yes`, `no`, `on`, and `off` are **not** booleans in YAML 1.2 — they are kept as literal strings. Duplicate keys throw a `YAMLParseError`.

### Top-level scalars and sequences

If the YAML file is a top-level scalar (`"hello"`, `42`) or sequence (`[1, 2, 3]`), no keys are produced and the cache stays empty. Only YAML mappings are flattened.

## API reference

### `new YamlConfigProvider(filePath, options?)`

Creates a new provider bound to a YAML file.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `filePath` | `string` | *(required)* | Path to the YAML file. Relative paths are resolved against `process.cwd()`. Both `.yaml` and `.yml` extensions work. |
| `options.whitelist` | `string[]` | — | Only include config keys starting with one of these prefixes. |
| `options.blacklist` | `string[]` | — | Exclude config keys starting with one of these prefixes. |
| `options.watch` | `boolean` | `false` | Watch the file for changes via `fs.watch` and auto-reload. |
| `options.noThrow` | `boolean` | `false` | When `true`, a missing file is silently ignored instead of throwing. |

### Methods

| Method | Returns | Description |
|---|---|---|
| `get(key)` | `string \| undefined` | Returns the value for `key`, or `undefined` if not found or before `load()`. |
| `load()` | `void` | Reads and parses the YAML file. Throws if the file is missing (unless `noThrow: true`) or contains invalid YAML. |
| `unwatch()` | `void` | Stops the file watcher if one is active. Safe to call multiple times or when no watcher exists. |

### `parseYaml(text)`

A standalone pure function exported from `@spirex/config-provider-yaml/yaml-reader`. Parses a YAML string into a `Map<string, string>` — no file I/O, no side effects.

```ts
import { parseYaml } from "@spirex/config-provider-yaml/yaml-reader";

const map = parseYaml(`
  database:
    host: localhost
    port: 5432
  app:name: MyApp
`);
// Map { "database:host" → "localhost", "database:port" → "5432", "app:name" → "MyApp" }
```

| Parameter | Type | Description |
|---|---|---|
| `text` | `string` | Raw YAML content as a string. |
| **Returns** | `Map<string, string>` | Parsed key-value pairs. `null` values, empty arrays, and top-level scalars/sequences are omitted. Throws on invalid YAML. |

## Key filtering

Prefix-based whitelists and blacklists control which keys are available. When both are set, the **blacklist takes priority**.

```ts
// Only load database and app sections
new YamlConfigProvider("./config.yaml", { whitelist: ["database", "app"] })

// Exclude sensitive database keys
new YamlConfigProvider("./config.yaml", { blacklist: ["database:password"] })

// Combined: include database & app, but exclude database:password
new YamlConfigProvider("./config.yaml", {
  whitelist: ["database", "app"],
  blacklist: ["database:password"],
})
```

## Layered configuration

Stack multiple providers for default + override patterns. Providers added later win:

```ts
import { configBuilder } from "@spirex/config";
import { YamlConfigProvider } from "@spirex/config-provider-yaml";
import { EnvConfigProvider } from "@spirex/config-provider-env";

const config = configBuilder()
  .add(new YamlConfigProvider("./config.defaults.yaml"))
  .add(new YamlConfigProvider("./config.local.yaml", { noThrow: true }))
  .add(new EnvConfigProvider("APP_", true))
  .build();

// Priority: env > config.local.yaml > config.defaults.yaml
const host = config.getString("database:host");
```

## Watch mode

When `watch: true`, the provider monitors the YAML file for changes using `fs.watch` and automatically reloads with a 100ms debounce. Call `unwatch()` to stop watching.

```ts
const provider = new YamlConfigProvider("./config.yaml", { watch: true });
provider.load();

// File is now watched — changes are picked up automatically

// Later, when you want to stop:
provider.unwatch();
```

## License

`@spirex/config-provider-yaml` is released under the [MIT License](https://opensource.org/licenses/MIT).
