/**
 * Full layered config stack.
 *
 * Combine JSON files with in-memory defaults and environment variables.
 * The last provider that has a value wins:
 *   env > config.json > in-memory defaults
 *
 *   cd packages/@spirex.config-provider-json && node examples/layered-stack.mjs
 */

import { configBuilder } from "@spirex/config";
import { InMemoryConfigProvider } from "@spirex/config/in-memory";
import { EnvConfigProvider } from "@spirex/config-provider-env";
import { JsonConfigProvider } from "../src/index.js";

const config = configBuilder()
    // 1) Hard-coded defaults (lowest priority)
    .add(
        new InMemoryConfigProvider({
            db: { host: "localhost", port: "5432" },
            app: { name: "myapp", debug: "false" },
        }),
    )
    // 2) JSON file overrides (middle priority)
    .add(new JsonConfigProvider("./config.json", { noThrow: true }))
    // 3) Environment variables (highest priority)
    .add(new EnvConfigProvider("APP_", true))
    .build();

const host = config.getString("db:host");
const port = config.getInteger("db:port");
const name = config.getString("app:name");
const debug = config.getBoolean("app:debug", false);

console.log({ host, port, name, debug });
console.log("\nPriority: env > config.json > in-memory defaults");
console.log(
    "Try: APP_DB__HOST=prod.example.com node examples/layered-stack.mjs",
);
