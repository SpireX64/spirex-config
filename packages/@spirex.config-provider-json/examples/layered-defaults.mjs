/**
 * Layer defaults with local overrides.
 *
 * A checked-in defaults file provides baseline values. An optional
 * local override file (e.g. in .gitignore) overrides them when present.
 *
 *   cd packages/@spirex.config-provider-json && node examples/layered-defaults.mjs
 */

import { configBuilder } from "@spirex/config";
import { JsonConfigProvider } from "../src/index.js";

const config = configBuilder()
    .add(new JsonConfigProvider("./config.defaults.json"))
    .add(new JsonConfigProvider("./config.local.json", { noThrow: true }))
    .build();

const host = config.getString("db:host");
const port = config.getInteger("db:port");
const logLevel = config.getString("log:level", "info");

console.log({ host, port, logLevel });

// With config.local.json = {}
//   → db:host resolves from defaults ("localhost")
//
// With config.local.json = { "db": { "host": "prod.example.com" } }
//   → db:host resolves from local override ("prod.example.com")
