# @spirex/config-provider-ini

> INI file provider for @spirex/config — read config from `.ini` files with section-to-path mapping, key filtering, and live-reload on change.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue.svg)](https://www.typescriptlang.org/)

`@spirex/config-provider-ini` is a configuration provider for [`@spirex/config`](https://www.npmjs.com/package/@spirex/config) that reads key-value pairs from INI files. Sections become `:`-separated key prefixes — `[Database]\nhost=localhost` becomes the familiar `Database:host` key. Supports `#` comments, `\#` escaping, optional files, whitelist/blacklist filtering, and `fs.watch`–based hot reload.

## Why use @spirex/config-provider-ini?

- **Standard INI format** — section headers, `key=value` pairs, `#` comments, and flexible whitespace.
- **Path-style keys** — inline `:` in keys (`Features:Secure=yes`) combine with section prefixes
- **No section required** — flat `.properties`-style files work without `[headers]`.
- **Key filtering** — include or exclude sections with prefix-based whitelists and blacklists.
- **Hot reload** — watch files for changes and pick up new values without restarting.
- **Optional files** — `noThrow: true` silently skips missing config files; perfect for local overrides.
- **Pure parser** — `parseIni()` is exported separately for use outside the provider (no file I/O).
- **First-class TypeScript support** — full type declarations included.
- **Zero runtime dependencies** (besides `@spirex/config` itself).

## Installation

```bash
# npm
npm install @spirex/config-provider-ini

# yarn
yarn add @spirex/config-provider-ini

# pnpm
pnpm add @spirex/config-provider-ini
```

## Quick start

```ts
import { configBuilder } from "@spirex/config";
import { IniConfigProvider } from "@spirex/config-provider-ini";

const config = configBuilder()
  .add(new IniConfigProvider("./config.defaults.ini"))
  .add(new IniConfigProvider("./config.local.ini", { noThrow: true }))
  .build();

const host = config.getString("Database:host");
const port = config.getInteger("Database:port");
```

## How it works

### INI parsing

INI files use `[Section]` headers to group related keys. Sections are mapped to `:`-separated key prefixes:

```ini
[Database]
host = localhost
port = 5432

[App]
name = MyApp
```

| Config key | Value |
|---|---|
| `Database:host` | `"localhost"` |
| `Database:port` | `"5432"` |
| `App:name` | `"MyApp"` |

### Flat property mode (no section)

Section headers are optional. A file without `[sections]` works as a simple `.properties` file:

```ini
keyA = valueA
keyB = valueB
```

| Config key | Value |
|---|---|
| `keyA` | `"valueA"` |
| `keyB` | `"valueB"` |

### Inline path separators

Keys can contain `:` to express nested paths directly. When combined with a section prefix, they form multi-level paths:

```ini
[App]
Features:Secure = true
Logging:Level   = debug
```

| Config key | Value |
|---|---|
| `App:Features:Secure` | `"true"` |
| `App:Logging:Level` | `"debug"` |

### Comments

`#` starts a comment. Full-line comments and inline comments are supported:

```ini
# This is a full-line comment
host = localhost   # inline comment after a value
```

To include a literal `#` in a value, escape it with `\`:

```ini
password = foo\#bar   # stored as "foo#bar"
```

### Whitespace

Whitespace around `=` is flexible. Trailing whitespace on values is trimmed:

```ini
key   =   value
other = hello   # trailing spaces are stripped
```

### Empty and invalid lines

- Empty values (`key =` or `key = # comment`) are skipped — they don't appear in the config.
- Lines without a key (`= value`) are skipped.
- Lines without `=` are skipped.
- Whitespace-only lines are skipped.
- Malformed section headers (`[Section` without `]`, or junk after `]`) are skipped.

### Duplicate keys

When the same key appears more than once, the **last value wins**.

## API reference

### `new IniConfigProvider(filePath, options?)`

Creates a new provider bound to an INI file.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `filePath` | `string` | *(required)* | Path to the INI file. Relative paths are resolved against `process.cwd()`. |
| `options.whitelist` | `string[]` | — | Only include config keys starting with one of these prefixes. |
| `options.blacklist` | `string[]` | — | Exclude config keys starting with one of these prefixes. |
| `options.watch` | `boolean` | `false` | Watch the file for changes via `fs.watch` and auto-reload. |
| `options.noThrow` | `boolean` | `false` | When `true`, a missing file is silently ignored instead of throwing. |

### Methods

| Method | Returns | Description |
|---|---|---|
| `get(key)` | `string \| undefined` | Returns the value for `key`, or `undefined` if not found or before `load()`. |
| `load()` | `void` | Reads and parses the INI file. Throws if the file is missing (unless `noThrow: true`). |
| `unwatch()` | `void` | Stops the file watcher if one is active. Safe to call multiple times or when no watcher exists. |

### `parseIni(text)`

A standalone pure function exported from `@spirex/config-provider-ini/ini-reader`. Parses an INI string into a `Map<string, string>` — no file I/O, no side effects.

```ts
import { parseIni } from "@spirex/config-provider-ini/ini-reader";

const map = parseIni("[Database]\nhost = localhost\nport = 5432");
// Map { "Database:host" → "localhost", "Database:port" → "5432" }
```

| Parameter | Type | Description |
|---|---|---|
| `text` | `string` | Raw INI content as a string. |
| **Returns** | `Map<string, string>` | Parsed key-value pairs. Empty values and malformed lines are omitted. |

## Key filtering

Prefix-based whitelists and blacklists control which keys are available. When both are set, the **blacklist takes priority**.

```ts
// Only load Database and App sections
new IniConfigProvider("./config.ini", { whitelist: ["Database", "App"] })

// Exclude sensitive Database keys
new IniConfigProvider("./config.ini", { blacklist: ["Database:password"] })

// Combined: include Database & App, but exclude Database:password
new IniConfigProvider("./config.ini", {
  whitelist: ["Database", "App"],
  blacklist: ["Database:password"],
})
```

## Layered configuration

Stack multiple providers for default + override patterns. Providers added later win:

```ts
import { configBuilder } from "@spirex/config";
import { IniConfigProvider } from "@spirex/config-provider-ini";
import { EnvConfigProvider } from "@spirex/config-provider-env";

const config = configBuilder()
  .add(new IniConfigProvider("./config.defaults.ini"))
  .add(new IniConfigProvider("./config.local.ini", { noThrow: true }))
  .add(new EnvConfigProvider("APP_", true))
  .build();

// Priority: env > config.local.ini > config.defaults.ini
const host = config.getString("Database:host");
```

## Watch mode

When `watch: true`, the provider monitors the INI file for changes using `fs.watch` and automatically reloads with a 100ms debounce. Call `unwatch()` to stop watching.

```ts
const provider = new IniConfigProvider("./config.ini", { watch: true });
provider.load();

// File is now watched — changes are picked up automatically

// Later, when you want to stop:
provider.unwatch();
```

## License

`@spirex/config-provider-ini` is released under the [MIT License](https://opensource.org/licenses/MIT).
