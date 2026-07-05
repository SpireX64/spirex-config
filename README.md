# @spirex/config

> Composable, priority-based configuration with typed access, section scoping, lazy fallbacks, and hot reload.

[![npm version](https://badge.fury.io/js/@spirex%2Fconfig.svg)](https://www.npmjs.com/package/@spirex/config)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-blue.svg)](https://www.typescriptlang.org/)
![Bundle size](https://img.shields.io/badge/bundle-1.2KB%20%7C%200.6KB%20gzip%20-brightgreen)

`@spirex/config` is a lightweight, dependency-free JavaScript/TypeScript configuration library for building layered app settings. Combine multiple configuration providers — defaults, environment variables, file sources, or your own custom implementations — and read values through a clean, typed API. Providers added later override earlier ones, so deployment-specific values naturally take precedence over built-in defaults.

## Why use @spirex/config?

- **First-class TypeScript support** — full type declarations included out of the box.
- **Layered, priority-based config** — stack providers; the last matching value wins.
- **Scoped sections** — group related keys with `:` (colon) separators and nested sections.
- **Lazy fallbacks** — defaults can be plain values or factory functions invoked only when needed.
- **Hot reload** — refresh every provider at runtime with a single `config.reload()` call.
- **Custom providers in seconds** — implement a two-method `IConfigProvider` interface.
- **Tiny footprint** — ~1.2kb (0.6kb gzip), ~0.7kb (0.4kb gzip) in-memory provider. Tree-shakeable.
- **Zero runtime dependencies**.

## Installation

Install with your favorite package manager:

```bash
# npm
npm install @spirex/config

# yarn
yarn add @spirex/config

# pnpm
pnpm add @spirex/config
```

## Quick start

```ts
import { configBuilder } from "@spirex/config";
import { InMemoryConfigProvider } from "@spirex/config/in-memory";

const config = configBuilder()
  .add(
    new InMemoryConfigProvider({
      app: { name: "MyApp" },
      db: { host: "localhost", port: "5432" },
      features: { darkMode: "true" },
    }),
  )
  .build();

const appName = config.getString("app:name");
const darkMode = config.getBoolean("features:darkMode");

// Scoped access automatically prefixes keys with "db:"
const db = config.section("db");
const host = db.getString("host"); // reads "db:host"
const port = db.getInteger("port"); // reads "db:port"

console.log({ appName, darkMode, host, port });
```

## Documentation

### `configBuilder()`

Creates a builder used to register configuration providers.

```ts
import { configBuilder } from "@spirex/config";

const builder = configBuilder();
```

### `builder.add(provider)`

Registers a provider. Multiple providers are queried in order, and **the last provider that has a value wins**.

```ts
import { InMemoryConfigProvider } from "@spirex/config/in-memory";

builder.add(new InMemoryConfigProvider({ host: "fallback" }));
builder.add(new InMemoryConfigProvider({ host: "override" }));
```

### `builder.build()`

Finalizes the builder, returns a ready-to-use `IConfig` instance, and calls `load()` on every registered provider.

```ts
const config = builder.build();
```

### Reading values

The returned config object exposes typed getters. If a key is missing and no default is supplied, an error is thrown.

```ts
config.getString("app:name"); // "MyApp"
config.getInteger("db:port"); // 5432
config.getFloat("metrics:rate"); // 1.5
config.getBoolean("features:darkMode"); // true | false
```

#### Defaults

Provide a fallback value or a lazy factory:

```ts
config.getString("missing", "default value");
config.getInteger("missing", () => expensiveDefaultCalculation());
```

### Sections

Use `section(path)` to scope configuration to a prefix. Nested sections compose automatically.

```ts
const db = config.section("db");
const replica = db.section("replica");

replica.getString("host"); // reads "db:replica:host"
```

You can also map a section to a typed struct:

```ts
const dbConfig = config.section("db").map((db) => ({
  host: db.getString("host"),
  port: db.getInteger("port"),
}));
```

### Reloading configuration

Call `reload()` to re-run `load()` on every provider. This is useful when configuration can change at runtime.

```ts
config.reload();
```

### Built-in provider: `InMemoryConfigProvider`

Stores key-value pairs in memory. Accepts a `Map`, a plain object, an array of `[key, value]` tuples (including deeply nested `Object.entries`–style arrays), or no initial data.

```ts
import { InMemoryConfigProvider } from "@spirex/config/in-memory";

// From a plain object (nested objects are flattened with ":" separator)
const defaults = new InMemoryConfigProvider({
  app: { name: "MyApp" },
  db: { host: "localhost", port: "5432" },
});
// → "app:name" = "MyApp", "db:host" = "localhost", "db:port" = "5432"

// Empty, then populated
const runtime = new InMemoryConfigProvider();
runtime.set("app:name", "UpdatedApp");

// Deeply nested via Object.entries-style arrays
const deep = new InMemoryConfigProvider([
  ["db", [["host", "prod.example.com"], ["port", "5432"]]],
]);
// → "db:host" = "prod.example.com", "db:port" = "5432"

// From a Map
const fromMap = new InMemoryConfigProvider(
  new Map([["app", { name: "MyApp" }]]),
);
```

### Custom providers

Any object implementing `IConfigProvider` can be added to the builder:

```ts
import type { IConfigProvider } from "@spirex/config";

class FileConfigProvider implements IConfigProvider {
  private cache: Map<string, string> = new Map();

  load() {
    // Read file, populate this.cache
  }

  get(key: string): string | undefined {
    return this.cache.get(key);
  }
}

const config = configBuilder()
  .add(new InMemoryConfigProvider({ logLevel: "info" }))
  .add(new FileConfigProvider("config.json"))
  .build();
```

### Using file-based and environment providers

In addition to the built-in `InMemoryConfigProvider`, a set of optional packages provide ready-to-use providers for common configuration sources:

| Package | Source |
|---|---|
| `@spirex/config-provider-env` | Environment variables |
| `@spirex/config-provider-json` | `.json` files |
| `@spirex/config-provider-ini` | `.ini` files |
| `@spirex/config-provider-yaml` | `.yaml` / `.yml` files |

Install what you need and add it to the builder — all providers share the same `IConfigProvider` interface and work together seamlessly:

```ts
import { EnvConfigProvider } from "@spirex/config-provider-env";
import { JsonConfigProvider } from "@spirex/config-provider-json";

const config = configBuilder()
  .add(new InMemoryConfigProvider({ db: { host: "localhost" } }))
  .add(new JsonConfigProvider("./config.json"))
  .add(new EnvConfigProvider("APP_", true))
  .build();
```

## API reference

| Member | Description |
| --- | --- |
| `configBuilder()` | Creates a new `IConfigBuilder`. |
| `builder.add(provider)` | Appends a provider to the stack. |
| `builder.build()` | Builds the final `IConfig` and loads providers. |
| `config.getString(key, def?)` | Returns a string value. |
| `config.getInteger(key, def?)` | Returns an integer value. |
| `config.getFloat(key, def?)` | Returns a float value. |
| `config.getBoolean(key, def?)` | Returns a boolean value. |
| `config.section(path)` | Returns a scoped `IConfigSection`. |
| `config.reload()` | Reloads all providers. |
| `config.providers` | Read-only array of registered providers. |
| `SECTION_CHAR` | The section separator character (`:`). |

## TypeScript

`@spirex/config` is written in JavaScript and ships with type declarations. No extra `@types` package is required.

## License

`@spirex/config` is released under the [MIT License](https://opensource.org/licenses/MIT).
