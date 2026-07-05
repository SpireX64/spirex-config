# @spirex/config-provider-env

[![npm version](https://badge.fury.io/js/@spirex%2Fconfig-provider-env.svg)](https://www.npmjs.com/package/@spirex/config-provider-env)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue.svg)](https://www.typescriptlang.org/)

`@spirex/config-provider-env` bridges `process.env` with the `@spirex/config` provider interface. It reads environment variables, maps `__` (double underscore) to `:` section separators, optionally filters by a prefix, and integrates cleanly into a layered configuration stack.

> **Note:** This package is an extension. You need [`@spirex/config`](https://www.npmjs.com/package/@spirex/config) to use it.

## Why use this provider?

- **Seamless `process.env` integration** — turn environment variables into typed configuration values.
- **Prefix filtering** — scope env vars to your app, e.g. `APP_`.
- **Optional prefix stripping** — remove the prefix so config keys stay clean.
- **Automatic section mapping** — `APP_DB__HOST` becomes `db:host` for use with `config.section("db")`.
- **Case-insensitive lookups** — `config.getString("db:host")` works regardless of env casing.
- **Hot reload support** — call `config.reload()` to re-read `process.env` at runtime.
- **First-class TypeScript support** — full declarations included.
- **Zero runtime dependencies**.

## Installation

This package has a peer dependency on `@spirex/config`, so install both:

```bash
# npm
npm install @spirex/config @spirex/config-provider-env

# yarn
yarn add @spirex/config @spirex/config-provider-env

# pnpm
pnpm add @spirex/config @spirex/config-provider-env
```

## Quick start

```ts
import { configBuilder, InMemoryConfigProvider } from "@spirex/config";
import { EnvConfigProvider } from "@spirex/config-provider-env";

const config = configBuilder()
  // Built-in defaults
  .add(
    new InMemoryConfigProvider({
      "db:host": "localhost",
      "db:port": "5432",
      "features:darkMode": "false",
    }),
  )
  // Environment overrides, e.g. APP_DB__HOST=prod.example.com
  .add(new EnvConfigProvider("APP_", true))
  .build();

const db = config.section("db");
const host = db.getString("host"); // "prod.example.com" from env, or "localhost" default
const port = db.getInteger("port"); // 5432
const darkMode = config.getBoolean("features:darkMode");
```

## Documentation

### `new EnvConfigProvider(prefix?, stripPrefix?)`

Creates a provider that reads from `process.env`.

| Argument | Type | Default | Description |
| --- | --- | --- | --- |
| `prefix` | `string` | — | Optional prefix used to filter environment variables. Only keys starting with this prefix are loaded. |
| `stripPrefix` | `boolean` | `false` | When `true`, the prefix is removed from the resulting configuration key. |

```ts
import { EnvConfigProvider } from "@spirex/config-provider-env";

// Loads every environment variable
const all = new EnvConfigProvider();

// Loads only variables starting with "APP_"
const prefixed = new EnvConfigProvider("APP_");

// Loads "APP_" variables and strips the prefix from keys
const stripped = new EnvConfigProvider("APP_", true);
```

### Section mapping

Double underscores in environment variable names become section separators.

| Environment variable | Config key (after strip) | Access pattern |
| --- | --- | --- |
| `APP_DB__HOST` | `db:host` | `config.section("db").getString("host")` |
| `APP_A__B__C` | `a:b:c` | `config.getString("a:b:c")` or `config.section("a:b").getString("c")` |
| `APP_HOST` | `host` | `config.getString("host")` |

### Case-insensitive lookups

Lookups are performed in lowercase, so the following all return the same value:

```ts
config.getString("db:host");
config.getString("DB:HOST");
config.section("DB").getString("HOST");
```

### Prefix filtering

Use a prefix to avoid accidentally loading unrelated environment variables:

```ts
process.env.APP_HOST = "0.0.0.0";
process.env.PATH = "/usr/bin";

const provider = new EnvConfigProvider("APP_", true);
provider.load();

provider.get("host"); // "0.0.0.0"
provider.get("PATH"); // undefined
provider.get("path"); // undefined
```

### Reloading

`@spirex/config` calls `load()` automatically when you invoke `builder.build()`. To pick up changes later, call `config.reload()`:

```ts
process.env.APP_LOG_LEVEL = "debug";
config.reload();

const level = config.getString("log:level"); // "debug"
```

### Integration with `@spirex/config`

Add the provider to any `configBuilder()` stack. Because later providers override earlier ones, environment variables naturally take precedence over file or in-memory defaults.

```ts
import { configBuilder, InMemoryConfigProvider } from "@spirex/config";
import { EnvConfigProvider } from "@spirex/config-provider-env";

const config = configBuilder()
  .add(new InMemoryConfigProvider({ "server:port": "3000" })) // defaults
  .add(new EnvConfigProvider("APP_", true)) // environment overrides
  .build();

const port = config.getInteger("server:port");
```

### Using multiple environment providers

You can register several `EnvConfigProvider` instances in the same configuration stack — for example, to merge application settings with infrastructure or third-party service variables.

```ts
const config = configBuilder()
  .add(new EnvConfigProvider("APP_", true))
  .add(new EnvConfigProvider("INFRA_", true))
  .build();

// APP_DB__HOST=localhost and INFRA_REGION=us-east-1
config.getString("db:host"); // "localhost"
config.getString("region"); // "us-east-1"
```

Later providers override earlier ones when keys collide, following the standard `@spirex/config` priority rules.

## API reference

| Member | Description |
| --- | --- |
| `new EnvConfigProvider()` | Loads all environment variables. |
| `new EnvConfigProvider(prefix)` | Loads variables filtered by prefix; keeps prefix in keys. |
| `new EnvConfigProvider(prefix, true)` | Loads filtered variables and strips the prefix. |
| `provider.load()` | Reads `process.env` into the internal cache. |
| `provider.get(key)` | Returns the value for a key (case-insensitive). |

## TypeScript

`@spirex/config-provider-env` ships with TypeScript declarations. No extra `@types` package is required.


## License

`@spirex/config-provider-env` is released under the [MIT License](https://opensource.org/licenses/MIT).
