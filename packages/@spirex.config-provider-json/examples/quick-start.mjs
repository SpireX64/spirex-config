/**
 * Quick start — minimal layered config from JSON files.
 *
 * Run from this package root or with --cwd:
 *   cd packages/@spirex.config-provider-json && node examples/quick-start.mjs
 */

import { configBuilder } from "@spirex/config";
import { JsonConfigProvider } from "../src/index.js";

const config = configBuilder()
    .add(new JsonConfigProvider("./config.defaults.json"))
    .add(new JsonConfigProvider("./config.local.json", { noThrow: true }))
    .build();

const host = config.getString("db:host");
const port = config.getInteger("db:port");

console.log({ host, port });
